'use client'

import { useEffect, useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Load } from '@/types'

interface CapacityPost {
  id: string
  organization_id: string
  created_by: string
  pickup_location: string
  delivery_location: string
  available_date: string
  truck_type: 'dry_van' | 'reefer' | 'flatbed' | 'step_deck'
  status: 'open' | 'matched' | 'closed'
  created_at: string
}

export default function CarrierDashboardPage() {
  const router = useRouter()
  const supabase = createClient()

  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')
  const [formError, setFormError] = useState('')

  const [availableLoads, setAvailableLoads] = useState<Load[]>([])
  const [myPosts, setMyPosts] = useState<CapacityPost[]>([])
  const [userId, setUserId] = useState<string | null>(null)
  const [organizationId, setOrganizationId] = useState<string | null>(null)

  const [form, setForm] = useState({
    pickup_location: '',
    delivery_location: '',
    available_date: '',
    truck_type: 'dry_van',
  })

  const loadData = useCallback(async () => {
    setLoading(true)
    setError('')
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        router.push('/login')
        return
      }
      setUserId(user.id)

      const res = await fetch('/api/carrier/loads')
      const json = await res.json()

      if (!res.ok) {
        if (res.status === 401) { router.push('/login'); return }
        throw new Error(json.error ?? 'Failed to load data')
      }

      setOrganizationId(json.organization_id ?? null)
      setAvailableLoads(json.loads ?? [])
      setMyPosts(json.posts ?? [])
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load data')
    } finally {
      setLoading(false)
    }
  }, [router, supabase])

  useEffect(() => {
    loadData()
  }, [loadData])

  function handleChange(e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) {
    setForm({ ...form, [e.target.name]: e.target.value })
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setSubmitting(true)
    setFormError('')

    try {
      if (!userId) throw new Error('Not authenticated')

      const { error: insertError } = await supabase
        .from('capacity_posts')
        .insert({
          organization_id: organizationId,
          created_by: userId,
          pickup_location: form.pickup_location,
          delivery_location: form.delivery_location,
          available_date: form.available_date,
          truck_type: form.truck_type,
          status: 'open',
        })

      if (insertError) throw insertError

      setForm({
        pickup_location: '',
        delivery_location: '',
        available_date: '',
        truck_type: 'dry_van',
      })
      await loadData()
    } catch (err) {
      setFormError(err instanceof Error ? err.message : 'Failed to post capacity')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-xl font-semibold text-slate-900">Carrier Dashboard</h1>
          <p className="text-sm text-slate-500">Browse available loads and post your fleet capacity</p>
        </div>
      </div>

      {error && (
        <div className="mb-4 bg-red-50 border border-red-200 rounded-lg px-4 py-3 text-sm text-red-600">
          {error}
        </div>
      )}

      <div className="grid grid-cols-3 gap-4 mb-6">
        <div className="bg-white rounded-lg border border-slate-200 p-4">
          <div className="text-xs text-slate-500 mb-1">Available Loads</div>
          <div className="text-2xl font-semibold text-slate-900">{availableLoads.length}</div>
          <div className="text-xs text-slate-400 mt-1">Open to bid</div>
        </div>
        <div className="bg-white rounded-lg border border-slate-200 p-4">
          <div className="text-xs text-slate-500 mb-1">My Capacity Posts</div>
          <div className="text-2xl font-semibold text-slate-900">{myPosts.length}</div>
          <div className="text-xs text-slate-400 mt-1">{myPosts.filter(p => p.status === 'open').length} active</div>
        </div>
        <div className="bg-white rounded-lg border border-slate-200 p-4">
          <div className="text-xs text-slate-500 mb-1">Matched</div>
          <div className="text-2xl font-semibold text-slate-900">{myPosts.filter(p => p.status === 'matched').length}</div>
          <div className="text-xs text-slate-400 mt-1">Confirmed loads</div>
        </div>
      </div>

      {/* Available loads board */}
      <div className="bg-white rounded-lg border border-slate-200 overflow-hidden mb-6">
        <div className="flex items-center justify-between px-4 py-3 border-b border-slate-100">
          <h2 className="text-sm font-semibold text-slate-900">Available loads</h2>
          <span className="text-xs text-slate-400">{availableLoads.length} open</span>
        </div>
        {loading ? (
          <div className="p-8 text-center text-sm text-slate-500">Loading loads…</div>
        ) : availableLoads.length === 0 ? (
          <div className="p-8 text-center text-sm text-slate-500">No available loads right now.</div>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200">
                <th className="text-left px-4 py-2.5 text-xs font-medium text-slate-500">Route</th>
                <th className="text-left px-4 py-2.5 text-xs font-medium text-slate-500">Type</th>
                <th className="text-left px-4 py-2.5 text-xs font-medium text-slate-500">Weight</th>
                <th className="text-left px-4 py-2.5 text-xs font-medium text-slate-500">Distance</th>
                <th className="text-left px-4 py-2.5 text-xs font-medium text-slate-500">Offered Rate</th>
                <th className="text-left px-4 py-2.5 text-xs font-medium text-slate-500">Status</th>
              </tr>
            </thead>
            <tbody>
              {availableLoads.map((load) => (
                <tr key={load.id} className="border-b border-slate-100 last:border-0 hover:bg-slate-50">
                  <td className="px-4 py-3">
                    <div className="font-medium text-slate-900">{load.pickup_location}</div>
                    <div className="text-slate-400 text-xs">to {load.delivery_location}</div>
                  </td>
                  <td className="px-4 py-3 text-slate-600 capitalize">{load.load_type.replace('_', ' ')}</td>
                  <td className="px-4 py-3 text-slate-600">{load.weight_lbs?.toLocaleString()} lbs</td>
                  <td className="px-4 py-3 text-slate-600">{load.distance_miles?.toLocaleString()} mi</td>
                  <td className="px-4 py-3 font-medium text-slate-900">${load.shipper_rate?.toLocaleString()}</td>
                  <td className="px-4 py-3">
                    <span className={`text-xs px-2 py-1 rounded-full font-medium ${
                      load.status === 'active' ? 'bg-green-100 text-green-700' :
                      load.status === 'negotiating' ? 'bg-purple-100 text-purple-700' :
                      'bg-blue-100 text-blue-700'
                    }`}>
                      {load.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      <div className="grid grid-cols-5 gap-6">
        {/* Capacity posting form */}
        <div className="col-span-2 bg-white rounded-lg border border-slate-200 p-6">
          <h2 className="text-sm font-semibold text-slate-900 mb-1">Post capacity</h2>
          <p className="text-xs text-slate-500 mb-4">Advertise an available truck to brokers.</p>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Pickup location</label>
              <input
                name="pickup_location"
                type="text"
                placeholder="Chicago, IL"
                value={form.pickup_location}
                onChange={handleChange}
                required
                className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg bg-slate-50 focus:outline-none focus:ring-2"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Delivery location</label>
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
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Available date</label>
              <input
                name="available_date"
                type="date"
                value={form.available_date}
                onChange={handleChange}
                required
                className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg bg-slate-50 focus:outline-none focus:ring-2"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Truck type</label>
              <select
                name="truck_type"
                value={form.truck_type}
                onChange={handleChange}
                className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg bg-slate-50 focus:outline-none focus:ring-2"
              >
                <option value="dry_van">Dry Van</option>
                <option value="reefer">Reefer</option>
                <option value="flatbed">Flatbed</option>
                <option value="step_deck">Step Deck</option>
              </select>
            </div>

            {formError && (
              <div className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg p-3">
                {formError}
              </div>
            )}

            <button
              type="submit"
              disabled={submitting}
              className="w-full px-5 py-2 rounded-lg text-sm font-medium text-white disabled:opacity-50"
              style={{ backgroundColor: '#1a3a5c' }}
            >
              {submitting ? 'Posting…' : 'Post capacity'}
            </button>
          </form>
        </div>

        {/* My loads / capacity posts */}
        <div className="col-span-3 bg-white rounded-lg border border-slate-200 overflow-hidden">
          <div className="flex items-center justify-between px-4 py-3 border-b border-slate-100">
            <h2 className="text-sm font-semibold text-slate-900">My loads</h2>
            <span className="text-xs text-slate-400">{myPosts.length} total</span>
          </div>
          {loading ? (
            <div className="p-8 text-center text-sm text-slate-500">Loading…</div>
          ) : myPosts.length === 0 ? (
            <div className="p-8 text-center">
              <h3 className="text-sm font-medium text-slate-900 mb-1">No capacity posts yet</h3>
              <p className="text-sm text-slate-500">Post your first truck to let brokers know you&apos;re available.</p>
            </div>
          ) : (
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200">
                  <th className="text-left px-4 py-2.5 text-xs font-medium text-slate-500">Route</th>
                  <th className="text-left px-4 py-2.5 text-xs font-medium text-slate-500">Truck</th>
                  <th className="text-left px-4 py-2.5 text-xs font-medium text-slate-500">Available</th>
                  <th className="text-left px-4 py-2.5 text-xs font-medium text-slate-500">Status</th>
                </tr>
              </thead>
              <tbody>
                {myPosts.map((post) => (
                  <tr key={post.id} className="border-b border-slate-100 last:border-0 hover:bg-slate-50">
                    <td className="px-4 py-3">
                      <div className="font-medium text-slate-900">{post.pickup_location}</div>
                      <div className="text-slate-400 text-xs">to {post.delivery_location}</div>
                    </td>
                    <td className="px-4 py-3 text-slate-600 capitalize">{post.truck_type.replace('_', ' ')}</td>
                    <td className="px-4 py-3 text-slate-600">
                      {new Date(post.available_date).toLocaleDateString()}
                    </td>
                    <td className="px-4 py-3">
                      <span className={`text-xs px-2 py-1 rounded-full font-medium ${
                        post.status === 'open' ? 'bg-blue-100 text-blue-700' :
                        post.status === 'matched' ? 'bg-green-100 text-green-700' :
                        'bg-slate-100 text-slate-600'
                      }`}>
                        {post.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  )
}
