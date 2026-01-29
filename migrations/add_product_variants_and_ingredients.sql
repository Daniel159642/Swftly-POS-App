-- Product variants (sizes with different prices) and ingredients (non-POS items used in recipes)
-- For cafes, pizza shops, flower shops: products with multiple sizes + ingredients/recipes

-- 1. Extend inventory: item_type (product vs ingredient), unit (for ingredients), sell_at_pos
ALTER TABLE inventory
  ADD COLUMN IF NOT EXISTS item_type TEXT NOT NULL DEFAULT 'product'
    CHECK (item_type IN ('product', 'ingredient')),
  ADD COLUMN IF NOT EXISTS unit TEXT,
  ADD COLUMN IF NOT EXISTS sell_at_pos BOOLEAN NOT NULL DEFAULT true;

COMMENT ON COLUMN inventory.item_type IS 'product = sellable at POS; ingredient = raw material used in recipes, not sold at POS';
COMMENT ON COLUMN inventory.unit IS 'Unit of measure for ingredients: oz, lb, g, ml, each, etc.';
COMMENT ON COLUMN inventory.sell_at_pos IS 'If false, item is not shown at POS (e.g. ingredients).';

-- Ensure existing rows are products
UPDATE inventory SET item_type = 'product', sell_at_pos = true WHERE item_type IS NULL;

-- 2. Product variants (e.g. Small / Medium / Large with different prices)
CREATE TABLE IF NOT EXISTS product_variants (
  variant_id SERIAL PRIMARY KEY,
  product_id INTEGER NOT NULL REFERENCES inventory(product_id) ON DELETE CASCADE,
  variant_name TEXT NOT NULL,
  price NUMERIC(10,2) NOT NULL CHECK (price >= 0),
  cost NUMERIC(10,2) NOT NULL DEFAULT 0 CHECK (cost >= 0),
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(product_id, variant_name)
);

CREATE INDEX IF NOT EXISTS idx_product_variants_product ON product_variants(product_id);

COMMENT ON TABLE product_variants IS 'Size/option variants for a product (e.g. Small $3, Large $5).';

-- 3. Recipe: which ingredients (and how much) are used per product or per variant
-- If variant_id is NULL, the recipe applies to the base product (when no size is selected).
-- If variant_id is set, the recipe applies to that size (e.g. Large uses more milk than Small).
CREATE TABLE IF NOT EXISTS product_ingredients (
  id SERIAL PRIMARY KEY,
  product_id INTEGER NOT NULL REFERENCES inventory(product_id) ON DELETE CASCADE,
  variant_id INTEGER REFERENCES product_variants(variant_id) ON DELETE CASCADE,
  ingredient_id INTEGER NOT NULL REFERENCES inventory(product_id) ON DELETE CASCADE,
  quantity_required NUMERIC(12,4) NOT NULL CHECK (quantity_required > 0),
  unit TEXT NOT NULL,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_product_ingredients_unique_base
  ON product_ingredients (product_id, ingredient_id) WHERE variant_id IS NULL;
CREATE UNIQUE INDEX IF NOT EXISTS idx_product_ingredients_unique_variant
  ON product_ingredients (product_id, variant_id, ingredient_id) WHERE variant_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_product_ingredients_product ON product_ingredients(product_id);
CREATE INDEX IF NOT EXISTS idx_product_ingredients_ingredient ON product_ingredients(ingredient_id);
CREATE INDEX IF NOT EXISTS idx_product_ingredients_variant ON product_ingredients(variant_id);

COMMENT ON TABLE product_ingredients IS 'Bill of materials: ingredients used per product (or per variant).';

-- 4. Order items: optional variant (when customer picks a size)
ALTER TABLE order_items
  ADD COLUMN IF NOT EXISTS variant_id INTEGER REFERENCES product_variants(variant_id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_order_items_variant ON order_items(variant_id);

COMMENT ON COLUMN order_items.variant_id IS 'When set, this line item is for a specific size/variant; unit_price comes from variant.';
