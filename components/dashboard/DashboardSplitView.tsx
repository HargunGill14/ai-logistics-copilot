'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import Link from 'next/link'
import { Load, Notification } from '@/types'
import { CountUp } from './CountUp'
import { Sparkline } from './Sparkline'
import {
  Truck,
  TrendingUp,
  DollarSign,
  AlertTriangle,
  Bell,
  X,
  ArrowLeft,
  ArrowRight,
  ExternalLink,
  PanelRight,
  PanelRightClose,
  MessageSquare,
  Sparkles,
  Plus,
  Calculator,
  MapPin,
} from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import type { ReactNode } from 'react'

interface Props {
  loads: Load[]
  notifications: Notification[]
  fetchError: string | null
}

const PANEL_DEFAULT = 384
const PANEL_MIN = 300
const PANEL_MAX = 560
const PANEL_STORAGE_KEY = 'fretraq:dashboard-panel-width'

export function DashboardSplitView({ loads, notifications, fetchError }: Props) {
  const [panelOpen, setPanelOpen] = useState(true)
  const [selectedLoadId, setSelectedLoadId] = useState<string | null>(null)
  const [panelWidth, setPanelWidth] = useState(PANEL_DEFAULT)
  const [isResizing, setIsResizing] = useState(false)
  const panelRef = useRef<HTMLElement>(null)

  useEffect(() => {
    const saved = window.localStorage.getItem(PANEL_STORAGE_KEY)
    if (!saved) return
    const n = parseInt(saved, 10)
    if (!Number.isNaN(n)) {
      setPanelWidth(Math.min(PANEL_MAX, Math.max(PANEL_MIN, n)))
    }
  }, [])

  useEffect(() => {
    window.localStorage.setItem(PANEL_STORAGE_KEY, String(panelWidth))
  }, [panelWidth])

  useEffect(() => {
    if (!isResizing) return
    function onMove(e: MouseEvent) {
      if (!panelRef.current) return
      const rect = panelRef.current.getBoundingClientRect()
      const next = Math.min(PANEL_MAX, Math.max(PANEL_MIN, rect.right - e.clientX))
      setPanelWidth(next)
    }
    function onUp() {
      setIsResizing(false)
    }
    document.body.style.cursor = 'col-resize'
    document.body.style.userSelect = 'none'
    window.addEventListener('mousemove', onMove)
    window.addEventListener('mouseup', onUp)
    return () => {
      document.body.style.cursor = ''
      document.body.style.userSelect = ''
      window.removeEventListener('mousemove', onMove)
      window.removeEventListener('mouseup', onUp)
    }
  }, [isResizing])

  const selectedLoad = useMemo(
    () => (selectedLoadId ? loads.find((l) => l.id === selectedLoadId) ?? null : null),
    [selectedLoadId, loads],
  )

  function handleRowClick(id: string) {
    setSelectedLoadId(id)
    setPanelOpen(true)
  }

  function handleClosePanel() {
    setPanelOpen(false)
  }

  function handleClearSelection() {
    setSelectedLoadId(null)
  }

  // KPIs
  const activeLoads = loads.filter((l) => l.status === 'active' || l.status === 'negotiating')
  const atRiskLoads = loads.filter((l) => l.margin_percentage && l.margin_percentage < 8)
  const marginPool = loads.filter((l) => l.margin_percentage)
  const avgMargin = marginPool.length
    ? marginPool.reduce((sum, l) => sum + (l.margin_percentage ?? 0), 0) / marginPool.length
    : 0
  const revenue = loads.reduce((sum, l) => sum + (l.shipper_rate || 0), 0)

  const trendActive = [2, 4, 3, 5, 4, 6, 5]
  const trendMargin = avgMargin > 0 ? [9, 10, 8, 11, 12, 10, 13] : [3, 3, 3, 3, 3, 3, 3]
  const trendRevenue = [10, 12, 9, 14, 13, 16, 15]
  const trendRisk = atRiskLoads.length > 0 ? [1, 2, 2, 3, 2, 4, 3] : [0, 0, 1, 0, 0, 1, 0]

  return (
    <div className="flex gap-4">
      <main className="min-w-0 flex-1">
        <div className="mb-6 flex items-center justify-between gap-3">
          <div className="min-w-0">
            <h1 className="text-xl font-semibold text-slate-900">Dashboard</h1>
            <p className="text-sm text-slate-500">Welcome back — here&apos;s your overview</p>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setPanelOpen((o) => !o)}
              aria-label={panelOpen ? 'Hide side panel' : 'Show side panel'}
              aria-pressed={panelOpen}
              title={panelOpen ? 'Hide panel' : 'Show panel'}
              className="hidden h-9 w-9 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-600 transition-colors hover:border-[#1a3a5c]/30 hover:bg-[#1a3a5c]/5 hover:text-[#1a3a5c] lg:inline-flex"
            >
              {panelOpen ? <PanelRightClose size={16} /> : <PanelRight size={16} />}
            </button>
            <Link
              href="/loads/new"
              className="inline-flex items-center gap-1.5 rounded-lg bg-[#1a3a5c] px-4 py-2 text-sm font-medium text-white shadow-sm transition-colors hover:bg-[#1a3a5c]/90"
            >
              <Plus size={15} />
              New Load
            </Link>
          </div>
        </div>

        {fetchError && (
          <div className="mb-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600">
            {fetchError}
          </div>
        )}

        <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <KpiCard
            label="Active Loads"
            accentClass="border-l-green-500"
            icon={Truck}
            iconWrapperClass="bg-green-50"
            iconClass="text-green-600"
            footer={
              <>
                <span className="font-medium text-slate-500">
                  <CountUp value={loads.length} />
                </span>{' '}
                total tracked
              </>
            }
            sparkline={<Sparkline className="h-7 w-full text-green-600/60" values={trendActive} />}
          >
            <CountUp value={activeLoads.length} />
          </KpiCard>

          <KpiCard
            label="Avg Margin"
            accentClass="border-l-blue-500"
            icon={TrendingUp}
            iconWrapperClass="bg-blue-50"
            iconClass="text-blue-600"
            footer="Across all loads"
            sparkline={<Sparkline className="h-7 w-full text-blue-600/60" values={trendMargin} />}
          >
            {avgMargin > 0 ? (
              <CountUp value={avgMargin} decimals={1} suffix="%" durationMs={1000} />
            ) : (
              '—'
            )}
          </KpiCard>

          <KpiCard
            label="Revenue MTD"
            accentClass="border-l-[#1a3a5c]"
            icon={DollarSign}
            iconWrapperClass="bg-[#1a3a5c]/10"
            iconClass="text-[#1a3a5c]"
            footer="Shipper rates"
            sparkline={<Sparkline className="h-7 w-full text-[#1a3a5c]/60" values={trendRevenue} />}
          >
            <CountUp value={revenue} prefix="$" durationMs={1100} />
          </KpiCard>

          <KpiCard
            label="At-Risk Loads"
            accentClass="border-l-red-500"
            icon={AlertTriangle}
            iconWrapperClass="bg-red-50"
            iconClass="text-red-600"
            footer="Below 8% margin"
            sparkline={
              <Sparkline
                className={
                  atRiskLoads.length > 0
                    ? 'h-7 w-full text-red-600/60'
                    : 'h-7 w-full text-slate-400/60'
                }
                values={trendRisk}
              />
            }
            valueClassName={atRiskLoads.length > 0 ? 'text-red-600' : undefined}
          >
            <CountUp value={atRiskLoads.length} />
          </KpiCard>
        </div>

        {loads.length > 0 ? (
          <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
            <div className="flex items-center justify-between border-b border-slate-100 px-4 py-3">
              <h2 className="text-sm font-semibold text-slate-900">Recent loads</h2>
              <Link
                href="/loads"
                className="text-xs font-medium text-[#1a3a5c] transition-colors hover:text-[#1a3a5c]/80"
              >
                View all →
              </Link>
            </div>
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50">
                  <th className="px-4 py-2.5 text-left text-xs font-medium uppercase tracking-wider text-slate-500">Route</th>
                  <th className="px-4 py-2.5 text-left text-xs font-medium uppercase tracking-wider text-slate-500">Type</th>
                  <th className="px-4 py-2.5 text-left text-xs font-medium uppercase tracking-wider text-slate-500">Shipper Rate</th>
                  <th className="px-4 py-2.5 text-left text-xs font-medium uppercase tracking-wider text-slate-500">Margin</th>
                  <th className="px-4 py-2.5 text-left text-xs font-medium uppercase tracking-wider text-slate-500">Status</th>
                </tr>
              </thead>
              <tbody>
                {loads.slice(0, 5).map((load) => {
                  const isSelected = load.id === selectedLoadId
                  return (
                    <tr
                      key={load.id}
                      onClick={() => handleRowClick(load.id)}
                      className={`cursor-pointer border-b border-slate-100 transition-colors duration-150 last:border-0 ${
                        isSelected ? 'bg-[#1a3a5c]/[0.04]' : 'hover:bg-slate-50'
                      }`}
                    >
                      <td className="relative px-4 py-3">
                        {isSelected && (
                          <span aria-hidden className="absolute inset-y-1.5 left-0 w-[3px] rounded-r-full bg-[#1a3a5c]" />
                        )}
                        <div className="font-medium text-slate-900">{load.pickup_location}</div>
                        <div className="text-xs text-slate-400">to {load.delivery_location}</div>
                      </td>
                      <td className="px-4 py-3 capitalize text-slate-600">{load.load_type.replace('_', ' ')}</td>
                      <td className="px-4 py-3 font-medium tabular-nums text-slate-900">
                        ${load.shipper_rate.toLocaleString()}
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
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="rounded-xl border border-slate-200 bg-white p-12 text-center shadow-sm">
            <h3 className="mb-1 text-sm font-medium text-slate-900">No loads yet</h3>
            <p className="mb-4 text-sm text-slate-500">Create your first load to get AI-powered pricing</p>
            <Link
              href="/loads/new"
              className="inline-flex items-center gap-1.5 rounded-lg bg-[#1a3a5c] px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-[#1a3a5c]/90"
            >
              <Plus size={15} />
              Create first load
            </Link>
          </div>
        )}
      </main>

      {panelOpen && (
        <aside
          ref={panelRef}
          style={{ width: panelWidth }}
          className="relative hidden shrink-0 lg:block"
        >
          <button
            type="button"
            onMouseDown={() => setIsResizing(true)}
            aria-label="Resize panel"
            className={`group absolute -left-2 top-0 z-10 h-full w-2 cursor-col-resize ${
              isResizing ? '' : ''
            }`}
          >
            <span
              aria-hidden
              className={`absolute left-1/2 top-1/2 h-12 w-[3px] -translate-x-1/2 -translate-y-1/2 rounded-full transition-colors ${
                isResizing ? 'bg-[#1a3a5c]' : 'bg-slate-200 group-hover:bg-[#1a3a5c]/40'
              }`}
            />
          </button>

          <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
            {selectedLoad ? (
              <LoadDetailPanel
                load={selectedLoad}
                onBack={handleClearSelection}
                onClose={handleClosePanel}
              />
            ) : (
              <NotificationsPanel notifications={notifications} onClose={handleClosePanel} />
            )}
          </div>
        </aside>
      )}
    </div>
  )
}

interface KpiCardProps {
  label: string
  accentClass: string
  icon: LucideIcon
  iconWrapperClass: string
  iconClass: string
  footer?: ReactNode
  sparkline?: ReactNode
  valueClassName?: string
  children: ReactNode
}

function KpiCard({
  label,
  accentClass,
  icon: Icon,
  iconWrapperClass,
  iconClass,
  footer,
  sparkline,
  valueClassName,
  children,
}: KpiCardProps) {
  return (
    <div
      className={`group relative rounded-xl border border-slate-200 ${accentClass} border-l-4 bg-white p-5 shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md`}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <div className="text-xs font-medium uppercase tracking-wider text-slate-500">{label}</div>
          <div
            className={`mt-2 text-3xl font-semibold tabular-nums ${valueClassName ?? 'text-slate-900'}`}
          >
            {children}
          </div>
          {footer && <div className="mt-2 text-xs text-slate-400">{footer}</div>}
        </div>
        <div
          className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg ${iconWrapperClass}`}
        >
          <Icon size={18} className={iconClass} />
        </div>
      </div>
      {sparkline && <div className="mt-3">{sparkline}</div>}
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

interface NotificationsPanelProps {
  notifications: Notification[]
  onClose: () => void
}

function NotificationsPanel({ notifications, onClose }: NotificationsPanelProps) {
  return (
    <div className="flex h-full flex-col">
      <div className="flex items-center justify-between border-b border-slate-100 px-4 py-3">
        <div className="flex items-center gap-2">
          <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-[#1a3a5c]/10">
            <Bell size={14} className="text-[#1a3a5c]" />
          </div>
          <div>
            <div className="text-sm font-semibold text-slate-900">Activity</div>
            <div className="text-[11px] text-slate-400">{notifications.length} recent</div>
          </div>
        </div>
        <button
          type="button"
          onClick={onClose}
          aria-label="Close panel"
          className="flex h-7 w-7 items-center justify-center rounded-md text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-700"
        >
          <X size={14} />
        </button>
      </div>

      {notifications.length > 0 ? (
        <div className="max-h-[60vh] divide-y divide-slate-100 overflow-y-auto">
          {notifications.map((n) => (
            <NotificationItem key={n.id} notification={n} />
          ))}
        </div>
      ) : (
        <div className="px-4 py-12 text-center">
          <div className="mx-auto mb-3 flex h-10 w-10 items-center justify-center rounded-full bg-slate-100">
            <Bell size={16} className="text-slate-400" />
          </div>
          <p className="text-sm font-medium text-slate-700">All caught up</p>
          <p className="mt-1 text-xs text-slate-400">New activity will appear here</p>
        </div>
      )}

      <div className="mt-auto border-t border-slate-100 px-4 py-3">
        <Link
          href="/notifications"
          className="inline-flex items-center gap-1 text-xs font-medium text-[#1a3a5c] transition-colors hover:text-[#1a3a5c]/80"
        >
          View all notifications
          <ArrowRight size={12} />
        </Link>
      </div>
    </div>
  )
}

const notifIconMap: Record<
  Notification['type'],
  { icon: LucideIcon; bg: string; color: string }
> = {
  margin_alert: { icon: AlertTriangle, bg: 'bg-amber-50', color: 'text-amber-600' },
  carrier_update: { icon: Truck, bg: 'bg-blue-50', color: 'text-blue-600' },
  shipper_reply: { icon: MessageSquare, bg: 'bg-purple-50', color: 'text-purple-600' },
  system: { icon: Bell, bg: 'bg-slate-100', color: 'text-slate-500' },
}

function NotificationItem({ notification }: { notification: Notification }) {
  const tone = notifIconMap[notification.type] ?? notifIconMap.system
  const Icon = tone.icon
  return (
    <div className="flex items-start gap-3 px-4 py-3.5">
      <div className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg ${tone.bg}`}>
        <Icon size={15} className={tone.color} />
      </div>
      <div className="min-w-0 flex-1">
        <div className="flex items-baseline justify-between gap-2">
          <p className="truncate text-sm font-medium text-slate-900">{notification.title}</p>
          <span className="shrink-0 text-[11px] text-slate-400">
            {formatRelativeTime(notification.created_at)}
          </span>
        </div>
        <p className="mt-0.5 line-clamp-2 text-xs leading-relaxed text-slate-500">
          {notification.description}
        </p>
      </div>
      {!notification.read && (
        <span aria-label="Unread" className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-[#1a3a5c]" />
      )}
    </div>
  )
}

interface LoadDetailPanelProps {
  load: Load
  onBack: () => void
  onClose: () => void
}

function LoadDetailPanel({ load, onBack, onClose }: LoadDetailPanelProps) {
  const marginColor = load.margin_percentage
    ? load.margin_percentage >= 15
      ? 'text-green-600'
      : load.margin_percentage >= 8
        ? 'text-amber-600'
        : 'text-red-600'
    : 'text-slate-400'

  const riskTone = load.risk_level
    ? {
        low: 'bg-green-100 text-green-700',
        medium: 'bg-amber-100 text-amber-700',
        high: 'bg-red-100 text-red-700',
      }[load.risk_level]
    : null

  const isPriceable = load.status === 'draft' || load.status === 'pricing'

  return (
    <div className="flex h-full flex-col">
      <div className="flex items-center justify-between gap-2 border-b border-slate-100 px-3 py-3">
        <button
          type="button"
          onClick={onBack}
          aria-label="Back to activity"
          className="inline-flex items-center gap-1 rounded-md px-2 py-1 text-xs font-medium text-slate-500 transition-colors hover:bg-slate-100 hover:text-slate-700"
        >
          <ArrowLeft size={13} />
          Activity
        </button>
        <div className="flex items-center gap-1.5">
          <span className="font-mono text-[11px] text-slate-400">
            #{load.id.slice(0, 8).toUpperCase()}
          </span>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close panel"
            className="flex h-7 w-7 items-center justify-center rounded-md text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-700"
          >
            <X size={14} />
          </button>
        </div>
      </div>

      <div className="max-h-[70vh] flex-1 space-y-4 overflow-y-auto px-4 py-4">
        <div>
          <div className="mb-2 flex items-center gap-1.5 text-xs text-slate-400">
            <MapPin size={12} />
            Route
          </div>
          <div className="text-sm font-semibold text-slate-900">{load.pickup_location}</div>
          <div className="mt-1 flex items-center gap-1.5 text-sm text-slate-500">
            <ArrowRight size={13} className="text-slate-300" />
            {load.delivery_location}
          </div>
          <div className="mt-3 flex flex-wrap items-center gap-2">
            <StatusPill status={load.status} />
            <span className="inline-flex items-center gap-1 rounded-md border border-slate-200 bg-white px-2 py-0.5 text-[11px] font-medium capitalize text-slate-500">
              {load.load_type.replace('_', ' ')}
            </span>
            <span className="inline-flex items-center gap-1 rounded-md border border-slate-200 bg-white px-2 py-0.5 text-[11px] font-medium tabular-nums text-slate-500">
              {load.distance_miles.toLocaleString()} mi
            </span>
            {riskTone && (
              <span
                className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-medium capitalize ${riskTone}`}
              >
                {load.risk_level} risk
              </span>
            )}
          </div>
        </div>

        <div className="grid grid-cols-2 gap-2">
          <DetailStat label="Shipper rate" value={`$${load.shipper_rate.toLocaleString()}`} />
          <DetailStat
            label="Carrier cost"
            value={load.carrier_cost ? `$${load.carrier_cost.toLocaleString()}` : '—'}
          />
          <DetailStat
            label="Suggested rate"
            value={load.suggested_rate ? `$${load.suggested_rate.toLocaleString()}` : '—'}
            valueClass="text-[#1a3a5c]"
          />
          <DetailStat
            label="Margin"
            value={
              load.margin_percentage
                ? `${load.margin_percentage.toFixed(1)}%`
                : '—'
            }
            valueClass={marginColor}
          />
        </div>

        {load.ai_recommendation && (
          <div className="rounded-lg border border-slate-200 bg-slate-50/70 p-3">
            <div className="mb-1.5 flex items-center gap-1.5">
              <Sparkles size={12} className="text-[#1a3a5c]" />
              <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-500">
                AI recommendation
              </span>
            </div>
            <p className="text-xs leading-relaxed text-slate-600">{load.ai_recommendation}</p>
          </div>
        )}

        <div className="text-[11px] text-slate-400">
          Created {formatRelativeTime(load.created_at)}
        </div>
      </div>

      <div className="border-t border-slate-100 px-4 py-3">
        <div className="flex flex-col gap-2">
          <Link
            href={`/loads/${load.id}`}
            className="inline-flex items-center justify-center gap-1.5 rounded-lg bg-[#1a3a5c] px-3 py-2 text-sm font-medium text-white transition-colors hover:bg-[#1a3a5c]/90"
          >
            Open full view
            <ExternalLink size={13} />
          </Link>
          <Link
            href={isPriceable ? `/pricing?loadId=${load.id}` : `/negotiate?loadId=${load.id}`}
            className="inline-flex items-center justify-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-700 transition-colors hover:border-[#1a3a5c]/30 hover:bg-[#1a3a5c]/5 hover:text-[#1a3a5c]"
          >
            {isPriceable ? (
              <>
                <Calculator size={13} />
                AI Price
              </>
            ) : (
              <>
                <MessageSquare size={13} />
                Negotiate
              </>
            )}
          </Link>
        </div>
      </div>
    </div>
  )
}

interface DetailStatProps {
  label: string
  value: string
  valueClass?: string
}

function DetailStat({ label, value, valueClass }: DetailStatProps) {
  return (
    <div className="rounded-lg border border-slate-200 bg-white p-3">
      <div className="text-[10px] font-medium uppercase tracking-wider text-slate-500">{label}</div>
      <div className={`mt-1 text-sm font-semibold tabular-nums ${valueClass ?? 'text-slate-900'}`}>
        {value}
      </div>
    </div>
  )
}

function formatRelativeTime(iso: string): string {
  const date = new Date(iso)
  const diff = Date.now() - date.getTime()
  if (diff < 0) return 'just now'
  const mins = Math.floor(diff / 60_000)
  if (mins < 1) return 'just now'
  if (mins < 60) return `${mins}m ago`
  const hours = Math.floor(mins / 60)
  if (hours < 24) return `${hours}h ago`
  const days = Math.floor(hours / 24)
  if (days < 7) return `${days}d ago`
  return date.toLocaleDateString()
}
