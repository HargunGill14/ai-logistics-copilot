ALTER TABLE marketplace_loads
  DROP CONSTRAINT IF EXISTS marketplace_loads_status_check;

ALTER TABLE marketplace_loads
  ADD CONSTRAINT marketplace_loads_status_check
  CHECK (status IN ('posted', 'covered', 'in_transit', 'delivered', 'cancelled', 'expired'));
