#!/usr/bin/env python3
"""
Run migrations: add pos_settings.require_signature_for_return and pending_returns.signature.
Use this if "Require signature for return" does not save, or to enable signature on return receipts.

Usage (from pos directory, with .env or DB_* set):
  python run_add_return_signature_and_pos_setting.py
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
            print("Error: Could not import database/database_postgres. Run from pos directory.")
            sys.exit(1)

    base = os.path.join(os.path.dirname(__file__), 'migrations')
    migrations = [
        ('add_pos_settings_require_signature_for_return.sql', 'pos_settings.require_signature_for_return'),
        ('add_pending_returns_signature.sql', 'pending_returns.signature'),
    ]
    try:
        conn = get_connection()
        conn.autocommit = True
        cur = conn.cursor()
        for filename, desc in migrations:
            path = os.path.join(base, filename)
            if not os.path.isfile(path):
                print(f"Skip: {filename} not found")
                continue
            with open(path) as f:
                sql = f.read()
            cur.execute(sql)
            print(f"OK: {desc}")
        cur.close()
        conn.close()
        print("Migrations completed.")
    except Exception as e:
        print(f"Error: {e}")
        sys.exit(1)

if __name__ == '__main__':
    main()
