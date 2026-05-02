import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

const DEMO_EMAIL = 'legitgamer071@gmail.com'
const ALLOWED_ROLES = ['broker', 'carrier', 'yard'] as const
type Role = (typeof ALLOWED_ROLES)[number]

export async function POST(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user }, error: authError } = await supabase.auth.getUser()

  if (authError || !user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  if (user.email !== DEMO_EMAIL) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
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

  const { error: updateError } = await supabase
    .from('profiles')
    .update({ role })
    .eq('id', user.id)

  if (updateError) {
    return NextResponse.json({ error: updateError.message }, { status: 500 })
  }

  return NextResponse.json({ success: true, role })
}
