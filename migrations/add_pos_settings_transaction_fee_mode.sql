-- Transaction fee at checkout: how to apply fee and whether to charge for cash.
-- transaction_fee_mode: 'additional' = add fee at checkout (default), 'included' = already in product price (no separate fee), 'none' = no fee (store absorbs).
-- transaction_fee_charge_cash: when mode is 'additional', true = charge fee on cash too, false = card/non-cash only.
ALTER TABLE pos_settings
  ADD COLUMN IF NOT EXISTS transaction_fee_mode TEXT NOT NULL DEFAULT 'additional';

ALTER TABLE pos_settings
  ADD COLUMN IF NOT EXISTS transaction_fee_charge_cash BOOLEAN NOT NULL DEFAULT false;

COMMENT ON COLUMN pos_settings.transaction_fee_mode IS 'additional | included | none';
COMMENT ON COLUMN pos_settings.transaction_fee_charge_cash IS 'When mode=additional: charge transaction fee for cash payments.';
