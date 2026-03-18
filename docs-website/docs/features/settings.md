# Settings
The Settings subsystem is a distributed configuration layer that tailors the POS behavior to a specific establishment's needs.

## Architecture
Instead of a single monolithic settings table, configurations are grouped logically by domain (`pos_settings`, `receipt_settings`, `customer_display_settings`, `register_cash_settings`).

## Key Capabilities
- **POS Settings**: Controls global variables like default tax rates, currency formatting, and timezone.
- **Receipt Settings**: Customizes the header/footer text on printed receipts, business logo, and the digital receipt templates.
- **Customer Display Settings**: Configures the idle screen media (ads/videos) and behaviors of the Customer Facing Display.
- **Notification Settings**: Toggles which events (orders, reports, scheduling) trigger Emails or SMS messages to staff.
- **Register Cash Settings**: Defines rules for cash handling, such as accepted discrepancy thresholds before requiring manager approval to close a shift.
