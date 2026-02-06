#!/usr/bin/env python3
"""Run migration add_store_credit_functional.sql (payment_transactions notes/amount_remaining, customers store_credit_balance)."""
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
        from database_postgres import get_connection
    except ImportError:
        print("Error: Could not import database_postgres. Run this script from the pos directory.")
        sys.exit(1)

    migration_path = os.path.join(os.path.dirname(__file__), 'migrations', 'add_store_credit_functional.sql')
    with open(migration_path, 'r') as f:
        sql = f.read()
    conn = get_connection()
    conn.autocommit = True
    cur = conn.cursor()
    cur.execute(sql)
    cur.close()
    conn.close()
    print("Migration add_store_credit_functional.sql applied.")

if __name__ == '__main__':
    main()
