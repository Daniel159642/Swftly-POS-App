-- Add template_preset to receipt_settings so the selected receipt template (traditional, thermal, minimal, custom, or template_123) persists
ALTER TABLE receipt_settings
  ADD COLUMN IF NOT EXISTS template_preset TEXT DEFAULT 'custom';

COMMENT ON COLUMN receipt_settings.template_preset IS 'Selected preset: traditional, thermal, minimal, custom, or template_{id} for saved templates';
