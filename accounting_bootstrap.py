#!/usr/bin/env python3
"""
Ensures the accounting schema exists with tables and seed accounts so POS sales
can be journalized to accounting.transactions and show on the Accounting page.
Call ensure_accounting_schema() before journalizing (idempotent).
"""
import os
import sys

_ACCOUNTING_SCHEMA_CHECKED = False

_SEED_ACCOUNTS = [
    ('1000', 'Cash', 'Asset', 'Current Asset', 'debit', 'Cash on hand and in bank accounts', True),
    ('1010', 'Petty Cash', 'Asset', 'Current Asset', 'debit', 'Small cash fund', False),
    ('1020', 'Checking Account', 'Asset', 'Current Asset', 'debit', 'Primary business checking', True),
    ('1100', 'Accounts Receivable', 'Asset', 'Current Asset', 'debit', 'Amounts owed by customers', True),
    ('1200', 'Inventory', 'Asset', 'Current Asset', 'debit', 'Merchandise for sale', True),
    ('1300', 'Prepaid Expenses', 'Asset', 'Current Asset', 'debit', 'Prepaid insurance, rent', False),
    ('2000', 'Accounts Payable', 'Liability', 'Current Liability', 'credit', 'Amounts owed to vendors', True),
    ('2040', 'Sales Tax Payable', 'Liability', 'Current Liability', 'credit', 'Sales tax collected and owed', True),
    ('2100', 'Short-term Loans', 'Liability', 'Current Liability', 'credit', 'Short-term loans', False),
    ('2110', 'Store Credit Liability', 'Liability', 'Current Liability', 'credit', 'Store credit owed to customers', False),
    ('3000', "Owner's Equity", 'Equity', 'Equity', 'credit', 'Owner capital investment', True),
    ('3300', 'Retained Earnings', 'Equity', 'Equity', 'credit', 'Accumulated profits', True),
    ('4000', 'Sales Revenue', 'Revenue', 'Operating Revenue', 'credit', 'Revenue from product sales', True),
    ('4100', 'Other Income', 'Other Income', 'Other Income', 'credit', 'Miscellaneous income', False),
    ('5000', 'Cost of Goods Sold', 'COGS', 'Cost of Sales', 'debit', 'Direct costs of products sold', True),
    ('5100', 'Operating Expenses', 'Expense', 'Operating Expense', 'debit', 'General operating expenses', False),
]


def _seed_accounts(cur) -> None:
    """Insert seed chart of accounts (idempotent)."""
    sql = """
        INSERT INTO accounting.accounts (account_number, account_name, account_type, sub_type, balance_type, description, is_system_account)
        VALUES (%s, %s, %s, %s, %s, %s, %s)
        ON CONFLICT (account_number) DO NOTHING
    """
    for row in _SEED_ACCOUNTS:
        cur.execute(sql, row)


def _get_conn():
    """Use same connection as rest of app."""
    sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
    from database import get_connection
    return get_connection()


