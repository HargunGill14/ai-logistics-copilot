import Link from 'next/link'
import { notFound, redirect } from 'next/navigation'
import { ArrowLeft, ArrowRight, CalendarClock, CheckCircle2, Clock, Package } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { createClient } from '@/lib/supabase/server'
import { createServiceClient } from '@/lib/supabase/service'
import { BidDecisionButtons } from '@/components/loads/BidDecisionButtons'
import { EmailComposer } from '@/components/loads/EmailComposer'
import { PostToDatButton } from '@/components/loads/PostToDatButton'
import type { BidStatus, LoadBid, MarketplaceLoad, MarketplaceLoadStatus } from '@/types'

interface LoadDetailPageProps {
  params: Promise<{ id: string }>
}

interface CarrierProfileRow {
  id: string
  full_name: string | null
}

interface CarrierVerificationRow {
  carrier_id: string
  trust_score: number
  verification_status: string
}

interface BrokerProfileRow {
  organization_id: string
  role: string | null
  gmail_email: string | null
  gmail_connected_at: string | null
}

interface BidWithCarrier extends LoadBid {
  carrier_name: string
  trust_score: number | null
  verification_status: string | null
}

const equipmentLabels: Record<MarketplaceLoad['equipment_type'], string> = {
  dry_van: 'Dry Van',
  reefer: 'Reefer',
  flatbed: 'Flatbed',
  step_deck: 'Step Deck',
  power_only: 'Power Only',
  tanker: 'Tanker',
}

const loadStatusStyles: Record<MarketplaceLoadStatus, string> = {
  posted: 'bg-blue-100 text-blue-700 border-blue-200',
  covered: 'bg-green-100 text-green-700 border-green-200',
  in_transit: 'bg-teal-100 text-teal-700 border-teal-200',
  delivered: 'bg-slate-100 text-slate-700 border-slate-200',
  cancelled: 'bg-red-100 text-red-700 border-red-200',
  expired: 'bg-amber-100 text-amber-700 border-amber-200',
}

const bidStatusStyles: Record<BidStatus, string> = {
  pending: 'bg-blue-100 text-blue-700 border-blue-200',
  accepted: 'bg-green-100 text-green-700 border-green-200',
  rejected: 'bg-red-100 text-red-700 border-red-200',
  withdrawn: 'bg-slate-100 text-slate-600 border-slate-200',
}

