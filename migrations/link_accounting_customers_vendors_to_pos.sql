-- ============================================================================
-- Single customer/vendor strategy: formal link between POS and accounting
-- ============================================================================
-- public.customers = POS (orders, loyalty). accounting_customers = invoicing.
-- Link: accounting_customers.customer_id → public.customers(customer_id).
-- public.vendors = POS (inventory, shipments). accounting_vendors = bills/invoicing.
-- Link: accounting_vendors.vendor_id → public.vendors(vendor_id).
-- When linked, avoid duplicating name/email/phone; use POS as source of truth or sync once.
-- ============================================================================

DO $$
BEGIN
    -- Add FK from accounting_customers.customer_id to public.customers(customer_id)
    -- Table may be in public or accounting schema
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'accounting_customers')
       AND EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'accounting_customers' AND column_name = 'customer_id') THEN
        IF NOT EXISTS (
            SELECT 1 FROM information_schema.table_constraints
            WHERE table_schema = 'public' AND table_name = 'accounting_customers'
              AND constraint_name = 'accounting_customers_pos_customer_id_fkey'
        ) THEN
            ALTER TABLE public.accounting_customers
                ADD CONSTRAINT accounting_customers_pos_customer_id_fkey
                FOREIGN KEY (customer_id) REFERENCES public.customers(customer_id) ON DELETE SET NULL;
        END IF;
    END IF;

    -- Add FK from accounting_vendors.vendor_id to public.vendors(vendor_id)
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'accounting_vendors')
       AND EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'accounting_vendors' AND column_name = 'vendor_id') THEN
        IF NOT EXISTS (
            SELECT 1 FROM information_schema.table_constraints
            WHERE table_schema = 'public' AND table_name = 'accounting_vendors'
              AND constraint_name = 'accounting_vendors_pos_vendor_id_fkey'
        ) THEN
            ALTER TABLE public.accounting_vendors
                ADD CONSTRAINT accounting_vendors_pos_vendor_id_fkey
                FOREIGN KEY (vendor_id) REFERENCES public.vendors(vendor_id) ON DELETE SET NULL;
        END IF;
    END IF;
END $$;