def ensure_accounting_schema() -> bool:
    """
    Create accounting schema, tables, and seed accounts if they don't exist.
    Idempotent; safe to call on every journalize. Returns True if ready.
    """
    global _ACCOUNTING_SCHEMA_CHECKED
    conn = None
    try:
        conn = _get_conn()
        cur = conn.cursor()
        cur.execute("""
            SELECT 1 FROM information_schema.tables
            WHERE table_schema = 'accounting' AND table_name = 'transactions'
        """)
        tables_exist = cur.fetchone() is not None
        if tables_exist:
            # Ensure seed accounts exist (e.g. 2110 Store Credit may be missing)
            _seed_accounts(cur)
            conn.commit()
            conn.close()
            _ACCOUNTING_SCHEMA_CHECKED = True
            return True

        # Create schema and tables
        cur.execute("CREATE SCHEMA IF NOT EXISTS accounting")

        cur.execute("""
            CREATE TABLE IF NOT EXISTS accounting.accounts (
                id SERIAL PRIMARY KEY,
                account_number VARCHAR(20) UNIQUE,
                account_name VARCHAR(255) NOT NULL,
                account_type VARCHAR(50) NOT NULL,
                sub_type VARCHAR(100),
                parent_account_id INTEGER REFERENCES accounting.accounts(id) ON DELETE SET NULL,
                balance_type VARCHAR(10) NOT NULL CHECK (balance_type IN ('debit', 'credit')),
                description TEXT,
                is_active BOOLEAN DEFAULT TRUE,
                is_system_account BOOLEAN DEFAULT FALSE,
                tax_line_id INTEGER,
                opening_balance DECIMAL(19,4) DEFAULT 0,
                opening_balance_date DATE,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                created_by INTEGER,
                updated_by INTEGER
            )
        """)
        cur.execute("CREATE INDEX IF NOT EXISTS idx_acc_account_type ON accounting.accounts(account_type)")
        cur.execute("CREATE INDEX IF NOT EXISTS idx_acc_number ON accounting.accounts(account_number)")

        cur.execute("""
            CREATE TABLE IF NOT EXISTS accounting.transactions (
                id SERIAL PRIMARY KEY,
                transaction_number VARCHAR(50) UNIQUE NOT NULL DEFAULT '',
                transaction_date DATE NOT NULL,
                transaction_type VARCHAR(50) NOT NULL,
                reference_number VARCHAR(100),
                description TEXT,
                source_document_id INTEGER,
                source_document_type VARCHAR(50),
                is_posted BOOLEAN DEFAULT FALSE,
                is_void BOOLEAN DEFAULT FALSE,
                void_date DATE,
                void_reason TEXT,
                reconciliation_status VARCHAR(20) DEFAULT 'unreconciled',
                reconciled_date DATE,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                created_by INTEGER,
                updated_by INTEGER
            )
        """)
        cur.execute("CREATE INDEX IF NOT EXISTS idx_acc_txn_date ON accounting.transactions(transaction_date)")
        cur.execute("CREATE INDEX IF NOT EXISTS idx_acc_txn_posted ON accounting.transactions(is_posted)")
        cur.execute("CREATE INDEX IF NOT EXISTS idx_acc_txn_number ON accounting.transactions(transaction_number)")

        cur.execute("""
            CREATE TABLE IF NOT EXISTS accounting.transaction_lines (
                id SERIAL PRIMARY KEY,
                transaction_id INTEGER NOT NULL REFERENCES accounting.transactions(id) ON DELETE CASCADE,
                account_id INTEGER NOT NULL REFERENCES accounting.accounts(id),
                line_number INTEGER NOT NULL,
                debit_amount DECIMAL(19,4) DEFAULT 0 CHECK (debit_amount >= 0),
                credit_amount DECIMAL(19,4) DEFAULT 0 CHECK (credit_amount >= 0),
                description TEXT,
                entity_type VARCHAR(50),
                entity_id INTEGER,
                class_id INTEGER,
                location_id INTEGER,
                billable BOOLEAN DEFAULT FALSE,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                CONSTRAINT chk_debit_credit_excl CHECK (
                    (debit_amount > 0 AND credit_amount = 0) OR (debit_amount = 0 AND credit_amount > 0)
                )
            )
        """)
        cur.execute("CREATE INDEX IF NOT EXISTS idx_acc_txl_txn ON accounting.transaction_lines(transaction_id)")
        cur.execute("CREATE INDEX IF NOT EXISTS idx_acc_txl_account ON accounting.transaction_lines(account_id)")

        cur.execute("CREATE SEQUENCE IF NOT EXISTS accounting.transaction_number_seq")

        _seed_accounts(cur)
        conn.commit()
        conn.close()
        _ACCOUNTING_SCHEMA_CHECKED = True
        return True
    except Exception as e:
        if conn and not conn.closed:
            try:
                conn.rollback()
                conn.close()
            except Exception:
                pass
        print(f"Accounting bootstrap failed: {e}")
        import traceback
        traceback.print_exc()
        return False
