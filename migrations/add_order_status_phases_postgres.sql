-- Extend order_status to support pickup/delivery phases: placed, being_made, ready, out_for_delivery, delivered, completed, voided, returned
-- Run this to enable "pay at pickup" / "pay on delivery" workflows.

-- Drop existing CHECK and add new one (PostgreSQL)
ALTER TABLE orders DROP CONSTRAINT IF EXISTS orders_order_status_check;
ALTER TABLE orders ADD CONSTRAINT orders_order_status_check CHECK (
  order_status IN (
    'placed', 'being_made', 'ready', 'out_for_delivery', 'delivered',
    'completed', 'voided', 'returned'
  )
);

-- Default for new rows stays 'completed' for backward compatibility; pay-later orders will set 'placed' explicitly.
COMMENT ON COLUMN orders.order_status IS 'placed=just ordered, being_made=in progress, ready=ready for pickup/out, out_for_delivery=delivery en route, delivered=delivered, completed=paid/complete, voided, returned';
