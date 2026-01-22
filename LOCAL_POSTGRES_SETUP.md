# Local PostgreSQL Setup Guide

This guide will help you set up a local PostgreSQL database for the POS application.

## Prerequisites

1. **PostgreSQL installed locally**
   - macOS: `brew install postgresql@14` (or latest version)
   - Linux: `sudo apt-get install postgresql` (Ubuntu/Debian) or `sudo yum install postgresql` (RHEL/CentOS)
   - Windows: Download from [postgresql.org](https://www.postgresql.org/download/windows/)

2. **Python packages**
   ```bash
   pip3 install psycopg2-binary python-dotenv
   ```

## Step 1: Install and Start PostgreSQL

### macOS (Homebrew)
```bash
# Install PostgreSQL
brew install postgresql@14

# Start PostgreSQL service
brew services start postgresql@14

# Or start manually
pg_ctl -D /usr/local/var/postgres start
```

### Linux
```bash
# Start PostgreSQL service
sudo systemctl start postgresql
sudo systemctl enable postgresql  # Auto-start on boot
```

### Windows
PostgreSQL service should start automatically after installation.

## Step 2: Create Database and User

Connect to PostgreSQL:

```bash
# macOS/Linux
psql postgres

# Windows (if PostgreSQL is in PATH)
psql -U postgres
```

Then run these SQL commands:

```sql
-- Create database
CREATE DATABASE pos_db;

-- Create user (optional - you can use 'postgres' user)
CREATE USER pos_user WITH PASSWORD 'your_password_here';

-- Grant privileges
GRANT ALL PRIVILEGES ON DATABASE pos_db TO pos_user;

-- Connect to the new database
\c pos_db

-- Grant schema privileges (if using separate user)
GRANT ALL ON SCHEMA public TO pos_user;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON TABLES TO pos_user;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON SEQUENCES TO pos_user;

-- Exit psql
\q
```

## Step 3: Configure Environment Variables

Create or update your `.env` file in the project root:

```bash
# Option 1: Full connection string
DATABASE_URL=postgresql://pos_user:your_password_here@localhost:5432/pos_db

# Option 2: Individual components (alternative)
DB_HOST=localhost
DB_PORT=5432
DB_NAME=pos_db
DB_USER=pos_user
DB_PASSWORD=your_password_here
```

**Note:** If you're using the default `postgres` user, you can use:
```bash
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/pos_db
```

## Step 4: Create Database Schema

Run the schema file to create all tables:

```bash
# Connect to your database and run the schema
psql -U pos_user -d pos_db -f schema_supabase.sql

# Or if using postgres user:
psql -U postgres -d pos_db -f schema_supabase.sql
```

**Note:** The schema file is named `schema_supabase.sql` but it works with any PostgreSQL database.

## Step 5: Verify Connection

Test the connection:

```bash
python3 check_postgres_connection.py
```

Or start the application:

```bash
python3 web_viewer.py
```

You should see:
```
✓ Connected to local PostgreSQL database
Starting web viewer...
Open your browser to: http://localhost:5001
```

## Troubleshooting

### Connection Refused
- **Check PostgreSQL is running:**
  ```bash
  # macOS
  brew services list | grep postgresql
  
  # Linux
  sudo systemctl status postgresql
  
  # Check if port 5432 is listening
  lsof -i :5432  # macOS
  netstat -tuln | grep 5432  # Linux
  ```

### Authentication Failed
- Verify username and password in `.env` file
- Check PostgreSQL authentication settings in `pg_hba.conf`
- Try connecting manually: `psql -U pos_user -d pos_db`

### Database Does Not Exist
- Create the database: `CREATE DATABASE pos_db;`
- Verify it exists: `psql -l` (lists all databases)

### Permission Denied
- Grant proper privileges to your user
- Check that the user owns the database or has proper grants

### Port Already in Use
- Check if another PostgreSQL instance is running
- Change port in PostgreSQL config or use a different port in `.env`

## Default Connection Settings

If you don't set environment variables, the system defaults to:
- **Host:** localhost
- **Port:** 5432
- **Database:** pos_db
- **User:** postgres
- **Password:** postgres

**⚠️ Warning:** Change the default password in production!

## Next Steps

1. Run the schema: `psql -U pos_user -d pos_db -f schema_supabase.sql`
2. (Optional) Run any migration scripts if you have existing data
3. Start the application: `python3 web_viewer.py`
4. Access the frontend at: `http://localhost:3000`

## Migration from Supabase

If you were previously using Supabase:

1. **Export your data** from Supabase (if needed)
2. **Update `.env`** with local PostgreSQL connection string
3. **Run the schema** on your local database
4. **Import your data** (if you exported it)

The application code has been updated to work with local PostgreSQL - no code changes needed after setup!
