# Supabase Connection Fix Instructions

## ✅ What's Been Fixed

1. Connection string format corrected (removed duplicate `@db@db.`)
2. All Python packages installed
3. Environment variables configured
4. Establishment created
5. Supabase client working

## ❌ Remaining Issue

**Direct PostgreSQL connection fails** with DNS resolution error:
```
could not translate host name "db.pufbeazuoqcodgfeddqr.supabase.co" to address
```

This happens because **your Supabase project is paused**.

## 🔧 How to Fix

### Option 1: Unpause Project (Recommended)

1. Go to https://supabase.com/dashboard
2. Log in to your account
3. Select your project (pufbeazuoqcodgfeddqr)
4. If you see "Project Paused" or a "Resume" button:
   - Click **"Resume"** or **"Unpause"**
   - Wait 30-60 seconds for the project to resume
5. Once resumed, test the connection again:
   ```bash
   python3 -c "from database_supabase import get_connection; conn = get_connection(); print('✅ Connected!')"
   ```

### Option 2: Use Connection Pooler (Alternative)

If unpausing doesn't work, or if you want a more reliable connection:

1. Go to Supabase Dashboard → **Settings → Database**
2. Scroll to **"Connection Pooling"** section
3. Copy the **Connection string** (pooler format)
   - Format: `postgresql://postgres.[PROJECT-REF]:[PASSWORD]@aws-0-[REGION].pooler.supabase.com:6543/postgres?pgbouncer=true`
4. Update your `.env` file:
   ```bash
   SUPABASE_DB_URL=<pooler-connection-string>
   ```
5. Test the connection

### Option 3: Check Network/Firewall

If the project is not paused:
- Check your internet connection
- Verify firewall isn't blocking port 5432
- Try accessing Supabase dashboard from same network

## ✅ Verify It's Working

Once fixed, run:

```bash
python3 -c "
from database_supabase import get_connection
conn = get_connection()
cursor = conn.cursor()
cursor.execute('SELECT version()')
print('✅ Connection successful!')
conn.close()
"
```

You should see: `✅ Connection successful!`

## Current Configuration

- ✅ `USE_SUPABASE=true`
- ✅ `SUPABASE_URL` set
- ✅ `SUPABASE_KEY` set
- ✅ `SUPABASE_DB_URL` format correct
- ✅ `DEFAULT_ESTABLISHMENT_ID=1`
- ✅ Supabase client: Working
- ❌ Direct PostgreSQL: Not working (project paused)

## After Connection Works

Once the direct PostgreSQL connection works:

1. **Start the application:**
   ```bash
   python3 web_viewer.py
   ```
   You should see: `✓ Using Supabase database`

2. **Test basic operations:**
   - Login
   - View inventory
   - Add products
   - All data will be stored in Supabase!

3. **Migrate existing data (optional):**
   If you have data in SQLite that you want to migrate:
   ```bash
   python3 migrate_sqlite_to_supabase.py inventory.db 1
   ```

## Notes

- Free tier Supabase projects pause after 7 days of inactivity
- Connection pooler URLs work even when project is paused (better for production)
- The application will fallback to SQLite if Supabase connection fails
- All setup is complete - just need to unpause the project!
