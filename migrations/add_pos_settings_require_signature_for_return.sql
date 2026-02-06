-- Ensure pos_settings has require_signature_for_return so the POS setting saves.
-- Safe to run multiple times.
ALTER TABLE pos_settings
  ADD COLUMN IF NOT EXISTS require_signature_for_return BOOLEAN DEFAULT false;
