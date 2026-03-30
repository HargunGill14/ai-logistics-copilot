import { NextRequest, NextResponse } from 'next/server'
import Anthropic from '@anthropic-ai/sdk'

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY!,
})

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
    } = body

    if (!pickup_location || !delivery_location || !distance_miles || !shipper_rate) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      )
    }

    const prompt = `You are an expert freight pricing analyst for a freight brokerage firm. Analyze this load and provide pricing recommendations.

LOAD DETAILS:
- Route: ${pickup_location} → ${delivery_location}
- Distance: ${distance_miles} miles
- Load Type: ${load_type}
- Weight: ${weight_lbs} lbs
- Shipper Offered Rate: $${shipper_rate}

Based on current market conditions, typical carrier rates, and freight industry data, provide:

1. Estimated carrier cost (what you'd pay the carrier)
2. Suggested broker rate (what to charge the shipper)
3. Expected profit margin amount and percentage
4. Risk level (low/medium/high)
5. Market rate per mile
6. 3 risk factors to consider
7. A brief recommendation (2 sentences max)

Respond ONLY with a valid JSON object in exactly this format, no other text:
{
  "carrier_cost": number,
  "suggested_rate": number,
  "margin_amount": number,
  "margin_percentage": number,
  "risk_level": "low" | "medium" | "high",
  "market_rate_per_mile": number,
  "risk_factors": ["factor1", "factor2", "factor3"],
  "recommendation": "string"
}`

    const message = await anthropic.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 1000,
      messages: [{ role: 'user', content: prompt }],
    })

    const content = message.content[0]
    if (content.type !== 'text') {
      throw new Error('Unexpected response type from AI')
    }

    const cleanJson = content.text.replace(/```json|```/g, '').trim()
    const pricing = JSON.parse(cleanJson)

    return NextResponse.json(pricing)
  } catch (error) {
    console.error('Pricing API error:', error)
    return NextResponse.json(
      { error: 'Failed to generate pricing' },
      { status: 500 }
    )
  }
}
