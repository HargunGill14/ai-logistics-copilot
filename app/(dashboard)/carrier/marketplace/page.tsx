'use client'

import { useCallback, useEffect, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import type { MarketplaceLoad, EquipmentType } from '@/types'
import { subscribeToNewLoads } from '@/lib/marketplace-realtime'
import { AlertTriangle, ArrowRight, CheckCircle, AlertCircle, X, Zap } from 'lucide-react'
import { ScorecardBadge } from '@/components/marketplace/ScorecardBadge'
import type { ScorecardMetrics } from '@/lib/scorecard'

const equipmentLabels: Record<string, string> = {
  dry_van: 'Dry Van',
  reefer: 'Reefer',
  flatbed: 'Flatbed',
  step_deck: 'Step Deck',
  power_only: 'Power Only',
  tanker: 'Tanker',
}

interface BidForm {
  bid_amount: string
  estimated_pickup: string
  notes: string
}

const emptyBidForm: BidForm = {
  bid_amount: '',
  estimated_pickup: '',
  notes: '',
}

interface BidModalProps {
  load: MarketplaceLoad
  onClose: () => void
  onSuccess: () => void
}

function BidModal({ load, onClose, onSuccess }: BidModalProps) {
  const [form, setForm] = useState<BidForm>(emptyBidForm)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setSubmitting(true)
    setError('')

    try {
      const payload: Record<string, unknown> = {
        bid_amount: Number(form.bid_amount),
      }
      if (form.estimated_pickup) {
        payload.estimated_pickup = new Date(form.estimated_pickup).toISOString()
      }
      if (form.notes.trim()) {
        payload.notes = form.notes.trim()
      }

      const res = await fetch(`/api/marketplace/loads/${load.id}/bids`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })

      const json = await res.json()
      if (!res.ok) throw new Error(json.error ?? 'Failed to place bid')

      onSuccess()
      onClose()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to place bid')
    } finally {
      setSubmitting(false)
    }
  }

  function handleChange(
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>,
  ) {
    const { name, value } = e.target
    setForm((prev) => ({ ...prev, [name]: value }))
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <button
        type="button"
        aria-label="Close modal"
        onClick={onClose}
        className="absolute inset-0 bg-slate-900/30 backdrop-blur-[1px]"
      />
      <div className="relative w-full max-w-md rounded-xl border border-slate-200 bg-white p-6 shadow-xl">
        <div className="mb-4 flex items-start justify-between">
          <div>
            <h2 className="text-base font-semibold text-slate-900">Place a Bid</h2>
            <p className="mt-0.5 text-sm text-slate-500">
              {load.origin_city}, {load.origin_state} → {load.destination_city},{' '}
              {load.destination_state}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="rounded-md p-1.5 text-slate-500 hover:bg-slate-100"
          >
            <X size={16} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700">
              Bid Amount <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-sm text-slate-400">
                $
              </span>
              <input
                name="bid_amount"
                type="number"
                placeholder="2200"
                min="1"
                max="99999"
                value={form.bid_amount}
                onChange={handleChange}
                required
                className="w-full rounded-lg border border-slate-200 bg-slate-50 py-2 pl-7 pr-3 text-sm text-slate-900 placeholder:text-slate-400 focus:border-[#1a3a5c]/40 focus:outline-none focus:ring-2 focus:ring-[#1a3a5c]/10"
              />
            </div>
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700">
              Estimated Pickup{' '}
              <span className="font-normal text-slate-400">— optional</span>
            </label>
            <input
              name="estimated_pickup"
              type="datetime-local"
              value={form.estimated_pickup}
              onChange={handleChange}
              className="w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-900 focus:border-[#1a3a5c]/40 focus:outline-none focus:ring-2 focus:ring-[#1a3a5c]/10"
            />
          </div>

          <div>
            <label className="mb-1 flex items-center justify-between text-sm font-medium text-slate-700">
              <span>
                Notes <span className="font-normal text-slate-400">— optional</span>
              </span>
              <span className="text-xs text-slate-400">{form.notes.length}/500</span>
            </label>
            <textarea
              name="notes"
              placeholder="Any relevant details for the broker…"
              maxLength={500}
              rows={3}
              value={form.notes}
              onChange={handleChange}
              className="w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-900 placeholder:text-slate-400 focus:border-[#1a3a5c]/40 focus:outline-none focus:ring-2 focus:ring-[#1a3a5c]/10"
            />
          </div>

          {error && (
            <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600">
              {error}
            </div>
          )}

          <div className="flex gap-3">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 rounded-lg border border-slate-200 px-4 py-2.5 text-sm font-medium text-slate-700 transition-colors hover:bg-slate-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="flex-1 rounded-lg bg-[#1a3a5c] px-4 py-2.5 text-sm font-medium text-white shadow-sm transition-colors hover:bg-[#1a3a5c]/90 disabled:opacity-50"
            >
              {submitting ? 'Submitting…' : 'Submit Bid'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

function UpgradeModal({ onClose }: { onClose: () => void }) {
  const router = useRouter()
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <button
        type="button"
        aria-label="Close"
        onClick={onClose}
        className="absolute inset-0 bg-slate-900/30 backdrop-blur-[1px]"
      />
      <div className="relative w-full max-w-sm rounded-2xl border border-slate-200 bg-white p-8 shadow-xl text-center">
        <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-[#1a3a5c]/10">
          <Zap size={22} className="text-[#1a3a5c]" />
        </div>
        <h2 className="text-lg font-bold text-slate-900">Upgrade to start bidding</h2>
        <p className="mt-2 text-sm text-slate-500 leading-relaxed">
          Upgrade to the Carrier Plan to submit bids on loads — <strong className="text-slate-700">$49/month</strong>.
        </p>
        <div className="mt-6 flex flex-col gap-3">
          <button
            type="button"
            onClick={() => router.push('/plans')}
            className="rounded-xl bg-[#1a3a5c] px-4 py-2.5 text-sm font-semibold text-white hover:bg-[#1a3a5c]/90 transition-colors"
          >
            View Plans
          </button>
          <button
            type="button"
            onClick={onClose}
            className="rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-medium text-slate-600 hover:bg-slate-50 transition-colors"
          >
            Maybe later
          </button>
        </div>
      </div>
    </div>
  )
}

function Toast({ message, type }: { message: string; type: 'success' | 'error' }) {
  return (
    <div
      className={`fixed bottom-6 right-6 z-50 flex items-center gap-2 rounded-lg px-4 py-3 text-sm font-medium shadow-lg ${
        type === 'success' ? 'bg-green-600 text-white' : 'bg-red-600 text-white'
      }`}
    >
      {type === 'success' ? <CheckCircle size={16} /> : <AlertCircle size={16} />}
      {message}
    </div>
  )
}

export default function CarrierMarketplacePage() {
  const supabase = createClient()

  const [loads, setLoads] = useState<MarketplaceLoad[]>([])
  const [loading, setLoading] = useState(true)
  const [trustScore, setTrustScore] = useState<number | null>(null)
  const [scorecard, setScorecard] = useState<ScorecardMetrics | null>(null)
  const [subscriptionStatus, setSubscriptionStatus] = useState<string>('free')
  const [selectedLoad, setSelectedLoad] = useState<MarketplaceLoad | null>(null)
  const [showUpgradeModal, setShowUpgradeModal] = useState(false)
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null)

  function showToast(message: string, type: 'success' | 'error' = 'success') {
    setToast({ message, type })
    setTimeout(() => setToast(null), 4000)
  }

  const fetchData = useCallback(async () => {
    setLoading(true)
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      const [loadsRes, verifyRes, profileRes] = await Promise.all([
        supabase
          .from('marketplace_loads')
          .select('*')
          .eq('status', 'posted')
          .order('created_at', { ascending: false }),
        supabase
          .from('carrier_verifications')
          .select('trust_score, total_bids, accepted_bids, on_time_pickups, on_time_deliveries, total_loads_completed')
          .eq('carrier_id', user.id)
          .single(),
        supabase
          .from('profiles')
          .select('subscription_status')
          .eq('id', user.id)
          .single(),
      ])

      setLoads((loadsRes.data as MarketplaceLoad[]) ?? [])
      setTrustScore(verifyRes.data?.trust_score ?? null)
      if (verifyRes.data) {
        const v = verifyRes.data
        setScorecard({
          total_bids: v.total_bids ?? 0,
          accepted_bids: v.accepted_bids ?? 0,
          on_time_pickups: v.on_time_pickups ?? 0,
          on_time_deliveries: v.on_time_deliveries ?? 0,
          total_loads_completed: v.total_loads_completed ?? 0,
        })
      }
      setSubscriptionStatus(profileRes.data?.subscription_status ?? 'free')
    } finally {
      setLoading(false)
    }
  }, [supabase])

  useEffect(() => {
    fetchData()
  }, [fetchData])

  useEffect(() => {
    const unsub = subscribeToNewLoads((load) => {
      setLoads((prev) => [load as MarketplaceLoad, ...prev])
      showToast('A new load is available on the marketplace.', 'success')
    })
    return () => unsub()
  }, [])

  const showWarning = trustScore === null || trustScore < 40

  return (
    <div className="relative">
      <div className="mb-6">
        <h1 className="text-xl font-semibold text-slate-900">Available Loads</h1>
        <p className="text-sm text-slate-500">Browse and bid on loads posted by brokers</p>
      </div>

      {/* Own scorecard */}
      {scorecard && (
        <div className="mb-6 max-w-xs">
          <ScorecardBadge metrics={scorecard} size="md" />
        </div>
      )}

      {/* Trust score warning */}
      {showWarning && (
        <div className="mb-6 flex items-start gap-3 rounded-lg border border-amber-200 bg-amber-50 px-4 py-3">
          <AlertTriangle size={16} className="mt-0.5 shrink-0 text-amber-600" />
          <div className="flex-1 text-sm">
            <p className="font-medium text-amber-800">
              Your carrier profile isn&apos;t verified.
            </p>
            <p className="mt-0.5 text-amber-700">
              Complete verification to bid on loads.
            </p>
          </div>
          <Link
            href="/carrier/verify"
            className="shrink-0 rounded-lg bg-amber-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-amber-700"
          >
            Get Verified
          </Link>
        </div>
      )}

      {loading ? (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <div
              key={i}
              className="h-44 animate-pulse rounded-xl border border-slate-200 bg-slate-100"
            />
          ))}
        </div>
      ) : loads.length === 0 ? (
        <div className="rounded-xl border border-slate-200 bg-white p-12 text-center shadow-sm">
          <p className="text-sm font-semibold text-slate-900">No loads available right now</p>
          <p className="mt-1 text-sm text-slate-500">
            Check back soon — new loads are posted frequently.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {loads.map((load) => (
            <CarrierLoadCard
              key={load.id}
              load={load}
              onBid={() => {
                if (subscriptionStatus !== 'active') {
                  setShowUpgradeModal(true)
                } else {
                  setSelectedLoad(load)
                }
              }}
            />
          ))}
        </div>
      )}

      {selectedLoad && (
        <BidModal
          load={selectedLoad}
          onClose={() => setSelectedLoad(null)}
          onSuccess={() => showToast('Bid submitted successfully!', 'success')}
        />
      )}

      {showUpgradeModal && <UpgradeModal onClose={() => setShowUpgradeModal(false)} />}

      {toast && <Toast message={toast.message} type={toast.type} />}
    </div>
  )
}

