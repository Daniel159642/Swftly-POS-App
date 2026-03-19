"""
Configuration for the AI-powered shipment document processor.
"""

EXTRACTION_CONFIG = {
    "confidence_threshold": 0.8,  # Re-process if below this
    "max_retries": 2,
    "supported_formats": ["pdf", "xlsx", "xls", "docx", "jpg", "jpeg", "png"],
    "max_file_size_mb": 20,
    # Which AI extractor to use: "claude" or "openai"
    # Claude: native PDF support, tool-use structured output, requires ANTHROPIC_API_KEY
    # OpenAI: gpt-4o vision, requires OPENAI_API_KEY
    "extractor": "claude",
}

CLAUDE_CONFIG = {
    "model": "claude-sonnet-4-6",
    "max_tokens": 4096,
    "use_native_pdf": True,  # Use Claude's native PDF document support
}
