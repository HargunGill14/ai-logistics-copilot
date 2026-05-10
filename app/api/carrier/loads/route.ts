import { NextResponse } from 'next/server'
import { createClient as createServerClient } from '@/lib/supabase/server'
import { createClient } from '@supabase/supabase-js'

function createServiceClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!url || !key) throw new Error('Supabase env vars missing')
  return createClient(url, key, { auth: { persistSession: false } })
}

export async function GET() {
  try {
    const supabase = await createServerClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })
    }

    const admin = createServiceClient()

    const { data: profile } = await admin
      .from('profiles')
      .select('role, organization_id')
      .eq('id', user.id)
      .single()

    if (!profile || profile.role !== 'carrier') {
      return NextResponse.json({ error: 'Carrier access required' }, { status: 403 })
    }

    const { data: loads, error: loadsErr } = await admin
      .from('loads')
      .select('*')
      .in('status', ['active', 'pricing', 'negotiating'])
      .order('created_at', { ascending: false })

    if (loadsErr) {
      return NextResponse.json({ error: 'Failed to load carrier data' }, { status: 500 })
    }

    const { data: posts, error: postsErr } = await admin
      .from('capacity_posts')
      .select('*')
      .eq('created_by', user.id)
      .order('created_at', { ascending: false })

    return NextResponse.json({
      loads: loads ?? [],
      posts: (postsErr && postsErr.code === '42P01') ? [] : (posts ?? []),
      organization_id: profile.organization_id,
    })
  } catch {
    return NextResponse.json({ error: 'Failed to load carrier data' }, { status: 500 })
  }
}
