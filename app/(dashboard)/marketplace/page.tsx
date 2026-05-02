'use client'

import { useCallback, useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import type { MarketplaceLoad, LoadBid, EquipmentType } from '@/types'
import { subscribeToNewLoads, subscribeToBids } from '@/lib/marketplace-realtime'
import {
  ArrowRight,
  Package,
  X,
  CheckCircle,
  AlertCircle,
  Clock,
  ChevronRight,
} from 'lucide-react'

const equipmentLabels: Record<string, string> = {
  dry_van: 'Dry Van',
  reefer: 'Reefer',
  flatbed: 'Flatbed',
  step_deck: 'Step Deck',
  power_only: 'Power Only',
  tanker: 'Tanker',
}

const loadStatusStyles: Record<string, string> = {
  posted: 'bg-blue-100 text-blue-700',
  covered: 'bg-green-100 text-green-700',
  expired: 'bg-slate-100 text-slate-600',
  cancelled: 'bg-red-100 text-red-700',
}

interface BidWithCarrier extends LoadBid {
  profiles: { full_name: string } | null
}

interface PostLoadForm {
  origin_city: string
  origin_state: string
  destination_city: string
  destination_state: string
  pickup_date: string
  equipment_type: EquipmentType
  weight_lbs: string
  target_rate: string
  bid_deadline: string
}

const emptyForm: PostLoadForm = {
  origin_city: '',
  origin_state: '',
  destination_city: '',
  destination_state: '',
  pickup_date: '',
  equipment_type: 'dry_van',
  weight_lbs: '',
  target_rate: '',
  bid_deadline: '',
}

type ActiveTab = 'post' | 'my_loads'

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

interface LoadCardProps {
  load: MarketplaceLoad
  onViewBids: () => void
}

function LoadCard({ load, onViewBids }: LoadCardProps) {
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
        <span
          className={`rounded-full px-2.5 py-0.5 text-xs font-medium capitalize ${
            loadStatusStyles[load.status] ?? 'bg-slate-100 text-slate-600'
          }`}
        >
          {load.status}
        </span>
      </div>

      <div className="mb-4 flex items-center justify-between text-sm">
        <div>
          <p className="text-xs text-slate-500">Target Rate</p>
          <p className="font-semibold text-slate-900">${load.target_rate.toLocaleString()}</p>
        </div>
        <div className="text-right">
          <p className="text-xs text-slate-500">Pickup</p>
          <p className="text-slate-700">
            {new Date(load.pickup_date).toLocaleDateString('en-US', {
              month: 'short',
              day: 'numeric',
            })}
          </p>
        </div>
      </div>

      <button
        type="button"
        onClick={onViewBids}
        className="mt-auto flex items-center justify-center gap-1.5 rounded-lg border border-slate-200 px-3 py-2 text-xs font-medium text-slate-600 transition-colors hover:border-[#1a3a5c]/30 hover:bg-[#1a3a5c]/5 hover:text-[#1a3a5c]"
      >
        View Bids
        <ChevronRight size={13} />
      </button>
    </div>
  )
}

interface BidSlideOverProps {
  load: MarketplaceLoad
  bids: BidWithCarrier[]
  loading: boolean
  actionLoading: string | null
  onClose: () => void
  onBidAction: (loadId: string, bidId: string, action: 'accept' | 'reject') => Promise<void>
}

