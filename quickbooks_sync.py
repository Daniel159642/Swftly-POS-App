import os
import json
import requests
import base64
from datetime import datetime, timedelta
from database_postgres import get_connection

# Intuit OAuth 2.0 Endpoints
QBO_DISCOVERY_URL = "https://developer.api.intuit.com/.well-known/openid_sandbox_configuration" # Sandbox discovery
# Production discovery: "https://developer.api.intuit.com/.well-known/openid_configuration"

# You typically discover these dynamically, but hardcoding the standard endpoints is common:
QBO_AUTHORIZATION_URL = "https://appcenter.intuit.com/connect/oauth2"
QBO_TOKEN_URL = "https://oauth.platform.intuit.com/oauth2/v1/tokens/bearer"

def get_oauth_url() -> str:
    """Generate the OAuth2 URL for the user to grant access to QuickBooks Online"""
    client_id = os.environ.get("QBO_CLIENT_ID")
    redirect_uri = os.environ.get("QBO_REDIRECT_URI", "http://localhost:5001/api/integrations/quickbooks/callback")
    
    if not client_id:
        raise ValueError("QBO_CLIENT_ID environment variable not set.")
        
    scopes = "com.intuit.quickbooks.accounting"
    # CSRF Token (should ideally be generated dynamically and stored in session, simplified here)
    state = "pos_qbo_auth_state" 
    
    url = (
        f"{QBO_AUTHORIZATION_URL}"
        f"?client_id={client_id}"
        f"&response_type=code"
        f"&scope={scopes}"
        f"&redirect_uri={redirect_uri}"
        f"&state={state}"
    )
    return url

def exchange_code_for_tokens(auth_code: str, realm_id: str):
    """Exchange the authorization code for an access token and refresh token"""
    client_id = os.environ.get("QBO_CLIENT_ID")
    client_secret = os.environ.get("QBO_CLIENT_SECRET")
    redirect_uri = os.environ.get("QBO_REDIRECT_URI", "http://localhost:5001/api/integrations/quickbooks/callback")
    
    if not client_id or not client_secret:
        raise ValueError("QBO_CLIENT_ID or QBO_CLIENT_SECRET not set.")

    # Intuit requires Basic Auth using base64 encoded client_id:client_secret
    auth_header_value = base64.b64encode(f"{client_id}:{client_secret}".encode('utf-8')).decode('utf-8')

    headers = {
        "Authorization": f"Basic {auth_header_value}",
        "Content-Type": "application/x-www-form-urlencoded",
        "Accept": "application/json"
    }

    data = {
        "grant_type": "authorization_code",
        "code": auth_code,
        "redirect_uri": redirect_uri
    }

    response = requests.post(QBO_TOKEN_URL, headers=headers, data=data)
    
    if response.status_code != 200:
        raise Exception(f"Failed to get tokens: {response.text}")
        
    token_data = response.json()
    save_tokens('quickbooks', token_data['access_token'], token_data['refresh_token'], realm_id, token_data.get('expires_in', 3600))
    return True

def save_tokens(provider_name: str, access_token: str, refresh_token: str, realm_id: str, expires_in_sec: int):
    """Save or update tokens in the integrations table"""
    conn = get_connection()
    try:
        cursor = conn.cursor()
        expires_at = datetime.now() + timedelta(seconds=expires_in_sec)
        
        cursor.execute("""
            INSERT INTO integrations (provider_name, access_token, refresh_token, realm_id, expires_at, updated_at)
            VALUES (%s, %s, %s, %s, %s, CURRENT_TIMESTAMP)
            ON CONFLICT (provider_name) DO UPDATE SET
                access_token = EXCLUDED.access_token,
                refresh_token = EXCLUDED.refresh_token,
                realm_id = EXCLUDED.realm_id,
                expires_at = EXCLUDED.expires_at,
                updated_at = CURRENT_TIMESTAMP
        """, (provider_name, access_token, refresh_token, realm_id, expires_at))
        conn.commit()
    finally:
        cursor.close()
        conn.close()

def get_stored_tokens(provider_name: str = 'quickbooks'):
    """Retrieve stored tokens. Note: in a real app, check expires_at and use refresh_token if needed."""
    conn = get_connection()
    try:
        cursor = conn.cursor()
        cursor.execute("SELECT access_token, refresh_token, realm_id, expires_at FROM integrations WHERE provider_name = %s", (provider_name,))
        row = cursor.fetchone()
        if not row:
            return None
            
        data = {
            'access_token': row.get('access_token'),
            'refresh_token': row.get('refresh_token'),
            'realm_id': row.get('realm_id'),
            'expires_at': row.get('expires_at')
        }
        return data
    finally:
        cursor.close()
        conn.close()

