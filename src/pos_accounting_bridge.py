#!/usr/bin/env python3
"""
POS → Accounting bridge: creates posted journal entries in accounting.transactions
when POS events occur (sale completed, shipment received).
Uses accounting.accounts / accounting.transactions (same data the Accounting page shows).
"""

from typing import Dict, Any, List, Optional
from datetime import datetime

# Database for order/shipment data (public schema)
from src.database import get_connection
from psycopg2.extras import RealDictCursor

# Accounting backend (accounting schema)
from backend.models.account_model import AccountRepository
from backend.models.transaction_model import TransactionRepository


def _load_posting_rule(establishment_id: Optional[int], event_type: str) -> Optional[Dict[str, Any]]:
    """
    Load a posting rule JSON for the given event_type.
    Priority: tenant-specific rule → global default (establishment_id IS NULL).
    Returns the parsed rule dict, or None if not found.
    """
    conn = get_connection()
    cur = conn.cursor(cursor_factory=RealDictCursor)
    try:
        if establishment_id:
            cur.execute("""
                SELECT rule_json FROM accounting.posting_rules
                WHERE establishment_id = %s AND event_type = %s AND is_active = TRUE
                LIMIT 1
            """, (establishment_id, event_type))
            row = cur.fetchone()
            if row:
                conn.close()
                return dict(row['rule_json']) if isinstance(row['rule_json'], dict) else row['rule_json']
        # Fall back to global default
        cur.execute("""
            SELECT rule_json FROM accounting.posting_rules
            WHERE establishment_id IS NULL AND event_type = %s AND is_active = TRUE
            LIMIT 1
        """, (event_type,))
        row = cur.fetchone()
        conn.close()
        if row:
            return dict(row['rule_json']) if isinstance(row['rule_json'], dict) else row['rule_json']
        return None
    except Exception as e:
        if not conn.closed:
            conn.close()
        print(f"_load_posting_rule({establishment_id}, {event_type}) failed: {e}")
        return None


def _build_posting_context(
    order: Dict[str, Any],
    payment: Dict[str, Any],
    cogs: float,
    platform_fee: float = 0.0,
) -> Dict[str, Any]:
    """
    Build the context variable dict used when evaluating a posting rule.
    Keys match the debit/credit/condition tokens in the rule JSON.

    Revenue is captured at GROSS (before discount) so that discounts are
    visible as contra-revenue on the P&L.
    """
    pm = str(order.get('payment_method') or '').lower()
    subtotal = float(order.get('subtotal') or 0)          # net of discount
    discount = float(order.get('discount_amount') or order.get('discount') or 0)
    loyalty_discount = float(order.get('points_discount') or order.get('loyalty_discount') or 0)
    tax = float(order.get('tax_amount') or 0)
    tip = float(order.get('tip') or 0)
    fee = float(payment.get('transaction_fee') or 0)
    net = float(payment.get('net_amount') or order.get('total') or 0)

    is_card = pm in ('credit_card', 'debit_card', 'mobile_payment', 'card')
    is_store_credit = (pm == 'store_credit')
    is_gift_card = (pm == 'gift_card')
    is_cash = not is_card and not is_store_credit and not is_gift_card

    gross_total = float(order.get('total') or 0)
    net_plus_tip = (gross_total if fee > 0 else net) + tip
    # Gross subtotal = net subtotal + all discounts (what we would have earned)
    gross_subtotal = subtotal + discount + loyalty_discount

    return {
        # ── Payment-method conditions ────────────────────────────────────────
        'is_cash': is_cash,
        'is_card': is_card,
        'is_store_credit': is_store_credit,
        'is_gift_card': is_gift_card,
        # ── Optional-line conditions ─────────────────────────────────────────
        'has_cogs': cogs > 0,
        'has_tip': tip > 0,
        'has_fee': fee > 0,
        'has_discount': discount > 0,
        'has_loyalty': loyalty_discount > 0,
        'has_platform_fee': platform_fee > 0,
        # ── Amount variables ─────────────────────────────────────────────────
        'net_plus_tip': net_plus_tip,
        'gross_plus_tip': gross_total + tip,
        'gross_subtotal': gross_subtotal,   # revenue before any discount
        'subtotal': subtotal,               # revenue after discount (net)
        'tax': tax,
        'discount': discount,
        'loyalty_discount': loyalty_discount,
        'platform_fee': platform_fee,
        'cogs': cogs,
        'tip': tip,
        'fee': fee,
    }


def _apply_posting_rule(
    rule: Dict[str, Any],
    context: Dict[str, Any],
    settings: Dict[str, Any],
) -> List[Dict[str, Any]]:
    """
    Evaluate a posting rule against a context dict, returning account-id-keyed line items.
    `settings` must be the accounting_settings row (with account_id columns).
    Lines whose condition evaluates to False are skipped.
    Lines with zero amount are skipped.
    Raises if a required account_key is missing in settings.
    """
    lines_out = []
    for line_spec in rule.get('lines', []):
        condition = line_spec.get('condition')
        if condition and not context.get(condition, False):
            continue  # Condition not met; skip line

        account_key = line_spec['account_key']
        account_id = settings.get(account_key)
        if not account_id:
            # Skip lines whose account isn't configured (e.g. inventory for service vertical)
            continue

        debit_key = line_spec.get('debit')
        credit_key = line_spec.get('credit')
        debit_amount = float(context.get(debit_key, 0)) if debit_key else 0.0
        credit_amount = float(context.get(credit_key, 0)) if credit_key else 0.0

        if debit_amount == 0 and credit_amount == 0:
            continue  # Nothing to post

        lines_out.append({
            'account_id': account_id,
            'debit_amount': debit_amount,
            'credit_amount': credit_amount,
            'description': line_spec.get('description', ''),
        })
    return lines_out


