-- Add performance metric counters to carrier_verifications
ALTER TABLE carrier_verifications
  ADD COLUMN IF NOT EXISTS total_bids            integer NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS accepted_bids         integer NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS on_time_pickups       integer NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS on_time_deliveries    integer NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS total_loads_completed integer NOT NULL DEFAULT 0;

-- Atomic counter increment via boolean-cast trick: (expr)::int = 1 if true, 0 if false.
-- SECURITY DEFINER so API routes calling supabase.rpc() can update any carrier row.
CREATE OR REPLACE FUNCTION increment_scorecard_counter(
  p_carrier_id uuid,
  p_column     text
) RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF p_column NOT IN (
    'total_bids','accepted_bids','on_time_pickups','on_time_deliveries','total_loads_completed'
  ) THEN
    RAISE EXCEPTION 'Invalid scorecard column: %', p_column;
  END IF;

  INSERT INTO carrier_verifications (
    carrier_id,
    total_bids, accepted_bids, on_time_pickups, on_time_deliveries, total_loads_completed
  ) VALUES (
    p_carrier_id,
    (p_column = 'total_bids')::int,
    (p_column = 'accepted_bids')::int,
    (p_column = 'on_time_pickups')::int,
    (p_column = 'on_time_deliveries')::int,
    (p_column = 'total_loads_completed')::int
  )
  ON CONFLICT (carrier_id) DO UPDATE SET
    total_bids            = carrier_verifications.total_bids            + (p_column = 'total_bids')::int,
    accepted_bids         = carrier_verifications.accepted_bids         + (p_column = 'accepted_bids')::int,
    on_time_pickups       = carrier_verifications.on_time_pickups       + (p_column = 'on_time_pickups')::int,
    on_time_deliveries    = carrier_verifications.on_time_deliveries    + (p_column = 'on_time_deliveries')::int,
    total_loads_completed = carrier_verifications.total_loads_completed + (p_column = 'total_loads_completed')::int;
END;
$$;
