'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardFooter, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import Link from 'next/link'

const Logo = () => (
  <div className="flex items-center justify-center gap-3 mb-8">
    <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-slate-900">
      <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
        <path d="M4 5.5H16" stroke="#E2E8F0" strokeWidth="1.6" strokeLinecap="round" />
        <path d="M4 10H13.5" stroke="#94A3B8" strokeWidth="1.6" strokeLinecap="round" />
        <path d="M4 14.5H11" stroke="#64748B" strokeWidth="1.6" strokeLinecap="round" />
        <path d="M15 13L17 15L15 17" stroke="#1a3a5c" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    </div>
    <div className="text-lg font-semibold tracking-tight text-slate-900">FreTraq</div>
  </div>
)

export default function SignupPage() {
  const [fullName, setFullName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [confirmed, setConfirmed] = useState(false)

  const supabase = createClient()

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError('')

    const { error } = await supabase.auth.signUp({
      email: email.trim(),
      password,
      options: {
        data: { full_name: fullName.trim() },
        emailRedirectTo: `${window.location.origin}/auth/callback`,
      },
    })

    if (error) {
      setError(error.message)
      setLoading(false)
    } else {
      setConfirmed(true)
    }
  }

  if (confirmed) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
        <div className="w-full max-w-md">
          <Logo />
          <Card>
            <CardContent className="pt-10 pb-10 text-center">
              <div className="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-6 bg-emerald-50">
                <svg width="32" height="32" viewBox="0 0 24 24" fill="none">
                  <circle cx="12" cy="12" r="10" fill="#22c55e" />
                  <path d="M7.5 12.5l3 3 6-6" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </div>
              <h1 className="text-xl font-semibold text-slate-900 mb-3">Check your email</h1>
              <p className="text-sm text-slate-600 leading-relaxed max-w-xs mx-auto">
                We sent a confirmation link to{' '}
                <span className="font-medium text-slate-800">{email}</span>.
                Click it to activate your account.
              </p>
              <p className="text-xs text-slate-400 mt-5 leading-relaxed max-w-xs mx-auto">
                Once confirmed you&apos;ll be taken straight to onboarding.
              </p>
            </CardContent>
            <div className="px-6 pb-6 border-t border-slate-100 pt-4 text-center">
              <p className="text-xs text-slate-400">
                Wrong email?{' '}
                <button
                  onClick={() => { setConfirmed(false); setEmail(''); setPassword('') }}
                  className="font-medium underline underline-offset-2"
                  style={{ color: '#1a3a5c' }}
                >
                  Go back
                </button>
              </p>
            </div>
          </Card>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <Logo />

        <Card>
          <CardHeader>
            <CardTitle className="text-xl">Create your account</CardTitle>
            <CardDescription>Get started with FreTraq — free to try.</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="fullName">Full name</Label>
                <Input
                  id="fullName"
                  type="text"
                  placeholder="Jake Brodie"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="email">Work email</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="you@company.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="password">Password</Label>
                <Input
                  id="password"
                  type="password"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  minLength={8}
                  required
                />
              </div>

              {error && (
                <div className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-md p-3">
                  {error}
                </div>
              )}

              <Button
                type="submit"
                className="w-full text-white"
                style={{ backgroundColor: '#1a3a5c' }}
                disabled={loading}
              >
                {loading ? 'Creating account...' : 'Create account'}
              </Button>
            </form>
          </CardContent>
          <CardFooter className="justify-center">
            <p className="text-sm text-slate-500">
              Already have an account?{' '}
              <Link href="/login" className="font-medium" style={{ color: '#1a3a5c' }}>
                Sign in
              </Link>
            </p>
          </CardFooter>
        </Card>
      </div>
    </div>
  )
}
