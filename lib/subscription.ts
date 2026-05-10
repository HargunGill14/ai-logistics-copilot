import { createClient } from '@supabase/supabase-js'

export type SubscriptionStatus = 'free' | 'active' | 'past_due' | 'cancelled'
export type SubscriptionPlan = 'broker_monthly' | 'carrier_monthly' | null

export interface UserPlan {
  subscription_status: SubscriptionStatus
  subscription_plan: SubscriptionPlan
  role: string | null
}

function serviceClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!url || !key) throw new Error('Supabase env vars missing')
  return createClient(url, key, { auth: { persistSession: false } })
}

export async function getUserPlan(userId: string): Promise<UserPlan> {
  const { data } = await serviceClient()
    .from('profiles')
    .select('subscription_status, subscription_plan, role')
    .eq('id', userId)
    .single()

  return {
    subscription_status: (data?.subscription_status as SubscriptionStatus) ?? 'free',
    subscription_plan: (data?.subscription_plan as SubscriptionPlan) ?? null,
    role: data?.role ?? null,
  }
}

export async function canPostLoad(userId: string): Promise<boolean> {
  const plan = await getUserPlan(userId)
  if (plan.subscription_status === 'active') return true

  const startOfMonth = new Date()
  startOfMonth.setDate(1)
  startOfMonth.setHours(0, 0, 0, 0)

  const { count } = await serviceClient()
    .from('marketplace_loads')
    .select('id', { count: 'exact', head: true })
    .eq('broker_id', userId)
    .gte('created_at', startOfMonth.toISOString())

  return (count ?? 0) < 3
}

export async function canBid(userId: string): Promise<boolean> {
  const plan = await getUserPlan(userId)
  return plan.subscription_status === 'active'
}
