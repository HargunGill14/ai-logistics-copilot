import Link from 'next/link'
import { redirect } from 'next/navigation'
import {
  ArrowRight,
  Award,
  BadgeCheck,
  Clock,
  ExternalLink,
  ShieldCheck,
  Target,
  Trophy,
} from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { createClient } from '@/lib/supabase/server'
import { createServiceClient } from '@/lib/supabase/service'
import { calculateScorecard, type Grade, type ScorecardMetrics } from '@/lib/scorecard'
import type { BidStatus, LoadBid, MarketplaceLoad, VerificationStatus } from '@/types'
import type { ComponentType } from 'react'

interface CarrierScorecardRow extends ScorecardMetrics {
  trust_score: number
  verification_status: VerificationStatus
}

interface BidWithLoad extends LoadBid {
  load: MarketplaceLoad | null
}

const equipmentLabels: Record<MarketplaceLoad['equipment_type'], string> = {
  dry_van: 'Dry Van',
  reefer: 'Reefer',
  flatbed: 'Flatbed',
  step_deck: 'Step Deck',
  power_only: 'Power Only',
  tanker: 'Tanker',
}

const bidStatusStyles: Record<BidStatus, string> = {
  pending: 'border-blue-200 bg-blue-100 text-blue-700',
  accepted: 'border-green-200 bg-green-100 text-green-700',
  rejected: 'border-red-200 bg-red-100 text-red-700',
  withdrawn: 'border-slate-200 bg-slate-100 text-slate-600',
}

const gradeStyles: Record<Grade, string> = {
  A: 'border-green-200 bg-green-100 text-green-700',
  B: 'border-blue-200 bg-blue-100 text-blue-700',
  C: 'border-amber-200 bg-amber-100 text-amber-700',
  D: 'border-red-200 bg-red-100 text-red-700',
  'N/A': 'border-slate-200 bg-slate-100 text-slate-600',
}

export default async function CarrierDashboardPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  let verification: CarrierScorecardRow | null = null
  let bids: BidWithLoad[] = []
  let fetchError: string | null = null

  try {
    const [{ data: verificationRow }, { data: bidRows, error: bidsError }] = await Promise.all([
      supabase
        .from('carrier_verifications')
        .select('trust_score, verification_status, total_bids, accepted_bids, on_time_pickups, on_time_deliveries, total_loads_completed')
        .eq('carrier_id', user.id)
        .maybeSingle(),
      supabase
        .from('load_bids')
        .select('*')
        .eq('carrier_id', user.id)
        .order('submitted_at', { ascending: false }),
    ])

    if (bidsError) throw bidsError

    verification = verificationRow as CarrierScorecardRow | null
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
    fetchError = err instanceof Error ? err.message : 'Failed to load carrier dashboard'
  }

  const metrics: ScorecardMetrics = {
    total_bids: verification?.total_bids ?? 0,
    accepted_bids: verification?.accepted_bids ?? 0,
    on_time_pickups: verification?.on_time_pickups ?? 0,
    on_time_deliveries: verification?.on_time_deliveries ?? 0,
    total_loads_completed: verification?.total_loads_completed ?? 0,
  }
  const scorecard = calculateScorecard(metrics)
  const activeBids = bids.filter((bid) => bid.status === 'pending').slice(0, 5)
  const recentWins = bids.filter((bid) => bid.status === 'accepted').slice(0, 5)
  const trustScore = verification?.trust_score ?? 0
  const verificationStatus = verification?.verification_status ?? 'pending'

  return (
    <div>
      <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-xl font-semibold text-slate-900">Carrier Dashboard</h1>
          <p className="text-sm text-slate-500">Track trust, bids, and awarded FreTraq loads.</p>
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

      <div className="mb-6 grid grid-cols-1 gap-4 xl:grid-cols-[1.2fr_2fr]">
        <TrustPanel trustScore={trustScore} verificationStatus={verificationStatus} />

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <ScoreStat label="Total Bids" value={String(metrics.total_bids)} icon={Target} />
          <ScoreStat label="Win Rate" value={formatPct(scorecard.winRate)} icon={Trophy} />
          <ScoreStat label="On-Time Rate" value={formatPct(scorecard.onTimeRate)} icon={Clock} />
          <ScoreStat
            label="Grade"
            value={scorecard.grade}
            icon={Award}
            badgeClass={gradeStyles[scorecard.grade]}
          />
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-2">
        <DashboardSection
          title="Active Bids"
          subtitle={`${activeBids.length} pending ${activeBids.length === 1 ? 'bid' : 'bids'}`}
          emptyTitle="No active bids"
          emptyDescription="Pending bids will appear here after you bid on marketplace loads."
          bids={activeBids}
        />
        <DashboardSection
          title="Recent Wins"
          subtitle={`${recentWins.length} awarded ${recentWins.length === 1 ? 'load' : 'loads'}`}
          emptyTitle="No awarded loads yet"
          emptyDescription="Accepted bids will appear here when brokers award you loads."
          bids={recentWins}
        />
      </div>
    </div>
  )
}

