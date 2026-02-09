"""
Entry point for AI-powered shipment document processing.
Use process_shipment() in your existing UI for review/confirmation before adding to inventory.
"""

import sys
from shipment_processor import ShipmentProcessor


def display_for_review(products, confidence):
    """Show products in your UI for editing/confirmation."""
    print(f"Extracted {len(products)} product(s) (confidence: {confidence:.2f})")
    for i, p in enumerate(products, 1):
        print(f"  {i}. {p.get('product_name')} | SKU: {p.get('sku')} | Qty: {p.get('quantity')} | ${p.get('total_price')}")


def add_to_inventory(products):
    """After user confirms, add products to inventory."""
    print(f"Adding {len(products)} product(s) to inventory...")
    # Your existing inventory add logic here
    pass


if __name__ == "__main__":
    if len(sys.argv) < 2:
        print("Usage: python main.py /path/to/shipment.pdf")
        sys.exit(1)

    processor = ShipmentProcessor()
    result = processor.process_shipment(sys.argv[1])

    if result["success"]:
        products = result["products"]
        confidence = result["confidence"]
        display_for_review(products, confidence)
        if result.get("needs_review"):
            print("\n[!] Low confidence - please review and edit before confirming.")
        # if user_confirmed:
        #     add_to_inventory(products)
    else:
        print(f"Error: {result['error']}")
        sys.exit(1)