def refresh_qbo_tokens(refresh_token: str, realm_id: str):
    """Refresh the QuickBooks access token using the refresh token."""
    client_id = os.environ.get("QBO_CLIENT_ID")
    client_secret = os.environ.get("QBO_CLIENT_SECRET")
    
    if not client_id or not client_secret:
        raise ValueError("QBO_CLIENT_ID or QBO_CLIENT_SECRET not set.")
        
    auth_header_value = base64.b64encode(f"{client_id}:{client_secret}".encode('utf-8')).decode('utf-8')

    headers = {
        "Authorization": f"Basic {auth_header_value}",
        "Content-Type": "application/x-www-form-urlencoded",
        "Accept": "application/json"
    }

    data = {
        "grant_type": "refresh_token",
        "refresh_token": refresh_token
    }

    response = requests.post(QBO_TOKEN_URL, headers=headers, data=data)
    
    if response.status_code != 200:
        raise Exception(f"Failed to refresh tokens: {response.text}")
        
    token_data = response.json()
    save_tokens('quickbooks', token_data['access_token'], token_data['refresh_token'], realm_id, token_data.get('expires_in', 3600))
    return token_data['access_token']

def get_valid_qbo_tokens():
    """Get stored tokens, refreshing them if they are expired or expiring soon."""
    tokens = get_stored_tokens('quickbooks')
    if not tokens:
        return None
        
    expires_at = tokens.get('expires_at')
    # If expiring within 5 minutes, refresh
    if expires_at and datetime.now() + timedelta(minutes=5) >= expires_at:
        try:
            new_access_token = refresh_qbo_tokens(tokens['refresh_token'], tokens['realm_id'])
            tokens['access_token'] = new_access_token
        except Exception as e:
            print(f"Error refreshing QBO tokens: {e}")
            return None
            
    return tokens

def get_qbo_api_base_url():
    """Return Sandbox URL for development or production URL from env."""
    return os.environ.get("QBO_API_BASE_URL", "https://sandbox-quickbooks.api.intuit.com")

def fetch_qbo_accounts():
    """Fetch all accounts from the QuickBooks Chart of Accounts."""
    tokens = get_valid_qbo_tokens()
    if not tokens:
        raise Exception("QuickBooks not connected or tokens invalid.")
        
    realm_id = tokens['realm_id']
    access_token = tokens['access_token']
    base_url = get_qbo_api_base_url()
    
    # Query QBO for all active accounts
    query = "select * from Account where Active = true"
    url = f"{base_url}/v3/company/{realm_id}/query?query={requests.utils.quote(query)}"
    
    headers = {
        "Authorization": f"Bearer {access_token}",
        "Accept": "application/json"
    }
    
    response = requests.get(url, headers=headers)
    if response.status_code != 200:
        raise Exception(f"Failed to fetch accounts from QuickBooks: {response.text}")
        
    data = response.json()
    return data.get('QueryResponse', {}).get('Account', [])

