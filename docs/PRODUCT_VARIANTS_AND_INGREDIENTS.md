# Product Variants (Sizes) and Ingredients (Recipes)

This feature adds support for **complex products** suitable for cafes, pizza shops, flower shops, etc.:

- **Products with multiple sizes** (e.g. Small $3, Medium $4, Large $5)
- **Ingredients** – inventory items that are **not sold at POS** but are used in recipes
- **Recipes** – which ingredients (and how much) are used per product or per size

## Database migration

Run the migration once to add the new tables and columns:

```bash
psql -U postgres -d pos_db -f migrations/add_product_variants_and_ingredients.sql
```

Or from your project root (adjust connection if needed):

```bash
psql $DATABASE_URL -f migrations/add_product_variants_and_ingredients.sql
```

## Concepts

### Item types (inventory)

- **Product** – sellable at POS. Can have multiple **variants** (sizes) with different prices.
- **Ingredient** – not sold at POS; used only in **recipes** to make products. Has a **unit** (oz, lb, g, ml, each, etc.) and quantity on hand.

### Product variants (sizes)

- A product can have 0 or more **variants** (e.g. Small, Medium, Large).
- Each variant has: **name**, **price**, **cost**, optional **sort_order**.
- At POS, when a customer selects a product that has variants, a **size** is chosen; the variant’s price is used and `variant_id` is stored on the order line.

### Recipe (product ingredients)

- **Recipe** links a product (or a specific variant) to **ingredients** and **quantities**.
- Each row: product (or variant), ingredient, **quantity_required**, **unit**.
- You can define a **base recipe** (variant_id = null) or **per-size recipes** (e.g. Large uses more milk than Small).

## Inventory UI

1. **Filter** – Use **All items** / **Products** / **Ingredients** to switch views.
2. **Create**
   - **Product** – name, SKU, price, cost, etc. Then add **Sizes** and **Ingredients used** when editing.
   - **Ingredient** – name, SKU, **unit**, cost, quantity (no price; not sold at POS).
3. **Edit a product**
   - **Sizes / Variants** – add rows like “Small $3”, “Large $5”.
   - **Ingredients used** – pick an ingredient from the list (ingredients only), enter quantity and unit, then Add.

## POS

- Products that have **variants** show a **“Choose size”** modal when added to the cart; the selected size’s price is used.
- Products without variants add to cart with the product’s default price.
- Only **products** (and optionally ingredients for inventory) are loaded at POS; ingredients are not sold at POS.

## API (for reference)

- `GET /api/inventory?item_type=product|ingredient` – filter by type.
- `GET /api/inventory?include_variants=1` – include `variants[]` on each product.
- `POST /api/inventory` – body can include `item_type`, `unit`, `sell_at_pos`.
- `GET/POST /api/inventory/:product_id/variants` – list or add variants.
- `PUT/DELETE /api/inventory/variants/:variant_id` – update or delete a variant.
- `GET/POST /api/inventory/:product_id/ingredients` – list or add recipe rows.
- `DELETE /api/inventory/ingredients/:id` – remove a recipe row.

Order items can include `variant_id`; the backend stores it in `order_items.variant_id` and uses the variant’s price when present.
