# Supabase Quick Start Guide

## What Was Implemented

✅ **Complete Supabase multi-tenant setup** with one project for all establishments

### Files Created:
1. `database_supabase.py` - Supabase connection module
2. `schema_supabase.sql` - PostgreSQL schema with establishments table
3. `setup_rls_policies.sql` - Row-Level Security policies
4. `migrate_add_establishment_id.py` - Add establishment_id to existing tables
5. `migrate_sqlite_to_supabase.py` - Migrate data from SQLite
6. `setup_supabase.py` - Interactive setup helper
7. `SUPABASE_SETUP_GUIDE.md` - Detailed guide

### Files Updated:
1. `database.py` - Added connection override support
2. `web_viewer.py` - Added establishment context handling
3. `requirements.txt` - Added Supabase dependencies

## Quick Setup (5 Minutes)

### 1. Install Dependencies
```bash
pip install supabase psycopg2-binary python-dotenv
```

### 2. Create Supabase Project
1. Go to https://supabase.com
2. Create new project
3. Get credentials from Settings → API

### 3. Set Environment Variables
Create `.env` file:
```bash
SUPABASE_URL=https://xxxxx.supabase.co
SUPABASE_KEY=eyJhbGc...
SUPABASE_DB_URL=postgresql://postgres:password@db.xxxxx.supabase.co:5432/postgres
USE_SUPABASE=true
DEFAULT_ESTABLISHMENT_ID=1
```

### 4. Run Schema in Supabase
1. Go to Supabase Dashboard → SQL Editor
2. Copy/paste `schema_supabase.sql` → Run
3. Copy/paste `setup_rls_policies.sql` → Run

### 5. Create First Establishment
```sql
INSERT INTO establishments (establishment_name, establishment_code, subdomain)
VALUES ('Store 1', 'store1', 'store1')
RETURNING establishment_id;
```

### 6. Migrate Data (if you have SQLite data)
```bash
export SUPABASE_DB_URL='postgresql://...'
python migrate_sqlite_to_supabase.py inventory.db 1
```

### 7. Start Server
```bash
export USE_SUPABASE=true
python web_viewer.py
```

## How It Works

### Establishment Context
The system automatically determines which establishment to use from:
1. **Subdomain**: `store1.yourdomain.com` → establishment 1
2. **Header**: `X-Establishment-ID: 1`
3. **Session**: From employee login session
4. **Query**: `?establishment_id=1`
5. **Default**: From `DEFAULT_ESTABLISHMENT_ID` env var

### Row-Level Security (RLS)
- Automatically filters all queries by `establishment_id`
- Even if you forget `WHERE establishment_id = X`, RLS blocks it
- Secure at the database level

### Cost
- **$25/month** for Pro tier (handles many establishments)
- Much cheaper than separate projects ($250/month for 10)

## Testing

```bash
# Test with header
curl -H "X-Establishment-ID: 1" http://localhost:5001/api/inventory

# Test with query parameter
curl http://localhost:5001/api/inventory?establishment_id=1
```

## Adding More Establishments

```sql
INSERT INTO establishments (establishment_name, establishment_code, subdomain)
VALUES ('Store 2', 'store2', 'store2')
RETURNING establishment_id;
```

Then migrate data:
```bash
python migrate_sqlite_to_supabase.py store2_inventory.db 2
```

## Troubleshooting

**Connection errors?**
- Check `SUPABASE_DB_URL` is correct
- Verify database password
- Check network connectivity

**RLS blocking queries?**
- Make sure `establishment_id` is set
- Check `get_current_establishment()` returns correct ID
- Verify RLS policies were created

**Migration errors?**
- Ensure establishment exists first
- Check table structures match
- Verify data types are compatible

## Switching Back to SQLite

Just set:
```bash
export USE_SUPABASE=false
```

Or remove `USE_SUPABASE` from `.env`. The system will automatically use SQLite.

## Next Steps

1. ✅ Test with one establishment
2. ✅ Migrate your existing data
3. ✅ Add more establishments
4. ✅ Set up subdomain routing (optional)
5. ✅ Configure monitoring in Supabase dashboard

For detailed instructions, see `SUPABASE_SETUP_GUIDE.md`
