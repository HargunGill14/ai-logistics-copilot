import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import {
  getValidGmailAccessToken,
  sendGmailMessage,
  type GmailTokenRow,
} from '@/lib/gmail'
import { createClient } from '@/lib/supabase/server'
import { limitEmailSend } from '@/lib/upstashRateLimit'

const requestSchema = z.object({
  loadId: z.string().uuid(),
  emailType: z.enum(['carrier_outreach', 'rate_confirmation', 'load_tender']),
  recipient: z.string().email().max(254),
  subject: z.string().min(1).max(200),
  body: z.string().min(1).max(8000),
})

interface BrokerProfile extends GmailTokenRow {
  role: string | null
  organization_id: string
}

export async function POST(request: NextRequest) {
  try {
    let body: unknown
    try {
      body = await request.json()
    } catch {
      return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })
    }

    const parsed = requestSchema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json({ error: 'Invalid input' }, { status: 400 })
    }

    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const limit = await limitEmailSend(user.id)
    if (!limit.configured) {
      return NextResponse.json({ error: 'Email sending is not configured' }, { status: 503 })
    }
    if (!limit.allowed) {
      return NextResponse.json({ error: 'Too many send requests' }, { status: 429 })
    }

    const { data: profileRow, error: profileError } = await supabase
      .from('profiles')
      .select(`
        role,
        organization_id,
        gmail_email,
        gmail_access_token_encrypted,
        gmail_refresh_token_encrypted,
        gmail_token_expires_at
      `)
      .eq('id', user.id)
      .single()

    if (profileError || !profileRow) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const profile = profileRow as BrokerProfile
    if (profile.role !== 'broker') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    if (!profile.gmail_email) {
      return NextResponse.json({ error: 'Gmail is not connected' }, { status: 409 })
    }

    const { data: loadRow, error: loadError } = await supabase
      .from('marketplace_loads')
      .select('id')
      .eq('id', parsed.data.loadId)
      .eq('organization_id', profile.organization_id)
      .single()

    if (loadError || !loadRow) {
      return NextResponse.json({ error: 'Load not found' }, { status: 404 })
    }

    const tokenResult = await getValidGmailAccessToken(profile)
    if (tokenResult.refreshed) {
      const { error: updateError } = await supabase
        .from('profiles')
        .update({
          gmail_access_token_encrypted: tokenResult.refreshed.encryptedAccessToken,
          gmail_token_expires_at: tokenResult.refreshed.expiresAt,
        })
        .eq('id', user.id)

      if (updateError) {
        return NextResponse.json({ error: 'Failed to refresh Gmail connection' }, { status: 500 })
      }
    }

    const result = await sendGmailMessage({
      accessToken: tokenResult.accessToken,
      to: sanitizeHeaderValue(parsed.data.recipient),
      from: sanitizeHeaderValue(profile.gmail_email),
      subject: parsed.data.subject.trim(),
      body: parsed.data.body.trim(),
    })

    return NextResponse.json({
      success: true,
      id: result.id,
      threadId: result.threadId,
    })
  } catch {
    return NextResponse.json({ error: 'Failed to send email' }, { status: 500 })
  }
}

function sanitizeHeaderValue(value: string): string {
  return value.replace(/\r|\n/g, '').trim()
}
