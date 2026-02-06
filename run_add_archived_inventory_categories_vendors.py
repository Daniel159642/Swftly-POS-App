#!/usr/bin/env python3
"""
Run migration: add archived column to inventory, categories, and vendors.
Enables Archive (soft delete) for products, categories, and vendors.

Usage: from pos directory (with .env or DB_* set):
  python run_add_archived_inventory_categories_vendors.py
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

    conn = None
    try:
        conn = get_connection()
        conn.autocommit = True
        cur = conn.cursor()

        # Inventory (products/ingredients)
        cur.execute("ALTER TABLE inventory ADD COLUMN IF NOT EXISTS archived BOOLEAN DEFAULT FALSE")
        cur.execute("CREATE INDEX IF NOT EXISTS idx_inventory_archived ON inventory(archived) WHERE archived = FALSE")

        # Categories
        cur.execute("ALTER TABLE categories ADD COLUMN IF NOT EXISTS archived BOOLEAN DEFAULT FALSE")
        cur.execute("CREATE INDEX IF NOT EXISTS idx_categories_archived ON categories(archived) WHERE archived = FALSE")

        # Vendors
        cur.execute("ALTER TABLE vendors ADD COLUMN IF NOT EXISTS archived BOOLEAN DEFAULT FALSE")
        cur.execute("CREATE INDEX IF NOT EXISTS idx_vendors_archived ON vendors(archived) WHERE archived = FALSE")

        print("Migration completed: inventory, categories, and vendors now have archived column.")
    except Exception as e:
        print(f"Migration failed: {e}")
        sys.exit(1)
    finally:
        if conn and not conn.closed:
            conn.close()


if __name__ == "__main__":
    main()