def _resolve_lines_to_account_ids(line_items: List[Dict[str, Any]], establishment_id: Optional[int] = None) -> List[Dict[str, Any]]:
    """Convert line items with account_number to lines with account_id.
    Prefers tenant-scoped accounts; falls back to global templates.
    Raises if any account cannot be found.
    """
    out = []
    for item in line_items:
        acct_num = item.get('account_number')
        if not acct_num:
            raise ValueError('Line item missing account_number')
        account = AccountRepository.find_by_account_number(str(acct_num), establishment_id)
        if not account:
            raise ValueError(f'Account not found: {acct_num} (establishment_id={establishment_id})')
        out.append({
            'account_id': account.id,
            'debit_amount': float(item.get('debit_amount', 0)),
            'credit_amount': float(item.get('credit_amount', 0)),
            'description': item.get('description', ''),
        })
    return out


def _payment_account_for_order(order: Dict[str, Any]) -> str:
    """Return account number for payment side of a sale: 1000 Cash, 1100 A/R, or 2110 Store Credit."""
    pm = str(order.get('payment_method') or '').lower()
    if pm == 'store_credit':
        return '2110'  # Store Credit Liability
    if pm in ('credit_card', 'debit_card', 'mobile_payment', 'card'):
        return '1100'  # Accounts Receivable
    return '1000'  # Cash


def _ensure_accounting_ready() -> None:
    """Ensure accounting schema and seed accounts exist so journalizing can succeed."""
    try:
        from src.accounting_bootstrap import ensure_accounting_schema
        ensure_accounting_schema()
    except Exception as e:
        print(f"Accounting bootstrap check: {e}")


def journalize_sale_to_accounting(order_id: int, employee_id: int) -> Dict[str, Any]:
    """
    Create and post a sales_receipt transaction in accounting.transactions for a completed order.
    Scoped to the order's establishment so each tenant gets their own ledger.
    Idempotent: skips if a posted transaction already exists for this order.
    """
    _ensure_accounting_ready()
    # Idempotency: skip if we already posted a sale for this order
    existing = TransactionRepository.find_by_source_document('order', order_id)
    if existing and existing.get('transaction', {}).get('is_posted'):
        return {'success': True, 'transaction_id': existing['transaction']['id'], 'skipped': True}

    conn = get_connection()
    cursor = conn.cursor(cursor_factory=RealDictCursor)
    try:
        cursor.execute("""
            SELECT o.total, o.tax_amount, o.subtotal,
                   COALESCE(o.transaction_fee, 0)          AS transaction_fee,
                   COALESCE(o.tip, 0)                      AS tip,
                   COALESCE(o.payment_method, 'cash')      AS payment_method,
                   COALESCE(o.discount_amount, o.discount, 0) AS discount_amount,
                   COALESCE(o.points_discount, 0)          AS points_discount,
                   COALESCE(o.platform_fee, 0)             AS platform_fee,
                   o.establishment_id
            FROM orders o WHERE o.order_id = %s
        """, (order_id,))

        order_row = cursor.fetchone()
        if not order_row:
            conn.close()
            return {'success': False, 'message': 'Order not found'}
        order = dict(order_row)
        establishment_id = order.get('establishment_id')
        order_platform_fee = float(order.get('platform_fee') or 0)

        cursor.execute("""
            SELECT net_amount, transaction_fee FROM payment_transactions WHERE order_id = %s LIMIT 1
        """, (order_id,))
        pay_row = cursor.fetchone()
        payment = dict(pay_row) if pay_row else {
            'net_amount': order['total'],
            'transaction_fee': order.get('transaction_fee', 0.0)
        }
        cursor.execute("""
            SELECT COALESCE(SUM(oi.quantity * i.product_cost), 0) as cogs
            FROM order_items oi
            JOIN inventory i ON oi.product_id = i.product_id
            WHERE oi.order_id = %s
        """, (order_id,))
        cogs_row = cursor.fetchone()
        cogs = float(cogs_row['cogs'] or 0) if cogs_row else 0.0
        conn.close()

        # Ensure this establishment is provisioned in accounting
        if establishment_id:
            from src.accounting_bootstrap import ensure_establishment_accounting
            ensure_establishment_accounting(establishment_id)

        # Try rule-engine path first (uses accounting_settings + posting_rules)
        lines = None
        if establishment_id:
            try:
                from src.accounting_bootstrap import get_accounting_settings
                settings = get_accounting_settings(establishment_id)
                rule = _load_posting_rule(establishment_id, 'pos_sale')
                if rule and settings:
                    ctx = _build_posting_context(order, payment, cogs, order_platform_fee)
                    lines = _apply_posting_rule(rule, ctx, settings)
            except Exception as re:
                print(f"Rule engine failed for order {order_id}, falling back to hardcoded: {re}")
                lines = None

        # Fallback: hardcoded account numbers (backwards compatible)
        if not lines:
            tip_amount = float(order.get('tip', 0) or 0)
            discount = float(order.get('discount_amount') or 0)
            cash_account = _payment_account_for_order(order)
            fee = float(payment.get('transaction_fee', 0) or 0)
            gross_subtotal = float(order['subtotal'] or 0) + discount
            line_items = [
                {'account_number': cash_account, 'debit_amount': float(payment['net_amount'] or 0) + tip_amount, 'credit_amount': 0, 'description': 'Payment received'},
                {'account_number': '4000', 'debit_amount': 0, 'credit_amount': gross_subtotal, 'description': 'Gross sales revenue'},
                {'account_number': '2040', 'debit_amount': 0, 'credit_amount': float(order['tax_amount'] or 0), 'description': 'Sales tax collected'},
            ]
            if discount > 0:
                line_items.append({'account_number': '4020', 'debit_amount': discount, 'credit_amount': 0, 'description': 'Discount applied'})
            if cogs > 0:
                line_items.append({'account_number': '5000', 'debit_amount': cogs, 'credit_amount': 0, 'description': 'Cost of goods sold'})
                line_items.append({'account_number': '1200', 'debit_amount': 0, 'credit_amount': cogs, 'description': 'Inventory reduction'})
            if tip_amount > 0:
                line_items.append({'account_number': '2210', 'debit_amount': 0, 'credit_amount': tip_amount, 'description': 'Tip collected (owed to employee)'})
            if fee > 0:
                line_items.append({'account_number': '5290', 'debit_amount': fee, 'credit_amount': 0, 'description': 'Card processing fee'})
                gross = float(order['total'] or 0)
                line_items[0]['debit_amount'] = gross + tip_amount
            if order_platform_fee > 0:
                line_items.append({'account_number': '4080', 'debit_amount': order_platform_fee, 'credit_amount': 0, 'description': 'Third-party platform fee'})
            lines = _resolve_lines_to_account_ids(line_items, establishment_id)
        data = {
            'transaction_number': f'POS-{order_id}',
            'transaction_date': datetime.now().date().isoformat(),
            'transaction_type': 'sales_receipt',
            'description': f'Sale – Order #{order_id}',
            'source_document_id': order_id,
            'source_document_type': 'order',
            'establishment_id': establishment_id,
            'lines': lines,
        }
        result = TransactionRepository.create(data, employee_id)
        txn_id = result['transaction']['id']
        TransactionRepository.post_transaction(txn_id, employee_id)
        return {'success': True, 'transaction_id': txn_id, 'entry_number': result['transaction'].get('transaction_number')}
    except Exception as e:
        if conn and not conn.closed:
            try:
                conn.rollback()
                conn.close()
            except Exception:
                pass
        return {'success': False, 'message': str(e)}


