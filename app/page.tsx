import type { Metadata } from 'next'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'
import {
  Calculator,
  Mail,
  TrendingUp,
  ArrowRight,
  Zap,
  ShieldCheck,
} from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import { UserTypeTabs } from '@/components/marketing/UserTypeTabs'

export const metadata: Metadata = {
  title: 'FreTraq | One platform for brokers, carriers, and yards',
  description:
    'FreTraq connects freight brokers, carriers, and yards on a single operating layer — instant lane pricing, negotiation emails, and real-time margin tracking.',
  alternates: {
    canonical: 'https://fretraq.com',
  },
  openGraph: {
    url: 'https://fretraq.com',
  },
}

interface Feature {
  icon: LucideIcon
  title: string
  description: string
}

const features: Feature[] = [
  {
    icon: Calculator,
    title: 'Lane Pricing',
    description:
      'Defensible rate, margin, and risk for any lane in seconds. Distance, equipment, weight, and live market signal — all factored in.',
  },
  {
    icon: Mail,
    title: 'Negotiation Emails',
    description:
      'Generate professional counter-offer emails to shippers and carriers in one click. Close deals without leaving the platform.',
  },
  {
    icon: TrendingUp,
    title: 'Margin Tracking',
    description:
      'Watch every load from quote to delivered. Real-time margin alerts before a deal goes underwater.',
  },
]

const trustPoints: { icon: LucideIcon; label: string }[] = [
  { icon: Zap, label: 'Setup in minutes' },
  { icon: ShieldCheck, label: 'Bank-grade security' },
]

export default async function Home() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (user) redirect('/dashboard')

  return (
    <div className="min-h-screen bg-white text-slate-900 [font-family:var(--font-dm-sans)]">
      {/* Nav */}
      <header className="border-b border-slate-200 bg-white">
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
              Get started
              <ArrowRight size={13} />
            </Link>
          </div>
        </div>
      </header>

      {/* Hero + Tabs sidebar */}
      <section className="border-b border-slate-200">
        <div className="mx-auto max-w-7xl px-6 py-16 sm:py-20 lg:py-24">
          <div className="grid grid-cols-1 gap-12 lg:grid-cols-12 lg:gap-16">
            {/* Left: hero */}
            <div className="lg:col-span-7 lg:pt-6">
              <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-3 py-1 text-xs font-medium text-slate-600">
                <span className="h-1.5 w-1.5 rounded-full bg-blue-600" />
                For brokers, carriers, and yards
              </div>

              <h1 className="mb-6 text-5xl leading-[1.05] tracking-tight text-slate-900 sm:text-6xl lg:text-[5rem] [font-family:var(--font-dm-serif)]">
                Move freight smarter.
              </h1>

              <p className="mb-8 max-w-xl text-lg leading-relaxed text-slate-600">
                FreTraq connects freight brokers, carriers, and yards on one operating
                layer — pricing, negotiation, and tracking in real time.
              </p>

              <div className="mb-6 flex flex-wrap items-center gap-3">
                <Link
                  href="/signup"
                  className="inline-flex items-center gap-2 rounded-lg bg-[#1a3a5c] px-6 py-3 text-sm font-semibold text-white transition-colors hover:bg-[#1a3a5c]/90"
                >
                  Start for free
                  <ArrowRight size={14} />
                </Link>
                <Link
                  href="/login"
                  className="inline-flex items-center rounded-lg border border-slate-300 bg-white px-6 py-3 text-sm font-semibold text-slate-700 transition-colors hover:border-slate-400 hover:bg-slate-50"
                >
                  Sign in
                </Link>
              </div>

              <div className="flex flex-wrap items-center gap-x-5 gap-y-2 text-xs text-slate-500">
                <span>No credit card required</span>
                <span className="text-slate-300">·</span>
                {trustPoints.map(({ icon: Icon, label }, idx) => (
                  <span key={label} className="inline-flex items-center gap-1.5">
                    <Icon size={13} className="text-slate-400" />
                    {label}
                    {idx < trustPoints.length - 1 && <span className="ml-3 text-slate-300">·</span>}
                  </span>
                ))}
              </div>
            </div>

            {/* Right: tabs sidebar */}
            <div className="lg:col-span-5">
              <UserTypeTabs />
            </div>
          </div>
        </div>
      </section>

      {/* Feature cards */}
      <section className="border-b border-slate-200 bg-slate-50/60">
        <div className="mx-auto max-w-7xl px-6 py-20 sm:py-24">
          <div className="mb-12 max-w-2xl">
            <div className="mb-3 inline-flex items-center gap-1.5 rounded-full border border-slate-200 bg-white px-2.5 py-1 text-[11px] font-semibold uppercase tracking-wider text-slate-500">
              Core platform
            </div>
            <h2 className="mb-3 text-4xl leading-tight tracking-tight text-slate-900 sm:text-5xl [font-family:var(--font-dm-serif)]">
              Built around three jobs.
            </h2>
            <p className="text-base leading-relaxed text-slate-600">
              The operating fundamentals every freight workflow runs on — designed
              to be fast, defensible, and out of your way.
            </p>
          </div>

          <div className="grid grid-cols-1 gap-5 md:grid-cols-3">
            {features.map((f, idx) => {
              const Icon = f.icon
              return (
                <div
                  key={f.title}
                  className="group flex flex-col rounded-2xl border border-slate-200 bg-white p-7 transition-colors duration-200 hover:border-[#1a3a5c]/30"
                >
                  <div className="mb-5 flex items-center justify-between">
                    <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-[#1a3a5c]/10">
                      <Icon size={20} className="text-[#1a3a5c]" />
                    </div>
                    <span className="text-xs font-semibold tabular-nums text-slate-300">
                      0{idx + 1}
                    </span>
                  </div>
                  <h3 className="mb-2 text-2xl leading-tight text-slate-900 [font-family:var(--font-dm-serif)]">
                    {f.title}
                  </h3>
                  <p className="text-sm leading-relaxed text-slate-600">{f.description}</p>
                </div>
              )
            })}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-slate-200 bg-white">
        <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-3 px-6 py-8 sm:flex-row">
          <div className="flex items-center gap-2">
            <div className="flex h-6 w-6 items-center justify-center rounded bg-[#1a3a5c]">
              <BrandMark size={12} />
            </div>
            <span className="text-xs font-medium text-slate-500">FreTraq</span>
          </div>
          <p className="text-xs text-slate-400">© {new Date().getFullYear()} FreTraq. All rights reserved.</p>
        </div>
      </footer>
    </div>
  )
}

function BrandMark({ size }: { size: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 20 20" fill="none">
      <path d="M3 14L8 7L13 10L17 4" stroke="#60a5fa" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      <circle cx="17" cy="16" r="2.5" fill="#34d399" />
    </svg>
  )
}
