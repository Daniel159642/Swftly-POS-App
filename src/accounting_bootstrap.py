#!/usr/bin/env python3
"""
Ensures the accounting schema exists with tables and seed accounts so POS sales
can be journalized to accounting.transactions and show on the Accounting page.
Call ensure_accounting_schema() before journalizing (idempotent).

Multi-tenant: each establishment has its own scoped accounts and transactions.
- Global template accounts have establishment_id = NULL.
- Per-tenant accounts have establishment_id = <establishment_id>.
- Call ensure_establishment_accounting(establishment_id) to provision a new tenant.
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
    ('4010', 'Sales Returns & Refunds', 'Contra Revenue', 'Contra Revenue', 'debit', 'Customer returns and refunds (contra-revenue)', True),
    ('4020', 'Discounts and Allowances', 'Contra Revenue', 'Contra Revenue', 'debit', 'Discounts, coupons, and promotional allowances', True),
    ('4080', 'Third-Party Platform Fees', 'Contra Revenue', 'Contra Revenue', 'debit', 'Commissions paid to Shopify, DoorDash, etc.', False),
    ('4090', 'Loyalty Redemption Expense', 'Contra Revenue', 'Contra Revenue', 'debit', 'Points and loyalty rewards redeemed by customers', False),
    ('4100', 'Other Income', 'Other Income', 'Other Income', 'credit', 'Miscellaneous income', False),
    ('4110', 'Interest Income', 'Other Income', 'Other Income', 'credit', 'Interest income', False),
    ('4120', 'Cash Over/Short', 'Other Income', 'Other Income', 'credit', 'Net cash over or short from register counts', False),
    ('4130', 'Gift Card Breakage Income', 'Other Income', 'Other Income', 'credit', 'Expired or unredeemed gift card liability recognized as income', False),
    ('2210', 'Tips Payable', 'Liability', 'Current Liability', 'credit', 'Tips collected and owed to employees', True),
    ('2310', 'Gift Cards Liability', 'Liability', 'Current Liability', 'credit', 'Outstanding gift card balances owed to customers', False),
    ('2320', 'Store Credit – Issued', 'Liability', 'Current Liability', 'credit', 'Store credit issued via returns or promotions', False),
    ('5000', 'Cost of Goods Sold', 'COGS', 'Cost of Sales', 'debit', 'Direct costs of products sold (materials)', True),
    ('5010', 'Labor', 'COGS', 'Cost of Sales', 'debit', 'Labor cost of goods sold', False),
    ('5020', 'Overhead', 'COGS', 'Cost of Sales', 'debit', 'Overhead cost of goods sold', False),
    ('5100', 'Operating Expenses', 'Expense', 'Operating Expense', 'debit', 'General operating expenses', False),
    ('5110', 'Wages', 'Expense', 'Operating Expense', 'debit', 'Wages and salaries', False),
    ('5300', 'Inventory Write-Off', 'Expense', 'Operating Expense', 'debit', 'Write-off of damaged, spoiled, or otherwise unusable inventory', False),
    ('5310', 'Theft & Shrinkage', 'Expense', 'Operating Expense', 'debit', 'Inventory losses from theft or unexplained shrinkage', False),
    ('5120', 'Advertising', 'Expense', 'Operating Expense', 'debit', 'Advertising expense', False),
    ('5130', 'Repairs & Maintenance', 'Expense', 'Operating Expense', 'debit', 'Repairs and maintenance', False),
    ('5140', 'Travel', 'Expense', 'Operating Expense', 'debit', 'Travel expense', False),
    ('5150', 'Rent/Lease', 'Expense', 'Operating Expense', 'debit', 'Rent and lease expense', False),
    ('5160', 'Delivery/Freight Expense', 'Expense', 'Operating Expense', 'debit', 'Delivery and freight', False),
    ('5170', 'Utilities/Telephone Expenses', 'Expense', 'Operating Expense', 'debit', 'Utilities and telephone', False),
    ('5180', 'Insurance', 'Expense', 'Operating Expense', 'debit', 'Insurance expense', False),
    ('5190', 'Mileage', 'Expense', 'Operating Expense', 'debit', 'Vehicle mileage expense', False),
    ('5200', 'Office Supplies', 'Expense', 'Operating Expense', 'debit', 'Office supplies', False),
    ('5210', 'Depreciation', 'Expense', 'Operating Expense', 'debit', 'Depreciation expense', False),
    ('5220', 'Interest', 'Expense', 'Operating Expense', 'debit', 'Interest expense', False),
    ('5290', 'Other Expenses', 'Expense', 'Operating Expense', 'debit', 'Other operating expenses', False),
    ('6000', 'Tax Expense', 'Expense', 'Tax', 'debit', 'Income tax expense', False),
    # Balance sheet template accounts
    ('1350', 'Short-Term Investments', 'Asset', 'Current Asset', 'debit', 'Short-term investments', False),
    ('1450', 'Long-Term Investments', 'Asset', 'Fixed Asset', 'debit', 'Long-term investments', False),
    ('1500', 'Property, Plant and Equipment', 'Asset', 'Fixed Asset', 'debit', 'Property, plant and equipment', False),
    ('1510', 'Office Equipment', 'Asset', 'Fixed Asset', 'debit', 'Office equipment', False),
    ('1520', 'Accumulated Depreciation', 'Asset', 'Fixed Asset', 'credit', 'Less accumulated depreciation', False),
    ('1530', 'Furniture & Fixture', 'Asset', 'Fixed Asset', 'debit', 'Furniture and fixtures', False),
    ('1540', 'Computer', 'Asset', 'Fixed Asset', 'debit', 'Computer equipment', False),
    ('1550', 'Company Vehicle', 'Asset', 'Fixed Asset', 'debit', 'Company vehicles', False),
    ('1600', 'Intangible Assets', 'Asset', 'Fixed Asset', 'debit', 'Intangible assets', False),
    ('1700', 'Deferred Income Tax', 'Asset', 'Other Asset', 'debit', 'Deferred income tax asset', False),
    ('1800', 'Other Assets', 'Asset', 'Other Asset', 'debit', 'Other non-current assets', False),
    ('2020', 'Accrued Salaries and Wages', 'Liability', 'Current Liability', 'credit', 'Accrued salaries and wages', False),
    ('2050', 'Income Taxes Payable', 'Liability', 'Current Liability', 'credit', 'Income taxes payable', False),
    ('2120', 'Current Portion of Long-Term Debt', 'Liability', 'Current Liability', 'credit', 'Current portion of long-term debt', False),
    ('2300', 'Unearned Revenue', 'Liability', 'Current Liability', 'credit', 'Unearned revenue / customer deposits', False),
    ('2500', 'Long-Term Debt', 'Liability', 'Long-term Liability', 'credit', 'Long-term debt', False),
    ('2590', 'Other Long-Term Liabilities', 'Liability', 'Long-term Liability', 'credit', 'Other long-term liabilities', False),
    ('2600', 'Deferred Income Tax', 'Liability', 'Long-term Liability', 'credit', 'Deferred income tax liability', False),
    ('3100', "Owner's Investment", 'Equity', 'Equity', 'credit', "Owner's capital investment", False),
    ('3200', 'Treasury Stock', 'Equity', 'Contra Equity', 'debit', 'Repurchase of stock (treasury stock)', False),
    ('3310', 'Dividends', 'Equity', 'Equity', 'debit', 'Dividends declared and paid', False),
    ('3700', 'Other Equity', 'Equity', 'Equity', 'credit', 'Other equity', False),
    ('1400', 'Loans Receivable', 'Asset', 'Other Asset', 'debit', 'Loans made to other entities', False),
]

# ── Vertical-specific extra accounts ─────────────────────────────────────────
# These are seeded IN ADDITION to _SEED_ACCOUNTS when a specific vertical is chosen.

_VERTICAL_ACCOUNT_EXTRAS = {
    'restaurant': [
        ('4050', 'Food Revenue',     'Revenue', 'Operating Revenue', 'credit', 'Revenue from food sales',      True),
        ('4060', 'Beverage Revenue', 'Revenue', 'Operating Revenue', 'credit', 'Revenue from beverage sales',  False),
        ('4070', 'Delivery Revenue', 'Revenue', 'Operating Revenue', 'credit', 'Revenue from delivery orders', False),
        ('5050', 'Food Cost',        'COGS',    'Cost of Sales',      'debit',  'Cost of food and ingredients', True),
        ('5060', 'Beverage Cost',    'COGS',    'Cost of Sales',      'debit',  'Cost of beverages',            False),
    ],
    'retail': [],  # Base accounts already cover retail well
    'service': [
        ('4030', 'Service Revenue',      'Revenue', 'Operating Revenue', 'credit', 'Revenue from services rendered',     True),
        ('4040', 'Consulting Revenue',   'Revenue', 'Operating Revenue', 'credit', 'Revenue from consulting',            False),
        ('4045', 'Subscription Revenue', 'Revenue', 'Operating Revenue', 'credit', 'Recurring subscription revenue',    False),
    ],
}

# Per-vertical overrides to accounting_settings defaults.
# Keys match _DEFAULT_ACCOUNT_MAPPINGS; values are account numbers to use instead.
_VERTICAL_MAPPING_OVERRIDES = {
    'restaurant': {
        'sales_revenue_account_number': '4050',  # Food Revenue (more specific than 4000)
        'cogs_account_number':          '5050',  # Food Cost
    },
    'retail': {},  # No overrides; default mappings work for retail
    'service': {
        'sales_revenue_account_number': '4030',  # Service Revenue
        'cogs_account_number':          '5100',  # Operating Expenses (services have no inventory COGS)
        'inventory_account_number':     None,    # Services carry no inventory
    },
}

# ── Default posting rule JSON (used by the rule engine in pos_accounting_bridge) ──
# account_key maps to a column name in accounting.accounting_settings.
# condition tokens: is_cash | is_card | is_store_credit | has_cogs | has_tip | has_fee | None (always)
# debit/credit reference keys in the posting context dict.

_DEFAULT_POS_SALE_RULE = {
    # Revenue is recorded at GROSS (before discount) so discounts are visible as contra-revenue.
    # Context variables: net_plus_tip, gross_plus_tip, gross_subtotal, subtotal, tax, discount,
    #                    loyalty_discount, cogs, tip, fee, platform_fee
    'lines': [
        # ── Payment received ──────────────────────────────────────────────────
        {'account_key': 'cash_account_id',          'condition': 'is_cash',          'debit': 'net_plus_tip',      'description': 'Cash payment received'},
        {'account_key': 'card_clearing_account_id', 'condition': 'is_card',          'debit': 'gross_plus_tip',    'description': 'Card payment (gross, before fee deduction)'},
        {'account_key': 'store_credit_account_id',  'condition': 'is_store_credit',  'debit': 'net_plus_tip',      'description': 'Store credit redeemed'},
        {'account_key': 'gift_card_account_id',     'condition': 'is_gift_card',     'debit': 'net_plus_tip',      'description': 'Gift card redeemed'},
        # ── Revenue (recorded GROSS — before discount) ────────────────────────
        {'account_key': 'sales_revenue_account_id', 'credit': 'gross_subtotal',                                    'description': 'Gross sales revenue'},
        {'account_key': 'sales_tax_account_id',     'credit': 'tax',                                               'description': 'Sales tax collected'},
        # ── Contra-revenue (discounts break out separately) ───────────────────
        {'account_key': 'discounts_account_id',     'condition': 'has_discount',     'debit': 'discount',          'description': 'Discount / promotional allowance'},
        {'account_key': 'loyalty_expense_account_id','condition': 'has_loyalty',     'debit': 'loyalty_discount',  'description': 'Loyalty points redeemed'},
        # ── Third-party platform commission (Shopify, DoorDash, etc.) ─────────
        {'account_key': 'platform_fees_account_id', 'condition': 'has_platform_fee', 'debit': 'platform_fee',      'description': 'Third-party platform commission'},
        # ── COGS / Inventory ──────────────────────────────────────────────────
        {'account_key': 'cogs_account_id',          'condition': 'has_cogs',         'debit': 'cogs',              'description': 'Cost of goods sold'},
        {'account_key': 'inventory_account_id',     'condition': 'has_cogs',         'credit': 'cogs',             'description': 'Inventory reduction'},
        # ── Tips ──────────────────────────────────────────────────────────────
        {'account_key': 'tips_payable_account_id',  'condition': 'has_tip',          'credit': 'tip',              'description': 'Tip collected (owed to employee)'},
        # ── Processor fee (card only) ─────────────────────────────────────────
        {'account_key': 'processor_fees_account_id','condition': 'has_fee',          'debit': 'fee',               'description': 'Card processing fee'},
    ]
}

_DEFAULT_VOID_RULE = {
    'lines': [
        # Exact reversal of _DEFAULT_POS_SALE_RULE
        {'account_key': 'cash_account_id',           'condition': 'is_cash',          'credit': 'net_plus_tip',     'description': 'Void – cash reversed'},
        {'account_key': 'card_clearing_account_id',  'condition': 'is_card',          'credit': 'gross_plus_tip',   'description': 'Void – card reversed'},
        {'account_key': 'store_credit_account_id',   'condition': 'is_store_credit',  'credit': 'net_plus_tip',     'description': 'Void – store credit reversed'},
        {'account_key': 'gift_card_account_id',      'condition': 'is_gift_card',     'credit': 'net_plus_tip',     'description': 'Void – gift card reversed'},
        {'account_key': 'sales_revenue_account_id',  'debit': 'gross_subtotal',                                     'description': 'Void – gross revenue reversed'},
        {'account_key': 'sales_tax_account_id',      'debit': 'tax',                                                'description': 'Void – tax reversed'},
        {'account_key': 'discounts_account_id',      'condition': 'has_discount',     'credit': 'discount',         'description': 'Void – discount reversed'},
        {'account_key': 'loyalty_expense_account_id','condition': 'has_loyalty',      'credit': 'loyalty_discount', 'description': 'Void – loyalty redemption reversed'},
        {'account_key': 'platform_fees_account_id',  'condition': 'has_platform_fee', 'credit': 'platform_fee',     'description': 'Void – platform fee reversed'},
        {'account_key': 'cogs_account_id',           'condition': 'has_cogs',         'credit': 'cogs',             'description': 'Void – COGS reversed'},
        {'account_key': 'inventory_account_id',      'condition': 'has_cogs',         'debit': 'cogs',              'description': 'Void – inventory restored'},
        {'account_key': 'tips_payable_account_id',   'condition': 'has_tip',          'debit': 'tip',               'description': 'Void – tip liability reversed'},
        {'account_key': 'processor_fees_account_id', 'condition': 'has_fee',          'credit': 'fee',              'description': 'Void – processing fee reversed'},
    ]
}

# Default account number mappings for accounting_settings
_DEFAULT_ACCOUNT_MAPPINGS = {
    'sales_revenue_account_number':   '4000',
    'discounts_account_number':        '4020',
    'returns_account_number':          '4010',
    'cogs_account_number':             '5000',
    'inventory_account_number':        '1200',
    'processor_fees_account_number':   '5290',
    'tips_payable_account_number':     '2210',   # Tips Payable (owed to employees)
    'tips_expense_account_number':     '5290',
    'sales_tax_account_number':        '2040',
    'cash_account_number':             '1000',
    'card_clearing_account_number':    '1100',
    'store_credit_account_number':     '2110',
    'accounts_payable_account_number': '2000',
    # New mappings for previously missing events
    'gift_card_account_number':        '2310',   # Gift Cards Liability
    'loyalty_expense_account_number':  '4090',   # Loyalty Redemption Expense
    'platform_fees_account_number':    '4080',   # Third-Party Platform Fees (Shopify, DoorDash)
    'inventory_writeoff_account_number': '5300', # Inventory Write-Off (damaged/spoiled)
    'theft_account_number':            '5310',   # Theft & Shrinkage
    'cash_over_short_account_number':  '4120',   # Cash Over/Short
}


def _seed_accounts(cur, establishment_id=None) -> None:
    """Insert seed chart of accounts (idempotent).
    establishment_id=None seeds global template accounts (shared across tenants).
    Pass an establishment_id to seed tenant-specific accounts.
    """
    if establishment_id is None:
        # Global templates: use partial unique index on (account_number) WHERE establishment_id IS NULL
        sql = """
            INSERT INTO accounting.accounts (account_number, account_name, account_type, sub_type, balance_type, description, is_system_account, establishment_id)
            VALUES (%s, %s, %s, %s, %s, %s, %s, NULL)
            ON CONFLICT (account_number) WHERE establishment_id IS NULL DO NOTHING
        """
        for row in _SEED_ACCOUNTS:
            cur.execute(sql, row)
    else:
        # Tenant-specific: copy from global templates if this tenant has no accounts yet
        cur.execute(
            "SELECT COUNT(*) FROM accounting.accounts WHERE establishment_id = %s",
            (establishment_id,)
        )
        row = cur.fetchone()
        count = row[0] if row else 0
        if count > 0:
            return  # Already seeded for this tenant

        sql = """
            INSERT INTO accounting.accounts (account_number, account_name, account_type, sub_type, balance_type, description, is_system_account, establishment_id)
            VALUES (%s, %s, %s, %s, %s, %s, %s, %s)
            ON CONFLICT (account_number, establishment_id) DO NOTHING
        """
        for acct_row in _SEED_ACCOUNTS:
            cur.execute(sql, acct_row + (establishment_id,))


def _seed_vertical_accounts(cur, establishment_id: int, vertical: str) -> None:
    """Seed vertical-specific extra accounts for a tenant. Idempotent."""
    extras = _VERTICAL_ACCOUNT_EXTRAS.get(vertical, [])
    if not extras:
        return
    sql = """
        INSERT INTO accounting.accounts
            (account_number, account_name, account_type, sub_type, balance_type, description, is_system_account, establishment_id)
        VALUES (%s, %s, %s, %s, %s, %s, %s, %s)
        ON CONFLICT (account_number, establishment_id) DO NOTHING
    """
    for row in extras:
        cur.execute(sql, row + (establishment_id,))


def _seed_posting_rules(cur, establishment_id=None, vertical: str = 'retail') -> None:
    """Insert default posting rules for an establishment (or global if establishment_id is None).
    Idempotent via ON CONFLICT DO NOTHING.
    """
    import json
    rules = [
        ('pos_sale', _DEFAULT_POS_SALE_RULE),
        ('pos_void', _DEFAULT_VOID_RULE),
    ]
    if establishment_id is None:
        # Global defaults
        for event_type, rule_json in rules:
            cur.execute("""
                INSERT INTO accounting.posting_rules (establishment_id, event_type, rule_json)
                VALUES (NULL, %s, %s)
                ON CONFLICT (event_type) WHERE establishment_id IS NULL DO NOTHING
            """, (event_type, json.dumps(rule_json)))
    else:
        for event_type, rule_json in rules:
            cur.execute("""
                INSERT INTO accounting.posting_rules (establishment_id, event_type, rule_json)
                VALUES (%s, %s, %s)
                ON CONFLICT (establishment_id, event_type) WHERE establishment_id IS NOT NULL DO NOTHING
            """, (establishment_id, event_type, json.dumps(rule_json)))


def _run_migrations(cur) -> None:
    """Idempotent migrations: add establishment_id and accounting_settings to existing schema."""

    # ── accounts ──────────────────────────────────────────────────────────────
    cur.execute("""
        ALTER TABLE accounting.accounts
        ADD COLUMN IF NOT EXISTS establishment_id INTEGER
            REFERENCES public.establishments(establishment_id) ON DELETE CASCADE
    """)

    # Drop old single-column unique constraint (replaced by two partial indexes)
    cur.execute("""
        ALTER TABLE accounting.accounts
        DROP CONSTRAINT IF EXISTS accounts_account_number_key
    """)

    # Drop restrictive account_type check constraint so "Contra Revenue" is allowed
    cur.execute("""
        ALTER TABLE accounting.accounts
        DROP CONSTRAINT IF EXISTS accounts_account_type_check
    """)

    # Partial unique index: one row per account_number for global templates
    cur.execute("""
        CREATE UNIQUE INDEX IF NOT EXISTS idx_acc_acct_num_global
        ON accounting.accounts(account_number)
        WHERE establishment_id IS NULL
    """)
    # Partial unique index: one row per (account_number, establishment) for tenants
    cur.execute("""
        CREATE UNIQUE INDEX IF NOT EXISTS idx_acc_acct_num_tenant
        ON accounting.accounts(account_number, establishment_id)
        WHERE establishment_id IS NOT NULL
    """)
    cur.execute("""
        CREATE INDEX IF NOT EXISTS idx_acc_establishment
        ON accounting.accounts(establishment_id)
    """)

    # ── transactions ──────────────────────────────────────────────────────────
    cur.execute("""
        ALTER TABLE accounting.transactions
        ADD COLUMN IF NOT EXISTS establishment_id INTEGER
            REFERENCES public.establishments(establishment_id) ON DELETE CASCADE
    """)

    # Drop old single-column unique constraint on transaction_number
    cur.execute("""
        ALTER TABLE accounting.transactions
        DROP CONSTRAINT IF EXISTS transactions_transaction_number_key
    """)

    cur.execute("""
        CREATE UNIQUE INDEX IF NOT EXISTS idx_acc_txn_num_global
        ON accounting.transactions(transaction_number)
        WHERE establishment_id IS NULL
    """)
    cur.execute("""
        CREATE UNIQUE INDEX IF NOT EXISTS idx_acc_txn_num_tenant
        ON accounting.transactions(transaction_number, establishment_id)
        WHERE establishment_id IS NOT NULL
    """)
    cur.execute("""
        CREATE INDEX IF NOT EXISTS idx_acc_txn_establishment
        ON accounting.transactions(establishment_id)
    """)

    # ── transaction_lines ─────────────────────────────────────────────────────
    # Denormalized for fast per-tenant ledger queries without joining transactions
    cur.execute("""
        ALTER TABLE accounting.transaction_lines
        ADD COLUMN IF NOT EXISTS establishment_id INTEGER
            REFERENCES public.establishments(establishment_id) ON DELETE CASCADE
    """)
    cur.execute("""
        CREATE INDEX IF NOT EXISTS idx_acc_txl_establishment
        ON accounting.transaction_lines(establishment_id, account_id)
    """)
    cur.execute("""
        CREATE INDEX IF NOT EXISTS idx_acc_txl_establishment_date
        ON accounting.transaction_lines(establishment_id)
    """)

    # ── performance indexes ───────────────────────────────────────────────────
    # Composite index for date-range ledger queries scoped by tenant + account
    cur.execute("""
        CREATE INDEX IF NOT EXISTS idx_acc_txl_est_date_acct
        ON accounting.transaction_lines(establishment_id, account_id)
        INCLUDE (debit_amount, credit_amount)
    """)
    # Index for date-range scans on the transactions header
    cur.execute("""
        CREATE INDEX IF NOT EXISTS idx_acc_txn_est_date
        ON accounting.transactions(establishment_id, transaction_date)
        WHERE is_posted = TRUE AND is_void = FALSE
    """)
    # Index for account lookups by type within a tenant
    cur.execute("""
        CREATE INDEX IF NOT EXISTS idx_acc_acct_est_type
        ON accounting.accounts(establishment_id, account_type)
    """)

    # ── accounting_settings ───────────────────────────────────────────────────
    cur.execute("""
        CREATE TABLE IF NOT EXISTS accounting.accounting_settings (
            id SERIAL PRIMARY KEY,
            establishment_id INTEGER NOT NULL
                REFERENCES public.establishments(establishment_id) ON DELETE CASCADE,
            sales_revenue_account_id  INTEGER REFERENCES accounting.accounts(id),
            discounts_account_id      INTEGER REFERENCES accounting.accounts(id),
            returns_account_id        INTEGER REFERENCES accounting.accounts(id),
            cogs_account_id           INTEGER REFERENCES accounting.accounts(id),
            inventory_account_id      INTEGER REFERENCES accounting.accounts(id),
            processor_fees_account_id INTEGER REFERENCES accounting.accounts(id),
            tips_payable_account_id   INTEGER REFERENCES accounting.accounts(id),
            tips_expense_account_id   INTEGER REFERENCES accounting.accounts(id),
            sales_tax_account_id      INTEGER REFERENCES accounting.accounts(id),
            cash_account_id           INTEGER REFERENCES accounting.accounts(id),
            card_clearing_account_id  INTEGER REFERENCES accounting.accounts(id),
            store_credit_account_id   INTEGER REFERENCES accounting.accounts(id),
            accounts_payable_account_id INTEGER REFERENCES accounting.accounts(id),
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            UNIQUE (establishment_id)
        )
    """)
    cur.execute("""
        CREATE INDEX IF NOT EXISTS idx_acc_settings_establishment
        ON accounting.accounting_settings(establishment_id)
    """)
    # Add vertical column to accounting_settings (idempotent)
    cur.execute("""
        ALTER TABLE accounting.accounting_settings
        ADD COLUMN IF NOT EXISTS vertical VARCHAR(50) DEFAULT 'retail'
    """)
    # Add new account mapping columns for previously-missing event types
    for col in (
        'gift_card_account_id',
        'loyalty_expense_account_id',
        'platform_fees_account_id',
        'inventory_writeoff_account_id',
        'theft_account_id',
        'cash_over_short_account_id',
    ):
        cur.execute(f"""
            ALTER TABLE accounting.accounting_settings
            ADD COLUMN IF NOT EXISTS {col} INTEGER REFERENCES accounting.accounts(id)
        """)

    # ── posting_rules ─────────────────────────────────────────────────────────
    # Stores JSON posting rule templates per event_type per tenant.
    # establishment_id = NULL means global default (used as fallback for any tenant).
    cur.execute("""
        CREATE TABLE IF NOT EXISTS accounting.posting_rules (
            id                SERIAL PRIMARY KEY,
            establishment_id  INTEGER REFERENCES public.establishments(establishment_id) ON DELETE CASCADE,
            event_type        VARCHAR(50) NOT NULL,
            rule_json         JSONB NOT NULL,
            is_active         BOOLEAN DEFAULT TRUE,
            created_at        TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            updated_at        TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
    """)
    # Unique: one active rule per (establishment, event). Global defaults use NULL establishment.
    cur.execute("""
        CREATE UNIQUE INDEX IF NOT EXISTS idx_posting_rules_tenant_event
        ON accounting.posting_rules(establishment_id, event_type)
        WHERE establishment_id IS NOT NULL
    """)
    cur.execute("""
        CREATE UNIQUE INDEX IF NOT EXISTS idx_posting_rules_global_event
        ON accounting.posting_rules(event_type)
        WHERE establishment_id IS NULL
    """)
    cur.execute("""
        CREATE INDEX IF NOT EXISTS idx_posting_rules_establishment
        ON accounting.posting_rules(establishment_id)
    """)


def _get_conn():
    """Use same connection as rest of app."""
    sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
    from src.database import get_connection
    return get_connection()


def ensure_accounting_schema() -> bool:
    """
    Create accounting schema, tables, and seed global template accounts if they don't exist.
    Also runs idempotent migrations to add establishment_id support to existing tables.
    Returns True if ready.
    """
    global _ACCOUNTING_SCHEMA_CHECKED
    if _ACCOUNTING_SCHEMA_CHECKED:
        return True
    conn = None
    try:
        conn = _get_conn()
        cur = conn.cursor()

        # Check whether the core tables exist
        cur.execute("""
            SELECT 1 FROM information_schema.tables
            WHERE table_schema = 'accounting' AND table_name = 'transactions'
        """)
        tables_exist = cur.fetchone() is not None

        if not tables_exist:
            # ── Create schema and base tables ──────────────────────────────
            cur.execute("CREATE SCHEMA IF NOT EXISTS accounting")

            cur.execute("""
                CREATE TABLE IF NOT EXISTS accounting.accounts (
                    id SERIAL PRIMARY KEY,
                    account_number VARCHAR(20),
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
                    updated_by INTEGER,
                    qbo_id VARCHAR(255),
                    establishment_id INTEGER
                        REFERENCES public.establishments(establishment_id) ON DELETE CASCADE
                )
            """)
            cur.execute("CREATE INDEX IF NOT EXISTS idx_acc_account_type ON accounting.accounts(account_type)")
            cur.execute("CREATE INDEX IF NOT EXISTS idx_acc_establishment ON accounting.accounts(establishment_id)")

            cur.execute("""
                CREATE TABLE IF NOT EXISTS accounting.transactions (
                    id SERIAL PRIMARY KEY,
                    transaction_number VARCHAR(50) NOT NULL DEFAULT '',
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
                    updated_by INTEGER,
                    qbo_id VARCHAR(255),
                    establishment_id INTEGER
                        REFERENCES public.establishments(establishment_id) ON DELETE CASCADE
                )
            """)
            cur.execute("CREATE INDEX IF NOT EXISTS idx_acc_txn_date ON accounting.transactions(transaction_date)")
            cur.execute("CREATE INDEX IF NOT EXISTS idx_acc_txn_posted ON accounting.transactions(is_posted)")
            cur.execute("CREATE INDEX IF NOT EXISTS idx_acc_txn_establishment ON accounting.transactions(establishment_id)")

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
                    establishment_id INTEGER
                        REFERENCES public.establishments(establishment_id) ON DELETE CASCADE,
                    CONSTRAINT chk_debit_credit_excl CHECK (
                        (debit_amount > 0 AND credit_amount = 0) OR (debit_amount = 0 AND credit_amount > 0)
                    )
                )
            """)
            cur.execute("CREATE INDEX IF NOT EXISTS idx_acc_txl_txn ON accounting.transaction_lines(transaction_id)")
            cur.execute("CREATE INDEX IF NOT EXISTS idx_acc_txl_account ON accounting.transaction_lines(account_id)")
            cur.execute("CREATE INDEX IF NOT EXISTS idx_acc_txl_establishment ON accounting.transaction_lines(establishment_id, account_id)")

            cur.execute("CREATE SEQUENCE IF NOT EXISTS accounting.transaction_number_seq")

        # ── Always run idempotent migrations (handles upgrades of existing schema) ──
        _run_migrations(cur)

        # ── Seed global template accounts (establishment_id = NULL) ──
        _seed_accounts(cur, establishment_id=None)

        # ── Seed global default posting rules ──
        _seed_posting_rules(cur, establishment_id=None)

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


