-- Save customer info used for each order (name, phone, email, address) on the order row.
-- This preserves what was used for this order even if the customer profile changes later,
-- or when a different phone/name/address was used than the linked customer profile.
-- Safe to run multiple times.
ALTER TABLE orders ADD COLUMN IF NOT EXISTS customer_name TEXT;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS customer_phone TEXT;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS customer_email TEXT;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS customer_address TEXT;
