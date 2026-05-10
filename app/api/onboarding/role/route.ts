import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createClient as createServiceClient } from '@supabase/supabase-js'
import { rateLimit } from '@/lib/rateLimit'

const ALLOWED_ROLES = ['broker', 'carrier'] as const
type Role = (typeof ALLOWED_ROLES)[number]

function serviceClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!url || !key) throw new Error('Supabase service role env vars missing')
  return createServiceClient(url, key, {
    auth: { autoRefreshToken: false, persistSession: false },
  })
}

export async function POST(req: NextRequest) {
  try {
    const supabase = await createClient()
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    if (!rateLimit(`onboarding-role:${user.id}`, 10, 300000)) {
      return NextResponse.json({ error: 'Too many requests' }, { status: 429 })
    }

    let body: { role?: unknown }
    try {
      body = await req.json()
    } catch {
      return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })
    }

    const role = body.role as Role
    if (!ALLOWED_ROLES.includes(role)) {
      return NextResponse.json(
        { error: `role must be one of: ${ALLOWED_ROLES.join(', ')}` },
        { status: 400 }
      )
    }

    const { data: profile } = await supabase
      .from('profiles')
      .select('onboarding_complete')
      .eq('id', user.id)
      .single()

    if (profile?.onboarding_complete) {
      return NextResponse.json({ error: 'Onboarding already completed' }, { status: 400 })
    }

    const { error: updateError } = await serviceClient()
      .from('profiles')
      .upsert({ id: user.id, role }, { onConflict: 'id' })

    if (updateError) {
      return NextResponse.json({ error: 'Failed to save role' }, { status: 500 })
    }

    return NextResponse.json({ role })
  } catch {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
