import { NextRequest, NextResponse } from 'next/server'
import Stripe from 'stripe'
import { createClient } from '@supabase/supabase-js'

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!)

function svc() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { persistSession: false } }
  )
}

function stripeStatusToDb(
  status: Stripe.Subscription.Status
): 'active' | 'past_due' | 'cancelled' | 'free' {
  if (status === 'active' || status === 'trialing') return 'active'
  if (status === 'past_due') return 'past_due'
  if (status === 'canceled') return 'cancelled'
  return 'free'
}

export async function POST(req: NextRequest) {
  const rawBody = await req.text()
  const sig = req.headers.get('stripe-signature') ?? ''

  let event: Stripe.Event
  try {
    event = stripe.webhooks.constructEvent(rawBody, sig, process.env.STRIPE_WEBHOOK_SECRET!)
  } catch {
    return NextResponse.json({ error: 'Invalid signature' }, { status: 400 })
  }

  try {
    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object as Stripe.Checkout.Session
        if (session.mode !== 'subscription' || !session.subscription) break

        const customerId = session.customer as string
        const subscriptionId = session.subscription as string
        const subscription = await stripe.subscriptions.retrieve(subscriptionId)
        const priceId = subscription.items.data[0]?.price.id

        const plan =
          priceId === process.env.STRIPE_BROKER_PRICE_ID
            ? 'broker_monthly'
            : 'carrier_monthly'

        const periodEnd = subscription.items.data[0]?.current_period_end ?? null
        await svc()
          .from('profiles')
          .update({
            stripe_subscription_id: subscriptionId,
            subscription_status: 'active',
            subscription_plan: plan,
            plan_period_end: periodEnd
              ? new Date(periodEnd * 1000).toISOString()
              : null,
          })
          .eq('stripe_customer_id', customerId)
        break
      }

      case 'customer.subscription.updated': {
        const sub = event.data.object as Stripe.Subscription
        const updatedPeriodEnd = sub.items.data[0]?.current_period_end ?? null
        await svc()
          .from('profiles')
          .update({
            subscription_status: stripeStatusToDb(sub.status),
            plan_period_end: updatedPeriodEnd
              ? new Date(updatedPeriodEnd * 1000).toISOString()
              : null,
          })
          .eq('stripe_subscription_id', sub.id)
        break
      }

      case 'customer.subscription.deleted': {
        const sub = event.data.object as Stripe.Subscription
        await svc()
          .from('profiles')
          .update({
            subscription_status: 'cancelled',
            subscription_plan: null,
          })
          .eq('stripe_subscription_id', sub.id)
        break
      }

      default:
        break
    }
  } catch (err) {
    console.error(`Webhook handler failed for ${event.type}:`, err)
  }

  return NextResponse.json({ received: true })
}
