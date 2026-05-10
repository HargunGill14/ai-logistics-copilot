import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { createClient } from '@/lib/supabase/server'
import { createClient as createServiceClient } from '@supabase/supabase-js'
import { rateLimit } from '@/lib/rateLimit'

const schema = z.object({
  company_name: z.string().min(1, 'Company name is required').max(100),
  phone_number: z
    .string()
    .regex(/^\+?[\d\s\-().]{7,20}$/, 'Enter a valid phone number'),
})

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

    if (!rateLimit(`onboarding-broker:${user.id}`, 5, 300000)) {
      return NextResponse.json({ error: 'Too many requests' }, { status: 429 })
    }

    const { data: profile } = await supabase
      .from('profiles')
      .select('role, organization_id')
      .eq('id', user.id)
      .single()

    if (!profile || profile.role !== 'broker') {
      return NextResponse.json(
        { error: 'Only brokers can complete broker onboarding' },
        { status: 403 }
      )
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

    const { company_name, phone_number } = parsed.data
    const svc = serviceClient()

    let orgId = profile.organization_id

    if (orgId) {
      await svc.from('organizations').update({ name: company_name }).eq('id', orgId)
    } else {
      const { data: org, error: orgError } = await svc
        .from('organizations')
        .insert({ name: company_name })
        .select('id')
        .single()

      if (orgError || !org) {
        return NextResponse.json({ error: 'Failed to create organization' }, { status: 500 })
      }
      orgId = org.id
    }

    const { error: profileError } = await svc
      .from('profiles')
      .update({ company_name, phone_number, organization_id: orgId, onboarding_complete: true })
      .eq('id', user.id)

    if (profileError) {
      return NextResponse.json({ error: 'Failed to update profile' }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
