-- ============================================================================
-- Replace sales table with a view over order_items + orders
-- Sales data is derived from completed, paid orders only (single source of truth).
-- ============================================================================

DO $$
BEGIN
    -- If sales exists as a base table, replace it with a view
    IF EXISTS (
        SELECT 1 FROM information_schema.tables
        WHERE table_schema = 'public' AND table_name = 'sales' AND table_type = 'BASE TABLE'
    ) THEN
        DROP TABLE IF EXISTS sales CASCADE;
    END IF;

    -- If sales already exists as a view, drop so we can recreate with current definition
    IF EXISTS (
        SELECT 1 FROM information_schema.views
        WHERE table_schema = 'public' AND table_name = 'sales'
    ) THEN
        DROP VIEW IF EXISTS sales;
    END IF;

    -- Create view: one row per order line for completed, paid orders
    -- Column names match former sales table for backward compatibility
    CREATE OR REPLACE VIEW sales AS
    SELECT
        oi.establishment_id,
        oi.product_id,
        oi.quantity AS quantity_sold,
        oi.unit_price AS sale_price,
        o.order_date AS sale_date,
        NULL::TEXT AS notes,
        (ROW_NUMBER() OVER (ORDER BY o.order_date, oi.order_item_id))::BIGINT AS sale_id
    FROM order_items oi
    JOIN orders o ON o.order_id = oi.order_id
    WHERE o.order_status = 'completed'
      AND o.payment_status = 'completed';
END $$;
