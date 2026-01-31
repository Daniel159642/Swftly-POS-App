-- Migration: Add establishment_id to transactions table if missing
-- Fixes: psycopg2.errors.UndefinedColumn: column "establishment_id" of relation "transactions" does not exist
-- Run this if transactions was created without establishment_id (e.g. older schema).

-- Add column if it doesn't exist (PostgreSQL 9.5+)
ALTER TABLE public.transactions
ADD COLUMN IF NOT EXISTS establishment_id INTEGER;

-- Backfill from first establishment where null
UPDATE public.transactions t
SET establishment_id = (SELECT establishment_id FROM public.establishments ORDER BY establishment_id LIMIT 1)
WHERE t.establishment_id IS NULL;

-- Set NOT NULL (safe after backfill)
ALTER TABLE public.transactions
ALTER COLUMN establishment_id SET NOT NULL;

-- Add foreign key if not already present
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints
    WHERE table_schema = 'public' AND table_name = 'transactions'
    AND constraint_name = 'transactions_establishment_id_fkey'
  ) THEN
    ALTER TABLE public.transactions
    ADD CONSTRAINT transactions_establishment_id_fkey
    FOREIGN KEY (establishment_id) REFERENCES public.establishments(establishment_id) ON DELETE CASCADE;
  END IF;
END $$;

-- Index for lookups
CREATE INDEX IF NOT EXISTS idx_transactions_establishment ON public.transactions(establishment_id);
