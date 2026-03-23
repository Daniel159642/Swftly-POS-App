#!/usr/bin/env python3
"""Run this on the other computer: python3 diagnose_admin.py
Share the output so we can see exactly what's wrong."""

import os, sys
try:
    from dotenv import load_dotenv; load_dotenv()
except: pass

print("\n" + "="*60)
print("  ADMIN DIAGNOSIS")
print("="*60)

try:
    from database_postgres import get_cursor
    cursor = get_cursor()
    conn = cursor.connection
    print("  DB connection: OK")
except Exception as e:
    print(f"  DB connection FAILED: {e}")
    sys.exit(1)

# Establishments
cursor.execute("SELECT establishment_id, establishment_name, is_active FROM establishments")
rows = cursor.fetchall()
print(f"\n  Establishments ({len(rows)}):")
for r in rows:
    r = dict(r) if hasattr(r,'keys') else {'establishment_id':r[0],'establishment_name':r[1],'is_active':r[2]}
    print(f"    ID={r['establishment_id']}  name={r['establishment_name']}  active={r['is_active']}")

# All employees
cursor.execute("SELECT employee_id, employee_code, position, is_admin, active, email FROM employees ORDER BY employee_id")
rows = cursor.fetchall()
print(f"\n  Employees ({len(rows)}):")
for r in rows:
    r = dict(r) if hasattr(r,'keys') else {'employee_id':r[0],'employee_code':r[1],'position':r[2],'is_admin':r[3],'active':r[4],'email':r[5]}
    flag = " <-- ADMIN" if r['is_admin'] else ""
    print(f"    ID={r['employee_id']}  code={r['employee_code']}  position={r['position']}  is_admin={r['is_admin']}  active={r['active']}{flag}")

# Roles
cursor.execute("SELECT role_id, role_name, establishment_id FROM roles ORDER BY role_id")
rows = cursor.fetchall()
print(f"\n  Roles ({len(rows)}):")
for r in rows:
    r = dict(r) if hasattr(r,'keys') else {'role_id':r[0],'role_name':r[1],'establishment_id':r[2]}
    print(f"    ID={r['role_id']}  name={r['role_name']}  est={r['establishment_id']}")

# Permissions count
cursor.execute("SELECT COUNT(*) FROM permissions")
pcount = cursor.fetchone()[0]
print(f"\n  Permissions seeded: {pcount}")

# Role permissions
cursor.execute("SELECT role_id, COUNT(*) as cnt FROM role_permissions GROUP BY role_id ORDER BY role_id")
rows = cursor.fetchall()
print(f"\n  Role permissions:")
for r in rows:
    r = dict(r) if hasattr(r,'keys') else {'role_id':r[0],'cnt':r[1]}
    print(f"    role_id={r['role_id']}  permissions={r['cnt']}")

# Active sessions
cursor.execute("SELECT session_id, employee_id, is_active, expires_at FROM employee_sessions WHERE is_active=1 ORDER BY session_id DESC LIMIT 5")
rows = cursor.fetchall()
print(f"\n  Active sessions (last 5):")
for r in rows:
    r = dict(r) if hasattr(r,'keys') else {'session_id':r[0],'employee_id':r[1],'is_active':r[2],'expires_at':r[3]}
    print(f"    session_id={r['session_id']}  employee_id={r['employee_id']}  expires={r['expires_at']}")

conn.close()
print("\n" + "="*60 + "\n")
