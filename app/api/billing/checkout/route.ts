import { NextResponse } from 'next/server'
import Stripe from 'stripe'
import { createClient } from '@/lib/supabase/server'
import { createClient as createServiceClient } from '@supabase/supabase-js'
import { rateLimit } from '@/lib/rateLimit'

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!)

function svc() {
  return createServiceClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { persistSession: false } }
  )
}

export async function POST() {
  try {
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    if (!rateLimit(`checkout:${user.id}`, 5, 3600000)) {
      return NextResponse.json({ error: 'Too many requests' }, { status: 429 })
    }

    const { data: profile } = await svc()
      .from('profiles')
      .select('role, stripe_customer_id')
      .eq('id', user.id)
      .single()

    if (!profile) {
      return NextResponse.json({ error: 'Profile not found' }, { status: 403 })
    }

    const role = profile.role as string | null
    const priceId =
      role === 'carrier'
        ? process.env.STRIPE_CARRIER_PRICE_ID!
        : process.env.STRIPE_BROKER_PRICE_ID!

    let customerId = profile.stripe_customer_id as string | null
    if (!customerId) {
      const customer = await stripe.customers.create({
        email: user.email,
        metadata: { user_id: user.id },
      })
      customerId = customer.id
      await svc()
        .from('profiles')
        .update({ stripe_customer_id: customerId })
        .eq('id', user.id)
    }

    const session = await stripe.checkout.sessions.create({
      customer: customerId,
      mode: 'subscription',
      line_items: [{ price: priceId, quantity: 1 }],
      success_url: `${process.env.NEXT_PUBLIC_APP_URL}/dashboard?upgraded=true`,
      cancel_url: `${process.env.NEXT_PUBLIC_APP_URL}/plans`,
    })

    return NextResponse.json({ url: session.url })
  } catch {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