def ensure_establishment_accounting(establishment_id: int, vertical: str = 'retail') -> bool:
    """
    Provision accounting for a specific establishment:
    1. Copies global template accounts into the tenant's own account rows.
    2. Seeds vertical-specific extra accounts (restaurant/service/retail).
    3. Creates an accounting_settings row with default + vertical-overridden account IDs.
    4. Seeds tenant posting rules from global defaults.

    Idempotent: safe to call on every login or establishment switch.
    """
    if not establishment_id:
        return False

    ensure_accounting_schema()  # Make sure base schema is ready

    conn = None
    try:
        conn = _get_conn()
        cur = conn.cursor()

        # 1. Seed base tenant accounts (no-op if already seeded)
        _seed_accounts(cur, establishment_id=establishment_id)

        # 2. Seed vertical-specific extra accounts
        _seed_vertical_accounts(cur, establishment_id, vertical)

        # 3. Build effective account number mappings (base + vertical overrides)
        effective_mappings = dict(_DEFAULT_ACCOUNT_MAPPINGS)
        overrides = _VERTICAL_MAPPING_OVERRIDES.get(vertical, {})
        effective_mappings.update(overrides)

        # 4. Create accounting_settings if not exists
        cur.execute(
            "SELECT id FROM accounting.accounting_settings WHERE establishment_id = %s",
            (establishment_id,)
        )
        settings_row = cur.fetchone()

        def get_acct_id(account_number) -> 'int | None':
            """Resolve account number → id for this tenant (prefer tenant, fall back to global)."""
            if account_number is None:
                return None
            cur.execute(
                """SELECT id FROM accounting.accounts
                   WHERE account_number = %s AND establishment_id = %s
                   LIMIT 1""",
                (account_number, establishment_id)
            )
            row = cur.fetchone()
            if row:
                return row[0]
            cur.execute(
                """SELECT id FROM accounting.accounts
                   WHERE account_number = %s AND establishment_id IS NULL
                   LIMIT 1""",
                (account_number,)
            )
            row = cur.fetchone()
            return row[0] if row else None

        if settings_row is None:
            cur.execute("""
                INSERT INTO accounting.accounting_settings (
                    establishment_id,
                    sales_revenue_account_id,
                    discounts_account_id,
                    returns_account_id,
                    cogs_account_id,
                    inventory_account_id,
                    processor_fees_account_id,
                    tips_payable_account_id,
                    tips_expense_account_id,
                    sales_tax_account_id,
                    cash_account_id,
                    card_clearing_account_id,
                    store_credit_account_id,
                    accounts_payable_account_id,
                    gift_card_account_id,
                    loyalty_expense_account_id,
                    platform_fees_account_id,
                    inventory_writeoff_account_id,
                    theft_account_id,
                    cash_over_short_account_id,
                    vertical
                ) VALUES (%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s)
                ON CONFLICT (establishment_id) DO NOTHING
            """, (
                establishment_id,
                get_acct_id(effective_mappings['sales_revenue_account_number']),
                get_acct_id(effective_mappings['discounts_account_number']),
                get_acct_id(effective_mappings['returns_account_number']),
                get_acct_id(effective_mappings['cogs_account_number']),
                get_acct_id(effective_mappings['inventory_account_number']),
                get_acct_id(effective_mappings['processor_fees_account_number']),
                get_acct_id(effective_mappings['tips_payable_account_number']),
                get_acct_id(effective_mappings['tips_expense_account_number']),
                get_acct_id(effective_mappings['sales_tax_account_number']),
                get_acct_id(effective_mappings['cash_account_number']),
                get_acct_id(effective_mappings['card_clearing_account_number']),
                get_acct_id(effective_mappings['store_credit_account_number']),
                get_acct_id(effective_mappings['accounts_payable_account_number']),
                get_acct_id(effective_mappings['gift_card_account_number']),
                get_acct_id(effective_mappings['loyalty_expense_account_number']),
                get_acct_id(effective_mappings['platform_fees_account_number']),
                get_acct_id(effective_mappings['inventory_writeoff_account_number']),
                get_acct_id(effective_mappings['theft_account_number']),
                get_acct_id(effective_mappings['cash_over_short_account_number']),
                vertical,
            ))
        else:
            # Settings exist — update vertical column in case it changed
            cur.execute(
                "UPDATE accounting.accounting_settings SET vertical = %s WHERE establishment_id = %s",
                (vertical, establishment_id)
            )

        # 5. Seed tenant posting rules (no-op if already seeded)
        _seed_posting_rules(cur, establishment_id=establishment_id, vertical=vertical)

        conn.commit()
        conn.close()
        return True
    except Exception as e:
        if conn and not conn.closed:
            try:
                conn.rollback()
                conn.close()
            except Exception:
                pass
        print(f"ensure_establishment_accounting({establishment_id}) failed: {e}")
        import traceback
        traceback.print_exc()
        return False


