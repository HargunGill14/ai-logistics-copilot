'use client'

import { useEffect, useState } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Load } from '@/types'

interface NegotiationContent {
  shipper_email: string
  carrier_message: string
  counteroffer_price: number
  counteroffer_note: string
}

export default function NegotiatePage() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const supabase = createClient()
  const loadId = searchParams.get('loadId')

  const [load, setLoad] = useState<Load | null>(null)
  const [content, setContent] = useState<NegotiationContent | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [copied, setCopied] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    if (loadId) fetchLoadAndGenerate(loadId)
  }, [loadId])

  async function fetchLoadAndGenerate(id: string) {
    try {
      const { data: loadData } = await supabase
        .from('loads')
        .select('*')
        .eq('id', id)
        .single()

      if (!loadData) throw new Error('Load not found')
      setLoad(loadData)

      const response = await fetch('/api/negotiate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(loadData),
      })

      if (!response.ok) throw new Error('Failed to generate negotiation content')
      const data = await response.json()
      setContent(data)

      await supabase.from('negotiations').insert({
        load_id: id,
        organization_id: loadData.organization_id,
        shipper_email: data.shipper_email,
        carrier_message: data.carrier_message,
        counteroffer_price: data.counteroffer_price,
        status: 'pending',
      })

    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Something went wrong')
    } finally {
      setLoading(false)
    }
  }

  async function handleCopy(text: string, key: string) {
    await navigator.clipboard.writeText(text)
    setCopied(key)
    setTimeout(() => setCopied(null), 2000)
  }

  async function handleSendAndSave() {
    setSaving(true)
    if (loadId) {
      await supabase
        .from('loads')
        .update({ status: 'active' })
        .eq('id', loadId)
    }
    router.push('/loads')
  }

  if (loading) {
    return (
      <div className="max-w-3xl">
        <div className="mb-6">
          <h1 className="text-xl font-semibold text-slate-900">Negotiation Assistant</h1>
          <p className="text-sm text-slate-500">AI is drafting your messages...</p>
        </div>
        <div className="bg-white rounded-lg border border-slate-200 p-12 text-center">
          <div className="inline-flex items-center gap-3 text-slate-600">
            <div className="w-5 h-5 border-2 border-slate-300 border-t-slate-600 rounded-full animate-spin"></div>
            <span className="text-sm">Generating negotiation emails...</span>
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

  if (!load || !content) return null

  return (
    <div className="max-w-3xl">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-xl font-semibold text-slate-900">Negotiation Assistant</h1>
          <p className="text-sm text-slate-500">
            {load.pickup_location} → {load.delivery_location}
          </p>
        </div>
        <span className="text-xs bg-purple-100 text-purple-700 px-2.5 py-1 rounded-full font-medium">
          AI Drafted
        </span>
      </div>

      <div className="space-y-4">
        {/* Shipper Email */}
        <div className="bg-white rounded-lg border border-slate-200">
          <div className="flex items-center justify-between px-5 py-3 border-b border-slate-100">
            <div>
              <h2 className="text-sm font-semibold text-slate-900">Email to shipper</h2>
              <p className="text-xs text-slate-400 mt-0.5">Ready to copy and send</p>
            </div>
            <button
              onClick={() => handleCopy(content.shipper_email, 'shipper')}
              className="text-xs px-3 py-1.5 rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-50 transition-colors">
              {copied === 'shipper' ? '✓ Copied!' : 'Copy'}
            </button>
          </div>
          <div className="p-5">
            <pre className="text-sm text-slate-600 whitespace-pre-wrap font-sans leading-relaxed bg-slate-50 rounded-lg p-4">
              {content.shipper_email}
            </pre>
          </div>
        </div>

        {/* Carrier Message */}
        <div className="bg-white rounded-lg border border-slate-200">
          <div className="flex items-center justify-between px-5 py-3 border-b border-slate-100">
            <div>
              <h2 className="text-sm font-semibold text-slate-900">Message to carriers</h2>
              <p className="text-xs text-slate-400 mt-0.5">Blast to available carriers on lane</p>
            </div>
            <button
              onClick={() => handleCopy(content.carrier_message, 'carrier')}
              className="text-xs px-3 py-1.5 rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-50 transition-colors">
              {copied === 'carrier' ? '✓ Copied!' : 'Copy'}
            </button>
          </div>
          <div className="p-5">
            <pre className="text-sm text-slate-600 whitespace-pre-wrap font-sans leading-relaxed bg-slate-50 rounded-lg p-4">
              {content.carrier_message}
            </pre>
          </div>
        </div>

        {/* Counteroffer + Summary */}
        <div className="grid grid-cols-2 gap-4">
          <div className="bg-white rounded-lg border border-slate-200 p-5">
            <h2 className="text-sm font-semibold text-slate-900 mb-1">Suggested counteroffer</h2>
            <div className="text-3xl font-semibold text-slate-900 my-3">
              ${content.counteroffer_price.toLocaleString()}
            </div>
            <p className="text-xs text-slate-500 leading-relaxed">{content.counteroffer_note}</p>
          </div>

          <div className="bg-white rounded-lg border border-slate-200 p-5">
            <h2 className="text-sm font-semibold text-slate-900 mb-3">Load summary</h2>
            <div className="space-y-2">
              {[
                { label: 'Shipper rate', value: `$${load.shipper_rate?.toLocaleString()}` },
                { label: 'Carrier target', value: `$${load.carrier_cost?.toLocaleString()}` },
                { label: 'Margin', value: `${load.margin_percentage?.toFixed(1)}%`, green: true },
                { label: 'Risk', value: load.risk_level || '—' },
              ].map((row) => (
                <div key={row.label} className="flex justify-between text-sm">
                  <span className="text-slate-500">{row.label}</span>
                  <span className={`font-medium ${row.green ? 'text-green-600' : 'text-slate-900'}`}>
                    {row.value}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="flex gap-3">
          <button
            onClick={handleSendAndSave}
            disabled={saving}
            className="px-5 py-2.5 rounded-lg text-sm font-medium text-white disabled:opacity-50"
            style={{ backgroundColor: '#1a3a5c' }}>
            {saving ? 'Saving...' : 'Mark as sent & save load →'}
          </button>
          <button
            onClick={() => router.push(`/pricing?loadId=${loadId}`)}
            className="px-4 py-2.5 rounded-lg text-sm font-medium text-slate-600 border border-slate-200 hover:bg-slate-50">
            Back to pricing
          </button>
          <button
            onClick={() => router.push('/loads/new')}
            className="px-4 py-2.5 rounded-lg text-sm font-medium text-slate-600 border border-slate-200 hover:bg-slate-50">
            New load
          </button>
        </div>
      </div>
    </div>
  )
}
