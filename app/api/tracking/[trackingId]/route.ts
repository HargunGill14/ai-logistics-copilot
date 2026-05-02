import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ trackingId: string }> }
) {
  try {
    const { trackingId } = await params
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('id, organization_id, role')
      .eq('id', user.id)
      .single()

    if (profileError || !profile) {
      return NextResponse.json({ error: 'Profile not found' }, { status: 403 })
    }

    if (!['broker', 'yard', 'admin'].includes(profile.role)) {
      return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 })
    }

    // Fetch tracking record — RLS ensures org membership
    const { data: tracking, error: trackingError } = await supabase
      .from('shipment_tracking')
      .select('*')
      .eq('id', trackingId)
      .single()

    if (trackingError || !tracking) {
      return NextResponse.json({ error: 'Tracking record not found' }, { status: 404 })
    }

    // Verify load belongs to user's org
    const { data: load, error: loadError } = await supabase
      .from('loads')
      .select('id, organization_id')
      .eq('id', tracking.load_id)
      .eq('organization_id', profile.organization_id)
      .single()

    if (loadError || !load) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 })
    }

    const { data: pings, error: pingsError } = await supabase
      .from('location_pings')
      .select('*')
      .eq('tracking_id', trackingId)
      .order('recorded_at', { ascending: false })
      .limit(20)

    if (pingsError) {
      return NextResponse.json({ error: 'Failed to fetch pings' }, { status: 500 })
    }

    return NextResponse.json({ tracking, pings: pings ?? [] })
  } catch (error) {
    console.error('Tracking fetch error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
