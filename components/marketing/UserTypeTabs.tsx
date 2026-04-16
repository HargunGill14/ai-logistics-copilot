'use client'

import { useState } from 'react'
import Link from 'next/link'
import {
  Briefcase,
  Truck,
  Warehouse,
  Check,
  ArrowRight,
  Calculator,
  Mail,
  TrendingUp,
  MapPin,
  Wallet,
  Clock,
  ScanLine,
  Activity,
  CalendarClock,
  Boxes,
} from 'lucide-react'
import type { LucideIcon } from 'lucide-react'

type TabId = 'broker' | 'carrier' | 'yard'

interface PanelStat {
  value: string
  label: string
}

interface PanelDemo {
  title: string
  rows: { icon: LucideIcon; label: string; value: string; valueClass?: string }[]
}

interface PanelData {
  id: TabId
  navIcon: LucideIcon
  navLabel: string
  tag: string
  heading: string
  description: string
  features: string[]
  stats: [PanelStat, PanelStat]
  ctaLabel: string
  ctaHref: string
  demo: PanelDemo
}

const panels: PanelData[] = [
  {
    id: 'broker',
    navIcon: Briefcase,
    navLabel: 'Broker',
    tag: 'For brokers',
    heading: 'Price every load in seconds',
    description:
      'Stop guessing. Get a defensible rate, margin, and risk read for any lane — instantly.',
    features: [
      'Instant AI lane pricing',
      'Auto-generated negotiation emails',
      'Live margin tracking & alerts',
      'Multi-lane dashboard',
    ],
    stats: [
      { value: '3×', label: 'Faster pricing decisions' },
      { value: '18%', label: 'Average margin lift' },
    ],
    ctaLabel: 'Start as a broker',
    ctaHref: '/signup',
    demo: {
      title: 'AI Pricing · ATL → DAL',
      rows: [
        { icon: Calculator, label: 'Carrier cost', value: '$1,847' },
        { icon: TrendingUp, label: 'Suggested rate', value: '$2,180', valueClass: 'text-[#1a3a5c]' },
        { icon: Mail, label: 'Margin', value: '15.3%', valueClass: 'text-blue-600' },
      ],
    },
  },
  {
    id: 'carrier',
    navIcon: Truck,
    navLabel: 'Carrier',
    tag: 'For carriers',
    heading: 'Find loads on your lanes',
    description:
      'Match with brokers paying the right rate. Quote, accept, and dispatch in one place.',
    features: [
      'Lanes matched to your fleet',
      'One-tap quote and accept',
      'Earnings and settlement view',
      'In-app load updates',
    ],
    stats: [
      { value: '$0.42', label: 'Avg per-mile uplift' },
      { value: '60%', label: 'Less back-office work' },
    ],
    ctaLabel: 'Sign up as a carrier',
    ctaHref: '/signup',
    demo: {
      title: 'Open lane · CHI → MEM',
      rows: [
        { icon: MapPin, label: '527 mi · Reefer', value: 'Today' },
        { icon: Wallet, label: 'Offered rate', value: '$1,420', valueClass: 'text-[#1a3a5c]' },
        { icon: Clock, label: 'Pickup window', value: '2–6 PM', valueClass: 'text-blue-600' },
      ],
    },
  },
  {
    id: 'yard',
    navIcon: Warehouse,
    navLabel: 'Yard',
    tag: 'For yards',
    heading: 'Run your yard without the radio',
    description:
      'Track every truck, dock slot, and trailer in real time. End the guesswork at the gate.',
    features: [
      'Real-time gate logs',
      'Dock and door scheduling',
      'Trailer and equipment tracking',
      'Driver QR check-in',
    ],
    stats: [
      { value: '32 min', label: 'Avg dwell saved' },
      { value: '100%', label: 'Gate visibility' },
    ],
    ctaLabel: 'Set up your yard',
    ctaHref: '/signup',
    demo: {
      title: 'Yard board · Dock 4',
      rows: [
        { icon: ScanLine, label: 'Driver checked in', value: '11:42 AM' },
        { icon: CalendarClock, label: 'Slot reserved', value: '12:15 PM', valueClass: 'text-[#1a3a5c]' },
        { icon: Boxes, label: 'Trailer ready', value: 'TRL-2841', valueClass: 'text-blue-600' },
      ],
    },
  },
]

