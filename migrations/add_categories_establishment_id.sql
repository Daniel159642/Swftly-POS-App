-- Add establishment_id to categories for multi-tenant support.
-- Safe to run on DBs that already have categories (backfill with 1).

BEGIN;

-- Add column (DEFAULT 1 backfills existing rows; REFERENCES adds FK)
ALTER TABLE categories ADD COLUMN IF NOT EXISTS establishment_id INTEGER DEFAULT 1 REFERENCES establishments(establishment_id) ON DELETE CASCADE;

-- Enforce NOT NULL (no-op if already NOT NULL from schema)
ALTER TABLE categories ALTER COLUMN establishment_id SET NOT NULL;

-- Drop old partial unique indexes if they exist (old definition without establishment_id)
DROP INDEX IF EXISTS idx_categories_root_name;
DROP INDEX IF EXISTS idx_categories_name_parent;

-- Recreate partial uniques per establishment
CREATE UNIQUE INDEX IF NOT EXISTS idx_categories_root_name
    ON categories (establishment_id, category_name) WHERE parent_category_id IS NULL;
CREATE UNIQUE INDEX IF NOT EXISTS idx_categories_name_parent
    ON categories (establishment_id, category_name, parent_category_id) WHERE parent_category_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_categories_establishment ON categories(establishment_id);

COMMIT;
