-- Add points_redemption_value to customer_rewards_settings (e.g. 0.01 = 100 points = $1)
ALTER TABLE customer_rewards_settings
  ADD COLUMN IF NOT EXISTS points_redemption_value REAL DEFAULT 0.01 CHECK (points_redemption_value >= 0);

COMMENT ON COLUMN customer_rewards_settings.points_redemption_value IS 'Dollar value per point (e.g. 0.01 = 100 points = $1)';
