import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
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

    const supabase = await createClient()

    // Check for duplicate
    const { data: existing } = await supabase
      .from('waitlists')
      .select('id')
      .eq('email', sanitized.email)
      .maybeSingle()

    if (existing) {
      return NextResponse.json(
        { error: 'This email is already on the waitlist.' },
        { status: 409 }
      )
    }

    const { error } = await supabase
      .from('waitlists')
      .insert({ ...sanitized, status: 'pending' })

    if (error) {
      return NextResponse.json(
        { error: 'Failed to join waitlist. Please try again.' },
        { status: 500 }
      )
    }

    return NextResponse.json({ success: true }, { status: 201 })
  } catch {
    return NextResponse.json({ error: 'Invalid request.' }, { status: 400 })
  }
}
