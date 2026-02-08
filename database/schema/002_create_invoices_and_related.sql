-- Invoices and related tables (public). References accounting.accounts and accounting.transactions.
-- Run after accounting schema exists (e.g. accounting_bootstrap or 001 accounting core).

-- Accounting customers
CREATE TABLE IF NOT EXISTS accounting_customers (
    id SERIAL PRIMARY KEY,
    customer_id INTEGER,
    customer_number VARCHAR(50) UNIQUE NOT NULL,
    customer_type VARCHAR(20) NOT NULL CHECK (customer_type IN ('individual', 'business')),
    company_name VARCHAR(255),
    first_name VARCHAR(100),
    last_name VARCHAR(100),
    display_name VARCHAR(255) NOT NULL,
    email VARCHAR(255),
    phone VARCHAR(50),
    mobile VARCHAR(50),
    website VARCHAR(255),
    billing_address_line1 VARCHAR(255),
    billing_address_line2 VARCHAR(255),
    billing_city VARCHAR(100),
    billing_state VARCHAR(50),
    billing_postal_code VARCHAR(20),
    billing_country VARCHAR(50) DEFAULT 'US',
    shipping_address_line1 VARCHAR(255),
    shipping_address_line2 VARCHAR(255),
    shipping_city VARCHAR(100),
    shipping_state VARCHAR(50),
    shipping_postal_code VARCHAR(20),
    shipping_country VARCHAR(50) DEFAULT 'US',
    payment_terms VARCHAR(50),
    payment_terms_days INTEGER DEFAULT 30,
    credit_limit DECIMAL(19,4) DEFAULT 0,
    tax_exempt BOOLEAN DEFAULT FALSE,
    tax_exempt_id VARCHAR(100),
    tax_rate_id INTEGER,
    account_balance DECIMAL(19,4) DEFAULT 0,
    notes TEXT,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    created_by INTEGER,
    updated_by INTEGER
);
CREATE INDEX IF NOT EXISTS idx_accounting_customers_customer_number ON accounting_customers(customer_number);
CREATE INDEX IF NOT EXISTS idx_accounting_customers_email ON accounting_customers(email);
CREATE INDEX IF NOT EXISTS idx_accounting_customers_is_active ON accounting_customers(is_active);

