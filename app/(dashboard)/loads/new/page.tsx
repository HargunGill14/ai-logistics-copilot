'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

export default function NewLoadPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const [form, setForm] = useState({
    pickup_location: '',
    delivery_location: '',
    distance_miles: '',
    load_type: 'dry_van',
    weight_lbs: '',
    shipper_rate: '',
    notes: '',
  })

  function handleChange(e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) {
    setForm({ ...form, [e.target.name]: e.target.value })
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError('')

    try {
      const res = await fetch('/api/loads', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          pickup_location: form.pickup_location,
          delivery_location: form.delivery_location,
          distance_miles: parseFloat(form.distance_miles),
          load_type: form.load_type,
          weight_lbs: parseFloat(form.weight_lbs),
          shipper_rate: parseFloat(form.shipper_rate),
          notes: form.notes || undefined,
        }),
      })

      const data = await res.json()

      if (!res.ok) {
        setError(data.error ?? 'Something went wrong')
        setLoading(false)
        return
      }

      router.push(`/pricing?loadId=${data.id}`)
    } catch {
      setError('Something went wrong')
      setLoading(false)
    }
  }

  return (
    <div className="max-w-2xl">
      <div className="mb-6">
        <h1 className="text-xl font-semibold text-slate-900">New Load</h1>
        <p className="text-sm text-slate-500">Enter load details to get AI-powered pricing</p>
      </div>

      <div className="bg-white rounded-lg border border-slate-200 p-6">
        <form onSubmit={handleSubmit} className="space-y-5">

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                Pickup location
              </label>
              <input
                name="pickup_location"
                type="text"
                placeholder="Chicago, IL"
                value={form.pickup_location}
                onChange={handleChange}
                required
                className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg bg-slate-50 focus:outline-none focus:ring-2 focus:border-transparent"
                style={{ '--tw-ring-color': '#1a3a5c' } as React.CSSProperties}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                Delivery location
              </label>
              <input
                name="delivery_location"
                type="text"
                placeholder="Atlanta, GA"
                value={form.delivery_location}
                onChange={handleChange}
                required
                className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg bg-slate-50 focus:outline-none focus:ring-2"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                Distance (miles)
              </label>
              <input
                name="distance_miles"
                type="number"
                placeholder="716"
                value={form.distance_miles}
                onChange={handleChange}
                required
                className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg bg-slate-50 focus:outline-none focus:ring-2"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                Load type
              </label>
              <select
                name="load_type"
                value={form.load_type}
                onChange={handleChange}
                className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg bg-slate-50 focus:outline-none focus:ring-2"
              >
                <option value="dry_van">Dry Van</option>
                <option value="reefer">Reefer</option>
                <option value="flatbed">Flatbed</option>
                <option value="step_deck">Step Deck</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                Weight (lbs)
              </label>
              <input
                name="weight_lbs"
                type="number"
                placeholder="42000"
                value={form.weight_lbs}
                onChange={handleChange}
                required
                className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg bg-slate-50 focus:outline-none focus:ring-2"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                Shipper offered rate ($)
              </label>
              <input
                name="shipper_rate"
                type="number"
                placeholder="3200"
                value={form.shipper_rate}
                onChange={handleChange}
                required
                className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg bg-slate-50 focus:outline-none focus:ring-2"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              Notes (optional)
            </label>
            <textarea
              name="notes"
              placeholder="Hazmat, liftgate, special requirements..."
              value={form.notes}
              onChange={handleChange}
              rows={2}
              className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg bg-slate-50 focus:outline-none focus:ring-2 resize-none"
            />
          </div>

          <div className="bg-slate-50 border border-slate-200 rounded-lg p-3 flex items-start gap-2">
            <svg width="16" height="16" viewBox="0 0 20 20" fill="none" className="mt-0.5 flex-shrink-0">
              <circle cx="10" cy="10" r="9" stroke="#1a3a5c" strokeWidth="1.5"/>
              <path d="M10 6v4M10 13v.5" stroke="#1a3a5c" strokeWidth="1.5" strokeLinecap="round"/>
            </svg>
            <p className="text-xs text-slate-600">
              AI will automatically calculate estimated carrier cost, suggested broker rate, margin, and risk level after submission.
            </p>
          </div>

          {error && (
            <div className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg p-3">
              {error}
            </div>
          )}

          <div className="flex gap-3 pt-1">
            <button
              type="submit"
              disabled={loading}
              className="px-5 py-2 rounded-lg text-sm font-medium text-white disabled:opacity-50"
              style={{ backgroundColor: '#1a3a5c' }}>
              {loading ? 'Saving...' : 'Run AI Pricing →'}
            </button>
            <button
              type="button"
              onClick={() => router.back()}
              className="px-4 py-2 rounded-lg text-sm font-medium text-slate-600 border border-slate-200 hover:bg-slate-50">
              Cancel
            </button>
          </div>

        </form>
      </div>
    </div>
  )
}
