'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Check, Loader2, CreditCard } from 'lucide-react'

interface PlanState {
  role: string | null
  subscription_status: string
  subscription_plan: string | null
}

const BROKER_FEATURES = [
  'Unlimited load posting to marketplace',
  'Full marketplace access & bidding management',
  'AI load pricing engine',
  'Carrier fraud shield & FMCSA verification',
  'Real-time shipment tracking',
  'AI negotiation email generator',
  'Performance analytics',
]

const CARRIER_FEATURES = [
  'Unlimited bids on posted loads',
  'Browse full load marketplace',
  'Performance scorecard',
  'Full load history',
  'Carrier trust profile',
  'FMCSA verification badge',
]

export default function PlansPage() {
  const router = useRouter()
  const supabase = createClient()

  const [plan, setPlan] = useState<PlanState | null>(null)
  const [loading, setLoading] = useState(true)
  const [checkingOut, setCheckingOut] = useState<'broker' | 'carrier' | null>(null)
  const [managingBilling, setManagingBilling] = useState(false)

  useEffect(() => {
    async function load() {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { router.push('/login'); return }

      const { data } = await supabase
        .from('profiles')
        .select('role, subscription_status, subscription_plan')
        .eq('id', user.id)
        .single()

      setPlan({
        role: data?.role ?? null,
        subscription_status: data?.subscription_status ?? 'free',
        subscription_plan: data?.subscription_plan ?? null,
      })
      setLoading(false)
    }
    load()
  }, [supabase, router])

  async function handleUpgrade(planKey: 'broker' | 'carrier') {
    setCheckingOut(planKey)
    try {
      const res = await fetch('/api/billing/checkout', { method: 'POST' })
      const json = await res.json()
      if (json.url) {
        window.location.href = json.url
      }
    } catch {
      setCheckingOut(null)
    }
  }

  function handleManageBilling() {
    setManagingBilling(true)
    window.location.href = '/api/billing/portal'
  }

  const isActiveBroker =
    plan?.subscription_status === 'active' && plan.subscription_plan === 'broker_monthly'
  const isActiveCarrier =
    plan?.subscription_status === 'active' && plan.subscription_plan === 'carrier_monthly'
  const hasActivePlan = isActiveBroker || isActiveCarrier

  if (loading) {
    return (
      <div className="flex items-center justify-center py-24">
        <Loader2 size={24} className="animate-spin text-slate-400" />
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-4xl">
      <div className="mb-10 text-center">
        <h1 className="text-2xl font-bold text-slate-900">Choose your plan</h1>
        <p className="mt-2 text-sm text-slate-500">
          Start free, upgrade when you&apos;re ready. Cancel anytime.
        </p>
      </div>

      {hasActivePlan && (
        <div className="mb-8 flex items-center justify-between rounded-xl border border-emerald-200 bg-emerald-50 px-5 py-4">
          <div className="flex items-center gap-3">
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-emerald-100">
              <Check size={16} className="text-emerald-600" />
            </div>
            <div>
              <p className="text-sm font-semibold text-emerald-900">
                You&apos;re on the {isActiveBroker ? 'Broker' : 'Carrier'} plan
              </p>
              <p className="text-xs text-emerald-700">All features are unlocked</p>
            </div>
          </div>
          <button
            onClick={handleManageBilling}
            disabled={managingBilling}
            className="flex items-center gap-2 rounded-lg border border-emerald-300 bg-white px-3 py-1.5 text-xs font-medium text-emerald-800 transition-colors hover:bg-emerald-50 disabled:opacity-60"
          >
            {managingBilling ? (
              <Loader2 size={12} className="animate-spin" />
            ) : (
              <CreditCard size={12} />
            )}
            Manage billing
          </button>
        </div>
      )}

      <div className="grid gap-6 sm:grid-cols-2">
        {/* Carrier Card */}
        <PlanCard
          title="Carrier"
          price={49}
          features={CARRIER_FEATURES}
          isCurrent={isActiveCarrier}
          isRelevant={plan?.role === 'carrier' || plan?.role === null}
          loading={checkingOut === 'carrier'}
          onUpgrade={() => handleUpgrade('carrier')}
        />

        {/* Broker Card */}
        <PlanCard
          title="Broker"
          price={149}
          features={BROKER_FEATURES}
          isCurrent={isActiveBroker}
          isRelevant={plan?.role === 'broker' || plan?.role === null}
          highlight
          loading={checkingOut === 'broker'}
          onUpgrade={() => handleUpgrade('broker')}
        />
      </div>

      <p className="mt-8 text-center text-xs text-slate-400">
        Payments processed securely by Stripe. Cancel anytime from billing portal.
      </p>
    </div>
  )
}

interface PlanCardProps {
  title: string
  price: number
  features: string[]
  isCurrent: boolean
  isRelevant: boolean
  highlight?: boolean
  loading: boolean
  onUpgrade: () => void
}

function PlanCard({
  title,
  price,
  features,
  isCurrent,
  isRelevant,
  highlight = false,
  loading,
  onUpgrade,
}: PlanCardProps) {
  return (
    <div
      className={`relative flex flex-col rounded-2xl border p-6 shadow-sm ${
        highlight
          ? 'border-[#1a3a5c] bg-[#1a3a5c] text-white'
          : 'border-slate-200 bg-white text-slate-900'
      }`}
    >
      {isCurrent && (
        <div className="absolute -top-3 left-1/2 -translate-x-1/2">
          <span className="rounded-full bg-emerald-500 px-3 py-1 text-xs font-semibold text-white shadow">
            Current plan
          </span>
        </div>
      )}

      <div className="mb-6">
        <p className={`text-sm font-semibold uppercase tracking-wide ${highlight ? 'text-blue-200' : 'text-slate-500'}`}>
          {title}
        </p>
        <div className="mt-2 flex items-end gap-1">
          <span className="text-4xl font-bold">${price}</span>
          <span className={`mb-1 text-sm ${highlight ? 'text-blue-200' : 'text-slate-500'}`}>/month</span>
        </div>
      </div>

      <ul className="mb-8 flex-1 space-y-3">
        {features.map((f) => (
          <li key={f} className="flex items-start gap-2.5 text-sm">
            <Check
              size={15}
              className={`mt-0.5 shrink-0 ${highlight ? 'text-blue-300' : 'text-emerald-500'}`}
            />
            <span className={highlight ? 'text-blue-100' : 'text-slate-600'}>{f}</span>
          </li>
        ))}
      </ul>

      {isCurrent ? (
        <div
          className={`rounded-xl py-2.5 text-center text-sm font-semibold ${
            highlight ? 'bg-white/20 text-white' : 'bg-slate-100 text-slate-500'
          }`}
        >
          Current Plan
        </div>
      ) : (
        <button
          onClick={onUpgrade}
          disabled={loading || !isRelevant}
          className={`flex items-center justify-center gap-2 rounded-xl py-2.5 text-sm font-semibold transition-all disabled:opacity-50 ${
            highlight
              ? 'bg-white text-[#1a3a5c] hover:bg-blue-50'
              : 'bg-[#1a3a5c] text-white hover:bg-[#1a3a5c]/90'
          }`}
        >
          {loading ? (
            <>
              <Loader2 size={14} className="animate-spin" />
              Redirecting…
            </>
          ) : (
            'Upgrade Now'
          )}
        </button>
      )}
    </div>
  )
}
