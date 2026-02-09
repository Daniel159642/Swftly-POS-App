# AI-Powered Shipment Document Processor

Setup and usage for the new document processing system. It handles **PDF, Excel, Word, and images** (including scanned docs and photos) and returns structured product data for review before adding to inventory.

## Quick start

### 1. Install dependencies

```bash
pip install -r requirements.txt
```

Key packages: `openai`, `pdfplumber`, `openpyxl`, `pandas`, `python-docx`, `Pillow`, `PyMuPDF` (for PDF vision).

### 2. Set API key

```bash
export OPENAI_API_KEY=your_api_key_here
```

### 3. Run

```bash
python main.py /path/to/shipment.pdf
```

Or from your app:

```python
from shipment_processor import ShipmentProcessor

processor = ShipmentProcessor()
result = processor.process_shipment("/path/to/shipment.pdf")

if result["success"]:
    display_for_review(result["products"], result["confidence"])
    if result.get("needs_review"):
        # Prompt user to review when confidence < 0.8
        pass
    if user_confirmed:
        add_to_inventory(result["products"])
else:
    show_error(result["error"])
```

## Files

| File | Purpose |
|------|--------|
| `document_processor.py` | Text extraction + quality check + routing (good/medium/poor → text/hybrid/vision) |
| `openai_extractor.py` | OpenAI API: text, vision, and hybrid extraction; JSON parsing |
| `shipment_processor.py` | Orchestrator: `process_shipment(file_path)` and validation |
| `config.py` | `EXTRACTION_CONFIG`: confidence threshold, formats, limits |
| `main.py` | CLI example and integration pattern |

## Supported formats

- **PDF** – pdfplumber → text or vision
- **Excel** – .xlsx, .xls via pandas (table structure kept)
- **Word** – .docx via python-docx
- **Images** – .jpg, .jpeg, .png → vision only

## Configuration

In `config.py`:

- `confidence_threshold`: 0.8 → below this, `needs_review` is true
- `supported_formats`: list of allowed extensions
- `max_file_size_mb`: 20 (for future enforcement)

## Output

- **Success**: `success=True`, `products` (list of dicts with `product_name`, `sku`, `quantity`, `unit_price`, `total_price`, `supplier`, `category`, `confidence`), `confidence` (float), `extraction_method`, `needs_review`.
- **Failure**: `success=False`, `error`, `products=[]`.

See **docs/SHIPMENT_DOCUMENT_PROCESSOR.md** for full pipeline and security notes.
