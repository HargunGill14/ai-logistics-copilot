import { NextRequest, NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase/service'
import {
  fetchFmcsaCarrier,
  computeTrustScore,
  extractRiskFlags,
  computeAuthorityAgeDays,
  deriveVerificationStatus,
} from '@/lib/fmcsa'

export const maxDuration = 60

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

export async function GET(request: NextRequest) {
  const auth = request.headers.get('authorization')
  if (auth !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const supabase = createServiceClient()

  const { data: records, error } = await supabase
    .from('carrier_verifications')
    .select('carrier_id, usdot_number, mc_number')
    .lt('next_verify_at', new Date().toISOString())
    .limit(50)

  if (error) {
    return NextResponse.json({ error: 'Failed to fetch carriers' }, { status: 500 })
  }

  let refreshed = 0

  for (const record of records ?? []) {
    try {
      const query = record.usdot_number ?? (record.mc_number ? `docket/MC-${record.mc_number}` : null)
      if (!query) continue

      const fmcsaRaw = await fetchFmcsaCarrier(query) as Record<string, unknown>
      const trustScore = computeTrustScore(fmcsaRaw)
      const riskFlags = extractRiskFlags(fmcsaRaw)
      const verificationStatus = deriveVerificationStatus(trustScore, riskFlags)
      const authorityAgeDays = computeAuthorityAgeDays(fmcsaRaw.authorityDate as string | undefined)

      await supabase
        .from('carrier_verifications')
        .upsert(
          {
            carrier_id: record.carrier_id,
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

      refreshed++
    } catch {
      // skip individual failures — log in production observability
    }

    await sleep(250)
  }

  return NextResponse.json({ refreshed })
}
