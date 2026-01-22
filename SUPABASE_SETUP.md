# Supabase Setup Guide

## Quick Fix for Connection Error

If you're seeing this error:
```
❌ ERROR: Supabase connection failed: could not translate host name "db.xxxxx.supabase.co" to address
```

This means your Supabase project is either:
- **Deleted** - The project no longer exists
- **Paused** - The project is paused (free tier projects pause after inactivity)
- **Hostname changed** - The connection string is outdated

## Solution Steps

### Step 1: Check Your Supabase Dashboard

1. Go to [https://supabase.com/dashboard](https://supabase.com/dashboard)
2. Log in to your account
3. Check if your project exists:
   - If you see your project → Go to Step 2
   - If project is paused → Click "Resume" → Go to Step 2
   - If project doesn't exist → Go to Step 3 (Create New Project)

### Step 2: Get Your Connection String

1. In your Supabase project, go to **Settings** → **Database**
2. Scroll down to **Connection string**
3. Select **URI** format
4. Copy the connection string (it looks like):
   ```
   postgresql://postgres:[YOUR-PASSWORD]@db.[PROJECT-REF].supabase.co:5432/postgres
   ```
5. Replace `[YOUR-PASSWORD]` with your actual database password

### Step 3: Update Your .env File

1. Open your `.env` file in the project root
2. Update the `SUPABASE_DB_URL` line with your new connection string:
   ```bash
   SUPABASE_DB_URL=postgresql://postgres:your-actual-password@db.xxxxx.supabase.co:5432/postgres
   ```
3. Also verify these are set:
   ```bash
   SUPABASE_URL=https://xxxxx.supabase.co
   SUPABASE_KEY=your-supabase-key
   ```

### Step 4: Verify Connection

Run the diagnostic script:
```bash
python3 check_supabase_connection.py
```

If successful, you should see:
```
✓ Connection successful!
✓ All checks passed!
```

### Step 5: Start the Application

```bash
python3 web_viewer.py
```

---

## Creating a New Supabase Project

If your project was deleted, create a new one:

### 1. Create Project

1. Go to [https://supabase.com/dashboard](https://supabase.com/dashboard)
2. Click **New Project**
3. Fill in:
   - **Name**: Your project name (e.g., "POS System")
   - **Database Password**: Choose a strong password (save it!)
   - **Region**: Choose closest to you
4. Click **Create new project**
5. Wait 2-3 minutes for project to initialize

### 2. Get Connection Details

Once the project is ready:

1. Go to **Settings** → **API**
   - Copy **Project URL** → This is your `SUPABASE_URL`
   - Copy **anon/public key** → This is your `SUPABASE_KEY`

2. Go to **Settings** → **Database**
   - Copy **Connection string** (URI format) → This is your `SUPABASE_DB_URL`
   - Replace `[YOUR-PASSWORD]` with the password you set during project creation

### 3. Set Up Database Schema

1. In Supabase Dashboard, go to **SQL Editor**
2. Open `schema_supabase.sql` from this project
3. Copy and paste the entire SQL into the editor
4. Click **Run** to create all tables

### 4. Set Up RLS Policies

1. Still in **SQL Editor**
2. Open `setup_rls_policies.sql` from this project
3. Copy and paste the SQL
4. Click **Run** to set up Row Level Security

### 5. Update .env File

Update your `.env` file with the new values:
```bash
SUPABASE_URL=https://xxxxx.supabase.co
SUPABASE_KEY=your-anon-key-here
SUPABASE_DB_URL=postgresql://postgres:your-password@db.xxxxx.supabase.co:5432/postgres
```

### 6. Run Setup Script

```bash
python3 setup_supabase.py
```

This will:
- Verify your connection
- Help you create your first establishment
- Confirm everything is working

---

## Troubleshooting

### "DNS resolution failed"
- Your project hostname doesn't exist
- Check Supabase Dashboard to see if project is active
- Verify the hostname in your connection string matches your project

### "Connection refused"
- Project might be paused (free tier)
- Go to Dashboard and resume the project
- Wait a few minutes for it to restart

### "Authentication failed"
- Check your database password is correct
- Make sure you replaced `[YOUR-PASSWORD]` in the connection string
- Verify the password in Supabase Dashboard → Settings → Database

### "Module not found: database_supabase"
- Install required packages:
  ```bash
  pip3 install supabase psycopg2-binary python-dotenv
  ```

---

## Need Help?

1. Run the diagnostic script: `python3 check_supabase_connection.py`
2. Check the error message - it will tell you what's wrong
3. Verify your `.env` file has all three required variables:
   - `SUPABASE_URL`
   - `SUPABASE_KEY`
   - `SUPABASE_DB_URL`
