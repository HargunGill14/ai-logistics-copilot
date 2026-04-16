'use client'

import { useEffect, useState } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Load, PricingResult } from '@/types'
import {
  Truck,
  DollarSign,
  TrendingUp,
  Sparkles,
  AlertTriangle,
  Copy,
  Check,
  ArrowRight,
  Plus,
} from 'lucide-react'
import type { LucideIcon } from 'lucide-react'

export default function PricingPage() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const supabase = createClient()
  const loadId = searchParams.get('loadId')

  const [load, setLoad] = useState<Load | null>(null)
  const [pricing, setPricing] = useState<PricingResult | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [resultVisible, setResultVisible] = useState(false)
  const [loadingStage, setLoadingStage] = useState(0)
  const [copied, setCopied] = useState(false)

  useEffect(() => {
    if (loadId) {
      fetchLoadAndPrice(loadId)
    }
  }, [loadId])

  useEffect(() => {
    if (!loading) return
    const timer = window.setInterval(() => {
      setLoadingStage((prev) => (prev + 1) % 3)
    }, 850)
    return () => window.clearInterval(timer)
  }, [loading])

  useEffect(() => {
    if (pricing) {
      const timer = window.setTimeout(() => setResultVisible(true), 80)
      return () => window.clearTimeout(timer)
    }
    setResultVisible(false)
  }, [pricing])

  async function fetchLoadAndPrice(id: string) {
    try {
      const { data: loadData } = await supabase
        .from('loads')
        .select('*')
        .eq('id', id)
        .single()

      if (!loadData) throw new Error('Load not found')
      setLoad(loadData)

      const response = await fetch('/api/pricing', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(loadData),
      })

      if (!response.ok) throw new Error('Failed to get pricing')

      const pricingData = await response.json()
      setPricing(pricingData)

      await supabase
        .from('loads')
        .update({
          carrier_cost: pricingData.carrier_cost,
          suggested_rate: pricingData.suggested_rate,
          margin_amount: pricingData.margin_amount,
          margin_percentage: pricingData.margin_percentage,
          risk_level: pricingData.risk_level,
          ai_recommendation: pricingData.recommendation,
          status: 'negotiating',
        })
        .eq('id', id)

    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Something went wrong')
    } finally {
      setLoading(false)
    }
  }

  async function handleCopyRate() {
    if (!pricing) return
    try {
      await navigator.clipboard.writeText(pricing.suggested_rate.toString())
      setCopied(true)
      window.setTimeout(() => setCopied(false), 1600)
    } catch {
      setCopied(false)
    }
  }

  if (loading) {
    return <PricingLoading stage={loadingStage} />
  }

  if (error) {
    return (
      <div className="max-w-3xl">
        <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-600">
          {error}
        </div>
      </div>
    )
  }

  if (!load || !pricing) return null

  const marginPct = pricing.margin_percentage
  const marginTone =
    marginPct < 10
      ? { text: 'text-red-600', bar: 'bg-red-500', accent: 'border-l-red-500' }
      : marginPct <= 15
        ? { text: 'text-orange-600', bar: 'bg-orange-500', accent: 'border-l-orange-500' }
        : { text: 'text-green-600', bar: 'bg-green-500', accent: 'border-l-green-500' }

  const riskTone = {
    low: 'bg-green-100 text-green-700',
    medium: 'bg-orange-100 text-orange-700',
    high: 'bg-red-100 text-red-700',
  }[pricing.risk_level]

  return (
    <div
      className={`max-w-5xl transition-all duration-500 ${
        resultVisible ? 'translate-y-0 opacity-100' : 'translate-y-3 opacity-0'
      }`}
    >
      <div className="mb-6 flex items-start justify-between gap-4">
        <div>
          <h1 className="text-xl font-semibold text-slate-900">AI Pricing Results</h1>
          <p className="text-sm text-slate-500">
            {load.pickup_location} → {load.delivery_location} ·{' '}
            {load.load_type.replace('_', ' ')} ·{' '}
            {load.distance_miles.toLocaleString()} mi
          </p>
        </div>
        <div className="flex items-center gap-2">
          <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium capitalize ${riskTone}`}>
            <AlertTriangle size={12} />
            {pricing.risk_level} risk
          </span>
          <span className="inline-flex items-center gap-1.5 rounded-full bg-blue-100 px-2.5 py-1 text-xs font-medium text-blue-700">
            <Sparkles size={12} />
            AI Generated
          </span>
        </div>
      </div>

      <div className="mb-4 grid grid-cols-1 gap-4 md:grid-cols-3">
        <StatCard
          label="Carrier Cost"
          value={`$${pricing.carrier_cost.toLocaleString()}`}
          icon={Truck}
          accentClass="border-l-blue-500"
          iconWrapperClass="bg-blue-50"
          iconClass="text-blue-600"
          footer={`Est. at $${pricing.market_rate_per_mile.toFixed(2)}/mi market`}
        />

        <div className="group relative rounded-xl border border-slate-200 border-l-4 border-l-[#1a3a5c] bg-white p-5 shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0 flex-1">
              <div className="text-xs font-medium uppercase tracking-wider text-slate-500">
                Suggested Rate
              </div>
              <div className="mt-2 flex items-baseline gap-2">
                <span className="text-3xl font-semibold tabular-nums text-slate-900">
                  ${pricing.suggested_rate.toLocaleString()}
                </span>
                <button
                  type="button"
                  onClick={handleCopyRate}
                  aria-label="Copy suggested rate"
                  className={`inline-flex h-7 w-7 items-center justify-center rounded-md border transition-all duration-200 ${
                    copied
                      ? 'border-green-200 bg-green-50 text-green-600'
                      : 'border-slate-200 text-slate-500 hover:border-[#1a3a5c]/30 hover:bg-[#1a3a5c]/5 hover:text-[#1a3a5c]'
                  }`}
                >
                  {copied ? <Check size={14} /> : <Copy size={14} />}
                </button>
              </div>
              <div className="mt-2 text-xs text-slate-400">
                {copied ? 'Copied to clipboard' : 'Click to copy'}
              </div>
            </div>
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-[#1a3a5c]/10">
              <DollarSign size={18} className="text-[#1a3a5c]" />
            </div>
          </div>
        </div>

        <div className={`group relative rounded-xl border border-slate-200 ${marginTone.accent} border-l-4 bg-white p-5 shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md`}>
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0 flex-1">
              <div className="text-xs font-medium uppercase tracking-wider text-slate-500">
                Margin
              </div>
              <div className={`mt-2 text-3xl font-semibold tabular-nums ${marginTone.text}`}>
                {marginPct.toFixed(1)}%
              </div>
              <div className="mt-2 text-xs text-slate-400">
                ${pricing.margin_amount.toLocaleString()} expected
              </div>
            </div>
            <div className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg ${
              marginTone.text === 'text-red-600' ? 'bg-red-50' : marginTone.text === 'text-orange-600' ? 'bg-orange-50' : 'bg-green-50'
            }`}>
              <TrendingUp size={18} className={marginTone.text} />
            </div>
          </div>
          <div className="mt-3">
            <div className="h-2 overflow-hidden rounded-full bg-slate-100">
              <div
                className={`h-full rounded-full transition-all duration-700 ${marginTone.bar}`}
                style={{ width: `${Math.min(Math.max(marginPct * 4, 4), 100)}%` }}
              />
            </div>
            <div className="mt-1 flex justify-between text-[10px] text-slate-400">
              <span>0%</span>
              <span>10%</span>
              <span>15%</span>
              <span>25%+</span>
            </div>
          </div>
        </div>
      </div>

      <div className="mb-4 grid grid-cols-1 gap-4 md:grid-cols-3">
        <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm md:col-span-2">
          <div className="mb-3 flex items-center justify-between">
            <h2 className="text-sm font-semibold text-slate-900">Pricing breakdown</h2>
            <span className="text-xs text-slate-400">vs shipper offer</span>
          </div>
          <div className="space-y-1">
            <BreakdownRow label="Shipper offered rate" value={`$${load.shipper_rate.toLocaleString()}`} />
            <BreakdownRow label="Est. carrier cost" value={`$${pricing.carrier_cost.toLocaleString()}`} />
            <BreakdownRow
              label="Suggested broker rate"
              value={`$${pricing.suggested_rate.toLocaleString()}`}
              highlight
            />
            <BreakdownRow
              label="Market avg rate / mile"
              value={`$${pricing.market_rate_per_mile.toFixed(2)}`}
            />
            <BreakdownRow
              label="Expected margin"
              value={`$${pricing.margin_amount.toLocaleString()} (${marginPct.toFixed(1)}%)`}
              valueClass={marginTone.text}
            />
          </div>
        </div>

        <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="mb-3 flex items-center gap-2">
            <AlertTriangle size={14} className="text-amber-600" />
            <h2 className="text-sm font-semibold text-slate-900">Risk factors</h2>
          </div>
          {pricing.risk_factors.length > 0 ? (
            <ul className="space-y-2">
              {pricing.risk_factors.map((factor, i) => (
                <li key={i} className="flex items-start gap-2">
                  <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-amber-500" />
                  <span className="text-xs leading-relaxed text-slate-600">{factor}</span>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-xs text-slate-500">No notable risks flagged.</p>
          )}
        </div>
      </div>

      <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
        <div className="mb-3 flex items-center gap-2">
          <Sparkles size={14} className="text-[#1a3a5c]" />
          <h2 className="text-sm font-semibold text-slate-900">AI recommendation</h2>
        </div>
        <p className="mb-5 text-sm leading-relaxed text-slate-600">{pricing.recommendation}</p>
        <div className="flex flex-col gap-2 sm:flex-row">
          <button
            type="button"
            onClick={() => router.push(`/negotiate?loadId=${loadId}`)}
            className="inline-flex flex-1 items-center justify-center gap-1.5 rounded-lg bg-[#1a3a5c] px-4 py-2.5 text-sm font-medium text-white shadow-sm transition-colors hover:bg-[#1a3a5c]/90"
          >
            Generate emails
            <ArrowRight size={15} />
          </button>
          <button
            type="button"
            onClick={() => router.push('/loads/new')}
            className="inline-flex items-center justify-center gap-1.5 rounded-lg border border-slate-200 bg-white px-4 py-2.5 text-sm font-medium text-slate-700 transition-colors hover:border-[#1a3a5c]/30 hover:bg-[#1a3a5c]/5 hover:text-[#1a3a5c]"
          >
            <Plus size={15} />
            New load
          </button>
        </div>
      </div>
    </div>
  )
}

interface StatCardProps {
  label: string
  value: string
  icon: LucideIcon
  accentClass: string
  iconWrapperClass: string
  iconClass: string
  footer?: string
}

function StatCard({
  label,
  value,
  icon: Icon,
  accentClass,
  iconWrapperClass,
  iconClass,
  footer,
}: StatCardProps) {
  return (
    <div
      className={`group relative rounded-xl border border-slate-200 ${accentClass} border-l-4 bg-white p-5 shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md`}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <div className="text-xs font-medium uppercase tracking-wider text-slate-500">
            {label}
          </div>
          <div className="mt-2 text-3xl font-semibold tabular-nums text-slate-900">
            {value}
          </div>
          {footer && <div className="mt-2 text-xs text-slate-400">{footer}</div>}
        </div>
        <div className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg ${iconWrapperClass}`}>
          <Icon size={18} className={iconClass} />
        </div>
      </div>
    </div>
  )
}

interface BreakdownRowProps {
  label: string
  value: string
  highlight?: boolean
  valueClass?: string
}

function BreakdownRow({ label, value, highlight, valueClass }: BreakdownRowProps) {
  return (
    <div className="flex items-center justify-between border-b border-slate-100 py-2 last:border-0">
      <span className="text-sm text-slate-500">{label}</span>
      <span
        className={`text-sm font-medium tabular-nums ${
          valueClass ?? (highlight ? 'text-[#1a3a5c]' : 'text-slate-900')
        }`}
      >
        {value}
      </span>
    </div>
  )
}

interface PricingLoadingProps {
  stage: number
}

function PricingLoading({ stage }: PricingLoadingProps) {
  const steps = [
    'Scanning lane and market activity',
    'Modeling carrier cost and risk',
    'Computing suggested rate and margin',
  ]
  return (
    <div className="max-w-3xl">
      <div className="mb-6">
        <h1 className="text-xl font-semibold text-slate-900">AI Pricing</h1>
        <p className="text-sm text-slate-500">Analyzing load and market conditions…</p>
      </div>
      <div className="overflow-hidden rounded-xl border border-slate-200 bg-white p-8 shadow-sm">
        <div className="mb-5 flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-[#1a3a5c]/10">
            <Sparkles size={18} className="text-[#1a3a5c]" />
          </div>
          <div className="flex flex-1 items-center gap-2">
            <span className="text-sm font-medium text-slate-700">Analyzing market data</span>
            <span className="flex items-center gap-1">
              <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-[#1a3a5c] [animation-delay:-0.3s]" />
              <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-[#1a3a5c] [animation-delay:-0.15s]" />
              <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-[#1a3a5c]" />
            </span>
          </div>
        </div>
        <div className="mb-5 h-2 overflow-hidden rounded-full bg-slate-100">
          <div className="h-full w-1/2 animate-pulse rounded-full bg-gradient-to-r from-[#1a3a5c]/40 via-[#1a3a5c] to-[#1a3a5c]/40" />
        </div>
        <div className="space-y-2.5">
          {steps.map((step, i) => (
            <div key={step} className="flex items-center gap-2.5 text-sm">
              <div
                className={`h-2 w-2 rounded-full transition-colors duration-300 ${
                  i <= stage ? 'bg-[#1a3a5c]' : 'bg-slate-200'
                }`}
              />
              <span className={i <= stage ? 'text-slate-700' : 'text-slate-400'}>{step}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
