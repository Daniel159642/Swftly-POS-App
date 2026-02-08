#!/usr/bin/env python3
"""
Database Migration Runner
Executes SQL migration files in order to set up the accounting database
"""

import os
import sys
from pathlib import Path
from dotenv import load_dotenv

# Add parent directory to path for imports
sys.path.insert(0, str(Path(__file__).parent.parent.parent))

load_dotenv()

from database_postgres import get_connection

def run_migration():
    """Run all migration files in order"""
    
    # Get database connection
    conn = get_connection()
    cursor = conn.cursor()
    
    try:
        print("🚀 Starting database migration...\n")
        
        # Ensure accounting schema and core tables exist (avoids conflict with public.transactions from POS)
        try:
            import accounting_bootstrap
            if accounting_bootstrap.ensure_accounting_schema():
                print("✅ Accounting schema ready\n")
            else:
                print("⚠️  Accounting schema may already exist; continuing.\n")
        except Exception as e:
            print(f"⚠️  Accounting bootstrap: {e}; continuing.\n")
        
        # Migration files in order (002 creates invoices + related; 001 skipped to avoid public.transactions conflict)
        migration_files = [
            ('database/schema/002_create_invoices_and_related.sql', 'Invoices and related'),
            ('database/schema/006_create_triggers.sql', 'Triggers'),
            ('database/schema/007_create_functions.sql', 'Functions'),
            # Seed files
            ('database/seeds/009_seed_chart_of_accounts.sql', 'Chart of Accounts'),
        ]
        
        # Also check for existing files in root
        root_migrations = [
            ('accounting_schema.sql', 'Core Tables (Root)'),
            ('accounting_triggers.sql', 'Triggers (Root)'),
            ('accounting_functions.sql', 'Functions (Root)'),
            ('accounting_seed_data.sql', 'Seed Data (Root)'),
        ]
        
        # Use root files if database/schema files don't exist
        for file_path, description in migration_files:
            if not os.path.exists(file_path):
                # Try root directory
                root_file = os.path.basename(file_path)
                if os.path.exists(root_file):
                    file_path = root_file
                else:
                    print(f"⚠️  Skipping {description}: {file_path} not found")
                    continue
            
            print(f"📄 Running migration: {description} ({os.path.basename(file_path)})")
            
            try:
                with open(file_path, 'r', encoding='utf-8') as f:
                    sql = f.read()
                
                # Execute SQL: run schema + functions/triggers as single block so order is correct
                run_as_single_block = (
                    'FUNCTION' in sql or 'TRIGGER' in sql or 'CREATE OR REPLACE' in sql
                    or '002_create_invoices_and_related' in file_path
                )
                if run_as_single_block:
                    try:
                        cursor.execute(sql)
                        conn.commit()
                    except Exception as e:
                        err = str(e).lower()
                        if 'already exists' in err or 'duplicate' in err:
                            conn.rollback()
                            print(f"   ⚠️  Some objects already exist; skipping.")
                            conn.commit()
                        else:
                            raise
                else:
                    # Split by ; for seed etc.; commit after each so rollback doesn't lose prior work
                    statements = [s.strip() for s in sql.split(';') if s.strip() and not s.strip().startswith('--')]
                    for statement in statements:
                        if statement:
                            try:
                                cursor.execute(statement)
                                conn.commit()
                            except Exception as e:
                                error_msg = str(e).lower()
                                if 'already exists' in error_msg or 'duplicate' in error_msg:
                                    print(f"   ⚠️  Skipping (already exists): {statement[:50]}...")
                                    conn.rollback()
                                elif 'in failed sql transaction' in error_msg:
                                    conn.rollback()
                                    print(f"   ⚠️  Transaction aborted, rolling back and continuing...")
                                else:
                                    conn.rollback()
                                    raise
                    conn.commit()
                print(f"✅ {description} completed successfully\n")
                
            except Exception as e:
                conn.rollback()
                err = str(e).lower()
                if ('006_create_triggers' in file_path or '007_create_functions' in file_path) and 'does not exist' in err:
                    print(f"⚠️  Skipping {description} (triggers/functions expect accounting schema): {e}\n")
                elif '009_seed' in file_path or 'seed' in file_path.lower():
                    print(f"⚠️  Skipping {description} (seed optional): {e}\n")
                else:
                    print(f"❌ Error in {description}: {e}")
                    print(f"   File: {file_path}")
                    raise
        
        print("🎉 All migrations completed successfully!")
        
    except Exception as e:
        conn.rollback()
        print(f"\n❌ Migration failed. Rolling back changes.")
        print(f"Error: {e}")
        import traceback
        traceback.print_exc()
        sys.exit(1)
        
    finally:
        cursor.close()
        conn.close()

if __name__ == '__main__':
    run_migration()
