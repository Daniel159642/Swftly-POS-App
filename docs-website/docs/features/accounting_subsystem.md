# Accounting Subsystem
The Accounting subsystem bridges the gap between raw point-of-sale transactional data and standard double-entry accounting ledgers.

## Architecture
This subsystem is driven by two main pillars:
1. **POS Accounting Bridge (`pos_accounting_bridge.py`)**: Responsible for internally journalizing all POS events (sales, voided sales, shipment receiving, cash drops, inventory damage) directly into the local `accounting.transactions` ledger using standard debit and credit principles.
2. **QuickBooks Online Sync (`quickbooks_sync.py`)**: The external bridge. It authenticates with QBO via OAuth 2.0, maps the internal Chart of Accounts, and synchronizes journal entries or sales receipts to QuickBooks Online.

## Key Capabilities
- **Double-Entry Journalization**: Every financial event at the POS automatically creates balanced debit and credit entries. For example, a cash sale debits '1000 Cash' and credits '4100 Sales Revenue'.
- **Idempotency**: All accounting sync commands are built to be idempotent, preventing duplicate entries when system syncs re-trigger.
- **QuickBooks Integration**: Ensures the internal ledger perfectly mirrors an external QuickBooks account, mapping specific internal accounts (Assets, Liabilities, Equity, Revenue, COGS, Expenses) to the corresponding QBO accounts.
