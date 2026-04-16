'use client'

import { useEffect, useMemo, useState } from 'react'

interface CountUpProps {
  value: number
  durationMs?: number
  prefix?: string
  suffix?: string
  decimals?: number
}

export function CountUp({
  value,
  durationMs = 900,
  prefix = '',
  suffix = '',
  decimals,
}: CountUpProps) {
  const [display, setDisplay] = useState(0)

  const formatter = useMemo(() => {
    const d = typeof decimals === 'number' ? decimals : 0
    return (v: number) => {
      const fixed = v.toFixed(d)
      const parts = fixed.split('.')
      const whole = Number(parts[0] ?? 0).toLocaleString()
      const frac = parts[1]
      return `${prefix}${d > 0 ? `${whole}.${frac}` : whole}${suffix}`
    }
  }, [decimals, prefix, suffix])

  useEffect(() => {
    let raf = 0
    const start = performance.now()
    const from = 0
    const to = Number.isFinite(value) ? value : 0

    function tick(now: number) {
      const t = Math.min(1, (now - start) / durationMs)
      const eased = 1 - Math.pow(1 - t, 3)
      setDisplay(from + (to - from) * eased)
      if (t < 1) raf = requestAnimationFrame(tick)
    }

    raf = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(raf)
  }, [durationMs, value])

  return <>{formatter(display)}</>
}

