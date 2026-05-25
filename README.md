# Swftly POS

A full-featured, modern point-of-sale and retail management platform. Swftly runs as a
**web app**, a **desktop app** (Tauri), and a **customer-facing display**, backed by a
Python/Flask API and PostgreSQL. It combines checkout, inventory, shipments, accounting,
scheduling, and reporting in one system, with AI-assisted document processing and
integrations for QuickBooks, Shopify, Square, DoorDash, and Google Calendar.

> **License:** Apache License 2.0 — see [LICENSE](LICENSE).

---

## Features

### Point of Sale
- Checkout register with cart, discounts, returns, and split/multiple payment methods
- Cash register / drawer control with open/close reconciliation
- Customer-facing display (CDS) that updates live as items are rung up
- Digital and printable receipt generation
- Barcode and QR scanning (camera-based and hardware scanners)
- Restaurant-style table management and order assignment

### Inventory & Vendors
- Product catalog with SKUs, pricing, cost, categories, photos, and variants/ingredients
- Vendor management and per-vendor inventory tracking
- **FIFO inventory tracing** — see exactly which vendor's stock remains after sales
- Automatic stock updates via database triggers on shipment receipt and sale
- AI-powered product image matching and metadata extraction

### Shipments & Document Processing
- Upload vendor documents (PDF, Excel, CSV, Word, images)
- AI extraction (OpenAI text + vision) of SKU, quantity, cost, lot numbers, expirations
- Pending-shipment review flow: auto-match by SKU, verify quantities, flag discrepancies
- Approve to transfer into live inventory automatically

### Accounting
- Chart of accounts and double-entry accounting subsystem
- QuickBooks Online (QBO) sync of transactions and accounts
- Square historical data migration/import

### Employees, Users & Security
- Role-based access control (RBAC) with an `is_admin` flag and configurable roles
- PIN-based POS overrides for sensitive actions
- Passkey / WebAuthn sign-in and bcrypt-backed sessions
- Store codes, session tokens, and a privilege-escalation guard with denial audit logging
- Encrypted storage of sensitive API keys and tokens (e.g. QBO credentials)

### Scheduling & Calendar
- Employee scheduling and shift generation
- Google Calendar / iCal sync for appointments and shifts

### Statistics & Reporting
- Sales, inventory, and performance dashboards (Recharts)
- PDF report generation

### Notifications
- SMS and in-app notifications, with per-register notification settings

### Integrations
| Service | Purpose |
| --- | --- |
| QuickBooks Online | Accounting / transaction sync |
| Shopify | E-commerce catalog & order sync |
| Square | Historical data migration |
| DoorDash | Delivery / retail orders |
| Google Calendar | Scheduling sync |
| Clerk | Hosted auth (frontend) |

---

## Architecture

```
┌─────────────────────────────────────────────────────────┐
│  Clients                                                  │
│  • frontend/        React 18 + Vite web UI (register,     │
│                     dashboards, settings)                 │
│  • src-tauri/       Tauri 2 (Rust) desktop wrapper        │
│  • Customer Display customer_display_system.py            │
└───────────────────────────┬─────────────────────────────┘
                            │ REST / WebSocket
┌───────────────────────────┴─────────────────────────────┐
│  Server (Python)                                          │
│  • web_viewer.py    Flask app + Socket.IO (core/legacy)   │
│  • backend/         Structured API: controllers, models,  │
│                     services, middleware                  │
│  • database.py      Query layer (PostgreSQL)              │
│  • *_service.py     Integrations (QBO, Shopify, DoorDash) │
│  • *_extractor.py   AI document/metadata extraction       │
└───────────────────────────┬─────────────────────────────┘
                            │
                    ┌───────┴────────┐
                    │  PostgreSQL    │  (local or Supabase)
                    └────────────────┘
```

### Tech stack
- **Backend:** Python, Flask, Flask-SocketIO, PostgreSQL
- **AI:** OpenAI (text + vision extraction), PyTorch/torchvision (image matching)
- **Frontend:** React 18, Vite, TanStack Query, React Router, Recharts, FullCalendar,
  Framer Motion, three.js, html5-qrcode, JsBarcode, jsPDF
- **Desktop:** Tauri 2 (Rust)
- **Auth:** Clerk, WebAuthn/passkeys, bcrypt sessions
- **Docs:** PyMuPDF, pdfplumber, pandas, python-docx, openpyxl, Pillow

---

## Getting Started

### Prerequisites
- Python 3.10+
- Node.js 18+
- PostgreSQL 14+ (local) or a Supabase project
- (Desktop builds) Rust toolchain + Tauri prerequisites

### 1. Database
```bash
# Create the database
createdb pos_db    # or: psql -c "CREATE DATABASE pos_db;"

# Load the schema
psql -d pos_db -f database_schema_dump.sql
```
Using Supabase? See [docs/SUPABASE_SETUP.md](docs/SUPABASE_SETUP.md). The database URL is
used only by the backend — clients never see it.

### 2. Configure environment
```bash
cp .env.example .env
# Fill in DATABASE_URL, OpenAI key, integration credentials, etc.
```

### 3. Backend
```bash
python3 -m venv .venv && source .venv/bin/activate
pip install -r requirements.txt

# Seed an admin account and its permissions
python3 create_admin_account.py
python3 init_admin_permissions.py   # required — admin has no access without this

# Run the server
python3 web_viewer.py
```

### 4. Frontend
```bash
cd frontend
npm install
npm run dev          # web dev server
npm run build        # production web build
```

### 5. Desktop app (optional)
```bash
npm install
npm run tauri:dev    # run desktop app in dev
npm run tauri:build  # build a desktop binary
```

---

## Repository Layout

| Path | Description |
| --- | --- |
| `web_viewer.py` | Main Flask server (routing + core logic) |
| `database.py` / `database_postgres.py` | Database query layer |
| `backend/` | Structured API (controllers, models, services, middleware) |
| `frontend/` | React + Vite web client |
| `src-tauri/` | Tauri desktop wrapper (Rust) |
| `migrations/` | Incremental schema migrations |
| `scripts/` | Deployment and helper scripts |
| `docs/` | Setup guides and feature documentation |
| `*_service.py` | Third-party integrations |
| `*_extractor.py`, `metadata_extraction.py` | AI document/metadata extraction |
| `customer_display_system.py` | Customer-facing display |
| `receipt_generator.py` | Receipt rendering |

More detail per feature lives in [`docs/`](docs/) — e.g.
[`docs/application_overview.md`](docs/application_overview.md),
[`docs/RBAC_README.md`](docs/RBAC_README.md),
[`docs/SHIPMENT_DOCUMENT_PROCESSOR.md`](docs/SHIPMENT_DOCUMENT_PROCESSOR.md).

---

## Documentation

- [Application overview](docs/application_overview.md)
- [Complete setup guide](docs/COMPLETE_SETUP_GUIDE.md)
- [Supabase setup](docs/SUPABASE_SETUP.md)
- [RBAC / permissions](docs/RBAC_README.md)
- [Shipment document processor](docs/SHIPMENT_DOCUMENT_PROCESSOR.md)
- [QuickBooks / accounting](docs/features/accounting_subsystem.md)
- [Barcode scanning](docs/BARCODE_SCANNING_README.md)
- [Customer display](docs/CUSTOMER_DISPLAY_README.md)

---

## License

Licensed under the Apache License, Version 2.0. See [LICENSE](LICENSE) for the full text.
