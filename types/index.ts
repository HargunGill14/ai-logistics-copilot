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
  role: string | null
  is_admin: boolean
  onboarding_complete: boolean
  company_name: string | null
  phone_number: string | null
  stripe_customer_id: string | null
  stripe_subscription_id: string | null
  subscription_status: 'free' | 'active' | 'past_due' | 'cancelled'
  subscription_plan: 'broker_monthly' | 'carrier_monthly' | null
  plan_period_end: string | null
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

export type EquipmentType = 'dry_van' | 'reefer' | 'flatbed' | 'step_deck' | 'power_only' | 'tanker'
export type MarketplaceLoadStatus =
  | 'posted'
  | 'covered'
  | 'in_transit'
  | 'delivered'
  | 'cancelled'
  | 'expired'
export type BidStatus = 'pending' | 'accepted' | 'rejected' | 'withdrawn'

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
  equipment_type: EquipmentType
  weight_lbs: number | null
  commodity: string | null
  target_rate: number
  max_rate: number | null
  bid_deadline: string | null
  status: MarketplaceLoadStatus
  auto_award: boolean
  posted_at: string
  covered_at: string | null
  dat_load_id: string | null
  dat_posted_at: string | null
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
  status: BidStatus
  submitted_at: string
  responded_at: string | null
}

export type VerificationStatus = 'pending' | 'verified' | 'flagged' | 'rejected'
export type TrustBadgeLevel = 'verified' | 'caution' | 'unverified'
export type DocumentType = 'insurance_cert' | 'mc_authority' | 'w9' | 'void_check'
export type AiVerdict = 'valid' | 'invalid' | 'review'

export interface CarrierVerification {
  id: string
  carrier_id: string
  usdot_number: string | null
  mc_number: string | null
  legal_name: string | null
  operating_status: string | null
  safety_rating: string | null
  insurance_on_file: boolean | null
  cargo_insurance: boolean | null
  authority_age_days: number | null
  trust_score: number
  risk_flags: string[]
  verification_status: VerificationStatus
  last_verified_at: string | null
  next_verify_at: string
  created_at: string
}

export interface VerificationDocument {
  id: string
  carrier_id: string
  document_type: DocumentType
  storage_path: string
  file_name: string
  file_size_kb: number | null
  ai_verdict: AiVerdict | null
  ai_flags: string[]
  ai_confidence: number | null
  analyzed_at: string | null
  uploaded_at: string
}

export type TrackingStatus =
  | 'not_started'
  | 'en_route_pickup'
  | 'at_pickup'
  | 'loaded'
  | 'en_route_delivery'
  | 'at_delivery'
  | 'delivered'

export interface ShipmentTracking {
  id: string
  load_id: string
  tracking_token: string
  driver_name: string
  driver_phone: string
  carrier_id: string | null
  status: TrackingStatus
  current_lat: number | null
  current_lng: number | null
  last_ping_at: string | null
  origin_lat: number | null
  origin_lng: number | null
  destination_lat: number | null
  destination_lng: number | null
  yard_lat: number | null
  yard_lng: number | null
  is_active: boolean
  created_at: string
}

export interface LocationPing {
  id: string
  tracking_id: string
  lat: number
  lng: number
  speed_mph: number | null
  recorded_at: string
}

export interface FinancialSummary {
  totalRevenueMTD: number
  totalLoadsCoveredMTD: number
  avgMarginPerLoad: number
  projectedMonthlyRevenue: number
}

export interface MarginRow {
  id: string
  origin: string
  destination: string
  pickupDate: string
  targetRate: number
  acceptedBid: number
  marginDollar: number
  marginPercent: number
}

export interface MonthlyRevenue {
  month: string
  revenue: number
}

export interface CarrierMarginStat {
  carrierId: string
  carrierName: string
  loadsWorked: number
  avgMarginDollar: number
  avgMarginPercent: number
}
