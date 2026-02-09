# AI-Powered Shipment Document Processor

This system replaces the legacy scraper with an AI-powered pipeline that handles **all** document types (PDF, Excel, Word, images, scanned docs, photos) using the OpenAI API for high-accuracy extraction.

## Architecture

- **document_processor.py** – Hybrid pipeline: fast text extraction by file type, quality assessment, and routing to the right extraction path.
- **openai_extractor.py** – OpenAI API (gpt-4o): text-only, vision (image/PDF via page images), and hybrid extraction with structured JSON output.
- **shipment_processor.py** – Orchestrator: `process_shipment(file_path)` runs the pipeline and returns products for review.
- **config.py** – Settings: confidence threshold, supported formats, file size limit.

## Setup

### 1. Install dependencies

```bash
pip install -r requirements.txt
```

Required for this feature: `openai`, `pdfplumber`, `openpyxl`, `pandas`, `python-docx`, `Pillow`, `PyMuPDF` (for PDF vision).

### 2. Environment

Set your OpenAI API key:

```bash
export OPENAI_API_KEY=your_api_key_here
```

Or add to `.env` (if you use `python-dotenv`):

```
OPENAI_API_KEY=your_api_key_here
```

## Usage

### From code (integrate into your UI)

```python
from shipment_processor import ShipmentProcessor

processor = ShipmentProcessor()
result = processor.process_shipment("/path/to/shipment.pdf")

if result["success"]:
    products = result["products"]
    confidence = result["confidence"]
    # Show in your UI for editing/confirmation
    display_for_review(products, confidence)
    if result.get("needs_review"):
        # Flag for user review when confidence < 0.8
        pass
    if user_confirmed:
        add_to_inventory(products)
else:
    show_error(result["error"])
```

### From command line

```bash
python main.py /path/to/shipment.pdf
```

Supports: **PDF**, **Excel** (.xlsx, .xls), **Word** (.docx), **images** (.jpg, .jpeg, .png).

## Pipeline behavior

1. **Detect file type** from the path and ensure it’s in the supported list.
2. **Extract text** when possible:
   - **PDF** → pdfplumber  
   - **Excel** → pandas (table structure preserved)  
   - **Word** → python-docx  
   - **Images** → no text extraction; go straight to vision.
3. **Assess quality** of extracted text (length, gibberish, table structure) → `good` / `medium` / `poor`.
4. **Route to AI**:
   - **good** → text-only extraction (fast, cheap).
   - **medium** → hybrid (vision + text, merge results).
   - **poor** → vision only (image/PDF sent to OpenAI; PDF pages converted to images).
5. **Validate** results (e.g. total = qty × unit_price); flag mismatches as low confidence.
6. **Return** `products`, `confidence`, `extraction_method`, and `needs_review` for your UI.

## Configuration (config.py)

| Key                   | Default | Description                          |
|-----------------------|--------|--------------------------------------|
| `confidence_threshold`| 0.8    | Below this → `needs_review` true     |
| `max_retries`         | 2      | Reserved for future retry logic      |
| `supported_formats`   | list   | pdf, xlsx, xls, docx, jpg, jpeg, png  |
| `max_file_size_mb`    | 20     | Reserved for future size checks      |

## Output shape

Each product has:

- `product_name`, `sku`, `quantity`, `unit_price`, `total_price`
- `supplier`, `category` (when identifiable)
- `confidence`: `"high"` / `"medium"` / `"low"`
- Optional: `validation_issue` (e.g. total price mismatch)

Response:

- `success`, `products`, `confidence` (0–1), `extraction_method`, `needs_review`
- On failure: `success` False, `error`, `products` empty.

## Security

- Do **not** commit `OPENAI_API_KEY`. Use environment variables or a secrets manager.
- File size and type are constrained by config; add explicit size checks before processing if needed.
