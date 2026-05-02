'use client'

import { useCallback, useEffect, useState } from 'react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import type { Load, ShipmentTracking, TrackingStatus } from '@/types'
import { Copy, CheckCircle, AlertCircle, ExternalLink } from 'lucide-react'

const trackingStatusLabels: Record<TrackingStatus, string> = {
  not_started: 'Not Started',
  en_route_pickup: 'En Route Pickup',
  at_pickup: 'At Pickup',
  loaded: 'Loaded',
  en_route_delivery: 'En Route Delivery',
  at_delivery: 'At Delivery',
  delivered: 'Delivered',
}

const trackingStatusStyles: Record<TrackingStatus, string> = {
  not_started: 'bg-slate-100 text-slate-600',
  en_route_pickup: 'bg-blue-100 text-blue-700',
  at_pickup: 'bg-blue-100 text-blue-700',
  loaded: 'bg-purple-100 text-purple-700',
  en_route_delivery: 'bg-amber-100 text-amber-700',
  at_delivery: 'bg-amber-100 text-amber-700',
  delivered: 'bg-green-100 text-green-700',
}

interface TrackingForm {
  load_id: string
  driver_name: string
  driver_phone: string
  origin_lat: string
  origin_lng: string
  destination_lat: string
  destination_lng: string
  yard_lat: string
  yard_lng: string
}

