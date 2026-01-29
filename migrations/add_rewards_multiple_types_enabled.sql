-- Allow multiple reward types: each has its own enabled flag
ALTER TABLE customer_rewards_settings
  ADD COLUMN IF NOT EXISTS points_enabled INTEGER DEFAULT 0 CHECK (points_enabled IN (0, 1));
ALTER TABLE customer_rewards_settings
  ADD COLUMN IF NOT EXISTS percentage_enabled INTEGER DEFAULT 0 CHECK (percentage_enabled IN (0, 1));
ALTER TABLE customer_rewards_settings
  ADD COLUMN IF NOT EXISTS fixed_enabled INTEGER DEFAULT 0 CHECK (fixed_enabled IN (0, 1));

-- Backfill: set the enabled flag that matches current reward_type (new columns default to 0)
UPDATE customer_rewards_settings SET points_enabled = 1 WHERE reward_type = 'points';
UPDATE customer_rewards_settings SET percentage_enabled = 1 WHERE reward_type = 'percentage';
UPDATE customer_rewards_settings SET fixed_enabled = 1 WHERE reward_type = 'fixed';
