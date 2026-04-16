'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
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
  const router = useRouter()
  const [fullName, setFullName] = useState('')
  const [companyName, setCompanyName] = useState('')
  const [email, setEmail] = useState('')
  const [role, setRole] = useState('broker')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError('')

    try {
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

      const params = new URLSearchParams({
        name: fullName.trim(),
        email: email.trim(),
      })
      router.push(`/waitlist-confirmed?${params.toString()}`)
    } catch {
      setError('Something went wrong. Please try again.')
      setLoading(false)
    }
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
