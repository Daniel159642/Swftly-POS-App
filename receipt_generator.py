#!/usr/bin/env python3
"""
Receipt generation module with PDF and barcode support
"""

import sqlite3
from typing import Dict, Any, Optional
from datetime import datetime
import io

try:
    from reportlab.lib.pagesizes import letter, A4
    from reportlab.lib.units import inch
    from reportlab.pdfgen import canvas
    from reportlab.lib import colors
    from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
    from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle
    from reportlab.lib.enums import TA_CENTER, TA_LEFT, TA_RIGHT
    REPORTLAB_AVAILABLE = True
except ImportError:
    REPORTLAB_AVAILABLE = False
    print("Warning: reportlab not installed. Receipt generation will be limited.")

try:
    import qrcode
    QRCODE_AVAILABLE = True
except ImportError:
    QRCODE_AVAILABLE = False
    print("Warning: qrcode not installed. Barcode generation will be limited.")

DB_NAME = 'inventory.db'

def get_receipt_settings() -> Dict[str, Any]:
    """Get receipt settings from database"""
    conn = sqlite3.connect(DB_NAME)
    conn.row_factory = sqlite3.Row
    cursor = conn.cursor()
    
    cursor.execute("SELECT * FROM receipt_settings ORDER BY id DESC LIMIT 1")
    row = cursor.fetchone()
    conn.close()
    
    if row:
        return dict(row)
    else:
        # Return default settings
        return {
            'receipt_type': 'traditional',
            'store_name': 'Store',
            'store_address': '',
            'store_city': '',
            'store_state': '',
            'store_zip': '',
            'store_phone': '',
            'store_email': '',
            'store_website': '',
            'footer_message': 'Thank you for your business!',
            'return_policy': '',
            'show_tax_breakdown': 1,
            'show_payment_method': 1
        }

def generate_barcode_data(order_number: str) -> bytes:
    """Generate barcode image data for order number"""
    if not QRCODE_AVAILABLE:
        # Fallback: return empty bytes
        return b''
    
    try:
        qr = qrcode.QRCode(
            version=1,
            error_correction=qrcode.constants.ERROR_CORRECT_L,
            box_size=4,
            border=2,
        )
        qr.add_data(order_number)
        qr.make(fit=True)
        
        img = qr.make_image(fill_color="black", back_color="white")
        
        # Convert to bytes
        img_bytes = io.BytesIO()
        img.save(img_bytes, format='PNG')
        return img_bytes.getvalue()
    except Exception as e:
        print(f"Error generating barcode: {e}")
        return b''

