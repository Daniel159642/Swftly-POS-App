# Swftly Application Architecture Overview

This document provides a high-level overview of the major sections and components of the POS application.

## 1. Top-Level Core Modules (Python)
The root directory contains several monolithic scripts and core utility modules that drive the primary functionality of the application:
- **`web_viewer.py`**: The primary web server/Flask application file containing routing and core legacy logic.
- **`database.py` & `database_postgres.py`**: Core database interaction modules. `database.py` contains the bulk of the query logic, while postgres-specific logic is isolated where applicable.
- **`customer_display_system.py`**: Logic for managing the Customer Facing Display (CDS), updating screens when items are rung up.
- **`receipt_generator.py`**: Handles generating digital or printable receipts for transactions.

## 2. Integrations & Third-Party Services
External connections to third-party services are modularized:
- **`quickbooks_sync.py` & `pos_accounting_bridge.py`**: QuickBooks Online (QBO) integration, mapping the Chart of Accounts, and syncing transactions.
- **`calendar_integration.py` & `google_calendar_sync.py`**: Calendar integrations for employee scheduling or appointments.
- **`doordash_service.py`**: DoorDash API integration for delivery orders.
- **`shopify_service.py`**: E-commerce syncing with Shopify.
- **`square_migration.py` & `square_import.py`**: Utilities for migrating historical data from Square.

## 3. Backend Architecture (`/backend/`)
The `/backend/` directory represents a more modernized, structured API approach separating concerns:
- **`controllers/`**: API endpoint handlers that process incoming requests and format responses.
- **`models/`**: Data representations (e.g., `transaction_model.py`) mapping to database tables.
- **`services/`**: Business logic layer (e.g., handling complex multi-step processes before hitting the database).
- **`middleware/`**: Request interceptors (e.g., authentication, logging).

## 4. Frontends
The application has dedicated frontend client interfaces:
- **`/frontend/`**: The primary React-based web interface for web browsers, built using Vite. This powers the checkout register, settings, and management dashboards.
- **`/frontend-mobile/`**: The mobile-optimized or native companion application interface.

## 5. Security & Authentication
- **`permission_manager.py` & `scripts/setup_admin_pin.py`**: Handles user roles, permissions, and PIN-based POS overrides.
- **`encryption_utils.py`**: Core encryption functions for securing sensitive API keys and tokens (e.g., QBO tokens).

## 6. Document & AI Processing
- **`document_processor.py`**: General ingestion of documents/receipts.
- **`metadata_extraction.py` & `openai_extractor.py`**: Utilizes OpenAI algorithms for extracting invoice or product data from unstructured text/images.

## 7. Database Migrations & Scripts
- **`/migrations/`**: Alembic or similar SQL migration scripts for updating the schema incrementally.
- **`/scripts/`**: Misc deployment and helper scripts.
- **`scripts/setup_complete_database.py` & `accounting_bootstrap.py`**: Tools used for initially seeding the database with required tables, settings, and accounting structures.