const emptyForm: TrackingForm = {
  load_id: '',
  driver_name: '',
  driver_phone: '',
  origin_lat: '',
  origin_lng: '',
  destination_lat: '',
  destination_lng: '',
  yard_lat: '',
  yard_lng: '',
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

export default function TrackingPage() {
  const supabase = createClient()

  const [loads, setLoads] = useState<Pick<Load, 'id' | 'pickup_location' | 'delivery_location'>[]>(
    [],
  )
  const [sessions, setSessions] = useState<ShipmentTracking[]>([])
  const [loadingLoads, setLoadingLoads] = useState(true)
  const [loadingSessions, setLoadingSessions] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [formError, setFormError] = useState('')
  const [form, setForm] = useState<TrackingForm>(emptyForm)
  const [trackingUrl, setTrackingUrl] = useState<string | null>(null)
  const [copied, setCopied] = useState(false)
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null)

  function showToast(message: string, type: 'success' | 'error' = 'success') {
    setToast({ message, type })
    setTimeout(() => setToast(null), 4000)
  }

  const fetchLoads = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from('loads')
        .select('id, pickup_location, delivery_location')
        .order('created_at', { ascending: false })
      if (!error) setLoads(data ?? [])
    } finally {
      setLoadingLoads(false)
    }
  }, [supabase])

  const fetchSessions = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from('shipment_tracking')
        .select('*')
        .eq('is_active', true)
        .order('created_at', { ascending: false })
      if (!error) setSessions((data as ShipmentTracking[]) ?? [])
    } finally {
      setLoadingSessions(false)
    }
  }, [supabase])

  useEffect(() => {
    fetchLoads()
    fetchSessions()
  }, [fetchLoads, fetchSessions])

  function handleChange(e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) {
    const { name, value } = e.target
    setForm((prev) => ({ ...prev, [name]: value }))
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setSubmitting(true)
    setFormError('')
    setTrackingUrl(null)

    try {
      const payload: Record<string, unknown> = {
        load_id: form.load_id,
        driver_name: form.driver_name.trim(),
        driver_phone: form.driver_phone.trim(),
        origin_lat: Number(form.origin_lat),
        origin_lng: Number(form.origin_lng),
        destination_lat: Number(form.destination_lat),
        destination_lng: Number(form.destination_lng),
      }
      if (form.yard_lat && form.yard_lng) {
        payload.yard_lat = Number(form.yard_lat)
        payload.yard_lng = Number(form.yard_lng)
      }

      const res = await fetch('/api/tracking/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })

      const json = await res.json()
      if (!res.ok) throw new Error(json.error ?? 'Failed to create tracking session')

      const fullUrl = `${window.location.origin}${json.tracking_url}`
      setTrackingUrl(fullUrl)
      setForm(emptyForm)
      showToast('Tracking session created! SMS sent to driver.', 'success')
      await fetchSessions()
    } catch (err) {
      setFormError(err instanceof Error ? err.message : 'Failed to create tracking session')
    } finally {
      setSubmitting(false)
    }
  }

  async function copyTrackingUrl() {
    if (!trackingUrl) return
    await navigator.clipboard.writeText(trackingUrl)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-xl font-semibold text-slate-900">Shipment Tracking</h1>
        <p className="text-sm text-slate-500">Create tracking sessions and monitor active shipments</p>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Create tracking form */}
        <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
          <h2 className="mb-1 text-base font-semibold text-slate-900">Start Tracking</h2>
          <p className="mb-5 text-sm text-slate-500">
            A tracking link will be sent to the driver via SMS.
          </p>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="mb-1 block text-sm font-medium text-slate-700">Load</label>
              {loadingLoads ? (
                <div className="h-9 w-full animate-pulse rounded-lg bg-slate-100" />
              ) : (
                <select
                  name="load_id"
                  value={form.load_id}
                  onChange={handleChange}
                  required
                  className="w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-900 focus:border-[#1a3a5c]/40 focus:outline-none focus:ring-2 focus:ring-[#1a3a5c]/10"
                >
                  <option value="">Select a load…</option>
                  {loads.map((load) => (
                    <option key={load.id} value={load.id}>
                      {load.pickup_location} → {load.delivery_location}
                    </option>
                  ))}
                </select>
              )}
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="mb-1 block text-sm font-medium text-slate-700">
                  Driver Name
                </label>
                <input
                  name="driver_name"
                  type="text"
                  placeholder="John Smith"
                  value={form.driver_name}
                  onChange={handleChange}
                  required
                  minLength={2}
                  maxLength={100}
                  className="w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-900 placeholder:text-slate-400 focus:border-[#1a3a5c]/40 focus:outline-none focus:ring-2 focus:ring-[#1a3a5c]/10"
                />
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium text-slate-700">
                  Driver Phone
                </label>
                <input
                  name="driver_phone"
                  type="tel"
                  placeholder="+1XXXXXXXXXX"
                  value={form.driver_phone}
                  onChange={handleChange}
                  required
                  className="w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-900 placeholder:text-slate-400 focus:border-[#1a3a5c]/40 focus:outline-none focus:ring-2 focus:ring-[#1a3a5c]/10"
                />
              </div>
            </div>

            {/* Origin coordinates */}
            <div>
              <p className="mb-2 text-sm font-medium text-slate-700">Origin Coordinates</p>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="mb-1 block text-xs text-slate-500">Latitude</label>
                  <input
                    name="origin_lat"
                    type="number"
                    placeholder="41.8781"
                    step="any"
                    value={form.origin_lat}
                    onChange={handleChange}
                    required
                    className="w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-900 placeholder:text-slate-400 focus:border-[#1a3a5c]/40 focus:outline-none focus:ring-2 focus:ring-[#1a3a5c]/10"
                  />
                </div>
                <div>
                  <label className="mb-1 block text-xs text-slate-500">Longitude</label>
                  <input
                    name="origin_lng"
                    type="number"
                    placeholder="-87.6298"
                    step="any"
                    value={form.origin_lng}
                    onChange={handleChange}
                    required
                    className="w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-900 placeholder:text-slate-400 focus:border-[#1a3a5c]/40 focus:outline-none focus:ring-2 focus:ring-[#1a3a5c]/10"
                  />
                </div>
              </div>
            </div>

            {/* Destination coordinates */}
            <div>
              <p className="mb-2 text-sm font-medium text-slate-700">Destination Coordinates</p>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="mb-1 block text-xs text-slate-500">Latitude</label>
                  <input
                    name="destination_lat"
                    type="number"
                    placeholder="33.7490"
                    step="any"
                    value={form.destination_lat}
                    onChange={handleChange}
                    required
                    className="w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-900 placeholder:text-slate-400 focus:border-[#1a3a5c]/40 focus:outline-none focus:ring-2 focus:ring-[#1a3a5c]/10"
                  />
                </div>
                <div>
                  <label className="mb-1 block text-xs text-slate-500">Longitude</label>
                  <input
                    name="destination_lng"
                    type="number"
                    placeholder="-84.3880"
                    step="any"
                    value={form.destination_lng}
                    onChange={handleChange}
                    required
                    className="w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-900 placeholder:text-slate-400 focus:border-[#1a3a5c]/40 focus:outline-none focus:ring-2 focus:ring-[#1a3a5c]/10"
                  />
                </div>
              </div>
            </div>

            {/* Yard coordinates (optional) */}
            <div>
              <p className="mb-2 text-sm font-medium text-slate-700">
                Yard Coordinates{' '}
                <span className="font-normal text-slate-400">— optional</span>
              </p>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="mb-1 block text-xs text-slate-500">Latitude</label>
                  <input
                    name="yard_lat"
                    type="number"
                    placeholder="41.9000"
                    step="any"
                    value={form.yard_lat}
                    onChange={handleChange}
                    className="w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-900 placeholder:text-slate-400 focus:border-[#1a3a5c]/40 focus:outline-none focus:ring-2 focus:ring-[#1a3a5c]/10"
                  />
                </div>
                <div>
                  <label className="mb-1 block text-xs text-slate-500">Longitude</label>
                  <input
                    name="yard_lng"
                    type="number"
                    placeholder="-87.7000"
                    step="any"
                    value={form.yard_lng}
                    onChange={handleChange}
                    className="w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-900 placeholder:text-slate-400 focus:border-[#1a3a5c]/40 focus:outline-none focus:ring-2 focus:ring-[#1a3a5c]/10"
                  />
                </div>
              </div>
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
              {submitting ? 'Creating…' : 'Start Tracking'}
            </button>
          </form>

          {/* Tracking URL success */}
          {trackingUrl && (
            <div className="mt-5 rounded-lg border border-green-200 bg-green-50 p-4">
              <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-green-700">
                Tracking Link
              </p>
              <div className="mb-2 flex items-center gap-2">
                <code className="flex-1 truncate rounded bg-white px-2 py-1.5 text-xs text-slate-700 shadow-sm">
                  {trackingUrl}
                </code>
                <button
                  type="button"
                  onClick={copyTrackingUrl}
                  className="shrink-0 rounded-lg border border-green-300 bg-white px-3 py-1.5 text-xs font-medium text-green-700 transition-colors hover:bg-green-50"
                >
                  {copied ? (
                    <CheckCircle size={13} className="inline" />
                  ) : (
                    <Copy size={13} className="inline" />
                  )}{' '}
                  {copied ? 'Copied' : 'Copy'}
                </button>
              </div>
              <p className="text-xs text-green-700">
                This link was sent to the driver via SMS.
              </p>
            </div>
          )}
        </div>

        {/* Active sessions */}
        <div>
          <div className="rounded-xl border border-slate-200 bg-white shadow-sm overflow-hidden">
            <div className="flex items-center justify-between border-b border-slate-100 px-5 py-4">
              <h2 className="text-sm font-semibold text-slate-900">Active Sessions</h2>
              <span className="text-xs text-slate-400">
                {loadingSessions ? '…' : `${sessions.length} active`}
              </span>
            </div>

            {loadingSessions ? (
              <div className="space-y-3 p-4">
                {Array.from({ length: 3 }).map((_, i) => (
                  <div key={i} className="h-14 animate-pulse rounded-lg bg-slate-100" />
                ))}
              </div>
            ) : sessions.length === 0 ? (
              <div className="p-8 text-center">
                <p className="text-sm text-slate-500">No active tracking sessions.</p>
              </div>
            ) : (
              <div className="divide-y divide-slate-100">
                {sessions.map((session) => (
                  <div
                    key={session.id}
                    className="flex items-center justify-between px-5 py-3"
                  >
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium text-slate-900">
                        {session.driver_name}
                      </p>
                      <p className="text-xs text-slate-500">{session.driver_phone}</p>
                    </div>

                    <div className="ml-3 flex items-center gap-3">
                      <span
                        className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${
                          trackingStatusStyles[session.status]
                        }`}
                      >
                        {trackingStatusLabels[session.status]}
                      </span>
                      {session.last_ping_at && (
                        <span className="text-[10px] text-slate-400">
                          {new Date(session.last_ping_at).toLocaleTimeString('en-US', {
                            hour: 'numeric',
                            minute: '2-digit',
                          })}
                        </span>
                      )}
                      <Link
                        href={`/track/${session.tracking_token}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-slate-400 hover:text-[#1a3a5c]"
                        aria-label="Open tracking link"
                      >
                        <ExternalLink size={13} />
                      </Link>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {toast && <Toast message={toast.message} type={toast.type} />}
    </div>
  )
}
