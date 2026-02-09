"""
Configuration for the AI-powered shipment document processor.
"""

EXTRACTION_CONFIG = {
    "confidence_threshold": 0.8,  # Re-process if below this
    "max_retries": 2,
    "supported_formats": ["pdf", "xlsx", "xls", "docx", "jpg", "jpeg", "png"],
    "max_file_size_mb": 20,
}
