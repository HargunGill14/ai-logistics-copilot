'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Check, X } from 'lucide-react'
import { Button } from '@/components/ui/button'

interface BidDecisionButtonsProps {
  loadId: string
  bidId: string
}

type BidAction = 'accept' | 'reject'

export function BidDecisionButtons({ loadId, bidId }: BidDecisionButtonsProps) {
  const router = useRouter()
  const [actionLoading, setActionLoading] = useState<BidAction | null>(null)
  const [error, setError] = useState<string | null>(null)

  async function handleAction(action: BidAction) {
    setActionLoading(action)
    setError(null)

    try {
      const response = await fetch(`/api/marketplace/loads/${loadId}/bids/${bidId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action }),
      })
      const json = (await response.json()) as { error?: string }

      if (!response.ok) {
        throw new Error(json.error ?? 'Failed to update bid')
      }

      router.refresh()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update bid')
    } finally {
      setActionLoading(null)
    }
  }

  return (
    <div className="space-y-2">
      <div className="flex flex-wrap gap-2">
        <Button
          type="button"
          size="sm"
          disabled={actionLoading !== null}
          onClick={() => handleAction('accept')}
          className="rounded-lg bg-green-600 text-white hover:bg-green-700"
        >
          <Check size={14} />
          {actionLoading === 'accept' ? 'Accepting' : 'Accept'}
        </Button>
        <Button
          type="button"
          size="sm"
          variant="outline"
          disabled={actionLoading !== null}
          onClick={() => handleAction('reject')}
          className="rounded-lg border-red-200 bg-red-50 text-red-700 hover:bg-red-100"
        >
          <X size={14} />
          {actionLoading === 'reject' ? 'Rejecting' : 'Reject'}
        </Button>
      </div>
      {error && <p className="text-xs text-red-600">{error}</p>}
    </div>
  )
}
