# Supabase Multi-Tenant Setup Guide

Complete guide to set up your POS system with Supabase using one project for all establishments.

## Prerequisites

- Python 3.6+
- Supabase account (free tier works)
- Your existing SQLite database (for migration)

## Step 1: Create Supabase Project

1. Go to https://supabase.com and sign up/login
2. Click **"New Project"**
3. Fill in:
   - **Name**: "POS System" (or your choice)
   - **Database Password**: Create a strong password (SAVE THIS!)
   - **Region**: Choose closest to you
4. Wait ~2 minutes for setup to complete

## Step 2: Get Supabase Credentials

1. In Supabase Dashboard, go to **Settings → API**
2. Copy:
   - **Project URL**: `https://pufbeazuoqcodgfeddqr.supabase.co`
   - **anon public** key (for client operations) - Found in "Project API keys" → "anon" → "public"
   - **service_role** key (keep secret, for admin operations)

3. Go to **Settings → Database → Connection string**
4. Copy the **URI** connection string
   - Format: `postgresql://postgres:[PASSWORD]@db.pufbeazuoqcodgfeddqr.supabase.co:5432/postgres`
   - Replace `[PASSWORD]` with your database password
   - Your password: `zivgah-tewja4-xigciM`

## Step 3: Install Dependencies

```bash
pip install supabase psycopg2-binary python-dotenv
```

Or update requirements.txt:
```bash
pip install -r requirements.txt
```

## Step 4: Configure Environment

1. Copy `.env.example` to `.env`:
```bash
cp .env.example .env
```

2. Edit `.env` and add your Supabase credentials:
```bash
SUPABASE_URL=https://xxxxx.supabase.co
SUPABASE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
SUPABASE_DB_URL=postgresql://postgres:yourpassword@db.xxxxx.supabase.co:5432/postgres
USE_SUPABASE=true
DEFAULT_ESTABLISHMENT_ID=1
```

3. Load environment variables (add to your shell profile or run before starting):
```bash
export $(cat .env | xargs)
```

Or use python-dotenv in your code (recommended):
```python
from dotenv import load_dotenv
load_dotenv()
```

## Step 5: Create Database Schema

1. Go to Supabase Dashboard → **SQL Editor**
2. Click **"New query"**
3. Copy and paste the entire contents of `schema_supabase.sql`
4. Click **"Run"** (or press Cmd/Ctrl + Enter)
5. Wait for all tables to be created

## Step 6: Set Up Row-Level Security (RLS)

1. In Supabase SQL Editor, create a new query
2. Copy and paste the entire contents of `setup_rls_policies.sql`
3. Click **"Run"**
4. This creates RLS policies that automatically filter data by establishment_id

## Step 7: Create Your First Establishment

In Supabase SQL Editor, run:

```sql
INSERT INTO establishments (establishment_name, establishment_code, subdomain)
VALUES ('Store 1', 'store1', 'store1')
RETURNING establishment_id;
```

Note the `establishment_id` returned (should be 1).

Create more establishments:
```sql
INSERT INTO establishments (establishment_name, establishment_code, subdomain)
VALUES 
    ('Store 2', 'store2', 'store2'),
    ('Store 3', 'store3', 'store3');
```

## Step 8: Migrate Data from SQLite

If you have existing SQLite data:

```bash
# Set environment variable
export SUPABASE_DB_URL='postgresql://postgres:password@db.xxxxx.supabase.co:5432/postgres'

# Migrate data for establishment 1
python migrate_sqlite_to_supabase.py inventory.db 1
```

This will:
- Read all data from your SQLite database
- Add `establishment_id = 1` to each row
- Insert into Supabase

## Step 9: Update Web Viewer

The `web_viewer.py` needs to be updated to:
1. Use Supabase connection when `USE_SUPABASE=true`
2. Extract establishment from requests
3. Set establishment context

See the code updates below.

## Step 10: Test the Setup

1. Start your application:
```bash
python web_viewer.py
```

2. Test with establishment context:
```bash
# Using header
curl -H "X-Establishment-ID: 1" http://localhost:5001/api/inventory

# Using query parameter
curl http://localhost:5001/api/inventory?establishment_id=1
```

## How Establishment Context Works

The system determines which establishment to use from:

1. **Subdomain** (if configured): `store1.yourdomain.com` → establishment 1
2. **Header**: `X-Establishment-ID: 1`
3. **Employee Session**: Extracted from `employee_sessions` table
4. **Query Parameter**: `?establishment_id=1`
5. **Default**: From `DEFAULT_ESTABLISHMENT_ID` env variable

## Row-Level Security (RLS)

RLS automatically ensures:
- Users can only see data from their establishment
- Even if you forget `WHERE establishment_id = X`, RLS blocks it
- Works at the database level, so it's secure

## Adding New Establishments

1. Create establishment in database:
```sql
INSERT INTO establishments (establishment_name, establishment_code, subdomain)
VALUES ('New Store', 'newstore', 'newstore')
RETURNING establishment_id;
```

2. Migrate data (if you have SQLite backup):
```bash
python migrate_sqlite_to_supabase.py newstore_inventory.db <establishment_id>
```

3. That's it! The establishment is ready to use.

## Troubleshooting

### Connection Errors
- Verify `SUPABASE_DB_URL` is correct
- Check database password is correct
- Ensure network allows connections

### RLS Blocking All Queries
- Make sure `establishment_id` is set in session
- Check `get_current_establishment()` returns correct ID
- Verify RLS policies were created successfully

### Migration Errors
- Check that establishment exists before migrating
- Verify table structures match
- Check for data type mismatches

### Performance Issues
- Add indexes on `establishment_id` columns (already in schema)
- Consider connection pooling for high traffic
- Monitor Supabase dashboard for resource usage

## Cost

- **Free Tier**: 500MB database, 2GB bandwidth
- **Pro Tier**: $25/month - 8GB database, 50GB bandwidth
- **Team Tier**: $599/month - Unlimited projects, better support

For most POS systems, **Pro tier ($25/month)** handles multiple establishments easily.

## Security Best Practices

1. **Never commit `.env` file** - Add to `.gitignore`
2. **Use `anon` key** for client operations
3. **Use `service_role` key** only server-side, never expose
4. **Enable RLS** on all tenant tables
5. **Regular backups** - Supabase does this automatically
6. **Monitor access logs** in Supabase dashboard

## Next Steps

1. Test with one establishment
2. Migrate more establishments
3. Set up subdomain routing (optional)
4. Configure backups and monitoring
5. Scale as needed

## Support

- Supabase Docs: https://supabase.com/docs
- Supabase Discord: https://discord.supabase.com
- Check Supabase Dashboard for logs and metrics
