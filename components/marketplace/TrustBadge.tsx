import { Shield } from 'lucide-react'
import type { VerificationStatus } from '@/types'

interface TrustBadgeProps {
  trust_score: number
  verification_status: VerificationStatus
  size?: 'sm' | 'md' | 'lg'
}

export function TrustBadge({ trust_score, size = 'md' }: TrustBadgeProps) {
  const color = trust_score >= 70 ? '#22c55e' : trust_score >= 40 ? '#f59e0b' : '#ef4444'
  const label = trust_score >= 70 ? 'Verified' : trust_score >= 40 ? 'Caution' : 'Unverified'

  if (size === 'sm') {
    return (
      <Shield
        size={16}
        style={{ color, fill: color }}
        aria-label={`Trust: ${label}`}
      />
    )
  }

  if (size === 'md') {
    return (
      <span className="inline-flex items-center gap-1.5">
        <Shield size={16} style={{ color, fill: color }} />
        <span className="text-xs font-semibold tabular-nums" style={{ color }}>
          {trust_score}
        </span>
      </span>
    )
  }

  return (
    <span className="inline-flex items-center gap-2">
      <Shield size={22} style={{ color, fill: color }} />
      <span className="text-2xl font-bold tabular-nums" style={{ color }}>
        {trust_score}
      </span>
      <span className="text-sm font-semibold" style={{ color }}>
        {label}
      </span>
    </span>
  )
}
