-- marketplace_loads table
CREATE TABLE IF NOT EXISTS marketplace_loads (
  id                  uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  load_id             uuid REFERENCES loads(id) ON DELETE SET NULL,
  broker_id           uuid NOT NULL REFERENCES profiles(id),
  organization_id     uuid NOT NULL REFERENCES organizations(id),
  origin_city         text NOT NULL,
  origin_state        char(2) NOT NULL,
  destination_city    text NOT NULL,
  destination_state   char(2) NOT NULL,
  pickup_date         timestamptz NOT NULL,
  delivery_date       timestamptz,
  equipment_type      text NOT NULL CHECK (equipment_type IN ('dry_van','reefer','flatbed','step_deck','power_only','tanker')),
  weight_lbs          integer CHECK (weight_lbs IS NULL OR (weight_lbs > 0 AND weight_lbs <= 80000)),
  commodity           text,
  target_rate         numeric(10,2) NOT NULL CHECK (target_rate > 0),
  max_rate            numeric(10,2) CHECK (max_rate IS NULL OR max_rate >= target_rate),
  bid_deadline        timestamptz,
  status              text NOT NULL DEFAULT 'posted' CHECK (status IN ('posted','covered','expired','cancelled')),
  auto_award          boolean NOT NULL DEFAULT false,
  posted_at           timestamptz NOT NULL DEFAULT now(),
  covered_at          timestamptz,
  created_at          timestamptz NOT NULL DEFAULT now()
);

-- load_bids table
CREATE TABLE IF NOT EXISTS load_bids (
  id                  uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  marketplace_load_id uuid NOT NULL REFERENCES marketplace_loads(id) ON DELETE CASCADE,
  carrier_id          uuid NOT NULL REFERENCES profiles(id),
  carrier_org_id      uuid NOT NULL REFERENCES organizations(id),
  bid_amount          numeric(10,2) NOT NULL CHECK (bid_amount > 0 AND bid_amount < 100000),
  estimated_pickup    timestamptz,
  notes               text CHECK (notes IS NULL OR char_length(notes) <= 500),
  status              text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','accepted','rejected','withdrawn')),
  submitted_at        timestamptz NOT NULL DEFAULT now(),
  responded_at        timestamptz
);

-- RLS
ALTER TABLE marketplace_loads ENABLE ROW LEVEL SECURITY;
ALTER TABLE load_bids ENABLE ROW LEVEL SECURITY;

-- ml_broker: brokers have full access to their org's loads
CREATE POLICY ml_broker ON marketplace_loads
  USING (
    organization_id = (
      SELECT organization_id FROM profiles WHERE id = auth.uid()
    )
  )
  WITH CHECK (
    organization_id = (
      SELECT organization_id FROM profiles WHERE id = auth.uid()
    )
  );

-- ml_carrier_read: carriers can read posted loads only
CREATE POLICY ml_carrier_read ON marketplace_loads
  FOR SELECT
  USING (
    status = 'posted'
    AND EXISTS (
      SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'carrier'
    )
  );

-- lb_carrier: carriers manage their own bids
CREATE POLICY lb_carrier ON load_bids
  USING (carrier_id = auth.uid())
  WITH CHECK (carrier_id = auth.uid());

-- lb_broker_read: brokers can read bids on their org's loads
CREATE POLICY lb_broker_read ON load_bids
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM marketplace_loads ml
      JOIN profiles p ON p.id = auth.uid()
      WHERE ml.id = load_bids.marketplace_load_id
        AND ml.organization_id = p.organization_id
    )
  );

-- Indexes
CREATE INDEX IF NOT EXISTS idx_marketplace_loads_status ON marketplace_loads(status);
CREATE INDEX IF NOT EXISTS idx_load_bids_marketplace_load_id ON load_bids(marketplace_load_id);
CREATE INDEX IF NOT EXISTS idx_load_bids_carrier_id ON load_bids(carrier_id);

-- accept_bid: atomically accept winning bid, reject others, mark load covered
CREATE OR REPLACE FUNCTION accept_bid(p_bid_id uuid, p_load_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Accept the winning bid
  UPDATE load_bids
  SET status = 'accepted', responded_at = now()
  WHERE id = p_bid_id
    AND marketplace_load_id = p_load_id
    AND status = 'pending';

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Bid not found or not in pending status';
  END IF;

  -- Reject all other pending bids on this load
  UPDATE load_bids
  SET status = 'rejected', responded_at = now()
  WHERE marketplace_load_id = p_load_id
    AND id != p_bid_id
    AND status = 'pending';

  -- Mark the load as covered
  UPDATE marketplace_loads
  SET status = 'covered', covered_at = now()
  WHERE id = p_load_id
    AND status = 'posted';
END;
$$;