def journalize_shipment_received_to_accounting(pending_shipment_id: int, employee_id: int) -> Dict[str, Any]:
    """
    Create and post a journal entry in accounting.transactions when a pending shipment
    is completed (add-to-inventory). Uses total cost from pending_shipment_items.
    Idempotent: skips if a posted transaction already exists for this pending_shipment.
    """
    existing = TransactionRepository.find_by_source_document('pending_shipment', pending_shipment_id)
    if existing and existing.get('transaction', {}).get('is_posted'):
        return {'success': True, 'transaction_id': existing['transaction']['id'], 'skipped': True}

    conn = get_connection()
    cursor = conn.cursor(cursor_factory=RealDictCursor)
    try:
        cursor.execute("""
            SELECT ps.establishment_id,
                   COALESCE(SUM(psi.quantity_verified * psi.unit_cost), 0) as total_cost
            FROM pending_shipments ps
            JOIN pending_shipment_items psi ON psi.pending_shipment_id = ps.pending_shipment_id
            WHERE ps.pending_shipment_id = %s
            GROUP BY ps.establishment_id
        """, (pending_shipment_id,))
        row = cursor.fetchone()
        conn.close()
        if not row:
            return {'success': False, 'message': 'Shipment not found'}
        establishment_id = row.get('establishment_id')
        total_cost = float(row.get('total_cost') or 0)
        if total_cost <= 0:
            return {'success': False, 'message': 'Shipment has no cost (no items or zero cost)'}

        if establishment_id:
            from src.accounting_bootstrap import ensure_establishment_accounting
            ensure_establishment_accounting(establishment_id)

        line_items = [
            {'account_number': '1200', 'debit_amount': total_cost, 'credit_amount': 0, 'description': 'Inventory received'},
            {'account_number': '2000', 'debit_amount': 0, 'credit_amount': total_cost, 'description': 'Amount owed to vendor'},
        ]
        lines = _resolve_lines_to_account_ids(line_items, establishment_id)
        data = {
            'transaction_date': datetime.now().date().isoformat(),
            'transaction_type': 'purchase',
            'description': f'Inventory received – Shipment #{pending_shipment_id}',
            'source_document_id': pending_shipment_id,
            'source_document_type': 'pending_shipment',
            'establishment_id': establishment_id,
            'lines': lines,
        }
        result = TransactionRepository.create(data, employee_id)
        txn_id = result['transaction']['id']
        TransactionRepository.post_transaction(txn_id, employee_id)
        return {'success': True, 'transaction_id': txn_id, 'entry_number': result['transaction'].get('transaction_number')}
    except Exception as e:
        if conn and not conn.closed:
            try:
                conn.rollback()
                conn.close()
            except Exception:
                pass
        return {'success': False, 'message': str(e)}


