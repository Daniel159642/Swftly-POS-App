"""
Document processor module: hybrid pipeline for extracting text from
shipment documents (PDF, Excel, Word, images) and routing to AI extraction.
"""

import re
from pathlib import Path

from config import EXTRACTION_CONFIG


class ShipmentDocumentProcessor:
    def __init__(self, ai_extractor=None):
        if ai_extractor is None:
            from openai_extractor import OpenAIExtractor
            self.ai_extractor = OpenAIExtractor()
        else:
            self.ai_extractor = ai_extractor
        self.supported = set(EXTRACTION_CONFIG.get("supported_formats", []))

    def process_document(self, file_path):
        """
        Main entry point - accepts any document type.
        1. Detect file type
        2. Route through hybrid pipeline
        3. Return extracted product data
        """
        text, quality = self.extract_text_fast(file_path)
        result = self.route_to_ai(file_path, text, quality)
        return result

    def _detect_file_type(self, file_path):
        """Get normalized file extension (e.g. 'pdf', 'xlsx')."""
        p = Path(file_path)
        ext = p.suffix.lower().lstrip(".")
        return ext if ext in self.supported else None

    def get_file_type(self, file_path):
        """Public helper: return supported extension or None."""
        return self._detect_file_type(file_path)

    def extract_text_fast(self, file_path):
        """
        Fast text extraction based on file type.
        Returns (text, quality) where quality is 'good', 'medium', or 'poor'.
        """
        file_type = self._detect_file_type(file_path)
        if not file_type or file_type not in self.supported:
            return None, "poor"

        if file_type in ("jpg", "png", "jpeg"):
            return None, "poor"

        text = None
        if file_type == "pdf":
            text = self._extract_pdf(file_path)
        elif file_type in ("xlsx", "xls"):
            text = self._extract_excel(file_path)
        elif file_type == "docx":
            text = self._extract_docx(file_path)

        if text is None:
            return None, "poor"

        quality = self.assess_quality(text)
        return text, quality

    def _extract_pdf(self, file_path):
        """Extract text from PDF using pdfplumber."""
        try:
            import pdfplumber
            with pdfplumber.open(file_path) as pdf:
                parts = []
                for page in pdf.pages:
                    t = page.extract_text()
                    if t:
                        parts.append(t)
                return "\n\n".join(parts) if parts else None
        except Exception:
            return None

    def _extract_excel(self, file_path):
        """Extract text from Excel preserving table structure."""
        try:
            import pandas as pd
            xl = pd.ExcelFile(file_path)
            parts = []
            for sheet in xl.sheet_names:
                df = pd.read_excel(xl, sheet_name=sheet, header=None)
                parts.append(df.to_string(index=False, header=False))
            return "\n\n".join(parts) if parts else None
        except Exception:
            return None

    def _extract_docx(self, file_path):
        """Extract text from Word document."""
        try:
            from docx import Document
            doc = Document(file_path)
            return "\n".join(p.text for p in doc.paragraphs)
        except Exception:
            return None

    def assess_quality(self, text):
        """Determine if text extraction was successful."""
        if not text or len(text.strip()) < 50:
            return "poor"

        if self.is_gibberish(text):
            return "poor"

        if self.has_table_structure(text):
            return "good"

        return "medium"

    def is_gibberish(self, text):
        """Check for gibberish (high ratio of special chars)."""
        if not text or len(text) < 20:
            return True
        alnum = sum(1 for c in text if c.isalnum() or c.isspace())
        ratio = alnum / len(text)
        return ratio < 0.6

    def has_table_structure(self, text):
        """Check if text looks like tables (rows with consistent delimiters)."""
        lines = [l.strip() for l in text.splitlines() if l.strip()]
        if len(lines) < 2:
            return False
        # Count lines that have multiple tabs or 2+ spaces (table-like)
        tab_or_align = 0
        for line in lines[:20]:
            if "\t" in line or re.search(r"\s{2,}", line):
                tab_or_align += 1
        return tab_or_align >= min(3, len(lines))

    def route_to_ai(self, file_path, text, quality):
        """Intelligent routing based on quality."""
        if quality == "good":
            return self.ai_extractor.extract_via_text(text)
        if quality == "medium":
            return self.ai_extractor.extract_via_hybrid(text, file_path)
        return self.ai_extractor.extract_via_vision(file_path)
