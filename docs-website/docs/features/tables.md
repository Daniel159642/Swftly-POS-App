# Tables (Data & Schema)
The system relies on a robust relational database structure to enforce data integrity. This section outlines the core tables operating behind the scenes.

## Architecture
The application runs exclusively on PostgreSQL (`database_postgres.py`).

## Core Database Tables
1. **`inventory` & `product_metadata`**: Stores all sellable items and ingredients, along with AI-extracted metadata.
2. **`orders` & `order_items`**: The source of truth for all sales transactions, containing headers (totals, timestamps) and individual line items.
3. **`cash_transactions` & `daily_cash_counts`**: Tracks cash flow in and out of the physical register drawers, including discrepancies.
4. **`journal_entries`**: Part of the double-entry accounting subsystem; maps POS events to strict debit/credit models.
5. **`pending_shipments` & `shipment_discrepancies`**: Tracks incoming vendor orders and flags differences between expected versus actual received stock.
6. **`employees` & `roles`**: Manages RBAC permissions and user identities.
