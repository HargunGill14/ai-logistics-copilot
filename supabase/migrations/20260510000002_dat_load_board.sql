ALTER TABLE marketplace_loads
  ADD COLUMN IF NOT EXISTS dat_load_id text,
  ADD COLUMN IF NOT EXISTS dat_posted_at timestamptz;
