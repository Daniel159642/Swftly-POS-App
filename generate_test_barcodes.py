#!/usr/bin/env python3
"""
Generate barcodes for test products
Creates unique numeric barcodes (UPC/EAN format) for products that don't have barcodes
"""

import sqlite3
from database import get_connection, list_products, update_product

def generate_barcode(product_id: int, sku: str) -> str:
    """
    Generate a unique 12-digit barcode for a product
    Format: 123 (test prefix) + product_id (padded to 8 digits) + checksum digit
    """
    # Use prefix 123 for test products
    prefix = "123"
    
    # Pad product_id to 8 digits
    product_id_str = str(product_id).zfill(8)
    
    # Combine prefix + product_id (11 digits total)
    barcode_base = prefix + product_id_str
    
    # Calculate simple checksum (sum of digits mod 10)
    checksum = sum(int(d) for d in barcode_base) % 10
    
    # Return 12-digit barcode
    return barcode_base + str(checksum)

def ensure_barcode_column():
    """Ensure the barcode column exists in the inventory table"""
    conn = get_connection()
    cursor = conn.cursor()
    
    # Check if barcode column exists
    cursor.execute("PRAGMA table_info(inventory)")
    columns = [row[1] for row in cursor.fetchall()]
    
    if 'barcode' not in columns:
        print("Adding barcode column to inventory table...")
        try:
            cursor.execute("ALTER TABLE inventory ADD COLUMN barcode TEXT")
            conn.commit()
            print("✓ Barcode column added successfully.\n")
        except Exception as e:
            print(f"✗ Error adding barcode column: {e}\n")
            conn.close()
            return False
    
    conn.close()
    return True

def main():
    """Generate barcodes for all products that don't have one"""
    print("Generating barcodes for test products...\n")
    
    # Ensure barcode column exists
    if not ensure_barcode_column():
        return
    
    # Get all products
    products = list_products()
    
    if not products:
        print("No products found in database.")
        return
    
    # Filter products without barcodes
    products_without_barcodes = [
        p for p in products 
        if not p.get('barcode') or p.get('barcode').strip() == ''
    ]
    
    if not products_without_barcodes:
        print("All products already have barcodes!")
        return
    
    print(f"Found {len(products_without_barcodes)} products without barcodes.\n")
    
    # Check for duplicate barcodes
    conn = get_connection()
    cursor = conn.cursor()
    existing_barcodes = set()
    cursor.execute("SELECT barcode FROM inventory WHERE barcode IS NOT NULL AND barcode != ''")
    for row in cursor.fetchall():
        existing_barcodes.add(row[0])
    conn.close()
    
    updated_count = 0
    skipped_count = 0
    
    for product in products_without_barcodes:
        product_id = product['product_id']
        sku = product.get('sku', '')
        product_name = product.get('product_name', 'Unknown')
        
        # Generate barcode
        barcode = generate_barcode(product_id, sku)
        
        # Check if barcode already exists (unlikely but possible)
        attempts = 0
        while barcode in existing_barcodes and attempts < 10:
            # If collision, add product_id again
            barcode = generate_barcode(product_id + 1000 * (attempts + 1), sku)
            attempts += 1
        
        if barcode in existing_barcodes:
            print(f"⚠️  Skipped {product_name} (SKU: {sku}) - couldn't generate unique barcode")
            skipped_count += 1
            continue
        
        # Update product with barcode
        try:
            update_product(product_id, barcode=barcode)
            existing_barcodes.add(barcode)
            print(f"✓ Generated barcode for: {product_name}")
            print(f"  Product ID: {product_id}, SKU: {sku}")
            print(f"  Barcode: {barcode}\n")
            updated_count += 1
        except Exception as e:
            print(f"✗ Error updating {product_name}: {e}")
            skipped_count += 1
    
    print(f"\n{'='*50}")
    print(f"Summary:")
    print(f"  Updated: {updated_count} products")
    print(f"  Skipped: {skipped_count} products")
    print(f"{'='*50}\n")
    
    if updated_count > 0:
        print("Barcodes generated successfully!")
        print("\nYou can now test barcode scanning with these codes:")
        print("(Use a barcode generator app or website to create scannable images)")
        print("(Or use the camera scanner in the POS system)\n")

if __name__ == "__main__":
    main()

