CREATE TABLE IF NOT EXISTS broker_carriers (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  broker_id       uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  carrier_name    text NOT NULL CHECK (char_length(carrier_name) <= 160),
  contact_name    text CHECK (contact_name IS NULL OR char_length(contact_name) <= 500),
  email           text CHECK (email IS NULL OR char_length(email) <= 254),
  phone           text CHECK (phone IS NULL OR char_length(phone) <= 500),
  mc_number       text CHECK (mc_number IS NULL OR mc_number ~ '^[0-9]{1,8}$'),
  usdot_number    text CHECK (usdot_number IS NULL OR usdot_number ~ '^[0-9]{1,8}$'),
  equipment_type  text CHECK (
    equipment_type IS NULL OR
    equipment_type IN ('dry_van','reefer','flatbed','step_deck','power_only','tanker')
  ),
  notes           text CHECK (notes IS NULL OR char_length(notes) <= 500),
  created_at      timestamptz NOT NULL DEFAULT now(),
  updated_at      timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE broker_carriers ENABLE ROW LEVEL SECURITY;

CREATE POLICY broker_carriers_org_brokers ON broker_carriers
  USING (
    organization_id = (
      SELECT organization_id FROM profiles WHERE id = auth.uid()
    )
    AND EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid()
        AND role IN ('broker', 'admin')
    )
  )
  WITH CHECK (
    organization_id = (
      SELECT organization_id FROM profiles WHERE id = auth.uid()
    )
    AND broker_id = auth.uid()
    AND EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid()
        AND role IN ('broker', 'admin')
    )
  );

CREATE INDEX IF NOT EXISTS idx_broker_carriers_org ON broker_carriers(organization_id);
CREATE INDEX IF NOT EXISTS idx_broker_carriers_broker ON broker_carriers(broker_id);
CREATE INDEX IF NOT EXISTS idx_broker_carriers_mc ON broker_carriers(mc_number);
CREATE INDEX IF NOT EXISTS idx_broker_carriers_usdot ON broker_carriers(usdot_number);
