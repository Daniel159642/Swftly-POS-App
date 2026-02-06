-- Add return-related options to pos_settings (transaction fee take loss, refund tip)
ALTER TABLE pos_settings
  ADD COLUMN IF NOT EXISTS return_transaction_fee_take_loss BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS return_tip_refund BOOLEAN DEFAULT false;

COMMENT ON COLUMN pos_settings.return_transaction_fee_take_loss IS 'When true, store takes the loss: do not deduct transaction fee from return refund.';
COMMENT ON COLUMN pos_settings.return_tip_refund IS 'When true, refund tip to customer on returns (do not deduct proportional tip from refund).';
