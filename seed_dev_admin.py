#!/usr/bin/env python3
"""
Create or reset the dev/setup admin account with full permissions.

Uses database.create_admin_account() which:
  - Calls ensure_rbac_seeded() to seed roles + permissions
  - Inserts employee with is_admin=TRUE directly in the SQL INSERT
  - Creates a valid 24h session token

Default credentials (change after first login):
  Employee code: auto-generated (printed at end)
  Password:      123456
"""

import os
import sys

try:
    from dotenv import load_dotenv
    load_dotenv()
except ImportError:
    pass

# --- config ---
ADMIN_NAME     = "Admin User"
ADMIN_EMAIL    = "admin@pos.local"
ADMIN_PASSWORD = "123456"

def get_or_create_establishment():
    from database_postgres import get_cursor
    cursor = get_cursor()
    conn = cursor.connection

    cursor.execute("SELECT establishment_id, establishment_name FROM establishments ORDER BY establishment_id LIMIT 1")
    row = cursor.fetchone()
    if row:
        eid = row["establishment_id"] if isinstance(row, dict) else row[0]
        ename = row["establishment_name"] if isinstance(row, dict) else row[1]
        print(f"  Using existing establishment: '{ename}' (ID {eid})")
        conn.close()
        return eid

    cursor.execute("""
        INSERT INTO establishments (establishment_name, establishment_code, subdomain, is_active)
        VALUES ('Main Store', 'main', 'main', TRUE)
        RETURNING establishment_id
    """)
    eid = cursor.fetchone()[0]
    conn.commit()
    conn.close()
    print(f"  Created establishment 'Main Store' (ID {eid})")
    return eid

def remove_existing_admin(establishment_id):
    """Remove any existing admin@pos.local so we can recreate cleanly."""
    from database_postgres import get_cursor
    cursor = get_cursor()
    conn = cursor.connection
    cursor.execute(
        "DELETE FROM employees WHERE lower(email) = lower(%s) AND establishment_id = %s",
        (ADMIN_EMAIL, establishment_id)
    )
    deleted = cursor.rowcount
    conn.commit()
    conn.close()
    if deleted:
        print(f"  Removed {deleted} old admin employee(s) with email {ADMIN_EMAIL}")

def main():
    print()
    print("=" * 60)
    print("  POS — Dev Admin Setup")
    print("=" * 60)

    print("\nStep 1: Establishment...")
    establishment_id = get_or_create_establishment()

    print("\nStep 2: Seeding RBAC roles + permissions...")
    try:
        from database import ensure_rbac_seeded
        ensure_rbac_seeded(establishment_id)
        print("  Roles and permissions seeded")
    except Exception as e:
        print(f"  Warning: {e}")

    print("\nStep 3: Creating admin account...")
    remove_existing_admin(establishment_id)

    from database import create_admin_account
    result = create_admin_account(establishment_id, ADMIN_EMAIL, ADMIN_PASSWORD, ADMIN_NAME)

    if not result.get("success"):
        print(f"  ERROR: {result.get('message')}")
        sys.exit(1)

    employee_id = result["employee_id"]

    # Confirm is_admin is set
    from database_postgres import get_cursor
    cursor = get_cursor()
    conn = cursor.connection
    cursor.execute(
        "SELECT employee_code, is_admin, role_id FROM employees WHERE employee_id = %s",
        (employee_id,)
    )
    row = cursor.fetchone()
    emp_code = row["employee_code"] if isinstance(row, dict) else row[0]
    is_admin  = row["is_admin"]     if isinstance(row, dict) else row[1]
    role_id   = row["role_id"]      if isinstance(row, dict) else row[2]
    conn.close()

    print()
    print("=" * 60)
    print("  Admin account ready!")
    print("=" * 60)
    print(f"  Employee Code : {emp_code}")
    print(f"  Password      : {ADMIN_PASSWORD}")
    print(f"  is_admin      : {is_admin}")
    print(f"  role_id       : {role_id}")
    print()
    if not is_admin:
        print("  WARNING: is_admin is NOT True — something went wrong.")
        sys.exit(1)
    print("  Log in with the employee code above and password 123456.")
    print("  Change the password from Settings after first login.")
    print()

if __name__ == "__main__":
    try:
        main()
    except Exception as e:
        print(f"\nERROR: {e}")
        import traceback; traceback.print_exc()
        sys.exit(1)
