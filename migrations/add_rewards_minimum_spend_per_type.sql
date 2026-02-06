-- Per-reward-type minimum spend: Points, Percentage, and Fixed each have their own minimum ($).
-- If columns are missing we fall back to the existing minimum_spend in code.

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'customer_rewards_settings' AND column_name = 'minimum_spend_points') THEN
    ALTER TABLE customer_rewards_settings ADD COLUMN minimum_spend_points REAL DEFAULT 0.0 CHECK (minimum_spend_points >= 0);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'customer_rewards_settings' AND column_name = 'minimum_spend_percentage') THEN
    ALTER TABLE customer_rewards_settings ADD COLUMN minimum_spend_percentage REAL DEFAULT 0.0 CHECK (minimum_spend_percentage >= 0);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'customer_rewards_settings' AND column_name = 'minimum_spend_fixed') THEN
    ALTER TABLE customer_rewards_settings ADD COLUMN minimum_spend_fixed REAL DEFAULT 0.0 CHECK (minimum_spend_fixed >= 0);
  END IF;
END $$;
