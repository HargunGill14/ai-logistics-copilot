import { NextRequest, NextResponse } from 'next/server'
import Anthropic from '@anthropic-ai/sdk'

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY!,
})

export const maxDuration = 30

export async function POST(request: NextRequest) {
  try {
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

    const prompt = `You are an expert freight broker negotiation assistant. Generate professional negotiation messages for this load.

LOAD DETAILS:
- Route: ${pickup_location} → ${delivery_location}
- Distance: ${distance_miles} miles
- Load Type: ${load_type}
- Weight: ${weight_lbs} lbs
- Shipper Offered Rate: $${shipper_rate}
- Our Suggested Rate: $${suggested_rate}
- Target Carrier Cost: $${carrier_cost}
- Expected Margin: ${margin_percentage}%

Generate:
1. A professional email to the shipper confirming/negotiating the rate
2. A brief message to carriers asking for capacity at our target rate
3. A suggested counteroffer price if shipper pushes back

Respond ONLY with a valid JSON object in exactly this format, no other text:
{
  "shipper_email": "full professional email text here",
  "carrier_message": "brief carrier message here",
  "counteroffer_price": number,
  "counteroffer_note": "brief explanation of counteroffer strategy"
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
    return NextResponse.json(
      { error: 'Failed to generate negotiation content' },
      { status: 500 }
    )
  }
}
