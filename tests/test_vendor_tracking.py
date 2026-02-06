#!/usr/bin/env python3
"""
Test script to demonstrate vendor-specific inventory tracking
Scenario: 50 units from Vendor A, 100 units from Vendor B, then some sales.
Sales are recorded via create_order (orders + order_items), not the deprecated sales table.
"""

from database import (
    add_product, add_vendor, create_shipment, add_shipment_item,
    add_employee, create_order, get_inventory_by_vendor, get_product
)

def main():
    print("=== Testing Vendor-Specific Inventory Tracking ===\n")
    
    # Step 1: Create two vendors
    print("1. Creating vendors...")
    vendor_a_id = add_vendor(
        vendor_name="Vendor A",
        contact_person="Alice Smith",
        email="alice@vendora.com",
        phone="555-0001"
    )
    vendor_b_id = add_vendor(
        vendor_name="Vendor B",
        contact_person="Bob Jones",
        email="bob@vendorb.com",
        phone="555-0002"
    )
    print(f"   Vendor A ID: {vendor_a_id}")
    print(f"   Vendor B ID: {vendor_b_id}\n")
    
    # Step 2: Create employee (required for create_order)
    print("2. Creating employee...")
    emp_id = add_employee(
        employee_code="VENDOR_TEST",
        first_name="Vendor",
        last_name="Tester",
        position="cashier",
        date_started="2024-01-01",
        password="test123"
    )
    print(f"   Employee ID: {emp_id}\n")

    # Step 3: Create a product
    print("3. Creating product...")
    product_id = add_product(
        product_name="Test Product",
        sku="TEST-001",
        product_price=25.00,
        product_cost=10.00,
        current_quantity=0,
        category="Test"
    )
    print(f"   Product ID: {product_id}\n")
    
    # Step 4: Receive 50 units from Vendor A
    print("4. Receiving 50 units from Vendor A...")
    shipment_a_id = create_shipment(
        vendor_id=vendor_a_id,
        purchase_order_number="PO-A-001",
        tracking_number="TRACK-A-001"
    )
    add_shipment_item(
        shipment_id=shipment_a_id,
        product_id=product_id,
        quantity_received=50,
        unit_cost=10.00,
        lot_number="LOT-A-001"
    )
    product = get_product(product_id)
    print(f"   Total inventory: {product['current_quantity']} units\n")
    
    # Step 5: Receive 100 units from Vendor B
    print("5. Receiving 100 units from Vendor B...")
    shipment_b_id = create_shipment(
        vendor_id=vendor_b_id,
        purchase_order_number="PO-B-001",
        tracking_number="TRACK-B-001"
    )
    add_shipment_item(
        shipment_id=shipment_b_id,
        product_id=product_id,
        quantity_received=100,
        unit_cost=9.50,
        lot_number="LOT-B-001"
    )
    product = get_product(product_id)
    print(f"   Total inventory: {product['current_quantity']} units\n")
    
    # Step 6: Check inventory breakdown BEFORE any sales
    print("6. Inventory breakdown BEFORE sales:")
    breakdown = get_inventory_by_vendor(product_id)
    print(f"   Product: {breakdown['product_name']} (SKU: {breakdown['sku']})")
    print(f"   Total in stock: {breakdown['current_quantity']} units")
    print(f"   Total sold: {breakdown['total_sold']} units\n")
    print("   Remaining by vendor:")
    for vendor_total in breakdown['vendor_totals']:
        print(f"     - {vendor_total['vendor_name']}: {vendor_total['total_remaining']} units")
        for shipment in vendor_total['shipments']:
            print(f"       Shipment {shipment['shipment_id']} (PO: {shipment['purchase_order_number']}): "
                  f"{shipment['quantity_remaining']} units remaining")
    print()
    
    # Step 7: Sell 80 units via create_order (FIFO: 50 from Vendor A, 30 from Vendor B)
    print("7. Selling 80 units via create_order (FIFO logic applies)...")
    order_result = create_order(
        employee_id=emp_id,
        items=[{"product_id": product_id, "quantity": 80, "unit_price": 25.00, "discount": 0}],
        payment_method="cash",
    )
    if not order_result.get("success"):
        raise RuntimeError(f"create_order failed: {order_result.get('message')}")
    product = get_product(product_id)
    print(f"   Total inventory after sale: {product['current_quantity']} units\n")
    
    # Step 8: Check inventory breakdown AFTER sales
    print("8. Inventory breakdown AFTER sales:")
    breakdown = get_inventory_by_vendor(product_id)
    print(f"   Product: {breakdown['product_name']} (SKU: {breakdown['sku']})")
    print(f"   Total in stock: {breakdown['current_quantity']} units")
    print(f"   Total sold: {breakdown['total_sold']} units\n")
    print("   Remaining by vendor:")
    for vendor_total in breakdown['vendor_totals']:
        print(f"     - {vendor_total['vendor_name']}: {vendor_total['total_remaining']} units")
        for shipment in vendor_total['shipments']:
            print(f"       Shipment {shipment['shipment_id']} (PO: {shipment['purchase_order_number']}): "
                  f"{shipment['quantity_remaining']} units remaining "
                  f"(from {shipment['quantity_received']} received, "
                  f"{shipment['quantity_sold_from_shipment']} sold)")
    print()
    
    # Step 9: Detailed breakdown
    print("9. Detailed shipment breakdown:")
    for item in breakdown['vendor_breakdown']:
        if item['quantity_remaining'] > 0:
            print(f"   {item['vendor_name']} - Shipment {item['shipment_id']}:")
            print(f"     Received: {item['quantity_received']} units")
            print(f"     Sold: {item['quantity_sold_from_shipment']} units")
            print(f"     Remaining: {item['quantity_remaining']} units")
            print(f"     Lot: {item['lot_number']}")
            print(f"     Unit Cost: ${item['unit_cost']:.2f}")
            print()
    
    print("=== Test Complete ===")
    print("\nSummary:")
    print(f"- Started with: 50 from Vendor A + 100 from Vendor B = 150 total")
    print(f"- Sold: 80 units (FIFO: all 50 from Vendor A + 30 from Vendor B)")
    print(f"- Remaining: 70 units (all from Vendor B)")

if __name__ == '__main__':
    main()












