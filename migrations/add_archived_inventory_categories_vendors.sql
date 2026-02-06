-- Add archived flag to inventory, categories, and vendors for soft-delete / archive
-- Archived items are excluded from default lists but can be restored later.

-- Inventory (products/ingredients)
ALTER TABLE inventory ADD COLUMN IF NOT EXISTS archived BOOLEAN DEFAULT FALSE;
CREATE INDEX IF NOT EXISTS idx_inventory_archived ON inventory(archived) WHERE archived = FALSE;

-- Categories
ALTER TABLE categories ADD COLUMN IF NOT EXISTS archived BOOLEAN DEFAULT FALSE;
CREATE INDEX IF NOT EXISTS idx_categories_archived ON categories(archived) WHERE archived = FALSE;

-- Vendors (public.vendors)
ALTER TABLE vendors ADD COLUMN IF NOT EXISTS archived BOOLEAN DEFAULT FALSE;
CREATE INDEX IF NOT EXISTS idx_vendors_archived ON vendors(archived) WHERE archived = FALSE;
