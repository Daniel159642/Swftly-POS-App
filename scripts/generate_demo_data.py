#!/usr/bin/env python3
"""
Generate fake demo data for product demos:
- Employees with different availabilities and historical schedule data
- Customers with order history and loyalty points
- Orders from in-house, Shopify, DoorDash, Uber Eats (linked to customers)
- Inventory photos via Lorem Picsum (free, no API key)
- Fake products if inventory is empty

Run from project root: python3 scripts/generate_demo_data.py

Requires: PostgreSQL database, migrations applied.
Optional: Run scripts/seed_drinks_and_pizza.py first for more product variety.
"""

import os
import sys
import json
import random
from datetime import datetime, timedelta
from decimal import Decimal

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

# Demo employees with varied availabilities
DEMO_EMPLOYEES = [
    {
        'username': 'alice.smith',
        'first_name': 'Alice',
        'last_name': 'Smith',
        'email': 'alice.smith@demo.com',
        'phone': '555-1001',
        'position': 'cashier',
        'department': 'Sales',
        'employment_type': 'part_time',
        'hourly_rate': 16.50,
        'date_started': '2024-01-15',
        'availability': {
            'monday': {'available': True, 'start': '09:00', 'end': '17:00'},
            'tuesday': {'available': True, 'start': '09:00', 'end': '17:00'},
            'wednesday': {'available': False, 'start': '09:00', 'end': '17:00'},
            'thursday': {'available': True, 'start': '09:00', 'end': '17:00'},
            'friday': {'available': True, 'start': '09:00', 'end': '17:00'},
            'saturday': {'available': True, 'start': '10:00', 'end': '18:00'},
            'sunday': {'available': False, 'start': '09:00', 'end': '17:00'},
        },
    },
    {
        'username': 'bob.jones',
        'first_name': 'Bob',
        'last_name': 'Jones',
        'email': 'bob.jones@demo.com',
        'phone': '555-1002',
        'position': 'cashier',
        'department': 'Sales',
        'employment_type': 'part_time',
        'hourly_rate': 17.00,
        'date_started': '2024-02-01',
        'availability': {
            'monday': {'available': False, 'start': '09:00', 'end': '17:00'},
            'tuesday': {'available': True, 'start': '10:00', 'end': '18:00'},
            'wednesday': {'available': True, 'start': '10:00', 'end': '18:00'},
            'thursday': {'available': True, 'start': '10:00', 'end': '18:00'},
            'friday': {'available': True, 'start': '10:00', 'end': '18:00'},
            'saturday': {'available': True, 'start': '09:00', 'end': '17:00'},
            'sunday': {'available': True, 'start': '09:00', 'end': '17:00'},
        },
    },
    {
        'username': 'carol.white',
        'first_name': 'Carol',
        'last_name': 'White',
        'email': 'carol.white@demo.com',
        'phone': '555-1003',
        'position': 'stock_clerk',
        'department': 'Inventory',
        'employment_type': 'full_time',
        'hourly_rate': 18.50,
        'date_started': '2023-11-10',
        'availability': {
            'monday': {'available': True, 'start': '08:00', 'end': '16:00'},
            'tuesday': {'available': True, 'start': '08:00', 'end': '16:00'},
            'wednesday': {'available': True, 'start': '08:00', 'end': '16:00'},
            'thursday': {'available': True, 'start': '08:00', 'end': '16:00'},
            'friday': {'available': True, 'start': '08:00', 'end': '16:00'},
            'saturday': {'available': False, 'start': '09:00', 'end': '17:00'},
            'sunday': {'available': False, 'start': '09:00', 'end': '17:00'},
        },
    },
    {
        'username': 'david.brown',
        'first_name': 'David',
        'last_name': 'Brown',
        'email': 'david.brown@demo.com',
        'phone': '555-1004',
        'position': 'supervisor',
        'department': 'Sales',
        'employment_type': 'full_time',
        'salary': 45000.00,
        'date_started': '2023-08-20',
        'availability': {
            'monday': {'available': True, 'start': '07:00', 'end': '15:00'},
            'tuesday': {'available': True, 'start': '07:00', 'end': '15:00'},
            'wednesday': {'available': True, 'start': '07:00', 'end': '15:00'},
            'thursday': {'available': True, 'start': '07:00', 'end': '15:00'},
            'friday': {'available': True, 'start': '07:00', 'end': '15:00'},
            'saturday': {'available': False, 'start': '09:00', 'end': '17:00'},
            'sunday': {'available': False, 'start': '09:00', 'end': '17:00'},
        },
    },
    {
        'username': 'emma.davis',
        'first_name': 'Emma',
        'last_name': 'Davis',
        'email': 'emma.davis@demo.com',
        'phone': '555-1005',
        'position': 'cashier',
        'department': 'Sales',
        'employment_type': 'part_time',
        'hourly_rate': 16.00,
        'date_started': '2024-03-05',
        'availability': {
            'monday': {'available': True, 'start': '14:00', 'end': '22:00'},
            'tuesday': {'available': True, 'start': '14:00', 'end': '22:00'},
            'wednesday': {'available': True, 'start': '14:00', 'end': '22:00'},
            'thursday': {'available': False, 'start': '09:00', 'end': '17:00'},
            'friday': {'available': True, 'start': '14:00', 'end': '22:00'},
            'saturday': {'available': True, 'start': '12:00', 'end': '20:00'},
            'sunday': {'available': True, 'start': '12:00', 'end': '20:00'},
        },
    },
]

