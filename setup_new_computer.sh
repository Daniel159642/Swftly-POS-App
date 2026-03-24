#!/bin/bash
# =============================================================================
# POS System - New Computer Database Setup
# =============================================================================
# Run this script on a new computer after cloning the repo.
# It restores the exact current database schema from database_schema_dump.sql,
# then sets up the admin account and permissions.
#
# Usage:
#   chmod +x setup_new_computer.sh
#   ./setup_new_computer.sh
# =============================================================================

set -e

BOLD="\033[1m"
GREEN="\033[0;32m"
YELLOW="\033[0;33m"
RED="\033[0;31m"
RESET="\033[0m"

ok()   { echo -e "  ${GREEN}✓${RESET} $1"; }
warn() { echo -e "  ${YELLOW}⚠${RESET}  $1"; }
fail() { echo -e "  ${RED}✗${RESET} $1"; }
step() { echo -e "\n${BOLD}$1${RESET}"; }

echo ""
echo "============================================================================"
echo "  POS System — New Computer Database Setup"
echo "============================================================================"

# -----------------------------------------------------------------------------
# Step 0: Check prerequisites
# -----------------------------------------------------------------------------
step "Step 0: Checking prerequisites..."

if ! command -v psql &>/dev/null; then
    fail "psql not found. Install PostgreSQL first."
    echo "       macOS: brew install postgresql"
    echo "       Ubuntu: sudo apt install postgresql postgresql-client"
    exit 1
fi
ok "psql found: $(psql --version)"

if ! command -v python3 &>/dev/null; then
    fail "python3 not found."
    exit 1
fi
ok "python3 found: $(python3 --version)"

if [ ! -f "database_schema_dump.sql" ]; then
    fail "database_schema_dump.sql not found. Make sure you have the latest code."
    exit 1
fi
ok "database_schema_dump.sql found"

# -----------------------------------------------------------------------------
# Step 1: Configure .env
# -----------------------------------------------------------------------------
step "Step 1: Configuring environment..."

if [ ! -f .env ]; then
    if [ -f .env.example ]; then
        cp .env.example .env
        ok "Created .env from .env.example"
    else
        fail ".env not found and no .env.example to copy from."
        exit 1
    fi
    echo ""
    echo "  Edit .env and set your PostgreSQL connection, then press Enter to continue."
    echo "  Minimum required:"
    echo "    DATABASE_URL=postgresql://postgres:postgres@localhost:5432/pos_db"
    echo "  (or leave defaults for local Postgres with user=postgres, pass=postgres)"
    read -rp "  Press Enter when ready..."
fi

# Load .env (ignore export errors)
set +e
export $(grep -v '^#' .env | grep -v '^\s*$' | xargs) 2>/dev/null
set -e

ok ".env loaded"

# Resolve connection info
if [ -n "$DATABASE_URL" ]; then
    DB_CONN="$DATABASE_URL"
    # Parse DB_NAME from the URL for createdb
    DB_NAME_PARSED=$(echo "$DATABASE_URL" | sed 's|.*\/||' | sed 's|?.*||')
    DB_HOST_PARSED=$(echo "$DATABASE_URL" | sed 's|.*@||' | sed 's|:.*||' | sed 's|\/.*||')
    DB_PORT_PARSED=$(echo "$DATABASE_URL" | sed 's|.*:||' | sed 's|\/.*||' | grep -E '^[0-9]+$' || echo "5432")
    DB_USER_PARSED=$(echo "$DATABASE_URL" | sed 's|.*://||' | sed 's|:.*||')
    DB_NAME="${DB_NAME_PARSED:-pos_db}"
    DB_HOST="${DB_HOST_PARSED:-localhost}"
    DB_PORT="${DB_PORT_PARSED:-5432}"
    DB_USER="${DB_USER_PARSED:-postgres}"
else
    DB_HOST="${DB_HOST:-localhost}"
    DB_PORT="${DB_PORT:-5432}"
    DB_NAME="${DB_NAME:-pos_db}"
    DB_USER="${DB_USER:-postgres}"
    DB_PASS="${DB_PASSWORD:-postgres}"
    DB_CONN="postgresql://${DB_USER}:${DB_PASS}@${DB_HOST}:${DB_PORT}/${DB_NAME}"
fi

echo "  Connecting to: ${DB_HOST}:${DB_PORT}/${DB_NAME} as ${DB_USER}"

# -----------------------------------------------------------------------------
# Step 2: Create database
# -----------------------------------------------------------------------------
step "Step 2: Creating database '$DB_NAME' (if it doesn't exist)..."

if psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d postgres \
       -c "SELECT 1 FROM pg_database WHERE datname='${DB_NAME}'" \
       2>/dev/null | grep -q 1; then
    ok "Database '$DB_NAME' already exists"
else
    if psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d postgres \
           -c "CREATE DATABASE ${DB_NAME};" 2>/dev/null; then
        ok "Created database '$DB_NAME'"
    else
        warn "Could not create database — it may already exist or require a password."
        echo "     If needed, run manually: createdb -U postgres ${DB_NAME}"
    fi
fi

# -----------------------------------------------------------------------------
# Step 3: Apply schema from dump
# -----------------------------------------------------------------------------
step "Step 3: Applying current schema from database_schema_dump.sql..."
echo "  This is the exact schema from the main computer."

if psql "$DB_CONN" -f database_schema_dump.sql -v ON_ERROR_STOP=0 2>&1 | \
       grep -v "already exists" | grep -i "error" | head -5; then
    warn "Some warnings above (usually safe — objects may already exist)"
else
    ok "Schema applied"
fi
ok "Schema step complete"

# -----------------------------------------------------------------------------
# Step 4: Admin account
# -----------------------------------------------------------------------------
step "Step 4: Creating admin account..."

if [ -f "create_admin_account.py" ]; then
    python3 create_admin_account.py <<'EOF' 2>&1 | sed 's/^/  /' || true
ADMIN001
Admin
User
123456
EOF
    ok "Admin account step complete"
else
    warn "create_admin_account.py not found — skipping"
fi

# -----------------------------------------------------------------------------
# Step 5: Permissions
# -----------------------------------------------------------------------------
step "Step 5: Initializing permissions (RBAC)..."

if [ -f "init_admin_permissions.py" ]; then
    python3 init_admin_permissions.py 2>&1 | sed 's/^/  /' || true
    ok "Permissions step complete"
else
    warn "init_admin_permissions.py not found — skipping"
fi

# -----------------------------------------------------------------------------
# Done
# -----------------------------------------------------------------------------
echo ""
echo "============================================================================"
echo -e "  ${GREEN}Database setup complete!${RESET}"
echo "============================================================================"
echo ""
echo "  Start the backend:   python3 web_viewer.py"
echo "  Start the frontend:  cd frontend && npm install && npm run dev"
echo ""
echo "  Default login:"
echo "    Employee Code: ADMIN001"
echo "    Password:      123456"
echo ""
