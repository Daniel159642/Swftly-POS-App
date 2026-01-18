#!/usr/bin/env python3
"""
Clear database for onboarding testing
This script resets onboarding status and removes admin employees
"""

import sqlite3
from database import DB_NAME

def clear_database():
    """Clear onboarding data and admin employees"""
    conn = sqlite3.connect(DB_NAME)
    cursor = conn.cursor()
    
    try:
        print("Clearing database for onboarding testing...")
        
        # Reset onboarding status (stored in store_setup table)
        print("1. Resetting onboarding status...")
        try:
            cursor.execute("DELETE FROM store_setup")
        except sqlite3.OperationalError:
            pass  # Table might not exist
        
        # Clear onboarding progress
        print("2. Clearing onboarding progress...")
        try:
            cursor.execute("DELETE FROM onboarding_progress")
        except sqlite3.OperationalError:
            pass  # Table might not exist
        
        # Remove admin employees
        print("3. Removing admin employees...")
        cursor.execute("DELETE FROM employees WHERE position = 'admin'")
        
        # Clear employee sessions
        print("4. Clearing employee sessions...")
        try:
            cursor.execute("DELETE FROM employee_sessions")
        except sqlite3.OperationalError:
            pass
        
        # Clear receipt settings (optional - comment out if you want to keep these)
        print("5. Clearing receipt settings...")
        try:
            cursor.execute("DELETE FROM receipt_settings")
        except sqlite3.OperationalError:
            pass
        
        conn.commit()
        print("✓ Database cleared successfully!")
        print("\nYou can now test the onboarding flow again.")
        
    except Exception as e:
        conn.rollback()
        print(f"Error clearing database: {e}")
        import traceback
        traceback.print_exc()
    finally:
        conn.close()

if __name__ == '__main__':
    clear_database()
