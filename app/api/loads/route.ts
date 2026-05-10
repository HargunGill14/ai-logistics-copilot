import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { createClient } from '@/lib/supabase/server'
import { createServiceClient } from '@/lib/supabase/service'
import { rateLimit } from '@/lib/rateLimit'

const schema = z.object({
  pickup_location: z.string().min(1).max(100),
  delivery_location: z.string().min(1).max(100),
  distance_miles: z.number().positive(),
  load_type: z.enum(['dry_van', 'reefer', 'flatbed', 'step_deck']),
  weight_lbs: z.number().positive(),
  shipper_rate: z.number().positive(),
  notes: z.string().max(500).optional(),
})

export async function POST(req: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    if (!rateLimit(user.id, 30, 60000)) {
      return NextResponse.json({ error: 'Too many requests' }, { status: 429 })
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
        { error: 'Invalid input', details: parsed.error.flatten().fieldErrors },
        { status: 400 }
      )
    }

    const { data: profile } = await supabase
      .from('profiles')
      .select('organization_id')
      .eq('id', user.id)
      .single()

    if (!profile?.organization_id) {
      return NextResponse.json({ error: 'Onboarding incomplete' }, { status: 400 })
    }

    const svc = createServiceClient()
    const { data: load, error: loadError } = await svc
      .from('loads')
      .insert({
        organization_id: profile.organization_id,
        created_by: user.id,
        ...parsed.data,
        status: 'pricing',
      })
      .select('id')
      .single()

    if (loadError || !load) {
      return NextResponse.json({ error: 'Failed to create load' }, { status: 500 })
    }

    return NextResponse.json({ id: load.id })
  } catch {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
