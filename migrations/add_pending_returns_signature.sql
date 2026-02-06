-- Store customer signature for return receipt (when "Require signature for return" is enabled).
-- Safe to run multiple times.
ALTER TABLE pending_returns
  ADD COLUMN IF NOT EXISTS signature TEXT;
