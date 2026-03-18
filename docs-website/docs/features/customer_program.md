# Customer Program (Rewards & Loyalty)
The Customer Program subsystem allows the POS to track returning customers and incentivize them.

## Architecture
- **Data Models**: Driven by the `customers` and `customer_rewards_settings` tables in the PostgreSQL database.
- **Application Logic**: Found in `database.py` and `CustomerDisplaySystem`, integrating customer lookup into the standard checkout flow.

## Key Capabilities
- **Customer Profiles**: Stores customer names, phone numbers, and emails.
- **Loyalty Points System**: Based on rules defined in `customer_rewards_settings`, customers accrue points for every dollar spent.
- **Redemption**: Points can be redeemed for discounts or store credit on future transactions.
- **Receipt Tracking**: Remembers a customer's preference for digital receipts (email/SMS), speeding up subsequent checkouts.
