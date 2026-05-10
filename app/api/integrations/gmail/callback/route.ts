import { NextRequest, NextResponse } from 'next/server'
import {
  exchangeGoogleCode,
  fetchGmailEmail,
  getGoogleOAuthConfig,
  GMAIL_SCOPES,
} from '@/lib/gmail'
import { createClient } from '@/lib/supabase/server'

interface BrokerProfile {
  role: string | null
  gmail_refresh_token_encrypted: string | null
}

export async function GET(request: NextRequest) {
  const { origin, searchParams } = new URL(request.url)
  const returnTo = request.cookies.get('gmail_oauth_return_to')?.value ?? '/settings'

  try {
    const code = searchParams.get('code')
    const state = searchParams.get('state')
    const expectedState = request.cookies.get('gmail_oauth_state')?.value

    if (!code || !state || !expectedState || state !== expectedState) {
      return redirectWithClearedCookies(origin, returnTo, 'failed')
    }

    const config = getGoogleOAuthConfig(origin)
    if (!config) {
      return redirectWithClearedCookies(origin, returnTo, 'not_configured')
    }

    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return redirectWithClearedCookies(origin, '/login', 'unauthorized')
    }

    const { data: profileRow, error: profileError } = await supabase
      .from('profiles')
      .select('role, gmail_refresh_token_encrypted')
      .eq('id', user.id)
      .single()

    if (profileError || !profileRow) {
      return redirectWithClearedCookies(origin, returnTo, 'forbidden')
    }

    const profile = profileRow as BrokerProfile
    if (profile.role !== 'broker') {
      return redirectWithClearedCookies(origin, returnTo, 'forbidden')
    }

    const tokens = await exchangeGoogleCode({
      clientId: config.clientId,
      clientSecret: config.clientSecret,
      redirectUri: config.redirectUri,
      code,
    })
    const gmailEmail = await fetchGmailEmail(tokens.accessToken)
    const encryptedRefreshToken =
      tokens.encryptedRefreshToken ?? profile.gmail_refresh_token_encrypted

    if (!encryptedRefreshToken) {
      return redirectWithClearedCookies(origin, returnTo, 'failed')
    }

    const { error: updateError } = await supabase
      .from('profiles')
      .update({
        gmail_email: gmailEmail,
        gmail_access_token_encrypted: tokens.encryptedAccessToken,
        gmail_refresh_token_encrypted: encryptedRefreshToken,
        gmail_token_expires_at: tokens.expiresAt,
        gmail_scopes: tokens.scopes.length > 0 ? tokens.scopes : [...GMAIL_SCOPES],
        gmail_connected_at: new Date().toISOString(),
      })
      .eq('id', user.id)

    if (updateError) {
      return redirectWithClearedCookies(origin, returnTo, 'failed')
    }

    return redirectWithClearedCookies(origin, returnTo, 'connected')
  } catch {
    return redirectWithClearedCookies(origin, returnTo, 'failed')
  }
}

function redirectWithClearedCookies(origin: string, returnTo: string, status: string): NextResponse {
  const url = new URL(returnTo, origin)
  url.searchParams.set('gmail', status)

  const response = NextResponse.redirect(url)
  response.cookies.delete('gmail_oauth_state')
  response.cookies.delete('gmail_oauth_return_to')

  return response
}