def generate_receipt_pdf(order_data: Dict[str, Any], order_items: list) -> bytes:
    """
    Generate receipt PDF with barcode
    
    Args:
        order_data: Order information (order_id, order_number, order_date, etc.)
        order_items: List of order items with product details
    
    Returns:
        PDF bytes
    """
    if not REPORTLAB_AVAILABLE:
        raise ImportError("reportlab is required for receipt generation. Install with: pip install reportlab")
    
    buffer = io.BytesIO()
    
    # Generate barcode first if available
    order_number = order_data.get('order_number', '')
    barcode_data = None
    if order_number and QRCODE_AVAILABLE:
        try:
            barcode_data = generate_barcode_data(order_number)
        except Exception as e:
            print(f"Error generating barcode: {e}")
    
    # Thermal receipt format: 80mm wide (3.15 inches) - standard receipt printer size
    receipt_width = 3.15 * inch
    receipt_height = 11 * inch  # Standard letter height, but will cut at content
    
    doc = SimpleDocTemplate(buffer, 
                           pagesize=(receipt_width, receipt_height),
                           rightMargin=0.15*inch, 
                           leftMargin=0.15*inch,
                           topMargin=0.2*inch, 
                           bottomMargin=0.2*inch)
    
    # Get receipt settings
    settings = get_receipt_settings()
    
    # Build story (content)
    story = []
    styles = getSampleStyleSheet()
    
    # Custom styles for thermal receipt printer (smaller fonts, black and white)
    title_style = ParagraphStyle(
        'CustomTitle',
        parent=styles['Heading1'],
        fontSize=14,
        textColor=colors.black,
        alignment=TA_CENTER,
        spaceAfter=8,
        fontName='Helvetica-Bold'
    )
    
    header_style = ParagraphStyle(
        'CustomHeader',
        parent=styles['Normal'],
        fontSize=9,
        textColor=colors.black,
        alignment=TA_CENTER,
        spaceAfter=4,
        fontName='Helvetica'
    )
    
    normal_style = ParagraphStyle(
        'CustomNormal',
        parent=styles['Normal'],
        fontSize=8,
        textColor=colors.black,
        alignment=TA_LEFT,
        fontName='Helvetica'
    )
    
    small_style = ParagraphStyle(
        'CustomSmall',
        parent=styles['Normal'],
        fontSize=7,
        textColor=colors.black,
        alignment=TA_LEFT,
        fontName='Helvetica'
    )
    
    # Store header
    story.append(Paragraph(settings.get('store_name', 'Store'), title_style))
    
    # Store address
    address_parts = []
    if settings.get('store_address'):
        address_parts.append(settings['store_address'])
    if settings.get('store_city') or settings.get('store_state') or settings.get('store_zip'):
        city_state_zip = ', '.join(filter(None, [
            settings.get('store_city', ''),
            settings.get('store_state', ''),
            settings.get('store_zip', '')
        ]))
        if city_state_zip:
            address_parts.append(city_state_zip)
    if settings.get('store_phone'):
        address_parts.append(f"Phone: {settings['store_phone']}")
    if settings.get('store_email'):
        address_parts.append(settings['store_email'])
    if settings.get('store_website'):
        address_parts.append(settings['store_website'])
    
    for part in address_parts:
        if part:
            story.append(Paragraph(part, header_style))
    
    story.append(Spacer(1, 0.1*inch))
    
    # Divider line
    story.append(Paragraph("─" * 40, header_style))
    story.append(Spacer(1, 0.05*inch))
    
    # Order information
    try:
        order_date_str = order_data['order_date']
        if 'T' in order_date_str:
            order_date = datetime.fromisoformat(order_date_str.replace('Z', '+00:00'))
        else:
            order_date = datetime.strptime(order_date_str, '%Y-%m-%d %H:%M:%S')
        formatted_date = order_date.strftime('%m/%d/%Y %I:%M %p')
    except:
        formatted_date = order_data.get('order_date', '')
    
    story.append(Paragraph(f"Order: {order_data['order_number']}", normal_style))
    story.append(Paragraph(f"Date: {formatted_date}", normal_style))
    story.append(Spacer(1, 0.05*inch))
    story.append(Paragraph("─" * 40, header_style))
    story.append(Spacer(1, 0.05*inch))
    
    # Items table - compact format for receipt
    for item in order_items:
        product_name = item.get('product_name', 'Unknown')
        quantity = item.get('quantity', 0)
        unit_price = item.get('unit_price', 0.0)
        item_total = quantity * unit_price
        
        # Truncate long product names for receipt
        if len(product_name) > 25:
            product_name = product_name[:22] + '...'
        
        # Format as receipt line: "Product Name         2 x $10.00 = $20.00"
        line = f"{product_name:<20} {quantity} x ${unit_price:.2f} = ${item_total:.2f}"
        story.append(Paragraph(line, small_style))
    
    story.append(Spacer(1, 0.05*inch))
    story.append(Paragraph("─" * 40, header_style))
    story.append(Spacer(1, 0.05*inch))
    
    # Totals
    totals_data = []
    subtotal = order_data.get('subtotal', 0.0)
    totals_data.append(['Subtotal:', f"${subtotal:.2f}"])
    
    if settings.get('show_tax_breakdown', 1):
        tax_rate = order_data.get('tax_rate', 0.0) * 100
        tax_amount = order_data.get('tax_amount', 0.0)
        totals_data.append([f'Tax ({tax_rate:.1f}%):', f"${tax_amount:.2f}"])
    
    discount = order_data.get('discount', 0.0)
    if discount > 0:
        totals_data.append(['Discount:', f"-${discount:.2f}"])
    
    transaction_fee = order_data.get('transaction_fee', 0.0)
    if transaction_fee > 0:
        totals_data.append(['Transaction Fee:', f"${transaction_fee:.2f}"])
    
    tip = order_data.get('tip', 0.0)
    if tip > 0:
        totals_data.append(['Tip:', f"${tip:.2f}"])
    
    total = order_data.get('total', 0.0)
    totals_data.append(['<b>TOTAL:</b>', f"<b>${total:.2f}</b>"])
    
    # Totals - simple format for receipt
    for label, value in totals_data:
        if '<b>' in label or '<b>' in value:
            # Total line - bold
            line = f"{label.replace('<b>', '').replace('</b>', ''):<20} {value.replace('<b>', '').replace('</b>', '')}"
            story.append(Paragraph(f"<b>{line}</b>", normal_style))
        else:
            line = f"{label:<20} {value}"
            story.append(Paragraph(line, small_style))
    
    story.append(Spacer(1, 0.05*inch))
    story.append(Paragraph("─" * 40, header_style))
    story.append(Spacer(1, 0.05*inch))
    
    # Payment method
    if settings.get('show_payment_method', 1):
        payment_method = order_data.get('payment_method', 'Unknown')
        payment_method_display = payment_method.replace('_', ' ').title()
        story.append(Paragraph(f"Payment: {payment_method_display}", small_style))
        story.append(Spacer(1, 0.05*inch))
    
    # Barcode/QR Code - always try to show
    story.append(Spacer(1, 0.1*inch))
    if barcode_data:
        try:
            from reportlab.platypus import Image
            from reportlab.lib.utils import ImageReader
            barcode_img = ImageReader(io.BytesIO(barcode_data))
            # Center the barcode
            story.append(Paragraph(order_number, ParagraphStyle(
                'BarcodeLabel',
                parent=styles['Normal'],
                fontSize=7,
                textColor=colors.black,
                alignment=TA_CENTER,
                fontName='Helvetica'
            )))
            story.append(Spacer(1, 0.02*inch))
            # Smaller barcode for receipt (1 inch square) - centered using table
            from reportlab.platypus import Image
            img = Image(barcode_img, width=1.0*inch, height=1.0*inch)
            # Use a table to center the image
            barcode_table = Table([[img]], colWidths=[receipt_width - 0.3*inch])
            barcode_table.setStyle(TableStyle([
                ('ALIGN', (0, 0), (0, 0), 'CENTER'),
            ]))
            story.append(barcode_table)
            story.append(Spacer(1, 0.05*inch))
        except Exception as e:
            print(f"Error adding barcode to receipt: {e}")
            # Fallback: show order number if barcode fails
            story.append(Paragraph(f"Order #: {order_number}", small_style))
    else:
        # Show order number if barcode not available
        story.append(Paragraph(f"Order #: {order_number}", small_style))
    
    story.append(Spacer(1, 0.05*inch))
    story.append(Paragraph("─" * 40, header_style))
    
    # Footer
    story.append(Spacer(1, 0.1*inch))
    footer_text = settings.get('footer_message', 'Thank you for your business!')
    footer_style = ParagraphStyle(
        'CustomFooter',
        parent=styles['Normal'],
        fontSize=7,
        textColor=colors.black,
        alignment=TA_CENTER,
        spaceBefore=6,
        fontName='Helvetica'
    )
    story.append(Paragraph(footer_text, footer_style))
    
    # Return Policy (if set)
    return_policy = settings.get('return_policy', '')
    if return_policy:
        story.append(Spacer(1, 0.05*inch))
        story.append(Paragraph("─" * 40, header_style))
        story.append(Spacer(1, 0.05*inch))
        return_policy_style = ParagraphStyle(
            'ReturnPolicy',
            parent=styles['Normal'],
            fontSize=7,
            textColor=colors.black,
            alignment=TA_CENTER,
            spaceBefore=4,
            fontName='Helvetica'
        )
        story.append(Paragraph(f"Return Policy: {return_policy}", return_policy_style))
    
    story.append(Spacer(1, 0.1*inch))
    
    # Build PDF
    doc.build(story)
    
    pdf_bytes = buffer.getvalue()
    buffer.close()
    
    return pdf_bytes

