'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { LayoutDashboard, Truck, Warehouse, Check, Loader2 } from 'lucide-react'

type Role = 'broker' | 'carrier' | 'yard'

interface RoleCard {
  role: Role
  title: string
  description: string
  icon: React.ReactNode
  borderActive: string
  iconBox: string
  highlights: string[]
}

const CARDS: RoleCard[] = [
  {
    role: 'broker',
    title: 'Broker View',
    description: 'Freight broker managing loads, pricing, and carrier negotiations.',
    icon: <LayoutDashboard size={26} />,
    borderActive: 'border-[#1a3a5c]',
    iconBox: 'text-[#1a3a5c] bg-[#1a3a5c]/10 border-[#1a3a5c]/20',
    highlights: ['AI Pricing Engine', 'Post loads to Marketplace', 'Shipment Tracking', 'Negotiate emails'],
  },
  {
    role: 'carrier',
    title: 'Carrier View',
    description: 'Truck carrier browsing available loads and managing compliance.',
    icon: <Truck size={26} />,
    borderActive: 'border-emerald-500',
    iconBox: 'text-emerald-700 bg-emerald-50 border-emerald-200',
    highlights: ['Browse posted loads', 'Submit bids', 'Fraud Shield verification', 'Carrier profile'],
  },
  {
    role: 'yard',
    title: 'Yard View',
    description: 'Yard manager scheduling dock appointments and tracking check-ins.',
    icon: <Warehouse size={26} />,
    borderActive: 'border-amber-500',
    iconBox: 'text-amber-700 bg-amber-50 border-amber-200',
    highlights: ['Dock scheduler', 'Truck check-ins', 'Appointment management', 'Yard activity feed'],
  },
]

export function RoleSwitcherCards({ currentRole }: { currentRole: string }) {
  const router = useRouter()
  const [switching, setSwitching] = useState<Role | null>(null)
  const [error, setError] = useState<string | null>(null)

  async function handleSwitch(role: Role) {
    if (switching || role === currentRole) return
    setSwitching(role)
    setError(null)

    try {
      const res = await fetch('/api/admin/switch-role', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ role }),
      })

      const data: { error?: string } = await res.json()
      if (!res.ok) {
        setError(data.error ?? 'Failed to switch role')
        setSwitching(null)
        return
      }

      router.push('/dashboard')
      router.refresh()
    } catch {
      setError('Network error — please try again')
      setSwitching(null)
    }
  }

  return (
    <div className="mx-auto max-w-4xl">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-slate-900">Switch Role</h1>
        <p className="mt-1 text-sm text-slate-500">
          Demo mode — explore each role&apos;s dashboard. Currently viewing as{' '}
          <span className="font-semibold capitalize text-slate-700">{currentRole}</span>.
        </p>
      </div>

      {error && (
        <div className="mb-6 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      )}

      <div className="grid gap-5 sm:grid-cols-3">
        {CARDS.map((card) => {
          const isActive = card.role === currentRole
          const isLoading = switching === card.role

          return (
            <div
              key={card.role}
              className={`relative flex flex-col rounded-xl border-2 bg-white p-6 shadow-sm transition-shadow hover:shadow-md ${
                isActive ? card.borderActive : 'border-slate-200'
              }`}
            >
              {isActive && (
                <span className="absolute right-3 top-3 flex items-center gap-1 rounded-full bg-slate-900 px-2 py-0.5 text-[11px] font-semibold text-white">
                  <Check size={10} strokeWidth={3} />
                  Active
                </span>
              )}

              <div className={`mb-4 inline-flex w-fit rounded-lg border p-3 ${card.iconBox}`}>
                {card.icon}
              </div>

              <h2 className="mb-1 text-lg font-bold text-slate-900">{card.title}</h2>
              <p className="mb-4 text-sm text-slate-500">{card.description}</p>

              <ul className="mb-6 flex-1 space-y-1.5">
                {card.highlights.map((h) => (
                  <li key={h} className="flex items-center gap-2 text-sm text-slate-600">
                    <span className="h-1.5 w-1.5 flex-shrink-0 rounded-full bg-slate-300" />
                    {h}
                  </li>
                ))}
              </ul>

              <button
                onClick={() => handleSwitch(card.role)}
                disabled={isActive || !!switching}
                className={`flex w-full items-center justify-center gap-2 rounded-lg px-4 py-2.5 text-sm font-semibold transition-all ${
                  isActive
                    ? 'cursor-default bg-slate-100 text-slate-500'
                    : 'bg-[#1a3a5c] text-white hover:bg-[#1a3a5c]/90 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-50'
                }`}
              >
                {isLoading ? (
                  <>
                    <Loader2 size={15} className="animate-spin" />
                    Switching…
                  </>
                ) : isActive ? (
                  <>
                    <Check size={15} />
                    Current view
                  </>
                ) : (
                  'Switch to this view'
                )}
              </button>
            </div>
          )
        })}
      </div>
    </div>
  )
}
