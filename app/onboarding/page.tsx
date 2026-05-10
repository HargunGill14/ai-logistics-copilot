import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { RolePicker } from './_RolePicker'

export default async function OnboardingPage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('profiles')
    .select('role, onboarding_complete')
    .eq('id', user.id)
    .single()

  // Already finished — send them to their dashboard
  if (profile?.onboarding_complete) {
    const role = profile.role as string | null
    redirect(role === 'carrier' ? '/carrier' : '/dashboard')
  }

  return (
    <div>
      <div className="mb-10 text-center">
        <div className="flex items-center justify-center gap-2.5 mb-6">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-slate-900">
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
          <span className="text-lg font-semibold tracking-tight text-slate-900">FreTraq</span>
        </div>
        <h1 className="text-2xl font-bold text-slate-900">How will you use FreTraq?</h1>
        <p className="mt-2 text-sm text-slate-500">
          Choose your role. This cannot be changed later.
        </p>
      </div>
      <RolePicker />
    </div>
  )
}
