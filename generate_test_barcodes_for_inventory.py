#!/usr/bin/env python3
"""
Generate test barcodes for inventory items that don't have barcodes yet.
This script will:
1. Get inventory items without barcodes
2. Generate valid UPC-A format barcodes (12 digits)
3. Update the items in the database
"""

import sys
import os

# Add parent directory to path to import database module
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from database import get_connection, list_products, update_product

def calculate_upc_check_digit(barcode_11):
    """
    Calculate the check digit for a UPC-A barcode (12 digits total)
    UPC-A format: 11 digits + 1 check digit
    """
    if len(barcode_11) != 11:
        raise ValueError("UPC-A requires 11 digits before check digit")
    
    # Sum of odd positions (1-indexed, so indices 0, 2, 4, 6, 8, 10)
    odd_sum = sum(int(barcode_11[i]) for i in range(0, 11, 2))
    
    # Sum of even positions (indices 1, 3, 5, 7, 9)
    even_sum = sum(int(barcode_11[i]) for i in range(1, 11, 2))
    
    # Calculate: (odd_sum * 3 + even_sum) mod 10
    total = (odd_sum * 3 + even_sum) % 10
    
    # Check digit is (10 - total) mod 10
    check_digit = (10 - total) % 10
    
    return str(check_digit)

def generate_upc_barcode(base_number=None):
    """
    Generate a valid UPC-A barcode (12 digits)
    If base_number is provided, use it (must be 11 digits)
    Otherwise, generate a random test barcode starting with 0 (test prefix)
    """
    if base_number:
        if len(base_number) != 11:
            raise ValueError("Base number must be 11 digits")
        barcode_11 = base_number
    else:
        # Generate a test barcode starting with 0 (UPC test prefix)
        # Use product_id or random number for uniqueness
        import random
        # Generate 10 random digits after the leading 0
        random_part = ''.join([str(random.randint(0, 9)) for _ in range(10)])
        barcode_11 = '0' + random_part
    
    check_digit = calculate_upc_check_digit(barcode_11)
    return barcode_11 + check_digit

def main():
    print("🔍 Finding inventory items without barcodes...")
    
    # Get all products
    all_products = list_products()
    
    if not all_products:
        print("❌ No items found in inventory!")
        return
    
    print(f"📋 Total items in inventory: {len(all_products)}")
    
    # Filter to items without barcodes first
    items_without_barcodes = [
        p for p in all_products 
        if not p.get('barcode') or p.get('barcode').strip() == ''
    ]
    
    if items_without_barcodes:
        print(f"📦 Found {len(items_without_barcodes)} items without barcodes")
        items_to_update = items_without_barcodes[:10]
        if len(items_without_barcodes) > 10:
            print(f"⚠️  Limiting to first 10 items (out of {len(items_without_barcodes)})")
    else:
        # If all items have barcodes, generate new ones for the first 5 items anyway for testing
        print("⚠️  All items already have barcodes. Generating new test barcodes for first 5 items...")
        items_to_update = all_products[:5]
    
    print("\n" + "="*60)
    print("Generating barcodes for the following items:")
    print("="*60)
    
    updated_count = 0
    
    for i, product in enumerate(items_to_update, 1):
        product_id = product['product_id']
        product_name = product.get('product_name', 'Unknown')
        sku = product.get('sku', 'N/A')
        
        # Generate barcode based on product_id for consistency
        # Use product_id padded to 11 digits (with leading zeros)
        base_number = str(product_id).zfill(11)
        barcode = generate_upc_barcode(base_number)
        
        print(f"\n{i}. {product_name}")
        print(f"   SKU: {sku}")
        print(f"   Product ID: {product_id}")
        print(f"   Generated Barcode: {barcode}")
        
        # Update the product
        try:
            success = update_product(
                product_id=product_id,
                barcode=barcode
            )
            
            if success:
                print(f"   ✅ Updated successfully!")
                updated_count += 1
            else:
                print(f"   ❌ Failed to update")
        except Exception as e:
            print(f"   ❌ Error: {e}")
    
    print("\n" + "="*60)
    print(f"✅ Successfully generated barcodes for {updated_count} items")
    print("="*60)
    print("\n💡 You can now test barcode scanning with these items!")
    print("   The barcodes are in UPC-A format (12 digits)")

if __name__ == '__main__':
    main()
