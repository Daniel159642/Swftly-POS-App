# Supabase Database Setup

The POS backend connects to PostgreSQL using **only** the backend’s `DATABASE_URL`. Clients (browser, Electron app) never receive or store the database URL; they call your backend API. This keeps migration to another host (e.g. AWS RDS) transparent for clients.

## 1. Create a Supabase project

1. Go to [supabase.com](https://supabase.com) and sign in.
2. **New project** → choose organization, name (e.g. `pos-production`), database password (save it), region.
3. Wait for the project to finish provisioning.

## 2. Get the connection string

1. In the project: **Project Settings** (gear) → **Database**.
2. Under **Connection string**, choose **URI**.
3. Copy the **Session** (or **Transaction**) pooler URI. It looks like:
   ```text
   postgresql://postgres.[project-ref]:[YOUR-PASSWORD]@aws-0-[region].pooler.supabase.com:6543/postgres
   ```
4. Replace `[YOUR-PASSWORD]` with the database password you set when creating the project.
5. Optional: add SSL mode if your driver needs it:
   ```text
   postgresql://postgres.[project-ref]:[YOUR-PASSWORD]@aws-0-[region].pooler.supabase.com:6543/postgres?sslmode=require
   ```
   (Supabase pooler usually works without `sslmode` in many clients.)

**Direct connection** (port 5432) is also available if you prefer; use it the same way in `DATABASE_URL`.

## 3. Configure the backend (server only)

On the machine where the POS **backend** runs (e.g. your server or your dev machine):

1. In the project root, copy the example env:
   ```bash
   cp .env.example .env
   ```
2. Edit `.env` and set **only** the database URL (no client should ever see this file):
   ```bash
   DATABASE_URL=postgresql://postgres.[ref]:YOUR_PASSWORD@aws-0-us-east-1.pooler.supabase.com:6543/postgres
   ```
3. Do **not** put `DATABASE_URL` in the frontend or Electron app. The app should call your backend (e.g. `https://your-api.com` or `http://localhost:5000`), and the backend uses `DATABASE_URL` to talk to Supabase.

## 4. Run schema and migrations

From the project root, with `.env` containing `DATABASE_URL`:

```bash
python3 setup_complete_database.py
```

This script:

- Skips creating a database when `DATABASE_URL` is set (Supabase already provides `postgres`).
- Runs `schema_postgres.sql`, the accounting schema, returns schema, and migrations.
- Can prompt to create `.env` from `.env.example` if needed.

If you prefer `psql`:

```bash
export $(grep -v '^#' .env | xargs)
psql "$DATABASE_URL" -f schema_postgres.sql
psql "$DATABASE_URL" -f migrations/setup_quickbooks_accounting_schema.sql
psql "$DATABASE_URL" -f returns_schema.sql
# Then run other migrations in migrations/*.sql as needed.
```

## 5. Create admin and permissions

After the schema is applied:

```bash
python3 create_admin_account.py
# Enter employee code (e.g. ADMIN001), name, password when prompted.

python3 init_admin_permissions.py
```

## 6. Start the backend

```bash
python3 web_viewer.py
```

The backend will connect to Supabase using `DATABASE_URL` from `.env`. Clients connect only to the backend.

## Summary

| What                | Where it lives                          |
|---------------------|----------------------------------------|
| `DATABASE_URL`      | Backend server `.env` only             |
| Client / Electron   | Only backend API URL (no DB config)    |
| Migrate to AWS later| Change `DATABASE_URL` on backend only  |

Keeping the database URL only on the backend ensures clients never need to change database config when you switch from Supabase to AWS (or any other Postgres host).

## Verify connection

From the project root (with `DATABASE_URL` in `.env`):

```bash
python3 check_postgres_connection.py
```

If you see SSL or connection errors with Supabase, append `?sslmode=require` to your `DATABASE_URL`.

---

## Troubleshooting: "could not translate host name ... to address"

If you see:

```text
could not translate host name "db.xxxxx.supabase.co" to address: nodename nor servname provided, or not known
```

your machine cannot resolve Supabase’s **Direct** connection host (DNS or network blocking). Do this:

### 1. Use the Session pooler instead of Direct

In Supabase: **Project Settings** → **Database** → **Connection string**.  
Select **URI**, then choose **Session** (or **Transaction**) pooler, **not** Direct.

The pooler URL looks like:

```text
postgresql://postgres.[project-ref]:[YOUR-PASSWORD]@aws-0-[region].pooler.supabase.com:6543/postgres
```

Put that in `.env` as `DATABASE_URL` (replace `[YOUR-PASSWORD]` with your DB password). Port is **6543**, host is `aws-0-<region>.pooler.supabase.com`. This host often resolves when `db.xxx.supabase.co` does not.

### 2. Check DNS from your Mac

In Terminal:

```bash
nslookup db.cefpcmzthgsbcybfykaf.supabase.co
nslookup aws-0-us-east-1.pooler.supabase.com
```

If the first fails and the second works, use the pooler URL. If both fail, check Wi‑Fi, VPN, or try another network (e.g. phone hotspot).

### 3. Project not paused

Free-tier projects pause after inactivity. In the Supabase dashboard, if the project shows as paused, click **Restore** and wait a minute, then try again.
