import type { Metadata } from 'next'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'
import {
  ShieldCheck,
  Zap,
  MapPin,
  Check,
  ArrowRight,
  Activity,
  Clock,
  Truck,
  Briefcase,
  Star,
} from 'lucide-react'
import type { LucideIcon } from 'lucide-react'

export const metadata: Metadata = {
  title: 'FreTraq | Verified Drayage Marketplace',
  description:
    'FreTraq is the verified freight marketplace for drayage brokers and carriers. Post loads, get real-time bids, and track every shipment live.',
  alternates: { canonical: 'https://fretraq.com' },
  openGraph: { url: 'https://fretraq.com' },
}

interface Feature {
  icon: LucideIcon
  title: string
  body: string
  num: string
}

const features: Feature[] = [
  {
    icon: ShieldCheck,
    title: 'Verified Carriers',
    body: 'Every carrier FMCSA-checked before they ever bid. No fake MC numbers. No phone verification loops.',
    num: '01',
  },
  {
    icon: Zap,
    title: 'Live Bidding',
    body: 'Real-time bid alerts the moment a carrier quotes your load. Award in seconds, not hours.',
    num: '02',
  },
  {
    icon: MapPin,
    title: 'GPS Tracking',
    body: 'Turn-by-turn visibility on every load. No more check calls. Know where your freight is, always.',
    num: '03',
  },
]

const brokerBenefits = [
  'Post a load in under 2 minutes',
  'Real-time bid notifications',
  'FMCSA fraud protection built in',
  'Dashboard for all active loads',
  'AI-suggested pricing per lane',
]

const carrierBenefits = [
  'Browse live loads on your lanes',
  'One-tap bid and acceptance',
  'GPS check-in auto-reports progress',
  'Fast settlement — net 7 days',
  'Reputation scorecard builds trust',
]

interface PricingTier {
  name: string
  price: string
  period: string
  description: string
  features: string[]
  cta: string
  highlight: boolean
}

const tiers: PricingTier[] = [
  {
    name: 'Starter',
    price: 'Free',
    period: 'forever',
    description: 'Get familiar with the marketplace.',
    features: ['5 loads/month', '3 bid slots per load', 'Basic GPS tracking', 'Email support'],
    cta: 'Get started free',
    highlight: false,
  },
  {
    name: 'Broker',
    price: '$149',
    period: '/mo',
    description: 'For active brokers moving real volume.',
    features: [
      'Unlimited loads',
      'Unlimited bid slots',
      'Full GPS + ETA tracking',
      'AI lane pricing',
      'Negotiation email generator',
      'Priority support',
    ],
    cta: 'Start as a broker',
    highlight: true,
  },
  {
    name: 'Carrier',
    price: '$49',
    period: '/mo',
    description: 'For carriers who want steady freight.',
    features: [
      'Browse all open loads',
      'Unlimited bids',
      'Lane preference matching',
      'Reputation scorecard',
      'Fast settlement (net 7)',
      'In-app dispatch updates',
    ],
    cta: 'Sign up as a carrier',
    highlight: false,
  },
]

