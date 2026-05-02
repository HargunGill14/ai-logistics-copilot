'use client'

import { useEffect, useRef, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import type { CarrierVerification, AiVerdict, DocumentType } from '@/types'
import { TrustBadge } from '@/components/marketplace/TrustBadge'
import { Upload, CheckCircle, AlertCircle, Shield, FileText } from 'lucide-react'

const documentTypes: { type: DocumentType; label: string; description: string }[] = [
  {
    type: 'insurance_cert',
    label: 'Insurance Certificate',
    description: 'Certificate of liability insurance',
  },
  {
    type: 'mc_authority',
    label: 'MC Authority',
    description: 'Motor carrier operating authority',
  },
  { type: 'w9', label: 'W-9 Form', description: 'Tax identification form' },
  {
    type: 'void_check',
    label: 'Void Check',
    description: 'For payment routing',
  },
]

interface DocumentUploadResult {
  verdict: AiVerdict
  flags: string[]
}

interface DocumentState {
  uploading: boolean
  result: DocumentUploadResult | null
  error: string
}

function verdictStyle(verdict: AiVerdict) {
  if (verdict === 'valid') return 'bg-green-100 text-green-700'
  if (verdict === 'review') return 'bg-amber-100 text-amber-700'
  return 'bg-red-100 text-red-700'
}

export default function CarrierVerifyPage() {
  const supabase = createClient()

  const [existing, setExisting] = useState<CarrierVerification | null>(null)
  const [loadingExisting, setLoadingExisting] = useState(true)

  // FMCSA form
  const [usdot, setUsdot] = useState('')
  const [mc, setMc] = useState('')
  const [verifying, setVerifying] = useState(false)
  const [verifyError, setVerifyError] = useState('')
  const [verifyResult, setVerifyResult] = useState<CarrierVerification | null>(null)

  // Documents
  const [docStates, setDocStates] = useState<Record<DocumentType, DocumentState>>({
    insurance_cert: { uploading: false, result: null, error: '' },
    mc_authority: { uploading: false, result: null, error: '' },
    w9: { uploading: false, result: null, error: '' },
    void_check: { uploading: false, result: null, error: '' },
  })

  const fileRefs = useRef<Record<DocumentType, HTMLInputElement | null>>({
    insurance_cert: null,
    mc_authority: null,
    w9: null,
    void_check: null,
  })

  useEffect(() => {
    async function fetchExisting() {
      try {
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) return

        const { data } = await supabase
          .from('carrier_verifications')
          .select('*')
          .eq('carrier_id', user.id)
          .single()

        if (data) setExisting(data as CarrierVerification)
      } finally {
        setLoadingExisting(false)
      }
    }
    fetchExisting()
  }, [supabase])

  async function handleVerify(e: React.FormEvent) {
    e.preventDefault()
    if (!usdot.trim() && !mc.trim()) {
      setVerifyError('Provide at least one: USDOT number or MC number.')
      return
    }
    setVerifying(true)
    setVerifyError('')
    setVerifyResult(null)

    try {
      const payload: Record<string, string> = {}
      if (usdot.trim()) payload.usdot_number = usdot.trim()
      if (mc.trim()) payload.mc_number = mc.trim()

      const res = await fetch('/api/carriers/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })
      const json = await res.json()
      if (!res.ok) throw new Error(json.error ?? 'Verification failed')

      setVerifyResult(json as CarrierVerification)
      setExisting(json as CarrierVerification)
    } catch (err) {
      setVerifyError(err instanceof Error ? err.message : 'Verification failed')
    } finally {
      setVerifying(false)
    }
  }

  async function handleDocumentUpload(type: DocumentType, file: File) {
    setDocStates((prev) => ({
      ...prev,
      [type]: { uploading: true, result: null, error: '' },
    }))

    try {
      if (file.size > 10 * 1024 * 1024) {
        throw new Error('File exceeds 10 MB limit')
      }

      const formData = new FormData()
      formData.append('file', file)
      formData.append('document_type', type)

      const res = await fetch('/api/carriers/documents', {
        method: 'POST',
        body: formData,
      })
      const json = await res.json()
      if (!res.ok) throw new Error(json.error ?? 'Upload failed')

      setDocStates((prev) => ({
        ...prev,
        [type]: { uploading: false, result: json as DocumentUploadResult, error: '' },
      }))
    } catch (err) {
      setDocStates((prev) => ({
        ...prev,
        [type]: {
          uploading: false,
          result: null,
          error: err instanceof Error ? err.message : 'Upload failed',
        },
      }))
    } finally {
      // Reset file input so the same file can be re-uploaded
      const input = fileRefs.current[type]
      if (input) input.value = ''
    }
  }

  const displayVerification = verifyResult ?? existing

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-xl font-semibold text-slate-900">Carrier Verification</h1>
        <p className="text-sm text-slate-500">
          Verify your credentials to unlock bidding on marketplace loads
        </p>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* FMCSA Verification */}
        <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="mb-5 flex items-center gap-2">
            <Shield size={18} className="text-[#1a3a5c]" />
            <h2 className="text-base font-semibold text-slate-900">FMCSA Verification</h2>
          </div>

          {/* Existing verification info */}
          {!loadingExisting && displayVerification && (
            <div className="mb-5 rounded-lg border border-slate-200 bg-slate-50 p-4">
              <div className="mb-3 flex items-center justify-between">
                <TrustBadge
                  trust_score={displayVerification.trust_score}
                  verification_status={displayVerification.verification_status}
                  size="lg"
                />
                <span
                  className={`rounded-full px-2.5 py-0.5 text-xs font-medium capitalize ${
                    displayVerification.verification_status === 'verified'
                      ? 'bg-green-100 text-green-700'
                      : displayVerification.verification_status === 'flagged'
                        ? 'bg-amber-100 text-amber-700'
                        : displayVerification.verification_status === 'rejected'
                          ? 'bg-red-100 text-red-700'
                          : 'bg-slate-100 text-slate-600'
                  }`}
                >
                  {displayVerification.verification_status}
                </span>
              </div>

              {displayVerification.legal_name && (
                <p className="mb-2 text-sm font-medium text-slate-900">
                  {displayVerification.legal_name}
                </p>
              )}

              {displayVerification.risk_flags.length > 0 && (
                <div className="mb-2 flex flex-wrap gap-1.5">
                  {displayVerification.risk_flags.map((flag) => (
                    <span
                      key={flag}
                      className="rounded-full bg-red-100 px-2 py-0.5 text-xs font-medium text-red-700"
                    >
                      {flag.replace(/_/g, ' ')}
                    </span>
                  ))}
                </div>
              )}

              {displayVerification.last_verified_at && (
                <p className="text-xs text-slate-500">
                  Last verified:{' '}
                  {new Date(displayVerification.last_verified_at).toLocaleDateString('en-US', {
                    month: 'long',
                    day: 'numeric',
                    year: 'numeric',
                  })}
                </p>
              )}
            </div>
          )}

          <form onSubmit={handleVerify} className="space-y-4">
            <div>
              <label className="mb-1 block text-sm font-medium text-slate-700">
                USDOT Number
              </label>
              <input
                type="text"
                placeholder="e.g. 1234567"
                value={usdot}
                onChange={(e) => setUsdot(e.target.value)}
                className="w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-900 placeholder:text-slate-400 focus:border-[#1a3a5c]/40 focus:outline-none focus:ring-2 focus:ring-[#1a3a5c]/10"
              />
            </div>

            <div>
              <label className="mb-1 block text-sm font-medium text-slate-700">MC Number</label>
              <input
                type="text"
                placeholder="e.g. MC-123456"
                value={mc}
                onChange={(e) => setMc(e.target.value)}
                className="w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-900 placeholder:text-slate-400 focus:border-[#1a3a5c]/40 focus:outline-none focus:ring-2 focus:ring-[#1a3a5c]/10"
              />
            </div>

            <p className="text-xs text-slate-500">Provide at least one identifier above.</p>

            {verifyError && (
              <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600">
                {verifyError}
              </div>
            )}

            <button
              type="submit"
              disabled={verifying}
              className="w-full rounded-lg bg-[#1a3a5c] px-4 py-2.5 text-sm font-medium text-white shadow-sm transition-colors hover:bg-[#1a3a5c]/90 disabled:opacity-50"
            >
              {verifying ? 'Verifying…' : existing ? 'Re-verify' : 'Verify via FMCSA'}
            </button>
          </form>
        </div>

        {/* Compliance Documents */}
        <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="mb-5 flex items-center gap-2">
            <FileText size={18} className="text-[#1a3a5c]" />
            <h2 className="text-base font-semibold text-slate-900">Compliance Documents</h2>
          </div>

          <div className="space-y-4">
            {documentTypes.map(({ type, label, description }) => {
              const state = docStates[type]

              return (
                <div
                  key={type}
                  className="rounded-lg border border-slate-200 p-4"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <p className="text-sm font-medium text-slate-900">{label}</p>
                      <p className="text-xs text-slate-500">{description}</p>
                    </div>

                    <div className="ml-4 flex flex-col items-end gap-2">
                      <button
                        type="button"
                        disabled={state.uploading}
                        onClick={() => fileRefs.current[type]?.click()}
                        className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-medium text-slate-600 transition-colors hover:border-[#1a3a5c]/30 hover:bg-[#1a3a5c]/5 hover:text-[#1a3a5c] disabled:opacity-50"
                      >
                        <Upload size={13} />
                        {state.uploading ? 'Uploading…' : 'Upload'}
                      </button>
                      <p className="text-[10px] text-slate-400">Max 10 MB</p>
                    </div>

                    <input
                      ref={(el) => { fileRefs.current[type] = el }}
                      type="file"
                      accept=".pdf,.jpg,.jpeg,.png"
                      className="hidden"
                      onChange={(e) => {
                        const file = e.target.files?.[0]
                        if (file) handleDocumentUpload(type, file)
                      }}
                    />
                  </div>

                  {state.error && (
                    <div className="mt-2 flex items-center gap-1.5 text-xs text-red-600">
                      <AlertCircle size={12} />
                      {state.error}
                    </div>
                  )}

                  {state.result && (
                    <div className="mt-3 flex flex-wrap items-center gap-2">
                      <span
                        className={`rounded-full px-2.5 py-0.5 text-xs font-medium capitalize ${verdictStyle(
                          state.result.verdict,
                        )}`}
                      >
                        {state.result.verdict === 'valid' && (
                          <CheckCircle size={10} className="mr-1 inline" />
                        )}
                        {state.result.verdict}
                      </span>
                      {state.result.flags.map((flag) => (
                        <span
                          key={flag}
                          className="rounded-full bg-red-100 px-2 py-0.5 text-xs text-red-600"
                        >
                          {flag}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        </div>
      </div>
    </div>
  )
}
