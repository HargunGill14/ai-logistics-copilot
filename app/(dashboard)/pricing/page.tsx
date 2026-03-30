'use client'

import { useEffect, useState } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Load, PricingResult } from '@/types'

export default function PricingPage() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const supabase = createClient()
  const loadId = searchParams.get('loadId')

  const [load, setLoad] = useState<Load | null>(null)
  const [pricing, setPricing] = useState<PricingResult | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    if (loadId) {
      fetchLoadAndPrice(loadId)
    }
  }, [loadId])

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

  if (loading) {
    return (
      <div className="max-w-3xl">
        <div className="mb-6">
          <h1 className="text-xl font-semibold text-slate-900">AI Pricing</h1>
          <p className="text-sm text-slate-500">Analyzing load and market conditions...</p>
        </div>
        <div className="bg-white rounded-lg border border-slate-200 p-12 text-center">
          <div className="inline-flex items-center gap-3 text-slate-600">
            <div className="w-5 h-5 border-2 border-slate-300 border-t-slate-600 rounded-full animate-spin"></div>
            <span className="text-sm">AI is calculating pricing and risk...</span>
          </div>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="max-w-3xl">
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-red-600 text-sm">{error}</div>
      </div>
    )
  }

  if (!load || !pricing) return null

  const marginColor = pricing.margin_percentage >= 15
    ? 'text-green-600'
    : pricing.margin_percentage >= 8
    ? 'text-amber-600'
    : 'text-red-600'

  const riskColor = {
    low: 'bg-green-100 text-green-700',
    medium: 'bg-amber-100 text-amber-700',
    high: 'bg-red-100 text-red-700',
  }[pricing.risk_level]

  return (
    <div className="max-w-3xl">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-xl font-semibold text-slate-900">AI Pricing Results</h1>
          <p className="text-sm text-slate-500">
            {load.pickup_location} → {load.delivery_location} · {load.load_type.replace('_', ' ')} · {load.distance_miles} mi
          </p>
        </div>
        <span className="text-xs bg-blue-100 text-blue-700 px-2.5 py-1 rounded-full font-medium">
          AI Generated
        </span>
      </div>

      <div className="grid grid-cols-2 gap-4 mb-4">
        {/* Pricing Breakdown */}
        <div className="bg-white rounded-lg border border-slate-200 p-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm font-semibold text-slate-900">Pricing breakdown</h2>
            <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${riskColor}`}>
              {pricing.risk_level} risk
            </span>
          </div>
          <div className="space-y-3">
            {[
              { label: 'Shipper offered rate', value: `$${load.shipper_rate.toLocaleString()}` },
              { label: 'Est. carrier cost', value: `$${pricing.carrier_cost.toLocaleString()}` },
              { label: 'Suggested broker rate', value: `$${pricing.suggested_rate.toLocaleString()}`, highlight: true },
              { label: 'Market avg rate/mi', value: `$${pricing.market_rate_per_mile.toFixed(2)}/mi` },
            ].map((row) => (
              <div key={row.label} className="flex justify-between items-center py-1.5 border-b border-slate-100 last:border-0">
                <span className="text-sm text-slate-500">{row.label}</span>
                <span className={`text-sm font-medium ${row.highlight ? 'text-green-600' : 'text-slate-900'}`}>
                  {row.value}
                </span>
              </div>
            ))}
            <div className="pt-1">
              <div className="flex justify-between items-center mb-1.5">
                <span className="text-sm text-slate-500">Expected margin</span>
                <span className={`text-sm font-semibold ${marginColor}`}>
                  ${pricing.margin_amount.toLocaleString()} ({pricing.margin_percentage.toFixed(1)}%)
                </span>
              </div>
              <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                <div
                  className={`h-full rounded-full ${
                    pricing.margin_percentage >= 15 ? 'bg-green-500' :
                    pricing.margin_percentage >= 8 ? 'bg-amber-500' : 'bg-red-500'
                  }`}
                  style={{ width: `${Math.min(pricing.margin_percentage * 2, 100)}%` }}
                />
              </div>
            </div>
          </div>
        </div>

        {/* Risk + Recommendation */}
        <div className="flex flex-col gap-4">
          <div className="bg-white rounded-lg border border-slate-200 p-5">
            <h2 className="text-sm font-semibold text-slate-900 mb-3">Risk assessment</h2>
            <div className="space-y-2">
              {pricing.risk_factors.map((factor, i) => (
                <div key={i} className="flex items-start gap-2">
                  <div className="w-4 h-4 rounded-full bg-amber-100 flex items-center justify-center flex-shrink-0 mt-0.5">
                    <span className="text-amber-600 text-xs">!</span>
                  </div>
                  <span className="text-xs text-slate-600">{factor}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-white rounded-lg border border-slate-200 p-5 flex-1">
            <h2 className="text-sm font-semibold text-slate-900 mb-2">AI recommendation</h2>
            <p className="text-xs text-slate-600 leading-relaxed mb-4">{pricing.recommendation}</p>
            <div className="flex flex-col gap-2">
              <button
                onClick={() => router.push(`/negotiate?loadId=${loadId}`)}
                className="w-full px-4 py-2 rounded-lg text-sm font-medium text-white"
                style={{ backgroundColor: '#1a3a5c' }}>
                Generate emails →
              </button>
              <button
                onClick={() => router.push('/loads/new')}
                className="w-full px-4 py-2 rounded-lg text-sm font-medium text-slate-600 border border-slate-200 hover:bg-slate-50">
                New load
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
