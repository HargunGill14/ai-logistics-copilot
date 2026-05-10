'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { CheckCircle2, Send } from 'lucide-react'
import { Button } from '@/components/ui/button'

interface PostToDatButtonProps {
  loadId: string
  datLoadId: string | null
  datPostedAt: string | null
}

interface DatPostResponse {
  dat_load_id?: string
  dat_posted_at?: string
  error?: string
}

export function PostToDatButton({
  loadId,
  datLoadId,
  datPostedAt,
}: PostToDatButtonProps) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const isPosted = datLoadId !== null || datPostedAt !== null

  async function handlePost() {
    setLoading(true)
    setError(null)

    try {
      const response = await fetch('/api/dat/post', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ loadId }),
      })
      const json = (await response.json()) as DatPostResponse

      if (!response.ok) {
        throw new Error(json.error ?? 'Failed to post load to DAT')
      }

      router.refresh()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to post load to DAT')
    } finally {
      setLoading(false)
    }
  }

  if (isPosted) {
    return (
      <div className="flex flex-col items-start gap-1 sm:items-end">
        <Button
          type="button"
          disabled
          className="rounded-lg border-green-200 bg-green-50 text-green-700 opacity-100"
          variant="outline"
        >
          <CheckCircle2 size={16} />
          Posted to DAT
        </Button>
        {datPostedAt && (
          <p className="text-xs text-slate-500">
            {new Date(datPostedAt).toLocaleString('en-US', {
              month: 'short',
              day: 'numeric',
              hour: 'numeric',
              minute: '2-digit',
            })}
          </p>
        )}
      </div>
    )
  }

  return (
    <div className="flex flex-col items-start gap-1 sm:items-end">
      <Button
        type="button"
        disabled={loading}
        onClick={handlePost}
        className="rounded-lg bg-[#1a3a5c] text-white hover:bg-[#1a3a5c]/90"
      >
        <Send size={16} />
        {loading ? 'Posting...' : 'Post to DAT'}
      </Button>
      {error && <p className="max-w-56 text-xs text-red-600">{error}</p>}
    </div>
  )
}
