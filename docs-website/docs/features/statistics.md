# Statistics & Reporting
The Statistics subsystem provides real-time insights into the financial and operational health of the POS system.

## Architecture
- **Data Aggregation**: Aggregation logic resides within the core database layer and is exposed through backend API routes (e.g., `/api/sales`, `/api/inventory` endpoints in `web_viewer.py`).
- **Frontend Dashboards**: The React frontend consumes these endpoints to generate visualizations, chart data, and filterable tables.

## Key Capabilities
- **Sales Reporting**: Tracks revenue over time, filtering by day, week, month, or custom fiscal periods.
- **Tender/Payment Breakdown**: Separates sales by payment method (cash, credit card, store credit).
- **Inventory Velocity**: Tracks top-selling items and low-stock alerts.
- **Automated Delivery**: Uses the Notification service to automatically email end-of-day or end-of-week summary reports to administrators.
