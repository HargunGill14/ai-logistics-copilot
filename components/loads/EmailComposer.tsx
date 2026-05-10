'use client'

import { useState } from 'react'
import { CheckCircle2, Link2, Mail, Send, Wand2 } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import type {
  EmailDraftResponse,
  EmailSendResponse,
  EmailType,
  GmailConnectionStatus,
} from '@/types'

interface EmailComposerProps {
  loadId: string
  gmail: GmailConnectionStatus
}

interface ApiErrorResponse {
  error?: string
}

const emailTypeOptions: Array<{ value: EmailType; label: string }> = [
  { value: 'carrier_outreach', label: 'Carrier outreach' },
  { value: 'rate_confirmation', label: 'Rate confirmation' },
  { value: 'load_tender', label: 'Load tender' },
]

export function EmailComposer({ loadId, gmail }: EmailComposerProps) {
  const [emailType, setEmailType] = useState<EmailType>('carrier_outreach')
  const [recipient, setRecipient] = useState('')
  const [subject, setSubject] = useState('')
  const [body, setBody] = useState('')
  const [notes, setNotes] = useState('')
  const [drafting, setDrafting] = useState(false)
  const [sending, setSending] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)

  const connectHref = `/api/integrations/gmail/connect?returnTo=${encodeURIComponent(`/loads/${loadId}`)}`

  async function handleDraft() {
    setDrafting(true)
    setError(null)
    setSuccess(null)

    try {
      const response = await fetch('/api/email/draft', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          loadId,
          emailType,
          recipient,
          notes: notes || undefined,
        }),
      })
      const json: unknown = await response.json()

      if (!response.ok) {
        setError(getApiError(json, 'Failed to generate draft'))
        return
      }

      const draft = json as EmailDraftResponse
      setSubject(draft.subject)
      setBody(draft.body)
      setSuccess('Draft generated')
    } catch {
      setError('Failed to generate draft')
    } finally {
      setDrafting(false)
    }
  }

  async function handleSend() {
    setSending(true)
    setError(null)
    setSuccess(null)

    try {
      const response = await fetch('/api/email/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          loadId,
          emailType,
          recipient,
          subject,
          body,
        }),
      })
      const json: unknown = await response.json()

      if (!response.ok) {
        setError(getApiError(json, 'Failed to send email'))
        return
      }

      const result = json as EmailSendResponse
      setSuccess(result.success ? 'Email sent' : 'Email queued')
    } catch {
      setError('Failed to send email')
    } finally {
      setSending(false)
    }
  }

  return (
    <section className="mb-6 overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
      <div className="flex flex-col gap-3 border-b border-slate-100 px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="flex items-center gap-2">
            <Mail size={16} className="text-[#1a3a5c]" />
            <h2 className="text-sm font-semibold text-slate-900">Email Composer</h2>
          </div>
          <p className="mt-0.5 text-xs text-slate-500">
            Draft, edit, and send freight emails from Gmail.
          </p>
        </div>
        <GmailStatus gmail={gmail} connectHref={connectHref} />
      </div>

      <div className="grid gap-4 p-5 lg:grid-cols-[minmax(0,1fr)_220px]">
        <div className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label htmlFor="email-type" className="text-xs text-slate-600">
                Email type
              </Label>
              <select
                id="email-type"
                value={emailType}
                onChange={(event) => setEmailType(event.target.value as EmailType)}
                className="h-9 w-full rounded-lg border border-slate-200 bg-slate-50 px-3 text-sm text-slate-900 outline-none focus:border-[#0d9488] focus:ring-2 focus:ring-[#0d9488]/15"
              >
                {emailTypeOptions.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="recipient" className="text-xs text-slate-600">
                Recipient
              </Label>
              <Input
                id="recipient"
                type="email"
                value={recipient}
                onChange={(event) => setRecipient(event.target.value)}
                placeholder="dispatcher@example.com"
                className="rounded-lg border-slate-200 bg-slate-50 focus-visible:border-[#0d9488] focus-visible:ring-[#0d9488]/15"
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="subject" className="text-xs text-slate-600">
              Subject
            </Label>
            <Input
              id="subject"
              value={subject}
              onChange={(event) => setSubject(event.target.value)}
              placeholder="Load details"
              className="rounded-lg border-slate-200 bg-slate-50 focus-visible:border-[#0d9488] focus-visible:ring-[#0d9488]/15"
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="body" className="text-xs text-slate-600">
              Body
            </Label>
            <textarea
              id="body"
              value={body}
              onChange={(event) => setBody(event.target.value)}
              rows={10}
              className="w-full resize-none rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-900 outline-none focus:border-[#0d9488] focus:ring-2 focus:ring-[#0d9488]/15"
              placeholder="Email body"
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="notes" className="text-xs text-slate-600">
              AI notes
            </Label>
            <textarea
              id="notes"
              value={notes}
              onChange={(event) => setNotes(event.target.value)}
              rows={2}
              className="w-full resize-none rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-900 outline-none focus:border-[#0d9488] focus:ring-2 focus:ring-[#0d9488]/15"
              placeholder="Rate target, tone, accessorials"
            />
          </div>
        </div>

        <div className="flex flex-col gap-3">
          <Button
            type="button"
            onClick={handleDraft}
            disabled={drafting}
            className="rounded-lg bg-[#0d9488] text-white hover:bg-[#0d9488]/90"
          >
            <Wand2 size={16} />
            {drafting ? 'Drafting...' : 'AI Draft'}
          </Button>
          <Button
            type="button"
            onClick={handleSend}
            disabled={sending || !gmail.connected || !recipient || !subject || !body}
            className="rounded-lg bg-[#1a3a5c] text-white hover:bg-[#1a3a5c]/90"
          >
            <Send size={16} />
            {sending ? 'Sending...' : 'Send'}
          </Button>

          {error && (
            <div className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-700">
              {error}
            </div>
          )}

          {success && (
            <div className="rounded-lg border border-green-200 bg-green-50 px-3 py-2 text-xs text-green-700">
              {success}
            </div>
          )}
        </div>
      </div>
    </section>
  )
}

function GmailStatus({
  gmail,
  connectHref,
}: {
  gmail: GmailConnectionStatus
  connectHref: string
}) {
  if (gmail.connected) {
    return (
      <Badge variant="outline" className="border-green-200 bg-green-50 text-green-700">
        <CheckCircle2 size={13} />
        {gmail.email}
      </Badge>
    )
  }

  return (
    <Button asChild variant="outline" size="sm" className="rounded-lg border-slate-200">
      <a href={connectHref}>
        <Link2 size={15} />
        Connect Gmail
      </a>
    </Button>
  )
}

function getApiError(json: unknown, fallback: string): string {
  if (isApiErrorResponse(json) && json.error) {
    return json.error
  }

  return fallback
}

function isApiErrorResponse(value: unknown): value is ApiErrorResponse {
  return typeof value === 'object' && value !== null && 'error' in value
}
