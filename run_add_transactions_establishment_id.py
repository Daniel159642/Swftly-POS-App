#!/usr/bin/env python3
"""
Run migration: add establishment_id to transactions table if missing.
Fixes: column "establishment_id" of relation "transactions" does not exist
(when paying through POS /api/transaction/start)

Usage: from pos directory (with .env or DB_* set):
  python run_add_transactions_establishment_id.py
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
        from database_postgres import get_connection
    except ImportError:
        print("Error: Could not import database_postgres. Run this script from the pos directory.")
        sys.exit(1)

    migration_dir = os.path.join(os.path.dirname(os.path.abspath(__file__)), 'migrations')
    sql_path = os.path.join(migration_dir, 'add_transactions_establishment_id_postgres.sql')
    if not os.path.isfile(sql_path):
        print(f"Error: Migration file not found: {sql_path}")
        sys.exit(1)

    conn = None
    try:
        conn = get_connection()
        conn.autocommit = False
        cur = conn.cursor()
        with open(sql_path, 'r') as f:
            cur.execute(f.read())
        conn.commit()
        print("Migration completed: transactions.establishment_id added (if missing).")
    except Exception as e:
        if conn:
            conn.rollback()
        print(f"Migration failed: {e}")
        sys.exit(1)
    finally:
        if conn:
            conn.close()

if __name__ == '__main__':
    main()
