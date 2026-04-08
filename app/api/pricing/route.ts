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
    } = body

    if (!pickup_location || !delivery_location || !distance_miles || !shipper_rate) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    if (isNaN(distance_miles) || isNaN(shipper_rate) || distance_miles <= 0 || shipper_rate <= 0) {
      return NextResponse.json({ error: 'Invalid numeric values' }, { status: 400 })
    }

    const sanitizedPickup = String(pickup_location).slice(0, 100)
    const sanitizedDelivery = String(delivery_location).slice(0, 100)

    const prompt = `You are an expert freight pricing analyst for a freight brokerage firm. Analyze this load and provide pricing recommendations.

LOAD DETAILS:
- Route: ${sanitizedPickup} → ${sanitizedDelivery}
- Distance: ${distance_miles} miles
- Load Type: ${load_type}
- Weight: ${weight_lbs} lbs
- Shipper Offered Rate: $${shipper_rate}

Based on current market conditions, typical carrier rates, and freight industry data, provide:
1. Estimated carrier cost
2. Suggested broker rate
3. Expected profit margin amount and percentage
4. Risk level (low/medium/high)
5. Market rate per mile
6. 3 risk factors
7. A brief recommendation (2 sentences max)

Respond ONLY with valid JSON in exactly this format:
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
    if (content.type !== 'text') throw new Error('Unexpected response type')

    const cleanJson = content.text.replace(/```json|```/g, '').trim()
    const pricing = JSON.parse(cleanJson)

    return NextResponse.json(pricing)
  } catch (error) {
    console.error('Pricing API error:', error)
    return NextResponse.json({ error: 'Failed to generate pricing' }, { status: 500 })
  }
}
