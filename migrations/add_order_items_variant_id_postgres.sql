-- Add variant_id to order_items if missing (required for create_order when using product variants)
-- Run if you see: column "variant_id" of relation "order_items" does not exist

-- Add column (nullable; FK only if product_variants exists)
ALTER TABLE order_items ADD COLUMN IF NOT EXISTS variant_id INTEGER;

-- Optional: add FK and index if product_variants table exists (idempotent)
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'product_variants') THEN
    IF NOT EXISTS (
      SELECT 1 FROM information_schema.table_constraints
      WHERE table_schema = 'public' AND table_name = 'order_items' AND constraint_name = 'order_items_variant_id_fkey'
    ) THEN
      ALTER TABLE order_items
        ADD CONSTRAINT order_items_variant_id_fkey
        FOREIGN KEY (variant_id) REFERENCES product_variants(variant_id) ON DELETE SET NULL;
    END IF;
    CREATE INDEX IF NOT EXISTS idx_order_items_variant ON order_items(variant_id);
  END IF;
END $$;
