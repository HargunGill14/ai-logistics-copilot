import Link from 'next/link'
import { redirect } from 'next/navigation'
import { ArrowRight, Inbox, Package, Plus } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { createClient } from '@/lib/supabase/server'
import type { MarketplaceLoad, MarketplaceLoadStatus } from '@/types'

interface LoadWithBidCount extends MarketplaceLoad {
  bid_count: number
}

interface BidCountRow {
  marketplace_load_id: string
}

const equipmentLabels: Record<MarketplaceLoad['equipment_type'], string> = {
  dry_van: 'Dry Van',
  reefer: 'Reefer',
  flatbed: 'Flatbed',
  step_deck: 'Step Deck',
  power_only: 'Power Only',
  tanker: 'Tanker',
}

const statusStyles: Record<MarketplaceLoadStatus, string> = {
  posted: 'bg-blue-100 text-blue-700 border-blue-200',
  covered: 'bg-green-100 text-green-700 border-green-200',
  in_transit: 'bg-teal-100 text-teal-700 border-teal-200',
  delivered: 'bg-slate-100 text-slate-700 border-slate-200',
  cancelled: 'bg-red-100 text-red-700 border-red-200',
  expired: 'bg-amber-100 text-amber-700 border-amber-200',
}

export default async function LoadsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  let loads: LoadWithBidCount[] = []
  let fetchError: string | null = null

  try {
    const { data: loadRows, error: loadsError } = await supabase
      .from('marketplace_loads')
      .select('*')
      .eq('broker_id', user.id)
      .order('created_at', { ascending: false })

    if (loadsError) throw loadsError

    const marketplaceLoads = (loadRows ?? []) as MarketplaceLoad[]
    const loadIds = marketplaceLoads.map((load) => load.id)
    const bidCounts = new Map<string, number>()

    if (loadIds.length > 0) {
      const { data: bidRows, error: bidsError } = await supabase
        .from('load_bids')
        .select('marketplace_load_id')
        .in('marketplace_load_id', loadIds)

      if (bidsError) throw bidsError

      for (const bid of (bidRows ?? []) as BidCountRow[]) {
        bidCounts.set(
          bid.marketplace_load_id,
          (bidCounts.get(bid.marketplace_load_id) ?? 0) + 1,
        )
      }
    }

    loads = marketplaceLoads.map((load) => ({
      ...load,
      bid_count: bidCounts.get(load.id) ?? 0,
    }))
  } catch (err) {
    fetchError = err instanceof Error ? err.message : 'Failed to load posted loads'
  }

  return (
    <div>
      <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-xl font-semibold text-slate-900">Posted Loads</h1>
          <p className="text-sm text-slate-500">
            Manage marketplace loads and review carrier bids.
          </p>
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

      {loads.length === 0 ? (
        <EmptyState />
      ) : (
        <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
          <Table>
            <TableHeader className="bg-slate-50">
              <TableRow>
                <TableHead className="text-xs uppercase tracking-wider text-slate-500">Route</TableHead>
                <TableHead className="text-xs uppercase tracking-wider text-slate-500">Pickup</TableHead>
                <TableHead className="text-xs uppercase tracking-wider text-slate-500">Equipment</TableHead>
                <TableHead className="text-xs uppercase tracking-wider text-slate-500">Bids</TableHead>
                <TableHead className="text-xs uppercase tracking-wider text-slate-500">Target Rate</TableHead>
                <TableHead className="text-xs uppercase tracking-wider text-slate-500">Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loads.map((load) => (
                <TableRow key={load.id} className="hover:bg-slate-50">
                  <TableCell>
                    <Link
                      href={`/loads/${load.id}`}
                      className="group flex min-w-64 items-center gap-3 text-slate-900"
                    >
                      <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-[#1a3a5c]/10 text-[#1a3a5c]">
                        <Package size={16} />
                      </span>
                      <span className="min-w-0">
                        <span className="flex flex-wrap items-center gap-1.5 font-medium">
                          {load.origin_city}, {load.origin_state}
                          <ArrowRight size={14} className="text-slate-400" />
                          {load.destination_city}, {load.destination_state}
                        </span>
                        <span className="mt-0.5 block font-mono text-xs text-slate-400">
                          #{load.id.slice(0, 8).toUpperCase()}
                        </span>
                      </span>
                    </Link>
                  </TableCell>
                  <TableCell className="text-slate-600">
                    {formatDate(load.pickup_date)}
                  </TableCell>
                  <TableCell className="text-slate-600">
                    {equipmentLabels[load.equipment_type]}
                  </TableCell>
                  <TableCell className="font-medium tabular-nums text-slate-900">
                    {load.bid_count}
                  </TableCell>
                  <TableCell className="font-semibold tabular-nums text-slate-900">
                    {formatCurrency(load.target_rate)}
                  </TableCell>
                  <TableCell>
                    <StatusBadge status={load.status} />
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  )
}

function EmptyState() {
  return (
    <div className="rounded-xl border border-dashed border-slate-300 bg-white px-6 py-14 text-center shadow-sm">
      <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-[#1a3a5c]/10 text-[#1a3a5c]">
        <Inbox size={22} />
      </div>
      <h2 className="text-base font-semibold text-slate-900">No loads posted yet</h2>
      <p className="mx-auto mt-1 max-w-sm text-sm text-slate-500">
        Post your first load to start receiving bids from verified carriers.
      </p>
      <Button asChild className="mt-5 rounded-lg bg-[#1a3a5c] text-white hover:bg-[#1a3a5c]/90">
        <Link href="/loads/new">
          <Plus size={16} />
          Post New Load
        </Link>
      </Button>
    </div>
  )
}

function StatusBadge({ status }: { status: MarketplaceLoadStatus }) {
  return (
    <Badge
      variant="outline"
      className={`capitalize ${statusStyles[status] ?? 'border-slate-200 bg-slate-100 text-slate-600'}`}
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
    year: 'numeric',
  }).format(new Date(iso))
}
