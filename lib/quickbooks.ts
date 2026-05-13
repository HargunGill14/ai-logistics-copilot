import 'server-only'
import { z } from 'zod'
import { decryptToken, encryptToken } from '@/lib/tokenCrypto'
import { createServiceClient } from '@/lib/supabase/service'

const QBO_AUTH_URL = 'https://appcenter.intuit.com/connect/oauth2'
const QBO_TOKEN_URL = 'https://oauth.platform.intuit.com/oauth2/v1/tokens/bearer'
const QBO_REVOKE_URL = 'https://developer.api.intuit.com/v2/oauth2/tokens/revoke'
export const QBO_SCOPE = 'com.intuit.quickbooks.accounting'

function getQboApiBase(realmId: string): string {
  const env = process.env.QBO_ENVIRONMENT ?? 'sandbox'
  const host =
    env === 'production'
      ? 'https://quickbooks.api.intuit.com'
      : 'https://sandbox-quickbooks.api.intuit.com'
  return `${host}/v3/company/${realmId}`
}

// ── Schemas ──────────────────────────────────────────────────────────────────

const qboTokenResponseSchema = z.object({
  access_token: z.string(),
  refresh_token: z.string(),
  expires_in: z.number().positive().optional(),
  token_type: z.string().optional(),
  x_refresh_token_expires_in: z.number().positive().optional(),
})

const qboCompanyInfoResponseSchema = z.object({
  CompanyInfo: z.object({
    CompanyName: z.string(),
  }),
})

const qboCustomerQueryResponseSchema = z.object({
  QueryResponse: z.object({
    Customer: z
      .array(
        z.object({
          Id: z.string(),
          DisplayName: z.string(),
          SyncToken: z.string(),
        }),
      )
      .optional(),
  }),
})

const qboCustomerCreateResponseSchema = z.object({
  Customer: z.object({
    Id: z.string(),
    SyncToken: z.string(),
  }),
})

const qboInvoiceCreateResponseSchema = z.object({
  Invoice: z.object({
    Id: z.string(),
    SyncToken: z.string(),
    DocNumber: z.string().optional(),
  }),
})

const qboInvoiceReadResponseSchema = z.object({
  Invoice: z.object({
    Id: z.string(),
    SyncToken: z.string(),
    TotalAmt: z.number(),
    CustomerRef: z.object({ value: z.string() }),
  }),
})

const qboPaymentCreateResponseSchema = z.object({
  Payment: z.object({
    Id: z.string(),
  }),
})

// ── Public Interfaces ─────────────────────────────────────────────────────────

export interface QboTokenRow {
  id: string
  realm_id: string
  access_token_encrypted: string
  refresh_token_encrypted: string
  token_expires_at: string
  company_name: string | null
}

export interface QboConnectionStatus {
  connected: boolean
  realm_id: string | null
  company_name: string | null
  connected_at: string | null
}

export interface RefreshedQboTokens {
  accessToken: string
  encryptedAccessToken: string
  encryptedRefreshToken: string
  expiresAt: string
}

// ── OAuth Config ──────────────────────────────────────────────────────────────

export function getQboOAuthConfig(origin: string): {
  clientId: string
  clientSecret: string
  redirectUri: string
} | null {
  const clientId = process.env.QBO_CLIENT_ID
  const clientSecret = process.env.QBO_CLIENT_SECRET
  if (!clientId || !clientSecret) return null

  const baseUrl = process.env.NEXT_PUBLIC_APP_URL ?? origin
  return {
    clientId,
    clientSecret,
    redirectUri: `${baseUrl.replace(/\/$/, '')}/api/integrations/quickbooks/callback`,
  }
}

export function buildQboOAuthUrl(params: {
  clientId: string
  redirectUri: string
  state: string
}): string {
  const urlParams = new URLSearchParams({
    client_id: params.clientId,
    redirect_uri: params.redirectUri,
    response_type: 'code',
    scope: QBO_SCOPE,
    state: params.state,
  })
  return `${QBO_AUTH_URL}?${urlParams.toString()}`
}

// ── Token Exchange ────────────────────────────────────────────────────────────

export async function exchangeQboCode(config: {
  clientId: string
  clientSecret: string
  redirectUri: string
  code: string
  realmId: string
}): Promise<{
  accessToken: string
  encryptedAccessToken: string
  encryptedRefreshToken: string
  expiresAt: string
}> {
  const credentials = Buffer.from(`${config.clientId}:${config.clientSecret}`).toString('base64')
  const params = new URLSearchParams({
    grant_type: 'authorization_code',
    code: config.code,
    redirect_uri: config.redirectUri,
  })

  const response = await fetch(QBO_TOKEN_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
      Authorization: `Basic ${credentials}`,
      Accept: 'application/json',
    },
    body: params.toString(),
  })

  if (!response.ok) {
    throw new Error('QBO token exchange failed')
  }

  const json: unknown = await response.json()
  const parsed = qboTokenResponseSchema.safeParse(json)
  if (!parsed.success) throw new Error('Invalid QBO token response')

  const expiresAt = new Date(Date.now() + (parsed.data.expires_in ?? 3600) * 1000).toISOString()

  return {
    accessToken: parsed.data.access_token,
    encryptedAccessToken: encryptToken(parsed.data.access_token),
    encryptedRefreshToken: encryptToken(parsed.data.refresh_token),
    expiresAt,
  }
}

