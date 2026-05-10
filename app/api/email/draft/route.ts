import { NextRequest, NextResponse } from 'next/server'
import Anthropic from '@anthropic-ai/sdk'
import { z } from 'zod'
import { createClient } from '@/lib/supabase/server'
import { limitEmailDraft } from '@/lib/upstashRateLimit'
import type { EmailDraftResponse, EmailType, MarketplaceLoad } from '@/types'

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
})

const requestSchema = z.object({
  loadId: z.string().uuid(),
  emailType: z.enum(['carrier_outreach', 'rate_confirmation', 'load_tender']),
  recipient: z.string().email().max(254).optional().or(z.literal('')),
  notes: z.string().max(1000).optional(),
})

const claudeDraftSchema = z.object({
  subject: z.string().min(1).max(200),
  body: z.string().min(1).max(8000),
})

interface BrokerProfile {
  role: string | null
  organization_id: string
  full_name: string | null
  email: string | null
  company_name: string | null
}

export const maxDuration = 30

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

    const limit = await limitEmailDraft(user.id)
    if (!limit.configured) {
      return NextResponse.json({ error: 'Email drafting is not configured' }, { status: 503 })
    }
    if (!limit.allowed) {
      return NextResponse.json({ error: 'Too many draft requests' }, { status: 429 })
    }

    const { data: profileRow, error: profileError } = await supabase
      .from('profiles')
      .select('role, organization_id, full_name, email, company_name')
      .eq('id', user.id)
      .single()

    if (profileError || !profileRow) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const profile = profileRow as BrokerProfile
    if (profile.role !== 'broker') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const { data: loadRow, error: loadError } = await supabase
      .from('marketplace_loads')
      .select('*')
      .eq('id', parsed.data.loadId)
      .eq('organization_id', profile.organization_id)
      .single()

    if (loadError || !loadRow) {
      return NextResponse.json({ error: 'Load not found' }, { status: 404 })
    }

    if (!process.env.ANTHROPIC_API_KEY) {
      return NextResponse.json({ error: 'Email drafting is not configured' }, { status: 503 })
    }

    const load = loadRow as MarketplaceLoad
    const message = await anthropic.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 1400,
      messages: [
        {
          role: 'user',
          content: buildDraftPrompt({
            load,
            emailType: parsed.data.emailType,
            recipient: parsed.data.recipient || null,
            notes: parsed.data.notes ?? null,
            brokerName: profile.full_name,
            brokerEmail: profile.email,
            companyName: profile.company_name,
          }),
        },
      ],
    })

    const content = message.content[0]
    if (!content || content.type !== 'text') {
      throw new Error('Unexpected Claude response')
    }

    const draft = parseClaudeDraft(content.text)
    if (!draft) {
      throw new Error('Invalid Claude draft response')
    }

    const response: EmailDraftResponse = {
      subject: draft.subject,
      body: draft.body,
    }

    return NextResponse.json(response)
  } catch {
    return NextResponse.json({ error: 'Failed to generate draft' }, { status: 500 })
  }
}

function buildDraftPrompt(params: {
  load: MarketplaceLoad
  emailType: EmailType
  recipient: string | null
  notes: string | null
  brokerName: string | null
  brokerEmail: string | null
  companyName: string | null
}): string {
  const emailTypeLabels: Record<EmailType, string> = {
    carrier_outreach: 'carrier outreach',
    rate_confirmation: 'rate confirmation',
    load_tender: 'load tender',
  }

  return `You are a freight broker email drafting assistant for FreTraq.

Draft a broker-reviewed ${emailTypeLabels[params.emailType]} email. Keep it professional, concise, factual, and ready for the broker to edit before sending.

LOAD:
- Route: ${sanitizeText(params.load.origin_city, 100)}, ${sanitizeState(params.load.origin_state)} to ${sanitizeText(params.load.destination_city, 100)}, ${sanitizeState(params.load.destination_state)}
- Pickup: ${params.load.pickup_date}
- Delivery: ${params.load.delivery_date ?? 'Not specified'}
- Equipment: ${params.load.equipment_type}
- Weight: ${params.load.weight_lbs ?? 'Not specified'} lbs
- Commodity: ${params.load.commodity ? sanitizeText(params.load.commodity, 200) : 'Not specified'}
- Target rate: $${params.load.target_rate}
- Max rate: ${params.load.max_rate ? `$${params.load.max_rate}` : 'Not specified'}

BROKER:
- Name: ${params.brokerName ? sanitizeText(params.brokerName, 120) : 'Broker'}
- Company: ${params.companyName ? sanitizeText(params.companyName, 160) : 'Freight brokerage'}
- Email: ${params.brokerEmail ? sanitizeText(params.brokerEmail, 254) : 'Not specified'}

RECIPIENT:
- Email: ${params.recipient ? sanitizeText(params.recipient, 254) : 'Not specified'}

BROKER NOTES:
${params.notes ? sanitizeText(params.notes, 1000) : 'None'}

Respond only with valid JSON in this exact shape:
{
  "subject": "string",
  "body": "string"
}`
}

function parseClaudeDraft(text: string): EmailDraftResponse | null {
  const cleanJson = text.replace(/```json|```/g, '').trim()
  const json: unknown = JSON.parse(cleanJson)
  const parsed = claudeDraftSchema.safeParse(json)

  if (!parsed.success) {
    return null
  }

  return parsed.data
}

function sanitizeText(value: string, maxLength: number): string {
  return value.trim().replace(/\s+/g, ' ').slice(0, maxLength)
}

function sanitizeState(value: string): string {
  return value.trim().toUpperCase().slice(0, 2)
}
