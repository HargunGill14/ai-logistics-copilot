import type { Metadata } from 'next'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'

export const metadata: Metadata = {
  title: 'FreTraq | AI Pricing for Freight Brokers',
  description:
    'FreTraq gives freight brokers instant AI-powered lane pricing, auto-generated negotiation emails, and real-time margin tracking — all in one platform.',
  alternates: {
    canonical: 'https://fretraq.com',
  },
  openGraph: {
    url: 'https://fretraq.com',
  },
}

const features = [
  {
    icon: (
      <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
        <path d="M3 14L8 7L13 10L17 4" stroke="#60a5fa" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
        <circle cx="17" cy="16" r="2.5" fill="#34d399"/>
      </svg>
    ),
    title: 'AI Pricing Engine',
    description:
      'Get instant market-rate recommendations for any lane. Factor in distance, load type, weight, and live market conditions — in seconds.',
  },
  {
    icon: (
      <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
        <path d="M2 4h16v10a2 2 0 01-2 2H4a2 2 0 01-2-2V4z" stroke="#a78bfa" strokeWidth="1.6" fill="none"/>
        <path d="M6 8h8M6 11h5" stroke="#a78bfa" strokeWidth="1.6" strokeLinecap="round"/>
      </svg>
    ),
    title: 'Negotiation Assistant',
    description:
      'Generate professional counter-offer emails to shippers and carriers with one click. Close deals faster without leaving the platform.',
  },
  {
    icon: (
      <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
        <rect x="2" y="3" width="16" height="14" rx="2" stroke="#34d399" strokeWidth="1.6" fill="none"/>
        <path d="M6 7h8M6 10h8M6 13h5" stroke="#34d399" strokeWidth="1.6" strokeLinecap="round"/>
      </svg>
    ),
    title: 'Load Management',
    description:
      'Track every load from draft to delivery in one place. Monitor margins in real time and get alerted before a deal goes underwater.',
  },
  {
    icon: (
      <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
        <circle cx="10" cy="10" r="7" stroke="#fb923c" strokeWidth="1.6" fill="none"/>
        <path d="M10 6v4l3 2" stroke="#fb923c" strokeWidth="1.6" strokeLinecap="round"/>
      </svg>
    ),
    title: 'Real-Time Alerts',
    description:
      'Instant notifications for margin drops, carrier updates, and shipper replies. Stay ahead of every load without constant checking.',
  },
]

const steps = [
  { number: '01', title: 'Create a load', body: 'Enter origin, destination, load type, and target rate.' },
  { number: '02', title: 'Get AI pricing', body: 'The engine analyses lane data and returns a suggested rate with margin breakdown.' },
  { number: '03', title: 'Negotiate & close', body: 'Auto-generate emails, track replies, and mark the load active.' },
]

const stats = [
  { value: '3×', label: 'faster pricing decisions' },
  { value: '18%', label: 'average margin improvement' },
  { value: '60%', label: 'less time on email' },
]

