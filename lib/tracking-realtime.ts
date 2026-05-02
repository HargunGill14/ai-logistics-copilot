import { createClient } from '@/lib/supabase/client'
import type { ShipmentTracking } from '@/types'

export function subscribeToTracking(
  trackingId: string,
  callback: (tracking: ShipmentTracking) => void
): () => void {
  const supabase = createClient()

  const channel = supabase
    .channel(`shipment-tracking-${trackingId}`)
    .on(
      'postgres_changes',
      {
        event: 'UPDATE',
        schema: 'public',
        table: 'shipment_tracking',
        filter: `id=eq.${trackingId}`,
      },
      (payload) => {
        callback(payload.new as ShipmentTracking)
      }
    )
    .subscribe()

  return () => {
    supabase.removeChannel(channel)
  }
}
