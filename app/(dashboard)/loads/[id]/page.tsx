'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Load, Negotiation } from '@/types'

const statusStyles: Record<string, string> = {
  draft: 'bg-slate-100 text-slate-600',
  pricing: 'bg-blue-100 text-blue-700',
  negotiating: 'bg-purple-100 text-purple-700',
  active: 'bg-green-100 text-green-700',
  completed: 'bg-gray-100 text-gray-600',
}

const riskStyles: Record<string, string> = {
  low: 'text-green-600',
  medium: 'text-amber-600',
  high: 'text-red-600',
}

const loadTypeLabels: Record<string, string> = {
  dry_van: 'Dry Van',
  reefer: 'Reefer',
  flatbed: 'Flatbed',
  step_deck: 'Step Deck',
}

const negotiationStatusStyles: Record<string, string> = {
  pending: 'bg-slate-100 text-slate-600',
  awaiting_reply: 'bg-blue-100 text-blue-700',
  accepted: 'bg-green-100 text-green-700',
  rejected: 'bg-red-100 text-red-600',
}

export default function LoadDetailPage() {
  const params = useParams()
  const router = useRouter()
  const supabase = createClient()
  const id = params.id as string

  const [load, setLoad] = useState<Load | null>(null)
  const [negotiations, setNegotiations] = useState<Negotiation[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [updatingStatus, setUpdatingStatus] = useState(false)
  const [copied, setCopied] = useState<string | null>(null)

  useEffect(() => {
    fetchData()
  }, [id])

  async function fetchData() {
    try {
      const [{ data: loadData, error: loadErr }, { data: negsData }] = await Promise.all([
        supabase.from('loads').select('*').eq('id', id).single(),
        supabase.from('negotiations').select('*').eq('load_id', id).order('created_at', { ascending: false }),
      ])

      if (loadErr || !loadData) throw new Error('Load not found')
      setLoad(loadData)
      setNegotiations(negsData || [])
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to load details')
    } finally {
      setLoading(false)
    }
  }

  async function updateStatus(newStatus: Load['status']) {
    if (!load) return
    setUpdatingStatus(true)
    const { error: updateErr } = await supabase
      .from('loads')
      .update({ status: newStatus })
      .eq('id', id)
    if (!updateErr) setLoad({ ...load, status: newStatus })
    setUpdatingStatus(false)
  }

  async function handleCopy(text: string, key: string) {
    await navigator.clipboard.writeText(text)
    setCopied(key)
    setTimeout(() => setCopied(null), 2000)
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="flex items-center gap-3 text-slate-500 text-sm">
          <div className="w-4 h-4 border-2 border-slate-300 border-t-slate-600 rounded-full animate-spin" />
          Loading load details...
        </div>
      </div>
    )
  }

  if (error || !load) {
    return (
      <div className="max-w-3xl">
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-red-600 text-sm mb-4">
          {error || 'Load not found'}
        </div>
        <button
          onClick={() => router.push('/loads')}
          className="text-sm text-slate-600 hover:text-slate-900">
          ← Back to loads
        </button>
      </div>
    )
  }

  const hasPricing = load.carrier_cost != null && load.suggested_rate != null

  return (
    <div className="max-w-4xl">
      {/* Header */}
      <div className="flex items-start justify-between mb-6">
        <div>
          <button
            onClick={() => router.push('/loads')}
            className="text-xs text-slate-400 hover:text-slate-600 mb-2 flex items-center gap-1">
            ← Back to loads
          </button>
          <h1 className="text-xl font-semibold text-slate-900">
            {load.pickup_location} → {load.delivery_location}
          </h1>
          <p className="text-sm text-slate-500 mt-0.5 font-mono">#{load.id.slice(0, 8).toUpperCase()}</p>
        </div>
        <div className="flex items-center gap-2">
          <span className={`text-xs px-2.5 py-1 rounded-full font-medium ${statusStyles[load.status]}`}>
            {load.status}
          </span>
          {load.status === 'draft' || load.status === 'pricing' ? (
            <button
              onClick={() => router.push(`/pricing?loadId=${load.id}`)}
              className="text-sm px-4 py-1.5 rounded-lg font-medium text-white"
              style={{ backgroundColor: '#1a3a5c' }}>
              Run AI Pricing
            </button>
          ) : load.status === 'negotiating' || load.status === 'active' ? (
            <button
              onClick={() => router.push(`/negotiate?loadId=${load.id}`)}
              className="text-sm px-4 py-1.5 rounded-lg font-medium text-white"
              style={{ backgroundColor: '#1a3a5c' }}>
              Open Negotiation
            </button>
          ) : null}
        </div>
      </div>

      <div className="space-y-4">
        {/* Load Details */}
        <div className="bg-white rounded-lg border border-slate-200 p-5">
          <h2 className="text-sm font-semibold text-slate-900 mb-4">Load Details</h2>
          <div className="grid grid-cols-2 gap-x-8 gap-y-3 text-sm">
            <div className="flex justify-between">
              <span className="text-slate-500">Pickup</span>
              <span className="font-medium text-slate-900">{load.pickup_location}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">Delivery</span>
              <span className="font-medium text-slate-900">{load.delivery_location}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">Load type</span>
              <span className="font-medium text-slate-900">{loadTypeLabels[load.load_type] || load.load_type}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">Distance</span>
              <span className="font-medium text-slate-900">{load.distance_miles.toLocaleString()} mi</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">Weight</span>
              <span className="font-medium text-slate-900">{load.weight_lbs.toLocaleString()} lbs</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">Created</span>
              <span className="font-medium text-slate-900">
                {new Date(load.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
              </span>
            </div>
          </div>
        </div>

        {/* Pricing */}
        {hasPricing ? (
          <div className="bg-white rounded-lg border border-slate-200 p-5">
            <h2 className="text-sm font-semibold text-slate-900 mb-4">AI Pricing Analysis</h2>
            <div className="grid grid-cols-4 gap-4 mb-4">
              <div className="bg-slate-50 rounded-lg p-3">
                <p className="text-xs text-slate-500 mb-1">Shipper rate</p>
                <p className="text-lg font-semibold text-slate-900">${load.shipper_rate.toLocaleString()}</p>
              </div>
              <div className="bg-slate-50 rounded-lg p-3">
                <p className="text-xs text-slate-500 mb-1">Carrier cost</p>
                <p className="text-lg font-semibold text-slate-900">${load.carrier_cost!.toLocaleString()}</p>
              </div>
              <div className="bg-slate-50 rounded-lg p-3">
                <p className="text-xs text-slate-500 mb-1">Suggested rate</p>
                <p className="text-lg font-semibold text-slate-900">${load.suggested_rate!.toLocaleString()}</p>
              </div>
              <div className="bg-slate-50 rounded-lg p-3">
                <p className="text-xs text-slate-500 mb-1">Margin</p>
                <p className={`text-lg font-semibold ${
                  (load.margin_percentage ?? 0) >= 15
                    ? 'text-green-600'
                    : (load.margin_percentage ?? 0) >= 8
                    ? 'text-amber-600'
                    : 'text-red-600'
                }`}>
                  {load.margin_percentage?.toFixed(1)}%
                </p>
                <p className="text-xs text-slate-400">${load.margin_amount?.toLocaleString()}</p>
              </div>
            </div>
            {load.risk_level && (
              <div className="flex items-center gap-2 text-sm">
                <span className="text-slate-500">Risk level:</span>
                <span className={`font-medium capitalize ${riskStyles[load.risk_level]}`}>
                  {load.risk_level}
                </span>
              </div>
            )}
          </div>
        ) : (
          <div className="bg-white rounded-lg border border-slate-200 p-5">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-sm font-semibold text-slate-900">Pricing</h2>
                <p className="text-sm text-slate-500 mt-0.5">Shipper rate: ${load.shipper_rate.toLocaleString()}</p>
                <p className="text-xs text-slate-400 mt-1">AI pricing not yet run for this load</p>
              </div>
              <button
                onClick={() => router.push(`/pricing?loadId=${load.id}`)}
                className="text-sm px-4 py-2 rounded-lg font-medium border border-slate-200 text-slate-600 hover:bg-slate-50">
                Run AI Pricing
              </button>
            </div>
          </div>
        )}

        {/* Negotiations */}
        <div className="bg-white rounded-lg border border-slate-200">
          <div className="flex items-center justify-between px-5 py-3 border-b border-slate-100">
            <div>
              <h2 className="text-sm font-semibold text-slate-900">Negotiation History</h2>
              <p className="text-xs text-slate-400 mt-0.5">{negotiations.length} {negotiations.length === 1 ? 'thread' : 'threads'}</p>
            </div>
            {hasPricing && (
              <button
                onClick={() => router.push(`/negotiate?loadId=${load.id}`)}
                className="text-xs px-3 py-1.5 rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-50">
                + New negotiation
              </button>
            )}
          </div>

          {negotiations.length === 0 ? (
            <div className="p-8 text-center">
              <p className="text-sm text-slate-400">No negotiation threads yet</p>
              {hasPricing && (
                <button
                  onClick={() => router.push(`/negotiate?loadId=${load.id}`)}
                  className="mt-2 text-xs font-medium"
                  style={{ color: '#1a3a5c' }}>
                  Generate negotiation emails →
                </button>
              )}
            </div>
          ) : (
            <div className="divide-y divide-slate-100">
              {negotiations.map((neg) => (
                <div key={neg.id} className="p-5">
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${negotiationStatusStyles[neg.status]}`}>
                        {neg.status.replace('_', ' ')}
                      </span>
                      {neg.counteroffer_price && (
                        <span className="ml-2 text-xs text-slate-500">
                          Counteroffer: ${neg.counteroffer_price.toLocaleString()}
                        </span>
                      )}
                    </div>
                    <span className="text-xs text-slate-400">
                      {new Date(neg.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                    </span>
                  </div>

                  {neg.shipper_email && (
                    <div className="mb-3">
                      <div className="flex items-center justify-between mb-1">
                        <p className="text-xs font-medium text-slate-600">Shipper email</p>
                        <button
                          onClick={() => handleCopy(neg.shipper_email!, `shipper-${neg.id}`)}
                          className="text-xs text-slate-400 hover:text-slate-600">
                          {copied === `shipper-${neg.id}` ? '✓ Copied' : 'Copy'}
                        </button>
                      </div>
                      <pre className="text-xs text-slate-600 whitespace-pre-wrap font-sans bg-slate-50 rounded p-3 leading-relaxed max-h-40 overflow-y-auto">
                        {neg.shipper_email}
                      </pre>
                    </div>
                  )}

                  {neg.carrier_message && (
                    <div>
                      <div className="flex items-center justify-between mb-1">
                        <p className="text-xs font-medium text-slate-600">Carrier message</p>
                        <button
                          onClick={() => handleCopy(neg.carrier_message!, `carrier-${neg.id}`)}
                          className="text-xs text-slate-400 hover:text-slate-600">
                          {copied === `carrier-${neg.id}` ? '✓ Copied' : 'Copy'}
                        </button>
                      </div>
                      <pre className="text-xs text-slate-600 whitespace-pre-wrap font-sans bg-slate-50 rounded p-3 leading-relaxed max-h-32 overflow-y-auto">
                        {neg.carrier_message}
                      </pre>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Status Controls */}
        <div className="bg-white rounded-lg border border-slate-200 p-5">
          <h2 className="text-sm font-semibold text-slate-900 mb-3">Update Status</h2>
          <div className="flex gap-2 flex-wrap">
            {(['draft', 'pricing', 'negotiating', 'active', 'completed'] as Load['status'][]).map((s) => (
              <button
                key={s}
                disabled={load.status === s || updatingStatus}
                onClick={() => updateStatus(s)}
                className={`text-xs px-3 py-1.5 rounded-lg border font-medium transition-colors disabled:opacity-40 capitalize
                  ${load.status === s
                    ? 'border-slate-900 text-slate-900 bg-slate-50'
                    : 'border-slate-200 text-slate-600 hover:bg-slate-50'
                  }`}>
                {s}
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