# Order sources: in_house, shopify, doordash, uber_eats
ORDER_SOURCES = [
    ('in_house', 'ORD', 'pickup', 'credit_card'),
    ('in_house', 'ORD', 'delivery', 'cash'),
    ('shopify', 'SH', 'pickup', 'credit_card'),
    ('shopify', 'SH', 'delivery', 'mobile_payment'),
    ('doordash', 'DD', 'delivery', 'credit_card'),
    ('uber_eats', 'UE', 'delivery', 'credit_card'),
    ('uber_eats', 'UE', 'pickup', 'mobile_payment'),
]

# Demo customers with order history and loyalty points
DEMO_CUSTOMERS = [
    {'name': 'Sarah Johnson', 'email': 'sarah.j@email.com', 'phone': '555-2001'},
    {'name': 'Mike Chen', 'email': 'mike.chen@email.com', 'phone': '555-2002'},
    {'name': 'Jessica Williams', 'email': 'jess.w@email.com', 'phone': '555-2003'},
    {'name': 'Chris Taylor', 'email': 'chris.t@email.com', 'phone': '555-2004'},
    {'name': 'Amanda Martinez', 'email': 'amanda.m@email.com', 'phone': '555-2005'},
    {'name': 'James Wilson', 'email': 'james.w@email.com', 'phone': '555-2006'},
    {'name': 'Emily Brown', 'email': 'emily.b@email.com', 'phone': '555-2007'},
    {'name': 'Daniel Lee', 'email': 'daniel.lee@email.com', 'phone': '555-2008'},
    {'name': 'Olivia Rodriguez', 'email': 'olivia.r@email.com', 'phone': '555-2009'},
    {'name': 'Ryan Anderson', 'email': 'ryan.a@email.com', 'phone': '555-2010'},
    {'name': 'Sophia Garcia', 'email': 'sophia.g@email.com', 'phone': '555-2011'},
    {'name': 'Kevin Clark', 'email': 'kevin.c@email.com', 'phone': '555-2012'},
    {'name': 'Rachel Kim', 'email': 'rachel.k@email.com', 'phone': '555-2013'},
    {'name': 'Alex Thompson', 'email': 'alex.t@email.com', 'phone': '555-2014'},
    {'name': 'Maya Patel', 'email': 'maya.p@email.com', 'phone': '555-2015'},
]

# Lorem Picsum - free, no API key. Seed by product_id for consistent image per product.
PICSUM_BASE = 'https://picsum.photos/seed'


def get_establishment_id(conn):
    from src.database_postgres import get_current_establishment
    eid = get_current_establishment()
    if eid:
        return eid
    cur = conn.cursor()
    cur.execute("SELECT establishment_id FROM establishments ORDER BY establishment_id LIMIT 1")
    row = cur.fetchone()
    return row[0] if row and not isinstance(row, dict) else (row.get('establishment_id') if row else None)


