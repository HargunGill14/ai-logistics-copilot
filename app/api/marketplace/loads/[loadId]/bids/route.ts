import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { createClient } from '@/lib/supabase/server'
import { rateLimit } from '@/lib/rateLimit'

const schema = z.object({
  bid_amount: z.number().positive().max(99999),
  estimated_pickup: z.string().datetime().optional(),
  notes: z.string().max(500).optional(),
})

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ loadId: string }> }
) {
  try {
    const { loadId } = await params
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const allowed = rateLimit(`bid:${user.id}`, 10, 60000)
    if (!allowed) {
      return NextResponse.json({ error: 'Too many requests. Please wait a minute.' }, { status: 429 })
    }

    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('role, organization_id')
      .eq('id', user.id)
      .single()

    if (profileError || !profile) {
      return NextResponse.json({ error: 'Profile not found' }, { status: 403 })
    }

    if (profile.role !== 'carrier') {
      return NextResponse.json({ error: 'Only carriers can submit bids' }, { status: 403 })
    }

    const { data: verification } = await supabase
      .from('carrier_verifications')
      .select('trust_score')
      .eq('carrier_id', user.id)
      .single()

    if (!verification || verification.trust_score < 40) {
      return NextResponse.json(
        { error: 'Carrier trust score too low to bid. Minimum score of 40 required.' },
        { status: 403 }
      )
    }

    const { data: load, error: loadError } = await supabase
      .from('marketplace_loads')
      .select('id, status, bid_deadline')
      .eq('id', loadId)
      .single()

    if (loadError || !load) {
      return NextResponse.json({ error: 'Load not found' }, { status: 404 })
    }

    if (load.status !== 'posted') {
      return NextResponse.json({ error: 'Load is no longer accepting bids' }, { status: 409 })
    }

    if (load.bid_deadline && new Date(load.bid_deadline) < new Date()) {
      return NextResponse.json({ error: 'Bid deadline has passed' }, { status: 409 })
    }

    const { data: existingBid } = await supabase
      .from('load_bids')
      .select('id')
      .eq('marketplace_load_id', loadId)
      .eq('carrier_id', user.id)
      .eq('status', 'pending')
      .maybeSingle()

    if (existingBid) {
      return NextResponse.json({ error: 'You already have a pending bid on this load' }, { status: 409 })
    }

    const body = await request.json()
    const parsed = schema.safeParse(body)

    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Invalid input', details: parsed.error.flatten().fieldErrors },
        { status: 400 }
      )
    }

    const data = parsed.data

    const { data: bid, error: insertError } = await supabase
      .from('load_bids')
      .insert({
        marketplace_load_id: loadId,
        carrier_id: user.id,
        carrier_org_id: profile.organization_id,
        bid_amount: data.bid_amount,
        estimated_pickup: data.estimated_pickup ?? null,
        notes: data.notes ?? null,
      })
      .select()
      .single()

    if (insertError) {
      return NextResponse.json({ error: 'Failed to submit bid' }, { status: 500 })
    }

    return NextResponse.json(bid, { status: 201 })
  } catch {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
