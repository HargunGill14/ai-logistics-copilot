import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import type { TrustBadgeLevel } from '@/types'

function getBadgeLevel(trustScore: number): TrustBadgeLevel {
  if (trustScore >= 70) return 'verified'
  if (trustScore >= 40) return 'caution'
  return 'unverified'
}

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ carrierId: string }> }
) {
  try {
    const { carrierId } = await params
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single()

    if (!profile || (profile.role !== 'broker' && profile.role !== 'admin')) {
      return NextResponse.json({ error: 'Only brokers can view carrier trust scores' }, { status: 403 })
    }

    const { data, error } = await supabase
      .from('carrier_trust_public')
      .select('carrier_id, trust_score, risk_flags, verification_status, legal_name, last_verified_at')
      .eq('carrier_id', carrierId)
      .single()

    if (error || !data) {
      return NextResponse.json({ error: 'Carrier not found' }, { status: 404 })
    }

    return NextResponse.json({
      trust_score: data.trust_score,
      verification_status: data.verification_status,
      risk_flags: data.risk_flags,
      legal_name: data.legal_name,
      last_verified_at: data.last_verified_at,
      badge_level: getBadgeLevel(data.trust_score as number),
    })
  } catch {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
