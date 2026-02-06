-- Tip display options: custom tip in checkout, allocation, and refund source.
-- Run once per environment.

ALTER TABLE customer_display_settings
  ADD COLUMN IF NOT EXISTS tip_custom_in_checkout INTEGER NOT NULL DEFAULT 0;

ALTER TABLE customer_display_settings
  ADD COLUMN IF NOT EXISTS tip_allocation TEXT NOT NULL DEFAULT 'logged_in_employee';

ALTER TABLE customer_display_settings
  ADD COLUMN IF NOT EXISTS tip_refund_from TEXT NOT NULL DEFAULT 'store';

COMMENT ON COLUMN customer_display_settings.tip_custom_in_checkout IS '1 = show custom tip amount option in checkout UI';
COMMENT ON COLUMN customer_display_settings.tip_allocation IS 'logged_in_employee | split_all';
COMMENT ON COLUMN customer_display_settings.tip_refund_from IS 'employee = deduct from employee(s) on refund; store = store absorbs cost';
