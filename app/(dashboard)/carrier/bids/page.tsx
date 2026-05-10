import Link from 'next/link'
import { redirect } from 'next/navigation'
import { ArrowRight, ExternalLink, ListFilter } from 'lucide-react'
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
import { createServiceClient } from '@/lib/supabase/service'
import type { BidStatus, LoadBid, MarketplaceLoad } from '@/types'

interface CarrierBidHistoryPageProps {
  searchParams: Promise<{ status?: string }>
}

interface BidWithLoad extends LoadBid {
  load: MarketplaceLoad | null
}

const statusFilters: Array<{ value: 'all' | BidStatus; label: string }> = [
  { value: 'all', label: 'All' },
  { value: 'pending', label: 'Pending' },
  { value: 'accepted', label: 'Accepted' },
  { value: 'rejected', label: 'Rejected' },
  { value: 'withdrawn', label: 'Withdrawn' },
]

const statusStyles: Record<BidStatus, string> = {
  pending: 'border-blue-200 bg-blue-100 text-blue-700',
  accepted: 'border-green-200 bg-green-100 text-green-700',
  rejected: 'border-red-200 bg-red-100 text-red-700',
  withdrawn: 'border-slate-200 bg-slate-100 text-slate-600',
}

const equipmentLabels: Record<MarketplaceLoad['equipment_type'], string> = {
  dry_van: 'Dry Van',
  reefer: 'Reefer',
  flatbed: 'Flatbed',
  step_deck: 'Step Deck',
  power_only: 'Power Only',
  tanker: 'Tanker',
}

export default async function CarrierBidHistoryPage({ searchParams }: CarrierBidHistoryPageProps) {
  const { status } = await searchParams
  const activeStatus = normalizeStatus(status)
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  let bids: BidWithLoad[] = []
  let fetchError: string | null = null

  try {
    let bidQuery = supabase
      .from('load_bids')
      .select('*')
      .eq('carrier_id', user.id)
      .order('submitted_at', { ascending: false })

    if (activeStatus !== 'all') {
      bidQuery = bidQuery.eq('status', activeStatus)
    }

    const { data: bidRows, error: bidsError } = await bidQuery
    if (bidsError) throw bidsError

    const carrierBids = (bidRows ?? []) as LoadBid[]
    const loadIds = [...new Set(carrierBids.map((bid) => bid.marketplace_load_id))]
    const loadMap = new Map<string, MarketplaceLoad>()

    if (loadIds.length > 0) {
      const { data: loadRows, error: loadsError } = await createServiceClient()
        .from('marketplace_loads')
        .select('*')
        .in('id', loadIds)

      if (loadsError) throw loadsError

      for (const load of (loadRows ?? []) as MarketplaceLoad[]) {
        loadMap.set(load.id, load)
      }
    }

    bids = carrierBids.map((bid) => ({
      ...bid,
      load: loadMap.get(bid.marketplace_load_id) ?? null,
    }))
  } catch (err) {
    fetchError = err instanceof Error ? err.message : 'Failed to load bid history'
  }

  return (
    <div>
      <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-xl font-semibold text-slate-900">Bid History</h1>
          <p className="text-sm text-slate-500">Review every bid you have submitted on FreTraq.</p>
        </div>
        <Button asChild className="rounded-lg bg-[#1a3a5c] text-white hover:bg-[#1a3a5c]/90">
          <Link href="/carrier/marketplace">
            Marketplace
            <ExternalLink size={15} />
          </Link>
        </Button>
      </div>

      {fetchError && (
        <div className="mb-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600">
          {fetchError}
        </div>
      )}

      <div className="mb-4 flex flex-wrap items-center gap-2">
        <div className="mr-1 flex items-center gap-1.5 text-xs font-medium uppercase tracking-wider text-slate-500">
          <ListFilter size={14} />
          Filter
        </div>
        {statusFilters.map((filter) => {
          const href = filter.value === 'all' ? '/carrier/bids' : `/carrier/bids?status=${filter.value}`
          const isActive = activeStatus === filter.value
          return (
            <Link
              key={filter.value}
              href={href}
              className={`rounded-full px-3 py-1.5 text-xs font-medium transition-colors ${
                isActive
                  ? 'bg-[#1a3a5c] text-white'
                  : 'border border-slate-200 bg-white text-slate-600 hover:bg-slate-50 hover:text-slate-900'
              }`}
            >
              {filter.label}
            </Link>
          )
        })}
      </div>

      {bids.length === 0 ? (
        <div className="rounded-xl border border-dashed border-slate-300 bg-white px-6 py-14 text-center shadow-sm">
          <h2 className="text-base font-semibold text-slate-900">No bids found</h2>
          <p className="mx-auto mt-1 max-w-sm text-sm text-slate-500">
            {activeStatus === 'all'
              ? 'Submitted bids will appear here after you bid on marketplace loads.'
              : `No ${activeStatus} bids match this filter.`}
          </p>
        </div>
      ) : (
        <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
          <Table>
            <TableHeader className="bg-slate-50">
              <TableRow>
                <TableHead className="text-xs uppercase tracking-wider text-slate-500">Load</TableHead>
                <TableHead className="text-xs uppercase tracking-wider text-slate-500">Pickup</TableHead>
                <TableHead className="text-xs uppercase tracking-wider text-slate-500">Equipment</TableHead>
                <TableHead className="text-xs uppercase tracking-wider text-slate-500">Bid Amount</TableHead>
                <TableHead className="text-xs uppercase tracking-wider text-slate-500">Estimated Pickup</TableHead>
                <TableHead className="text-xs uppercase tracking-wider text-slate-500">Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {bids.map((bid) => (
                <TableRow key={bid.id} className="hover:bg-slate-50">
                  <TableCell>
                    {bid.load ? (
                      <div className="min-w-64">
                        <div className="flex flex-wrap items-center gap-1.5 font-medium text-slate-900">
                          {bid.load.origin_city}, {bid.load.origin_state}
                          <ArrowRight size={14} className="text-slate-400" />
                          {bid.load.destination_city}, {bid.load.destination_state}
                        </div>
                        <p className="mt-0.5 font-mono text-xs text-slate-400">
                          #{bid.load.id.slice(0, 8).toUpperCase()}
                        </p>
                      </div>
                    ) : (
                      <span className="text-slate-500">Load unavailable</span>
                    )}
                  </TableCell>
                  <TableCell className="text-slate-600">
                    {bid.load ? formatDate(bid.load.pickup_date) : '-'}
                  </TableCell>
                  <TableCell className="text-slate-600">
                    {bid.load ? equipmentLabels[bid.load.equipment_type] : '-'}
                  </TableCell>
                  <TableCell className="font-semibold tabular-nums text-[#1a3a5c]">
                    {formatCurrency(bid.bid_amount)}
                  </TableCell>
                  <TableCell className="text-slate-600">
                    {bid.estimated_pickup ? formatDateTime(bid.estimated_pickup) : 'Not provided'}
                  </TableCell>
                  <TableCell>
                    <StatusBadge status={bid.status} />
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

function StatusBadge({ status }: { status: BidStatus }) {
  return (
    <Badge variant="outline" className={`capitalize ${statusStyles[status]}`}>
      {status}
    </Badge>
  )
}

function normalizeStatus(status: string | undefined): 'all' | BidStatus {
  if (
    status === 'pending' ||
    status === 'accepted' ||
    status === 'rejected' ||
    status === 'withdrawn'
  ) {
    return status
  }
  return 'all'
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

function formatDateTime(iso: string): string {
  return new Intl.DateTimeFormat('en-US', {
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  }).format(new Date(iso))
}
