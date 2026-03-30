'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Load } from '@/types'

const statusStyles: Record<string, string> = {
  draft: 'bg-slate-100 text-slate-600',
  pricing: 'bg-blue-100 text-blue-700',
  negotiating: 'bg-purple-100 text-purple-700',
  active: 'bg-green-100 text-green-700',
  completed: 'bg-gray-100 text-gray-600',
}

const loadTypeLabels: Record<string, string> = {
  dry_van: 'Dry Van',
  reefer: 'Reefer',
  flatbed: 'Flatbed',
  step_deck: 'Step Deck',
}
export default function LoadsPage() {
  const [loads, setLoads] = useState<Load[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const router = useRouter()
  const supabase = createClient()

  useEffect(() => {
    fetchLoads()
  }, [])

  async function fetchLoads() {
    const { data } = await supabase
      .from('loads')
      .select('*')
      .order('created_at', { ascending: false })
    setLoads(data || [])
    setLoading(false)
  }

  const filtered = loads.filter((load) => {
    const matchesSearch =
      search === '' ||
      load.pickup_location.toLowerCase().includes(search.toLowerCase()) ||
      load.delivery_location.toLowerCase().includes(search.toLowerCase())
    const matchesStatus =
      statusFilter === 'all' || load.status === statusFilter
    return matchesSearch && matchesStatus
  })
return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-xl font-semibold text-slate-900">Load Management</h1>
          <p className="text-sm text-slate-500">{loads.length} total loads</p>
        </div>
        <a href="/loads/new" className="px-4 py-2 rounded-lg text-sm font-medium text-white" style={{ backgroundColor: '#1a3a5c' }}>+ New Load</a>
      </div>

      <div className="flex gap-3 mb-4">
        <input
          type="text"
          placeholder="Search by pickup or delivery..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="px-3 py-2 text-sm border border-slate-200 rounded-lg bg-white focus:outline-none w-64"
        />
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="px-3 py-2 text-sm border border-slate-200 rounded-lg bg-white focus:outline-none">
          <option value="all">All statuses</option>
          <option value="draft">Draft</option>
          <option value="pricing">Pricing</option>
          <option value="negotiating">Negotiating</option>
          <option value="active">Active</option>
          <option value="completed">Completed</option>
        </select>
      </div>
      <div className="bg-white rounded-lg border border-slate-200 overflow-hidden">
        {loading ? (
          <div className="p-12 text-center text-sm text-slate-400">Loading...</div>
        ) : filtered.length === 0 ? (
          <div className="p-12 text-center">
            <p className="text-sm text-slate-500 mb-3">No loads found</p>
            <a href="/loads/new" className="text-sm font-medium" style={{ color: '#1a3a5c' }}>Create your first load</a>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200">
                  <th className="text-left px-4 py-3 text-xs font-medium text-slate-500">ID</th>
                  <th className="text-left px-4 py-3 text-xs font-medium text-slate-500">Route</th>
                  <th className="text-left px-4 py-3 text-xs font-medium text-slate-500">Type</th>
                  <th className="text-left px-4 py-3 text-xs font-medium text-slate-500">Miles</th>
                  <th className="text-left px-4 py-3 text-xs font-medium text-slate-500">Shipper Rate</th>
                  <th className="text-left px-4 py-3 text-xs font-medium text-slate-500">Carrier Cost</th>
                  <th className="text-left px-4 py-3 text-xs font-medium text-slate-500">Margin</th>
                  <th className="text-left px-4 py-3 text-xs font-medium text-slate-500">Status</th>
                  <th className="text-left px-4 py-3 text-xs font-medium text-slate-500">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((load) => (
                  <tr key={load.id} className="border-b border-slate-100 hover:bg-slate-50">
                    <td className="px-4 py-3 font-mono text-xs text-slate-400">{load.id.slice(0, 8)}</td>
                    <td className="px-4 py-3">
                      <div className="font-medium text-slate-900">{load.pickup_location}</div>
                      <div className="text-slate-400 text-xs">to {load.delivery_location}</div>
                    </td>
                    <td className="px-4 py-3 text-slate-600">{loadTypeLabels[load.load_type] || load.load_type}</td>
                    <td className="px-4 py-3 text-slate-600">{load.distance_miles}</td>
                    <td className="px-4 py-3 font-medium text-slate-900">${load.shipper_rate.toLocaleString()}</td>
                    <td className="px-4 py-3 text-slate-600">{load.carrier_cost ? `$${load.carrier_cost.toLocaleString()}` : '—'}</td>
                    <td className="px-4 py-3">
                      {load.margin_percentage ? (
                        <span className={`font-medium ${load.margin_percentage >= 15 ? 'text-green-600' : load.margin_percentage >= 8 ? 'text-amber-600' : 'text-red-600'}`}>
                          {load.margin_percentage.toFixed(1)}%
                        </span>
                      ) : '—'}
                    </td>
                    <td className="px-4 py-3">
                      <span className={`text-xs px-2 py-1 rounded-full font-medium ${statusStyles[load.status] || 'bg-slate-100 text-slate-600'}`}>
                        {load.status}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      {load.status === 'draft' || load.status === 'pricing' ? (
                        <button onClick={() => router.push(`/pricing?loadId=${load.id}`)} className="text-xs px-2.5 py-1 rounded border border-slate-200 text-slate-600 hover:bg-slate-100">AI Price</button>
                      ) : (
                        <button onClick={() => router.push(`/negotiate?loadId=${load.id}`)} className="text-xs px-2.5 py-1 rounded border border-slate-200 text-slate-600 hover:bg-slate-100">Negotiate</button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}