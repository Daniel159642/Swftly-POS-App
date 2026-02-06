-- Ensure customer_display_settings has signature_required (required for "Require signature" in POS settings).
-- Safe to run multiple times. Run this if the column is missing and "Require signature" does not save.
ALTER TABLE customer_display_settings
  ADD COLUMN IF NOT EXISTS signature_required INTEGER NOT NULL DEFAULT 0;