-- Tax rates (no FK to accounts)
CREATE TABLE IF NOT EXISTS tax_rates (
    id SERIAL PRIMARY KEY,
    tax_name VARCHAR(100) NOT NULL,
    tax_rate DECIMAL(5,4) NOT NULL CHECK (tax_rate >= 0),
    tax_type VARCHAR(50) DEFAULT 'sales_tax' CHECK (tax_type IN ('sales_tax', 'vat', 'gst', 'other')),
    description TEXT,
    tax_agency_id INTEGER,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_tax_rates_is_active ON tax_rates(is_active);

-- Accounting vendors
CREATE TABLE IF NOT EXISTS accounting_vendors (
    id SERIAL PRIMARY KEY,
    vendor_id INTEGER,
    vendor_number VARCHAR(50) UNIQUE NOT NULL,
    vendor_name VARCHAR(255) NOT NULL,
    contact_name VARCHAR(100),
    email VARCHAR(255),
    phone VARCHAR(50),
    website VARCHAR(255),
    address_line1 VARCHAR(255),
    address_line2 VARCHAR(255),
    city VARCHAR(100),
    state VARCHAR(50),
    postal_code VARCHAR(20),
    country VARCHAR(50) DEFAULT 'US',
    payment_terms VARCHAR(50),
    payment_terms_days INTEGER DEFAULT 30,
    account_number VARCHAR(100),
    tax_id VARCHAR(50),
    is_1099_vendor BOOLEAN DEFAULT FALSE,
    payment_method VARCHAR(50),
    account_balance DECIMAL(19,4) DEFAULT 0,
    notes TEXT,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    created_by INTEGER,
    updated_by INTEGER
);
CREATE INDEX IF NOT EXISTS idx_accounting_vendors_vendor_number ON accounting_vendors(vendor_number);
CREATE INDEX IF NOT EXISTS idx_accounting_vendors_is_active ON accounting_vendors(is_active);

-- Invoices (transaction_id -> accounting.transactions)
CREATE TABLE IF NOT EXISTS invoices (
    id SERIAL PRIMARY KEY,
    invoice_number VARCHAR(50) UNIQUE NOT NULL,
    customer_id INTEGER NOT NULL REFERENCES accounting_customers(id),
    invoice_date DATE NOT NULL,
    due_date DATE NOT NULL,
    terms VARCHAR(50),
    status VARCHAR(20) NOT NULL DEFAULT 'draft' CHECK (status IN (
        'draft', 'sent', 'viewed', 'partial', 'paid', 'overdue', 'void'
    )),
    subtotal DECIMAL(19,4) DEFAULT 0,
    tax_amount DECIMAL(19,4) DEFAULT 0,
    discount_amount DECIMAL(19,4) DEFAULT 0,
    discount_percentage DECIMAL(5,2) DEFAULT 0,
    total_amount DECIMAL(19,4) NOT NULL,
    amount_paid DECIMAL(19,4) DEFAULT 0,
    balance_due DECIMAL(19,4) NOT NULL,
    currency VARCHAR(3) DEFAULT 'USD',
    exchange_rate DECIMAL(10,6) DEFAULT 1.0,
    billing_address_line1 VARCHAR(255),
    billing_address_line2 VARCHAR(255),
    billing_city VARCHAR(100),
    billing_state VARCHAR(50),
    billing_postal_code VARCHAR(20),
    billing_country VARCHAR(50),
    shipping_address_line1 VARCHAR(255),
    shipping_address_line2 VARCHAR(255),
    shipping_city VARCHAR(100),
    shipping_state VARCHAR(50),
    shipping_postal_code VARCHAR(20),
    shipping_country VARCHAR(50),
    memo TEXT,
    internal_notes TEXT,
    transaction_id INTEGER REFERENCES accounting.transactions(id),
    sent_date TIMESTAMP,
    viewed_date TIMESTAMP,
    paid_date DATE,
    void_date DATE,
    void_reason TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    created_by INTEGER,
    updated_by INTEGER,
    CONSTRAINT check_invoice_balance CHECK (amount_paid + balance_due = total_amount),
    CONSTRAINT check_due_date CHECK (due_date >= invoice_date)
);
CREATE INDEX IF NOT EXISTS idx_invoices_invoice_number ON invoices(invoice_number);
CREATE INDEX IF NOT EXISTS idx_invoices_customer_id ON invoices(customer_id);
CREATE INDEX IF NOT EXISTS idx_invoices_invoice_date ON invoices(invoice_date);
CREATE INDEX IF NOT EXISTS idx_invoices_status ON invoices(status);
CREATE INDEX IF NOT EXISTS idx_invoices_transaction_id ON invoices(transaction_id);

-- Invoice lines (account_id -> accounting.accounts)
CREATE TABLE IF NOT EXISTS invoice_lines (
    id SERIAL PRIMARY KEY,
    invoice_id INTEGER NOT NULL REFERENCES invoices(id) ON DELETE CASCADE,
    line_number INTEGER NOT NULL,
    item_id INTEGER,
    description TEXT NOT NULL,
    quantity DECIMAL(19,4) NOT NULL CHECK (quantity > 0),
    unit_price DECIMAL(19,4) NOT NULL CHECK (unit_price >= 0),
    line_total DECIMAL(19,4) NOT NULL,
    discount_amount DECIMAL(19,4) DEFAULT 0,
    discount_percentage DECIMAL(5,2) DEFAULT 0,
    tax_rate_id INTEGER REFERENCES tax_rates(id) ON DELETE SET NULL,
    tax_amount DECIMAL(19,4) DEFAULT 0,
    line_total_with_tax DECIMAL(19,4) NOT NULL,
    account_id INTEGER NOT NULL REFERENCES accounting.accounts(id),
    item_type VARCHAR(50) DEFAULT 'product' CHECK (item_type IN (
        'product', 'service', 'discount', 'subtotal', 'tax'
    )),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_invoice_lines_invoice_id ON invoice_lines(invoice_id);
CREATE INDEX IF NOT EXISTS idx_invoice_lines_invoice_line ON invoice_lines(invoice_id, line_number);

-- Optional: sequences for numbering
CREATE SEQUENCE IF NOT EXISTS invoice_number_seq;
CREATE SEQUENCE IF NOT EXISTS transaction_number_seq;