export function UserTypeTabs() {
  const [active, setActive] = useState<TabId>('broker')
  const panel = panels.find((p) => p.id === active) ?? panels[0]
  const PanelIcon = panel.navIcon

  return (
    <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white">
      {/* Tab strip */}
      <div role="tablist" aria-label="Account types" className="flex border-b border-slate-200 bg-slate-50">
        {panels.map((p) => {
          const Icon = p.navIcon
          const isActive = p.id === active
          return (
            <button
              key={p.id}
              type="button"
              role="tab"
              aria-selected={isActive}
              aria-controls={`panel-${p.id}`}
              id={`tab-${p.id}`}
              onClick={() => setActive(p.id)}
              className={`relative flex flex-1 items-center justify-center gap-2 px-3 py-3.5 text-sm font-medium transition-colors ${
                isActive
                  ? 'bg-white text-[#1a3a5c]'
                  : 'text-slate-500 hover:bg-white/60 hover:text-slate-800'
              }`}
            >
              <Icon size={16} className={isActive ? 'text-[#1a3a5c]' : 'text-slate-400'} />
              {p.navLabel}
              {isActive && (
                <span aria-hidden className="absolute inset-x-3 bottom-0 h-[2px] bg-[#1a3a5c]" />
              )}
            </button>
          )
        })}
      </div>

      {/* Panel body */}
      <div
        id={`panel-${panel.id}`}
        role="tabpanel"
        aria-labelledby={`tab-${panel.id}`}
        className="px-6 py-6 sm:px-7 sm:py-7"
      >
        <div className="mb-3 inline-flex items-center gap-1.5 rounded-full border border-[#1a3a5c]/15 bg-[#1a3a5c]/5 px-2.5 py-1 text-[11px] font-semibold uppercase tracking-wider text-[#1a3a5c]">
          <PanelIcon size={11} />
          {panel.tag}
        </div>

        <h3 className="mb-2 text-2xl leading-tight tracking-tight text-slate-900 [font-family:var(--font-dm-serif)]">
          {panel.heading}
        </h3>
        <p className="mb-5 text-sm leading-relaxed text-slate-500">{panel.description}</p>

        <ul className="mb-6 space-y-2.5">
          {panel.features.map((f) => (
            <li key={f} className="flex items-start gap-2.5 text-sm text-slate-700">
              <span className="mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded-full bg-[#1a3a5c]/10">
                <Check size={11} className="text-[#1a3a5c]" strokeWidth={3} />
              </span>
              {f}
            </li>
          ))}
        </ul>

        <div className="mb-6 grid grid-cols-2 gap-3">
          {panel.stats.map((s) => (
            <div key={s.label} className="rounded-xl border border-slate-200 border-l-4 border-l-[#1a3a5c] bg-white p-4">
              <div className="text-2xl tabular-nums leading-none text-slate-900 [font-family:var(--font-dm-serif)]">
                {s.value}
              </div>
              <div className="mt-2 text-[11px] font-medium uppercase tracking-wider text-slate-500">
                {s.label}
              </div>
            </div>
          ))}
        </div>

        {/* Mini demo card */}
        <div className="mb-6 rounded-xl border border-slate-200 bg-slate-50/70 p-4">
          <div className="mb-3 flex items-center justify-between">
            <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-500">
              {panel.demo.title}
            </span>
            <span className="inline-flex items-center gap-1 rounded-full bg-white px-2 py-0.5 text-[10px] font-medium text-slate-500 ring-1 ring-slate-200">
              <Activity size={9} className="text-blue-600" />
              Live
            </span>
          </div>
          <div className="space-y-2">
            {panel.demo.rows.map((row) => {
              const Icon = row.icon
              return (
                <div key={row.label} className="flex items-center justify-between rounded-lg bg-white px-3 py-2 ring-1 ring-slate-200/70">
                  <span className="flex items-center gap-2 text-xs text-slate-600">
                    <Icon size={13} className="text-slate-400" />
                    {row.label}
                  </span>
                  <span className={`text-xs font-semibold tabular-nums ${row.valueClass ?? 'text-slate-900'}`}>
                    {row.value}
                  </span>
                </div>
              )
            })}
          </div>
        </div>

        <Link
          href={panel.ctaHref}
          className="inline-flex w-full items-center justify-center gap-2 rounded-lg bg-[#1a3a5c] px-4 py-3 text-sm font-semibold text-white transition-colors hover:bg-[#1a3a5c]/90"
        >
          {panel.ctaLabel}
          <ArrowRight size={14} />
        </Link>
      </div>
    </div>
  )
}
