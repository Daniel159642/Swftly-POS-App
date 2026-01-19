#!/usr/bin/env python3
"""
Quick setup script for Supabase
Helps create first establishment and verify connection
"""

import os
import sys
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

def check_environment():
    """Check if Supabase environment variables are set"""
    required_vars = ['SUPABASE_URL', 'SUPABASE_KEY', 'SUPABASE_DB_URL']
    missing = []
    
    for var in required_vars:
        if not os.getenv(var):
            missing.append(var)
    
    if missing:
        print("❌ Missing environment variables:")
        for var in missing:
            print(f"   - {var}")
        print("\nSet them in .env file or export them:")
        print("  export SUPABASE_URL='https://xxxxx.supabase.co'")
        print("  export SUPABASE_KEY='your-key'")
        print("  export SUPABASE_DB_URL='postgresql://...'")
        return False
    
    print("✅ Environment variables set")
    return True

def create_establishment():
    """Create first establishment interactively"""
    try:
        from database_supabase import get_connection
        
        conn = get_connection()
        cursor = conn.cursor()
        
        print("\n" + "="*60)
        print("Create First Establishment")
        print("="*60)
        
        name = input("Establishment name (e.g., 'Store 1'): ").strip()
        if not name:
            print("Name is required")
            return False
        
        code = input("Establishment code (e.g., 'store1'): ").strip()
        if not code:
            print("Code is required")
            return False
        
        subdomain = input("Subdomain (optional, e.g., 'store1'): ").strip() or None
        
        cursor.execute("""
            INSERT INTO establishments (establishment_name, establishment_code, subdomain)
            VALUES (%s, %s, %s)
            RETURNING establishment_id
        """, (name, code, subdomain))
        
        establishment_id = cursor.fetchone()[0]
        conn.commit()
        
        print(f"\n✅ Establishment created!")
        print(f"   ID: {establishment_id}")
        print(f"   Name: {name}")
        print(f"   Code: {code}")
        if subdomain:
            print(f"   Subdomain: {subdomain}")
        
        print(f"\nUpdate your .env file:")
        print(f"  DEFAULT_ESTABLISHMENT_ID={establishment_id}")
        
        cursor.close()
        conn.close()
        return True
        
    except Exception as e:
        print(f"❌ Error creating establishment: {e}")
        import traceback
        traceback.print_exc()
        return False

def verify_connection():
    """Verify Supabase connection works"""
    try:
        from database_supabase import get_connection, get_supabase_client
        
        print("\n" + "="*60)
        print("Verifying Supabase Connection")
        print("="*60)
        
        # Test PostgreSQL connection
        print("Testing PostgreSQL connection...")
        conn = get_connection()
        cursor = conn.cursor()
        cursor.execute("SELECT version()")
        version = cursor.fetchone()[0]
        print(f"✅ PostgreSQL connected: {version[:50]}...")
        cursor.close()
        conn.close()
        
        # Test Supabase client
        print("Testing Supabase client...")
        client = get_supabase_client()
        result = client.table('establishments').select('count').limit(1).execute()
        print("✅ Supabase client connected")
        
        # Check if establishments table exists
        conn = get_connection()
        cursor = conn.cursor()
        cursor.execute("""
            SELECT COUNT(*) FROM establishments
        """)
        count = cursor.fetchone()[0]
        print(f"✅ Found {count} establishment(s) in database")
        cursor.close()
        conn.close()
        
        return True
        
    except Exception as e:
        print(f"❌ Connection failed: {e}")
        import traceback
        traceback.print_exc()
        return False

def main():
    """Main setup function"""
    print("="*60)
    print("Supabase Setup for POS System")
    print("="*60)
    
    # Check environment
    if not check_environment():
        sys.exit(1)
    
    # Verify connection
    if not verify_connection():
        print("\n❌ Connection verification failed")
        print("Check your SUPABASE_DB_URL and credentials")
        sys.exit(1)
    
    # Ask to create establishment
    create = input("\nCreate first establishment? (y/n): ").strip().lower()
    if create == 'y':
        create_establishment()
    
    print("\n" + "="*60)
    print("Setup Complete!")
    print("="*60)
    print("\nNext steps:")
    print("1. Run schema_supabase.sql in Supabase SQL Editor")
    print("2. Run setup_rls_policies.sql in Supabase SQL Editor")
    print("3. Migrate data: python migrate_sqlite_to_supabase.py inventory.db 1")
    print("4. Start server: USE_SUPABASE=true python web_viewer.py")

if __name__ == '__main__':
    main()
