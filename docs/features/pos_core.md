# POS Core Architecture
The Point of Sale (POS) system represents the primary operation of the application, encompassing the register, checkout process, and customer-facing interactions.

## Architecture
This subsystem is primarily driven by:
1. **Customer Display System (`customer_display_system.py`)**: A backend class that coordinates the state of a live transaction. It calculates totals, manages applied discounts, orchestrates payment processing, and broadcasts the state down to the Customer Facing Display (CFD/CDS).
2. **Receipt Generator (`receipt_generator.py`)**: Post-transaction handling that generates printable format receipts or email/SMS-based digital receipts based on customer preferences.
3. **Hardware Integrations (`barcode_scanner.py`, `customer_display_system.py`)**: Interfaces with physical hardware components like barcode scanners for rapid item lookup and the customer-facing secondary monitor.

## Key Capabilities
- **Transaction Lifecycles**: Initializes transactions with the handling employee, attaches items, applies discounts (e.g., student, employee), computes final totals, and commits them.
- **Payment Processing**: Manages the multi-tender functionality, communicating with the designated payment methods or card info.
- **Customer Preferences**: Captures whether the customer wants a printed receipt, email, or a text message.
- **Customer Display Sync**: Mirrors the transaction cart interactively for the customer's view.