def set_establishment_vertical(establishment_id: int, vertical: str) -> bool:
    """
    Update the vertical for an existing establishment and re-seed vertical-specific
    accounts + posting rules. Idempotent.

    vertical: 'restaurant' | 'retail' | 'service'
    Returns True on success.
    """
    if not establishment_id:
        return False
    if vertical not in _VERTICAL_ACCOUNT_EXTRAS:
        print(f"set_establishment_vertical: unknown vertical '{vertical}'")
        return False

    conn = None
    try:
        conn = _get_conn()
        cur = conn.cursor()

        # Seed any new vertical accounts
        _seed_vertical_accounts(cur, establishment_id, vertical)

        # Build effective mappings with vertical overrides
        effective_mappings = dict(_DEFAULT_ACCOUNT_MAPPINGS)
        effective_mappings.update(_VERTICAL_MAPPING_OVERRIDES.get(vertical, {}))

        def get_acct_id(account_number) -> 'int | None':
            if account_number is None:
                return None
            cur.execute(
                """SELECT id FROM accounting.accounts
                   WHERE account_number = %s AND establishment_id = %s
                   LIMIT 1""",
                (account_number, establishment_id)
            )
            row = cur.fetchone()
            if row:
                return row[0]
            cur.execute(
                """SELECT id FROM accounting.accounts
                   WHERE account_number = %s AND establishment_id IS NULL
                   LIMIT 1""",
                (account_number,)
            )
            row = cur.fetchone()
            return row[0] if row else None

        # Update accounting_settings with new account IDs + vertical
        cur.execute("""
            UPDATE accounting.accounting_settings SET
                sales_revenue_account_id  = %s,
                cogs_account_id           = %s,
                inventory_account_id      = %s,
                vertical                  = %s,
                updated_at                = CURRENT_TIMESTAMP
            WHERE establishment_id = %s
        """, (
            get_acct_id(effective_mappings['sales_revenue_account_number']),
            get_acct_id(effective_mappings['cogs_account_number']),
            get_acct_id(effective_mappings['inventory_account_number']),
            vertical,
            establishment_id,
        ))

        # Upsert posting rules for new vertical
        import json
        rules = [
            ('pos_sale', _DEFAULT_POS_SALE_RULE),
            ('pos_void', _DEFAULT_VOID_RULE),
        ]
        for event_type, rule_json in rules:
            cur.execute("""
                INSERT INTO accounting.posting_rules (establishment_id, event_type, rule_json)
                VALUES (%s, %s, %s)
                ON CONFLICT (establishment_id, event_type) WHERE establishment_id IS NOT NULL
                DO UPDATE SET rule_json = EXCLUDED.rule_json, updated_at = CURRENT_TIMESTAMP
            """, (establishment_id, event_type, json.dumps(rule_json)))

        conn.commit()
        conn.close()
        return True
    except Exception as e:
        if conn and not conn.closed:
            try:
                conn.rollback()
                conn.close()
            except Exception:
                pass
        print(f"set_establishment_vertical({establishment_id}, {vertical}) failed: {e}")
        import traceback
        traceback.print_exc()
        return False


def get_accounting_settings(establishment_id: int) -> dict:
    """
    Return the accounting_settings row for an establishment as a dict.
    Falls back to None values if not provisioned yet.
    """
    ensure_establishment_accounting(establishment_id)
    conn = None
    try:
        from psycopg2.extras import RealDictCursor
        conn = _get_conn()
        cur = conn.cursor(cursor_factory=RealDictCursor)
        cur.execute(
            "SELECT * FROM accounting.accounting_settings WHERE establishment_id = %s",
            (establishment_id,)
        )
        row = cur.fetchone()
        conn.close()
        return dict(row) if row else {}
    except Exception as e:
        if conn and not conn.closed:
            try:
                conn.close()
            except Exception:
                pass
        print(f"get_accounting_settings({establishment_id}) failed: {e}")
        return {}
