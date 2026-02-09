#!/usr/bin/env python3
"""
ARCHIVED: Legacy document scraping utilities for vendor shipment documents.
Replaced by the AI-powered shipment document processor (shipment_processor.py +
openai_extractor.py). Kept for reference only.
Supports PDF, Excel, and CSV formats.
"""

import os
import re
from typing import List, Dict, Any, Optional
from datetime import datetime

try:
    import pdfplumber
    PDF_AVAILABLE = True
except ImportError:
    PDF_AVAILABLE = False

try:
    import pandas as pd
    PANDAS_AVAILABLE = True
except ImportError:
    PANDAS_AVAILABLE = False


def scrape_vendor_pdf(pdf_path: str, column_mapping: Optional[Dict[str, str]] = None) -> List[Dict[str, Any]]:
    """Extract shipment data from vendor PDF."""
    if not PDF_AVAILABLE:
        raise ImportError("pdfplumber is required for PDF scraping. Install with: pip install pdfplumber")
    if not os.path.exists(pdf_path):
        raise FileNotFoundError(f"PDF file not found: {pdf_path}")
    default_mapping = {
        'Item Code': 'product_sku', 'SKU': 'product_sku', 'Product Code': 'product_sku', 'Code': 'product_sku',
        'Description': 'product_name', 'Product Name': 'product_name', 'Item': 'product_name',
        'Qty': 'quantity_expected', 'Quantity': 'quantity_expected', 'Qty Expected': 'quantity_expected',
        'Unit Price': 'unit_cost', 'Price': 'unit_cost', 'Cost': 'unit_cost',
        'Lot #': 'lot_number', 'Lot Number': 'lot_number', 'Lot': 'lot_number',
        'Expiration Date': 'expiration_date', 'Exp Date': 'expiration_date', 'Expiry': 'expiration_date'
    }
    if column_mapping:
        default_mapping.update(column_mapping)
    items = []
    with pdfplumber.open(pdf_path) as pdf:
        for page in pdf.pages:
            tables = page.extract_tables()
            for table in tables:
                if not table or len(table) < 2:
                    continue
                headers = [h.strip() if h else '' for h in table[0]]
                mapped_headers = {}
                for i, header in enumerate(headers):
                    header_lower = header.lower()
                    for key, value in default_mapping.items():
                        if key.lower() in header_lower:
                            mapped_headers[value] = i
                            break
                for row in table[1:]:
                    if not row or len(row) < 2:
                        continue
                    item = {}
                    if 'product_sku' in mapped_headers:
                        item['product_sku'] = str(row[mapped_headers['product_sku']]).strip() if row[mapped_headers['product_sku']] else None
                    if 'product_name' in mapped_headers:
                        item['product_name'] = str(row[mapped_headers['product_name']]).strip() if row[mapped_headers['product_name']] else None
                    if 'quantity_expected' in mapped_headers:
                        qty_str = str(row[mapped_headers['quantity_expected']]).strip() if row[mapped_headers['quantity_expected']] else '0'
                        qty_str = re.sub(r'[^\d.]', '', qty_str)
                        try:
                            item['quantity_expected'] = int(float(qty_str))
                        except (ValueError, TypeError):
                            item['quantity_expected'] = 0
                    if 'unit_cost' in mapped_headers:
                        cost_str = str(row[mapped_headers['unit_cost']]).strip() if row[mapped_headers['unit_cost']] else '0'
                        cost_str = re.sub(r'[^\d.]', '', cost_str)
                        try:
                            item['unit_cost'] = float(cost_str)
                        except (ValueError, TypeError):
                            item['unit_cost'] = 0.0
                    if 'lot_number' in mapped_headers:
                        item['lot_number'] = str(row[mapped_headers['lot_number']]).strip() if row[mapped_headers['lot_number']] else None
                    if 'expiration_date' in mapped_headers:
                        item['expiration_date'] = str(row[mapped_headers['expiration_date']]).strip() if row[mapped_headers['expiration_date']] else None
                    if item.get('product_sku') and item.get('quantity_expected', 0) > 0:
                        items.append(item)
    return items


