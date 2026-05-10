import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { createClient } from '@/lib/supabase/server'
import { canPostLoad } from '@/lib/subscription'

const schema = z.object({
  origin_city: z.string().min(1).max(100),
  origin_state: z.string().length(2),
  destination_city: z.string().min(1).max(100),
  destination_state: z.string().length(2),
  pickup_date: z.string().datetime(),
  delivery_date: z.string().datetime().optional(),
  equipment_type: z.enum(['dry_van', 'reefer', 'flatbed', 'step_deck', 'power_only', 'tanker']),
  weight_lbs: z.number().int().positive().max(80000).optional(),
  commodity: z.string().max(200).optional(),
  target_rate: z.number().positive(),
  max_rate: z.number().positive().optional(),
  bid_deadline: z.string().datetime().optional(),
  auto_award: z.boolean().optional().default(false),
  load_id: z.string().uuid().optional(),
})

export async function POST(request: NextRequest) {
  try {
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

    if (profile.role !== 'broker' && profile.role !== 'admin') {
      return NextResponse.json({ error: 'Only brokers can post loads' }, { status: 403 })
    }

    const allowed = await canPostLoad(user.id)
    if (!allowed) {
      return NextResponse.json(
        {
          error: 'Free plan limit reached. Upgrade to post unlimited loads.',
          upgrade_required: true,
        },
        { status: 403 }
      )
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

    if (new Date(data.pickup_date) <= new Date()) {
      return NextResponse.json({ error: 'pickup_date must be in the future' }, { status: 400 })
    }

    const { data: load, error: insertError } = await supabase
      .from('marketplace_loads')
      .insert({
        load_id: data.load_id ?? null,
        broker_id: user.id,
        organization_id: profile.organization_id,
        origin_city: data.origin_city,
        origin_state: data.origin_state.toUpperCase(),
        destination_city: data.destination_city,
        destination_state: data.destination_state.toUpperCase(),
        pickup_date: data.pickup_date,
        delivery_date: data.delivery_date ?? null,
        equipment_type: data.equipment_type,
        weight_lbs: data.weight_lbs ?? null,
        commodity: data.commodity ?? null,
        target_rate: data.target_rate,
        max_rate: data.max_rate ?? null,
        bid_deadline: data.bid_deadline ?? null,
        auto_award: data.auto_award,
      })
      .select()
      .single()

    if (insertError) {
      return NextResponse.json({ error: 'Failed to post load' }, { status: 500 })
    }

    return NextResponse.json(load, { status: 201 })
  } catch {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
