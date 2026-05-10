import 'server-only'
import { z } from 'zod'
import { decryptToken, encryptToken } from '@/lib/tokenCrypto'

export const GMAIL_SCOPES = [
  'https://www.googleapis.com/auth/gmail.send',
  'https://www.googleapis.com/auth/gmail.readonly',
] as const

const tokenResponseSchema = z.object({
  access_token: z.string(),
  expires_in: z.number().positive().optional(),
  refresh_token: z.string().optional(),
  scope: z.string().optional(),
  token_type: z.string().optional(),
})

const gmailProfileSchema = z.object({
  emailAddress: z.string().email(),
})

const gmailSendResponseSchema = z.object({
  id: z.string(),
  threadId: z.string().optional(),
})

export interface GmailTokenRow {
  gmail_email: string | null
  gmail_access_token_encrypted: string | null
  gmail_refresh_token_encrypted: string | null
  gmail_token_expires_at: string | null
}

export interface RefreshedGmailTokens {
  accessToken: string
  encryptedAccessToken: string
  expiresAt: string
}

export interface GmailSendResult {
  id: string
  threadId: string | null
}

export function getGoogleOAuthConfig(origin: string): {
  clientId: string
  clientSecret: string
  redirectUri: string
} | null {
  const clientId = process.env.GOOGLE_CLIENT_ID
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET

  if (!clientId || !clientSecret) {
    return null
  }

  const baseUrl = process.env.NEXT_PUBLIC_APP_URL ?? origin
  return {
    clientId,
    clientSecret,
    redirectUri: `${baseUrl.replace(/\/$/, '')}/api/integrations/gmail/callback`,
  }
}

export function buildGoogleOAuthUrl(config: {
  clientId: string
  redirectUri: string
  state: string
}): string {
  const params = new URLSearchParams({
    client_id: config.clientId,
    redirect_uri: config.redirectUri,
    response_type: 'code',
    access_type: 'offline',
    prompt: 'consent',
    include_granted_scopes: 'true',
    state: config.state,
    scope: GMAIL_SCOPES.join(' '),
  })

  return `https://accounts.google.com/o/oauth2/v2/auth?${params.toString()}`
}

export async function exchangeGoogleCode(config: {
  clientId: string
  clientSecret: string
  redirectUri: string
  code: string
}): Promise<{
  accessToken: string
  encryptedAccessToken: string
  encryptedRefreshToken: string | null
  expiresAt: string
  scopes: string[]
}> {
  const params = new URLSearchParams({
    client_id: config.clientId,
    client_secret: config.clientSecret,
    redirect_uri: config.redirectUri,
    code: config.code,
    grant_type: 'authorization_code',
  })

  const response = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: params.toString(),
  })

  if (!response.ok) {
    throw new Error('Google token exchange failed')
  }

  const json: unknown = await response.json()
  const parsed = tokenResponseSchema.safeParse(json)

  if (!parsed.success) {
    throw new Error('Invalid Google token response')
  }

  const expiresAt = new Date(Date.now() + (parsed.data.expires_in ?? 3600) * 1000).toISOString()

  return {
    accessToken: parsed.data.access_token,
    encryptedAccessToken: encryptToken(parsed.data.access_token),
    encryptedRefreshToken: parsed.data.refresh_token
      ? encryptToken(parsed.data.refresh_token)
      : null,
    expiresAt,
    scopes: parsed.data.scope ? parsed.data.scope.split(' ') : [...GMAIL_SCOPES],
  }
}

export async function fetchGmailEmail(accessToken: string): Promise<string> {
  const response = await fetch('https://gmail.googleapis.com/gmail/v1/users/me/profile', {
    headers: { Authorization: `Bearer ${accessToken}` },
  })

  if (!response.ok) {
    throw new Error('Gmail profile fetch failed')
  }

  const json: unknown = await response.json()
  const parsed = gmailProfileSchema.safeParse(json)

  if (!parsed.success) {
    throw new Error('Invalid Gmail profile response')
  }

  return parsed.data.emailAddress
}

export async function getValidGmailAccessToken(profile: GmailTokenRow): Promise<{
  accessToken: string
  refreshed: RefreshedGmailTokens | null
}> {
  if (!profile.gmail_access_token_encrypted || !profile.gmail_refresh_token_encrypted) {
    throw new Error('Gmail is not connected')
  }

  const expiresAt = profile.gmail_token_expires_at
    ? new Date(profile.gmail_token_expires_at).getTime()
    : 0

  if (expiresAt > Date.now() + 60_000) {
    return {
      accessToken: decryptToken(profile.gmail_access_token_encrypted),
      refreshed: null,
    }
  }

  const refreshed = await refreshGmailAccessToken(
    decryptToken(profile.gmail_refresh_token_encrypted),
  )

  return {
    accessToken: refreshed.accessToken,
    refreshed,
  }
}

export async function sendGmailMessage(params: {
  accessToken: string
  to: string
  from: string
  subject: string
  body: string
}): Promise<GmailSendResult> {
  const raw = createRawEmail(params)
  const response = await fetch('https://gmail.googleapis.com/gmail/v1/users/me/messages/send', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${params.accessToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ raw }),
  })

  if (!response.ok) {
    throw new Error('Gmail send failed')
  }

  const json: unknown = await response.json()
  const parsed = gmailSendResponseSchema.safeParse(json)

  if (!parsed.success) {
    throw new Error('Invalid Gmail send response')
  }

  return {
    id: parsed.data.id,
    threadId: parsed.data.threadId ?? null,
  }
}

async function refreshGmailAccessToken(refreshToken: string): Promise<RefreshedGmailTokens> {
  const clientId = process.env.GOOGLE_CLIENT_ID
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET

  if (!clientId || !clientSecret) {
    throw new Error('Google OAuth is not configured')
  }

  const params = new URLSearchParams({
    client_id: clientId,
    client_secret: clientSecret,
    refresh_token: refreshToken,
    grant_type: 'refresh_token',
  })

  const response = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: params.toString(),
  })

  if (!response.ok) {
    throw new Error('Google token refresh failed')
  }

  const json: unknown = await response.json()
  const parsed = tokenResponseSchema.safeParse(json)

  if (!parsed.success) {
    throw new Error('Invalid Google refresh response')
  }

  const expiresAt = new Date(Date.now() + (parsed.data.expires_in ?? 3600) * 1000).toISOString()

  return {
    accessToken: parsed.data.access_token,
    encryptedAccessToken: encryptToken(parsed.data.access_token),
    expiresAt,
  }
}

function createRawEmail(params: {
  to: string
  from: string
  subject: string
  body: string
}): string {
  const message = [
    `To: ${params.to}`,
    `From: ${params.from}`,
    `Subject: ${encodeMimeHeader(params.subject)}`,
    'MIME-Version: 1.0',
    'Content-Type: text/plain; charset="UTF-8"',
    'Content-Transfer-Encoding: 8bit',
    '',
    params.body,
  ].join('\r\n')

  return Buffer.from(message, 'utf8').toString('base64url')
}

function encodeMimeHeader(value: string): string {
  if (/^[\x20-\x7E]*$/.test(value)) {
    return value.replace(/\r|\n/g, ' ')
  }

  return `=?UTF-8?B?${Buffer.from(value.replace(/\r|\n/g, ' '), 'utf8').toString('base64')}?=`
}
