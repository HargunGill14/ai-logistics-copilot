import { calculateScorecard, type Grade, type ScorecardMetrics } from '@/lib/scorecard'

const gradeStyles: Record<Grade, string> = {
  A: 'bg-green-100 text-green-700 border-green-200',
  B: 'bg-blue-100 text-blue-700 border-blue-200',
  C: 'bg-amber-100 text-amber-700 border-amber-200',
  D: 'bg-red-100 text-red-700 border-red-200',
  'N/A': 'bg-slate-100 text-slate-500 border-slate-200',
}

interface ScorecardBadgeProps {
  metrics: ScorecardMetrics
  size?: 'sm' | 'md'
}

function pct(rate: number | null): string {
  return rate === null ? '—' : `${Math.round(rate * 100)}%`
}

export function ScorecardBadge({ metrics, size = 'sm' }: ScorecardBadgeProps) {
  const { grade, winRate, onTimeRate, totalLoads } = calculateScorecard(metrics)

  if (size === 'sm') {
    return (
      <span
        title={`Grade ${grade} · Win rate ${pct(winRate)} · On-time ${pct(onTimeRate)}`}
        className={`inline-flex items-center rounded-full border px-2 py-0.5 text-xs font-bold ${gradeStyles[grade]}`}
      >
        {grade}
      </span>
    )
  }

  return (
    <div className="rounded-xl border border-slate-200 bg-white p-4">
      <div className="mb-3 flex items-center gap-3">
        <span
          className={`flex h-10 w-10 items-center justify-center rounded-full border-2 text-base font-black ${gradeStyles[grade]}`}
        >
          {grade}
        </span>
        <div>
          <p className="text-sm font-semibold text-slate-900">Performance Score</p>
          <p className="text-xs text-slate-500">{totalLoads} load{totalLoads !== 1 ? 's' : ''} completed</p>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div className="rounded-lg bg-slate-50 px-3 py-2">
          <p className="text-xs text-slate-500">Win Rate</p>
          <p className="text-base font-bold text-slate-900">{pct(winRate)}</p>
          {metrics.total_bids > 0 && (
            <p className="text-xs text-slate-400">
              {metrics.accepted_bids}/{metrics.total_bids} bids
            </p>
          )}
        </div>
        <div className="rounded-lg bg-slate-50 px-3 py-2">
          <p className="text-xs text-slate-500">On-Time</p>
          <p className="text-base font-bold text-slate-900">{pct(onTimeRate)}</p>
          {totalLoads > 0 && (
            <p className="text-xs text-slate-400">{totalLoads} completed</p>
          )}
        </div>
      </div>
    </div>
  )
}