def generate_receipt_with_barcode(order_id: int) -> Optional[bytes]:
    """
    Generate receipt PDF for an order
    
    Args:
        order_id: Order ID
    
    Returns:
        PDF bytes or None if error
    """
    conn = sqlite3.connect(DB_NAME)
    conn.row_factory = sqlite3.Row
    cursor = conn.cursor()
    
    try:
        # Get order data
        cursor.execute("""
            SELECT o.*, 
                   e.first_name || ' ' || e.last_name as employee_name,
                   c.customer_name
            FROM orders o
            LEFT JOIN employees e ON o.employee_id = e.employee_id
            LEFT JOIN customers c ON o.customer_id = c.customer_id
            WHERE o.order_id = ?
        """, (order_id,))
        
        order_row = cursor.fetchone()
        if not order_row:
            return None
        
        order_data = dict(order_row)
        
        # Get order items
        cursor.execute("""
            SELECT oi.*, i.product_name
            FROM order_items oi
            LEFT JOIN inventory i ON oi.product_id = i.product_id
            WHERE oi.order_id = ?
            ORDER BY oi.order_item_id
        """, (order_id,))
        
        order_items = [dict(row) for row in cursor.fetchall()]
        
        conn.close()
        
        # Generate PDF
        return generate_receipt_pdf(order_data, order_items)
        
    except Exception as e:
        print(f"Error generating receipt: {e}")
        import traceback
        traceback.print_exc()
        if conn:
            conn.close()
        return None

