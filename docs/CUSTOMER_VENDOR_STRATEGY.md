# Single Customer/Vendor Strategy

## Overview

- **POS (public schema)**  
  - `public.customers` – used for POS orders, loyalty, checkout.  
  - `public.vendors` – used for inventory, shipments, receiving.

- **Accounting (invoicing/bills)**  
  - `accounting_customers` – used for invoicing, A/R, customer balance.  
  - `accounting_vendors` – used for bills, A/P, vendor balance.

We keep both sides but **link** them so we don’t duplicate data unnecessarily.

## Links

| Accounting table           | Column      | References              | Meaning |
|---------------------------|------------|--------------------------|--------|
| `accounting_customers`     | `customer_id` | `public.customers(customer_id)` | When set, this accounting customer is tied to a POS customer. |
| `accounting_vendors`       | `vendor_id`   | `public.vendors(vendor_id)`     | When set, this accounting vendor is tied to a POS vendor.    |

- Both links are **optional** (nullable).  
- FKs use **ON DELETE SET NULL** so deleting a POS customer/vendor does not delete the accounting record.  
- Run `migrations/link_accounting_customers_vendors_to_pos.sql` to add the constraints if not already applied.

## Rules

1. **One clear link**  
   Use only `accounting_customers.customer_id` and `accounting_vendors.vendor_id` to point to POS. No duplicate “external id” or “pos_id” columns.

2. **Avoid copying data**  
   - When `customer_id` is set, treat **public.customers** as the source of truth for **identity/contact** (name, email, phone) where possible.  
   - Use accounting tables for **invoicing-only** fields (payment terms, billing/shipping address, credit limit, tax exempt, etc.).  
   - Options:  
     - **A)** At display time: join to `public.customers` when `customer_id` is set and show name/email/phone from there.  
     - **B)** When creating an accounting customer from a POS customer: set `customer_id` and copy name/email/phone **once** into the accounting record for display; keep POS as source of truth and refresh from POS when needed.

3. **Vendors**  
   Same idea: when `vendor_id` is set, prefer **public.vendors** for name/contact; use **accounting_vendors** for payment terms, 1099, etc.

## Usage

- **Create accounting customer linked to POS**  
  Pass `customer_id` = `public.customers.customer_id` when creating; the backend can fill `display_name`, `email`, `phone` from POS so you don’t re-enter.

- **Find accounting customer by POS customer**  
  Use `CustomerRepository.find_by_pos_customer_id(public_customer_id)` so you don’t create duplicates.

- **Vendors**  
  Use `VendorRepository.find_by_pos_vendor_id(public_vendor_id)` and pass `vendor_id` when creating an accounting vendor from a POS vendor.
