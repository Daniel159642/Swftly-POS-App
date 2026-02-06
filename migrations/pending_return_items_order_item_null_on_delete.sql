-- Allow deleting order_items when fully returned: pending_return_items keeps the return
-- record but order_item_id is set to NULL (return record has product_id, quantity, etc.).
-- Run with: psql -U your_user -d your_db -f migrations/pending_return_items_order_item_null_on_delete.sql

ALTER TABLE pending_return_items
  ALTER COLUMN order_item_id DROP NOT NULL;

ALTER TABLE pending_return_items
  DROP CONSTRAINT IF EXISTS pending_return_items_order_item_id_fkey;

ALTER TABLE pending_return_items
  ADD CONSTRAINT pending_return_items_order_item_id_fkey
  FOREIGN KEY (order_item_id) REFERENCES order_items(order_item_id) ON DELETE SET NULL;
