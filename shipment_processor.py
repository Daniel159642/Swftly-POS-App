"""
Main orchestrator for the AI-powered shipment document processor.
Processes any document type and returns products for UI review/confirmation.
"""

from config import EXTRACTION_CONFIG
from document_processor import ShipmentDocumentProcessor


class ShipmentProcessor:
    def __init__(self):
        self.doc_processor = ShipmentDocumentProcessor()

    def process_shipment(self, file_path):
        """
        Main function: processes any document and returns products for review.
        Returns: dict with products, confidence, and metadata.
        """
        try:
            if not self.doc_processor.get_file_type(file_path):
                return {
                    "success": False,
                    "error": f"Unsupported file type. Supported: {sorted(self.doc_processor.supported)}",
                    "products": [],
                }
            text, quality = self.doc_processor.extract_text_fast(file_path)
            result = self.doc_processor.route_to_ai(file_path, text, quality)
            validated = self.validate_results(result)

            return {
                "success": True,
                "products": validated["products"],
                "confidence": validated["avg_confidence"],
                "extraction_method": result.get("extraction_method"),
                "needs_review": validated["avg_confidence"] < EXTRACTION_CONFIG.get("confidence_threshold", 0.8),
            }
        except Exception as e:
            return {
                "success": False,
                "error": str(e),
                "products": [],
            }

    def validate_results(self, result):
        """Self-validation checks (e.g. total = qty × unit_price)."""
        products = result.get("products", [])

        for product in products:
            qty = product.get("quantity")
            unit = product.get("unit_price")
            total = product.get("total_price")

            if qty is not None and unit is not None and total is not None:
                calculated = float(qty) * float(unit)
                if abs(calculated - float(total)) > calculated * 0.01:
                    product["confidence"] = "low"
                    product["validation_issue"] = "Total price mismatch"

        return result


def ai_products_to_shipment_items(products):
    """
    Convert AI extraction output to legacy shipment item format used by the app.
    Each item has: product_sku, product_name, quantity_expected, unit_cost,
    optional lot_number, expiration_date, barcode.
    """
    items = []
    for p in products or []:
        qty = p.get("quantity")
        try:
            qty = int(float(qty)) if qty is not None else 0
        except (TypeError, ValueError):
            qty = 0
        unit = p.get("unit_price")
        try:
            unit = float(unit) if unit is not None else 0.0
        except (TypeError, ValueError):
            unit = 0.0
        sku = (p.get("sku") or p.get("product_sku") or "").strip()
        name = (p.get("product_name") or "").strip() or None
        if not sku and not name:
            continue
        items.append({
            "product_sku": sku or f"LINE-{len(items) + 1}",
            "product_name": name,
            "quantity_expected": qty,
            "unit_cost": unit,
            "lot_number": p.get("lot_number") or None,
            "expiration_date": p.get("expiration_date") or None,
            "barcode": p.get("barcode") or "",
        })
    return items
