# Schema ownership (canonical definitions)

To avoid drift and duplicate table definitions, treat these as the **single source of truth**:

## Public schema (POS)

- **Canonical:** `schema_postgres.sql` plus migrations in `migrations/` (run in order as needed).
- Do **not** redefine public tables in other standalone SQL files (e.g. `database_schema_dump.sql` is a snapshot for reference, not the definition to edit).
- When adding or changing public tables: update `schema_postgres.sql` for new installs and add a migration in `migrations/` for existing DBs.

## Accounting schema

- **Canonical:** `accounting_schema.sql` and/or the logic in `accounting_bootstrap.py` that creates `accounting.*` (e.g. `accounting.accounts`, `accounting.transactions`, `accounting.transaction_lines`).
- Do **not** create the same accounting tables in multiple places (e.g. both in `accounting_schema.sql` and in `database/schema/001_create_core_tables.sql`). Pick one; the rest should be migrations or removed.
- Migrations that create or alter accounting objects should live under `migrations/` and be clearly named (e.g. `setup_quickbooks_accounting_schema.sql`, `link_accounting_customers_vendors_to_pos.sql`).

## Summary

| Scope        | Canonical source                          | Avoid |
|-------------|--------------------------------------------|-------|
| Public (POS)| `schema_postgres.sql` + `migrations/*.sql` | Duplicating table definitions in dump or other standalone SQL |
| Accounting  | `accounting_schema.sql` / `accounting_bootstrap.py` + migrations | Defining the same accounting tables in multiple SQL files |

This keeps one place to update when the schema changes and reduces drift.