def journalize_void_sale_to_accounting(order_id: int, employee_id: int) -> Dict[str, Any]:
    """
    Post a reversing entry in accounting.transactions when an order is voided.
    Same accounts as the sale but debits and credits swapped.
    Idempotent: skips if a posted order_void transaction already exists for this order.
    """
    existing = TransactionRepository.find_by_source_document('order_void', order_id)
    if existing and existing.get('transaction', {}).get('is_posted'):
        return {'success': True, 'transaction_id': existing['transaction']['id'], 'skipped': True}

    conn = get_connection()
    cursor = conn.cursor(cursor_factory=RealDictCursor)
    try:
        cursor.execute("""
            SELECT o.total, o.tax_amount, o.subtotal,
                   COALESCE(o.transaction_fee, 0) as transaction_fee,
                   COALESCE(o.tip, 0) as tip,
                   COALESCE(o.payment_method, 'cash') as payment_method,
                   o.establishment_id
            FROM orders o WHERE o.order_id = %s
        """, (order_id,))
        order_row = cursor.fetchone()
        if not order_row:
            conn.close()
            return {'success': False, 'message': 'Order not found'}
        order = dict(order_row)
        establishment_id = order.get('establishment_id')

        cursor.execute("""
            SELECT net_amount, transaction_fee FROM payment_transactions WHERE order_id = %s LIMIT 1
        """, (order_id,))
        pay_row = cursor.fetchone()
        payment = dict(pay_row) if pay_row else {'net_amount': order['total'], 'transaction_fee': order.get('transaction_fee', 0.0)}
        cursor.execute("""
            SELECT COALESCE(SUM(oi.quantity * i.product_cost), 0) as cogs
            FROM order_items oi
            JOIN inventory i ON oi.product_id = i.product_id
            WHERE oi.order_id = %s
        """, (order_id,))
        cogs_row = cursor.fetchone()
        cogs = float(cogs_row['cogs'] or 0) if cogs_row else 0.0
        conn.close()

        # Try rule-engine path first
        lines = None
        if establishment_id:
            try:
                from src.accounting_bootstrap import get_accounting_settings
                settings = get_accounting_settings(establishment_id)
                rule = _load_posting_rule(establishment_id, 'pos_void')
                if rule and settings:
                    ctx = _build_posting_context(order, payment, cogs)
                    lines = _apply_posting_rule(rule, ctx, settings)
            except Exception as re:
                print(f"Rule engine failed for void order {order_id}, falling back to hardcoded: {re}")
                lines = None

        # Fallback: hardcoded account numbers (reversal of sale fallback)
        if not lines:
            cash_account = _payment_account_for_order(order)
            tip_amount = float(order.get('tip', 0) or 0)
            discount = float(order.get('discount_amount') or 0)
            net_and_tip = float(payment['net_amount'] or 0) + tip_amount
            fee = float(payment.get('transaction_fee', 0) or 0)
            if fee > 0:
                net_and_tip = float(order['total'] or 0) + tip_amount
            gross_subtotal = float(order['subtotal'] or 0) + discount
            line_items = [
                {'account_number': cash_account, 'debit_amount': 0, 'credit_amount': net_and_tip, 'description': 'Void – payment reversed'},
                {'account_number': '4000', 'debit_amount': gross_subtotal, 'credit_amount': 0, 'description': 'Void – gross revenue reversed'},
                {'account_number': '2040', 'debit_amount': float(order['tax_amount'] or 0), 'credit_amount': 0, 'description': 'Void – sales tax reversed'},
            ]
            if discount > 0:
                line_items.append({'account_number': '4020', 'debit_amount': 0, 'credit_amount': discount, 'description': 'Void – discount reversed'})
            if cogs > 0:
                line_items.append({'account_number': '5000', 'debit_amount': 0, 'credit_amount': cogs, 'description': 'Void – COGS reversed'})
                line_items.append({'account_number': '1200', 'debit_amount': cogs, 'credit_amount': 0, 'description': 'Void – inventory restored'})
            if tip_amount > 0:
                line_items.append({'account_number': '2210', 'debit_amount': tip_amount, 'credit_amount': 0, 'description': 'Void – tip liability reversed'})
            if fee > 0:
                line_items.append({'account_number': '5290', 'debit_amount': 0, 'credit_amount': fee, 'description': 'Void – processing fee reversed'})
            lines = _resolve_lines_to_account_ids(line_items, establishment_id)
        data = {
            'transaction_date': datetime.now().date().isoformat(),
            'transaction_type': 'refund',
            'description': f'Void – Order #{order_id}',
            'source_document_id': order_id,
            'source_document_type': 'order_void',
            'establishment_id': establishment_id,
            'lines': lines,
        }
        result = TransactionRepository.create(data, employee_id)
        txn_id = result['transaction']['id']
        TransactionRepository.post_transaction(txn_id, employee_id)
        return {'success': True, 'transaction_id': txn_id}
    except Exception as e:
        if conn and not conn.closed:
            try:
                conn.rollback()
                conn.close()
            except Exception:
                pass
        return {'success': False, 'message': str(e)}