function TrustPanel({
  trustScore,
  verificationStatus,
}: {
  trustScore: number
  verificationStatus: VerificationStatus
}) {
  const tone =
    trustScore >= 70
      ? 'border-green-200 bg-green-50 text-green-700'
      : trustScore >= 40
        ? 'border-amber-200 bg-amber-50 text-amber-700'
        : 'border-red-200 bg-red-50 text-red-700'

  return (
    <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
      <div className="mb-5 flex items-start justify-between gap-4">
        <div>
          <p className="text-xs font-medium uppercase tracking-wider text-slate-500">Trust Score</p>
          <div className="mt-2 flex items-end gap-2">
            <span className="text-5xl font-semibold tabular-nums text-[#1a3a5c]">{trustScore}</span>
            <span className="pb-1 text-sm font-medium text-slate-500">/ 100</span>
          </div>
        </div>
        <div className={`flex h-12 w-12 items-center justify-center rounded-xl border ${tone}`}>
          <ShieldCheck size={24} />
        </div>
      </div>
      <Badge variant="outline" className={`capitalize ${verificationTone(verificationStatus)}`}>
        <BadgeCheck size={13} />
        {verificationStatus}
      </Badge>
      <p className="mt-4 text-sm text-slate-500">
        Higher trust improves broker confidence and helps bids stand out in the marketplace.
      </p>
    </div>
  )
}

function ScoreStat({
  label,
  value,
  icon: Icon,
  badgeClass,
}: {
  label: string
  value: string
  icon: ComponentType<{ size?: number; className?: string }>
  badgeClass?: string
}) {
  return (
    <div className="rounded-xl border border-slate-200 border-l-4 border-l-teal-500 bg-white p-5 shadow-sm">
      <div className="mb-4 flex items-center justify-between gap-3">
        <p className="text-xs font-medium uppercase tracking-wider text-slate-500">{label}</p>
        <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-teal-50 text-teal-700">
          <Icon size={17} />
        </div>
      </div>
      {badgeClass ? (
        <Badge variant="outline" className={`text-base font-bold ${badgeClass}`}>
          {value}
        </Badge>
      ) : (
        <p className="text-3xl font-semibold tabular-nums text-slate-900">{value}</p>
      )}
    </div>
  )
}

function DashboardSection({
  title,
  subtitle,
  emptyTitle,
  emptyDescription,
  bids,
}: {
  title: string
  subtitle: string
  emptyTitle: string
  emptyDescription: string
  bids: BidWithLoad[]
}) {
  return (
    <div className="rounded-xl border border-slate-200 bg-white shadow-sm">
      <div className="flex items-center justify-between border-b border-slate-100 px-5 py-4">
        <div>
          <h2 className="text-sm font-semibold text-slate-900">{title}</h2>
          <p className="text-xs text-slate-500">{subtitle}</p>
        </div>
        <Link href="/carrier/bids" className="text-xs font-medium text-[#1a3a5c] hover:text-[#1a3a5c]/80">
          View all
        </Link>
      </div>
      {bids.length === 0 ? (
        <div className="px-6 py-12 text-center">
          <p className="text-sm font-medium text-slate-900">{emptyTitle}</p>
          <p className="mx-auto mt-1 max-w-sm text-sm text-slate-500">{emptyDescription}</p>
        </div>
      ) : (
        <div className="divide-y divide-slate-100">
          {bids.map((bid) => (
            <BidSummaryRow key={bid.id} bid={bid} />
          ))}
        </div>
      )}
    </div>
  )
}

function BidSummaryRow({ bid }: { bid: BidWithLoad }) {
  const load = bid.load

  return (
    <div className="px-5 py-4">
      <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
        <div className="flex flex-wrap items-center gap-2 text-sm font-medium text-slate-900">
          {load ? (
            <>
              {load.origin_city}, {load.origin_state}
              <ArrowRight size={14} className="text-slate-400" />
              {load.destination_city}, {load.destination_state}
            </>
          ) : (
            'Load unavailable'
          )}
        </div>
        <StatusBadge status={bid.status} />
      </div>
      <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-slate-500">
        <span className="font-semibold tabular-nums text-[#1a3a5c]">{formatCurrency(bid.bid_amount)}</span>
        {load && <span>{equipmentLabels[load.equipment_type]}</span>}
        {load && <span>Pickup {formatDate(load.pickup_date)}</span>}
        <span>Submitted {formatDate(bid.submitted_at)}</span>
      </div>
    </div>
  )
}

function StatusBadge({ status }: { status: BidStatus }) {
  return (
    <Badge variant="outline" className={`capitalize ${bidStatusStyles[status]}`}>
      {status}
    </Badge>
  )
}

function verificationTone(status: VerificationStatus): string {
  const styles: Record<VerificationStatus, string> = {
    verified: 'border-green-200 bg-green-100 text-green-700',
    pending: 'border-blue-200 bg-blue-100 text-blue-700',
    flagged: 'border-amber-200 bg-amber-100 text-amber-700',
    rejected: 'border-red-200 bg-red-100 text-red-700',
  }
  return styles[status]
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

function formatPct(rate: number | null): string {
  return rate === null ? '-' : `${Math.round(rate * 100)}%`
}
