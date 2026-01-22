# Migration from Supabase to Local PostgreSQL

This document summarizes the changes made to migrate from Supabase to local PostgreSQL.

## Changes Made

### 1. New Database Connection Module
- **Created:** `database_postgres.py`
  - Replaces `database_supabase.py`
  - Uses local PostgreSQL connection
  - Removed Supabase client and establishment context (RLS)
  - Supports connection via `DATABASE_URL` or individual `DB_*` environment variables

### 2. Updated Core Database Module
- **Modified:** `database.py`
  - Changed import from `database_supabase` to `database_postgres`
  - Updated comments to reflect PostgreSQL (not Supabase)
  - All database functions now use local PostgreSQL

### 3. Updated Web Viewer
- **Modified:** `web_viewer.py`
  - Removed Supabase client initialization
  - Removed establishment context handling (multi-tenant support)
  - Simplified connection check to use local PostgreSQL
  - Updated error messages to reference PostgreSQL instead of Supabase

### 4. Updated Dependencies
- **Modified:** `requirements.txt`
  - Removed `supabase>=2.0.0` package
  - Kept `psycopg2-binary` and `python-dotenv` (still needed)

### 5. New Setup Tools
- **Created:** `LOCAL_POSTGRES_SETUP.md` - Complete setup guide
- **Created:** `check_postgres_connection.py` - Connection diagnostic tool

## Environment Variables

### Old (Supabase)
```bash
SUPABASE_URL=https://xxxxx.supabase.co
SUPABASE_KEY=your-key
SUPABASE_DB_URL=postgresql://postgres:password@db.xxxxx.supabase.co:5432/postgres
```

### New (Local PostgreSQL)
```bash
# Option 1: Full connection string
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/pos_db

# Option 2: Individual components
DB_HOST=localhost
DB_PORT=5432
DB_NAME=pos_db
DB_USER=postgres
DB_PASSWORD=postgres
```

## What Was Removed

1. **Supabase Client** - No longer using Supabase REST API
2. **Establishment Context** - Multi-tenant RLS (Row Level Security) removed
3. **Supabase-specific connection logic** - Simplified to standard PostgreSQL

## What Still Works

- All database functions in `database.py`
- All API endpoints in `web_viewer.py`
- All frontend functionality
- Schema compatibility (uses same PostgreSQL schema)

## Migration Steps

1. **Install PostgreSQL locally** (if not already installed)
   ```bash
   brew install postgresql@14  # macOS
   sudo apt-get install postgresql  # Linux
   ```

2. **Create database**
   ```bash
   psql postgres
   CREATE DATABASE pos_db;
   \q
   ```

3. **Update `.env` file**
   ```bash
   DATABASE_URL=postgresql://postgres:postgres@localhost:5432/pos_db
   ```

4. **Run schema**
   ```bash
   psql -U postgres -d pos_db -f schema_supabase.sql
   ```

5. **Test connection**
   ```bash
   python3 check_postgres_connection.py
   ```

6. **Start application**
   ```bash
   python3 web_viewer.py
   ```

## Notes

- The schema file is still named `schema_supabase.sql` but works with any PostgreSQL database
- No data migration needed if starting fresh
- If you have existing Supabase data, export it and import to local PostgreSQL
- All application code remains the same - only the database connection layer changed

## Benefits

- ✅ No external dependencies (Supabase service)
- ✅ Full control over database
- ✅ No connection limits
- ✅ Faster local development
- ✅ No cloud costs
- ✅ Works offline

## Troubleshooting

See `LOCAL_POSTGRES_SETUP.md` for detailed troubleshooting steps.
