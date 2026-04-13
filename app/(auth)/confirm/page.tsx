import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { Card, CardContent } from '@/components/ui/card'

export default async function ConfirmPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  // If no session the link must have been invalid or already used
  if (!user) {
    redirect('/login?error=confirmation_failed')
  }

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
      <div className="w-full max-w-md">

        {/* Logo */}
        <div className="flex items-center justify-center gap-3 mb-8">
          <div className="w-10 h-10 rounded-lg flex items-center justify-center" style={{ backgroundColor: '#1a3a5c' }}>
            <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
              <path d="M3 14L8 7L13 10L17 4" stroke="#60a5fa" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              <circle cx="17" cy="16" r="2.5" fill="#34d399"/>
            </svg>
          </div>
          <div>
            <div className="font-semibold text-slate-900 leading-tight">AI Logistics Copilot</div>
            <div className="text-xs text-slate-500">Freight Broker Platform</div>
          </div>
        </div>

        <Card>
          <CardContent className="pt-10 pb-8 text-center">
            {/* Success icon */}
            <div className="w-14 h-14 rounded-full bg-green-50 flex items-center justify-center mx-auto mb-5">
              <svg width="26" height="26" viewBox="0 0 26 26" fill="none">
                <circle cx="13" cy="13" r="11" stroke="#16a34a" strokeWidth="1.8" fill="none"/>
                <path d="M8 13l3.5 3.5L18 9" stroke="#16a34a" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </div>

            <h2 className="text-lg font-semibold text-slate-900 mb-2">Email confirmed</h2>
            <p className="text-sm text-slate-500 mb-8 leading-relaxed max-w-xs mx-auto">
              Your account is verified and ready to go. Start pricing loads smarter with AI.
            </p>

            <Link
              href="/dashboard"
              className="inline-flex items-center gap-2 px-6 py-2.5 rounded-lg text-sm font-semibold text-white transition-opacity hover:opacity-90"
              style={{ backgroundColor: '#1a3a5c' }}
            >
              Go to dashboard
              <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                <path d="M2 7h10M8 3l4 4-4 4" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </Link>
          </CardContent>
        </Card>

      </div>
    </div>
  )
}