export default async function Home() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (user) redirect('/dashboard')

  return (
    <div className="min-h-screen bg-white">

      {/* Nav */}
      <header className="border-b border-slate-100 sticky top-0 bg-white/90 backdrop-blur-sm z-10">
        <div className="max-w-6xl mx-auto px-6 h-14 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div
              className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0"
              style={{ backgroundColor: '#1a3a5c' }}
            >
              <svg width="16" height="16" viewBox="0 0 20 20" fill="none">
                <path d="M3 14L8 7L13 10L17 4" stroke="#60a5fa" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                <circle cx="17" cy="16" r="2.5" fill="#34d399"/>
              </svg>
            </div>
            <span className="font-semibold text-slate-900 text-sm">AI Logistics Copilot</span>
          </div>
          <div className="flex items-center gap-3">
            <Link
              href="/login"
              className="text-sm font-medium text-slate-600 hover:text-slate-900 transition-colors px-3 py-1.5"
            >
              Sign in
            </Link>
            <Link
              href="/signup"
              className="text-sm font-medium text-white px-4 py-1.5 rounded-lg transition-opacity hover:opacity-90"
              style={{ backgroundColor: '#1a3a5c' }}
            >
              Get started free
            </Link>
          </div>
        </div>
      </header>

      {/* Hero */}
      <section className="max-w-6xl mx-auto px-6 pt-20 pb-20 text-center">
        <div
          className="inline-flex items-center gap-2 text-xs font-medium px-3 py-1 rounded-full border mb-6"
          style={{ borderColor: '#1a3a5c22', color: '#1a3a5c', backgroundColor: '#1a3a5c0a' }}
        >
          <span className="w-1.5 h-1.5 rounded-full bg-green-400 inline-block" />
          Built for freight brokers
        </div>

        <h1 className="text-5xl font-bold text-slate-900 leading-tight tracking-tight mb-5">
          Price loads faster<br />
          <span style={{ color: '#1a3a5c' }}>with AI.</span>
        </h1>

        <p className="text-lg text-slate-500 max-w-xl mx-auto mb-8 leading-relaxed">
          AI Logistics Copilot gives freight brokers instant lane pricing, auto-generated
          negotiation emails, and real-time margin tracking — all in one platform.
        </p>

        <div className="flex items-center justify-center gap-3 flex-wrap">
          <Link
            href="/signup"
            className="inline-flex items-center gap-2 px-6 py-3 rounded-lg text-sm font-semibold text-white transition-opacity hover:opacity-90"
            style={{ backgroundColor: '#1a3a5c' }}
          >
            Start for free
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
              <path d="M2 7h10M8 3l4 4-4 4" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </Link>
          <Link
            href="/login"
            className="inline-flex items-center px-6 py-3 rounded-lg text-sm font-semibold text-slate-700 border border-slate-200 hover:bg-slate-50 transition-colors"
          >
            Sign in
          </Link>
        </div>

        <p className="text-xs text-slate-400 mt-4">No credit card required</p>
      </section>

      {/* Stats strip */}
      <section className="border-y border-slate-100 bg-slate-50">
        <div className="max-w-6xl mx-auto px-6 py-10 grid grid-cols-3 gap-8 divide-x divide-slate-200">
          {stats.map((s) => (
            <div key={s.label} className="text-center px-4">
              <div className="text-3xl font-bold text-slate-900 mb-1" style={{ color: '#1a3a5c' }}>
                {s.value}
              </div>
              <div className="text-sm text-slate-500">{s.label}</div>
            </div>
          ))}
        </div>
      </section>

      {/* Features */}
      <section className="max-w-6xl mx-auto px-6 py-20">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold text-slate-900 mb-3">Everything a broker needs</h2>
          <p className="text-slate-500 max-w-md mx-auto text-sm">
            One platform for pricing, negotiation, and load management — powered by AI at every step.
          </p>
        </div>

        <div className="grid grid-cols-2 gap-5">
          {features.map((f) => (
            <div
              key={f.title}
              className="bg-white border border-slate-200 rounded-xl p-6 hover:border-slate-300 hover:shadow-sm transition-all"
            >
              <div
                className="w-10 h-10 rounded-lg flex items-center justify-center mb-4"
                style={{ backgroundColor: '#1a3a5c0d' }}
              >
                {f.icon}
              </div>
              <h3 className="text-sm font-semibold text-slate-900 mb-2">{f.title}</h3>
              <p className="text-sm text-slate-500 leading-relaxed">{f.description}</p>
            </div>
          ))}
        </div>
      </section>

      {/* How it works */}
      <section className="bg-slate-50 border-y border-slate-100">
        <div className="max-w-6xl mx-auto px-6 py-20">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-slate-900 mb-3">How it works</h2>
            <p className="text-sm text-slate-500">From load creation to closed deal in three steps.</p>
          </div>

          <div className="grid grid-cols-3 gap-8 relative">
            {/* connector line */}
            <div className="absolute top-6 left-[calc(16.66%+1px)] right-[calc(16.66%+1px)] h-px bg-slate-200 hidden md:block" />

            {steps.map((s) => (
              <div key={s.number} className="relative text-center">
                <div
                  className="w-12 h-12 rounded-full flex items-center justify-center text-sm font-bold text-white mx-auto mb-4 relative z-10"
                  style={{ backgroundColor: '#1a3a5c' }}
                >
                  {s.number}
                </div>
                <h3 className="text-sm font-semibold text-slate-900 mb-2">{s.title}</h3>
                <p className="text-sm text-slate-500 leading-relaxed">{s.body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="max-w-6xl mx-auto px-6 py-20 text-center">
        <div
          className="rounded-2xl px-8 py-14"
          style={{ backgroundColor: '#1a3a5c' }}
        >
          <h2 className="text-3xl font-bold text-white mb-3">
            Ready to close more loads?
          </h2>
          <p className="text-blue-200 text-sm mb-8 max-w-md mx-auto">
            Join freight brokers already using AI to price faster and negotiate smarter.
          </p>
          <div className="flex items-center justify-center gap-3 flex-wrap">
            <Link
              href="/signup"
              className="inline-flex items-center gap-2 px-6 py-3 rounded-lg text-sm font-semibold bg-white transition-opacity hover:opacity-90"
              style={{ color: '#1a3a5c' }}
            >
              Create free account
              <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                <path d="M2 7h10M8 3l4 4-4 4" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </Link>
            <Link
              href="/login"
              className="inline-flex items-center px-6 py-3 rounded-lg text-sm font-semibold text-white border border-white/30 hover:bg-white/10 transition-colors"
            >
              Sign in
            </Link>
          </div>
          <p className="text-xs text-blue-300/70 mt-4">No credit card required</p>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-slate-100">
        <div className="max-w-6xl mx-auto px-6 py-6 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div
              className="w-6 h-6 rounded flex items-center justify-center"
              style={{ backgroundColor: '#1a3a5c' }}
            >
              <svg width="12" height="12" viewBox="0 0 20 20" fill="none">
                <path d="M3 14L8 7L13 10L17 4" stroke="#60a5fa" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                <circle cx="17" cy="16" r="2.5" fill="#34d399"/>
              </svg>
            </div>
            <span className="text-xs text-slate-400">AI Logistics Copilot</span>
          </div>
          <p className="text-xs text-slate-400">© {new Date().getFullYear()} AI Logistics Copilot</p>
        </div>
      </footer>

    </div>
  )
}
