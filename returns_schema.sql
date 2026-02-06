-- Pending Returns Table (PostgreSQL) - multi-tenant with establishment_id
CREATE TABLE IF NOT EXISTS pending_returns (
    return_id SERIAL PRIMARY KEY,
    establishment_id INTEGER NOT NULL REFERENCES establishments(establishment_id) ON DELETE CASCADE,
    return_number TEXT,
    order_id INTEGER NOT NULL REFERENCES orders(order_id),
    employee_id INTEGER NOT NULL REFERENCES employees(employee_id),
    customer_id INTEGER REFERENCES customers(customer_id),
    return_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    total_refund_amount NUMERIC(10,2) DEFAULT 0 CHECK(total_refund_amount >= 0),
    reason TEXT,
    status TEXT DEFAULT 'pending' CHECK(status IN ('pending', 'approved', 'rejected', 'cancelled')),
    approved_by INTEGER REFERENCES employees(employee_id),
    approved_date TIMESTAMP,
    notes TEXT,
    UNIQUE(establishment_id, return_number)
);

-- Pending Return Items Table (PostgreSQL)
CREATE TABLE IF NOT EXISTS pending_return_items (
    return_item_id SERIAL PRIMARY KEY,
    establishment_id INTEGER NOT NULL REFERENCES establishments(establishment_id) ON DELETE CASCADE,
    return_id INTEGER NOT NULL REFERENCES pending_returns(return_id) ON DELETE CASCADE,
    order_item_id INTEGER NOT NULL REFERENCES order_items(order_item_id),
    product_id INTEGER NOT NULL REFERENCES inventory(product_id),
    quantity INTEGER NOT NULL CHECK(quantity > 0),
    unit_price NUMERIC(10,2) NOT NULL CHECK(unit_price >= 0),
    discount NUMERIC(10,2) DEFAULT 0 CHECK(discount >= 0),
    refund_amount NUMERIC(10,2) NOT NULL CHECK(refund_amount >= 0),
    condition TEXT CHECK(condition IN ('new', 'opened', 'damaged', 'defective')),
    notes TEXT
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_pending_returns_establishment ON pending_returns(establishment_id);
CREATE INDEX IF NOT EXISTS idx_pending_returns_order ON pending_returns(order_id);
CREATE INDEX IF NOT EXISTS idx_pending_returns_status ON pending_returns(status);
CREATE INDEX IF NOT EXISTS idx_pending_returns_date ON pending_returns(return_date);
CREATE INDEX IF NOT EXISTS idx_pending_return_items_establishment ON pending_return_items(establishment_id);
CREATE INDEX IF NOT EXISTS idx_pending_return_items_return ON pending_return_items(return_id);
CREATE INDEX IF NOT EXISTS idx_pending_return_items_product ON pending_return_items(product_id);
