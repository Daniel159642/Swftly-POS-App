-- Add payment_method and related columns to orders if missing (required for POS create_order / transaction start)
-- Run this if you see: column "payment_method" of relation "orders" does not exist

-- payment_method
ALTER TABLE orders ADD COLUMN IF NOT EXISTS payment_method TEXT DEFAULT 'cash';
UPDATE orders SET payment_method = 'cash' WHERE payment_method IS NULL;
ALTER TABLE orders ALTER COLUMN payment_method SET NOT NULL;

-- payment_status (if missing)
ALTER TABLE orders ADD COLUMN IF NOT EXISTS payment_status TEXT DEFAULT 'completed';

-- tip (if missing)
ALTER TABLE orders ADD COLUMN IF NOT EXISTS tip NUMERIC(10,2) DEFAULT 0;

-- order_type (if missing)
ALTER TABLE orders ADD COLUMN IF NOT EXISTS order_type TEXT;
