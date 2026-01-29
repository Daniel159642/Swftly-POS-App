-- Migration: Make session_id nullable in cash_transactions to allow transactions without an open register
-- Date: 2026-01-27

-- Drop the foreign key constraint first
ALTER TABLE cash_transactions 
DROP CONSTRAINT IF EXISTS cash_transactions_session_id_fkey;

-- Make session_id nullable
ALTER TABLE cash_transactions 
ALTER COLUMN session_id DROP NOT NULL;

-- Re-add the foreign key constraint with ON DELETE SET NULL to handle deletions gracefully
ALTER TABLE cash_transactions
ADD CONSTRAINT cash_transactions_session_id_fkey 
FOREIGN KEY (session_id) 
REFERENCES cash_register_sessions(register_session_id) 
ON DELETE SET NULL;