def generate_transaction_receipt(transaction_id: int) -> Optional[bytes]:
    """
    Generate receipt PDF for a transaction
    
    Args:
        transaction_id: Transaction ID
    
    Returns:
        PDF bytes or None if error
    """
    conn = sqlite3.connect(DB_NAME)
    conn.row_factory = sqlite3.Row
    cursor = conn.cursor()
    
    try:
        # Get transaction data
        cursor.execute("""
            SELECT t.*, 
                   e.first_name || ' ' || e.last_name as employee_name,
                   c.customer_name
            FROM transactions t
            LEFT JOIN employees e ON t.employee_id = e.employee_id
            LEFT JOIN customers c ON t.customer_id = c.customer_id
            WHERE t.transaction_id = ?
        """, (transaction_id,))
        
        transaction_row = cursor.fetchone()
        if not transaction_row:
            return None
        
        transaction = dict(transaction_row)
        
        # Get transaction items
        cursor.execute("""
            SELECT ti.*, i.product_name
            FROM transaction_items ti
            LEFT JOIN inventory i ON ti.product_id = i.product_id
            WHERE ti.transaction_id = ?
            ORDER BY ti.item_id
        """, (transaction_id,))
        
        transaction_items = [dict(row) for row in cursor.fetchall()]
        
        # Get payment method
        payment_method = 'Cash'  # Default
        try:
            cursor.execute("""
                SELECT pm.method_name, pm.method_type
                FROM payments p
                JOIN payment_methods pm ON p.payment_method_id = pm.payment_method_id
                WHERE p.transaction_id = ?
                ORDER BY p.payment_id DESC
                LIMIT 1
            """, (transaction_id,))
            
            payment_row = cursor.fetchone()
            if payment_row:
                payment_method = payment_row['method_name']
        except:
            # If payments table doesn't exist or query fails, use default
            pass
        
        # Convert transaction data to order-like format for receipt generation
        order_data = {
            'order_id': transaction['transaction_id'],
            'order_number': transaction['transaction_number'],
            'order_date': transaction['created_at'],
            'employee_name': transaction.get('employee_name', ''),
            'customer_name': transaction.get('customer_name', ''),
            'subtotal': transaction['subtotal'],
            'tax_amount': transaction['tax'],
            'tax_rate': transaction['tax'] / transaction['subtotal'] if transaction['subtotal'] > 0 else 0,
            'discount': transaction.get('discount', 0),
            'tip': transaction.get('tip', 0),
            'total': transaction['total'],
            'payment_method': payment_method,
            'transaction_fee': 0  # Transactions don't have transaction fees in this system
        }
        
        # Convert transaction items to order items format
        order_items = []
        for item in transaction_items:
            order_items.append({
                'product_name': item.get('product_name', 'Unknown Product'),
                'quantity': item['quantity'],
                'unit_price': item['unit_price'],
                'subtotal': item['subtotal'],
                'discount': item.get('discount', 0)
            })
        
        conn.close()
        
        # Generate PDF using existing function
        return generate_receipt_pdf(order_data, order_items)
        
    except Exception as e:
        print(f"Error generating transaction receipt: {e}")
        import traceback
        traceback.print_exc()
        if conn:
            conn.close()
        return None
