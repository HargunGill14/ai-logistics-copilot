export interface Organization {
  id: string
  name: string
  created_at: string
}

export interface Profile {
  id: string
  organization_id: string
  full_name: string
  email: string
  role: string
  is_admin: boolean
  created_at: string
}

export interface Load {
  id: string
  organization_id: string
  created_by: string
  pickup_location: string
  delivery_location: string
  distance_miles: number
  load_type: 'dry_van' | 'reefer' | 'flatbed' | 'step_deck'
  weight_lbs: number
  shipper_rate: number
  carrier_cost?: number
  suggested_rate?: number
  margin_amount?: number
  margin_percentage?: number
  risk_level?: 'low' | 'medium' | 'high'
  ai_recommendation?: string
  status: 'draft' | 'pricing' | 'negotiating' | 'active' | 'completed'
  created_at: string
  updated_at: string
}

export interface Negotiation {
  id: string
  load_id: string
  organization_id: string
  shipper_email?: string
  carrier_message?: string
  counteroffer_price?: number
  status: 'pending' | 'awaiting_reply' | 'accepted' | 'rejected'
  created_at: string
}

export interface Notification {
  id: string
  organization_id: string
  user_id: string
  title: string
  description: string
  type: 'margin_alert' | 'carrier_update' | 'shipper_reply' | 'system'
  read: boolean
  load_id?: string
  created_at: string
}

export interface PricingResult {
  carrier_cost: number
  suggested_rate: number
  margin_amount: number
  margin_percentage: number
  risk_level: 'low' | 'medium' | 'high'
  market_rate_per_mile: number
  risk_factors: string[]
  recommendation: string
}

export interface NegotiationResult {
  shipper_email: string
  carrier_message: string
  counteroffer_price: number
  counteroffer_margin: number
}