def sync_qbo_accounts_to_db():
    """Sync QBO accounts to local DB mapping."""
    qbo_accounts = fetch_qbo_accounts()
    
    conn = get_connection()
    try:
        cursor = conn.cursor()
        
        # simple matching strategy: match by name or account number
        mapped_count: int = 0
        added_count: int = 0
        
        # We need a robust mapping depending on your POS accounting structure. 
        # For now, we find local accounts with the exact same name or number and link them.
        for qbo_acc in qbo_accounts:
            qbo_id = qbo_acc.get('Id')
            qbo_name = qbo_acc.get('Name')
            qbo_number = qbo_acc.get('AcctNum')
            qbo_type = qbo_acc.get('AccountType')
            qbo_subtype = qbo_acc.get('AccountSubType')
            
            # Check if we already have it mapped
            cursor.execute("SELECT account_id FROM accounting.accounts WHERE qbo_id = %s", (qbo_id,))
            if cursor.fetchone():
                continue # Already mapped
                
            # Try to match by number or name
            matched_id = None
            if qbo_number:
                cursor.execute("SELECT account_id FROM accounting.accounts WHERE account_number = %s AND qbo_id IS NULL", (qbo_number,))
                row = cursor.fetchone()
                if row:
                    matched_id = row['account_id']
            
            if not matched_id and qbo_name:
                cursor.execute("SELECT account_id FROM accounting.accounts WHERE name ILIKE %s AND qbo_id IS NULL", (qbo_name,))
                row = cursor.fetchone()
                if row:
                    matched_id = row['account_id']
                    
            if matched_id:
                # Update map
                cursor.execute("UPDATE accounting.accounts SET qbo_id = %s WHERE account_id = %s", (qbo_id, matched_id))
                mapped_count += 1
            else:
                # If no match is found, perhaps we create a new account in our DB? 
                # Depends on DB requirements. Skipping auto-create for now to be safe, 
                # or we could insert it if we have all required fields.
                # Here we just log it or skip.
                pass
                
        conn.commit()
        return {'success': True, 'mapped_count': mapped_count, 'added_count': added_count, 'message': f'Successfully mapped {mapped_count} accounts.'}
    except Exception as e:
        conn.rollback()
        raise e
    finally:
        cursor.close()
        conn.close()

def sync_qbo_customers_to_db():
    """Sync QBO customers to local DB."""
    tokens = get_valid_qbo_tokens()
    if not tokens:
        raise Exception("QuickBooks not connected or tokens invalid.")
        
    realm_id = tokens['realm_id']
    access_token = tokens['access_token']
    base_url = get_qbo_api_base_url()
    
    query = "select * from Customer where Active = true"
    url = f"{base_url}/v3/company/{realm_id}/query?query={requests.utils.quote(query)}"
    headers = { "Authorization": f"Bearer {access_token}", "Accept": "application/json" }
    
    response = requests.get(url, headers=headers)
    if response.status_code != 200:
        raise Exception(f"Failed to fetch customers from QuickBooks: {response.text}")
        
    qbo_customers = response.json().get('QueryResponse', {}).get('Customer', [])
    
    conn = get_connection()
    try:
        cursor = conn.cursor()
        mapped_count = 0
        added_count = 0
        
        for qbo_cust in qbo_customers:
            qbo_id = qbo_cust.get('Id')
            display_name = qbo_cust.get('DisplayName')
            first_name = qbo_cust.get('GivenName', '')
            last_name = qbo_cust.get('FamilyName', '')
            primary_email = qbo_cust.get('PrimaryEmailAddr', {}).get('Address')
            primary_phone = qbo_cust.get('PrimaryPhone', {}).get('FreeFormNumber')
            
            # Check if mapped
            cursor.execute("SELECT customer_id FROM customers WHERE qbo_id = %s", (qbo_id,))
            if cursor.fetchone():
                continue
                
            # Try to match by email
            matched_id = None
            if primary_email:
                cursor.execute("SELECT customer_id FROM customers WHERE email ILIKE %s AND qbo_id IS NULL", (primary_email,))
                row = cursor.fetchone()
                if row:
                    matched_id = row['customer_id']
            
            # Match by name
            if not matched_id and display_name:
                cursor.execute("SELECT customer_id FROM customers WHERE CONCAT(first_name, ' ', last_name) ILIKE %s AND qbo_id IS NULL", (display_name,))
                row = cursor.fetchone()
                if row:
                    matched_id = row['customer_id']
                    
            if matched_id:
                cursor.execute("UPDATE customers SET qbo_id = %s WHERE customer_id = %s", (qbo_id, matched_id))
                mapped_count += 1
            else:
                # Insert new
                if first_name or last_name or display_name:
                    fn = first_name or (display_name.split(' ')[0] if display_name else '')
                    ln = last_name or (' '.join(display_name.split(' ')[1:]) if display_name and ' ' in display_name else '')
                    cursor.execute("""
                        INSERT INTO customers (first_name, last_name, email, phone, qbo_id)
                        VALUES (%s, %s, %s, %s, %s)
                    """, (fn, ln, primary_email, primary_phone, qbo_id))
                    added_count += 1
                    
        conn.commit()
        return {'success': True, 'mapped_count': mapped_count, 'added_count': added_count, 'message': f'Mapped {mapped_count} and added {added_count} customers.'}
    except Exception as e:
        conn.rollback()
        raise e
    finally:
        cursor.close()
        conn.close()

