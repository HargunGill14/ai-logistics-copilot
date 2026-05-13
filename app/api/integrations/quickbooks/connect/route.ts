import { randomBytes } from 'crypto'
import { NextRequest, NextResponse } from 'next/server'
import { buildQboOAuthUrl, getQboOAuthConfig } from '@/lib/quickbooks'
import { createClient } from '@/lib/supabase/server'

interface BrokerProfile {
  role: string | null
}

export async function GET(request: NextRequest) {
  try {
    const { origin } = new URL(request.url)
    const config = getQboOAuthConfig(origin)

    if (!config) {
      return NextResponse.redirect(`${origin}/settings?qbo=not_configured`)
    }

    const supabase = await createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.redirect(`${origin}/login`)
    }

    const { data: profileRow, error: profileError } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single()

    if (profileError || !profileRow) {
      return NextResponse.redirect(`${origin}/settings?qbo=forbidden`)
    }

    const profile = profileRow as BrokerProfile
    if (profile.role !== 'broker') {
      return NextResponse.redirect(`${origin}/settings?qbo=forbidden`)
    }

    const state = randomBytes(32).toString('base64url')
    const response = NextResponse.redirect(
      buildQboOAuthUrl({ clientId: config.clientId, redirectUri: config.redirectUri, state }),
    )

    const cookieOpts = {
      httpOnly: true,
      sameSite: 'lax' as const,
      secure: process.env.NODE_ENV === 'production',
      maxAge: 600,
      path: '/',
    }

    response.cookies.set('qbo_oauth_state', state, cookieOpts)

    return response
  } catch {
    const { origin } = new URL(request.url)
    return NextResponse.redirect(`${origin}/settings?qbo=connect_failed`)
  }
}