def journalize_return_to_accounting(
    return_id: int, order_id: int, return_amount: float, employee_id: int,
    payment_method: Optional[str] = None,
    return_type: Optional[str] = None,
    return_tip_amount: float = 0,
    tip_refund_from: str = 'store',
    establishment_id: Optional[int] = None,
) -> Dict[str, Any]:
    """
    Create and post a return in accounting.transactions.
    Refund: Debit 4100, Credit Cash or A/R.
    Exchange (store credit): Debit 4100, Credit 2110 Store Credit Liability.
    When tip_refund_from='employee' and return_tip_amount > 0: also post a second entry to deduct
    the refunded tip from employee (Debit 2210 Tips Payable, Credit 4100) so store does not absorb the cost.
    Idempotent: skips if a posted transaction already exists for this return.
    """
    if return_amount <= 0:
        return {'success': False, 'message': 'Return amount must be positive'}
    existing = TransactionRepository.find_by_source_document('return', return_id)
    if existing and existing.get('transaction', {}).get('is_posted'):
        return {'success': True, 'transaction_id': existing['transaction']['id'], 'skipped': True}

    # Look up establishment_id from the order if not provided
    if establishment_id is None and order_id:
        try:
            conn = get_connection()
            cur = conn.cursor(cursor_factory=RealDictCursor)
            cur.execute("SELECT establishment_id FROM orders WHERE order_id = %s", (order_id,))
            row = cur.fetchone()
            conn.close()
            if row:
                establishment_id = row.get('establishment_id')
        except Exception:
            pass

    is_exchange = (return_type or '').lower() == 'exchange'
    if is_exchange:
        # Store credit issued — credit goes to Store Credit Liability
        credit_account = '2110'
    elif payment_method and str(payment_method).lower() == 'gift_card':
        credit_account = '2310'  # reload gift card liability
    elif payment_method and str(payment_method).lower() in ('credit_card', 'debit_card', 'mobile_payment', 'card'):
        credit_account = '1100'  # card refund via A/R
    else:
        credit_account = '1000'  # cash refund
    line_items = [
        # 4010 Sales Returns & Refunds (contra-revenue) — NOT 4100 Other Income
        {'account_number': '4010', 'debit_amount': return_amount, 'credit_amount': 0, 'description': 'Customer return / refund'},
        {'account_number': credit_account, 'debit_amount': 0, 'credit_amount': return_amount,
         'description': 'Store credit issued' if is_exchange else 'Refund disbursed'},
    ]
    try:
        lines = _resolve_lines_to_account_ids(line_items, establishment_id)
        data = {
            'transaction_date': datetime.now().date().isoformat(),
            'transaction_type': 'refund',
            'description': f'Return #{return_id} – Order #{order_id}',
            'source_document_id': return_id,
            'source_document_type': 'return',
            'establishment_id': establishment_id,
            'lines': lines,
        }
        result = TransactionRepository.create(data, employee_id)
        txn_id = result['transaction']['id']
        TransactionRepository.post_transaction(txn_id, employee_id)

        # When refunding tip and deducting from employee: reduce 2210 Tips Payable
        tip_deduction = float(return_tip_amount or 0)
        if tip_deduction > 0 and (tip_refund_from or '').strip().lower() == 'employee':
            try:
                tip_lines = _resolve_lines_to_account_ids([
                    {'account_number': '2210', 'debit_amount': tip_deduction, 'credit_amount': 0, 'description': 'Tip refund – reduce tips payable'},
                    {'account_number': '4010', 'debit_amount': 0, 'credit_amount': tip_deduction, 'description': 'Tip refund – offset return amount (employee absorbed)'},
                ], establishment_id)
                tip_data = {
                    'transaction_date': datetime.now().date().isoformat(),
                    'transaction_type': 'journal_entry',
                    'description': f'Return #{return_id} – Tip refund deducted from employee',
                    'source_document_id': return_id,
                    'source_document_type': 'return_tip_deduction',
                    'establishment_id': establishment_id,
                    'lines': tip_lines,
                }
                tip_result = TransactionRepository.create(tip_data, employee_id)
                TransactionRepository.post_transaction(tip_result['transaction']['id'], employee_id)
            except Exception as te:
                # 2210 may not exist; log and continue (refund entry already posted)
                print(f"Tip deduction entry skipped (2210 or create failed): {te}")
        return {'success': True, 'transaction_id': txn_id}
    except Exception as e:
        return {'success': False, 'message': str(e)}


def journalize_register_close_to_accounting(
    session_id: int, employee_id: int, expected_cash: float, ending_cash: float, discrepancy: float,
    establishment_id: Optional[int] = None,
) -> Dict[str, Any]:
    """Post cash over/short when closing register. Only posts if |discrepancy| > 0.01."""
    if abs(discrepancy) < 0.01:
        return {'success': True, 'transaction_id': None}
    amt = abs(discrepancy)
    if discrepancy > 0:
        # Cash over: more cash than expected — credit 4120 Cash Over/Short (income)
        line_items = [
            {'account_number': '1000', 'debit_amount': amt, 'credit_amount': 0, 'description': 'Cash over – register close'},
            {'account_number': '4120', 'debit_amount': 0, 'credit_amount': amt, 'description': 'Cash over income'},
        ]
    else:
        # Cash short: less cash than expected — debit 4120 Cash Over/Short (expense side)
        line_items = [
            {'account_number': '4120', 'debit_amount': amt, 'credit_amount': 0, 'description': 'Cash short expense'},
            {'account_number': '1000', 'debit_amount': 0, 'credit_amount': amt, 'description': 'Cash short – register close'},
        ]
    try:
        lines = _resolve_lines_to_account_ids(line_items, establishment_id)
        data = {
            'transaction_date': datetime.now().date().isoformat(),
            'transaction_type': 'adjustment',
            'description': f'Register close – session {session_id}',
            'source_document_id': session_id,
            'source_document_type': 'register_close',
            'establishment_id': establishment_id,
            'lines': lines,
        }
        result = TransactionRepository.create(data, employee_id)
        txn_id = result['transaction']['id']
        TransactionRepository.post_transaction(txn_id, employee_id)
        return {'success': True, 'transaction_id': txn_id}
    except Exception as e:
        return {'success': False, 'message': str(e)}


def journalize_cash_transaction_to_accounting(
    session_id: Optional[int], employee_id: int, transaction_type: str, amount: float,
    reason: Optional[str], cash_transaction_id: Optional[int] = None,
    establishment_id: Optional[int] = None,
) -> Dict[str, Any]:
    """Post cash in/out: Cash + Owner's Equity (3000)."""
    amount = float(amount)
    if amount <= 0:
        return {'success': False, 'message': 'Amount must be positive'}
    typ = (transaction_type or '').lower()
    if typ in ('cash_in', 'deposit'):
        line_items = [
            {'account_number': '1000', 'debit_amount': amount, 'credit_amount': 0, 'description': reason or 'Cash in'},
            {'account_number': '3000', 'debit_amount': 0, 'credit_amount': amount, 'description': reason or 'Owner deposit'},
        ]
    elif typ in ('cash_out', 'withdrawal'):
        line_items = [
            {'account_number': '3000', 'debit_amount': amount, 'credit_amount': 0, 'description': reason or 'Owner withdrawal'},
            {'account_number': '1000', 'debit_amount': 0, 'credit_amount': amount, 'description': reason or 'Cash out'},
        ]
    else:
        line_items = [
            {'account_number': '1000', 'debit_amount': amount, 'credit_amount': 0, 'description': reason or 'Adjustment'},
            {'account_number': '3000', 'debit_amount': 0, 'credit_amount': amount, 'description': reason or 'Adjustment'},
        ]
    try:
        lines = _resolve_lines_to_account_ids(line_items, establishment_id)
        data = {
            'transaction_date': datetime.now().date().isoformat(),
            'transaction_type': 'transfer' if typ in ('cash_in', 'cash_out', 'deposit', 'withdrawal') else 'adjustment',
            'description': f'Register: {transaction_type} – {reason or "N/A"}',
            'source_document_id': cash_transaction_id or session_id,
            'source_document_type': 'cash_transaction',
            'establishment_id': establishment_id,
            'lines': lines,
        }
        result = TransactionRepository.create(data, employee_id)
        txn_id = result['transaction']['id']
        TransactionRepository.post_transaction(txn_id, employee_id)
        return {'success': True, 'transaction_id': txn_id}
    except Exception as e:
        return {'success': False, 'message': str(e)}