function BidSlideOver({ load, bids, loading, actionLoading, onClose, onBidAction }: BidSlideOverProps) {
  const canAct = load.status === 'posted'

  return (
    <div className="fixed inset-0 z-40 flex justify-end">
      <button
        type="button"
        aria-label="Close panel"
        onClick={onClose}
        className="absolute inset-0 bg-slate-900/30 backdrop-blur-[1px]"
      />
      <aside className="relative flex w-full max-w-md flex-col bg-white shadow-xl">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-200 px-5 py-4">
          <div>
            <h2 className="text-sm font-semibold text-slate-900">
              {load.origin_city}, {load.origin_state} → {load.destination_city}, {load.destination_state}
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              {equipmentLabels[load.equipment_type]} · ${load.target_rate.toLocaleString()} target ·{' '}
              <span
                className={`rounded-full px-2 py-0.5 font-medium capitalize ${
                  loadStatusStyles[load.status] ?? 'bg-slate-100 text-slate-600'
                }`}
              >
                {load.status}
              </span>
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

        {/* Load details */}
        <div className="border-b border-slate-100 px-5 py-3">
          <div className="grid grid-cols-2 gap-3 text-xs">
            <div>
              <p className="text-slate-500">Pickup Date</p>
              <p className="font-medium text-slate-900">
                {new Date(load.pickup_date).toLocaleString('en-US', {
                  month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit',
                })}
              </p>
            </div>
            {load.weight_lbs && (
              <div>
                <p className="text-slate-500">Weight</p>
                <p className="font-medium text-slate-900">{load.weight_lbs.toLocaleString()} lbs</p>
              </div>
            )}
            {load.bid_deadline && (
              <div>
                <p className="text-slate-500">Bid Deadline</p>
                <p className="font-medium text-slate-900">
                  {new Date(load.bid_deadline).toLocaleString('en-US', {
                    month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit',
                  })}
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Bids list */}
        <div className="flex-1 overflow-y-auto px-5 py-4">
          <h3 className="mb-3 text-xs font-semibold uppercase tracking-wider text-slate-500">
            Bids {!loading && `(${bids.length})`}
          </h3>

          {loading ? (
            <div className="space-y-3">
              {Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className="h-24 animate-pulse rounded-lg bg-slate-100" />
              ))}
            </div>
          ) : bids.length === 0 ? (
            <div className="rounded-lg border border-dashed border-slate-200 p-8 text-center">
              <Clock size={20} className="mx-auto mb-2 text-slate-400" />
              <p className="text-sm text-slate-500">No bids yet. Waiting for carriers.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {bids.map((bid) => (
                <div
                  key={bid.id}
                  className="rounded-lg border border-slate-200 bg-slate-50 p-4"
                >
                  <div className="mb-2 flex items-start justify-between">
                    <div>
                      <p className="text-sm font-medium text-slate-900">
                        {bid.profiles?.full_name ?? 'Carrier'}
                      </p>
                      <p className="text-xs text-slate-500">
                        {new Date(bid.submitted_at).toLocaleString('en-US', {
                          month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit',
                        })}
                      </p>
                    </div>
                    <span
                      className={`rounded-full px-2.5 py-0.5 text-xs font-medium capitalize ${
                        bid.status === 'accepted'
                          ? 'bg-green-100 text-green-700'
                          : bid.status === 'rejected'
                            ? 'bg-red-100 text-red-700'
                            : bid.status === 'withdrawn'
                              ? 'bg-slate-100 text-slate-500'
                              : 'bg-blue-100 text-blue-700'
                      }`}
                    >
                      {bid.status}
                    </span>
                  </div>

                  <p className="mb-2 text-2xl font-bold text-slate-900">
                    ${bid.bid_amount.toLocaleString()}
                  </p>

                  {bid.notes && (
                    <p className="mb-3 text-xs text-slate-600">{bid.notes}</p>
                  )}

                  {canAct && bid.status === 'pending' && (
                    <div className="flex gap-2">
                      <button
                        type="button"
                        disabled={actionLoading === bid.id}
                        onClick={() => onBidAction(load.id, bid.id, 'accept')}
                        className="flex-1 rounded-lg bg-green-600 px-3 py-1.5 text-xs font-medium text-white transition-colors hover:bg-green-700 disabled:opacity-50"
                      >
                        {actionLoading === bid.id ? '…' : 'Accept'}
                      </button>
                      <button
                        type="button"
                        disabled={actionLoading === bid.id}
                        onClick={() => onBidAction(load.id, bid.id, 'reject')}
                        className="flex-1 rounded-lg border border-red-200 bg-red-50 px-3 py-1.5 text-xs font-medium text-red-600 transition-colors hover:bg-red-100 disabled:opacity-50"
                      >
                        {actionLoading === bid.id ? '…' : 'Reject'}
                      </button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </aside>
    </div>
  )
}

export default function BrokerMarketplacePage() {
  const supabase = createClient()

  const [activeTab, setActiveTab] = useState<ActiveTab>('post')
  const [loads, setLoads] = useState<MarketplaceLoad[]>([])
  const [loadingLoads, setLoadingLoads] = useState(false)
  const [selectedLoad, setSelectedLoad] = useState<MarketplaceLoad | null>(null)
  const [bids, setBids] = useState<BidWithCarrier[]>([])
  const [loadingBids, setLoadingBids] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [actionLoading, setActionLoading] = useState<string | null>(null)
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null)
  const [formError, setFormError] = useState('')
  const [form, setForm] = useState<PostLoadForm>(emptyForm)

  function showToast(message: string, type: 'success' | 'error' = 'success') {
    setToast({ message, type })
    setTimeout(() => setToast(null), 4000)
  }

  const fetchMyLoads = useCallback(async () => {
    setLoadingLoads(true)
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      const { data, error } = await supabase
        .from('marketplace_loads')
        .select('*')
        .eq('broker_id', user.id)
        .order('created_at', { ascending: false })

      if (error) throw error
      setLoads((data as MarketplaceLoad[]) ?? [])
    } catch {
      // show empty state on error
    } finally {
      setLoadingLoads(false)
    }
  }, [supabase])

  const fetchBids = useCallback(
    async (loadId: string) => {
      setLoadingBids(true)
      try {
        const { data, error } = await supabase
          .from('load_bids')
          .select('*, profiles!carrier_id(full_name)')
          .eq('marketplace_load_id', loadId)
          .order('submitted_at', { ascending: false })

        if (error) throw error
        setBids((data as BidWithCarrier[]) ?? [])
      } finally {
        setLoadingBids(false)
      }
    },
    [supabase],
  )

  useEffect(() => {
    if (activeTab === 'my_loads') fetchMyLoads()
  }, [activeTab, fetchMyLoads])

  // Show toast when any new load is posted to the marketplace
  useEffect(() => {
    const unsub = subscribeToNewLoads(() => {
      showToast('A new load was posted to the marketplace.', 'success')
    })
    return () => unsub()
  }, [])

  // Live bid updates when viewing a load
  useEffect(() => {
    if (!selectedLoad) return
    const id = selectedLoad.id
    const unsub = subscribeToBids(id, () => {
      fetchBids(id)
    })
    return () => unsub()
  }, [selectedLoad, fetchBids])

  function handleChange(e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) {
    const { name, value } = e.target
    setForm((prev) => ({
      ...prev,
      [name]: name === 'equipment_type' ? (value as EquipmentType) : value,
    }))
  }

  async function handlePostLoad(e: React.FormEvent) {
    e.preventDefault()
    setSubmitting(true)
    setFormError('')

    try {
      const payload: Record<string, unknown> = {
        origin_city: form.origin_city.trim(),
        origin_state: form.origin_state.trim().toUpperCase(),
        destination_city: form.destination_city.trim(),
        destination_state: form.destination_state.trim().toUpperCase(),
        pickup_date: new Date(form.pickup_date).toISOString(),
        equipment_type: form.equipment_type,
        target_rate: Number(form.target_rate),
      }
      if (form.weight_lbs) payload.weight_lbs = Number(form.weight_lbs)
      if (form.bid_deadline) payload.bid_deadline = new Date(form.bid_deadline).toISOString()

      const res = await fetch('/api/marketplace/loads', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })

      const json = await res.json()
      if (!res.ok) throw new Error(json.error ?? 'Failed to post load')

      setForm(emptyForm)
      showToast('Load posted successfully!', 'success')
      setActiveTab('my_loads')
    } catch (err) {
      setFormError(err instanceof Error ? err.message : 'Failed to post load')
    } finally {
      setSubmitting(false)
    }
  }

  function handleViewBids(load: MarketplaceLoad) {
    setSelectedLoad(load)
    setBids([])
    fetchBids(load.id)
  }

  async function handleBidAction(loadId: string, bidId: string, action: 'accept' | 'reject') {
    setActionLoading(bidId)
    try {
      const res = await fetch(`/api/marketplace/loads/${loadId}/bids/${bidId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action }),
      })
      const json = await res.json()
      if (!res.ok) throw new Error(json.error ?? 'Action failed')

      showToast(
        action === 'accept' ? 'Bid accepted — load is now covered.' : 'Bid rejected.',
        'success',
      )

      if (action === 'accept') {
        setSelectedLoad((prev) => (prev ? { ...prev, status: 'covered' } : null))
        setLoads((prev) => prev.map((l) => (l.id === loadId ? { ...l, status: 'covered' } : l)))
      }

      await Promise.all([fetchBids(loadId), fetchMyLoads()])
    } catch (err) {
      showToast(err instanceof Error ? err.message : 'Action failed', 'error')
    } finally {
      setActionLoading(null)
    }
  }

  return (
    <div className="relative">
      <div className="mb-6">
        <h1 className="text-xl font-semibold text-slate-900">Marketplace</h1>
        <p className="text-sm text-slate-500">Post loads and manage carrier bids</p>
      </div>

      {/* Tabs */}
      <div className="mb-6 flex w-fit gap-1 rounded-lg border border-slate-200 bg-white p-1">
        {(['post', 'my_loads'] as ActiveTab[]).map((tab) => (
          <button
            key={tab}
            type="button"
            onClick={() => setActiveTab(tab)}
            className={`rounded-md px-4 py-2 text-sm font-medium transition-all duration-200 ${
              activeTab === tab
                ? 'bg-[#1a3a5c] text-white shadow-sm'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            {tab === 'post' ? 'Post a Load' : 'My Loads'}
          </button>
        ))}
      </div>

      {/* Post a Load */}
      {activeTab === 'post' && (
        <div className="max-w-2xl">
          <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
            <h2 className="mb-1 text-base font-semibold text-slate-900">Post a Load</h2>
            <p className="mb-5 text-sm text-slate-500">
              Broadcast this load to verified carriers on the marketplace.
            </p>

            <form onSubmit={handlePostLoad} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="mb-1 block text-sm font-medium text-slate-700">
                    Origin City
                  </label>
                  <input
                    name="origin_city"
                    type="text"
                    placeholder="Chicago"
                    value={form.origin_city}
                    onChange={handleChange}
                    required
                    className="w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-900 placeholder:text-slate-400 focus:border-[#1a3a5c]/40 focus:outline-none focus:ring-2 focus:ring-[#1a3a5c]/10"
                  />
                </div>
                <div>
                  <label className="mb-1 block text-sm font-medium text-slate-700">
                    Origin State
                  </label>
                  <input
                    name="origin_state"
                    type="text"
                    placeholder="IL"
                    maxLength={2}
                    value={form.origin_state}
                    onChange={handleChange}
                    required
                    className="w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm uppercase text-slate-900 placeholder:text-slate-400 focus:border-[#1a3a5c]/40 focus:outline-none focus:ring-2 focus:ring-[#1a3a5c]/10"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="mb-1 block text-sm font-medium text-slate-700">
                    Destination City
                  </label>
                  <input
                    name="destination_city"
                    type="text"
                    placeholder="Atlanta"
                    value={form.destination_city}
                    onChange={handleChange}
                    required
                    className="w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-900 placeholder:text-slate-400 focus:border-[#1a3a5c]/40 focus:outline-none focus:ring-2 focus:ring-[#1a3a5c]/10"
                  />
                </div>
                <div>
                  <label className="mb-1 block text-sm font-medium text-slate-700">
                    Destination State
                  </label>
                  <input
                    name="destination_state"
                    type="text"
                    placeholder="GA"
                    maxLength={2}
                    value={form.destination_state}
                    onChange={handleChange}
                    required
                    className="w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm uppercase text-slate-900 placeholder:text-slate-400 focus:border-[#1a3a5c]/40 focus:outline-none focus:ring-2 focus:ring-[#1a3a5c]/10"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="mb-1 block text-sm font-medium text-slate-700">
                    Pickup Date &amp; Time
                  </label>
                  <input
                    name="pickup_date"
                    type="datetime-local"
                    value={form.pickup_date}
                    onChange={handleChange}
                    required
                    className="w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-900 focus:border-[#1a3a5c]/40 focus:outline-none focus:ring-2 focus:ring-[#1a3a5c]/10"
                  />
                </div>
                <div>
                  <label className="mb-1 block text-sm font-medium text-slate-700">
                    Equipment Type
                  </label>
                  <select
                    name="equipment_type"
                    value={form.equipment_type}
                    onChange={handleChange}
                    className="w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-900 focus:border-[#1a3a5c]/40 focus:outline-none focus:ring-2 focus:ring-[#1a3a5c]/10"
                  >
                    <option value="dry_van">Dry Van</option>
                    <option value="reefer">Reefer</option>
                    <option value="flatbed">Flatbed</option>
                    <option value="step_deck">Step Deck</option>
                    <option value="power_only">Power Only</option>
                    <option value="tanker">Tanker</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="mb-1 block text-sm font-medium text-slate-700">
                    Weight (lbs){' '}
                    <span className="font-normal text-slate-400">— optional</span>
                  </label>
                  <input
                    name="weight_lbs"
                    type="number"
                    placeholder="44000"
                    min="0"
                    max="80000"
                    value={form.weight_lbs}
                    onChange={handleChange}
                    className="w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-900 placeholder:text-slate-400 focus:border-[#1a3a5c]/40 focus:outline-none focus:ring-2 focus:ring-[#1a3a5c]/10"
                  />
                </div>
                <div>
                  <label className="mb-1 block text-sm font-medium text-slate-700">
                    Target Rate
                  </label>
                  <div className="relative">
                    <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-sm text-slate-400">
                      $
                    </span>
                    <input
                      name="target_rate"
                      type="number"
                      placeholder="2500"
                      min="0"
                      value={form.target_rate}
                      onChange={handleChange}
                      required
                      className="w-full rounded-lg border border-slate-200 bg-slate-50 py-2 pl-7 pr-3 text-sm text-slate-900 placeholder:text-slate-400 focus:border-[#1a3a5c]/40 focus:outline-none focus:ring-2 focus:ring-[#1a3a5c]/10"
                    />
                  </div>
                </div>
              </div>

              <div>
                <label className="mb-1 block text-sm font-medium text-slate-700">
                  Bid Deadline{' '}
                  <span className="font-normal text-slate-400">— optional</span>
                </label>
                <input
                  name="bid_deadline"
                  type="datetime-local"
                  value={form.bid_deadline}
                  onChange={handleChange}
                  className="w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-900 focus:border-[#1a3a5c]/40 focus:outline-none focus:ring-2 focus:ring-[#1a3a5c]/10"
                />
              </div>

              {formError && (
                <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600">
                  {formError}
                </div>
              )}

              <button
                type="submit"
                disabled={submitting}
                className="w-full rounded-lg bg-[#1a3a5c] px-4 py-2.5 text-sm font-medium text-white shadow-sm transition-colors hover:bg-[#1a3a5c]/90 disabled:opacity-50"
              >
                {submitting ? 'Posting…' : 'Post Load'}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* My Loads */}
      {activeTab === 'my_loads' && (
        <div>
          {loadingLoads ? (
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {Array.from({ length: 3 }).map((_, i) => (
                <div
                  key={i}
                  className="h-44 animate-pulse rounded-xl border border-slate-200 bg-slate-100"
                />
              ))}
            </div>
          ) : loads.length === 0 ? (
            <div className="rounded-xl border border-slate-200 bg-white p-12 text-center shadow-sm">
              <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-[#1a3a5c]/10">
                <Package size={22} className="text-[#1a3a5c]" />
              </div>
              <h3 className="mb-1 text-sm font-semibold text-slate-900">No loads posted yet</h3>
              <p className="mb-5 text-sm text-slate-500">
                Post your first load to start receiving carrier bids.
              </p>
              <button
                type="button"
                onClick={() => setActiveTab('post')}
                className="inline-flex items-center gap-1.5 rounded-lg bg-[#1a3a5c] px-4 py-2 text-sm font-medium text-white shadow-sm transition-colors hover:bg-[#1a3a5c]/90"
              >
                Post a Load
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {loads.map((load) => (
                <LoadCard key={load.id} load={load} onViewBids={() => handleViewBids(load)} />
              ))}
            </div>
          )}
        </div>
      )}

      {/* Bid slide-over */}
      {selectedLoad && (
        <BidSlideOver
          load={selectedLoad}
          bids={bids}
          loading={loadingBids}
          actionLoading={actionLoading}
          onClose={() => setSelectedLoad(null)}
          onBidAction={handleBidAction}
        />
      )}

      {toast && <Toast message={toast.message} type={toast.type} />}
    </div>
  )
}
