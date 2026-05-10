ALTER TABLE profiles
  ADD COLUMN IF NOT EXISTS stripe_customer_id      TEXT,
  ADD COLUMN IF NOT EXISTS stripe_subscription_id  TEXT,
  ADD COLUMN IF NOT EXISTS subscription_status     TEXT NOT NULL DEFAULT 'free'
    CONSTRAINT profiles_subscription_status_check
    CHECK (subscription_status IN ('free', 'active', 'past_due', 'cancelled')),
  ADD COLUMN IF NOT EXISTS subscription_plan       TEXT
    CONSTRAINT profiles_subscription_plan_check
    CHECK (subscription_plan IS NULL OR subscription_plan IN ('broker_monthly', 'carrier_monthly')),
  ADD COLUMN IF NOT EXISTS plan_period_end         TIMESTAMPTZ;

CREATE UNIQUE INDEX IF NOT EXISTS profiles_stripe_customer_id_idx
  ON profiles (stripe_customer_id)
  WHERE stripe_customer_id IS NOT NULL;

CREATE UNIQUE INDEX IF NOT EXISTS profiles_stripe_subscription_id_idx
  ON profiles (stripe_subscription_id)
  WHERE stripe_subscription_id IS NOT NULL;
