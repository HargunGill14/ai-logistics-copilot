import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { createServiceClient } from '@/lib/supabase/service'
import { rateLimit } from '@/lib/rateLimit'

const schema = z.object({
  token: z.string().length(64),
  lat: z.number().min(-90).max(90),
  lng: z.number().min(-180).max(180),
  speed: z.number().min(0).max(200).optional(),
})

// Haversine distance in miles
function haversineDistance(
  lat1: number, lng1: number,
  lat2: number, lng2: number
): number {
  const R = 3958.8 // Earth radius in miles
  const dLat = ((lat2 - lat1) * Math.PI) / 180
  const dLng = ((lng2 - lng1) * Math.PI) / 180
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLng / 2) *
      Math.sin(dLng / 2)
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
}

const GEOFENCE_RADIUS_MILES = 0.5

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const parsed = schema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.issues[0]?.message ?? 'Invalid input' }, { status: 400 })
    }

    const { token, lat, lng, speed } = parsed.data

    // Rate limit: 30 pings per 5 minutes per token
    const allowed = rateLimit(`ping:${token}`, 30, 5 * 60 * 1000)
    if (!allowed) {
      return NextResponse.json({ error: 'Rate limit exceeded' }, { status: 429 })
    }

    const supabase = createServiceClient()

    const { data: tracking, error: lookupError } = await supabase
      .from('shipment_tracking')
      .select('id, status, origin_lat, origin_lng, destination_lat, destination_lng, yard_lat, yard_lng')
      .eq('tracking_token', token)
      .eq('is_active', true)
      .single()

    if (lookupError || !tracking) {
      return NextResponse.json({ error: 'Invalid or inactive token' }, { status: 404 })
    }

    // Insert location ping
    await supabase.from('location_pings').insert({
      tracking_id: tracking.id,
      lat,
      lng,
      speed_mph: speed ?? null,
    })

    // Determine new status via geofencing
    let newStatus = tracking.status

    const destLat = Number(tracking.destination_lat)
    const destLng = Number(tracking.destination_lng)
    const originLat = Number(tracking.origin_lat)
    const originLng = Number(tracking.origin_lng)

    if (haversineDistance(lat, lng, destLat, destLng) <= GEOFENCE_RADIUS_MILES) {
      newStatus = 'delivered'
    } else if (
      tracking.yard_lat != null &&
      tracking.yard_lng != null &&
      haversineDistance(lat, lng, Number(tracking.yard_lat), Number(tracking.yard_lng)) <= GEOFENCE_RADIUS_MILES
    ) {
      newStatus = 'at_delivery'
    } else if (haversineDistance(lat, lng, originLat, originLng) <= GEOFENCE_RADIUS_MILES) {
      newStatus = 'at_pickup'
    }

    const updatePayload: Record<string, unknown> = {
      current_lat: lat,
      current_lng: lng,
      last_ping_at: new Date().toISOString(),
    }

    if (newStatus !== tracking.status) {
      updatePayload.status = newStatus
    }

    if (newStatus === 'delivered') {
      updatePayload.is_active = false
    }

    await supabase
      .from('shipment_tracking')
      .update(updatePayload)
      .eq('id', tracking.id)

    return NextResponse.json({ ok: true, status: newStatus })
  } catch (error) {
    console.error('Tracking ping error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
