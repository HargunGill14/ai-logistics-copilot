import Link from 'next/link'
import { Card, CardContent } from '@/components/ui/card'

const Logo = () => (
  <div className="flex items-center justify-center gap-3 mb-8">
    <div className="w-10 h-10 rounded-lg flex items-center justify-center" style={{ backgroundColor: '#1a3a5c' }}>
      <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
        <path d="M3 14L8 7L13 10L17 4" stroke="#60a5fa" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
        <circle cx="17" cy="16" r="2.5" fill="#34d399"/>
      </svg>
    </div>
    <div>
      <div className="font-semibold text-slate-900 leading-tight">FreTraq</div>
      <div className="text-xs text-slate-500">AI Logistics Copilot</div>
    </div>
  </div>
)

interface PageProps {
  searchParams: Promise<{ name?: string; email?: string }>
}

export default async function WaitlistConfirmedPage({ searchParams }: PageProps) {
  const { name, email } = await searchParams
  const displayName = name ?? 'there'
  const displayEmail = email ?? 'your email'

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <Logo />

        <Card>
          <CardContent className="pt-10 pb-10 text-center">
            {/* Green checkmark circle */}
            <div className="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-6 bg-emerald-50">
              <svg width="32" height="32" viewBox="0 0 24 24" fill="none">
                <circle cx="12" cy="12" r="10" fill="#22c55e"/>
                <path
                  d="M7.5 12.5l3 3 6-6"
                  stroke="white"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </div>

            <h1 className="text-xl font-semibold text-slate-900 mb-3">
              You&apos;re on the list!
            </h1>

            <p className="text-sm text-slate-600 leading-relaxed max-w-xs mx-auto">
              Thanks for joining{' '}
              <span className="font-medium text-slate-800">{displayName}</span>.
              We&apos;ll email you at{' '}
              <span className="font-medium text-slate-800">{displayEmail}</span>{' '}
              when your account is ready.
            </p>

            <p className="text-xs text-slate-400 mt-5 leading-relaxed max-w-xs mx-auto">
              We&apos;re rolling out access gradually — no action needed on your end.
            </p>
          </CardContent>

          <div className="px-6 pb-6 border-t border-slate-100 pt-4 text-center">
            <p className="text-xs text-slate-400">
              Wrong email?{' '}
              <Link
                href="/signup"
                className="font-medium underline underline-offset-2"
                style={{ color: '#1a3a5c' }}
              >
                Go back
              </Link>
            </p>
          </div>
        </Card>
      </div>
    </div>
  )
}
