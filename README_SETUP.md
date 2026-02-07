# POS System Setup Summary

## ✅ What's Committed to Git

All necessary files are committed:
- ✅ `database_postgres.py` - Local PostgreSQL connection module
- ✅ `create_admin_account.py` - Script to create admin accounts
- ✅ `schema_supabase.sql` - Database schema (works with any PostgreSQL)
- ✅ `.env.example` - Database connection template (NO actual credentials)
- ✅ Setup documentation files

## 🔒 What's NOT Committed (Correctly)

- ❌ `.env` - Your actual database credentials (in .gitignore - correct!)
- ❌ `*.db`, `*.sqlite` - Database files (in .gitignore - correct!)

## 🚀 Quick Start for New Computer

1. **Clone repository:**
   ```bash
   git clone https://github.com/Daniel159642/pos.git
   cd pos
   ```

2. **Install PostgreSQL:**
   ```bash
   brew install postgresql@14  # macOS
   brew services start postgresql@14
   ```

3. **Create database:**
   ```bash
   psql postgres
   CREATE DATABASE pos_db;
   \q
   ```

4. **Configure connection:**
   ```bash
   cp .env.example .env
   # Edit .env with your PostgreSQL credentials
   ```

5. **Run schema:**
   ```bash
   psql -U postgres -d pos_db -f schema_supabase.sql
   ```

6. **Create admin:**
   ```bash
   python3 create_admin_account.py
   ```

7. **Install & run:**
   ```bash
   pip3 install -r requirements.txt
   cd frontend && npm install && cd ..
   python3 web_viewer.py  # Terminal 1
   cd frontend && npm run dev  # Terminal 2
   ```

8. **Log in:** http://localhost:3000
   - Employee: ADMIN001
   - Password: 123456

## 🖥️ Desktop app (Tauri)

You can run the POS as a native desktop app (macOS, Windows, Linux) using Tauri.

**Prerequisites:** [Rust](https://rustup.rs/) and Tauri’s [system dependencies](https://v2.tauri.app/start/prerequisites/) for your OS.

1. **Install root and frontend deps:**
   ```bash
   npm install
   cd frontend && npm install && cd ..
   ```

2. **Start the backend** (required — the desktop app talks to it):
   ```bash
   source venv/bin/activate   # or: venv\Scripts\activate on Windows
   python3 web_viewer.py
   ```
   Keep this running (e.g. in another terminal).

3. **Run the desktop app:**
   - **Development:** From repo root: `npm run tauri:dev`. This starts the frontend dev server and opens the Tauri window (backend must be on port 5001).
   - **Production build:** `npm run tauri:build`. Installer output is under `src-tauri/target/release/bundle/` (e.g. `.dmg` on macOS, `.msi`/`.exe` on Windows).

The desktop build uses `frontend/build:desktop`, which sets `VITE_API_URL=http://localhost:5001/api/v1` so the app talks to your local Flask backend. Socket.IO and uploads also use `http://localhost:5001`.

## 📝 Important Notes

- **Database credentials are NOT in git** - each computer needs its own `.env` file
- **Each computer has its own database** - data is not synced between computers
- **Admin account must be created on each computer** using `create_admin_account.py`
- **The `.env.example` file is a template only** - copy it to `.env` and fill in your credentials

## 📚 Documentation Files

- `QUICK_SETUP_NEW_COMPUTER.md` - Quick setup steps
- `SETUP_FOR_OTHER_COMPUTERS.md` - Detailed setup guide
- `LOCAL_POSTGRES_SETUP.md` - PostgreSQL setup details
- `ADMIN_ACCOUNT_INFO.md` - Admin account information
