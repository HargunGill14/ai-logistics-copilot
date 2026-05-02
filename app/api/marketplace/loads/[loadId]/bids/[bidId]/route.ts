import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { createClient } from '@/lib/supabase/server'

const schema = z.object({
  action: z.enum(['accept', 'reject', 'withdraw']),
})

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ loadId: string; bidId: string }> }
) {
  try {
    const { loadId, bidId } = await params
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('role, organization_id')
      .eq('id', user.id)
      .single()

    if (profileError || !profile) {
      return NextResponse.json({ error: 'Profile not found' }, { status: 403 })
    }

    const body = await request.json()
    const parsed = schema.safeParse(body)

    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Invalid input', details: parsed.error.flatten().fieldErrors },
        { status: 400 }
      )
    }

    const { action } = parsed.data

    if (action === 'withdraw') {
      if (profile.role !== 'carrier') {
        return NextResponse.json({ error: 'Only carriers can withdraw bids' }, { status: 403 })
      }

      const { data: bid, error: bidError } = await supabase
        .from('load_bids')
        .select('id, status, carrier_id')
        .eq('id', bidId)
        .eq('marketplace_load_id', loadId)
        .single()

      if (bidError || !bid) {
        return NextResponse.json({ error: 'Bid not found' }, { status: 404 })
      }

      if (bid.carrier_id !== user.id) {
        return NextResponse.json({ error: 'You can only withdraw your own bids' }, { status: 403 })
      }

      if (bid.status !== 'pending') {
        return NextResponse.json({ error: 'Only pending bids can be withdrawn' }, { status: 409 })
      }

      const { error: updateError } = await supabase
        .from('load_bids')
        .update({ status: 'withdrawn', responded_at: new Date().toISOString() })
        .eq('id', bidId)

      if (updateError) {
        return NextResponse.json({ error: 'Failed to withdraw bid' }, { status: 500 })
      }

      return NextResponse.json({ success: true })
    }

    if (action === 'accept' || action === 'reject') {
      if (profile.role !== 'broker' && profile.role !== 'admin') {
        return NextResponse.json({ error: 'Only brokers can accept or reject bids' }, { status: 403 })
      }

      const { data: load, error: loadError } = await supabase
        .from('marketplace_loads')
        .select('id, status, organization_id')
        .eq('id', loadId)
        .single()

      if (loadError || !load) {
        return NextResponse.json({ error: 'Load not found' }, { status: 404 })
      }

      if (load.organization_id !== profile.organization_id) {
        return NextResponse.json({ error: 'Load does not belong to your organization' }, { status: 403 })
      }

      if (load.status !== 'posted') {
        return NextResponse.json({ error: 'Load is no longer open for bid decisions' }, { status: 409 })
      }

      if (action === 'accept') {
        const { error: rpcError } = await supabase.rpc('accept_bid', {
          p_bid_id: bidId,
          p_load_id: loadId,
        })

        if (rpcError) {
          return NextResponse.json({ error: 'Failed to accept bid' }, { status: 500 })
        }

        return NextResponse.json({ success: true })
      }

      if (action === 'reject') {
        const { data: bid, error: bidError } = await supabase
          .from('load_bids')
          .select('id, status, marketplace_load_id')
          .eq('id', bidId)
          .eq('marketplace_load_id', loadId)
          .single()

        if (bidError || !bid) {
          return NextResponse.json({ error: 'Bid not found' }, { status: 404 })
        }

        if (bid.status !== 'pending') {
          return NextResponse.json({ error: 'Only pending bids can be rejected' }, { status: 409 })
        }

        const { error: updateError } = await supabase
          .from('load_bids')
          .update({ status: 'rejected', responded_at: new Date().toISOString() })
          .eq('id', bidId)

        if (updateError) {
          return NextResponse.json({ error: 'Failed to reject bid' }, { status: 500 })
        }

        return NextResponse.json({ success: true })
      }
    }

    return NextResponse.json({ error: 'Invalid action' }, { status: 400 })
  } catch {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
