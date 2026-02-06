-- Add template_styles JSONB to receipt_settings so the full receipt UI template
-- (fonts, sizes, alignment for each section) drives PDF generation.
-- Variables (store name, order number, customer, items, totals) are inserted at print time.
ALTER TABLE receipt_settings
  ADD COLUMN IF NOT EXISTS template_styles JSONB DEFAULT '{}';

COMMENT ON COLUMN receipt_settings.template_styles IS 'Full receipt template: fonts, sizes, alignment per section. Matches Settings receipt editor. Variables inserted at print.';
