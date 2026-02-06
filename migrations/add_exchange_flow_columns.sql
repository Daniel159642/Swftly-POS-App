-- Link exchange credit (payment_transaction) to return and new order for exchange completion receipt
-- pending_returns.exchange_transaction_id: set when process_return_immediate creates store_credit transaction
-- orders.exchange_return_id: set when apply_exchange_credit is called so we can generate exchange completion receipt

ALTER TABLE pending_returns
  ADD COLUMN IF NOT EXISTS exchange_transaction_id INTEGER NULL;

ALTER TABLE orders
  ADD COLUMN IF NOT EXISTS exchange_return_id INTEGER NULL;

COMMENT ON COLUMN pending_returns.exchange_transaction_id IS 'payment_transactions.transaction_id for store_credit issued for this return (exchange only)';
COMMENT ON COLUMN orders.exchange_return_id IS 'pending_returns.return_id when this order was paid using an exchange credit';
