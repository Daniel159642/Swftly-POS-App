#!/usr/bin/env python3
"""
Automatically sync database after pulling code
This script checks if database needs updating and does it automatically
"""

import os
import sys
import subprocess
import hashlib

def get_file_hash(filepath):
    """Get hash of file to detect changes"""
    if not os.path.exists(filepath):
        return None
    with open(filepath, 'rb') as f:
        return hashlib.md5(f.read()).hexdigest()

def main():
    print("🔍 Checking if database needs updating...")
    print()
    
    # Check if key SQL files exist
    sql_files = [
        'accounting_triggers.sql',
        'schema_postgres.sql',
        'accounting_schema.sql',
        'database_schema_dump.sql'
    ]
    
    missing_files = [f for f in sql_files if not os.path.exists(f)]
    if missing_files:
        print(f"⚠️  Missing files: {', '.join(missing_files)}")
        print("   Make sure you're in the project root directory.")
        return
    
    # Check if we should update
    should_update = False
    
    # Check if .database_synced file exists (tracks last sync)
    sync_file = '.database_synced'
    if not os.path.exists(sync_file):
        print("📋 First time setup detected. Database needs initial sync.")
        should_update = True
    else:
        # Check if SQL files changed since last sync
        last_sync_hash = None
        if os.path.exists(sync_file):
            with open(sync_file, 'r') as f:
                last_sync_hash = f.read().strip()
        
        current_hash = get_file_hash('accounting_triggers.sql')
        if current_hash != last_sync_hash:
            print("📝 SQL files have changed. Database needs updating.")
            should_update = True
    
    if not should_update:
        print("✓ Database is up to date. No changes needed.")
        return
    
    print()
    print("🔄 Updating database...")
    print()
    
    # Try to restore from schema dump first (fastest, most reliable)
    if os.path.exists('database_schema_dump.sql') and os.path.exists('restore_schema.sh'):
        print("Step 1: Restoring from schema dump...")
        try:
            result = subprocess.run(
                ['./restore_schema.sh'],
                capture_output=True,
                text=True,
                timeout=60
            )
            if result.returncode == 0:
                print("  ✓ Schema restored from dump")
                # Update sync file
                current_hash = get_file_hash('accounting_triggers.sql')
                with open(sync_file, 'w') as f:
                    f.write(current_hash or '')
                print()
                print("✓ Database updated successfully!")
                return
            else:
                print(f"  ⚠ Schema restore had issues: {result.stderr[:200]}")
        except Exception as e:
            print(f"  ⚠ Could not restore from dump: {e}")
    
    # Fallback: run fix script
    if os.path.exists('fix_audit_triggers.py'):
        print("Step 2: Running fix_audit_triggers.py...")
        try:
            result = subprocess.run(
                [sys.executable, 'fix_audit_triggers.py'],
                timeout=60
            )
            if result.returncode == 0:
                print("  ✓ Triggers updated")
                # Update sync file
                current_hash = get_file_hash('accounting_triggers.sql')
                with open(sync_file, 'w') as f:
                    f.write(current_hash or '')
                print()
                print("✓ Database updated successfully!")
                return
        except Exception as e:
            print(f"  ⚠ Could not run fix script: {e}")
    
    print()
    print("⚠️  Automatic update had issues. Please run manually:")
    print("   python3 fix_audit_triggers.py")
    print("   OR")
    print("   ./restore_schema.sh")

if __name__ == '__main__':
    try:
        main()
    except KeyboardInterrupt:
        print("\n\nUpdate cancelled.")
        sys.exit(1)
    except Exception as e:
        print(f"\n❌ Error: {e}")
        import traceback
        traceback.print_exc()
        sys.exit(1)
