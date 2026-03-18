# Shipments Processing
The Shipments subsystem orchestrates validating and extracting data from incoming vendor shipment documents (e.g., invoices or packing slips).

## Architecture
This subsystem utilizes advanced AI data extraction techniques:
1. **Shipment Processor Orchestrator (`shipment_processor.py`)**: The primary class responsible for taking an uploaded file, routing it to the extraction service, and validating the returned structured data.
2. **Document Processor & Metadata Extraction (`document_processor.py`, `metadata_extraction.py`)**: Components that parse PDFs or images. They extract text (via OCR if needed) and interpret unstructured data into structured product items.

## Key Capabilities
- **AI-Powered Data Extraction**: Sends unstructured document text to an AI pipeline (like OpenAI) to detect products, quantities, prices, and SKUs.
- **Self-validation**: The `validate_results` method verifies the mathematical integrity of the extracted invoice (e.g., ensures that `Quantity × Unit Price ≈ Total Price` for each line item). If this fails, it flags the row with a low confidence score for human review.
- **Legacy Compatibility**: Translates the modern AI output schema back into the legacy shipment format containing fields like `product_sku`, `quantity_expected`, `unit_cost`, and `expiration_date` for smooth database ingestion.
