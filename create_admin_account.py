#!/usr/bin/env python3
"""
Script to create an admin account for the POS system
"""

import os
import sys
from datetime import datetime

# Load environment variables
try:
    from dotenv import load_dotenv
    load_dotenv()
except ImportError:
    print("Warning: python-dotenv not installed")

from database_postgres import get_connection
from database import hash_password

def create_establishment_if_needed():
    """Create a default establishment if none exists"""
    conn = get_connection()
    cursor = conn.cursor()
    
    # Check if any establishment exists
    cursor.execute("SELECT COUNT(*) FROM establishments")
    count = cursor.fetchone()[0]
    
    if count == 0:
        # Create default establishment
        cursor.execute("""
            INSERT INTO establishments (establishment_name, establishment_code, subdomain, is_active)
            VALUES (%s, %s, %s, %s)
            RETURNING establishment_id
        """, ('Main Store', 'main', 'main', True))
        establishment_id = cursor.fetchone()[0]
        conn.commit()
        print(f"✓ Created default establishment (ID: {establishment_id})")
        return establishment_id
    else:
        # Get the first establishment
        cursor.execute("SELECT establishment_id FROM establishments LIMIT 1")
        establishment_id = cursor.fetchone()[0]
        print(f"✓ Using existing establishment (ID: {establishment_id})")
        return establishment_id

def create_admin_account():
    """Create an admin account"""
    conn = get_connection()
    cursor = conn.cursor()
    
    # Get or create establishment
    establishment_id = create_establishment_if_needed()
    
    # Check if admin already exists
    cursor.execute("""
        SELECT employee_id, employee_code, first_name, last_name 
        FROM employees 
        WHERE position = 'admin' AND active = 1
        LIMIT 1
    """)
    existing = cursor.fetchone()
    
    if existing:
        print(f"\n⚠️  Admin account already exists:")
        print(f"   Employee Code: {existing[1] if len(existing) > 1 else 'N/A'}")
        print(f"   Name: {existing[2] if len(existing) > 2 else 'N/A'} {existing[3] if len(existing) > 3 else 'N/A'}")
        print(f"   ID: {existing[0]}")
        response = input("\nCreate another admin account? (y/n): ").strip().lower()
        if response != 'y':
            return None
    
    # Get admin details
    print("\n" + "="*60)
    print("Create Admin Account")
    print("="*60)
    
    employee_code = input("Employee Code (e.g., ADMIN001): ").strip() or "ADMIN001"
    first_name = input("First Name: ").strip() or "Admin"
    last_name = input("Last Name: ").strip() or "User"
    password = input("Password (6 digits): ").strip()
    
    if not password:
        password = "123456"
        print(f"Using default password: {password}")
    
    if len(password) < 4:
        print("⚠️  Warning: Password is very short. Consider using a longer password.")
    
    # Hash password
    password_hash = hash_password(password)
    
    # Check if username column exists
    cursor.execute("""
        SELECT column_name 
        FROM information_schema.columns 
        WHERE table_name = 'employees' AND table_schema = 'public' AND column_name = 'username'
    """)
    has_username = cursor.fetchone() is not None
    
    # Insert admin employee
    if has_username:
        cursor.execute("""
            INSERT INTO employees (
                establishment_id, username, employee_code, first_name, last_name,
                position, date_started, password_hash, active
            )
            VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s)
            RETURNING employee_id
        """, (establishment_id, employee_code, employee_code, first_name, last_name,
              'admin', datetime.now().date(), password_hash, 1))
    else:
        cursor.execute("""
            INSERT INTO employees (
                establishment_id, employee_code, first_name, last_name,
                position, date_started, password_hash, active
            )
            VALUES (%s, %s, %s, %s, %s, %s, %s, %s)
            RETURNING employee_id
        """, (establishment_id, employee_code, first_name, last_name,
              'admin', datetime.now().date(), password_hash, 1))
    
    employee_id = cursor.fetchone()[0]
    conn.commit()
    
    print("\n" + "="*60)
    print("✓ Admin account created successfully!")
    print("="*60)
    print(f"Employee ID: {employee_id}")
    print(f"Employee Code: {employee_code}")
    print(f"Name: {first_name} {last_name}")
    print(f"Position: admin")
    print(f"Password: {password}")
    print("\nYou can now log in with:")
    print(f"  Employee Code: {employee_code}")
    print(f"  Password: {password}")
    print("="*60)
    
    conn.close()
    return employee_id

if __name__ == '__main__':
    try:
        create_admin_account()
    except KeyboardInterrupt:
        print("\n\nCancelled.")
        sys.exit(1)
    except Exception as e:
        print(f"\n❌ Error: {e}")
        import traceback
        traceback.print_exc()
        sys.exit(1)