export default async function Home() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (user) redirect('/dashboard')

  return (
    <div className="min-h-screen bg-white text-slate-900 [font-family:var(--font-dm-sans)]">
      {/* ── Nav ── */}
      <header className="sticky top-0 z-50 border-b border-slate-200 bg-white/95 backdrop-blur-sm">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-6">
          <Link href="/" className="flex items-center gap-2.5">
            <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-lg bg-[#1a3a5c]">
              <BrandMark size={16} />
            </div>
            <span className="text-base font-semibold tracking-tight text-slate-900">FreTraq</span>
          </Link>
          <div className="flex items-center gap-2">
            <Link
              href="/login"
              className="rounded-lg px-3 py-1.5 text-sm font-medium text-slate-600 transition-colors hover:bg-slate-100 hover:text-slate-900"
            >
              Sign in
            </Link>
            <Link
              href="/signup"
              className="inline-flex items-center gap-1 rounded-lg bg-[#1a3a5c] px-4 py-1.5 text-sm font-medium text-white transition-colors hover:bg-[#1a3a5c]/90"
            >
              Get started free
              <ArrowRight size={13} />
            </Link>
          </div>
        </div>
      </header>

      {/* ── Hero ── */}
      <section className="border-b border-slate-200">
        <div className="mx-auto max-w-7xl px-6 py-16 sm:py-20 lg:py-28">
          <div className="grid grid-cols-1 items-center gap-12 lg:grid-cols-12 lg:gap-16">
            {/* Left */}
            <div className="lg:col-span-6">
              <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-3 py-1 text-xs font-medium text-slate-600">
                <span className="h-1.5 w-1.5 rounded-full bg-[#0d9488]" />
                Verified Drayage Marketplace
              </div>

              <h1 className="mb-5 text-5xl leading-[1.05] tracking-tight text-slate-900 sm:text-6xl lg:text-[4.5rem] [font-family:var(--font-dm-serif)]">
                Post loads.
                <br />
                Win bids.
                <br />
                <span className="text-[#1a3a5c]">Move freight.</span>
              </h1>

              <p className="mb-8 max-w-lg text-lg leading-relaxed text-slate-500">
                FreTraq connects drayage brokers with FMCSA-verified carriers — real-time bidding,
                fraud protection, and live GPS on every load.
              </p>

              <div className="mb-7 flex flex-wrap gap-3">
                <Link
                  href="/signup"
                  className="inline-flex items-center gap-2 rounded-lg bg-[#1a3a5c] px-6 py-3 text-sm font-semibold text-white transition-colors hover:bg-[#1a3a5c]/90"
                >
                  <Briefcase size={15} />
                  Post a Load
                </Link>
                <Link
                  href="/signup"
                  className="inline-flex items-center gap-2 rounded-lg border-2 border-[#0d9488] bg-white px-6 py-3 text-sm font-semibold text-[#0d9488] transition-colors hover:bg-[#0d9488]/5"
                >
                  <Truck size={15} />
                  Find Loads
                </Link>
              </div>

              <div className="flex flex-wrap items-center gap-x-5 gap-y-2 text-xs text-slate-400">
                {['FMCSA verified', 'Live GPS on every load', 'No check calls'].map((t, i, arr) => (
                  <span key={t} className="inline-flex items-center gap-1.5">
                    <Check size={12} className="text-[#0d9488]" strokeWidth={3} />
                    {t}
                    {i < arr.length - 1 && <span className="ml-3 text-slate-200">·</span>}
                  </span>
                ))}
              </div>
            </div>

            {/* Right: live bid board mockup */}
            <div className="lg:col-span-6">
              <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
                {/* Board header */}
                <div className="flex items-center justify-between border-b border-slate-100 bg-slate-50 px-5 py-3.5">
                  <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                    Live Bid Board
                  </span>
                  <span className="inline-flex items-center gap-1.5 rounded-full bg-white px-2.5 py-1 text-[11px] font-medium text-slate-600 ring-1 ring-slate-200">
                    <Activity size={10} className="text-[#0d9488]" />
                    3 bids active
                  </span>
                </div>

                {/* Load summary */}
                <div className="border-b border-slate-100 px-5 py-4">
                  <div className="mb-1 flex items-center justify-between">
                    <span className="text-sm font-semibold text-slate-900">
                      LA Port → Chicago, IL
                    </span>
                    <span className="rounded-full bg-[#0d9488]/10 px-2.5 py-0.5 text-[11px] font-semibold text-[#0d9488]">
                      Open
                    </span>
                  </div>
                  <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-slate-400">
                    <span>40&apos; Container · Chassis req.</span>
                    <span>Pickup: Today 2 PM</span>
                    <span>2,020 mi</span>
                  </div>
                </div>

                {/* Bids */}
                <div className="divide-y divide-slate-100">
                  {[
                    {
                      carrier: 'Apex Drayage LLC',
                      mc: 'MC-481923',
                      rating: 4.9,
                      rate: '$3,850',
                      eta: '18 hrs',
                      badge: 'Top rated',
                      badgeColor: 'bg-[#1a3a5c]/10 text-[#1a3a5c]',
                    },
                    {
                      carrier: 'Pacific Star Freight',
                      mc: 'MC-220471',
                      rating: 4.7,
                      rate: '$3,620',
                      eta: '20 hrs',
                      badge: 'Verified',
                      badgeColor: 'bg-[#0d9488]/10 text-[#0d9488]',
                    },
                    {
                      carrier: 'Harbor Run Transport',
                      mc: 'MC-394810',
                      rating: 4.6,
                      rate: '$3,490',
                      eta: '22 hrs',
                      badge: 'New',
                      badgeColor: 'bg-slate-100 text-slate-500',
                    },
                  ].map((bid) => (
                    <div key={bid.mc} className="flex items-center justify-between px-5 py-4">
                      <div className="min-w-0">
                        <div className="mb-1 flex items-center gap-2">
                          <span className="truncate text-sm font-medium text-slate-900">
                            {bid.carrier}
                          </span>
                          <span
                            className={`shrink-0 rounded-full px-2 py-0.5 text-[10px] font-semibold ${bid.badgeColor}`}
                          >
                            {bid.badge}
                          </span>
                        </div>
                        <div className="flex items-center gap-3 text-xs text-slate-400">
                          <span>{bid.mc}</span>
                          <span className="flex items-center gap-0.5">
                            <Star
                              size={10}
                              className="fill-amber-400 text-amber-400"
                            />
                            {bid.rating}
                          </span>
                          <span className="flex items-center gap-1">
                            <Clock size={10} />
                            {bid.eta}
                          </span>
                        </div>
                      </div>
                      <div className="ml-4 shrink-0 text-right">
                        <div className="text-base font-bold tabular-nums text-slate-900">
                          {bid.rate}
                        </div>
                        <button
                          type="button"
                          className="mt-1 rounded-md bg-[#1a3a5c] px-3 py-1 text-[11px] font-semibold text-white hover:bg-[#1a3a5c]/90"
                        >
                          Award
                        </button>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="border-t border-slate-100 bg-slate-50 px-5 py-3 text-center text-[11px] text-slate-400">
                  Bids close in 12 min · All carriers FMCSA verified
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── Problem / Solution ── */}
      <section className="bg-[#1a3a5c]">
        <div className="mx-auto max-w-7xl px-6 py-20 sm:py-24">
          <div className="grid grid-cols-1 gap-12 lg:grid-cols-2 lg:items-center">
            {/* Stat */}
            <div>
              <div className="mb-2 text-[7rem] font-black leading-none tabular-nums text-[#0d9488] sm:text-[9rem] [font-family:var(--font-dm-serif)]">
                75%
              </div>
              <p className="max-w-sm text-xl leading-relaxed text-slate-300">
                of drayage is still booked by phone or email.
              </p>
            </div>

            {/* Fix */}
            <div>
              <div className="mb-4 inline-flex items-center gap-1.5 rounded-full border border-white/10 bg-white/10 px-3 py-1 text-xs font-semibold uppercase tracking-wider text-slate-300">
                The FreTraq fix
              </div>
              <h2 className="mb-5 text-4xl leading-tight tracking-tight text-white sm:text-5xl [font-family:var(--font-dm-serif)]">
                A verified marketplace fixes that.
              </h2>
              <p className="mb-8 text-base leading-relaxed text-slate-300">
                Brokers post a load. Verified carriers bid in real time. You award the best rate in
                seconds — no phone tag, no fake carriers, no spreadsheets.
              </p>

              <div className="grid grid-cols-3 gap-4">
                {[
                  { stat: '2 min', label: 'Avg. award time' },
                  { stat: '0', label: 'Fraud incidents' },
                  { stat: '600+', label: 'Verified carriers' },
                ].map((s) => (
                  <div key={s.label} className="rounded-xl border border-white/10 bg-white/5 p-4">
                    <div className="mb-1 text-2xl font-bold tabular-nums text-white [font-family:var(--font-dm-serif)]">
                      {s.stat}
                    </div>
                    <div className="text-[11px] font-medium uppercase tracking-wider text-slate-400">
                      {s.label}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── Feature Cards ── */}
      <section className="border-b border-slate-200 bg-slate-50/60">
        <div className="mx-auto max-w-7xl px-6 py-20 sm:py-24">
          <div className="mb-12 max-w-2xl">
            <div className="mb-3 inline-flex items-center gap-1.5 rounded-full border border-slate-200 bg-white px-2.5 py-1 text-[11px] font-semibold uppercase tracking-wider text-slate-500">
              Platform
            </div>
            <h2 className="mb-3 text-4xl leading-tight tracking-tight text-slate-900 sm:text-5xl [font-family:var(--font-dm-serif)]">
              Three things that matter.
            </h2>
            <p className="text-base leading-relaxed text-slate-500">
              No bloat. No busywork. Just the tools that move freight faster and keep fraud out.
            </p>
          </div>

          <div className="grid grid-cols-1 gap-5 md:grid-cols-3">
            {features.map((f) => {
              const Icon = f.icon
              return (
                <div
                  key={f.title}
                  className="group flex flex-col rounded-2xl border border-slate-200 bg-white p-7 transition-colors duration-200 hover:border-[#0d9488]/40"
                >
                  <div className="mb-5 flex items-center justify-between">
                    <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-[#0d9488]/10">
                      <Icon size={20} className="text-[#0d9488]" />
                    </div>
                    <span className="text-xs font-semibold tabular-nums text-slate-300">
                      {f.num}
                    </span>
                  </div>
                  <h3 className="mb-2 text-2xl leading-tight text-slate-900 [font-family:var(--font-dm-serif)]">
                    {f.title}
                  </h3>
                  <p className="text-sm leading-relaxed text-slate-500">{f.body}</p>
                </div>
              )
            })}
          </div>
        </div>
      </section>

      {/* ── Two-sided value props ── */}
      <section className="border-b border-slate-200">
        <div className="mx-auto max-w-7xl px-6 py-20 sm:py-24">
          <div className="mb-12 text-center">
            <h2 className="text-4xl leading-tight tracking-tight text-slate-900 sm:text-5xl [font-family:var(--font-dm-serif)]">
              Built for both sides.
            </h2>
          </div>

          <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
            {/* Brokers */}
            <div className="rounded-2xl bg-[#1a3a5c] p-8 sm:p-10">
              <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-3 py-1 text-xs font-semibold text-slate-300">
                <Briefcase size={12} />
                For Brokers
              </div>
              <h3 className="mb-4 text-3xl leading-tight text-white [font-family:var(--font-dm-serif)]">
                Stop chasing carriers. Let them come to you.
              </h3>
              <p className="mb-7 text-sm leading-relaxed text-slate-300">
                Post a load, set your price floor, and watch verified bids roll in. Award the best
                rate without leaving the platform.
              </p>
              <ul className="mb-8 space-y-3">
                {brokerBenefits.map((b) => (
                  <li key={b} className="flex items-start gap-3 text-sm text-slate-200">
                    <span className="mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded-full bg-white/15">
                      <Check size={10} className="text-white" strokeWidth={3} />
                    </span>
                    {b}
                  </li>
                ))}
              </ul>
              <Link
                href="/signup"
                className="inline-flex items-center gap-2 rounded-lg bg-white px-5 py-2.5 text-sm font-semibold text-[#1a3a5c] transition-colors hover:bg-slate-100"
              >
                Post a Load
                <ArrowRight size={14} />
              </Link>
            </div>

            {/* Carriers */}
            <div className="rounded-2xl border border-slate-200 bg-slate-50 p-8 sm:p-10">
              <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-[#0d9488]/20 bg-[#0d9488]/10 px-3 py-1 text-xs font-semibold text-[#0d9488]">
                <Truck size={12} />
                For Carriers
              </div>
              <h3 className="mb-4 text-3xl leading-tight text-slate-900 [font-family:var(--font-dm-serif)]">
                Find the loads that match your lanes.
              </h3>
              <p className="mb-7 text-sm leading-relaxed text-slate-500">
                Browse real loads from verified brokers. Bid on the runs that make sense, track
                them live, and get paid fast.
              </p>
              <ul className="mb-8 space-y-3">
                {carrierBenefits.map((b) => (
                  <li key={b} className="flex items-start gap-3 text-sm text-slate-700">
                    <span className="mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded-full bg-[#0d9488]/15">
                      <Check size={10} className="text-[#0d9488]" strokeWidth={3} />
                    </span>
                    {b}
                  </li>
                ))}
              </ul>
              <Link
                href="/signup"
                className="inline-flex items-center gap-2 rounded-lg bg-[#0d9488] px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-[#0d9488]/90"
              >
                Find Loads
                <ArrowRight size={14} />
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* ── Pricing ── */}
      <section className="border-b border-slate-200 bg-slate-50/60">
        <div className="mx-auto max-w-7xl px-6 py-20 sm:py-24">
          <div className="mb-12 text-center">
            <div className="mb-3 inline-flex items-center gap-1.5 rounded-full border border-slate-200 bg-white px-2.5 py-1 text-[11px] font-semibold uppercase tracking-wider text-slate-500">
              Pricing
            </div>
            <h2 className="mb-3 text-4xl leading-tight tracking-tight text-slate-900 sm:text-5xl [font-family:var(--font-dm-serif)]">
              Simple. No surprises.
            </h2>
            <p className="text-base text-slate-500">Start free. Upgrade when you need more volume.</p>
          </div>

          <div className="grid grid-cols-1 gap-5 md:grid-cols-3">
            {tiers.map((tier) => (
              <div
                key={tier.name}
                className={`relative flex flex-col rounded-2xl border p-8 ${
                  tier.highlight
                    ? 'border-[#1a3a5c] bg-[#1a3a5c] text-white'
                    : 'border-slate-200 bg-white text-slate-900'
                }`}
              >
                {tier.highlight && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                    <span className="rounded-full bg-[#0d9488] px-3 py-1 text-[11px] font-semibold text-white">
                      Most popular
                    </span>
                  </div>
                )}

                <div className="mb-6">
                  <div
                    className={`mb-1 text-sm font-semibold uppercase tracking-wider ${
                      tier.highlight ? 'text-slate-300' : 'text-slate-500'
                    }`}
                  >
                    {tier.name}
                  </div>
                  <div className="flex items-end gap-1">
                    <span className="text-5xl font-black tabular-nums leading-none [font-family:var(--font-dm-serif)]">
                      {tier.price}
                    </span>
                    {tier.price !== 'Free' && (
                      <span
                        className={`mb-1 text-sm ${
                          tier.highlight ? 'text-slate-300' : 'text-slate-400'
                        }`}
                      >
                        {tier.period}
                      </span>
                    )}
                  </div>
                  <p
                    className={`mt-2 text-sm ${
                      tier.highlight ? 'text-slate-300' : 'text-slate-500'
                    }`}
                  >
                    {tier.description}
                  </p>
                </div>

                <ul className="mb-8 flex-1 space-y-2.5">
                  {tier.features.map((f) => (
                    <li key={f} className="flex items-start gap-2.5 text-sm">
                      <span
                        className={`mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded-full ${
                          tier.highlight ? 'bg-white/15' : 'bg-[#1a3a5c]/10'
                        }`}
                      >
                        <Check
                          size={10}
                          className={tier.highlight ? 'text-white' : 'text-[#1a3a5c]'}
                          strokeWidth={3}
                        />
                      </span>
                      <span className={tier.highlight ? 'text-slate-200' : 'text-slate-700'}>
                        {f}
                      </span>
                    </li>
                  ))}
                </ul>

                <Link
                  href="/signup"
                  className={`inline-flex w-full items-center justify-center gap-2 rounded-lg px-4 py-3 text-sm font-semibold transition-colors ${
                    tier.highlight
                      ? 'bg-white text-[#1a3a5c] hover:bg-slate-100'
                      : 'bg-[#1a3a5c] text-white hover:bg-[#1a3a5c]/90'
                  }`}
                >
                  {tier.cta}
                  <ArrowRight size={14} />
                </Link>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── CTA Footer ── */}
      <section className="bg-[#1a3a5c]">
        <div className="mx-auto max-w-4xl px-6 py-24 text-center sm:py-28">
          <h2 className="mb-5 text-5xl leading-tight tracking-tight text-white sm:text-6xl [font-family:var(--font-dm-serif)]">
            Ready to move freight smarter?
          </h2>
          <p className="mb-10 text-lg leading-relaxed text-slate-300">
            Join brokers and carriers already on FreTraq. No credit card required.
          </p>
          <Link
            href="/signup"
            className="inline-flex items-center gap-2 rounded-xl bg-white px-8 py-4 text-base font-semibold text-[#1a3a5c] transition-colors hover:bg-slate-100"
          >
            Get started free
            <ArrowRight size={16} />
          </Link>
        </div>
      </section>

      {/* ── Footer ── */}
      <footer className="border-t border-slate-200 bg-white">
        <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-3 px-6 py-8 sm:flex-row">
          <div className="flex items-center gap-2">
            <div className="flex h-6 w-6 items-center justify-center rounded bg-[#1a3a5c]">
              <BrandMark size={12} />
            </div>
            <span className="text-xs font-medium text-slate-500">FreTraq</span>
          </div>
          <div className="flex items-center gap-5 text-xs text-slate-400">
            <p>© {new Date().getFullYear()} FreTraq. All rights reserved.</p>
            <Link href="/terms" className="hover:text-slate-700">Terms</Link>
            <Link href="/privacy" className="hover:text-slate-700">Privacy</Link>
          </div>
        </div>
      </footer>
    </div>
  )
}

function BrandMark({ size }: { size: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 20 20" fill="none">
      <path
        d="M3 14L8 7L13 10L17 4"
        stroke="#60a5fa"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <circle cx="17" cy="16" r="2.5" fill="#34d399" />
    </svg>
  )
}
