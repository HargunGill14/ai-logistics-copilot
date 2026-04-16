'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { Load } from '@/types'
import {
  Search,
  SearchX,
  Inbox,
  Calculator,
  MessageSquare,
  Plus,
} from 'lucide-react'

const loadTypeLabels: Record<string, string> = {
  dry_van: 'Dry Van',
  reefer: 'Reefer',
  flatbed: 'Flatbed',
  step_deck: 'Step Deck',
}

type StatusFilterValue = 'all' | Load['status']

const statusFilters: { value: StatusFilterValue; label: string }[] = [
  { value: 'all', label: 'All' },
  { value: 'draft', label: 'Draft' },
  { value: 'pricing', label: 'Pricing' },
  { value: 'negotiating', label: 'Negotiating' },
  { value: 'active', label: 'Active' },
  { value: 'completed', label: 'Completed' },
]

export default function LoadsPage() {
  const [loads, setLoads] = useState<Load[]>([])
  const [loading, setLoading] = useState(true)
  const [fetchError, setFetchError] = useState('')
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState<StatusFilterValue>('all')
  const router = useRouter()
  const supabase = createClient()

  useEffect(() => {
    fetchLoads()
  }, [])

  async function fetchLoads() {
    try {
      const { data, error } = await supabase
        .from('loads')
        .select('*')
        .order('created_at', { ascending: false })
      if (error) throw error
      setLoads(data ?? [])
    } catch (err) {
      setFetchError(err instanceof Error ? err.message : 'Failed to load loads')
    } finally {
      setLoading(false)
    }
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

  function clearFilters() {
    setSearch('')
    setStatusFilter('all')
  }

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold text-slate-900">Load Management</h1>
          <p className="text-sm text-slate-500">
            {loading
              ? 'Loading loads…'
              : `${filtered.length} of ${loads.length} ${loads.length === 1 ? 'load' : 'loads'}`}
          </p>
        </div>
        <a
          href="/loads/new"
          className="inline-flex items-center gap-1.5 rounded-lg bg-[#1a3a5c] px-4 py-2 text-sm font-medium text-white shadow-sm transition-colors hover:bg-[#1a3a5c]/90"
        >
          <Plus size={16} />
          New Load
        </a>
      </div>

      <div className="mb-4 flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <div className="relative w-full sm:w-80">
          <Search
            size={16}
            className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
          />
          <input
            type="text"
            placeholder="Search by pickup or delivery…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full rounded-lg border border-slate-200 bg-white py-2 pl-9 pr-3 text-sm text-slate-900 placeholder:text-slate-400 transition-all focus:border-[#1a3a5c]/40 focus:outline-none focus:ring-2 focus:ring-[#1a3a5c]/10"
          />
        </div>

        <div className="flex flex-wrap gap-2">
          {statusFilters.map((opt) => {
            const isActive = statusFilter === opt.value
            return (
              <button
                key={opt.value}
                type="button"
                onClick={() => setStatusFilter(opt.value)}
                className={`rounded-full px-3 py-1.5 text-xs font-medium transition-all duration-200 ${
                  isActive
                    ? 'bg-[#1a3a5c] text-white shadow-sm'
                    : 'border border-slate-200 bg-white text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                }`}
              >
                {opt.label}
              </button>
            )
          })}
        </div>
      </div>

      {fetchError && (
        <div className="mb-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600">
          {fetchError}
        </div>
      )}

      <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
        {loading ? (
          <SkeletonRows />
        ) : loads.length === 0 ? (
          <EmptyNoLoads />
        ) : filtered.length === 0 ? (
          <EmptyNoMatch onClear={clearFilters} />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50">
                  <th className="px-4 py-2.5 text-left text-xs font-medium uppercase tracking-wider text-slate-500">ID</th>
                  <th className="px-4 py-2.5 text-left text-xs font-medium uppercase tracking-wider text-slate-500">Route</th>
                  <th className="px-4 py-2.5 text-left text-xs font-medium uppercase tracking-wider text-slate-500">Type</th>
                  <th className="px-4 py-2.5 text-left text-xs font-medium uppercase tracking-wider text-slate-500">Miles</th>
                  <th className="px-4 py-2.5 text-left text-xs font-medium uppercase tracking-wider text-slate-500">Shipper Rate</th>
                  <th className="px-4 py-2.5 text-left text-xs font-medium uppercase tracking-wider text-slate-500">Carrier Cost</th>
                  <th className="px-4 py-2.5 text-left text-xs font-medium uppercase tracking-wider text-slate-500">Margin</th>
                  <th className="px-4 py-2.5 text-left text-xs font-medium uppercase tracking-wider text-slate-500">Status</th>
                  <th className="px-4 py-2.5 text-left text-xs font-medium uppercase tracking-wider text-slate-500">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((load) => (
                  <tr
                    key={load.id}
                    className="cursor-pointer border-b border-slate-100 transition-colors duration-150 last:border-0 hover:bg-slate-50"
                    onClick={() => router.push(`/loads/${load.id}`)}
                  >
                    <td className="px-4 py-3" onClick={(e) => e.stopPropagation()}>
                      <Link
                        href={`/loads/${load.id}`}
                        className="font-mono text-xs text-[#1a3a5c] underline-offset-2 hover:underline"
                      >
                        #{load.id.slice(0, 8).toUpperCase()}
                      </Link>
                    </td>
                    <td className="px-4 py-3">
                      <div className="font-medium text-slate-900">{load.pickup_location}</div>
                      <div className="text-xs text-slate-400">to {load.delivery_location}</div>
                    </td>
                    <td className="px-4 py-3 text-slate-600">{loadTypeLabels[load.load_type] ?? load.load_type}</td>
                    <td className="px-4 py-3 tabular-nums text-slate-600">{load.distance_miles.toLocaleString()}</td>
                    <td className="px-4 py-3 font-medium tabular-nums text-slate-900">
                      ${load.shipper_rate.toLocaleString()}
                    </td>
                    <td className="px-4 py-3 tabular-nums text-slate-600">
                      {load.carrier_cost ? `$${load.carrier_cost.toLocaleString()}` : '—'}
                    </td>
                    <td className="px-4 py-3 tabular-nums">
                      {load.margin_percentage ? (
                        <span
                          className={`font-medium ${
                            load.margin_percentage >= 15
                              ? 'text-green-600'
                              : load.margin_percentage >= 8
                                ? 'text-amber-600'
                                : 'text-red-600'
                          }`}
                        >
                          {load.margin_percentage.toFixed(1)}%
                        </span>
                      ) : (
                        '—'
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <StatusPill status={load.status} />
                    </td>
                    <td className="px-4 py-3" onClick={(e) => e.stopPropagation()}>
                      {load.status === 'draft' || load.status === 'pricing' ? (
                        <button
                          type="button"
                          onClick={() => router.push(`/pricing?loadId=${load.id}`)}
                          className="inline-flex items-center gap-1.5 rounded-md border border-slate-200 px-2.5 py-1 text-xs font-medium text-slate-600 transition-colors hover:border-[#1a3a5c]/30 hover:bg-[#1a3a5c]/5 hover:text-[#1a3a5c]"
                        >
                          <Calculator size={13} />
                          AI Price
                        </button>
                      ) : (
                        <button
                          type="button"
                          onClick={() => router.push(`/negotiate?loadId=${load.id}`)}
                          className="inline-flex items-center gap-1.5 rounded-md border border-slate-200 px-2.5 py-1 text-xs font-medium text-slate-600 transition-colors hover:border-[#1a3a5c]/30 hover:bg-[#1a3a5c]/5 hover:text-[#1a3a5c]"
                        >
                          <MessageSquare size={13} />
                          Negotiate
                        </button>
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

interface StatusPillProps {
  status: Load['status']
}

function StatusPill({ status }: StatusPillProps) {
  const styles: Record<string, { pill: string; dot: string }> = {
    active: { pill: 'bg-green-100 text-green-700', dot: 'bg-green-500' },
    negotiating: { pill: 'bg-purple-100 text-purple-700', dot: 'bg-purple-500' },
    pricing: { pill: 'bg-blue-100 text-blue-700', dot: 'bg-blue-500' },
    draft: { pill: 'bg-slate-100 text-slate-600', dot: 'bg-slate-400' },
    completed: { pill: 'bg-slate-100 text-slate-600', dot: 'bg-slate-400' },
  }
  const tone = styles[status] ?? { pill: 'bg-slate-100 text-slate-600', dot: 'bg-slate-400' }
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium capitalize ${tone.pill}`}
    >
      <span className={`h-1.5 w-1.5 rounded-full ${tone.dot}`} />
      {status}
    </span>
  )
}

function SkeletonRows() {
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-slate-200 bg-slate-50">
            {['ID', 'Route', 'Type', 'Miles', 'Shipper Rate', 'Carrier Cost', 'Margin', 'Status', 'Actions'].map((h) => (
              <th
                key={h}
                className="px-4 py-2.5 text-left text-xs font-medium uppercase tracking-wider text-slate-500"
              >
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {Array.from({ length: 6 }).map((_, i) => (
            <tr key={i} className="border-b border-slate-100 last:border-0">
              <td className="px-4 py-3"><div className="h-4 w-16 animate-pulse rounded bg-slate-100" /></td>
              <td className="px-4 py-3">
                <div className="h-4 w-36 animate-pulse rounded bg-slate-100" />
                <div className="mt-1.5 h-3 w-24 animate-pulse rounded bg-slate-100" />
              </td>
              <td className="px-4 py-3"><div className="h-4 w-16 animate-pulse rounded bg-slate-100" /></td>
              <td className="px-4 py-3"><div className="h-4 w-12 animate-pulse rounded bg-slate-100" /></td>
              <td className="px-4 py-3"><div className="h-4 w-20 animate-pulse rounded bg-slate-100" /></td>
              <td className="px-4 py-3"><div className="h-4 w-20 animate-pulse rounded bg-slate-100" /></td>
              <td className="px-4 py-3"><div className="h-4 w-12 animate-pulse rounded bg-slate-100" /></td>
              <td className="px-4 py-3"><div className="h-6 w-20 animate-pulse rounded-full bg-slate-100" /></td>
              <td className="px-4 py-3"><div className="h-7 w-20 animate-pulse rounded bg-slate-100" /></td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

function EmptyNoLoads() {
  return (
    <div className="p-12 text-center">
      <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-[#1a3a5c]/10">
        <Inbox size={22} className="text-[#1a3a5c]" />
      </div>
      <h3 className="mb-1 text-sm font-semibold text-slate-900">No loads yet</h3>
      <p className="mb-5 text-sm text-slate-500">Create your first load to get AI-powered pricing.</p>
      <a
        href="/loads/new"
        className="inline-flex items-center gap-1.5 rounded-lg bg-[#1a3a5c] px-4 py-2 text-sm font-medium text-white shadow-sm transition-colors hover:bg-[#1a3a5c]/90"
      >
        <Plus size={16} />
        New Load
      </a>
    </div>
  )
}

interface EmptyNoMatchProps {
  onClear: () => void
}

function EmptyNoMatch({ onClear }: EmptyNoMatchProps) {
  return (
    <div className="p-12 text-center">
      <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-slate-100">
        <SearchX size={22} className="text-slate-500" />
      </div>
      <h3 className="mb-1 text-sm font-semibold text-slate-900">No loads match your filters</h3>
      <p className="mb-5 text-sm text-slate-500">Try a different search term or adjust the status filter.</p>
      <button
        type="button"
        onClick={onClear}
        className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700 transition-colors hover:border-[#1a3a5c]/30 hover:bg-[#1a3a5c]/5 hover:text-[#1a3a5c]"
      >
        Clear filters
      </button>
    </div>
  )
}
