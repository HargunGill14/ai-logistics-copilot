'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { LayoutDashboard, Truck, Loader2 } from 'lucide-react'

type Role = 'broker' | 'carrier'

const ROLES: {
  role: Role
  label: string
  description: string
  highlights: string[]
  icon: React.ReactNode
  accent: string
  border: string
}[] = [
  {
    role: 'broker',
    label: 'Freight Broker',
    description: 'I manage loads, price freight, and work with carriers.',
    highlights: ['AI Pricing Engine', 'Post loads to Marketplace', 'Shipment Tracking', 'Negotiate emails'],
    icon: <LayoutDashboard size={28} />,
    accent: 'text-[#1a3a5c]',
    border: 'border-[#1a3a5c]',
  },
  {
    role: 'carrier',
    label: 'Carrier / Fleet',
    description: 'I haul freight and want to find and bid on loads.',
    highlights: ['Browse posted loads', 'Submit bids', 'FMCSA Fraud Shield', 'Carrier profile'],
    icon: <Truck size={28} />,
    accent: 'text-emerald-700',
    border: 'border-emerald-500',
  },
]

export function RolePicker() {
  const router = useRouter()
  const [selecting, setSelecting] = useState<Role | null>(null)
  const [error, setError] = useState<string | null>(null)

  async function handleSelect(role: Role) {
    if (selecting) return
    setSelecting(role)
    setError(null)

    try {
      const res = await fetch('/api/onboarding/role', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ role }),
      })

      const data: { error?: string } = await res.json()

      if (!res.ok) {
        setError(data.error ?? 'Something went wrong. Please try again.')
        setSelecting(null)
        return
      }

      router.push(role === 'broker' ? '/onboarding/broker' : '/onboarding/carrier')
    } catch {
      setError('Network error — please try again.')
      setSelecting(null)
    }
  }

  return (
    <div>
      {error && (
        <div className="mb-6 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      )}

      <div className="grid gap-4 sm:grid-cols-2">
        {ROLES.map((r) => {
          const isLoading = selecting === r.role

          return (
            <button
              key={r.role}
              type="button"
              onClick={() => handleSelect(r.role)}
              disabled={!!selecting}
              className={`relative flex flex-col rounded-xl border-2 bg-white p-6 text-left shadow-sm transition-all hover:shadow-md disabled:cursor-not-allowed disabled:opacity-60 ${
                isLoading ? r.border : 'border-slate-200 hover:border-slate-300'
              }`}
            >
              <div className={`mb-4 inline-flex rounded-lg border p-3 ${r.accent} bg-slate-50 border-slate-200`}>
                {r.icon}
              </div>
              <h2 className="mb-1 text-lg font-bold text-slate-900">{r.label}</h2>
              <p className="mb-4 text-sm text-slate-500">{r.description}</p>
              <ul className="mb-5 flex-1 space-y-1.5">
                {r.highlights.map((h) => (
                  <li key={h} className="flex items-center gap-2 text-sm text-slate-600">
                    <span className="h-1.5 w-1.5 flex-shrink-0 rounded-full bg-slate-300" />
                    {h}
                  </li>
                ))}
              </ul>
              <div
                className={`flex items-center justify-center gap-2 rounded-lg px-4 py-2.5 text-sm font-semibold text-white transition-all bg-[#1a3a5c]`}
              >
                {isLoading ? (
                  <>
                    <Loader2 size={15} className="animate-spin" />
                    Setting up…
                  </>
                ) : (
                  `Continue as ${r.label}`
                )}
              </div>
            </button>
          )
        })}
      </div>
    </div>
  )
}
