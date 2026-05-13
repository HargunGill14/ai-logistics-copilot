-- QBO connection per organization (one active connection per org)
CREATE TABLE IF NOT EXISTS qbo_connections (
  id                      UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id         UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  realm_id                TEXT NOT NULL,
  access_token_encrypted  TEXT NOT NULL,
  refresh_token_encrypted TEXT NOT NULL,
  token_expires_at        TIMESTAMPTZ NOT NULL,
  company_name            TEXT CHECK (company_name IS NULL OR char_length(company_name) <= 200),
  connected_by            UUID NOT NULL REFERENCES profiles(id),
  connected_at            TIMESTAMPTZ NOT NULL DEFAULT now(),
  is_active               BOOLEAN NOT NULL DEFAULT true
);

-- Efficient lookup of active connection per org
CREATE INDEX IF NOT EXISTS idx_qbo_connections_org_active
  ON qbo_connections (organization_id, is_active);

-- RLS: broker/admin org members can manage their org's QBO connection
ALTER TABLE qbo_connections ENABLE ROW LEVEL SECURITY;

CREATE POLICY qbo_broker ON qbo_connections
  FOR ALL
  USING (
    organization_id IN (
      SELECT organization_id FROM profiles
      WHERE id = auth.uid() AND role IN ('broker', 'admin')
    )
  )
  WITH CHECK (
    organization_id IN (
      SELECT organization_id FROM profiles
      WHERE id = auth.uid() AND role IN ('broker', 'admin')
    )
  );

-- QBO invoice tracking fields on marketplace_loads
ALTER TABLE marketplace_loads
  ADD COLUMN IF NOT EXISTS qbo_invoice_id        TEXT,
  ADD COLUMN IF NOT EXISTS qbo_synced_at          TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS carrier_payment_status TEXT NOT NULL DEFAULT 'pending'
    CHECK (carrier_payment_status IN ('pending', 'paid'));

CREATE INDEX IF NOT EXISTS idx_marketplace_loads_qbo_invoice
  ON marketplace_loads (qbo_invoice_id)
  WHERE qbo_invoice_id IS NOT NULL;
