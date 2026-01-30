#!/usr/bin/env python3
"""
Run migration: add variant_id to order_items table.
Fixes: column "variant_id" of relation "order_items" does not exist

Usage: from pos directory (with .env or DB_* set):
  python run_add_order_items_variant_id.py
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

        cur.execute("ALTER TABLE order_items ADD COLUMN IF NOT EXISTS variant_id INTEGER")

        # Add FK and index only if product_variants exists
        cur.execute("""
            SELECT 1 FROM information_schema.tables
            WHERE table_schema = 'public' AND table_name = 'product_variants'
        """)
        if cur.fetchone():
            try:
                cur.execute("""
                    ALTER TABLE order_items
                    ADD CONSTRAINT order_items_variant_id_fkey
                    FOREIGN KEY (variant_id) REFERENCES product_variants(variant_id) ON DELETE SET NULL
                """)
            except Exception as e:
                if "already exists" not in str(e).lower():
                    raise
            cur.execute("CREATE INDEX IF NOT EXISTS idx_order_items_variant ON order_items(variant_id)")

        print("Migration completed: order_items table now has variant_id column.")
    except Exception as e:
        print(f"Migration failed: {e}")
        sys.exit(1)
    finally:
        if conn and not conn.closed:
            conn.close()

if __name__ == "__main__":
    main()
