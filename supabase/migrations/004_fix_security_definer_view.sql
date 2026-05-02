DROP VIEW IF EXISTS carrier_trust_public;

CREATE VIEW carrier_trust_public WITH (security_invoker = true) AS
  SELECT carrier_id, trust_score, risk_flags, verification_status,
         legal_name, last_verified_at
  FROM carrier_verifications;
