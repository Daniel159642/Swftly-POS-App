#!/usr/bin/env python3
"""
Run migration: add payment_method and related columns to orders table.
Fixes: column "payment_method" of relation "orders" does not exist

Usage: from pos directory (with .env or DB_* set, same as when you run the backend):
  python run_add_orders_payment_method.py

Or with psql:
  psql "$DATABASE_URL" -f migrations/add_orders_payment_method_postgres.sql
"""
import os
import sys

# Load .env if present (same as web_viewer)
try:
    from dotenv import load_dotenv
    load_dotenv()
except ImportError:
    pass

# Run from pos directory so database_postgres is importable
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

def main():
    try:
        from database_postgres import get_connection
    except ImportError:
        print("Error: Could not import database_postgres. Run this script from the pos directory.")
        sys.exit(1)

    conn = None
    try:
        conn = get_connection()
        conn.autocommit = True
        cur = conn.cursor()

        # payment_method
        cur.execute("ALTER TABLE orders ADD COLUMN IF NOT EXISTS payment_method TEXT DEFAULT 'cash'")
        cur.execute("UPDATE orders SET payment_method = 'cash' WHERE payment_method IS NULL")
        try:
            cur.execute("ALTER TABLE orders ALTER COLUMN payment_method SET NOT NULL")
        except Exception as e:
            if "already" not in str(e).lower():
                raise

        # payment_status
        cur.execute("ALTER TABLE orders ADD COLUMN IF NOT EXISTS payment_status TEXT DEFAULT 'completed'")

        # tip
        cur.execute("ALTER TABLE orders ADD COLUMN IF NOT EXISTS tip NUMERIC(10,2) DEFAULT 0")

        # order_type
        cur.execute("ALTER TABLE orders ADD COLUMN IF NOT EXISTS order_type TEXT")

        print("Migration completed: orders table now has payment_method, payment_status, tip, order_type.")
    except Exception as e:
        print(f"Migration failed: {e}")
        sys.exit(1)
    finally:
        if conn and not conn.closed:
            conn.close()

if __name__ == "__main__":
    main()
