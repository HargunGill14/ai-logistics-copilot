import { NextRequest, NextResponse } from 'next/server'
import {
  exchangeQboCode,
  fetchQboCompanyName,
  getQboOAuthConfig,
} from '@/lib/quickbooks'
import { createClient } from '@/lib/supabase/server'
import { createServiceClient } from '@/lib/supabase/service'

interface BrokerProfile {
  role: string | null
  organization_id: string
}

export async function GET(request: NextRequest) {
  const { origin, searchParams } = new URL(request.url)

  try {
    const code = searchParams.get('code')
    const state = searchParams.get('state')
    const realmId = searchParams.get('realmId')
    const expectedState = request.cookies.get('qbo_oauth_state')?.value

    if (!code || !state || !realmId || !expectedState || state !== expectedState) {
      return redirectCleared(origin, 'failed')
    }

    const config = getQboOAuthConfig(origin)
    if (!config) {
      return redirectCleared(origin, 'not_configured')
    }

    const supabase = await createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return redirectCleared(origin, 'unauthorized')
    }

    const { data: profileRow, error: profileError } = await supabase
      .from('profiles')
      .select('role, organization_id')
      .eq('id', user.id)
      .single()

    if (profileError || !profileRow) {
      return redirectCleared(origin, 'forbidden')
    }

    const profile = profileRow as BrokerProfile
    if (profile.role !== 'broker') {
      return redirectCleared(origin, 'forbidden')
    }

    const tokens = await exchangeQboCode({
      clientId: config.clientId,
      clientSecret: config.clientSecret,
      redirectUri: config.redirectUri,
      code,
      realmId,
    })

    const companyName = await fetchQboCompanyName(realmId, tokens.accessToken)

    const service = createServiceClient()

    // Deactivate any previous connections for this org
    await service
      .from('qbo_connections')
      .update({ is_active: false })
      .eq('organization_id', profile.organization_id)
      .eq('is_active', true)

    const { error: insertError } = await service.from('qbo_connections').insert({
      organization_id: profile.organization_id,
      realm_id: realmId,
      access_token_encrypted: tokens.encryptedAccessToken,
      refresh_token_encrypted: tokens.encryptedRefreshToken,
      token_expires_at: tokens.expiresAt,
      company_name: companyName,
      connected_by: user.id,
      connected_at: new Date().toISOString(),
      is_active: true,
    })

    if (insertError) {
      return redirectCleared(origin, 'failed')
    }

    return redirectCleared(origin, 'connected')
  } catch {
    return redirectCleared(origin, 'failed')
  }
}

function redirectCleared(origin: string, status: string): NextResponse {
  const url = new URL('/settings', origin)
  url.searchParams.set('qbo', status)

  const response = NextResponse.redirect(url)
  response.cookies.delete('qbo_oauth_state')
  return response
}
