import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { createClient } from '@/lib/supabase/server'
import { rateLimit } from '@/lib/rateLimit'
import {
  fetchFmcsaCarrier,
  computeTrustScore,
  extractRiskFlags,
  computeAuthorityAgeDays,
  deriveVerificationStatus,
} from '@/lib/fmcsa'

const schema = z
  .object({
    usdot_number: z.string().regex(/^\d{1,8}$/).optional(),
    mc_number: z.string().regex(/^\d{1,8}$/).optional(),
  })
  .refine((d) => d.usdot_number || d.mc_number, {
    message: 'At least one of usdot_number or mc_number is required',
  })

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // 5 requests per hour
    const allowed = rateLimit(`fmcsa:${user.id}`, 5, 3600000)
    if (!allowed) {
      return NextResponse.json(
        { error: 'Too many verification requests. Try again later.' },
        { status: 429 }
      )
    }

    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single()

    if (!profile || profile.role !== 'carrier') {
      return NextResponse.json({ error: 'Only carriers can verify their credentials' }, { status: 403 })
    }

    const body = await request.json()
    const parsed = schema.safeParse(body)

    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Invalid input', details: parsed.error.flatten().fieldErrors },
        { status: 400 }
      )
    }

    const { usdot_number, mc_number } = parsed.data
    const query = usdot_number ?? `docket/MC-${mc_number}`

    let fmcsaRaw: Record<string, unknown>
    try {
      fmcsaRaw = await fetchFmcsaCarrier(query) as Record<string, unknown>
    } catch {
      return NextResponse.json({ error: 'FMCSA lookup failed. Check your DOT/MC number.' }, { status: 502 })
    }

    const trustScore = computeTrustScore(fmcsaRaw)
    const riskFlags = extractRiskFlags(fmcsaRaw)
    const verificationStatus = deriveVerificationStatus(trustScore, riskFlags)
    const authorityAgeDays = computeAuthorityAgeDays(fmcsaRaw.authorityDate as string | undefined)

    const { error: upsertError } = await supabase
      .from('carrier_verifications')
      .upsert(
        {
          carrier_id: user.id,
          usdot_number: usdot_number ?? null,
          mc_number: mc_number ?? null,
          legal_name: (fmcsaRaw.legalName as string) ?? null,
          operating_status: (fmcsaRaw.operatingStatus as string) ?? null,
          safety_rating: (fmcsaRaw.safetyRating as string) ?? null,
          insurance_on_file: fmcsaRaw.bipdInsuranceOnFile === 'Y',
          cargo_insurance: fmcsaRaw.cargoInsuranceOnFile === 'Y',
          authority_age_days: authorityAgeDays,
          trust_score: trustScore,
          risk_flags: riskFlags,
          verification_status: verificationStatus,
          fmcsa_raw: fmcsaRaw,
          last_verified_at: new Date().toISOString(),
          next_verify_at: new Date(Date.now() + 30 * 24 * 3600 * 1000).toISOString(),
        },
        { onConflict: 'carrier_id' }
      )

    if (upsertError) {
      return NextResponse.json({ error: 'Failed to save verification' }, { status: 500 })
    }

    return NextResponse.json({ trust_score: trustScore, risk_flags: riskFlags, verification_status: verificationStatus })
  } catch {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