def scrape_vendor_excel(file_path: str, sheet_name: Optional[str] = None, column_mapping: Optional[Dict[str, str]] = None) -> List[Dict[str, Any]]:
    """Extract shipment data from Excel file."""
    if not PANDAS_AVAILABLE:
        raise ImportError("pandas and openpyxl are required for Excel scraping. Install with: pip install pandas openpyxl")
    if not os.path.exists(file_path):
        raise FileNotFoundError(f"Excel file not found: {file_path}")
    default_mapping = {
        'SKU': 'product_sku', 'Item Code': 'product_sku', 'Product Code': 'product_sku', 'Code': 'product_sku',
        'Product Name': 'product_name', 'Description': 'product_name', 'Item': 'product_name',
        'Quantity': 'quantity_expected', 'Qty': 'quantity_expected', 'Qty Expected': 'quantity_expected',
        'Price': 'unit_cost', 'Unit Price': 'unit_cost', 'Cost': 'unit_cost', 'Unit Cost': 'unit_cost',
        'Cost Per Unit': 'unit_cost', 'Price Per Unit': 'unit_cost', 'Cost Price': 'unit_cost',
        'Purchase Price': 'unit_cost', 'Purchase Cost': 'unit_cost', 'Wholesale Price': 'unit_cost', 'Wholesale Cost': 'unit_cost',
        'Lot Number': 'lot_number', 'Lot #': 'lot_number', 'Lot': 'lot_number',
        'Expiration Date': 'expiration_date', 'Exp Date': 'expiration_date', 'Expiry': 'expiration_date'
    }
    if column_mapping:
        default_mapping.update(column_mapping)
    try:
        df = pd.read_excel(file_path, sheet_name=sheet_name) if sheet_name else pd.read_excel(file_path)
    except Exception as e:
        raise ValueError(f"Error reading Excel file: {e}")
    column_map = {}
    for old_col in df.columns:
        if old_col in default_mapping:
            column_map[old_col] = default_mapping[old_col]
        else:
            old_col_lower = old_col.lower().strip()
            for mapped_key in default_mapping:
                if mapped_key.lower().strip() == old_col_lower:
                    column_map[old_col] = default_mapping[mapped_key]
                    break
    df = df.rename(columns=column_map)
    if 'unit_cost' not in df.columns:
        cost_columns = [col for col in df.columns if any(k in col.lower() for k in ['cost', 'price', 'amount'])]
        if cost_columns:
            df = df.rename(columns={cost_columns[0]: 'unit_cost'})
    items = []
    for _, row in df.iterrows():
        item = {}
        if 'product_sku' in df.columns and pd.notna(row.get('product_sku')):
            item['product_sku'] = str(row['product_sku']).strip()
        if 'product_name' in df.columns and pd.notna(row.get('product_name')):
            item['product_name'] = str(row['product_name']).strip()
        if 'quantity_expected' in df.columns:
            qty = row.get('quantity_expected')
            try:
                item['quantity_expected'] = int(float(qty)) if pd.notna(qty) else 0
            except (ValueError, TypeError):
                item['quantity_expected'] = 0
        if 'unit_cost' in df.columns:
            cost = row.get('unit_cost')
            try:
                cost_str = str(cost).strip() if pd.notna(cost) else '0'
                cost_str = re.sub(r'[^\d.]', '', cost_str)
                item['unit_cost'] = float(cost_str) if cost_str else 0.0
            except (ValueError, TypeError):
                item['unit_cost'] = 0.0
        else:
            item['unit_cost'] = 0.0
        if 'lot_number' in df.columns and pd.notna(row.get('lot_number')):
            item['lot_number'] = str(row['lot_number']).strip()
        if 'expiration_date' in df.columns and pd.notna(row.get('expiration_date')):
            exp = row['expiration_date']
            item['expiration_date'] = exp.strftime('%Y-%m-%d') if isinstance(exp, datetime) else str(exp).strip()
        if item.get('product_sku') and item.get('quantity_expected', 0) > 0:
            items.append(item)
    return items


def scrape_vendor_csv(file_path: str, column_mapping: Optional[Dict[str, str]] = None) -> List[Dict[str, Any]]:
    """Extract shipment data from CSV file."""
    if not PANDAS_AVAILABLE:
        raise ImportError("pandas is required for CSV scraping. Install with: pip install pandas")
    if not os.path.exists(file_path):
        raise FileNotFoundError(f"CSV file not found: {file_path}")
    default_mapping = {
        'SKU': 'product_sku', 'Item Code': 'product_sku', 'Product Code': 'product_sku', 'Code': 'product_sku',
        'Product Name': 'product_name', 'Description': 'product_name', 'Item': 'product_name',
        'Quantity': 'quantity_expected', 'Qty': 'quantity_expected', 'Qty Expected': 'quantity_expected',
        'Price': 'unit_cost', 'Unit Price': 'unit_cost', 'Cost': 'unit_cost',
        'Lot Number': 'lot_number', 'Lot #': 'lot_number', 'Lot': 'lot_number',
        'Expiration Date': 'expiration_date', 'Exp Date': 'expiration_date', 'Expiry': 'expiration_date'
    }
    if column_mapping:
        default_mapping.update(column_mapping)
    try:
        df = pd.read_csv(file_path)
    except Exception as e:
        raise ValueError(f"Error reading CSV file: {e}")
    df = df.rename(columns=default_mapping)
    items = []
    for _, row in df.iterrows():
        item = {}
        if 'product_sku' in df.columns and pd.notna(row.get('product_sku')):
            item['product_sku'] = str(row['product_sku']).strip()
        if 'product_name' in df.columns and pd.notna(row.get('product_name')):
            item['product_name'] = str(row['product_name']).strip()
        if 'quantity_expected' in df.columns and pd.notna(row.get('quantity_expected')):
            try:
                item['quantity_expected'] = int(float(row['quantity_expected']))
            except (ValueError, TypeError):
                item['quantity_expected'] = 0
        if 'unit_cost' in df.columns and pd.notna(row.get('unit_cost')):
            try:
                item['unit_cost'] = float(row['unit_cost'])
            except (ValueError, TypeError):
                item['unit_cost'] = 0.0
        if 'lot_number' in df.columns and pd.notna(row.get('lot_number')):
            item['lot_number'] = str(row['lot_number']).strip()
        if 'expiration_date' in df.columns and pd.notna(row.get('expiration_date')):
            item['expiration_date'] = str(row['expiration_date']).strip()
        if item.get('product_sku') and item.get('quantity_expected', 0) > 0:
            items.append(item)
    return items


def scrape_document(file_path: str, column_mapping: Optional[Dict[str, str]] = None) -> List[Dict[str, Any]]:
    """Automatically detect file type and scrape document. ARCHIVED - use shipment_processor instead."""
    if not os.path.exists(file_path):
        raise FileNotFoundError(f"File not found: {file_path}")
    file_ext = os.path.splitext(file_path)[1].lower()
    if file_ext == '.pdf':
        return scrape_vendor_pdf(file_path, column_mapping)
    if file_ext in ['.xlsx', '.xls']:
        return scrape_vendor_excel(file_path, column_mapping=column_mapping)
    if file_ext == '.csv':
        return scrape_vendor_csv(file_path, column_mapping)
    raise ValueError(f"Unsupported file type: {file_ext}. Supported: .pdf, .xlsx, .xls, .csv")
