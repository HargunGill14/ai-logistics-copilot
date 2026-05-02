'use client'

import { useEffect, useRef, useState } from 'react'
import { useParams } from 'next/navigation'

type TrackingState = 'idle' | 'tracking' | 'done' | 'error'

export default function DriverTrackingPage() {
  const params = useParams()
  const token = params.token as string
  const [state, setState] = useState<TrackingState>('idle')
  const [errorMsg, setErrorMsg] = useState('')
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null)

  useEffect(() => {
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current)
    }
  }, [])

  async function sendPing() {
    try {
      const position = await new Promise<GeolocationPosition>((resolve, reject) => {
        navigator.geolocation.getCurrentPosition(resolve, reject, {
          enableHighAccuracy: true,
          timeout: 10000,
        })
      })

      const speed_mph = position.coords.speed != null
        ? position.coords.speed * 2.237
        : undefined

      const res = await fetch('/api/tracking/ping', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          token,
          lat: position.coords.latitude,
          lng: position.coords.longitude,
          speed: speed_mph,
        }),
      })

      const data = await res.json()

      if (!res.ok) {
        throw new Error(data.error ?? 'Ping failed')
      }

      if (data.status === 'delivered') {
        if (intervalRef.current) clearInterval(intervalRef.current)
        setState('done')
      }
    } catch (err) {
      console.error('Ping error:', err)
    }
  }

  function startTracking() {
    if (!navigator.geolocation) {
      setErrorMsg('Geolocation is not supported on this device.')
      setState('error')
      return
    }

    setState('tracking')
    sendPing()
    intervalRef.current = setInterval(sendPing, 5 * 60 * 1000)
  }

  const styles = {
    page: {
      minHeight: '100vh',
      backgroundColor: '#0f1f35',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
      padding: '24px',
    } as React.CSSProperties,
    card: {
      backgroundColor: '#1a3a5c',
      borderRadius: '16px',
      padding: '40px 32px',
      maxWidth: '400px',
      width: '100%',
      textAlign: 'center' as const,
      boxShadow: '0 8px 32px rgba(0,0,0,0.4)',
    } as React.CSSProperties,
    logo: {
      fontSize: '22px',
      fontWeight: '700',
      color: '#60a5fa',
      marginBottom: '8px',
      letterSpacing: '-0.5px',
    } as React.CSSProperties,
    subtitle: {
      fontSize: '13px',
      color: '#94a3b8',
      marginBottom: '32px',
    } as React.CSSProperties,
    liveIndicator: {
      display: 'inline-flex',
      alignItems: 'center',
      gap: '8px',
      backgroundColor: 'rgba(34,197,94,0.15)',
      border: '1px solid rgba(34,197,94,0.4)',
      borderRadius: '999px',
      padding: '8px 20px',
      color: '#4ade80',
      fontSize: '15px',
      fontWeight: '600',
      marginBottom: '16px',
    } as React.CSSProperties,
    dot: {
      width: '10px',
      height: '10px',
      borderRadius: '50%',
      backgroundColor: '#4ade80',
      animation: 'pulse 1.5s infinite',
    } as React.CSSProperties,
    liveText: {
      fontSize: '14px',
      color: '#94a3b8',
      marginTop: '8px',
    } as React.CSSProperties,
    button: {
      backgroundColor: '#2563eb',
      color: '#fff',
      border: 'none',
      borderRadius: '12px',
      padding: '16px 32px',
      fontSize: '16px',
      fontWeight: '600',
      cursor: 'pointer',
      width: '100%',
      transition: 'background-color 0.2s',
    } as React.CSSProperties,
    successIcon: {
      fontSize: '56px',
      marginBottom: '16px',
    } as React.CSSProperties,
    successTitle: {
      fontSize: '22px',
      fontWeight: '700',
      color: '#4ade80',
      marginBottom: '8px',
    } as React.CSSProperties,
    successText: {
      fontSize: '14px',
      color: '#94a3b8',
    } as React.CSSProperties,
    errorTitle: {
      fontSize: '20px',
      fontWeight: '700',
      color: '#f87171',
      marginBottom: '8px',
    } as React.CSSProperties,
    errorText: {
      fontSize: '14px',
      color: '#94a3b8',
    } as React.CSSProperties,
  }

  return (
    <>
      <style>{`
        @keyframes pulse {
          0%, 100% { opacity: 1; transform: scale(1); }
          50% { opacity: 0.5; transform: scale(1.3); }
        }
      `}</style>
      <div style={styles.page}>
        <div style={styles.card}>
          <div style={styles.logo}>FreTraq</div>
          <div style={styles.subtitle}>Driver Location Sharing</div>

          {state === 'idle' && (
            <button style={styles.button} onClick={startTracking}>
              Start Sharing Location
            </button>
          )}

          {state === 'tracking' && (
            <>
              <div style={styles.liveIndicator}>
                <span style={styles.dot} />
                Live
              </div>
              <p style={styles.liveText}>
                Your location is being shared with your dispatcher.
                <br />Updates every 5 minutes.
              </p>
            </>
          )}

          {state === 'done' && (
            <>
              <div style={styles.successIcon}>✓</div>
              <div style={styles.successTitle}>Delivery Confirmed</div>
              <p style={styles.successText}>
                You have arrived at the destination. Location sharing has stopped.
              </p>
            </>
          )}

          {state === 'error' && (
            <>
              <div style={styles.errorTitle}>Something went wrong</div>
              <p style={styles.errorText}>{errorMsg}</p>
            </>
          )}
        </div>
      </div>
    </>
  )
}
