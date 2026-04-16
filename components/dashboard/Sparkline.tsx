'use client'

import { useMemo } from 'react'

interface SparklineProps {
  values: number[]
  className?: string
}

export function Sparkline({ values, className }: SparklineProps) {
  const path = useMemo(() => {
    const safe = values.filter((v) => Number.isFinite(v))
    if (safe.length < 2) return ''
    const min = Math.min(...safe)
    const max = Math.max(...safe)
    const range = max - min || 1

    const w = 120
    const h = 32
    const step = w / (safe.length - 1)

    return safe
      .map((v, i) => {
        const x = i * step
        const y = h - ((v - min) / range) * h
        return `${i === 0 ? 'M' : 'L'} ${x.toFixed(2)} ${y.toFixed(2)}`
      })
      .join(' ')
  }, [values])

  return (
    <svg
      viewBox="0 0 120 32"
      className={className}
      aria-hidden="true"
      focusable="false"
    >
      {path ? (
        <path
          d={path}
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      ) : null}
    </svg>
  )
}

