#!/usr/bin/env python3
"""
Run migration: add exchange_transaction_id to pending_returns and exchange_return_id to orders.
Required for exchange flow (exchange completion receipt).

Usage (from pos directory, same env as backend):
  python run_add_exchange_flow_columns.py
"""
import os
import sys

try:
    from dotenv import load_dotenv
    load_dotenv()
except ImportError:
    pass

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))


def main():
    try:
        from database import get_connection
    except ImportError:
        try:
            from database_postgres import get_connection
        except ImportError:
            print("Error: Could not import database or database_postgres. Run from pos directory.")
            sys.exit(1)

    migration_path = os.path.join(os.path.dirname(__file__), 'migrations', 'add_exchange_flow_columns.sql')
    with open(migration_path) as f:
        sql = f.read()

    try:
        conn = get_connection()
        conn.autocommit = True
        cur = conn.cursor()
        # Run only the ALTER TABLE statements (COMMENT can fail if column not visible yet)
        cur.execute("""
            ALTER TABLE pending_returns
            ADD COLUMN IF NOT EXISTS exchange_transaction_id INTEGER NULL
        """)
        cur.execute("""
            ALTER TABLE orders
            ADD COLUMN IF NOT EXISTS exchange_return_id INTEGER NULL
        """)
        cur.close()
        conn.close()
        print("OK: exchange flow columns added (pending_returns.exchange_transaction_id, orders.exchange_return_id).")
    except Exception as e:
        print(f"Error: {e}")
        sys.exit(1)


if __name__ == '__main__':
    main()
