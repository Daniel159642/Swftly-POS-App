#!/usr/bin/env python3
"""
Diagnostic script to check Supabase connection configuration
"""

import os
import sys
from urllib.parse import urlparse

# Load environment variables
try:
    from dotenv import load_dotenv
    load_dotenv()
except ImportError:
    print("Warning: python-dotenv not installed")

def check_supabase_config():
    """Check Supabase configuration and connection"""
    print("=" * 60)
    print("Supabase Connection Diagnostic")
    print("=" * 60)
    print()
    
    # Check environment variables
    supabase_url = os.getenv('SUPABASE_URL')
    supabase_key = os.getenv('SUPABASE_KEY')
    supabase_db_url = os.getenv('SUPABASE_DB_URL')
    
    print("1. Environment Variables:")
    print(f"   SUPABASE_URL: {'✓ Set' if supabase_url else '✗ Missing'}")
    if supabase_url:
        print(f"      Value: {supabase_url}")
    
    print(f"   SUPABASE_KEY: {'✓ Set' if supabase_key else '✗ Missing'}")
    if supabase_key:
        print(f"      Value: {supabase_key[:20]}... (truncated)")
    
    print(f"   SUPABASE_DB_URL: {'✓ Set' if supabase_db_url else '✗ Missing'}")
    if supabase_db_url:
        # Parse the connection string
        try:
            parsed = urlparse(supabase_db_url)
            hostname = parsed.hostname
            print(f"      Hostname: {hostname}")
            print(f"      Port: {parsed.port or 5432}")
            print(f"      Database: {parsed.path.lstrip('/')}")
        except Exception as e:
            print(f"      Error parsing URL: {e}")
    print()
    
    # Check DNS resolution
    if supabase_db_url:
        try:
            parsed = urlparse(supabase_db_url)
            hostname = parsed.hostname
            print("2. DNS Resolution:")
            import socket
            try:
                ip = socket.gethostbyname(hostname)
                print(f"   ✓ Hostname resolves to: {ip}")
            except socket.gaierror as e:
                print(f"   ✗ DNS resolution failed: {e}")
                print(f"   This means the hostname '{hostname}' cannot be found.")
                print(f"   Possible causes:")
                print(f"   - Supabase project was deleted or paused")
                print(f"   - Hostname is incorrect")
                print(f"   - Network connectivity issue")
        except Exception as e:
            print(f"   Error checking DNS: {e}")
        print()
    
    # Try to connect
    print("3. Connection Test:")
    if not supabase_db_url:
        print("   ✗ Cannot test: SUPABASE_DB_URL not set")
        return False
    
    try:
        import psycopg2
        print("   Attempting to connect...")
        conn = psycopg2.connect(supabase_db_url, connect_timeout=5)
        conn.close()
        print("   ✓ Connection successful!")
        return True
    except ImportError:
        print("   ✗ psycopg2 not installed. Install with: pip install psycopg2-binary")
        return False
    except Exception as e:
        print(f"   ✗ Connection failed: {e}")
        return False

def print_instructions():
    """Print instructions for fixing the connection"""
    print()
    print("=" * 60)
    print("How to Fix:")
    print("=" * 60)
    print()
    print("1. Check your Supabase Dashboard:")
    print("   - Go to: https://supabase.com/dashboard")
    print("   - Select your project (or create a new one)")
    print("   - Go to: Settings > Database")
    print("   - Copy the 'Connection string' (URI format)")
    print()
    print("2. Update your .env file:")
    print("   SUPABASE_DB_URL=postgresql://postgres:[YOUR-PASSWORD]@db.[PROJECT-REF].supabase.co:5432/postgres")
    print()
    print("3. If your project was paused:")
    print("   - Go to Supabase Dashboard")
    print("   - Resume your project")
    print()
    print("4. If you need to create a new project:")
    print("   - Go to: https://supabase.com/dashboard")
    print("   - Click 'New Project'")
    print("   - Follow the setup wizard")
    print("   - Copy the connection string from Settings > Database")
    print()

if __name__ == "__main__":
    success = check_supabase_config()
    if not success:
        print_instructions()
        sys.exit(1)
    else:
        print()
        print("✓ All checks passed! Your Supabase connection is configured correctly.")
        sys.exit(0)
