import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { createClient } from '@/lib/supabase/server'
import { createClient as createServiceClient } from '@supabase/supabase-js'
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

function serviceClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!url || !key) throw new Error('Supabase service role env vars missing')
  return createServiceClient(url, key, {
    auth: { autoRefreshToken: false, persistSession: false },
  })
}

export async function POST(req: NextRequest) {
  try {
    const supabase = await createClient()
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single()

    if (!profile || profile.role !== 'carrier') {
      return NextResponse.json(
        { error: 'Only carriers can complete carrier onboarding' },
        { status: 403 }
      )
    }

    let body: unknown
    try {
      body = await req.json()
    } catch {
      return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })
    }

    const parsed = schema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.flatten().formErrors[0] ?? 'Invalid input' },
        { status: 400 }
      )
    }

    const { usdot_number, mc_number } = parsed.data
    const query = usdot_number ?? `docket/MC-${mc_number}`

    let fmcsaRaw: Record<string, unknown>
    try {
      fmcsaRaw = (await fetchFmcsaCarrier(query)) as Record<string, unknown>
    } catch {
      return NextResponse.json(
        { error: 'FMCSA lookup failed. Check your DOT/MC number.' },
        { status: 502 }
      )
    }

    const trustScore = computeTrustScore(fmcsaRaw)
    const riskFlags = extractRiskFlags(fmcsaRaw)
    const verificationStatus = deriveVerificationStatus(trustScore, riskFlags)
    const authorityAgeDays = computeAuthorityAgeDays(
      fmcsaRaw.authorityDate as string | undefined
    )

    const svc = serviceClient()

    const { error: upsertError } = await svc.from('carrier_verifications').upsert(
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

    // Only mark onboarding complete after successful upsert
    const { error: profileError } = await svc
      .from('profiles')
      .update({ onboarding_complete: true })
      .eq('id', user.id)

    if (profileError) {
      return NextResponse.json({ error: profileError.message }, { status: 500 })
    }

    return NextResponse.json({ trust_score: trustScore, risk_flags: riskFlags, verification_status: verificationStatus })
  } catch {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
