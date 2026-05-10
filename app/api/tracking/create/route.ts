import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { createClient } from '@/lib/supabase/server'
import { rateLimit } from '@/lib/rateLimit'

const schema = z.object({
  load_id: z.string().uuid(),
  driver_name: z.string().min(2).max(100),
  driver_phone: z.string().regex(/^\+1\d{10}$/, { message: 'Format: +1XXXXXXXXXX' }),
  origin_lat: z.number().min(-90).max(90),
  origin_lng: z.number().min(-180).max(180),
  destination_lat: z.number().min(-90).max(90),
  destination_lng: z.number().min(-180).max(180),
  yard_lat: z.number().min(-90).max(90).optional(),
  yard_lng: z.number().min(-180).max(180).optional(),
})

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    if (!rateLimit(`tracking-create:${user.id}`, 10, 60000)) {
      return NextResponse.json({ error: 'Too many requests' }, { status: 429 })
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

    const body = await request.json()
    const parsed = schema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.issues[0]?.message ?? 'Invalid input' }, { status: 400 })
    }

    const {
      load_id, driver_name, driver_phone,
      origin_lat, origin_lng, destination_lat, destination_lng,
      yard_lat, yard_lng,
    } = parsed.data

    const { data: load, error: loadError } = await supabase
      .from('loads')
      .select('id, organization_id')
      .eq('id', load_id)
      .eq('organization_id', profile.organization_id)
      .single()

    if (loadError || !load) {
      return NextResponse.json({ error: 'Load not found' }, { status: 404 })
    }

    // Deactivate any existing active tracking for this load
    await supabase
      .from('shipment_tracking')
      .update({ is_active: false })
      .eq('load_id', load_id)
      .eq('is_active', true)

    const { data: tracking, error: insertError } = await supabase
      .from('shipment_tracking')
      .insert({
        load_id,
        driver_name,
        driver_phone,
        carrier_id: user.id,
        origin_lat,
        origin_lng,
        destination_lat,
        destination_lng,
        yard_lat: yard_lat ?? null,
        yard_lng: yard_lng ?? null,
      })
      .select('id, tracking_token')
      .single()

    if (insertError || !tracking) {
      console.error('Tracking insert error:', insertError)
      return NextResponse.json({ error: 'Failed to create tracking' }, { status: 500 })
    }

    const tracking_url = `${process.env.NEXT_PUBLIC_APP_URL}/track/${tracking.tracking_token}`

    // Send SMS — never fail the request if this errors
    try {
      const twilio = await import('twilio')
      const client = twilio.default(
        process.env.TWILIO_SID!,
        process.env.TWILIO_TOKEN!
      )
      await client.messages.create({
        body: `FreTraq: You've been assigned a load. Share your location here: ${tracking_url}`,
        from: process.env.TWILIO_PHONE!,
        to: driver_phone,
      })
    } catch (smsError) {
      console.error('SMS send failed (non-fatal):', smsError)
    }

    return NextResponse.json({
      tracking_id: tracking.id,
      tracking_url,
    })
  } catch (error) {
    console.error('Tracking create error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
