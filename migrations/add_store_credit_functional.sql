-- Store credit: lookup by order number, partial use, customer balance
-- 1) payment_transactions: notes (credit number for scan), amount_remaining (partial use)
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'payment_transactions' AND column_name = 'notes') THEN
    ALTER TABLE payment_transactions ADD COLUMN notes TEXT;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'payment_transactions' AND column_name = 'amount_remaining') THEN
    ALTER TABLE payment_transactions ADD COLUMN amount_remaining NUMERIC(10,2);
    COMMENT ON COLUMN payment_transactions.amount_remaining IS 'For store_credit: remaining balance; NULL = use amount; 0 or less = fully used';
  END IF;
END $$;

-- 2) customers: store_credit_balance (so store credit can be given to customer when order has customer_id)
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'customers' AND column_name = 'store_credit_balance') THEN
    ALTER TABLE customers ADD COLUMN store_credit_balance NUMERIC(10,2) DEFAULT 0 CHECK (store_credit_balance >= 0);
    COMMENT ON COLUMN customers.store_credit_balance IS 'Store credit available to customer (issued from returns/exchanges; use at checkout)';
  END IF;
END $$;
