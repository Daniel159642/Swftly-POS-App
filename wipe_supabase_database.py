#!/usr/bin/env python3
"""
Wipe all data from Supabase database while preserving schema
Respects foreign key constraints by deleting in correct order
"""

import os
from dotenv import load_dotenv

# Load environment variables FIRST
load_dotenv()

# Import after loading env vars
from database_supabase import get_connection, get_current_establishment

def wipe_all_data(establishment_id=None, keep_establishments=True):
    """
    Wipe all data from the database
    
    Args:
        establishment_id: If specified, only wipe data for this establishment
        keep_establishments: If True, keep establishments table intact
    """
    conn = get_connection()
    cursor = conn.cursor()
    
    try:
        print("="*70)
        print("WIPING DATABASE")
        print("="*70)
        print()
        
        # Get establishment context
        current_est = establishment_id or get_current_establishment()
        if current_est:
            print(f"⚠️  WARNING: This will delete ALL data for establishment ID: {current_est}")
        else:
            print("⚠️  WARNING: This will delete ALL data from the database!")
        print()
        
        # Confirm
        response = input("Are you sure you want to delete ALL data? (yes/no): ").strip().lower()
        if response != 'yes':
            print("Cancelled. No data was deleted.")
            return
        
        print()
        print("Starting data deletion...")
        print("-"*70)
        
        # Disable triggers temporarily to speed up deletion
        cursor.execute("SET session_replication_role = 'replica';")
        
        # Tables to delete in order (respecting foreign keys)
        # Delete child tables first, then parent tables
        tables_to_delete = [
            # Transactions and payments (leaf nodes)
            'payment_transactions',
            'order_items',
            'orders',
            'sales',
            'shipment_items',
            'pending_shipment_items',
            'pending_shipments',
            'shipments',
            
            # Employee-related (has many dependencies)
            'time_clock',
            'employee_sessions',
            'employee_availability',
            'employee_schedule',
            'audit_log',
            'master_calendar',
            
            # Customer data
            'customers',
            
            # Inventory (has foreign key to vendors)
            'inventory',
            'vendors',
            
            # Employees (has foreign key to establishments)
            'employees',
        ]
        
        # Optionally delete establishments
        if not keep_establishments:
            tables_to_delete.append('establishments')
        
        total_deleted = 0
        
        for table in tables_to_delete:
            try:
                # Check if table exists
                cursor.execute(f"""
                    SELECT EXISTS (
                        SELECT FROM information_schema.tables 
                        WHERE table_schema = 'public' 
                        AND table_name = %s
                    );
                """, (table,))
                
                if not cursor.fetchone()[0]:
                    print(f"  ⚠️  {table}: Table does not exist, skipping")
                    continue
                
                # Get count before deletion
                cursor.execute(f"SELECT COUNT(*) FROM {table}")
                count = cursor.fetchone()[0]
                
                if count > 0:
                    # Delete all rows
                    if establishment_id:
                        # Delete only for specific establishment
                        cursor.execute(f"DELETE FROM {table} WHERE establishment_id = %s", (establishment_id,))
                        deleted = cursor.rowcount
                    else:
                        # Delete all rows
                        cursor.execute(f"DELETE FROM {table}")
                        deleted = cursor.rowcount
                    
                    print(f"  ✓ Deleted {deleted} rows from {table}")
                    total_deleted += deleted
                else:
                    print(f"  - {table}: Already empty")
                    
            except Exception as e:
                print(f"  ❌ {table}: Error - {str(e)[:80]}")
        
        # Reset sequences (auto-increment counters)
        print()
        print("Resetting auto-increment sequences...")
        sequences = [
            'establishments_establishment_id_seq',
            'vendors_vendor_id_seq',
            'inventory_product_id_seq',
            'shipments_shipment_id_seq',
            'shipment_items_shipment_item_id_seq',
            'sales_sale_id_seq',
            'pending_shipments_pending_shipment_id_seq',
            'pending_shipment_items_pending_item_id_seq',
            'employees_employee_id_seq',
            'customers_customer_id_seq',
            'orders_order_id_seq',
            'order_items_order_item_id_seq',
            'payment_transactions_transaction_id_seq',
            'employee_schedule_schedule_id_seq',
            'employee_availability_availability_id_seq',
            'employee_sessions_session_id_seq',
            'time_clock_time_entry_id_seq',
            'audit_log_audit_id_seq',
            'master_calendar_calendar_id_seq',
        ]
        
        for seq in sequences:
            try:
                cursor.execute(f"SELECT setval(%s, 1, false);", (seq,))
            except:
                pass  # Sequence might not exist, skip
        
        # Re-enable triggers
        cursor.execute("SET session_replication_role = 'origin';")
        
        # Commit all changes
        conn.commit()
        
        print("-"*70)
        print(f"✅ Successfully deleted {total_deleted} total rows")
        print("✅ Database schema preserved")
        print("✅ All sequences reset")
        print()
        if keep_establishments:
            print("ℹ️  Establishments table was kept intact")
        print("="*70)
        
    except Exception as e:
        conn.rollback()
        print(f"\n❌ Error during deletion: {e}")
        import traceback
        traceback.print_exc()
        raise
    finally:
        cursor.close()
        conn.close()

def main():
    """Main function"""
    import sys
    
    # Check if --delete-establishments flag is set FIRST
    keep_establishments = '--delete-establishments' not in sys.argv
    
    # Check if establishment ID is provided as argument (skip flags)
    establishment_id = None
    args = [arg for arg in sys.argv[1:] if not arg.startswith('--')]
    
    if len(args) > 0:
        try:
            establishment_id = int(args[0])
            print(f"Will delete data only for establishment ID: {establishment_id}")
        except ValueError:
            print(f"Invalid establishment ID: {args[0]}")
            print("\nUsage:")
            print("  python3 wipe_supabase_database.py                    # Delete all data, keep establishments")
            print("  python3 wipe_supabase_database.py <establishment_id> # Delete data for specific establishment")
            print("  python3 wipe_supabase_database.py --delete-establishments # Delete everything including establishments")
            sys.exit(1)
    
    wipe_all_data(establishment_id=establishment_id, keep_establishments=keep_establishments)

if __name__ == '__main__':
    main()
