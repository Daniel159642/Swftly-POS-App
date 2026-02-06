-- Store return totals on pending_returns for receipt (same template as POS receipt)
ALTER TABLE pending_returns
  ADD COLUMN IF NOT EXISTS return_subtotal NUMERIC(10,2),
  ADD COLUMN IF NOT EXISTS return_discount NUMERIC(10,2),
  ADD COLUMN IF NOT EXISTS return_tax NUMERIC(10,2),
  ADD COLUMN IF NOT EXISTS return_processing_fee NUMERIC(10,2),
  ADD COLUMN IF NOT EXISTS return_tip NUMERIC(10,2);