def journalize_damaged_goods_to_accounting(discrepancy_id: int, amount: float, employee_id: int,
                                            establishment_id: Optional[int] = None) -> Dict[str, Any]:
    """Post damaged goods: Debit 5100, Credit 1200 Inventory."""
    amount = float(amount)
    if amount <= 0:
        return {'success': False, 'message': 'Amount must be positive'}
    line_items = [
        {'account_number': '5100', 'debit_amount': amount, 'credit_amount': 0, 'description': 'Damaged goods write-off'},
        {'account_number': '1200', 'debit_amount': 0, 'credit_amount': amount, 'description': 'Inventory reduction'},
    ]
    try:
        lines = _resolve_lines_to_account_ids(line_items, establishment_id)
        data = {
            'transaction_date': datetime.now().date().isoformat(),
            'transaction_type': 'adjustment',
            'description': f'Damaged goods – Discrepancy #{discrepancy_id}',
            'source_document_id': discrepancy_id,
            'source_document_type': 'discrepancy',
            'establishment_id': establishment_id,
            'lines': lines,
        }
        result = TransactionRepository.create(data, employee_id)
        txn_id = result['transaction']['id']
        TransactionRepository.post_transaction(txn_id, employee_id)
        return {'success': True, 'transaction_id': txn_id}
    except Exception as e:
        return {'success': False, 'message': str(e)}


def journalize_vendor_credit_to_accounting(discrepancy_id: int, amount: float, employee_id: int,
                                            establishment_id: Optional[int] = None) -> Dict[str, Any]:
    """
    Post vendor credit for a discrepancy: reduce A/P and expense.
    Dr 2000 A/P, Cr 5100 Expense (vendor credit for discrepancy).
    Idempotent: skips if a posted transaction already exists for this discrepancy_vendor_credit.
    """
    amount = float(amount)
    if amount <= 0:
        return {'success': False, 'message': 'Amount must be positive'}
    existing = TransactionRepository.find_by_source_document('discrepancy_vendor_credit', discrepancy_id)
    if existing and existing.get('transaction', {}).get('is_posted'):
        return {'success': True, 'transaction_id': existing['transaction']['id'], 'skipped': True}
    line_items = [
        {'account_number': '2000', 'debit_amount': amount, 'credit_amount': 0, 'description': 'Vendor credit – A/P reduced'},
        {'account_number': '5100', 'debit_amount': 0, 'credit_amount': amount, 'description': 'Vendor credit – Discrepancy #' + str(discrepancy_id)},
    ]
    try:
        lines = _resolve_lines_to_account_ids(line_items, establishment_id)
        data = {
            'transaction_date': datetime.now().date().isoformat(),
            'transaction_type': 'adjustment',
            'description': f'Vendor credit – Discrepancy #{discrepancy_id}',
            'source_document_id': discrepancy_id,
            'source_document_type': 'discrepancy_vendor_credit',
            'establishment_id': establishment_id,
            'lines': lines,
        }
        result = TransactionRepository.create(data, employee_id)
        txn_id = result['transaction']['id']
        TransactionRepository.post_transaction(txn_id, employee_id)
        return {'success': True, 'transaction_id': txn_id}
    except Exception as e:
        return {'success': False, 'message': str(e)}


def journalize_cash_drop_to_accounting(
    count_id: int, amount: float, employee_id: int, reason: Optional[str] = None,
    establishment_id: Optional[int] = None,
) -> Dict[str, Any]:
    """
    Post cash drop to accounting: transfer from register.
    Dr 3000 Owner's Equity, Cr 1000 Cash (cash drop from register).
    Idempotent: skips if a posted transaction already exists for this daily_cash_count.
    """
    amount = float(amount)
    if amount <= 0:
        return {'success': False, 'message': 'Amount must be positive'}
    existing = TransactionRepository.find_by_source_document('daily_cash_count', count_id)
    if existing and existing.get('transaction', {}).get('is_posted'):
        return {'success': True, 'transaction_id': existing['transaction']['id'], 'skipped': True}
    desc = reason or 'Daily cash drop'
    line_items = [
        {'account_number': '3000', 'debit_amount': amount, 'credit_amount': 0, 'description': desc},
        {'account_number': '1000', 'debit_amount': 0, 'credit_amount': amount, 'description': 'Cash drop from register'},
    ]
    try:
        lines = _resolve_lines_to_account_ids(line_items, establishment_id)
        data = {
            'transaction_date': datetime.now().date().isoformat(),
            'transaction_type': 'transfer',
            'description': f'Cash drop – Count #{count_id}',
            'source_document_id': count_id,
            'source_document_type': 'daily_cash_count',
            'establishment_id': establishment_id,
            'lines': lines,
        }
        result = TransactionRepository.create(data, employee_id)
        txn_id = result['transaction']['id']
        TransactionRepository.post_transaction(txn_id, employee_id)
        return {'success': True, 'transaction_id': txn_id}
    except Exception as e:
        return {'success': False, 'message': str(e)}


# =============================================================================
# Gift Cards
# =============================================================================