export default async function LoadDetailPage({ params }: LoadDetailPageProps) {
  const { id } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  const { data: profile, error: profileError } = await supabase
    .from('profiles')
    .select('organization_id, role, gmail_email, gmail_connected_at')
    .eq('id', user.id)
    .single()

  if (profileError || !profile) {
    redirect('/login')
  }

  const brokerProfile = profile as BrokerProfileRow

  const { data: loadRow, error: loadError } = await supabase
    .from('marketplace_loads')
    .select('*')
    .eq('id', id)
    .eq('organization_id', brokerProfile.organization_id)
    .single()

  if (loadError || !loadRow) {
    notFound()
  }

  const load = loadRow as MarketplaceLoad
  const service = createServiceClient()

  const { data: bidRows } = await service
    .from('load_bids')
    .select('*')
    .eq('marketplace_load_id', load.id)
    .order('submitted_at', { ascending: false })

  const bids = (bidRows ?? []) as LoadBid[]
  const carrierIds = [...new Set(bids.map((bid) => bid.carrier_id))]

  let carrierNameMap = new Map<string, string>()
  let verificationMap = new Map<string, CarrierVerificationRow>()

  if (carrierIds.length > 0) {
    const [{ data: carrierRows }, { data: verificationRows }] = await Promise.all([
      service
        .from('profiles')
        .select('id, full_name')
        .in('id', carrierIds),
      service
        .from('carrier_verifications')
        .select('carrier_id, trust_score, verification_status')
        .in('carrier_id', carrierIds),
    ])

    carrierNameMap = new Map(
      ((carrierRows ?? []) as CarrierProfileRow[]).map((carrier) => [
        carrier.id,
        carrier.full_name ?? 'Carrier',
      ]),
    )
    verificationMap = new Map(
      ((verificationRows ?? []) as CarrierVerificationRow[]).map((verification) => [
        verification.carrier_id,
        verification,
      ]),
    )
  }

  const enrichedBids: BidWithCarrier[] = bids.map((bid) => {
    const verification = verificationMap.get(bid.carrier_id)
    return {
      ...bid,
      carrier_name: carrierNameMap.get(bid.carrier_id) ?? 'Carrier',
      trust_score: verification?.trust_score ?? null,
      verification_status: verification?.verification_status ?? null,
    }
  })

  const acceptedBid = enrichedBids.find((bid) => bid.status === 'accepted') ?? null

  return (
    <div>
      <div className="mb-6">
        <Link
          href="/loads"
          className="mb-3 inline-flex items-center gap-1 text-sm font-medium text-slate-500 hover:text-[#1a3a5c]"
        >
          <ArrowLeft size={15} />
          Back to loads
        </Link>
        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <h1 className="flex flex-wrap items-center gap-2 text-xl font-semibold text-slate-900">
              {load.origin_city}, {load.origin_state}
              <ArrowRight size={17} className="text-slate-400" />
              {load.destination_city}, {load.destination_state}
            </h1>
            <p className="mt-1 font-mono text-xs text-slate-400">
              #{load.id.slice(0, 8).toUpperCase()}
            </p>
          </div>
          <div className="flex flex-col items-start gap-2 sm:items-end">
            <LoadStatusBadge status={load.status} />
            <PostToDatButton
              loadId={load.id}
              datLoadId={load.dat_load_id}
              datPostedAt={load.dat_posted_at}
            />
          </div>
        </div>
      </div>

      <div className="mb-6 grid grid-cols-1 gap-4 lg:grid-cols-4">
        <LoadFact label="Pickup" value={formatDateTime(load.pickup_date)} />
        <LoadFact label="Equipment" value={equipmentLabels[load.equipment_type]} />
        <LoadFact label="Target Rate" value={formatCurrency(load.target_rate)} />
        <LoadFact
          label="DAT Status"
          value={load.dat_load_id ? `Posted #${load.dat_load_id}` : 'Not posted'}
        />
      </div>

      {brokerProfile.role === 'broker' && (
        <EmailComposer
          loadId={load.id}
          gmail={{
            connected: Boolean(brokerProfile.gmail_connected_at && brokerProfile.gmail_email),
            email: brokerProfile.gmail_email,
          }}
        />
      )}

      {load.status === 'covered' && acceptedBid && (
        <div className="mb-6 rounded-xl border border-green-200 bg-green-50 px-5 py-4 text-green-800">
          <div className="flex items-center gap-2 font-semibold">
            <CheckCircle2 size={18} />
            Covered by {acceptedBid.carrier_name}
          </div>
          <p className="mt-1 text-sm text-green-700">
            Winning bid: {formatCurrency(acceptedBid.bid_amount)}
            {load.covered_at ? ` · Covered ${formatDateTime(load.covered_at)}` : ''}
          </p>
        </div>
      )}

      <div className="rounded-xl border border-slate-200 bg-white shadow-sm">
        <div className="flex items-center justify-between border-b border-slate-100 px-5 py-4">
          <div>
            <h2 className="text-sm font-semibold text-slate-900">Carrier Bids</h2>
            <p className="text-xs text-slate-500">
              {enrichedBids.length} {enrichedBids.length === 1 ? 'bid' : 'bids'} received
            </p>
          </div>
        </div>

        {enrichedBids.length === 0 ? (
          <div className="px-6 py-14 text-center">
            <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-slate-100 text-slate-400">
              <Clock size={22} />
            </div>
            <h3 className="text-base font-semibold text-slate-900">No bids yet</h3>
            <p className="mx-auto mt-1 max-w-sm text-sm text-slate-500">
              Carrier bids will appear here as soon as they are submitted.
            </p>
          </div>
        ) : (
          <div className="divide-y divide-slate-100">
            {enrichedBids.map((bid) => (
              <BidCard key={bid.id} load={load} bid={bid} />
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

function BidCard({ load, bid }: { load: MarketplaceLoad; bid: BidWithCarrier }) {
  const isAccepted = bid.status === 'accepted'
  const canAct = load.status === 'posted' && bid.status === 'pending'

  return (
    <div className={`p-5 ${isAccepted ? 'bg-green-50/80' : 'bg-white'}`}>
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div className="min-w-0 flex-1">
          <div className="mb-2 flex flex-wrap items-center gap-2">
            <h3 className="text-sm font-semibold text-slate-900">{bid.carrier_name}</h3>
            <TrustScoreBadge score={bid.trust_score} />
            <BidStatusBadge status={bid.status} />
          </div>

          <div className="grid grid-cols-1 gap-3 text-sm sm:grid-cols-3">
            <BidFact label="Bid Amount" value={formatCurrency(bid.bid_amount)} emphasis />
            <BidFact
              label="Estimated Pickup"
              value={bid.estimated_pickup ? formatDateTime(bid.estimated_pickup) : 'Not provided'}
            />
            <BidFact label="Submitted" value={formatDateTime(bid.submitted_at)} />
          </div>

          {bid.notes && (
            <div className="mt-4 rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-600">
              {bid.notes}
            </div>
          )}
        </div>

        {canAct && (
          <div className="lg:w-52">
            <BidDecisionButtons loadId={load.id} bidId={bid.id} />
          </div>
        )}
      </div>
    </div>
  )
}

function LoadFact({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
      <div className="mb-2 flex items-center gap-1.5 text-xs font-medium uppercase tracking-wider text-slate-500">
        {label === 'Pickup' ? <CalendarClock size={13} /> : <Package size={13} />}
        {label}
      </div>
      <div className="text-sm font-semibold text-slate-900">{value}</div>
    </div>
  )
}

function BidFact({ label, value, emphasis = false }: { label: string; value: string; emphasis?: boolean }) {
  return (
    <div>
      <p className="text-xs text-slate-500">{label}</p>
      <p className={`mt-0.5 font-medium ${emphasis ? 'text-lg tabular-nums text-[#1a3a5c]' : 'text-slate-900'}`}>
        {value}
      </p>
    </div>
  )
}

function LoadStatusBadge({ status }: { status: MarketplaceLoadStatus }) {
  return (
    <Badge
      variant="outline"
      className={`capitalize ${loadStatusStyles[status] ?? 'border-slate-200 bg-slate-100 text-slate-600'}`}
    >
      {status.replace('_', ' ')}
    </Badge>
  )
}

function BidStatusBadge({ status }: { status: BidStatus }) {
  return (
    <Badge
      variant="outline"
      className={`capitalize ${bidStatusStyles[status] ?? 'border-slate-200 bg-slate-100 text-slate-600'}`}
    >
      {status}
    </Badge>
  )
}

function TrustScoreBadge({ score }: { score: number | null }) {
  const tone =
    score === null
      ? 'border-slate-200 bg-slate-100 text-slate-600'
      : score >= 70
        ? 'border-green-200 bg-green-100 text-green-700'
        : score >= 40
          ? 'border-amber-200 bg-amber-100 text-amber-700'
          : 'border-red-200 bg-red-100 text-red-700'

  const label =
    score === null
      ? 'Trust unknown'
      : score >= 70
        ? `Trust ${score}`
        : score >= 40
          ? `Caution ${score}`
          : `Low trust ${score}`

  return (
    <Badge variant="outline" className={tone}>
      {label}
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

function formatDateTime(iso: string): string {
  return new Intl.DateTimeFormat('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  }).format(new Date(iso))
}
