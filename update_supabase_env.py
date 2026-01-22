#!/usr/bin/env python3
"""
Interactive script to update Supabase environment variables in .env file
"""

import os
import re
from pathlib import Path

def read_env_file():
    """Read current .env file"""
    env_path = Path('.env')
    if not env_path.exists():
        return {}
    
    env_vars = {}
    with open(env_path, 'r') as f:
        for line in f:
            line = line.strip()
            if line and not line.startswith('#') and '=' in line:
                key, value = line.split('=', 1)
                env_vars[key.strip()] = value.strip()
    return env_vars

def write_env_file(env_vars):
    """Write updated .env file"""
    env_path = Path('.env')
    
    # Read existing file to preserve comments and formatting
    lines = []
    if env_path.exists():
        with open(env_path, 'r') as f:
            lines = f.readlines()
    
    # Update or add variables
    updated_keys = set()
    new_lines = []
    
    for line in lines:
        stripped = line.strip()
        if stripped and not stripped.startswith('#') and '=' in stripped:
            key = stripped.split('=', 1)[0].strip()
            if key in env_vars:
                new_lines.append(f"{key}={env_vars[key]}\n")
                updated_keys.add(key)
                continue
        new_lines.append(line)
    
    # Add any new variables that weren't in the file
    for key, value in env_vars.items():
        if key not in updated_keys:
            new_lines.append(f"{key}={value}\n")
    
    # Write back
    with open(env_path, 'w') as f:
        f.writelines(new_lines)

def validate_connection_string(url):
    """Validate PostgreSQL connection string format"""
    pattern = r'^postgresql://[^:]+:[^@]+@[^:]+:\d+/.+$'
    return bool(re.match(pattern, url))

def main():
    print("=" * 60)
    print("Supabase Environment Configuration")
    print("=" * 60)
    print()
    
    # Read current values
    current = read_env_file()
    
    print("Current configuration:")
    print(f"  SUPABASE_URL: {current.get('SUPABASE_URL', 'Not set')}")
    print(f"  SUPABASE_KEY: {current.get('SUPABASE_KEY', 'Not set')[:30] + '...' if current.get('SUPABASE_KEY') else 'Not set'}")
    print(f"  SUPABASE_DB_URL: {current.get('SUPABASE_DB_URL', 'Not set')[:50] + '...' if current.get('SUPABASE_DB_URL') else 'Not set'}")
    print()
    
    print("Enter new values (press Enter to keep current value):")
    print()
    
    # Get SUPABASE_URL
    supabase_url = input(f"SUPABASE_URL [{current.get('SUPABASE_URL', '')}]: ").strip()
    if not supabase_url:
        supabase_url = current.get('SUPABASE_URL', '')
    
    # Get SUPABASE_KEY
    supabase_key = input(f"SUPABASE_KEY [{current.get('SUPABASE_KEY', '')[:30] + '...' if current.get('SUPABASE_KEY') else ''}]: ").strip()
    if not supabase_key:
        supabase_key = current.get('SUPABASE_KEY', '')
    
    # Get SUPABASE_DB_URL
    print()
    print("SUPABASE_DB_URL should be in format:")
    print("  postgresql://postgres:password@db.xxxxx.supabase.co:5432/postgres")
    print()
    supabase_db_url = input(f"SUPABASE_DB_URL [{current.get('SUPABASE_DB_URL', '')[:50] + '...' if current.get('SUPABASE_DB_URL') else ''}]: ").strip()
    if not supabase_db_url:
        supabase_db_url = current.get('SUPABASE_DB_URL', '')
    
    # Validate
    if supabase_db_url and not validate_connection_string(supabase_db_url):
        print()
        print("⚠️  Warning: Connection string format looks incorrect.")
        print("Expected format: postgresql://user:password@host:port/database")
        confirm = input("Continue anyway? (y/n): ").strip().lower()
        if confirm != 'y':
            print("Cancelled.")
            return
    
    # Update .env file
    updates = {
        'SUPABASE_URL': supabase_url,
        'SUPABASE_KEY': supabase_key,
        'SUPABASE_DB_URL': supabase_db_url
    }
    
    # Keep other existing variables
    for key, value in current.items():
        if key not in updates:
            updates[key] = value
    
    write_env_file(updates)
    
    print()
    print("✅ .env file updated!")
    print()
    print("Next steps:")
    print("1. Verify connection: python3 check_supabase_connection.py")
    print("2. Start server: python3 web_viewer.py")

if __name__ == '__main__':
    try:
        main()
    except KeyboardInterrupt:
        print("\n\nCancelled.")
    except Exception as e:
        print(f"\n❌ Error: {e}")
        import traceback
        traceback.print_exc()
