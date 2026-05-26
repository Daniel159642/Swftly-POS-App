#!/usr/bin/env python3
"""
Create or reset the dev/setup admin account with full permissions.

Uses database.create_admin_account() which:
  - Calls ensure_rbac_seeded() to seed roles + permissions
  - Inserts employee with is_admin=TRUE directly in the SQL INSERT
  - Creates a valid 24h session token

Credentials (change after first login):
  Employee code: ADMIN001
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
ADMIN_CODE     = "ADMIN001"
ADMIN_PASSWORD = "123456"


def get_or_create_establishment():
    from database_postgres import get_cursor
    cursor = get_cursor()
    conn = cursor.connection
    cursor.execute("SELECT establishment_id, establishment_name FROM establishments ORDER BY establishment_id LIMIT 1")
    row = cursor.fetchone()
    if row:
        eid   = row["establishment_id"]   if isinstance(row, dict) else row[0]
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


def ensure_admin(establishment_id):
    """
    Ensure ADMIN001 exists with is_admin=TRUE.

    Strategy:
    1. Try to delete the existing admin and recreate cleanly via create_admin_account().
    2. If delete fails (FK violation from orders/etc.), UPDATE in-place instead.
    3. If no existing admin, just create via create_admin_account().

    Returns employee_id.
    """
    import psycopg2
    from database import hash_password, ensure_rbac_seeded
    from database_postgres import get_cursor

    # Seed roles + permissions first
    try:
        ensure_rbac_seeded(establishment_id)
        print("  Roles and permissions seeded")
    except Exception as e:
        print(f"  Warning (ensure_rbac_seeded): {e}")

    cursor = get_cursor()
    conn = cursor.connection

    # Check if admin already exists (by email or code)
    cursor.execute(
        """SELECT employee_id FROM employees
           WHERE establishment_id = %s
             AND (lower(email) = lower(%s) OR lower(employee_code) = lower(%s))
           LIMIT 1""",
        (establishment_id, ADMIN_EMAIL, ADMIN_CODE)
    )
    existing = cursor.fetchone()
    conn.close()

    if existing:
        existing_id = existing["employee_id"] if isinstance(existing, dict) else existing[0]
        # Try to delete so create_admin_account can insert cleanly
        cursor2 = get_cursor()
        conn2 = cursor2.connection
        try:
            cursor2.execute("DELETE FROM employees WHERE employee_id = %s", (existing_id,))
            conn2.commit()
            conn2.close()
            print(f"  Removed old admin employee (ID {existing_id})")
            return _create_fresh(establishment_id)
        except psycopg2.errors.ForeignKeyViolation:
            conn2.rollback()
            # Referenced by other tables — reset in-place
            parts = ADMIN_NAME.strip().split(' ', 1)
            pw_hash = hash_password(ADMIN_PASSWORD)
            cursor2.execute(
                """UPDATE employees
                   SET employee_code = %s,
                       email         = %s,
                       first_name    = %s,
                       last_name     = %s,
                       password_hash = %s,
                       is_admin      = TRUE,
                       position      = 'admin',
                       active        = 1
                   WHERE employee_id = %s""",
                (ADMIN_CODE, ADMIN_EMAIL,
                 parts[0], parts[1] if len(parts) > 1 else '',
                 pw_hash, existing_id)
            )
            conn2.commit()
            conn2.close()
            print(f"  Reset existing admin in-place (employee_id={existing_id}, has linked data)")
            return existing_id
    else:
        return _create_fresh(establishment_id)


def _create_fresh(establishment_id):
    """Create a brand new admin via database.create_admin_account() and fix the employee code."""
    from database import create_admin_account
    from database_postgres import get_cursor

    result = create_admin_account(establishment_id, ADMIN_EMAIL, ADMIN_PASSWORD, ADMIN_NAME)
    if not result.get("success"):
        raise RuntimeError(result.get("message", "create_admin_account failed"))

    employee_id = result["employee_id"]

    # Fix auto-generated employee_code → ADMIN001
    # First clear any other employee that already has that code
    cursor = get_cursor()
    conn = cursor.connection
    cursor.execute(
        "UPDATE employees SET employee_code = employee_code || '_old' WHERE lower(employee_code) = lower(%s) AND employee_id != %s",
        (ADMIN_CODE, employee_id)
    )
    cursor.execute(
        "UPDATE employees SET employee_code = %s WHERE employee_id = %s",
        (ADMIN_CODE, employee_id)
    )
    conn.commit()
    conn.close()
    return employee_id


def main():
    print()
    print("=" * 60)
    print("  POS — Dev Admin Setup")
    print("=" * 60)

    print("\nStep 1: Establishment...")
    establishment_id = get_or_create_establishment()

    print("\nStep 2: Creating admin account with full permissions...")
    employee_id = ensure_admin(establishment_id)

    # Verify
    from database_postgres import get_cursor
    cursor = get_cursor()
    conn = cursor.connection
    cursor.execute(
        "SELECT employee_code, is_admin, role_id, position FROM employees WHERE employee_id = %s",
        (employee_id,)
    )
    row = cursor.fetchone()
    conn.close()

    emp_code = row["employee_code"] if isinstance(row, dict) else row[0]
    is_admin  = row["is_admin"]     if isinstance(row, dict) else row[1]
    role_id   = row["role_id"]      if isinstance(row, dict) else row[2]
    position  = row["position"]     if isinstance(row, dict) else row[3]

    print()
    print("=" * 60)
    if not is_admin:
        print("  ERROR: is_admin is still FALSE — something went wrong!")
        print("=" * 60)
        sys.exit(1)

    print("  Admin account ready!")
    print("=" * 60)
    print(f"  Employee Code : {ADMIN_CODE}")
    print(f"  Password      : {ADMIN_PASSWORD}")
    print(f"  is_admin      : {is_admin}  ✓")
    print(f"  position      : {position}")
    print(f"  role_id       : {role_id}")
    print()
    print(f"  Log in with employee code '{ADMIN_CODE}' and password '{ADMIN_PASSWORD}'.")
    print("  Change the password from Settings after first login.")
    print()


if __name__ == "__main__":
    try:
        main()
    except Exception as e:
        print(f"\nERROR: {e}")
        import traceback; traceback.print_exc()
        sys.exit(1)