def journalize_gift_card_sale_to_accounting(
    gift_card_id: int, amount: float, employee_id: int,
    establishment_id: Optional[int] = None,
) -> Dict[str, Any]:
    """
    Record a gift card purchase.
    Dr Cash (1000), Cr Gift Cards Liability (2310).
    """
    amount = float(amount)
    if amount <= 0:
        return {'success': False, 'message': 'Amount must be positive'}
    existing = TransactionRepository.find_by_source_document('gift_card_sale', gift_card_id)
    if existing and existing.get('transaction', {}).get('is_posted'):
        return {'success': True, 'transaction_id': existing['transaction']['id'], 'skipped': True}
    line_items = [
        {'account_number': '1000', 'debit_amount': amount, 'credit_amount': 0, 'description': 'Gift card purchase – cash received'},
        {'account_number': '2310', 'debit_amount': 0, 'credit_amount': amount, 'description': 'Gift card liability created'},
    ]
    try:
        lines = _resolve_lines_to_account_ids(line_items, establishment_id)
        result = TransactionRepository.create({
            'transaction_date': datetime.now().date().isoformat(),
            'transaction_type': 'sales_receipt',
            'description': f'Gift card sale – GC #{gift_card_id}',
            'source_document_id': gift_card_id,
            'source_document_type': 'gift_card_sale',
            'establishment_id': establishment_id,
            'lines': lines,
        }, employee_id)
        txn_id = result['transaction']['id']
        TransactionRepository.post_transaction(txn_id, employee_id)
        return {'success': True, 'transaction_id': txn_id}
    except Exception as e:
        return {'success': False, 'message': str(e)}


def journalize_gift_card_redemption_to_accounting(
    gift_card_id: int, amount: float, employee_id: int,
    establishment_id: Optional[int] = None,
) -> Dict[str, Any]:
    """
    Reduce the Gift Cards Liability when a gift card is used as payment.
    Dr Gift Cards Liability (2310), Cr Cash proxy (1000).
    The corresponding order sale entry covers the revenue side.
    """
    amount = float(amount)
    if amount <= 0:
        return {'success': False, 'message': 'Amount must be positive'}
    existing = TransactionRepository.find_by_source_document('gift_card_redemption', gift_card_id)
    if existing and existing.get('transaction', {}).get('is_posted'):
        return {'success': True, 'transaction_id': existing['transaction']['id'], 'skipped': True}
    line_items = [
        {'account_number': '2310', 'debit_amount': amount, 'credit_amount': 0, 'description': 'Gift card liability redeemed'},
        {'account_number': '1000', 'debit_amount': 0, 'credit_amount': amount, 'description': 'Gift card payment cleared'},
    ]
    try:
        lines = _resolve_lines_to_account_ids(line_items, establishment_id)
        result = TransactionRepository.create({
            'transaction_date': datetime.now().date().isoformat(),
            'transaction_type': 'journal_entry',
            'description': f'Gift card redemption – GC #{gift_card_id}',
            'source_document_id': gift_card_id,
            'source_document_type': 'gift_card_redemption',
            'establishment_id': establishment_id,
            'lines': lines,
        }, employee_id)
        txn_id = result['transaction']['id']
        TransactionRepository.post_transaction(txn_id, employee_id)
        return {'success': True, 'transaction_id': txn_id}
    except Exception as e:
        return {'success': False, 'message': str(e)}


def journalize_gift_card_breakage_to_accounting(
    gift_card_id: int, amount: float, employee_id: int,
    establishment_id: Optional[int] = None,
) -> Dict[str, Any]:
    """
    Recognize income from an expired / written-off gift card.
    Dr Gift Cards Liability (2310), Cr Gift Card Breakage Income (4130).
    """
    amount = float(amount)
    if amount <= 0:
        return {'success': False, 'message': 'Amount must be positive'}
    existing = TransactionRepository.find_by_source_document('gift_card_breakage', gift_card_id)
    if existing and existing.get('transaction', {}).get('is_posted'):
        return {'success': True, 'transaction_id': existing['transaction']['id'], 'skipped': True}
    line_items = [
        {'account_number': '2310', 'debit_amount': amount, 'credit_amount': 0, 'description': 'Gift card liability written off (breakage)'},
        {'account_number': '4130', 'debit_amount': 0, 'credit_amount': amount, 'description': 'Gift card breakage income recognized'},
    ]
    try:
        lines = _resolve_lines_to_account_ids(line_items, establishment_id)
        result = TransactionRepository.create({
            'transaction_date': datetime.now().date().isoformat(),
            'transaction_type': 'journal_entry',
            'description': f'Gift card breakage – GC #{gift_card_id}',
            'source_document_id': gift_card_id,
            'source_document_type': 'gift_card_breakage',
            'establishment_id': establishment_id,
            'lines': lines,
        }, employee_id)
        txn_id = result['transaction']['id']
        TransactionRepository.post_transaction(txn_id, employee_id)
        return {'success': True, 'transaction_id': txn_id}
    except Exception as e:
        return {'success': False, 'message': str(e)}


# =============================================================================
# Inventory Adjustments  (manual / stolen / spoiled / shrinkage)
# =============================================================================

