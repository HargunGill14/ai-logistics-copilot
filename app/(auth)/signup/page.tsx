'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardFooter, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import Link from 'next/link'

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

export default function SignupPage() {
  const [fullName, setFullName] = useState('')
  const [companyName, setCompanyName] = useState('')
  const [email, setEmail] = useState('')
  const [role, setRole] = useState('broker')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [submitted, setSubmitted] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError('')

    const res = await fetch('/api/waitlist', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: email.trim(),
        full_name: fullName.trim(),
        company_name: companyName.trim(),
        role,
      }),
    })

    const json = await res.json()

    if (!res.ok) {
      setError(json.error ?? 'Something went wrong. Please try again.')
      setLoading(false)
      return
    }

    setSubmitted(true)
    setLoading(false)
  }

  if (submitted) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
        <div className="w-full max-w-md">
          <Logo />
          <Card>
            <CardContent className="pt-8 pb-8 text-center">
              <div
                className="w-14 h-14 rounded-full flex items-center justify-center mx-auto mb-5"
                style={{ backgroundColor: '#1a3a5c15' }}
              >
                <svg width="26" height="26" viewBox="0 0 24 24" fill="none">
                  <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2z" stroke="#1a3a5c" strokeWidth="1.6" fill="none"/>
                  <path d="M8 12l3 3 5-5" stroke="#1a3a5c" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </div>
              <h2 className="text-lg font-semibold text-slate-900 mb-2">
                You&apos;re on the waitlist!
              </h2>
              <p className="text-sm text-slate-500 mb-1">
                We&apos;ve saved your spot for
              </p>
              <p className="text-sm font-medium text-slate-800 mb-5">{email}</p>
              <p className="text-xs text-slate-400 leading-relaxed max-w-xs mx-auto">
                We&apos;re rolling out access gradually. We&apos;ll email you as soon as your account is ready — no action needed on your end.
              </p>
            </CardContent>
            <div className="px-6 pb-6 border-t border-slate-100 pt-4 text-center">
              <p className="text-xs text-slate-400">
                Wrong email?{' '}
                <button
                  onClick={() => { setSubmitted(false); setError('') }}
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
            <CardTitle className="text-xl">Join the waitlist</CardTitle>
            <CardDescription>We&apos;re launching soon. Reserve your spot now.</CardDescription>
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
                <Label htmlFor="companyName">Brokerage company name</Label>
                <Input
                  id="companyName"
                  type="text"
                  placeholder="Brodie Freight LLC"
                  value={companyName}
                  onChange={(e) => setCompanyName(e.target.value)}
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
                <Label>I am a</Label>
                <div className="grid grid-cols-3 gap-2">
                  {[
                    { value: 'broker', label: 'Freight Broker', icon: '📋' },
                    { value: 'carrier', label: 'Carrier / Fleet', icon: '🚛' },
                    { value: 'yard', label: 'Yard Manager', icon: '🏭' },
                  ].map((r) => (
                    <button
                      key={r.value}
                      type="button"
                      onClick={() => setRole(r.value)}
                      className={`p-3 rounded-lg border text-center transition-all ${
                        role === r.value
                          ? 'border-2 text-white'
                          : 'border-slate-200 text-slate-600 hover:bg-slate-50'
                      }`}
                      style={role === r.value ? { backgroundColor: '#1a3a5c', borderColor: '#1a3a5c' } : {}}
                    >
                      <div className="text-lg mb-1">{r.icon}</div>
                      <div className="text-xs font-medium">{r.label}</div>
                    </button>
                  ))}
                </div>
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
                {loading ? 'Joining waitlist...' : 'Join waitlist'}
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
