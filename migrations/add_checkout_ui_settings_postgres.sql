-- Add checkout_ui JSON column to customer_display_settings for customizing
-- Review Your Order, Cash to Cashier, and Sign Below screens (background, buttons, fonts).
ALTER TABLE customer_display_settings
  ADD COLUMN IF NOT EXISTS checkout_ui TEXT;

COMMENT ON COLUMN customer_display_settings.checkout_ui IS 'JSON: per-screen styles { review_order, cash_confirmation, receipt } with backgroundColor, buttonColor, fontFamily, fontWeight, etc.';
