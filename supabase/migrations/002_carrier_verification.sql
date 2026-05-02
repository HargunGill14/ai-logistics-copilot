-- carrier_verifications table
CREATE TABLE IF NOT EXISTS carrier_verifications (
  id                    uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  carrier_id            uuid NOT NULL UNIQUE REFERENCES profiles(id) ON DELETE CASCADE,
  usdot_number          text,
  mc_number             text,
  legal_name            text,
  operating_status      text,
  safety_rating         text,
  insurance_on_file     boolean,
  cargo_insurance       boolean,
  authority_age_days    integer,
  trust_score           integer NOT NULL DEFAULT 0 CHECK (trust_score >= 0 AND trust_score <= 100),
  risk_flags            text[] NOT NULL DEFAULT '{}',
  verification_status   text NOT NULL DEFAULT 'pending' CHECK (verification_status IN ('pending','verified','flagged','rejected')),
  fmcsa_raw             jsonb,
  last_verified_at      timestamptz,
  next_verify_at        timestamptz NOT NULL DEFAULT (now() + interval '30 days'),
  created_at            timestamptz NOT NULL DEFAULT now()
);

-- verification_documents table
CREATE TABLE IF NOT EXISTS verification_documents (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  carrier_id      uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  document_type   text NOT NULL CHECK (document_type IN ('insurance_cert','mc_authority','w9','void_check')),
  storage_path    text NOT NULL,
  file_name       text NOT NULL,
  file_size_kb    integer,
  ai_verdict      text CHECK (ai_verdict IN ('valid','invalid','review')),
  ai_flags        text[] NOT NULL DEFAULT '{}',
  ai_confidence   integer CHECK (ai_confidence IS NULL OR (ai_confidence >= 0 AND ai_confidence <= 100)),
  analyzed_at     timestamptz,
  uploaded_at     timestamptz NOT NULL DEFAULT now()
);

-- RLS
ALTER TABLE carrier_verifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE verification_documents ENABLE ROW LEVEL SECURITY;

-- cv_carrier: carriers see only their own record
CREATE POLICY cv_carrier ON carrier_verifications
  USING (carrier_id = auth.uid())
  WITH CHECK (carrier_id = auth.uid());

-- vd_carrier: carriers manage only their own documents
CREATE POLICY vd_carrier ON verification_documents
  USING (carrier_id = auth.uid())
  WITH CHECK (carrier_id = auth.uid());

-- carrier_trust_public view: safe broker-facing view, never exposes fmcsa_raw
CREATE OR REPLACE VIEW carrier_trust_public AS
  SELECT
    carrier_id,
    trust_score,
    risk_flags,
    verification_status,
    legal_name,
    last_verified_at
  FROM carrier_verifications;