def ensure_products(conn, establishment_id):
    """Ensure we have products. Create a few if inventory is empty. Boost stock for demo."""
    cur = conn.cursor()
    cur.execute("""
        SELECT product_id, product_name, product_price, sku
        FROM inventory
        WHERE establishment_id = %s AND (archived IS NULL OR archived = FALSE)
        ORDER BY product_id
        LIMIT 50
    """, (establishment_id,))
    rows = cur.fetchall()
    products = [dict(r) if hasattr(r, 'keys') else {'product_id': r[0], 'product_name': r[1], 'product_price': float(r[2]), 'sku': r[3]} for r in rows]

    # Boost stock for demo (ensure we have enough for many orders)
    for p in products:
        cur.execute("""
            UPDATE inventory SET current_quantity = GREATEST(COALESCE(current_quantity, 0), 1500)
            WHERE product_id = %s AND establishment_id = %s
        """, (p['product_id'], establishment_id))
    conn.commit()

    if not products:
        # Create demo products
        demo_items = [
            ('Coffee', 'DEMO-COFFEE', 3.50, 0.70, 'Beverages'),
            ('Sandwich', 'DEMO-SANDWICH', 8.99, 2.50, 'Food'),
            ('Salad', 'DEMO-SALAD', 7.50, 2.00, 'Food'),
            ('Soda', 'DEMO-SODA', 2.50, 0.30, 'Beverages'),
            ('Cookie', 'DEMO-COOKIE', 2.00, 0.40, 'Snacks'),
        ]
        for name, sku, price, cost, category in demo_items:
            try:
                cur.execute("""
                    SELECT column_name FROM information_schema.columns
                    WHERE table_schema = 'public' AND table_name = 'inventory' AND column_name = 'item_type'
                """)
                has_item_type = cur.fetchone() is not None
                if has_item_type:
                    cur.execute("""
                        INSERT INTO inventory (establishment_id, product_name, sku, product_price, product_cost, current_quantity, category, item_type)
                        VALUES (%s, %s, %s, %s, %s, 2000, %s, 'product')
                        RETURNING product_id
                    """, (establishment_id, name, sku, price, cost, category))
                else:
                    cur.execute("""
                        INSERT INTO inventory (establishment_id, product_name, sku, product_price, product_cost, current_quantity, category)
                        VALUES (%s, %s, %s, %s, %s, 2000, %s)
                        RETURNING product_id
                    """, (establishment_id, name, sku, price, cost, category))
                pid = cur.fetchone()[0]
                products.append({'product_id': pid, 'product_name': name, 'product_price': price, 'sku': sku})
                print(f"  Created product: {name}")
            except Exception as e:
                if 'unique' in str(e).lower():
                    cur.execute("SELECT product_id, product_name, product_price, sku FROM inventory WHERE sku = %s", (sku,))
                    r = cur.fetchone()
                    if r:
                        products.append({'product_id': r[0], 'product_name': r[1], 'product_price': float(r[2]), 'sku': r[3]})
                else:
                    raise
        conn.commit()

    return products


def get_employees(conn, establishment_id):
    """Get existing employees for this establishment."""
    cur = conn.cursor()
    cur.execute("""
        SELECT employee_id, first_name, last_name
        FROM employees
        WHERE establishment_id = %s AND (active IS NULL OR active = 1)
        ORDER BY employee_id
    """, (establishment_id,))
    rows = cur.fetchall()
    return [dict(r) if hasattr(r, 'keys') else {'employee_id': r[0], 'first_name': r[1], 'last_name': r[2]} for r in rows]


def ensure_customers(conn, establishment_id):
    """Create demo customers. Return list of {customer_id, name, email, phone}."""
    cur = conn.cursor()
    cur.execute("""
        SELECT column_name FROM information_schema.columns
        WHERE table_schema = 'public' AND table_name = 'customers' AND column_name = 'address'
    """)
    has_address = cur.fetchone() is not None

    customers = []
    for c in DEMO_CUSTOMERS:
        cur.execute("SELECT customer_id FROM customers WHERE phone = %s AND establishment_id = %s",
                    (c['phone'], establishment_id))
        row = cur.fetchone()
        if row:
            cid = row[0] if not hasattr(row, 'keys') else row.get('customer_id')
            customers.append({'customer_id': cid, 'name': c['name'], 'email': c['email'], 'phone': c['phone']})
        else:
            try:
                if has_address:
                    cur.execute("""
                        INSERT INTO customers (establishment_id, customer_name, email, phone, address)
                        VALUES (%s, %s, %s, %s, %s)
                        RETURNING customer_id
                    """, (establishment_id, c['name'], c['email'], c['phone'], f"123 Demo St, City {c['phone'][-2:]}"))
                else:
                    cur.execute("""
                        INSERT INTO customers (establishment_id, customer_name, email, phone)
                        VALUES (%s, %s, %s, %s)
                        RETURNING customer_id
                    """, (establishment_id, c['name'], c['email'], c['phone']))
                row = cur.fetchone()
                cid = row[0] if row and not hasattr(row, 'keys') else row.get('customer_id')
                customers.append({'customer_id': cid, 'name': c['name'], 'email': c['email'], 'phone': c['phone']})
            except Exception as e:
                if 'unique' in str(e).lower():
                    cur.execute("SELECT customer_id FROM customers WHERE phone = %s AND establishment_id = %s",
                                (c['phone'], establishment_id))
                    r = cur.fetchone()
                    if r:
                        customers.append({'customer_id': r[0], 'name': c['name'], 'email': c['email'], 'phone': c['phone']})
                else:
                    raise
    conn.commit()
    return customers


