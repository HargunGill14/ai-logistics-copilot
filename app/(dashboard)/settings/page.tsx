'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { User, Building2, CheckCircle2 } from 'lucide-react'

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

  useEffect(() => {
    async function load() {
      const { data: { user } } = await supabase.auth.getUser()
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
    </div>
  )
}
