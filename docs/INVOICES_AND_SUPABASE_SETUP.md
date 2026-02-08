# Fix: "invoices does not exist" and "max clients reached"

When you open **Accounting → Invoices** you may see:

1. **relation "invoices" does not exist** – The accounting tables (invoices, accounting_customers, etc.) have not been created in your database yet.
2. **MaxClientsInSessionMode: max clients reached** – Supabase Session mode has a small connection limit; the app is using too many connections.

## Step 1: Reduce connection pool (fix max clients)

In your **`.env`** file (in the `pos` folder), add or set:

```env
DB_POOL_MIN=1
DB_POOL_MAX=3
```

Then:

- Stop the backend (Ctrl+C in the terminal where `python3 web_viewer.py` is running).
- Close any other apps or terminals that use the same Supabase project (other runs of the app, Supabase Studio tabs, scripts).
- Wait about a minute for idle connections to drop.
- Start the backend again: `python3 web_viewer.py`

If you still see "max clients reached", wait longer or check **Supabase Dashboard → Database** for active connections.

## Step 2: Create the accounting tables (fix "invoices does not exist")

From the **`pos`** directory (same folder as `web_viewer.py`), run the migration script. It creates `invoices`, `accounting_customers`, `accounts`, and other accounting tables.

```bash
cd "/Users/danielbudnyatsky/POS 2/pos"
python3 database/migrations/run_migrations.py
```

- Use the same `.env` (and same `DATABASE_URL`) as the backend.
- If you get "max clients reached" when running this, do Step 1 first (set `DB_POOL_MAX=3`, close other connections, wait, then run the migration again).

After the migration finishes successfully, open **Accounting → Invoices** again; the "invoices does not exist" error should be gone.

## Summary

| Problem | Fix |
|--------|-----|
| relation "invoices" does not exist | Run `python3 database/migrations/run_migrations.py` from the `pos` folder |
| MaxClientsInSessionMode: max clients reached | Set `DB_POOL_MAX=3` in `.env`, restart backend, close other DB clients |
