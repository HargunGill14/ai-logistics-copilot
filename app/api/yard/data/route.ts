import { NextRequest, NextResponse } from 'next/server'
import { createClient as createServerClient } from '@/lib/supabase/server'
import { createClient } from '@supabase/supabase-js'

function createServiceClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!url || !key) throw new Error('Supabase env vars missing')
  return createClient(url, key, { auth: { persistSession: false } })
}

async function authenticateYardManager() {
  const supabase = await createServerClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { user: null, profile: null }

  const admin = createServiceClient()
  const { data: profile } = await admin
    .from('profiles')
    .select('role, organization_id')
    .eq('id', user.id)
    .single()

  return { user, profile, admin }
}

export async function GET(request: NextRequest) {
  try {
    const { user, profile, admin } = await authenticateYardManager()

    if (!user) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })
    }
    if (!profile || profile.role !== 'yard') {
      return NextResponse.json({ error: 'Yard manager access required' }, { status: 403 })
    }

    const date = request.nextUrl.searchParams.get('date') ?? new Date().toISOString().slice(0, 10)
    const dayStart = `${date}T00:00:00Z`
    const dayEnd = `${date}T23:59:59Z`

    const { data: appointments, error: apptErr } = await admin!
      .from('dock_appointments')
      .select('*')
      .gte('scheduled_time', dayStart)
      .lte('scheduled_time', dayEnd)
      .order('scheduled_time', { ascending: true })

    const { data: loads, error: loadsErr } = await admin!
      .from('loads')
      .select('*')
      .in('status', ['active', 'negotiating', 'pricing'])
      .order('created_at', { ascending: false })

    if (loadsErr) {
      return NextResponse.json({ error: loadsErr.message }, { status: 500 })
    }

    return NextResponse.json({
      appointments: (apptErr && apptErr.code === '42P01') ? [] : (appointments ?? []),
      loads: loads ?? [],
      organization_id: profile.organization_id,
    })
  } catch {
    return NextResponse.json({ error: 'Failed to load yard data' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const { user, profile, admin } = await authenticateYardManager()

    if (!user) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })
    }
    if (!profile || profile.role !== 'yard') {
      return NextResponse.json({ error: 'Yard manager access required' }, { status: 403 })
    }

    const body = await request.json()
    const { dock_number, truck_id, carrier_name, type, scheduled_time, load_id } = body

    if (!dock_number || !truck_id || !carrier_name || !type || !scheduled_time) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    const { data, error: insertError } = await admin!
      .from('dock_appointments')
      .insert({
        organization_id: profile.organization_id,
        created_by: user.id,
        dock_number: Number(dock_number),
        truck_id: String(truck_id).trim().slice(0, 50),
        carrier_name: String(carrier_name).trim().slice(0, 255),
        type: String(type),
        scheduled_time: String(scheduled_time),
        status: 'scheduled',
        load_id: load_id || null,
      })
      .select()
      .single()

    if (insertError) {
      return NextResponse.json({ error: insertError.message }, { status: 500 })
    }

    return NextResponse.json({ appointment: data }, { status: 201 })
  } catch {
    return NextResponse.json({ error: 'Failed to schedule appointment' }, { status: 500 })
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const { user, profile, admin } = await authenticateYardManager()

    if (!user) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })
    }
    if (!profile || profile.role !== 'yard') {
      return NextResponse.json({ error: 'Yard manager access required' }, { status: 403 })
    }

    const body = await request.json()
    const { id, status } = body

    if (!id || !status) {
      return NextResponse.json({ error: 'Missing id or status' }, { status: 400 })
    }

    const validStatuses = ['scheduled', 'checked_in', 'checked_out', 'missed']
    if (!validStatuses.includes(status)) {
      return NextResponse.json({ error: 'Invalid status' }, { status: 400 })
    }

    const { error: updateError } = await admin!
      .from('dock_appointments')
      .update({ status })
      .eq('id', id)

    if (updateError) {
      return NextResponse.json({ error: updateError.message }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch {
    return NextResponse.json({ error: 'Failed to update appointment' }, { status: 500 })
  }
}
