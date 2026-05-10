import Link from 'next/link'
import { redirect } from 'next/navigation'
import { ArrowRight, CheckCircle2, ClipboardList, Plus, Radio, Truck } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { createClient } from '@/lib/supabase/server'
import type { MarketplaceLoad, MarketplaceLoadStatus } from '@/types'

interface BidCountRow {
  marketplace_load_id: string
}

const statusStyles: Record<MarketplaceLoadStatus, string> = {
  posted: 'bg-blue-100 text-blue-700 border-blue-200',
  covered: 'bg-green-100 text-green-700 border-green-200',
  in_transit: 'bg-teal-100 text-teal-700 border-teal-200',
  delivered: 'bg-slate-100 text-slate-700 border-slate-200',
  cancelled: 'bg-red-100 text-red-700 border-red-200',
  expired: 'bg-amber-100 text-amber-700 border-amber-200',
}

export default async function DashboardPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  let loads: MarketplaceLoad[] = []
  let totalBids = 0
  let fetchError: string | null = null

  try {
    const { data: loadRows, error: loadsError } = await supabase
      .from('marketplace_loads')
      .select('*')
      .eq('broker_id', user.id)
      .order('created_at', { ascending: false })

    if (loadsError) throw loadsError

    loads = (loadRows ?? []) as MarketplaceLoad[]
    const loadIds = loads.map((load) => load.id)

    if (loadIds.length > 0) {
      const { data: bidRows, error: bidsError } = await supabase
        .from('load_bids')
        .select('marketplace_load_id')
        .in('marketplace_load_id', loadIds)

      if (bidsError) throw bidsError
      totalBids = ((bidRows ?? []) as BidCountRow[]).length
    }
  } catch (err) {
    fetchError = err instanceof Error ? err.message : 'Failed to load dashboard data'
  }

  const now = new Date()
  const month = now.getMonth()
  const year = now.getFullYear()
  const activeLoads = loads.filter((load) => load.status === 'posted' || load.status === 'in_transit')
  const coveredThisMonth = loads.filter((load) => {
    if (!load.covered_at) return false
    const coveredAt = new Date(load.covered_at)
    return coveredAt.getMonth() === month && coveredAt.getFullYear() === year
  })
  const recentLoads = loads.slice(0, 5)

  return (
    <div>
      <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-xl font-semibold text-slate-900">Broker Dashboard</h1>
          <p className="text-sm text-slate-500">FreTraq load coverage and bid activity.</p>
        </div>
        <Button asChild className="rounded-lg bg-[#1a3a5c] text-white hover:bg-[#1a3a5c]/90">
          <Link href="/loads/new">
            <Plus size={16} />
            Post New Load
          </Link>
        </Button>
      </div>

      {fetchError && (
        <div className="mb-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600">
          {fetchError}
        </div>
      )}

      <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          label="Total Loads Posted"
          value={loads.length}
          icon={ClipboardList}
          tone="border-l-[#1a3a5c] bg-[#1a3a5c]/10 text-[#1a3a5c]"
        />
        <StatCard
          label="Active Loads"
          value={activeLoads.length}
          icon={Radio}
          tone="border-l-teal-500 bg-teal-50 text-teal-700"
        />
        <StatCard
          label="Covered This Month"
          value={coveredThisMonth.length}
          icon={CheckCircle2}
          tone="border-l-green-500 bg-green-50 text-green-700"
        />
        <StatCard
          label="Total Bids Received"
          value={totalBids}
          icon={Truck}
          tone="border-l-blue-500 bg-blue-50 text-blue-700"
        />
      </div>

      <div className="rounded-xl border border-slate-200 bg-white shadow-sm">
        <div className="flex items-center justify-between border-b border-slate-100 px-5 py-4">
          <div>
            <h2 className="text-sm font-semibold text-slate-900">Recent Activity</h2>
            <p className="text-xs text-slate-500">Last 5 posted loads</p>
          </div>
          <Link href="/loads" className="text-xs font-medium text-[#1a3a5c] hover:text-[#1a3a5c]/80">
            View all
          </Link>
        </div>

        {recentLoads.length === 0 ? (
          <div className="px-6 py-12 text-center">
            <p className="text-sm font-medium text-slate-900">No load activity yet</p>
            <p className="mt-1 text-sm text-slate-500">Posted loads will appear here.</p>
          </div>
        ) : (
          <div className="divide-y divide-slate-100">
            {recentLoads.map((load) => (
              <Link
                key={load.id}
                href={`/loads/${load.id}`}
                className="flex items-center justify-between gap-4 px-5 py-4 transition-colors hover:bg-slate-50"
              >
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2 text-sm font-medium text-slate-900">
                    {load.origin_city}, {load.origin_state}
                    <ArrowRight size={14} className="text-slate-400" />
                    {load.destination_city}, {load.destination_state}
                  </div>
                  <p className="mt-1 text-xs text-slate-500">
                    Pickup {formatDate(load.pickup_date)} · Target {formatCurrency(load.target_rate)}
                  </p>
                </div>
                <StatusBadge status={load.status} />
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

interface StatCardProps {
  label: string
  value: number
  icon: React.ComponentType<{ size?: number; className?: string }>
  tone: string
}

function StatCard({ label, value, icon: Icon, tone }: StatCardProps) {
  const [borderClass, iconBgClass, iconTextClass] = tone.split(' ')

  return (
    <div className={`rounded-xl border border-slate-200 ${borderClass} border-l-4 bg-white p-5 shadow-sm`}>
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-xs font-medium uppercase tracking-wider text-slate-500">{label}</p>
          <p className="mt-2 text-3xl font-semibold tabular-nums text-slate-900">{value}</p>
        </div>
        <div className={`flex h-10 w-10 items-center justify-center rounded-lg ${iconBgClass}`}>
          <Icon size={18} className={iconTextClass} />
        </div>
      </div>
    </div>
  )
}

function StatusBadge({ status }: { status: MarketplaceLoadStatus }) {
  return (
    <Badge
      variant="outline"
      className={`shrink-0 capitalize ${statusStyles[status] ?? 'border-slate-200 bg-slate-100 text-slate-600'}`}
    >
      {status.replace('_', ' ')}
    </Badge>
  )
}

function formatCurrency(value: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    maximumFractionDigits: 0,
  }).format(value)
}

function formatDate(iso: string): string {
  return new Intl.DateTimeFormat('en-US', {
    month: 'short',
    day: 'numeric',
  }).format(new Date(iso))
}
