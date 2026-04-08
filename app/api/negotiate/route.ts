import { NextRequest, NextResponse } from 'next/server'
import Anthropic from '@anthropic-ai/sdk'
import { createClient } from '@/lib/supabase/server'
import { rateLimit } from '@/lib/rateLimit'

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY!,
})

export const maxDuration = 30

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const allowed = rateLimit(user.id, 20, 60000)
    if (!allowed) {
      return NextResponse.json(
        { error: 'Too many requests. Please wait a minute.' },
        { status: 429 }
      )
    }

    const body = await request.json()
    const {
      pickup_location,
      delivery_location,
      distance_miles,
      load_type,
      weight_lbs,
      shipper_rate,
      suggested_rate,
      carrier_cost,
      margin_percentage,
    } = body

    const sanitizedPickup = String(pickup_location).slice(0, 100)
    const sanitizedDelivery = String(delivery_location).slice(0, 100)

    const prompt = `You are an expert freight broker negotiation assistant. Generate professional negotiation messages for this load.

LOAD DETAILS:
- Route: ${sanitizedPickup} → ${sanitizedDelivery}
- Distance: ${distance_miles} miles
- Load Type: ${load_type}
- Weight: ${weight_lbs} lbs
- Shipper Offered Rate: $${shipper_rate}
- Our Suggested Rate: $${suggested_rate}
- Target Carrier Cost: $${carrier_cost}
- Expected Margin: ${margin_percentage}%

Generate:
1. A professional email to the shipper
2. A brief message to carriers
3. A suggested counteroffer price if shipper pushes back

Respond ONLY with valid JSON:
{
  "shipper_email": "full email text",
  "carrier_message": "brief carrier message",
  "counteroffer_price": number,
  "counteroffer_note": "brief strategy note"
}`

    const message = await anthropic.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 1500,
      messages: [{ role: 'user', content: prompt }],
    })

    const content = message.content[0]
    if (content.type !== 'text') throw new Error('Unexpected response type')

    const cleanJson = content.text.replace(/```json|```/g, '').trim()
    const negotiation = JSON.parse(cleanJson)

    return NextResponse.json(negotiation)
  } catch (error) {
    console.error('Negotiation API error:', error)
    return NextResponse.json({ error: 'Failed to generate content' }, { status: 500 })
  }
}
