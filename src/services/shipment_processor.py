"""
Main orchestrator for the AI-powered shipment document processor.
Processes any document type and returns products for UI review/confirmation.
"""

import os
from pathlib import Path

from src.core.config import EXTRACTION_CONFIG
from src.ai.document_processor import ShipmentDocumentProcessor


class ShipmentProcessor:
    def __init__(self):
        self.doc_processor = ShipmentDocumentProcessor()

    def process_shipment(self, file_path):
        """
        Main function: processes any document and returns products for review.
        Returns: dict with products, confidence, and metadata.
        """
        filename = Path(file_path).name
        file_type = Path(file_path).suffix.lstrip(".").lower() or None

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

            self._log_cost(result, filename, file_type, success=1)

            return {
                "success": True,
                "products": validated["products"],
                "confidence": validated["avg_confidence"],
                "extraction_method": result.get("extraction_method"),
                "needs_review": validated["avg_confidence"] < EXTRACTION_CONFIG.get("confidence_threshold", 0.8),
            }
        except Exception as e:
            self._log_cost({}, filename, file_type, success=0, error_message=str(e))
            return {
                "success": False,
                "error": str(e),
                "products": [],
            }

    def _log_cost(self, result, filename, file_type, success=1, error_message=None):
        """Write an extraction_cost_log row; never raises."""
        try:
            from src.core.database import log_extraction_cost
            extractor_choice = EXTRACTION_CONFIG.get("extractor", "claude")
            model = result.get("_model") or (
                "claude-sonnet-4-6" if extractor_choice == "claude" else "gpt-4o"
            )
            log_extraction_cost(
                extractor=extractor_choice,
                model=model,
                filename=filename,
                file_type=file_type,
                extraction_method=result.get("extraction_method"),
                input_tokens=result.get("_input_tokens"),
                output_tokens=result.get("_output_tokens"),
                items_extracted=len(result.get("products") or []),
                avg_confidence=result.get("avg_confidence"),
                success=success,
                error_message=error_message,
            )
        except Exception as log_err:
            print(f"[ShipmentProcessor] cost log failed: {log_err}")

    def validate_results(self, result):
        """Self-validation checks on extracted shipment items."""
        from datetime import date as _date
        products = result.get("products", [])
        seen_skus = {}

        for product in products:
            issues = []

            # Check required fields
            if not product.get("product_name") and not product.get("sku"):
                product["confidence"] = "low"
                issues.append("Missing both product_name and SKU")

            # Check for negative or zero quantities/prices
            qty = product.get("quantity")
            unit = product.get("unit_price")
            total = product.get("total_price")

            try:
                qty = float(qty) if qty is not None else None
            except (TypeError, ValueError):
                qty = None

            try:
                unit = float(unit) if unit is not None else None
            except (TypeError, ValueError):
                unit = None

            try:
                total = float(total) if total is not None else None
            except (TypeError, ValueError):
                total = None

            if qty is not None and qty <= 0:
                product["confidence"] = "low"
                issues.append("Quantity must be positive")

            if unit is not None and unit < 0:
                product["confidence"] = "low"
                issues.append("Unit price cannot be negative")

            # Total price mismatch check
            if qty is not None and unit is not None and total is not None and qty > 0:
                calculated = qty * unit
                if abs(calculated - total) > calculated * 0.01:
                    product["confidence"] = "low"
                    issues.append(
                        f"Total price mismatch: {qty} × {unit} = {calculated:.2f} but got {total:.2f}"
                    )

            # Expiration date in the past
            exp = product.get("expiration_date")
            if exp:
                try:
                    exp_date = _date.fromisoformat(str(exp)[:10])
                    if exp_date < _date.today():
                        issues.append(f"Expiration date {exp} is in the past")
                        if product.get("confidence") == "high":
                            product["confidence"] = "medium"
                except ValueError:
                    issues.append(f"Invalid expiration date format: {exp}")

            # Duplicate SKU within shipment
            sku = product.get("sku")
            if sku:
                if sku in seen_skus:
                    issues.append(f"Duplicate SKU '{sku}' in shipment")
                    product["confidence"] = "low"
                else:
                    seen_skus[sku] = True

            if issues:
                existing = product.get("validation_issue")
                combined = "; ".join(issues)
                product["validation_issue"] = f"{existing}; {combined}" if existing else combined

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
