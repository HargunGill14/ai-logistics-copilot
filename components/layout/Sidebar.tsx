'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import {
  LayoutDashboard,
  Truck,
  Bell,
  PlusCircle,
  Calculator,
  MessageSquare,
  Settings,
  LogOut,
  ShieldCheck,
} from 'lucide-react'

const navItems = [
  {
    label: 'Overview',
    items: [
      { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
      { href: '/loads', label: 'Load Management', icon: Truck },
      { href: '/notifications', label: 'Notifications', icon: Bell, badge: 3 },
    ]
  },
  {
    label: 'AI Tools',
    items: [
      { href: '/loads/new', label: 'New Load', icon: PlusCircle },
      { href: '/pricing', label: 'AI Pricing', icon: Calculator },
      { href: '/negotiate', label: 'Negotiate', icon: MessageSquare },
    ]
  },
  {
    label: 'Account',
    items: [
      { href: '/settings', label: 'Settings', icon: Settings },
    ]
  }
]

const adminNavItems = [
  { href: '/dashboard', label: 'Broker View', icon: LayoutDashboard },
  { href: '/carrier', label: 'Carrier View', icon: Truck },
  { href: '/yard', label: 'Yard View', icon: ShieldCheck },
]

interface SidebarProps {
  isAdmin: boolean
}

export default function Sidebar({ isAdmin }: SidebarProps) {
  const pathname = usePathname()
  const router = useRouter()
  const supabase = createClient()

  async function handleSignOut() {
    const { error } = await supabase.auth.signOut()
    if (!error) {
      router.push('/login')
      router.refresh()
    }
  }

  return (
    <div className="w-52 bg-white border-r border-slate-200 flex flex-col flex-shrink-0">
      {/* Logo */}
      <div className="p-4 border-b border-slate-200">
        <div className="flex items-center gap-2">
          <div
            className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0"
            style={{ backgroundColor: '#1a3a5c' }}
          >
            <svg width="16" height="16" viewBox="0 0 20 20" fill="none">
              <path d="M3 14L8 7L13 10L17 4" stroke="#60a5fa" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              <circle cx="17" cy="16" r="2.5" fill="#34d399"/>
            </svg>
          </div>
          <div>
            <div className="text-xs font-semibold text-slate-900 leading-tight">AI Logistics</div>
            <div className="text-xs text-slate-400">Copilot</div>
          </div>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 p-2 overflow-y-auto">
        {/* Admin dashboard switcher */}
        {isAdmin && (
          <div className="mb-4">
            <div className="px-2 py-1 text-xs font-medium text-amber-600 uppercase tracking-wider flex items-center gap-1">
              <ShieldCheck size={11} />
              Admin
            </div>
            {adminNavItems.map((item) => {
              const Icon = item.icon
              const isActive = pathname === item.href
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`flex items-center gap-2 px-2 py-2 rounded-lg text-sm mb-0.5 transition-colors ${
                    isActive
                      ? 'text-white'
                      : 'text-slate-600 hover:bg-slate-100'
                  }`}
                  style={isActive ? { backgroundColor: '#1a3a5c' } : {}}
                >
                  <Icon size={15} />
                  <span className="flex-1">{item.label}</span>
                </Link>
              )
            })}
          </div>
        )}

        {/* Standard nav */}
        {navItems.map((section) => (
          <div key={section.label} className="mb-4">
            <div className="px-2 py-1 text-xs font-medium text-slate-400 uppercase tracking-wider">
              {section.label}
            </div>
            {section.items.map((item) => {
              const Icon = item.icon
              const isActive = pathname === item.href
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`flex items-center gap-2 px-2 py-2 rounded-lg text-sm mb-0.5 transition-colors ${
                    isActive
                      ? 'text-white'
                      : 'text-slate-600 hover:bg-slate-100'
                  }`}
                  style={isActive ? { backgroundColor: '#1a3a5c' } : {}}
                >
                  <Icon size={15} />
                  <span className="flex-1">{item.label}</span>
                  {'badge' in item && item.badge && (
                    <span className="text-xs bg-amber-100 text-amber-700 px-1.5 py-0.5 rounded-full font-medium">
                      {item.badge}
                    </span>
                  )}
                </Link>
              )
            })}
          </div>
        ))}
      </nav>

      {/* User */}
      <div className="p-3 border-t border-slate-200">
        <button
          onClick={handleSignOut}
          className="flex items-center gap-2 px-2 py-2 rounded-lg text-sm text-slate-600 hover:bg-slate-100 w-full transition-colors"
        >
          <LogOut size={15} />
          <span>Sign out</span>
        </button>
      </div>
    </div>
  )
}
