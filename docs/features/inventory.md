# Inventory Management
The Inventory subsystem handles the lifecycle of products, from creation and categorization to quantity tracking and supplier integrations.

## Architecture
Inventory state and schema are primarily handled within the core `database.py` and structured models in `backend/models/`. Interacting features like metadata extraction utilize `metadata_extraction.py`.

## Key Capabilities
- **Hierarchical Categories**: Products can be assigned to deeply nested categories (e.g., "Electronics > Phones > Smartphones") to enable granular reporting and UI navigation.
- **Product Types**: Differentiates between 'products' (sellable at POS) and 'ingredients' (components of sellable items).
- **AI Metadata Extraction**: Automatically parses descriptions or names of new products to tag them with rich metadata and suggest appropriate categories using OpenAI algorithms.
- **Third-Party Integrations**: Maps internal inventory SKUs to external identifiers used by e-commerce platforms (Shopify) and food delivery apps (DoorDash), ensuring stock levels stay in parity across all channels.
- **Shipment Processing**: Tightly integrates with incoming shipments, where vendor invoices are scanned, parsed, and ingested directly into the inventory counts.
