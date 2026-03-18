# Notifications
The Notifications subsystem routes systematic alerts, receipts, and order updates to both staff members and customers via Email and SMS.

## Architecture
Managed centrally by `notification_service.py`, this module acts as an omni-channel messaging router. 
- **Email**: Uses Gmail SMTP (testing) or AWS SES (production).
- **SMS**: Uses Email-to-SMS gateways (testing) or AWS SNS (production).

## Key Capabilities
- **Granular Preferences**: Settings control what types of notifications are sent and where (e.g., receipts, orders, reports, scheduling). Alerts can be routed to specific managers or broadcasted.
- **Digital Receipts**: Builds HTML and plain-text receipts (including embedded barcode/signature images via CID to avoid spam filters) for customers who opt-out of printed paper.
- **Order Alerts**: Notifies the store / specific employees when a new external order (e.g., DoorDash, Shopify) hits the system.
- **HTML Templating**: Supports dynamic substitution of variables (`{{customer_name}}`, `{{total}}`) into rich HTML email templates.
