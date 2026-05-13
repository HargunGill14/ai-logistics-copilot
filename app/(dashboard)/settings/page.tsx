'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { User, Building2, CheckCircle2, Link2, Link2Off, Loader2 } from 'lucide-react'

interface ProfileData {
  id: string
  full_name: string
  email: string
  role: string
  organization_id: string
}

interface OrgData {
  id: string
  name: string
}

interface QboStatus {
  connected: boolean
  company_name: string | null
  connected_at: string | null
}

export default function SettingsPage() {
  const supabase = createClient()

  const [profile, setProfile] = useState<ProfileData | null>(null)
  const [org, setOrg] = useState<OrgData | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [success, setSuccess] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const [fullName, setFullName] = useState('')
  const [companyName, setCompanyName] = useState('')

  const [qboStatus, setQboStatus] = useState<QboStatus | null>(null)
  const [qboLoading, setQboLoading] = useState(false)
  const [qboDisconnecting, setQboDisconnecting] = useState(false)
  const [qboMessage, setQboMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(
    null,
  )

  useEffect(() => {
    // Handle redirect-back status from QBO OAuth
    const params = new URLSearchParams(window.location.search)
    const qboParam = params.get('qbo')
    if (qboParam === 'connected') {
      setQboMessage({ type: 'success', text: 'QuickBooks connected successfully.' })
      window.history.replaceState({}, '', '/settings')
    } else if (qboParam && qboParam !== 'connected') {
      const map: Record<string, string> = {
        failed: 'Failed to connect QuickBooks. Please try again.',
        connect_failed: 'Failed to connect QuickBooks. Please try again.',
        not_configured: 'QuickBooks credentials are not configured.',
        forbidden: 'Only brokers can connect QuickBooks.',
        unauthorized: 'Please log in and try again.',
      }
      setQboMessage({ type: 'error', text: map[qboParam] ?? 'QuickBooks connection failed.' })
      window.history.replaceState({}, '', '/settings')
    }
  }, [])

  useEffect(() => {
    async function load() {
      const {
        data: { user },
      } = await supabase.auth.getUser()
      if (!user) return

      const { data: profileData } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single()

      if (profileData) {
        setProfile(profileData)
        setFullName(profileData.full_name || '')

        const { data: orgData } = await supabase
          .from('organizations')
          .select('*')
          .eq('id', profileData.organization_id)
          .single()

        if (orgData) {
          setOrg(orgData)
          setCompanyName(orgData.name || '')
        }

        // Load QBO connection status for brokers
        if (profileData.role === 'broker') {
          setQboLoading(true)
          const { data: qboRow } = await supabase
            .from('qbo_connections')
            .select('company_name, connected_at, is_active')
            .eq('organization_id', profileData.organization_id)
            .eq('is_active', true)
            .order('connected_at', { ascending: false })
            .limit(1)
            .maybeSingle()

          setQboStatus(
            qboRow
              ? { connected: true, company_name: qboRow.company_name, connected_at: qboRow.connected_at }
              : { connected: false, company_name: null, connected_at: null },
          )
          setQboLoading(false)
        }
      }

      setLoading(false)
    }

    load()
  }, [])

  async function handleSave(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)
    setError(null)
    setSuccess(false)

    try {
      if (!profile) throw new Error('No profile loaded')

      const trimmedName = fullName.trim()
      const trimmedCompany = companyName.trim()

      if (!trimmedName) throw new Error('Full name is required')
      if (!trimmedCompany) throw new Error('Company name is required')

      const { error: profileError } = await supabase
        .from('profiles')
        .update({ full_name: trimmedName })
        .eq('id', profile.id)

      if (profileError) throw profileError

      const { error: orgError } = await supabase
        .from('organizations')
        .update({ name: trimmedCompany })
        .eq('id', profile.organization_id)

      if (orgError) throw orgError

      setProfile(prev => prev ? { ...prev, full_name: trimmedName } : prev)
      setOrg(prev => prev ? { ...prev, name: trimmedCompany } : prev)
      setSuccess(true)
      setTimeout(() => setSuccess(false), 4000)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save changes')
    } finally {
      setSaving(false)
    }
  }

  async function handleQboDisconnect() {
    setQboDisconnecting(true)
    setQboMessage(null)
    try {
      const res = await fetch('/api/integrations/quickbooks/disconnect', { method: 'POST' })
      if (!res.ok) throw new Error('Disconnect failed')
      setQboStatus({ connected: false, company_name: null, connected_at: null })
      setQboMessage({ type: 'success', text: 'QuickBooks disconnected.' })
    } catch {
      setQboMessage({ type: 'error', text: 'Failed to disconnect QuickBooks. Please try again.' })
    } finally {
      setQboDisconnecting(false)
    }
  }

  if (loading) {
    return (
      <div className="max-w-xl">
        <div className="h-6 w-32 bg-slate-100 rounded animate-pulse mb-6" />
        <div className="bg-white rounded-lg border border-slate-200 p-6 space-y-4">
          {[1, 2, 3].map(i => (
            <div key={i} className="space-y-1.5">
              <div className="h-3.5 w-20 bg-slate-100 rounded animate-pulse" />
              <div className="h-9 bg-slate-100 rounded animate-pulse" />
            </div>
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-xl">
      <div className="mb-6">
        <h1 className="text-xl font-semibold text-slate-900">Settings</h1>
        <p className="text-sm text-slate-500">Manage your profile and company information</p>
      </div>

      {success && (
        <div className="flex items-center gap-2 bg-green-50 border border-green-200 text-green-700 rounded-lg px-4 py-3 mb-4 text-sm">
          <CheckCircle2 size={15} className="flex-shrink-0" />
          Changes saved successfully
        </div>
      )}

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 rounded-lg px-4 py-3 mb-4 text-sm">
          {error}
        </div>
      )}

      <form onSubmit={handleSave} className="space-y-4">
        {/* Profile */}
        <div className="bg-white rounded-lg border border-slate-200 overflow-hidden">
          <div className="flex items-center gap-2 px-4 py-3 border-b border-slate-100">
            <User size={14} className="text-slate-400" />
            <h2 className="text-sm font-semibold text-slate-900">Profile</h2>
          </div>
          <div className="p-4 space-y-4">
            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1.5">
                Full name
              </label>
              <input
                type="text"
                value={fullName}
                onChange={e => setFullName(e.target.value)}
                className="w-full px-3 py-2 rounded-lg border border-slate-200 text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-100 focus:border-slate-300"
                placeholder="Your full name"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1.5">
                Email
              </label>
              <input
                type="email"
                value={profile?.email || ''}
                disabled
                className="w-full px-3 py-2 rounded-lg border border-slate-200 text-sm text-slate-400 bg-slate-50 cursor-not-allowed"
              />
              <p className="text-xs text-slate-400 mt-1">Email cannot be changed here</p>
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1.5">
                Role
              </label>
              <input
                type="text"
                value={profile?.role || ''}
                disabled
                className="w-full px-3 py-2 rounded-lg border border-slate-200 text-sm text-slate-400 bg-slate-50 cursor-not-allowed capitalize"
              />
            </div>
          </div>
        </div>

        {/* Company */}
        <div className="bg-white rounded-lg border border-slate-200 overflow-hidden">
          <div className="flex items-center gap-2 px-4 py-3 border-b border-slate-100">
            <Building2 size={14} className="text-slate-400" />
            <h2 className="text-sm font-semibold text-slate-900">Company</h2>
          </div>
          <div className="p-4">
            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1.5">
                Company name
              </label>
              <input
                type="text"
                value={companyName}
                onChange={e => setCompanyName(e.target.value)}
                className="w-full px-3 py-2 rounded-lg border border-slate-200 text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-100 focus:border-slate-300"
                placeholder="Your company name"
              />
            </div>
          </div>
        </div>

        <div className="flex justify-end">
          <button
            type="submit"
            disabled={saving}
            className="px-4 py-2 rounded-lg text-sm font-medium text-white disabled:opacity-60 transition-opacity"
            style={{ backgroundColor: '#1a3a5c' }}
          >
            {saving ? 'Saving…' : 'Save changes'}
          </button>
        </div>
      </form>

      {/* QuickBooks Integration — brokers only */}
      {profile?.role === 'broker' && (
        <div className="mt-4">
          {qboMessage && (
            <div
              className={`flex items-center gap-2 rounded-lg px-4 py-3 mb-4 text-sm border ${
                qboMessage.type === 'success'
                  ? 'bg-green-50 border-green-200 text-green-700'
                  : 'bg-red-50 border-red-200 text-red-700'
              }`}
            >
              {qboMessage.type === 'success' && <CheckCircle2 size={15} className="flex-shrink-0" />}
              {qboMessage.text}
            </div>
          )}

          <div className="bg-white rounded-lg border border-slate-200 overflow-hidden">
            <div className="flex items-center gap-2 px-4 py-3 border-b border-slate-100">
              <Link2 size={14} className="text-slate-400" />
              <h2 className="text-sm font-semibold text-slate-900">QuickBooks Integration</h2>
            </div>

            <div className="p-4">
              {qboLoading ? (
                <div className="flex items-center gap-2 text-sm text-slate-500">
                  <Loader2 size={14} className="animate-spin" />
                  Checking connection…
                </div>
              ) : qboStatus?.connected ? (
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <div className="flex items-center gap-1.5 mb-1">
                      <span className="inline-block w-2 h-2 rounded-full bg-teal-500" />
                      <span className="text-sm font-medium text-slate-900">Connected</span>
                    </div>
                    {qboStatus.company_name && (
                      <p className="text-xs text-slate-500">{qboStatus.company_name}</p>
                    )}
                    {qboStatus.connected_at && (
                      <p className="text-xs text-slate-400 mt-0.5">
                        Since{' '}
                        {new Date(qboStatus.connected_at).toLocaleDateString(undefined, {
                          year: 'numeric',
                          month: 'short',
                          day: 'numeric',
                        })}
                      </p>
                    )}
                    <p className="text-xs text-slate-400 mt-2">
                      Covered loads sync as invoices automatically.
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={handleQboDisconnect}
                    disabled={qboDisconnecting}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-200 text-xs font-medium text-slate-600 hover:bg-slate-50 disabled:opacity-60 transition-colors flex-shrink-0"
                  >
                    {qboDisconnecting ? (
                      <Loader2 size={12} className="animate-spin" />
                    ) : (
                      <Link2Off size={12} />
                    )}
                    Disconnect
                  </button>
                </div>
              ) : (
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <div className="flex items-center gap-1.5 mb-1">
                      <span className="inline-block w-2 h-2 rounded-full bg-slate-300" />
                      <span className="text-sm font-medium text-slate-900">Not connected</span>
                    </div>
                    <p className="text-xs text-slate-500 mt-1">
                      Connect QuickBooks Online to automatically sync covered loads as invoices
                      and track carrier payments.
                    </p>
                  </div>
                  <a
                    href="/api/integrations/quickbooks/connect"
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium text-white flex-shrink-0 transition-opacity hover:opacity-90"
                    style={{ backgroundColor: '#0d9488' }}
                  >
                    <Link2 size={12} />
                    Connect QuickBooks
                  </a>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
