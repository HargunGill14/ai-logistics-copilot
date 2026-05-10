import { randomBytes } from 'crypto'
import { NextRequest, NextResponse } from 'next/server'
import { buildGoogleOAuthUrl, getGoogleOAuthConfig } from '@/lib/gmail'
import { createClient } from '@/lib/supabase/server'

interface BrokerProfile {
  role: string | null
}

export async function GET(request: NextRequest) {
  try {
    const { origin, searchParams } = new URL(request.url)
    const config = getGoogleOAuthConfig(origin)

    if (!config) {
      return NextResponse.redirect(`${origin}/settings?gmail=not_configured`)
    }

    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.redirect(`${origin}/login`)
    }

    const { data: profileRow, error: profileError } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single()

    if (profileError || !profileRow) {
      return NextResponse.redirect(`${origin}/settings?gmail=forbidden`)
    }

    const profile = profileRow as BrokerProfile
    if (profile.role !== 'broker') {
      return NextResponse.redirect(`${origin}/settings?gmail=forbidden`)
    }

    const returnTo = sanitizeReturnTo(searchParams.get('returnTo'))
    const state = randomBytes(32).toString('base64url')
    const response = NextResponse.redirect(
      buildGoogleOAuthUrl({
        clientId: config.clientId,
        redirectUri: config.redirectUri,
        state,
      }),
    )

    response.cookies.set('gmail_oauth_state', state, {
      httpOnly: true,
      sameSite: 'lax',
      secure: process.env.NODE_ENV === 'production',
      maxAge: 600,
      path: '/',
    })
    response.cookies.set('gmail_oauth_return_to', returnTo, {
      httpOnly: true,
      sameSite: 'lax',
      secure: process.env.NODE_ENV === 'production',
      maxAge: 600,
      path: '/',
    })

    return response
  } catch {
    const { origin } = new URL(request.url)
    return NextResponse.redirect(`${origin}/settings?gmail=connect_failed`)
  }
}

function sanitizeReturnTo(value: string | null): string {
  if (!value || !value.startsWith('/') || value.startsWith('//')) {
    return '/settings'
  }

  return value.slice(0, 200)
}
