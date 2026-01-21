# Supabase-Only Refactoring Status

## ✅ Completed

1. **database.py core functions**:
   - ✅ `get_connection()` - Now always uses Supabase
   - ✅ `add_employee()` - Removed SQLite conditionals, uses PostgreSQL syntax
   - ✅ `get_employee_by_clerk_user_id()` - Uses PostgreSQL only
   - ✅ `verify_pin_login()` - Uses PostgreSQL only
   - ✅ Removed `sqlite3` import (except where still needed for exceptions)

## 🔄 Still Needs Fixing

### Critical Functions (Onboarding/Login Related):
1. `get_onboarding_status()` - Still uses SQLite-specific queries
2. `update_employee()` - Has PRAGMA table_info
3. All functions with `?` placeholders → Need `%s`
4. All `PRAGMA table_info` → Need `information_schema` queries
5. All `sqlite_master` → Need `information_schema.tables`
6. All `sqlite3.IntegrityError` → Need `psycopg2.IntegrityError`
7. All `sqlite3.OperationalError` → Need `psycopg2.OperationalError`

### Pattern Replacements Needed:

1. **Placeholders**: `?` → `%s`
   - Search: `= ?` or `IN (?)` → Replace with `= %s` or `IN (%s)`

2. **Column Checks**: `PRAGMA table_info(table)` → PostgreSQL
   ```python
   # OLD:
   cursor.execute("PRAGMA table_info(employees)")
   columns = [col[1] for col in cursor.fetchall()]
   
   # NEW:
   cursor.execute("""
       SELECT column_name 
       FROM information_schema.columns 
       WHERE table_name = 'employees' AND table_schema = 'public'
   """)
   columns = [row[0] for row in cursor.fetchall()]
   ```

3. **Table Existence**: `sqlite_master` → PostgreSQL
   ```python
   # OLD:
   cursor.execute("SELECT name FROM sqlite_master WHERE type='table' AND name='employee_tips'")
   
   # NEW:
   cursor.execute("""
       SELECT table_name 
       FROM information_schema.tables 
       WHERE table_schema = 'public' AND table_name = 'employee_tips'
   """)
   ```

4. **Exception Handling**: `sqlite3.*Error` → `psycopg2.*Error`
   ```python
   # OLD:
   except sqlite3.IntegrityError as e:
   
   # NEW:
   import psycopg2
   except psycopg2.IntegrityError as e:
   ```

5. **Row Factory**: `sqlite3.Row` is already handled by Supabase's RealDictCursor

6. **Date Functions**: 
   - SQLite: `DATE('now')` → PostgreSQL: `NOW()` or `CURRENT_DATE`
   - SQLite: `CURRENT_TIMESTAMP` → PostgreSQL: `NOW()`

### Functions with SQLite Code (to fix):

- `get_onboarding_status()` - line ~7052
- `update_onboarding_step()` - line ~7098
- `complete_onboarding()` - line ~7144
- `update_employee()` - line ~2196 (has PRAGMA)
- `get_employee()` - line ~2071 (has sqlite_master)
- `list_employees()` - line ~2142 (has sqlite_master)
- All functions with `?` placeholders (many)
- All exception handlers with `sqlite3.*`

## 📋 Checklist for Complete Refactor:

- [ ] Replace all `?` placeholders with `%s`
- [ ] Replace all `PRAGMA table_info` with `information_schema.columns`
- [ ] Replace all `sqlite_master` with `information_schema.tables`
- [ ] Replace all `sqlite3.IntegrityError` with `psycopg2.IntegrityError`
- [ ] Replace all `sqlite3.OperationalError` with `psycopg2.OperationalError`
- [ ] Remove `sqlite3` import (except psycopg2 imports)
- [ ] Update all date/time functions to PostgreSQL syntax
- [ ] Remove all `USE_SUPABASE` conditionals
- [ ] Test all critical paths (onboarding, login, employee creation)

## 🎯 Priority Order:

1. **HIGH**: Onboarding-related functions (already done for add_employee)
2. **HIGH**: Login/auth functions (already done for PIN login)
3. **MEDIUM**: Employee management functions
4. **MEDIUM**: Order/inventory functions
5. **LOW**: Reporting/statistics functions

## Next Steps:

Run this command to find all remaining SQLite references:
```bash
grep -r "sqlite3\|USE_SUPABASE\|PRAGMA\|sqlite_master" database.py | wc -l
```