def journalize_inventory_adjustment_to_accounting(
    adjustment_id: int, amount: float, employee_id: int,
    reason: str = 'adjustment',
    establishment_id: Optional[int] = None,
) -> Dict[str, Any]:
    """
    Record a manual inventory adjustment.

    reason → expense account used:
      'stolen' / 'theft' / 'shrinkage' → 5310 Theft & Shrinkage
      'damaged' / 'spoilage' / 'expired' → 5300 Inventory Write-Off
      anything else → 5100 Operating Expenses

    Positive amount = inventory decreased (write-off).
    Negative amount = inventory increased (upward correction).
    """
    if amount == 0:
        return {'success': False, 'message': 'Amount cannot be zero'}
    existing = TransactionRepository.find_by_source_document('inventory_adjustment', adjustment_id)
    if existing and existing.get('transaction', {}).get('is_posted'):
        return {'success': True, 'transaction_id': existing['transaction']['id'], 'skipped': True}

    amt = abs(float(amount))
    reason_lower = (reason or '').lower()
    if reason_lower in ('stolen', 'theft', 'shrinkage'):
        expense_acct, desc_expense = '5310', 'Theft / shrinkage write-off'
    elif reason_lower in ('damaged', 'spoilage', 'spoiled', 'expired'):
        expense_acct, desc_expense = '5300', 'Inventory write-off (damaged/spoiled)'
    else:
        expense_acct, desc_expense = '5100', f'Inventory adjustment – {reason}'

    if float(amount) > 0:
        line_items = [
            {'account_number': expense_acct, 'debit_amount': amt, 'credit_amount': 0, 'description': desc_expense},
            {'account_number': '1200', 'debit_amount': 0, 'credit_amount': amt, 'description': 'Inventory reduction'},
        ]
    else:
        line_items = [
            {'account_number': '1200', 'debit_amount': amt, 'credit_amount': 0, 'description': 'Inventory adjustment – increase'},
            {'account_number': expense_acct, 'debit_amount': 0, 'credit_amount': amt, 'description': 'Adjustment offset'},
        ]
    try:
        lines = _resolve_lines_to_account_ids(line_items, establishment_id)
        result = TransactionRepository.create({
            'transaction_date': datetime.now().date().isoformat(),
            'transaction_type': 'adjustment',
            'description': f'Inventory adjustment #{adjustment_id} – {reason}',
            'source_document_id': adjustment_id,
            'source_document_type': 'inventory_adjustment',
            'establishment_id': establishment_id,
            'lines': lines,
        }, employee_id)
        txn_id = result['transaction']['id']
        TransactionRepository.post_transaction(txn_id, employee_id)
        return {'success': True, 'transaction_id': txn_id}
    except Exception as e:
        return {'success': False, 'message': str(e)}


# =============================================================================
# Third-Party Platform Commissions  (Shopify, DoorDash, Uber Eats, etc.)
# =============================================================================

def journalize_platform_commission_to_accounting(
    reference_id: int, commission_amount: float, employee_id: int,
    platform: str = 'platform',
    establishment_id: Optional[int] = None,
) -> Dict[str, Any]:
    """
    Record a periodic platform commission / fee invoice.
    Dr Third-Party Platform Fees (4080), Cr Accounts Payable (2000).

    Use for monthly Shopify subscription, DoorDash payout reconciliation, etc.
    Per-order fees are handled inline in journalize_sale_to_accounting.
    """
    commission_amount = float(commission_amount)
    if commission_amount <= 0:
        return {'success': False, 'message': 'Commission amount must be positive'}
    existing = TransactionRepository.find_by_source_document('platform_commission', reference_id)
    if existing and existing.get('transaction', {}).get('is_posted'):
        return {'success': True, 'transaction_id': existing['transaction']['id'], 'skipped': True}
    line_items = [
        {'account_number': '4080', 'debit_amount': commission_amount, 'credit_amount': 0, 'description': f'{platform} platform commission'},
        {'account_number': '2000', 'debit_amount': 0, 'credit_amount': commission_amount, 'description': f'{platform} commission payable'},
    ]
    try:
        lines = _resolve_lines_to_account_ids(line_items, establishment_id)
        result = TransactionRepository.create({
            'transaction_date': datetime.now().date().isoformat(),
            'transaction_type': 'expense',
            'description': f'{platform} commission – Ref #{reference_id}',
            'source_document_id': reference_id,
            'source_document_type': 'platform_commission',
            'establishment_id': establishment_id,
            'lines': lines,
        }, employee_id)
        txn_id = result['transaction']['id']
        TransactionRepository.post_transaction(txn_id, employee_id)
        return {'success': True, 'transaction_id': txn_id}
    except Exception as e:
        return {'success': False, 'message': str(e)}


# =============================================================================
# Exchange Credit Applied  (store credit used on a subsequent order)
# =============================================================================

def journalize_exchange_credit_applied_to_accounting(
    exchange_credit_id: int, amount: float, employee_id: int,
    establishment_id: Optional[int] = None,
) -> Dict[str, Any]:
    """
    Reduce the Store Credit Liability when exchange credit is redeemed on a new order.
    Dr Store Credit Liability (2110), Cr Sales Revenue (4000).
    """
    amount = float(amount)
    if amount <= 0:
        return {'success': False, 'message': 'Amount must be positive'}
    existing = TransactionRepository.find_by_source_document('exchange_credit_applied', exchange_credit_id)
    if existing and existing.get('transaction', {}).get('is_posted'):
        return {'success': True, 'transaction_id': existing['transaction']['id'], 'skipped': True}
    line_items = [
        {'account_number': '2110', 'debit_amount': amount, 'credit_amount': 0, 'description': 'Store credit redeemed – liability cleared'},
        {'account_number': '4000', 'debit_amount': 0, 'credit_amount': amount, 'description': 'Revenue from store credit redemption'},
    ]
    try:
        lines = _resolve_lines_to_account_ids(line_items, establishment_id)
        result = TransactionRepository.create({
            'transaction_date': datetime.now().date().isoformat(),
            'transaction_type': 'journal_entry',
            'description': f'Exchange credit applied – Ref #{exchange_credit_id}',
            'source_document_id': exchange_credit_id,
            'source_document_type': 'exchange_credit_applied',
            'establishment_id': establishment_id,
            'lines': lines,
        }, employee_id)
        txn_id = result['transaction']['id']
        TransactionRepository.post_transaction(txn_id, employee_id)
        return {'success': True, 'transaction_id': txn_id}
    except Exception as e:
        return {'success': False, 'message': str(e)}