def ensure_inventory_photos(conn, establishment_id):
    """Set photo URLs for all inventory using Lorem Picsum (free, no API key)."""
    cur = conn.cursor()
    cur.execute("""
        SELECT column_name FROM information_schema.columns
        WHERE table_schema = 'public' AND table_name = 'inventory' AND column_name = 'photo'
    """)
    if not cur.fetchone():
        return 0

    cur.execute("""
        SELECT product_id FROM inventory
        WHERE establishment_id = %s AND (archived IS NULL OR archived = FALSE)
    """, (establishment_id,))
    rows = cur.fetchall()
    products = [r[0] if not hasattr(r, 'keys') else r.get('product_id') for r in rows] if rows else []

    updated = 0
    for pid in products:
        photo_url = f"{PICSUM_BASE}/{pid}/400/400"
        cur.execute("UPDATE inventory SET photo = %s WHERE product_id = %s", (photo_url, pid))
        updated += 1
    conn.commit()
    return updated


def add_employee_with_availability(conn, establishment_id, emp_data):
    """Add employee and set availability."""
    from src.database import add_employee
    from src.database_postgres import set_current_establishment

    set_current_establishment(establishment_id)
    cur = conn.cursor()
    cur.execute("SELECT employee_id FROM employees WHERE employee_code = %s AND establishment_id = %s",
                (emp_data['username'], establishment_id))
    row = cur.fetchone()
    if row:
        emp_id = row[0] if not hasattr(row, 'keys') else row.get('employee_id')
    else:
        try:
            emp_id = add_employee(
                employee_code=emp_data['username'],
                first_name=emp_data['first_name'],
                last_name=emp_data['last_name'],
                email=emp_data.get('email'),
                phone=emp_data.get('phone'),
                position=emp_data.get('position', 'cashier'),
                department=emp_data.get('department'),
                date_started=emp_data['date_started'],
                password='1234',  # Demo PIN
                employment_type=emp_data.get('employment_type', 'part_time'),
                hourly_rate=emp_data.get('hourly_rate'),
                salary=emp_data.get('salary'),
            )
        except Exception as e:
            if 'unique' in str(e).lower() or 'duplicate' in str(e).lower() or 'already exists' in str(e).lower():
                cur.execute("SELECT employee_id FROM employees WHERE employee_code = %s AND establishment_id = %s",
                            (emp_data['username'], establishment_id))
                row = cur.fetchone()
                emp_id = row[0] if row and not hasattr(row, 'keys') else (row.get('employee_id') if row else None)
            else:
                raise

    if emp_id and emp_data.get('availability'):
        cur = conn.cursor()
        avail = emp_data['availability']
        cur.execute("SELECT availability_id FROM employee_availability WHERE employee_id = %s", (emp_id,))
        exists = cur.fetchone()
        day_data = {d: json.dumps(avail.get(d, {'available': False, 'start': '09:00', 'end': '17:00'}))
                    for d in ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday']}
        if exists:
            cur.execute("""
                UPDATE employee_availability
                SET monday=%s, tuesday=%s, wednesday=%s, thursday=%s, friday=%s, saturday=%s, sunday=%s, updated_at=NOW()
                WHERE employee_id = %s
            """, (day_data['monday'], day_data['tuesday'], day_data['wednesday'], day_data['thursday'],
                  day_data['friday'], day_data['saturday'], day_data['sunday'], emp_id))
        else:
            cur.execute("""
                INSERT INTO employee_availability (establishment_id, employee_id, monday, tuesday, wednesday, thursday, friday, saturday, sunday)
                VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s)
            """, (establishment_id, emp_id, day_data['monday'], day_data['tuesday'], day_data['wednesday'],
                  day_data['thursday'], day_data['friday'], day_data['saturday'], day_data['sunday']))
        conn.commit()

    return emp_id


def add_historical_schedules(conn, establishment_id, employee_ids, days_back=21):
    """Add historical employee_schedule entries."""
    cur = conn.cursor()
    today = datetime.now().date()
    added = 0
    for emp_id in employee_ids:
        for d in range(days_back):
            dt = today - timedelta(days=d)
            if random.random() < 0.6:  # ~60% chance of shift
                start_h = random.choice([8, 9, 10, 14])
                end_h = start_h + random.choice([4, 5, 6, 8])
                if end_h > 22:
                    end_h = 22
                try:
                    cur.execute("""
                        INSERT INTO employee_schedule (establishment_id, employee_id, schedule_date, start_time, end_time, status, confirmed)
                        VALUES (%s, %s, %s, %s, %s, 'clocked_out', 1)
                    """, (establishment_id, emp_id, dt, f'{start_h:02d}:00:00', f'{end_h:02d}:00:00'))
                    added += 1
                except Exception:
                    pass  # Skip duplicates
    conn.commit()
    return added


def add_historical_time_clock(conn, establishment_id, employee_ids, days_back=14):
    """Add time_clock entries for hours_worked stats in Profile."""
    cur = conn.cursor()
    today = datetime.now().date()
    added = 0
    for emp_id in employee_ids:
        for d in range(days_back):
            dt = today - timedelta(days=d)
            if random.random() < 0.5:
                start_h = random.choice([8, 9, 10])
                hours = random.choice([4.0, 5.0, 6.0, 8.0])
                clock_in = datetime.combine(dt, datetime.min.time().replace(hour=start_h, minute=0))
                clock_out = clock_in + timedelta(hours=hours)
                try:
                    cur.execute("""
                        INSERT INTO time_clock (establishment_id, employee_id, clock_in, clock_out, total_hours, status)
                        VALUES (%s, %s, %s, %s, %s, 'clocked_out')
                    """, (establishment_id, emp_id, clock_in, clock_out, hours))
                    added += 1
                except Exception:
                    pass
    conn.commit()
    return added


def create_demo_orders(establishment_id, employees, products, customers, num_orders=80):
    """Create demo orders via database.create_order, then backdate. Link to customers for order history."""
    from src.database import create_order, get_connection
    from src.database_postgres import set_current_establishment

    if not employees or not products:
        print("   Skipping orders: need employees and products")
        return 0

    # Ensure sufficient inventory for demo orders
    conn = get_connection()
    cur = conn.cursor()
    for p in products:
        cur.execute("""
            UPDATE inventory SET current_quantity = GREATEST(COALESCE(current_quantity, 0), 2000)
            WHERE product_id = %s AND establishment_id = %s
        """, (p['product_id'], establishment_id))
    # Skip if we already have many recent orders (avoids duplicate order_number when re-running)
    cur.execute("""
        SELECT COUNT(*) FROM orders
        WHERE establishment_id = %s AND order_date >= CURRENT_DATE - INTERVAL '14 days'
    """, (establishment_id,))
    row = cur.fetchone()
    existing = int(row[0]) if row else 0
    conn.commit()
    conn.close()
    if existing >= 50:
        print(f"   Skipping (already {existing} orders in last 14 days; re-run clears or use fresh DB for more)")
        return 0

    set_current_establishment(establishment_id)
    order_ids = []
    today = datetime.now()

    for i in range(num_orders):
        emp = random.choice(employees)
        order_source, prefix, order_type, payment_method = random.choice(ORDER_SOURCES)
        num_items = random.randint(1, 5)
        items = []
        for _ in range(num_items):
            p = random.choice(products)
            qty = random.randint(1, 3)
            items.append({
                'product_id': p['product_id'],
                'quantity': qty,
                'unit_price': float(p['product_price']),
            })

        # ~70% of orders linked to demo customers (for order history + loyalty points)
        customer_id = None
        if customers and random.random() < 0.7:
            cust = random.choice(customers)
            customer_id = cust['customer_id']

        prepare_by = None
        if order_source in ('doordash', 'uber_eats', 'shopify'):
            mins = random.randint(15, 45)
            prepare_by = (today + timedelta(minutes=mins)).strftime('%Y-%m-%dT%H:%M:%S')

        result = create_order(
            employee_id=emp['employee_id'],
            items=items,
            payment_method=payment_method,
            customer_id=customer_id,
            order_type=order_type,
            order_source=order_source if order_source != 'in_house' else None,
            prepare_by=prepare_by,
        )

        if result.get('success') and result.get('order_id'):
            order_ids.append(result['order_id'])

    # Backdate orders over the last 14 days
    conn = get_connection()
    cur = conn.cursor()
    for i, oid in enumerate(order_ids):
        days_ago = random.randint(0, 14)
        hour = random.randint(8, 20)
        minute = random.randint(0, 59)
        dt = today - timedelta(days=days_ago)
        order_dt = dt.replace(hour=hour, minute=minute, second=0, microsecond=0)
        cur.execute("UPDATE orders SET order_date = %s WHERE order_id = %s", (order_dt, oid))
    conn.commit()
    conn.close()

    return len(order_ids)


def update_customer_points_from_orders(conn, establishment_id):
    """Set loyalty_points for customers based on their order history (1 point per dollar spent)."""
    cur = conn.cursor()
    cur.execute("""
        SELECT customer_id, COALESCE(SUM(total), 0) as total_spent, COUNT(*) as order_count
        FROM orders
        WHERE establishment_id = %s AND customer_id IS NOT NULL
        GROUP BY customer_id
    """, (establishment_id,))
    rows = cur.fetchall()
    updated = 0
    for r in rows:
        cid = r[0] if not hasattr(r, 'keys') else r.get('customer_id')
        total = float(r[1] if not hasattr(r, 'keys') else r.get('total_spent', 0))
        points = int(total)  # 1 point per dollar
        cur.execute("UPDATE customers SET loyalty_points = %s WHERE customer_id = %s", (points, cid))
        updated += 1
    conn.commit()
    return updated


def main():
    from src.database import get_connection

    conn = get_connection()
    try:
        establishment_id = get_establishment_id(conn)
        if not establishment_id:
            print("ERROR: No establishment found. Create one first.")
            sys.exit(1)

        print(f"Establishment ID: {establishment_id}")
        print()

        # 1. Ensure employees
        print("1. Adding employees with availability...")
        employees = get_employees(conn, establishment_id)
        for emp_data in DEMO_EMPLOYEES:
            emp_id = add_employee_with_availability(conn, establishment_id, emp_data)
            if emp_id:
                existing = next((e for e in employees if e.get('employee_id') == emp_id), None)
                if not existing:
                    employees.append({
                        'employee_id': emp_id,
                        'first_name': emp_data['first_name'],
                        'last_name': emp_data['last_name'],
                    })
        print(f"   Employees: {len(employees)}")
        print()

        # 2. Ensure products
        print("2. Ensuring products...")
        products = ensure_products(conn, establishment_id)
        print(f"   Products: {len(products)}")
        print()

        # 3. Add inventory photos (Lorem Picsum - free, no API key)
        print("3. Adding inventory photos...")
        photo_count = ensure_inventory_photos(conn, establishment_id)
        print(f"   Set photos for {photo_count} products")
        print()

        # 4. Ensure customers
        print("4. Adding customers...")
        customers = ensure_customers(conn, establishment_id)
        print(f"   Customers: {len(customers)}")
        print()

        # 5. Create orders (linked to customers for order history)
        print("5. Creating demo orders (in-house, Shopify, DoorDash, Uber Eats)...")
        num_orders = create_demo_orders(establishment_id, employees, products, customers, num_orders=80)
        print(f"   Created {num_orders} orders (backdated over last 14 days)")
        print()

        # 6. Update customer loyalty points from order history
        print("6. Updating customer loyalty points...")
        points_updated = update_customer_points_from_orders(conn, establishment_id)
        print(f"   Updated points for {points_updated} customers")
        print()

        # 7. Historical schedules
        print("7. Adding historical schedules...")
        emp_ids = [e['employee_id'] for e in employees]
        sched_count = add_historical_schedules(conn, establishment_id, emp_ids, days_back=21)
        print(f"   Added {sched_count} schedule entries")
        print()

        # 8. Historical time_clock (for Profile hours stats)
        print("8. Adding historical time clock entries...")
        tc_count = add_historical_time_clock(conn, establishment_id, emp_ids, days_back=14)
        print(f"   Added {tc_count} time clock entries")
        print()

        print("Done! Demo data ready for your product demo.")

    except Exception as e:
        import traceback
        traceback.print_exc()
        print(f"ERROR: {e}")
        sys.exit(1)
    finally:
        conn.close()


if __name__ == '__main__':
    main()
