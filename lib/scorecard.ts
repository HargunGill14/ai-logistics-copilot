export interface ScorecardMetrics {
  total_bids: number
  accepted_bids: number
  on_time_pickups: number
  on_time_deliveries: number
  total_loads_completed: number
}

export type Grade = 'A' | 'B' | 'C' | 'D' | 'N/A'

export interface Scorecard {
  grade: Grade
  winRate: number | null      // null when no bids yet
  onTimeRate: number | null   // null when no completed loads yet
  totalLoads: number
}

export function calculateScorecard(metrics: ScorecardMetrics): Scorecard {
  const winRate =
    metrics.total_bids > 0 ? metrics.accepted_bids / metrics.total_bids : null

  const onTimeRate =
    metrics.total_loads_completed > 0
      ? (metrics.on_time_pickups + metrics.on_time_deliveries) /
        (metrics.total_loads_completed * 2)
      : null

  const rates = ([winRate, onTimeRate] as (number | null)[]).filter(
    (r): r is number => r !== null,
  )
  const combined = rates.length > 0 ? rates.reduce((s, r) => s + r, 0) / rates.length : null

  let grade: Grade = 'N/A'
  if (combined !== null) {
    if (combined >= 0.75) grade = 'A'
    else if (combined >= 0.55) grade = 'B'
    else if (combined >= 0.35) grade = 'C'
    else grade = 'D'
  }

  return { grade, winRate, onTimeRate, totalLoads: metrics.total_loads_completed }
}