async function refreshQboToken(refreshToken: string): Promise<RefreshedQboTokens> {
  const clientId = process.env.QBO_CLIENT_ID
  const clientSecret = process.env.QBO_CLIENT_SECRET
  if (!clientId || !clientSecret) throw new Error('QuickBooks is not configured')

  const credentials = Buffer.from(`${clientId}:${clientSecret}`).toString('base64')
  const params = new URLSearchParams({
    grant_type: 'refresh_token',
    refresh_token: refreshToken,
  })

  const response = await fetch(QBO_TOKEN_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
      Authorization: `Basic ${credentials}`,
      Accept: 'application/json',
    },
    body: params.toString(),
  })

  if (!response.ok) throw new Error('QBO token refresh failed')

  const json: unknown = await response.json()
  const parsed = qboTokenResponseSchema.safeParse(json)
  if (!parsed.success) throw new Error('Invalid QBO refresh response')

  const expiresAt = new Date(Date.now() + (parsed.data.expires_in ?? 3600) * 1000).toISOString()

  return {
    accessToken: parsed.data.access_token,
    encryptedAccessToken: encryptToken(parsed.data.access_token),
    encryptedRefreshToken: encryptToken(parsed.data.refresh_token),
    expiresAt,
  }
}

export async function revokeQboToken(token: string): Promise<void> {
  const clientId = process.env.QBO_CLIENT_ID
  const clientSecret = process.env.QBO_CLIENT_SECRET
  if (!clientId || !clientSecret) return

  const credentials = Buffer.from(`${clientId}:${clientSecret}`).toString('base64')
  await fetch(QBO_REVOKE_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
      Authorization: `Basic ${credentials}`,
      Accept: 'application/json',
    },
    body: new URLSearchParams({ token }).toString(),
  }).catch(() => {})
}

// ── Token Freshness ───────────────────────────────────────────────────────────

export async function getValidQboToken(row: QboTokenRow): Promise<{
  accessToken: string
  refreshed: RefreshedQboTokens | null
}> {
  const expiresAt = new Date(row.token_expires_at).getTime()

  if (expiresAt > Date.now() + 60_000) {
    return {
      accessToken: decryptToken(row.access_token_encrypted),
      refreshed: null,
    }
  }

  const refreshed = await refreshQboToken(decryptToken(row.refresh_token_encrypted))
  return { accessToken: refreshed.accessToken, refreshed }
}

// ── Supabase Connection CRUD ──────────────────────────────────────────────────

export async function fetchQboCompanyName(
  realmId: string,
  accessToken: string,
): Promise<string | null> {
  try {
    const response = await fetch(
      `${getQboApiBase(realmId)}/companyinfo/${realmId}?minorversion=65`,
      { headers: { Authorization: `Bearer ${accessToken}`, Accept: 'application/json' } },
    )
    if (!response.ok) return null
    const json: unknown = await response.json()
    const parsed = qboCompanyInfoResponseSchema.safeParse(json)
    return parsed.success ? parsed.data.CompanyInfo.CompanyName : null
  } catch {
    return null
  }
}

export async function getQboConnectionForOrg(organizationId: string): Promise<{
  connection: QboTokenRow
  accessToken: string
} | null> {
  const service = createServiceClient()

  const { data, error } = await service
    .from('qbo_connections')
    .select(
      'id, realm_id, access_token_encrypted, refresh_token_encrypted, token_expires_at, company_name',
    )
    .eq('organization_id', organizationId)
    .eq('is_active', true)
    .order('connected_at', { ascending: false })
    .limit(1)
    .single()

  if (error || !data) return null

  const { accessToken, refreshed } = await getValidQboToken(data as QboTokenRow)

  if (refreshed) {
    await service
      .from('qbo_connections')
      .update({
        access_token_encrypted: refreshed.encryptedAccessToken,
        refresh_token_encrypted: refreshed.encryptedRefreshToken,
        token_expires_at: refreshed.expiresAt,
      })
      .eq('id', data.id)
  }

  return { connection: data as QboTokenRow, accessToken }
}

// ── QBO API Primitives ────────────────────────────────────────────────────────