def sync_qbo_vendors_to_db():
    """Sync QBO vendors to local DB."""
    tokens = get_valid_qbo_tokens()
    if not tokens:
        raise Exception("QuickBooks not connected or tokens invalid.")
        
    realm_id = tokens['realm_id']
    access_token = tokens['access_token']
    base_url = get_qbo_api_base_url()
    
    query = "select * from Vendor where Active = true"
    url = f"{base_url}/v3/company/{realm_id}/query?query={requests.utils.quote(query)}"
    headers = { "Authorization": f"Bearer {access_token}", "Accept": "application/json" }
    
    response = requests.get(url, headers=headers)
    if response.status_code != 200:
        raise Exception(f"Failed to fetch vendors from QuickBooks: {response.text}")
        
    qbo_vendors = response.json().get('QueryResponse', {}).get('Vendor', [])
    
    conn = get_connection()
    try:
        cursor = conn.cursor()
        mapped_count = 0
        added_count = 0
        
        for qbo_vend in qbo_vendors:
            qbo_id = qbo_vend.get('Id')
            display_name = qbo_vend.get('DisplayName')
            company_name = qbo_vend.get('CompanyName')
            name_to_use = company_name or display_name
            primary_email = qbo_vend.get('PrimaryEmailAddr', {}).get('Address')
            primary_phone = qbo_vend.get('PrimaryPhone', {}).get('FreeFormNumber')
            
            # Check if mapped
            cursor.execute("SELECT vendor_id FROM vendors WHERE qbo_id = %s", (qbo_id,))
            if cursor.fetchone():
                continue
                
            # Try to match by email
            matched_id = None
            if primary_email:
                cursor.execute("SELECT vendor_id FROM vendors WHERE email ILIKE %s AND qbo_id IS NULL", (primary_email,))
                row = cursor.fetchone()
                if row:
                    matched_id = row['vendor_id']
            
            # Match by name
            if not matched_id and name_to_use:
                cursor.execute("SELECT vendor_id FROM vendors WHERE name ILIKE %s AND qbo_id IS NULL", (name_to_use,))
                row = cursor.fetchone()
                if row:
                    matched_id = row['vendor_id']
                    
            if matched_id:
                cursor.execute("UPDATE vendors SET qbo_id = %s WHERE vendor_id = %s", (qbo_id, matched_id))
                mapped_count += 1
            else:
                # Insert new
                if name_to_use:
                    cursor.execute("""
                        INSERT INTO vendors (name, email, phone, qbo_id)
                        VALUES (%s, %s, %s, %s)
                    """, (name_to_use, primary_email, primary_phone, qbo_id))
                    added_count += 1
                    
        conn.commit()
        return {'success': True, 'mapped_count': mapped_count, 'added_count': added_count, 'message': f'Mapped {mapped_count} and added {added_count} vendors.'}
    except Exception as e:
        conn.rollback()
        raise e
    finally:
        cursor.close()
        conn.close()

def sync_qbo_products_to_db():
    """Sync local inventory to QuickBooks Items (NonInventory)."""
    tokens = get_valid_qbo_tokens()
    if not tokens:
        raise Exception("QuickBooks not connected or tokens invalid.")
        
    realm_id = tokens['realm_id']
    access_token = tokens['access_token']
    base_url = get_qbo_api_base_url()
    
    headers = {
        "Authorization": f"Bearer {access_token}",
        "Accept": "application/json",
        "Content-Type": "application/json"
    }
    
    conn = get_connection()
    try:
        import psycopg2.extras
        cursor = conn.cursor(cursor_factory=psycopg2.extras.RealDictCursor)
        
        cursor.execute("SELECT qbo_id FROM accounting.accounts WHERE account_number = '4000'")
        income_acct = cursor.fetchone()
        income_account_id = income_acct['qbo_id'] if income_acct else None
        
        cursor.execute("SELECT product_id, product_name, sku, product_price FROM inventory WHERE qbo_id IS NULL LIMIT 50")
        products = cursor.fetchall()
        
        added_count = 0
        error_count = 0
        
        for p in products:
            # Try to query if item already exists by Name
            query = f"select * from Item where Name='{p['product_name'][:100].replace('\'', '\\\'')}'"
            url = f"{base_url}/v3/company/{realm_id}/query?query={requests.utils.quote(query)}"
            res = requests.get(url, headers=headers)
            existing_id = None
            if res.status_code == 200:
                items = res.json().get('QueryResponse', {}).get('Item', [])
                if items: existing_id = items[0]['Id']
                
            if existing_id:
                cursor.execute("UPDATE inventory SET qbo_id = %s WHERE product_id = %s", (existing_id, p['product_id']))
                added_count += 1
                continue
                
            payload = {
                "Name": p['product_name'][:100],
                "Sku": p['sku'][:100] if p['sku'] else str(p['product_id']),
                "Type": "NonInventory",
                "UnitPrice": float(p['product_price'] or 0)
            }
            if income_account_id:
                payload["IncomeAccountRef"] = {"value": str(income_account_id)}
                
            post_url = f"{base_url}/v3/company/{realm_id}/item"
            res = requests.post(post_url, headers=headers, json=payload)
            if res.status_code == 200:
                item_data = res.json().get('Item', {})
                new_qbo_id = item_data.get('Id')
                if new_qbo_id:
                    cursor.execute("UPDATE inventory SET qbo_id = %s WHERE product_id = %s", (new_qbo_id, p['product_id']))
                    added_count += 1
            else:
                error_count += 1
                
        conn.commit()
        return {'success': True, 'added_count': added_count, 'error_count': error_count, 'message': f'Synced {added_count} products. ({error_count} errors)'}
    except Exception as e:
        conn.rollback()
        raise e
    finally:
        cursor.close()
        conn.close()

