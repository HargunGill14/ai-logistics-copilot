import { createClient } from '@/lib/supabase/client'

export interface MarketplaceLoad {
  id: string
  load_id: string | null
  broker_id: string
  organization_id: string
  origin_city: string
  origin_state: string
  destination_city: string
  destination_state: string
  pickup_date: string
  delivery_date: string | null
  equipment_type: 'dry_van' | 'reefer' | 'flatbed' | 'step_deck' | 'power_only' | 'tanker'
  weight_lbs: number | null
  commodity: string | null
  target_rate: number
  max_rate: number | null
  bid_deadline: string | null
  status: 'posted' | 'covered' | 'in_transit' | 'delivered' | 'cancelled' | 'expired'
  auto_award: boolean
  posted_at: string
  covered_at: string | null
  created_at: string
}

export interface LoadBid {
  id: string
  marketplace_load_id: string
  carrier_id: string
  carrier_org_id: string
  bid_amount: number
  estimated_pickup: string | null
  notes: string | null
  status: 'pending' | 'accepted' | 'rejected' | 'withdrawn'
  submitted_at: string
  responded_at: string | null
}

export function subscribeToNewLoads(
  callback: (load: MarketplaceLoad) => void
): () => void {
  const supabase = createClient()

  const channel = supabase
    .channel('marketplace-loads')
    .on(
      'postgres_changes',
      {
        event: 'INSERT',
        schema: 'public',
        table: 'marketplace_loads',
        filter: 'status=eq.posted',
      },
      (payload) => {
        callback(payload.new as MarketplaceLoad)
      }
    )
    .subscribe()

  return () => {
    supabase.removeChannel(channel)
  }
}

export function subscribeToBids(
  loadId: string,
  callback: (bid: LoadBid) => void
): () => void {
  const supabase = createClient()

  const channel = supabase
    .channel(`load-bids-${loadId}`)
    .on(
      'postgres_changes',
      {
        event: 'INSERT',
        schema: 'public',
        table: 'load_bids',
        filter: `marketplace_load_id=eq.${loadId}`,
      },
      (payload) => {
        callback(payload.new as LoadBid)
      }
    )
    .subscribe()

  return () => {
    supabase.removeChannel(channel)
  }
}
