"""
OpenAI API module for AI-powered extraction from shipment documents.
Supports text-only, vision (image/PDF), and hybrid extraction.
Uses Chat Completions with gpt-4o; PDFs are converted to images for vision.
"""

import base64
import json
import os
from pathlib import Path

from openai import OpenAI


class OpenAIExtractor:
    def __init__(self):
        self.client = OpenAI(api_key=os.environ.get("OPENAI_API_KEY"))
        self.model = "gpt-4o"

    def extract_via_text(self, document_text):
        """Send text to OpenAI for extraction."""
        prompt = self.build_extraction_prompt(document_text)

        response = self.client.chat.completions.create(
            model=self.model,
            max_tokens=4000,
            messages=[{"role": "user", "content": prompt}],
        )

        result = self._parse_response(response)
        result["extraction_method"] = "text"
        return result

    def extract_via_vision(self, file_path):
        """Send document image/PDF to OpenAI (PDF converted to images)."""
        content_parts = self.prepare_file_for_vision(file_path)
        if not content_parts:
            raise ValueError(f"Cannot prepare file for vision: {file_path}")

        prompt = self.build_extraction_prompt("")
        content = list(content_parts) + [{"type": "text", "text": prompt}]

        response = self.client.chat.completions.create(
            model=self.model,
            max_tokens=4000,
            messages=[{"role": "user", "content": content}],
        )

        result = self._parse_response(response)
        result["extraction_method"] = "vision"
        return result

    def extract_via_hybrid(self, text, file_path):
        """Send both text and visual for verification."""
        vision_result = self.extract_via_vision(file_path)

        if vision_result["avg_confidence"] > 0.85:
            vision_result["extraction_method"] = "hybrid_vision"
            return vision_result

        text_result = self.extract_via_text(text)
        return self.merge_results(vision_result, text_result)

    def prepare_file_for_vision(self, file_path):
        """Produce content parts for vision: image_url(s). PDF → page images."""
        path = Path(file_path)
        if not path.exists():
            return None

        suffix = path.suffix.lower().lstrip(".")

        if suffix in ("jpg", "jpeg", "png"):
            try:
                with open(path, "rb") as f:
                    raw = f.read()
            except OSError:
                return None
            media = "image/jpeg" if suffix in ("jpg", "jpeg") else "image/png"
            b64 = base64.standard_b64encode(raw).decode("ascii")
            url = f"data:{media};base64,{b64}"
            return [{"type": "image_url", "image_url": {"url": url}}]

        if suffix == "pdf":
            return self._pdf_to_image_parts(path)

        return None

    def _pdf_to_image_parts(self, path, max_pages=10):
        """Convert PDF pages to image_url content parts (PNG base64)."""
        try:
            import fitz  # PyMuPDF
        except ImportError:
            return None

        try:
            doc = fitz.open(path)
            parts = []
            for i in range(min(len(doc), max_pages)):
                page = doc.load_page(i)
                pix = page.get_pixmap(dpi=150)
                png_bytes = pix.tobytes("png")
                b64 = base64.standard_b64encode(png_bytes).decode("ascii")
                url = f"data:image/png;base64,{b64}"
                parts.append({"type": "image_url", "image_url": {"url": url}})
            doc.close()
            return parts if parts else None
        except Exception:
            return None

    def build_extraction_prompt(self, document_content):
        """Build the extraction instruction prompt."""
        return f"""
Extract ALL product information from this shipment document for a POS inventory system.

REQUIRED FIELDS for each product:
- product_name: Clean, standardized name
- sku: Product/item code
- quantity: Number ordered
- unit_price: Price per unit
- total_price: Total for this line item
- supplier: Vendor/supplier name
- category: Product category if identifiable

IMPORTANT RULES:
1. Return valid JSON array only, no markdown
2. Handle missing data with null (don't guess)
3. Calculate missing values when possible (total = qty × unit_price)
4. Standardize names (trim spaces, proper capitalization)
5. Include confidence: "high", "medium", or "low" for each product
6. If tables exist, extract every row
7. Watch for products split across multiple lines

EXAMPLE OUTPUT:
[
  {{
    "product_name": "Premium Coffee Beans 1kg",
    "sku": "COF-001",
    "quantity": 24,
    "unit_price": 12.50,
    "total_price": 300.00,
    "supplier": "Bean Importers Inc",
    "category": "Beverages",
    "confidence": "high"
  }}
]

DOCUMENT:
{document_content if document_content else "See attached image/PDF"}
"""

    def _parse_response(self, response):
        """Parse OpenAI JSON response and compute confidence."""
        if not response.choices:
            return {"products": [], "avg_confidence": 0.0}

        msg = response.choices[0].message
        text = (msg.content or "").strip()
        text = text.replace("```json", "").replace("```", "").strip()

        try:
            products = json.loads(text)
        except json.JSONDecodeError:
            return {"products": [], "avg_confidence": 0.0}

        if not isinstance(products, list):
            products = [products] if isinstance(products, dict) else []

        confidences = [p.get("confidence", "medium") for p in products]
        confidence_map = {"high": 1.0, "medium": 0.7, "low": 0.4}
        avg_confidence = (
            sum(confidence_map.get(c, 0.7) for c in confidences) / len(confidences)
            if confidences
            else 0.0
        )

        return {
            "products": products,
            "avg_confidence": avg_confidence,
        }

    def parse_response(self, response):
        """Public alias for compatibility; OpenAI flow uses _parse_response internally."""
        return self._parse_response(response)

    def merge_results(self, vision_result, text_result):
        """Merge vision and text extraction results, preferring higher-confidence fields."""
        confidence_map = {"high": 1.0, "medium": 0.7, "low": 0.4}
        by_key = {}

        for p in vision_result.get("products", []):
            key = (p.get("sku") or "") + "|" + (p.get("product_name") or "")
            by_key[key] = dict(p)

        for p in text_result.get("products", []):
            key = (p.get("sku") or "") + "|" + (p.get("product_name") or "")
            existing = by_key.get(key)
            pc = confidence_map.get(p.get("confidence", "medium"), 0.7)
            if existing is None or pc > confidence_map.get(existing.get("confidence", "medium"), 0.7):
                by_key[key] = dict(p)

        merged = list(by_key.values())
        confidences = [confidence_map.get(m.get("confidence", "medium"), 0.7) for m in merged]
        avg_confidence = sum(confidences) / len(confidences) if merged else 0.0

        return {
            "products": merged,
            "avg_confidence": avg_confidence,
            "extraction_method": "hybrid",
        }
