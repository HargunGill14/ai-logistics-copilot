'use client'

import { useMemo, useState } from 'react'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import {
  LayoutDashboard,
  Truck,
  Bell,
  PlusCircle,
  Calculator,
  MessageSquare,
  Settings,
  LogOut,
  Menu,
  X,
  ChevronLeft,
  Store,
  MapPin,
  BadgeCheck,
  CreditCard,
  TrendingUp,
  Upload,
} from 'lucide-react'
import type { LucideIcon } from 'lucide-react'

type NavLinkItem = {
  href: string
  label: string
  icon: LucideIcon
  badge?: number
}

type NavSection = {
  label: string
  items: NavLinkItem[]
}

const navItems: NavSection[] = [
  {
    label: 'Overview',
    items: [
      { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
      { href: '/loads', label: 'Load Management', icon: Truck },
      { href: '/notifications', label: 'Notifications', icon: Bell, badge: 3 },
    ],
  },
  {
    label: 'AI Tools',
    items: [
      { href: '/loads/new', label: 'New Load', icon: PlusCircle },
      { href: '/pricing', label: 'AI Pricing', icon: Calculator },
      { href: '/negotiate', label: 'Negotiate', icon: MessageSquare },
    ],
  },
  {
    label: 'Account',
    items: [
      { href: '/plans', label: 'Plans & Billing', icon: CreditCard },
      { href: '/settings', label: 'Settings', icon: Settings },
    ],
  },
]

const brokerMarketplaceSection: NavSection = {
  label: 'Marketplace',
  items: [
    { href: '/marketplace', label: 'Marketplace', icon: Store },
    { href: '/tracking', label: 'Tracking', icon: MapPin },
    { href: '/financials', label: 'Financials', icon: TrendingUp },
    { href: '/import', label: 'Import Data', icon: Upload },
  ],
}

const carrierMarketplaceSection: NavSection = {
  label: 'Marketplace',
  items: [
    { href: '/carrier/marketplace', label: 'Marketplace', icon: Store },
    { href: '/carrier/verify', label: 'Verification', icon: BadgeCheck },
  ],
}

interface SidebarProps {
  role?: string
  email?: string
}

interface SidebarNavLinkProps {
  item: NavLinkItem
  collapsed: boolean
  pathname: string
  onNavigate: () => void
}

function SidebarNavLink({ item, collapsed, pathname, onNavigate }: SidebarNavLinkProps) {
  const Icon = item.icon
  const isActive = pathname === item.href
  return (
    <Link
      href={item.href}
      onClick={onNavigate}
      title={collapsed ? item.label : undefined}
      className={`group relative flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all duration-200 ${
        collapsed ? 'justify-center' : ''
      } ${
        isActive
          ? 'bg-[#1a3a5c]/10 text-[#1a3a5c] shadow-sm'
          : 'text-slate-600 hover:-translate-y-0.5 hover:bg-slate-100 hover:text-slate-900 hover:shadow-sm'
      }`}
    >
      {isActive && (
        <span
          aria-hidden
          className="absolute left-0 top-1.5 bottom-1.5 w-[3px] rounded-r-full bg-[#1a3a5c]"
        />
      )}
      <Icon
        size={18}
        className={`shrink-0 transition-colors duration-200 ${
          isActive ? 'text-[#1a3a5c]' : 'text-slate-400 group-hover:text-slate-700'
        }`}
      />
      {!collapsed && (
        <>
          <span className="flex-1 truncate text-left">{item.label}</span>
          {item.badge !== undefined && (
            <span className="flex h-5 min-w-[1.25rem] items-center justify-center rounded-full bg-amber-100 px-1.5 text-xs font-semibold text-amber-700">
              {item.badge}
            </span>
          )}
        </>
      )}
    </Link>
  )
}

interface SidebarContentProps {
  collapsed: boolean
  role: string
  email?: string
  pathname: string
  userInitials: string
  onNavigate: () => void
  onSignOut: () => void
}

function SidebarContent({
  collapsed,
  role,
  email,
  pathname,
  userInitials,
  onNavigate,
  onSignOut,
}: SidebarContentProps) {
  const displayRole = role === 'carrier' ? 'Carrier Workspace' : 'Owner Workspace'

  return (
    <>
      <div
        className={`flex h-16 items-center border-b border-slate-200 ${
          collapsed ? 'justify-center px-2' : 'px-4'
        }`}
      >
        <div className="flex items-center gap-2.5">
          <div className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-lg bg-slate-900">
            <svg width="18" height="18" viewBox="0 0 20 20" fill="none">
              <path d="M4 5.5H16" stroke="#E2E8F0" strokeWidth="1.6" strokeLinecap="round" />
              <path d="M4 10H13.5" stroke="#94A3B8" strokeWidth="1.6" strokeLinecap="round" />
              <path d="M4 14.5H11" stroke="#64748B" strokeWidth="1.6" strokeLinecap="round" />
              <path
                d="M15 13L17 15L15 17"
                stroke="#1a3a5c"
                strokeWidth="1.8"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </div>
          {!collapsed && (
            <span className="text-sm font-semibold tracking-tight text-slate-900">FreTraq</span>
          )}
        </div>
      </div>

      <nav className="flex-1 overflow-y-auto px-3 py-4">
        {role === 'broker' && (
          <div className="mb-6">
            {!collapsed && (
              <div className="mb-2 px-3 text-[11px] font-semibold uppercase tracking-wider text-slate-400">
                {brokerMarketplaceSection.label}
              </div>
            )}
            <div className="space-y-1">
              {brokerMarketplaceSection.items.map((item) => (
                <SidebarNavLink
                  key={item.href}
                  item={item}
                  collapsed={collapsed}
                  pathname={pathname}
                  onNavigate={onNavigate}
                />
              ))}
            </div>
          </div>
        )}

        {role === 'carrier' && (
          <div className="mb-6">
            {!collapsed && (
              <div className="mb-2 px-3 text-[11px] font-semibold uppercase tracking-wider text-slate-400">
                {carrierMarketplaceSection.label}
              </div>
            )}
            <div className="space-y-1">
              {carrierMarketplaceSection.items.map((item) => (
                <SidebarNavLink
                  key={item.href}
                  item={item}
                  collapsed={collapsed}
                  pathname={pathname}
                  onNavigate={onNavigate}
                />
              ))}
            </div>
          </div>
        )}

        {navItems.map((section, idx) => (
          <div key={section.label} className={idx > 0 ? 'mt-6' : ''}>
            {!collapsed && (
              <div className="mb-2 px-3 text-[11px] font-semibold uppercase tracking-wider text-slate-400">
                {section.label}
              </div>
            )}
            <div className="space-y-1">
              {section.items.map((item) => (
                <SidebarNavLink
                  key={item.href}
                  item={item}
                  collapsed={collapsed}
                  pathname={pathname}
                  onNavigate={onNavigate}
                />
              ))}
            </div>
          </div>
        ))}
      </nav>

      <div className={`border-t border-slate-200 ${collapsed ? 'p-2' : 'p-3'}`}>
        {collapsed ? (
          <div className="flex flex-col items-center gap-2">
            <div
              title="FreTraq Broker"
              className="flex h-10 w-10 items-center justify-center rounded-full bg-[#1a3a5c] text-sm font-semibold text-white shadow-sm"
            >
              {userInitials}
            </div>
            <button
              onClick={onSignOut}
              title="Sign out"
              aria-label="Sign out"
              className="flex h-10 w-10 items-center justify-center rounded-lg text-slate-500 transition-all duration-200 hover:bg-slate-100 hover:text-slate-900"
            >
              <LogOut size={18} />
            </button>
          </div>
        ) : (
          <>
            <div className="mb-2 flex items-center gap-3 rounded-lg bg-slate-50 p-3">
              <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full bg-[#1a3a5c] text-sm font-semibold text-white shadow-sm">
                {userInitials}
              </div>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-semibold text-slate-900">
                  {email ?? 'FreTraq Broker'}
                </p>
                <p className="truncate text-xs text-slate-500">{displayRole}</p>
              </div>
            </div>
            <button
              onClick={onSignOut}
              className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-slate-600 transition-all duration-200 hover:bg-slate-100 hover:text-slate-900"
            >
              <LogOut size={18} className="text-slate-400" />
              <span>Sign out</span>
            </button>
          </>
        )}
      </div>
    </>
  )
}

export default function Sidebar({ role = 'broker', email }: SidebarProps) {
  const pathname = usePathname()
  const router = useRouter()
  const supabase = createClient()
  const [isMobileOpen, setIsMobileOpen] = useState(false)
  const [isCollapsed, setIsCollapsed] = useState(false)

  const userInitials = useMemo(() => 'FT', [])

  async function handleSignOut() {
    const { error } = await supabase.auth.signOut()
    if (!error) {
      router.push('/login')
      router.refresh()
    }
  }

  function handleMobileNavClick() {
    setIsMobileOpen(false)
  }

  return (
    <>
      <button
        type="button"
        onClick={() => setIsMobileOpen(true)}
        className="fixed left-3 top-3 z-30 rounded-md border border-slate-200 bg-white p-2 text-slate-700 shadow-sm md:hidden"
        aria-label="Open sidebar"
      >
        <Menu size={18} />
      </button>

      {isMobileOpen && (
        <div className="fixed inset-0 z-40 md:hidden">
          <button
            type="button"
            aria-label="Close sidebar backdrop"
            onClick={() => setIsMobileOpen(false)}
            className="absolute inset-0 bg-slate-900/35 backdrop-blur-[1px]"
          />
          <aside className="absolute inset-y-0 left-0 flex w-72 max-w-[85vw] flex-col border-r border-slate-200 bg-white shadow-xl">
            <div className="flex items-center justify-end border-b border-slate-200 px-3 py-2">
              <button
                type="button"
                onClick={() => setIsMobileOpen(false)}
                className="rounded-md p-1.5 text-slate-600 hover:bg-slate-100"
                aria-label="Close sidebar"
              >
                <X size={17} />
              </button>
            </div>
            <SidebarContent
              collapsed={false}
              role={role}
              email={email}
              pathname={pathname}
              userInitials={userInitials}
              onNavigate={handleMobileNavClick}
              onSignOut={handleSignOut}
            />
          </aside>
        </div>
      )}

      <aside
        className={`relative hidden flex-shrink-0 flex-col border-r border-slate-200 bg-white transition-all duration-300 ease-in-out md:flex ${
          isCollapsed ? 'w-16' : 'w-64'
        }`}
      >
        <SidebarContent
          collapsed={isCollapsed}
          role={role}
          email={email}
          pathname={pathname}
          userInitials={userInitials}
          onNavigate={handleMobileNavClick}
          onSignOut={handleSignOut}
        />
        <button
          type="button"
          onClick={() => setIsCollapsed((prev) => !prev)}
          aria-label={isCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          className="absolute -right-3 top-20 z-10 flex h-6 w-6 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-500 shadow-sm transition-all duration-200 hover:border-[#1a3a5c] hover:text-[#1a3a5c] hover:shadow-md"
        >
          <ChevronLeft
            size={14}
            className={`transition-transform duration-300 ${isCollapsed ? 'rotate-180' : ''}`}
          />
        </button>
      </aside>
    </>
  )
}