def _get_or_create_qbo_pos_item(headers, base_url, realm_id, cursor):
    """Retrieve or create a generic POS Sales Item in QBO."""
    query = "select * from Item where Name='POS Sales' and Active=true"
    url = f"{base_url}/v3/company/{realm_id}/query?query={requests.utils.quote(query)}"
    res = requests.get(url, headers=headers)
    if res.status_code == 200:
        items = res.json().get('QueryResponse', {}).get('Item', [])
        if items:
            return items[0]['Id']
            
    # Try to find income account 4000
    cursor.execute("SELECT qbo_id FROM accounting.accounts WHERE account_number = '4000'")
    acct = cursor.fetchone()
    income_account_id = acct['qbo_id'] if acct and acct.get('qbo_id') else None
    
    payload = {
        "Name": "POS Sales",
        "Type": "Service"
    }
    if income_account_id:
        payload["IncomeAccountRef"] = {"value": str(income_account_id)}
        
    post_url = f"{base_url}/v3/company/{realm_id}/item"
    res = requests.post(post_url, headers=headers, json=payload)
    if res.status_code == 200:
        return res.json().get('Item', {}).get('Id')
    return None

def sync_transactions_to_qbo():
    """Sync local sales and refunds to QuickBooks as SalesReceipts and RefundReceipts."""
    tokens = get_valid_qbo_tokens()
    if not tokens:
        raise Exception("QuickBooks not connected or tokens invalid.")
        
    realm_id = tokens['realm_id']
    access_token = tokens['access_token']
    base_url = get_qbo_api_base_url()
    
    headers = {
        "Authorization": f"Bearer {access_token}",
        "Accept": "application/json",
        "Content-Type": "application/json"
    }
    
    conn = get_connection()
    try:
        import psycopg2.extras
        cursor = conn.cursor(cursor_factory=psycopg2.extras.RealDictCursor)
        
        # We find posted accounting entries without qbo_id
        cursor.execute("""
            SELECT t.id, t.transaction_date, t.transaction_type, t.source_document_id
            FROM accounting.transactions t
            WHERE t.qbo_id IS NULL AND t.is_posted = true
              AND t.transaction_type IN ('sales_receipt', 'refund')
            ORDER BY t.transaction_date ASC
            LIMIT 50
        """)
        transactions = cursor.fetchall()
        
        synced_count = 0
        error_count = 0
        
        pos_item_id = None
        
        for txn in transactions:
            try:
                txn_id = txn['id']
                doc_id = txn['source_document_id']
                txn_type = txn['transaction_type']
                
                # Ensure we have our POS Sales item
                if not pos_item_id:
                    pos_item_id = _get_or_create_qbo_pos_item(headers, base_url, realm_id, cursor)
                
                # Fetch customer qbo_id if available
                qbo_customer_id = None
                
                if txn_type == 'sales_receipt':
                    cursor.execute("SELECT total, tax_amount, customer_id FROM orders WHERE order_id = %s", (doc_id,))
                    order = cursor.fetchone()
                    if not order:
                        continue
                    
                    if order.get('customer_id'):
                        cursor.execute("SELECT qbo_id FROM customers WHERE customer_id = %s", (order['customer_id'],))
                        c_row = cursor.fetchone()
                        if c_row and c_row.get('qbo_id'):
                            qbo_customer_id = c_row['qbo_id']
                    
                    cursor.execute("""
                        SELECT oi.quantity, oi.price_at_time, i.qbo_id, i.product_name
                        FROM order_items oi
                        JOIN inventory i ON oi.product_id = i.product_id
                        WHERE oi.order_id = %s
                    """, (doc_id,))
                    order_items = cursor.fetchall()
                    
                    lines = []
                    if order_items:
                        for item in order_items:
                            lines.append({
                                "Description": item['product_name'],
                                "Amount": float(item['quantity'] * item['price_at_time']),
                                "DetailType": "SalesItemLineDetail",
                                "SalesItemLineDetail": {
                                    "Qty": float(item['quantity']),
                                    "UnitPrice": float(item['price_at_time']),
                                    "ItemRef": {"value": str(item['qbo_id'])} if item.get('qbo_id') else ({"value": str(pos_item_id)} if pos_item_id else {"name": "Sales"})
                                }
                            })
                    else:
                        lines = [{
                            "Description": "POS Order Sale",
                            "Amount": float(order['total'] - (order.get('tax_amount') or 0)),
                            "DetailType": "SalesItemLineDetail",
                            "SalesItemLineDetail": {
                                "ItemRef": {"value": str(pos_item_id)} if pos_item_id else {"name": "Sales"}
                            }
                        }]
                        
                    payload = {
                        "DocNumber": f"POS-{doc_id}",
                        "TxnDate": txn['transaction_date'].isoformat(),
                        "Line": lines
                    }
                    if qbo_customer_id:
                        payload["CustomerRef"] = {"value": str(qbo_customer_id)}
                        
                    url = f"{base_url}/v3/company/{realm_id}/salesreceipt"
                    
                elif txn_type == 'refund':
                    cursor.execute("SELECT order_id, amount FROM `returns` WHERE return_id = %s", (doc_id,))
                    ret = cursor.fetchone()
                    
                    # For a void we might have order_void doc in source_document_id, but our schema returns `returns` table or just total amount from accounting
                    # We can fallback to the lines if 'returns' query fails
                    if not ret:
                        # Fallback: calculate total credit from accounting.transaction_lines to 1000/1100
                        cursor.execute("SELECT SUM(credit_amount) as amt FROM accounting.transaction_lines WHERE transaction_id = %s", (txn_id,))
                        amt = cursor.fetchone()['amt'] or 0
                    else:
                        amt = ret['amount']
                    
                    if not amt:
                        continue
                        
                    payload = {
                        "DocNumber": f"REF-{doc_id}",
                        "TxnDate": txn['transaction_date'].isoformat(),
                        "Line": [
                            {
                                "Description": "POS Order Refund",
                                "Amount": float(amt),
                                "DetailType": "SalesItemLineDetail",
                                "SalesItemLineDetail": {
                                    "ItemRef": {"value": str(pos_item_id)} if pos_item_id else {"name": "Sales"}
                                }
                            }
                        ]
                    }
                    url = f"{base_url}/v3/company/{realm_id}/refundreceipt"
                    
                response = requests.post(url, headers=headers, json=payload)
                if response.status_code == 200:
                    data = response.json()
                    obj = data.get('SalesReceipt') or data.get('RefundReceipt')
                    if obj and obj.get('Id'):
                        qbo_id_val = obj.get('Id')
                        cursor.execute("UPDATE accounting.transactions SET qbo_id = %s WHERE id = %s", (str(qbo_id_val), txn_id))
                        synced_count += 1
                else:
                    error_count += 1
                    print(f"QBO Sync Error {txn_id}: {response.text}")
                    
            except Exception as item_arr:
                error_count += 1
                print(f"Error syncing transaction {txn['id']}: {item_arr}")
                
        conn.commit()
        return {'success': True, 'synced_count': synced_count, 'error_count': error_count, 'message': f'Synced {synced_count} transactions. ({error_count} errors)'}
    except Exception as e:
        conn.rollback()
        raise e
    finally:
        cursor.close()
        conn.close()