interface CarrierLoadCardProps {
  load: MarketplaceLoad
  onBid: () => void
}

function CarrierLoadCard({ load, onBid }: CarrierLoadCardProps) {
  return (
    <div className="flex flex-col rounded-xl border border-slate-200 bg-white p-5 shadow-sm transition-shadow hover:shadow-md">
      <div className="mb-3 flex items-center gap-2 text-sm font-semibold text-slate-900">
        <span>{load.origin_city}, {load.origin_state}</span>
        <ArrowRight size={14} className="shrink-0 text-slate-400" />
        <span>{load.destination_city}, {load.destination_state}</span>
      </div>

      <div className="mb-4 flex flex-wrap items-center gap-2">
        <span className="rounded-full bg-slate-100 px-2.5 py-0.5 text-xs font-medium text-slate-600">
          {equipmentLabels[load.equipment_type] ?? load.equipment_type}
        </span>
      </div>

      <div className="mb-4 grid grid-cols-2 gap-3 text-sm">
        <div>
          <p className="text-xs text-slate-500">Target Rate</p>
          <p className="font-bold text-green-600">${load.target_rate.toLocaleString()}</p>
        </div>
        <div>
          <p className="text-xs text-slate-500">Pickup</p>
          <p className="font-medium text-slate-700">
            {new Date(load.pickup_date).toLocaleDateString('en-US', {
              month: 'short',
              day: 'numeric',
            })}
          </p>
        </div>
        {load.weight_lbs && (
          <div>
            <p className="text-xs text-slate-500">Weight</p>
            <p className="font-medium text-slate-700">{load.weight_lbs.toLocaleString()} lbs</p>
          </div>
        )}
      </div>

      <button
        type="button"
        onClick={onBid}
        className="mt-auto rounded-lg bg-[#1a3a5c] px-3 py-2 text-xs font-medium text-white shadow-sm transition-colors hover:bg-[#1a3a5c]/90"
      >
        Place Bid
      </button>
    </div>
  )
}
