-- Add address column to customers for delivery autofill and edit customer.
-- Safe to run multiple times.
ALTER TABLE customers
  ADD COLUMN IF NOT EXISTS address TEXT;
