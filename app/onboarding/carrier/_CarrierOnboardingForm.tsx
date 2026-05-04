'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Loader2, ShieldCheck, AlertTriangle, ShieldAlert } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'

type VerifyResponse = {
  trust_score: number
  risk_flags: string[]
  verification_status: 'verified' | 'flagged' | 'pending' | 'rejected'
  error?: string
}

type FormState = 'idle' | 'verifying' | 'success' | 'error'

function TrustBadge({ score }: { score: number }) {
  if (score >= 80) {
    return (
      <div className="flex items-center gap-2 rounded-full bg-emerald-50 border border-emerald-200 px-4 py-2">
        <ShieldCheck size={18} className="text-emerald-600" />
        <span className="text-sm font-semibold text-emerald-700">Verified — Trust score {score}/100</span>
      </div>
    )
  }
  if (score >= 50) {
    return (
      <div className="flex items-center gap-2 rounded-full bg-amber-50 border border-amber-200 px-4 py-2">
        <AlertTriangle size={18} className="text-amber-600" />
        <span className="text-sm font-semibold text-amber-700">Caution — Trust score {score}/100</span>
      </div>
    )
  }
  return (
    <div className="flex items-center gap-2 rounded-full bg-red-50 border border-red-200 px-4 py-2">
      <ShieldAlert size={18} className="text-red-600" />
      <span className="text-sm font-semibold text-red-700">High Risk — Trust score {score}/100</span>
    </div>
  )
}

export function CarrierOnboardingForm() {
  const router = useRouter()
  const [usdot, setUsdot] = useState('')
  const [mc, setMc] = useState('')
  const [formState, setFormState] = useState<FormState>('idle')
  const [result, setResult] = useState<VerifyResponse | null>(null)
  const [error, setError] = useState<string | null>(null)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()

    if (!usdot.trim() && !mc.trim()) {
      setError('Enter your USDOT number or MC number — at least one is required.')
      return
    }

    setFormState('verifying')
    setError(null)

    try {
      const res = await fetch('/api/onboarding/carrier', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...(usdot.trim() ? { usdot_number: usdot.trim() } : {}),
          ...(mc.trim() ? { mc_number: mc.trim() } : {}),
        }),
      })

      const data: VerifyResponse = await res.json()

      if (!res.ok) {
        setError(data.error ?? 'Verification failed. Check your numbers and try again.')
        setFormState('error')
        return
      }

      setResult(data)
      setFormState('success')
    } catch {
      setError('Network error — please try again.')
      setFormState('error')
    }
  }

  if (formState === 'success' && result) {
    return (
      <Card className="max-w-md mx-auto">
        <CardContent className="pt-8 pb-8 text-center">
          <div className="flex justify-center mb-4">
            <TrustBadge score={result.trust_score} />
          </div>

          {result.risk_flags.length > 0 && (
            <div className="mb-5 text-left">
              <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-slate-500">
                Risk flags
              </p>
              <div className="flex flex-wrap gap-2">
                {result.risk_flags.map((flag) => (
                  <Badge key={flag} variant="outline" className="text-xs border-red-200 text-red-700">
                    {flag}
                  </Badge>
                ))}
              </div>
            </div>
          )}

          <p className="mb-6 text-sm text-slate-500">
            Your carrier profile is ready. You can now browse loads on the marketplace.
          </p>

          <Button
            className="w-full text-white"
            style={{ backgroundColor: '#1a3a5c' }}
            onClick={() => router.push('/carrier')}
          >
            Continue to dashboard
          </Button>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="max-w-md mx-auto">
      <CardHeader>
        <CardTitle className="text-lg">FMCSA credentials</CardTitle>
        <CardDescription>Enter your USDOT number, MC number, or both.</CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="usdot">USDOT number</Label>
            <Input
              id="usdot"
              type="text"
              placeholder="e.g. 3847291"
              value={usdot}
              onChange={(e) => setUsdot(e.target.value)}
              disabled={formState === 'verifying'}
              pattern="^\d{1,8}$"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="mc">MC number</Label>
            <Input
              id="mc"
              type="text"
              placeholder="e.g. 1234567"
              value={mc}
              onChange={(e) => setMc(e.target.value)}
              disabled={formState === 'verifying'}
              pattern="^\d{1,8}$"
            />
          </div>
          <p className="text-xs text-slate-400">At least one of the above is required.</p>

          {(error || formState === 'error') && (
            <div className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
              {error ?? 'Verification failed. Check your numbers and try again.'}
              {formState === 'error' && (
                <button
                  type="button"
                  className="ml-2 underline"
                  onClick={() => { setFormState('idle'); setError(null) }}
                >
                  Try again
                </button>
              )}
            </div>
          )}

          <Button
            type="submit"
            className="w-full text-white"
            style={{ backgroundColor: '#1a3a5c' }}
            disabled={formState === 'verifying'}
          >
            {formState === 'verifying' ? (
              <>
                <Loader2 size={15} className="animate-spin mr-2" />
                Verifying with FMCSA…
              </>
            ) : (
              'Verify and continue'
            )}
          </Button>
        </form>
      </CardContent>
    </Card>
  )
}