async function qboRequest(params: {
  method: 'GET' | 'POST'
  realmId: string
  accessToken: string
  path: string
  body?: Record<string, unknown>
}): Promise<unknown> {
  const separator = params.path.includes('?') ? '&' : '?'
  const url = `${getQboApiBase(params.realmId)}/${params.path}${separator}minorversion=65`

  const response = await fetch(url, {
    method: params.method,
    headers: {
      Authorization: `Bearer ${params.accessToken}`,
      Accept: 'application/json',
      ...(params.body ? { 'Content-Type': 'application/json' } : {}),
    },
    body: params.body ? JSON.stringify(params.body) : undefined,
  })

  if (!response.ok) {
    throw new Error(`QBO API error: ${response.status}`)
  }

  return response.json()
}

async function findOrCreateQboCustomer(
  realmId: string,
  accessToken: string,
  displayName: string,
): Promise<string> {
  // Strip characters that break QBO's query syntax
  const safeName = displayName.slice(0, 100).replace(/['"\\]/g, '').trim()

  const queryJson = await qboRequest({
    method: 'GET',
    realmId,
    accessToken,
    path: `query?query=${encodeURIComponent(`SELECT * FROM Customer WHERE DisplayName = '${safeName}' MAXRESULTS 1`)}`,
  })

  const queryParsed = qboCustomerQueryResponseSchema.safeParse(queryJson)
  if (queryParsed.success && (queryParsed.data.QueryResponse.Customer?.length ?? 0) > 0) {
    return queryParsed.data.QueryResponse.Customer![0].Id
  }

  const createJson = await qboRequest({
    method: 'POST',
    realmId,
    accessToken,
    path: 'customer',
    body: { DisplayName: safeName },
  })

  const createParsed = qboCustomerCreateResponseSchema.safeParse(createJson)
  if (!createParsed.success) throw new Error('Failed to create QBO customer')

  return createParsed.data.Customer.Id
}

// ── Domain Operations ─────────────────────────────────────────────────────────

export async function createQboInvoice(params: {
  realmId: string
  accessToken: string
  loadId: string
  originCity: string
  originState: string
  destinationCity: string
  destinationState: string
  pickupDate: string
  shipperRate: number
  commodity: string | null
}): Promise<string> {
  const customerId = await findOrCreateQboCustomer(
    params.realmId,
    params.accessToken,
    'FreTraq Shipper',
  )

  const description = [
    `Freight: ${params.originCity}, ${params.originState} → ${params.destinationCity}, ${params.destinationState}`,
    `Pickup: ${new Date(params.pickupDate).toLocaleDateString()}`,
    params.commodity ? `Commodity: ${params.commodity}` : null,
    `Load: ${params.loadId.slice(0, 8)}`,
  ]
    .filter(Boolean)
    .join(' | ')

  const invoiceJson = await qboRequest({
    method: 'POST',
    realmId: params.realmId,
    accessToken: params.accessToken,
    path: 'invoice',
    body: {
      CustomerRef: { value: customerId },
      TxnDate: new Date().toISOString().slice(0, 10),
      PrivateNote: `FreTraq Load ID: ${params.loadId}`,
      Line: [
        {
          Amount: params.shipperRate,
          DetailType: 'SalesItemLineDetail',
          Description: description,
          SalesItemLineDetail: {
            ItemRef: { value: '1', name: 'Services' },
            UnitPrice: params.shipperRate,
            Qty: 1,
          },
        },
      ],
    },
  })

  const parsed = qboInvoiceCreateResponseSchema.safeParse(invoiceJson)
  if (!parsed.success) throw new Error('Failed to create QBO invoice')

  return parsed.data.Invoice.Id
}

export async function markQboInvoicePaid(params: {
  realmId: string
  accessToken: string
  qboInvoiceId: string
  amount: number
}): Promise<string> {
  const invoiceJson = await qboRequest({
    method: 'GET',
    realmId: params.realmId,
    accessToken: params.accessToken,
    path: `invoice/${params.qboInvoiceId}`,
  })

  const invoiceParsed = qboInvoiceReadResponseSchema.safeParse(invoiceJson)
  if (!invoiceParsed.success) throw new Error('Failed to read QBO invoice')

  const customerId = invoiceParsed.data.Invoice.CustomerRef.value

  const paymentJson = await qboRequest({
    method: 'POST',
    realmId: params.realmId,
    accessToken: params.accessToken,
    path: 'payment',
    body: {
      CustomerRef: { value: customerId },
      TotalAmt: params.amount,
      Line: [
        {
          Amount: params.amount,
          LinkedTxn: [{ TxnId: params.qboInvoiceId, TxnType: 'Invoice' }],
        },
      ],
    },
  })

  const paymentParsed = qboPaymentCreateResponseSchema.safeParse(paymentJson)
  if (!paymentParsed.success) throw new Error('Failed to create QBO payment')

  return paymentParsed.data.Payment.Id
}
