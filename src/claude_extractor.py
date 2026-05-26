"""
Claude API module for AI-powered extraction from shipment documents.
Supports text-only, vision (image/PDF), and hybrid extraction.
Uses claude-sonnet-4-6 with native PDF support and tool use for structured output.
"""

import base64
import json
import os
from datetime import date
from pathlib import Path

import anthropic

from src.config import CLAUDE_CONFIG


class ClaudeExtractor:
    def __init__(self):
        self.client = anthropic.Anthropic(api_key=os.environ.get("ANTHROPIC_API_KEY"))
        self.model = CLAUDE_CONFIG.get("model", "claude-sonnet-4-6")
        self.max_tokens = CLAUDE_CONFIG.get("max_tokens", 4096)
        self.use_native_pdf = CLAUDE_CONFIG.get("use_native_pdf", True)

    # ──────────────────────────────────────────────
    # Public extraction methods (same interface as OpenAIExtractor)
    # ──────────────────────────────────────────────

    def extract_via_text(self, document_text):
        """Send text to Claude for extraction."""
        messages = [
            {
                "role": "user",
                "content": self.build_extraction_prompt(document_text),
            }
        ]
        result = self._call_claude(messages)
        result["extraction_method"] = "text"
        return result

    def extract_via_vision(self, file_path):
        """Send document image/PDF to Claude using vision or native PDF support."""
        content_parts = self._prepare_file_content(file_path)
        if not content_parts:
            raise ValueError(f"Cannot prepare file for vision: {file_path}")

        messages = [
            {
                "role": "user",
                "content": content_parts + [
                    {"type": "text", "text": self.build_extraction_prompt("")}
                ],
            }
        ]
        result = self._call_claude(messages)
        result["extraction_method"] = "vision"
        return result

    def extract_via_hybrid(self, text, file_path):
        """Send both text and visual for verification, prefer higher confidence."""
        vision_result = self.extract_via_vision(file_path)
        if vision_result["avg_confidence"] > 0.85:
            vision_result["extraction_method"] = "hybrid_vision"
            return vision_result
        text_result = self.extract_via_text(text)
        return self.merge_results(vision_result, text_result)

    # ──────────────────────────────────────────────
    # File preparation
    # ──────────────────────────────────────────────

    def _prepare_file_content(self, file_path):
        """Return Claude content block(s) for the given file."""
        path = Path(file_path)
        if not path.exists():
            return None

        suffix = path.suffix.lower().lstrip(".")

        if suffix == "pdf":
            return self._prepare_pdf(path)

        if suffix in ("jpg", "jpeg", "png"):
            return self._prepare_image(path, suffix)

        return None

    def _prepare_pdf(self, path):
        """Return a Claude document content block for a PDF (native support)."""
        if self.use_native_pdf:
            try:
                with open(path, "rb") as f:
                    raw = f.read()
                b64 = base64.standard_b64encode(raw).decode("ascii")
                return [
                    {
                        "type": "document",
                        "source": {
                            "type": "base64",
                            "media_type": "application/pdf",
                            "data": b64,
                        },
                    }
                ]
            except OSError:
                pass
        # Fallback: convert PDF pages to images
        return self._pdf_to_image_parts(path)

    def _prepare_image(self, path, suffix):
        """Return a Claude image content block for JPG/PNG."""
        try:
            with open(path, "rb") as f:
                raw = f.read()
        except OSError:
            return None
        media = "image/jpeg" if suffix in ("jpg", "jpeg") else "image/png"
        b64 = base64.standard_b64encode(raw).decode("ascii")
        return [
            {
                "type": "image",
                "source": {
                    "type": "base64",
                    "media_type": media,
                    "data": b64,
                },
            }
        ]

    def _pdf_to_image_parts(self, path, max_pages=10):
        """Fallback: convert PDF pages to image content blocks."""
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
                parts.append(
                    {
                        "type": "image",
                        "source": {
                            "type": "base64",
                            "media_type": "image/png",
                            "data": b64,
                        },
                    }
                )
            doc.close()
            return parts if parts else None
        except Exception:
            return None

    # ──────────────────────────────────────────────
    # Prompt & tool definition
    # ──────────────────────────────────────────────

    def build_extraction_prompt(self, document_content):
        return (
            "Extract ALL product/line-item information from this shipment invoice or packing slip "
            "for a POS inventory system.\n\n"
            "Use the `extract_shipment_items` tool to return the data.\n\n"
            "RULES:\n"
            "1. Extract EVERY line item — do not skip any.\n"
            "2. Use null for any field you cannot determine — never guess.\n"
            "3. Standardize product names: trim whitespace, proper capitalization.\n"
            "4. Dates must be in YYYY-MM-DD format.\n"
            "5. Quantities must be positive integers.\n"
            "6. Prices must be numeric (no currency symbols).\n"
            "7. If total_price ≠ quantity × unit_price, set confidence='low' and note the discrepancy.\n"
            "8. Extract barcodes (UPC/EAN/GTIN) if visible.\n"
            "9. Extract lot/batch numbers if present.\n"
            "10. Extract expiration dates if present.\n"
            + (f"\nDOCUMENT TEXT:\n{document_content}" if document_content else "")
        )

    def _get_tool_definition(self):
        return {
            "name": "extract_shipment_items",
            "description": "Return all line items extracted from the shipment document.",
            "input_schema": {
                "type": "object",
                "properties": {
                    "items": {
                        "type": "array",
                        "items": {
                            "type": "object",
                            "properties": {
                                "product_name": {"type": ["string", "null"]},
                                "sku": {"type": ["string", "null"]},
                                "quantity": {"type": ["number", "null"]},
                                "unit_price": {"type": ["number", "null"]},
                                "total_price": {"type": ["number", "null"]},
                                "lot_number": {"type": ["string", "null"]},
                                "expiration_date": {"type": ["string", "null"]},
                                "barcode": {"type": ["string", "null"]},
                                "supplier": {"type": ["string", "null"]},
                                "category": {"type": ["string", "null"]},
                                "confidence": {
                                    "type": "string",
                                    "enum": ["high", "medium", "low"],
                                },
                                "validation_issue": {"type": ["string", "null"]},
                            },
                            "required": ["product_name", "sku", "quantity", "unit_price", "confidence"],
                        },
                    }
                },
                "required": ["items"],
            },
        }

    # ──────────────────────────────────────────────
    # Claude API call
    # ──────────────────────────────────────────────

    def _call_claude(self, messages):
        """Call Claude with tool use for structured output."""
        tool_def = self._get_tool_definition()
        try:
            response = self.client.messages.create(
                model=self.model,
                max_tokens=self.max_tokens,
                tools=[tool_def],
                tool_choice={"type": "any"},
                messages=messages,
            )
        except anthropic.BadRequestError:
            # Retry without beta header if PDF beta not needed/supported
            response = self.client.messages.create(
                model=self.model,
                max_tokens=self.max_tokens,
                tools=[tool_def],
                tool_choice={"type": "any"},
                messages=messages,
            )

        result = self._parse_response(response)
        # Attach raw token counts so callers can log cost
        result["_input_tokens"] = getattr(response.usage, "input_tokens", None)
        result["_output_tokens"] = getattr(response.usage, "output_tokens", None)
        result["_model"] = self.model
        return result

    def _parse_response(self, response):
        """Parse Claude tool-use response and compute confidence."""
        products = []
        for block in response.content:
            if block.type == "tool_use" and block.name == "extract_shipment_items":
                products = block.input.get("items", [])
                break

        if not products:
            # Fallback: try to parse raw text if tool use wasn't triggered
            for block in response.content:
                if block.type == "text":
                    text = block.text.strip().replace("```json", "").replace("```", "").strip()
                    try:
                        parsed = json.loads(text)
                        if isinstance(parsed, list):
                            products = parsed
                        elif isinstance(parsed, dict) and "items" in parsed:
                            products = parsed["items"]
                    except json.JSONDecodeError:
                        pass
                    break

        confidence_map = {"high": 1.0, "medium": 0.7, "low": 0.4}
        confidences = [confidence_map.get(p.get("confidence", "medium"), 0.7) for p in products]
        avg_confidence = sum(confidences) / len(confidences) if confidences else 0.0

        return {
            "products": products,
            "avg_confidence": avg_confidence,
        }

    # ──────────────────────────────────────────────
    # Result merging
    # ──────────────────────────────────────────────

    def merge_results(self, vision_result, text_result):
        """Merge vision and text results, preferring higher-confidence fields."""
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
