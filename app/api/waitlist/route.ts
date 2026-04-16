import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

function createServiceClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!url || !key) throw new Error('Supabase env vars missing')
  return createClient(url, key, { auth: { persistSession: false } })
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { email, full_name, company_name, role } = body

    if (!email || !full_name || !company_name || !role) {
      return NextResponse.json({ error: 'All fields are required.' }, { status: 400 })
    }

    const sanitized = {
      email: String(email).trim().toLowerCase().slice(0, 255),
      full_name: String(full_name).trim().slice(0, 255),
      company_name: String(company_name).trim().slice(0, 255),
      role: String(role).trim().slice(0, 50),
    }

    const supabase = createServiceClient()

    const { data: existing } = await supabase
      .from('waitlists')
      .select('id')
      .eq('email', sanitized.email)
      .maybeSingle()

    if (existing) {
      return NextResponse.json({ error: 'This email is already on the waitlist.' }, { status: 409 })
    }

    const { error: insertError } = await supabase
      .from('waitlists')
      .insert({ ...sanitized, status: 'pending' })

    if (insertError) {
      if (insertError.code === '23505') {
        return NextResponse.json({ error: 'This email is already on the waitlist.' }, { status: 409 })
      }
      return NextResponse.json({ error: 'Failed to join waitlist. Please try again.' }, { status: 500 })
    }

    return NextResponse.json({ success: true }, { status: 201 })
  } catch {
    return NextResponse.json({ error: 'Something went wrong. Please try again.' }, { status: 500 })
  }
}
