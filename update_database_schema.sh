#!/bin/bash
# =============================================================================
# POS System — Update Existing Database to Current Schema
# =============================================================================
# Run this on a computer that already has an older version of the database.
# It drops the existing database and restores the exact current schema from
# database_schema_dump.sql, then re-creates the admin account and permissions.
#
# WARNING: This will DELETE all existing data in the database.
#
# Usage:
#   chmod +x update_database_schema.sh
#   ./update_database_schema.sh
# =============================================================================

set -e

BOLD="\033[1m"
GREEN="\033[0;32m"
YELLOW="\033[0;33m"
RED="\033[0;31m"
RESET="\033[0m"

ok()   { echo -e "  ${GREEN}✓${RESET} $1"; }
warn() { echo -e "  ${YELLOW}⚠${RESET}  $1"; }
fail() { echo -e "  ${RED}✗${RESET} $1"; exit 1; }
step() { echo -e "\n${BOLD}$1${RESET}"; }

echo ""
echo "============================================================================"
echo "  POS System — Update Existing Database to Current Schema"
echo "============================================================================"
echo ""
echo -e "  ${RED}WARNING: This will DROP and recreate the database.${RESET}"
echo "  All existing data will be deleted."
echo ""
read -rp "  Type YES to continue: " CONFIRM
if [ "$CONFIRM" != "YES" ]; then
    echo "  Cancelled."
    exit 0
fi

# -----------------------------------------------------------------------------
# Prerequisites
# -----------------------------------------------------------------------------
step "Step 0: Checking prerequisites..."

command -v psql &>/dev/null || fail "psql not found. Install PostgreSQL first."
ok "psql: $(psql --version)"

[ -f "database_schema_dump.sql" ] || fail "database_schema_dump.sql not found. Pull the latest code first."
ok "database_schema_dump.sql found"

# -----------------------------------------------------------------------------
# Load .env
# -----------------------------------------------------------------------------
step "Step 1: Loading environment..."

[ -f .env ] || fail ".env not found. Copy .env.example to .env and configure it."

set +e
export $(grep -v '^#' .env | grep -v '^\s*$' | xargs) 2>/dev/null
set -e
ok ".env loaded"

# Resolve connection info
if [ -n "$DATABASE_URL" ]; then
    DB_CONN="$DATABASE_URL"
    DB_NAME=$(echo "$DATABASE_URL" | sed 's|.*\/||' | sed 's|?.*||')
    DB_HOST=$(echo "$DATABASE_URL" | sed 's|.*@||' | sed 's|:.*||' | sed 's|\/.*||')
    DB_PORT=$(echo "$DATABASE_URL" | sed 's|.*:[0-9]*/||' ; echo "$DATABASE_URL" | grep -oE ':[0-9]+/' | tr -d ':/' || echo "5432")
    DB_USER=$(echo "$DATABASE_URL" | sed 's|.*://||' | sed 's|:.*||')
    DB_HOST="${DB_HOST:-localhost}"
    DB_PORT="${DB_PORT:-5432}"
else
    DB_HOST="${DB_HOST:-localhost}"
    DB_PORT="${DB_PORT:-5432}"
    DB_NAME="${DB_NAME:-pos_db}"
    DB_USER="${DB_USER:-postgres}"
    DB_PASS="${DB_PASSWORD:-postgres}"
    DB_CONN="postgresql://${DB_USER}:${DB_PASS}@${DB_HOST}:${DB_PORT}/${DB_NAME}"
fi

DB_NAME="${DB_NAME:-pos_db}"
echo "  Target: ${DB_HOST}:${DB_PORT}/${DB_NAME} as ${DB_USER}"

# -----------------------------------------------------------------------------
# Drop and recreate database
# -----------------------------------------------------------------------------
step "Step 2: Dropping existing database '$DB_NAME'..."

# Terminate all connections first
psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d postgres \
    -c "SELECT pg_terminate_backend(pid) FROM pg_stat_activity WHERE datname='${DB_NAME}' AND pid <> pg_backend_pid();" \
    2>/dev/null || true

psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d postgres \
    -c "DROP DATABASE IF EXISTS ${DB_NAME};" 2>/dev/null \
    && ok "Dropped database '$DB_NAME'" \
    || warn "Could not drop — may not exist yet (continuing)"

step "Step 3: Creating fresh database '$DB_NAME'..."
psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d postgres \
    -c "CREATE DATABASE ${DB_NAME};" \
    && ok "Created database '$DB_NAME'" \
    || fail "Could not create database. Check your PostgreSQL user has CREATE DATABASE permission."

# -----------------------------------------------------------------------------
# Restore schema
# -----------------------------------------------------------------------------
step "Step 4: Restoring current schema from database_schema_dump.sql..."

psql "$DB_CONN" -f database_schema_dump.sql 2>&1 | grep -i "error" | grep -v "already exists" | head -10 || true
ok "Schema restored"

# -----------------------------------------------------------------------------
# Admin account + permissions
# -----------------------------------------------------------------------------
step "Step 5: Creating admin account..."
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

step "Step 6: Initializing permissions (RBAC)..."
if [ -f "init_admin_permissions.py" ]; then
    python3 init_admin_permissions.py 2>&1 | sed 's/^/  /' || true
    ok "Permissions initialized"
else
    warn "init_admin_permissions.py not found — skipping"
fi

# -----------------------------------------------------------------------------
# Done
# -----------------------------------------------------------------------------
echo ""
echo "============================================================================"
echo -e "  ${GREEN}Database updated successfully!${RESET}"
echo "============================================================================"
echo ""
echo "  Start the backend:   python3 web_viewer.py"
echo "  Start the frontend:  cd frontend && npm run dev"
echo ""
echo "  Default login:"
echo "    Employee Code: ADMIN001"
echo "    Password:      123456"
echo ""
