import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import SummaryCards from '@/components/financials/SummaryCards'
import MarginTable from '@/components/financials/MarginTable'
import RevenueChart from '@/components/financials/RevenueChart'
import TopCarriersTable from '@/components/financials/TopCarriersTable'
import type {
  FinancialSummary,
  MarginRow,
  MonthlyRevenue,
  CarrierMarginStat,
} from '@/types'

interface BidRow {
  id: string
  marketplace_load_id: string
  bid_amount: number
  carrier_id: string
  carrier_org_id: string
  status: string
}

interface LoadWithBid {
  id: string
  origin_city: string
  origin_state: string
  destination_city: string
  destination_state: string
  pickup_date: string
  target_rate: number
  covered_at: string | null
  load_bids: BidRow[]
}

interface OrgRow {
  id: string
  name: string
}

export default async function FinancialsPage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  let fetchError: string | null = null
  let summary: FinancialSummary = {
    totalRevenueMTD: 0,
    totalLoadsCoveredMTD: 0,
    avgMarginPerLoad: 0,
    projectedMonthlyRevenue: 0,
  }
  let marginRows: MarginRow[] = []
  let monthlyRevenue: MonthlyRevenue[] = []
  let topCarriers: CarrierMarginStat[] = []

  try {
    // Fetch all covered/in_transit/delivered loads for this broker with accepted bids
    const sixMonthsAgo = new Date()
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6)
    sixMonthsAgo.setDate(1)
    sixMonthsAgo.setHours(0, 0, 0, 0)

    const { data: loadsData, error: loadsError } = await supabase
      .from('marketplace_loads')
      .select(`
        id,
        origin_city,
        origin_state,
        destination_city,
        destination_state,
        pickup_date,
        target_rate,
        covered_at,
        load_bids (
          id,
          marketplace_load_id,
          bid_amount,
          carrier_id,
          carrier_org_id,
          status
        )
      `)
      .eq('broker_id', user.id)
      .in('status', ['covered', 'in_transit', 'delivered'])
      .order('covered_at', { ascending: false })

    if (loadsError) throw loadsError

    const loads = (loadsData ?? []) as LoadWithBid[]

    // Filter to only loads that have an accepted bid
    const coveredLoads = loads
      .map((load) => ({
        load,
        acceptedBid: load.load_bids.find((b) => b.status === 'accepted') ?? null,
      }))
      .filter((entry): entry is { load: LoadWithBid; acceptedBid: BidRow } => entry.acceptedBid !== null)

    // Fetch carrier org names for Top Carriers section
    const carrierOrgIds = [...new Set(coveredLoads.map((e) => e.acceptedBid.carrier_org_id))]
    let orgNames: Record<string, string> = {}
    if (carrierOrgIds.length > 0) {
      const { data: orgsData } = await supabase
        .from('organizations')
        .select('id, name')
        .in('id', carrierOrgIds)
      if (orgsData) {
        orgNames = Object.fromEntries((orgsData as OrgRow[]).map((o) => [o.id, o.name]))
      }
    }

    // --- Summary cards ---
    const now = new Date()
    const mtdStart = new Date(now.getFullYear(), now.getMonth(), 1)

    const mtdLoads = coveredLoads.filter(
      ({ load }) => load.covered_at && new Date(load.covered_at) >= mtdStart
    )

    const totalRevenueMTD = mtdLoads.reduce((sum, { load }) => sum + load.target_rate, 0)
    const totalLoadsCoveredMTD = mtdLoads.length

    const allMargins = coveredLoads.map(
      ({ load, acceptedBid }) => load.target_rate - acceptedBid.bid_amount
    )
    const avgMarginPerLoad =
      allMargins.length > 0 ? allMargins.reduce((a, b) => a + b, 0) / allMargins.length : 0

    const dayOfMonth = now.getDate()
    const daysInMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate()
    const projectedMonthlyRevenue =
      dayOfMonth > 0 ? (totalRevenueMTD / dayOfMonth) * daysInMonth : 0

    summary = { totalRevenueMTD, totalLoadsCoveredMTD, avgMarginPerLoad, projectedMonthlyRevenue }

    // --- Margin rows (all covered loads, most recent first) ---
    marginRows = coveredLoads.map(({ load, acceptedBid }) => {
      const marginDollar = load.target_rate - acceptedBid.bid_amount
      const marginPercent = load.target_rate > 0 ? (marginDollar / load.target_rate) * 100 : 0
      return {
        id: load.id,
        origin: `${load.origin_city}, ${load.origin_state}`,
        destination: `${load.destination_city}, ${load.destination_state}`,
        pickupDate: load.pickup_date,
        targetRate: load.target_rate,
        acceptedBid: acceptedBid.bid_amount,
        marginDollar,
        marginPercent,
      }
    })

    // --- Monthly revenue (last 6 months) ---
    const revenueByMonth: Record<string, number> = {}
    const months: string[] = []
    for (let i = 5; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1)
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
      const label = d.toLocaleString('en-US', { month: 'short', year: '2-digit' })
      revenueByMonth[key] = 0
      months.push(label)
    }

    const monthKeys = Object.keys(revenueByMonth)
    for (const { load } of coveredLoads) {
      if (!load.covered_at) continue
      const d = new Date(load.covered_at)
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
      if (key in revenueByMonth) {
        revenueByMonth[key] += load.target_rate
      }
    }

    monthlyRevenue = monthKeys.map((key, idx) => ({
      month: months[idx],
      revenue: revenueByMonth[key],
    }))

    // --- Top carriers by avg margin ---
    const carrierMap: Record<
      string,
      { name: string; totalMargin: number; totalRate: number; count: number }
    > = {}

    for (const { load, acceptedBid } of coveredLoads) {
      const orgId = acceptedBid.carrier_org_id
      const margin = load.target_rate - acceptedBid.bid_amount
      if (!carrierMap[orgId]) {
        carrierMap[orgId] = {
          name: orgNames[orgId] ?? 'Unknown Carrier',
          totalMargin: 0,
          totalRate: 0,
          count: 0,
        }
      }
      carrierMap[orgId].totalMargin += margin
      carrierMap[orgId].totalRate += load.target_rate
      carrierMap[orgId].count += 1
    }

    topCarriers = Object.entries(carrierMap)
      .map(([carrierId, stats]) => ({
        carrierId,
        carrierName: stats.name,
        loadsWorked: stats.count,
        avgMarginDollar: stats.count > 0 ? stats.totalMargin / stats.count : 0,
        avgMarginPercent:
          stats.totalRate > 0 ? (stats.totalMargin / stats.totalRate) * 100 : 0,
      }))
      .sort((a, b) => b.avgMarginDollar - a.avgMarginDollar)
      .slice(0, 10)
  } catch (err) {
    fetchError = err instanceof Error ? err.message : 'Failed to load financial data'
  }

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-xl font-semibold text-slate-900">Financials</h1>
        <p className="text-sm text-slate-500">Revenue, margins, and carrier performance.</p>
      </div>

      {fetchError && (
        <div className="mb-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600">
          {fetchError}
        </div>
      )}

      <div className="space-y-6">
        <SummaryCards summary={summary} />

        <div className="grid grid-cols-1 gap-6 xl:grid-cols-5">
          <div className="xl:col-span-3">
            <MarginTable rows={marginRows} />
          </div>
          <div className="xl:col-span-2">
            <RevenueChart data={monthlyRevenue} />
          </div>
        </div>

        <TopCarriersTable carriers={topCarriers} />
      </div>
    </div>
  )
}
