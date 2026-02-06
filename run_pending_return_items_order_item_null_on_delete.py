#!/usr/bin/env python3
"""
Run migration: allow deleting order_items on full return by making
pending_return_items.order_item_id nullable with ON DELETE SET NULL.

Usage (from pos directory):
  python run_pending_return_items_order_item_null_on_delete.py
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
    except Exception as e:
        print(f"Error: Could not import database: {e}")
        sys.exit(1)

    migration_path = os.path.join(
        os.path.dirname(__file__),
        "migrations",
        "pending_return_items_order_item_null_on_delete.sql",
    )
    with open(migration_path) as f:
        sql = f.read()

    try:
        conn = get_connection()
        conn.autocommit = True
        cur = conn.cursor()
        cur.execute("ALTER TABLE pending_return_items ALTER COLUMN order_item_id DROP NOT NULL")
        cur.execute("ALTER TABLE pending_return_items DROP CONSTRAINT IF EXISTS pending_return_items_order_item_id_fkey")
        cur.execute("""
            ALTER TABLE pending_return_items
            ADD CONSTRAINT pending_return_items_order_item_id_fkey
            FOREIGN KEY (order_item_id) REFERENCES order_items(order_item_id) ON DELETE SET NULL
        """)
        cur.close()
        conn.close()
        print("OK: pending_return_items FK updated (ON DELETE SET NULL).")
    except Exception as e:
        print(f"Error: {e}")
        sys.exit(1)


if __name__ == "__main__":
    main()
