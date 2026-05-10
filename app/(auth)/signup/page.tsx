'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardFooter, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import Link from 'next/link'

function formatE164(raw: string): string | null {
  const digits = raw.replace(/\D/g, '')
  if (digits.length === 10) return `+1${digits}`
  if (digits.length === 11 && digits.startsWith('1')) return `+${digits}`
  return null
}

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

type Step = 'phone' | 'otp'

export default function SignupPage() {
  const [step, setStep] = useState<Step>('phone')
  const [fullName, setFullName] = useState('')
  const [phone, setPhone] = useState('')
  const [otp, setOtp] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const supabase = createClient()

  async function handleSendCode(e: React.FormEvent) {
    e.preventDefault()
    setError('')

    const e164 = formatE164(phone)
    if (!e164) {
      setError('Enter a valid US phone number (e.g. 555-867-5309).')
      return
    }

    setLoading(true)
    const { error: otpError } = await supabase.auth.signInWithOtp({ phone: e164 })
    setLoading(false)

    if (otpError) {
      setError(otpError.message)
      return
    }

    setStep('otp')
  }

  async function handleVerify(e: React.FormEvent) {
    e.preventDefault()
    setError('')

    const e164 = formatE164(phone)
    if (!e164) {
      setError('Phone number invalid.')
      return
    }

    setLoading(true)
    const { error: verifyError } = await supabase.auth.verifyOtp({
      phone: e164,
      token: otp.trim(),
      type: 'sms',
    })

    if (verifyError) {
      setError(verifyError.message)
      setLoading(false)
      return
    }

    // Session is now active — persist full_name + phone to profiles
    const res = await fetch('/api/auth/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ full_name: fullName.trim(), phone_number: e164 }),
    })

    if (!res.ok) {
      setError('Account created but profile save failed. Continue to onboarding.')
    }

    window.location.href = '/onboarding'
  }

  function handleResend() {
    setStep('phone')
    setOtp('')
    setError('')
  }

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <Logo />

        <Card>
          {step === 'phone' ? (
            <>
              <CardHeader>
                <CardTitle className="text-xl">Create your account</CardTitle>
                <CardDescription>We&apos;ll send a verification code to your phone.</CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleSendCode} className="space-y-4">
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
                    <Label htmlFor="phone">Phone number</Label>
                    <Input
                      id="phone"
                      type="tel"
                      placeholder="(555) 867-5309"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      required
                    />
                    <p className="text-xs text-slate-400">US numbers only. Standard SMS rates apply.</p>
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
                    {loading ? 'Sending code…' : 'Send verification code'}
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
            </>
          ) : (
            <>
              <CardHeader>
                <CardTitle className="text-xl">Enter your code</CardTitle>
                <CardDescription>
                  Sent to {formatE164(phone) ?? phone}. Check your messages.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleVerify} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="otp">6-digit code</Label>
                    <Input
                      id="otp"
                      type="text"
                      inputMode="numeric"
                      placeholder="123456"
                      maxLength={6}
                      value={otp}
                      onChange={(e) => setOtp(e.target.value.replace(/\D/g, ''))}
                      required
                      autoFocus
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
                    disabled={loading || otp.length < 6}
                  >
                    {loading ? 'Verifying…' : 'Verify & create account'}
                  </Button>
                </form>
              </CardContent>
              <CardFooter className="justify-center">
                <p className="text-sm text-slate-500">
                  Wrong number or didn&apos;t get it?{' '}
                  <button
                    type="button"
                    onClick={handleResend}
                    className="font-medium underline underline-offset-2"
                    style={{ color: '#1a3a5c' }}
                  >
                    Go back
                  </button>
                </p>
              </CardFooter>
            </>
          )}
        </Card>
      </div>
    </div>
  )
}
