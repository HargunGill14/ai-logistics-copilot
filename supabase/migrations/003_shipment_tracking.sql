-- Shipment tracking table
CREATE TABLE IF NOT EXISTS shipment_tracking (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  load_id uuid NOT NULL REFERENCES loads(id) ON DELETE CASCADE,
  tracking_token text UNIQUE NOT NULL DEFAULT replace(gen_random_uuid()::text || gen_random_uuid()::text, '-', ''),
  driver_name text NOT NULL,
  driver_phone text NOT NULL,
  carrier_id uuid REFERENCES profiles(id),
  status text NOT NULL DEFAULT 'not_started' CHECK (status IN (
    'not_started', 'en_route_pickup', 'at_pickup', 'loaded',
    'en_route_delivery', 'at_delivery', 'delivered'
  )),
  current_lat decimal(10, 7),
  current_lng decimal(10, 7),
  last_ping_at timestamptz,
  origin_lat decimal(10, 7),
  origin_lng decimal(10, 7),
  destination_lat decimal(10, 7),
  destination_lng decimal(10, 7),
  yard_lat decimal(10, 7),
  yard_lng decimal(10, 7),
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Location pings table
CREATE TABLE IF NOT EXISTS location_pings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tracking_id uuid NOT NULL REFERENCES shipment_tracking(id) ON DELETE CASCADE,
  lat decimal(10, 7) NOT NULL,
  lng decimal(10, 7) NOT NULL,
  speed_mph decimal(5, 2),
  recorded_at timestamptz NOT NULL DEFAULT now()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_shipment_tracking_token ON shipment_tracking(tracking_token) WHERE is_active = true;
CREATE INDEX IF NOT EXISTS idx_location_pings_tracking_recorded ON location_pings(tracking_id, recorded_at DESC);

-- RLS
ALTER TABLE shipment_tracking ENABLE ROW LEVEL SECURITY;
ALTER TABLE location_pings ENABLE ROW LEVEL SECURITY;

-- st_org_read: org members can SELECT their loads' tracking records
CREATE POLICY st_org_read ON shipment_tracking
  FOR SELECT
  USING (
    load_id IN (
      SELECT l.id FROM loads l
      JOIN profiles p ON p.organization_id = l.organization_id
      WHERE p.id = auth.uid()
    )
  );

-- lp_read: SELECT on location_pings where tracking_id exists in shipment_tracking visible to user
CREATE POLICY lp_read ON location_pings
  FOR SELECT
  USING (
    tracking_id IN (
      SELECT st.id FROM shipment_tracking st
      JOIN loads l ON l.id = st.load_id
      JOIN profiles p ON p.organization_id = l.organization_id
      WHERE p.id = auth.uid()
    )
  );
