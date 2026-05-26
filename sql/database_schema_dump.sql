--
-- PostgreSQL database dump
--

-- Dumped from database version 14.18 (Homebrew)
-- Dumped by pg_dump version 14.18 (Homebrew)

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

--
-- Name: accounting; Type: SCHEMA; Schema: -; Owner: -
--

CREATE SCHEMA accounting;


--
-- Name: calculate_account_balance(integer, date); Type: FUNCTION; Schema: accounting; Owner: -
--

CREATE FUNCTION accounting.calculate_account_balance(p_account_id integer, p_as_of_date date DEFAULT CURRENT_DATE) RETURNS numeric
    LANGUAGE plpgsql
    AS $$
DECLARE
    rec RECORD;
    td DECIMAL(19,4);
    tc DECIMAL(19,4);
    bal DECIMAL(19,4);
BEGIN
    SELECT balance_type, opening_balance INTO rec
    FROM accounting.accounts WHERE id = p_account_id;
    IF NOT FOUND THEN
        RAISE EXCEPTION 'Account % not found', p_account_id;
    END IF;
    SELECT COALESCE(SUM(tl.debit_amount), 0), COALESCE(SUM(tl.credit_amount), 0)
    INTO td, tc
    FROM accounting.transaction_lines tl
    JOIN accounting.transactions t ON tl.transaction_id = t.id
    WHERE tl.account_id = p_account_id
      AND t.is_posted = TRUE AND t.is_void = FALSE
      AND t.transaction_date <= p_as_of_date;
    IF rec.balance_type = 'debit' THEN
        bal := COALESCE(rec.opening_balance, 0) + td - tc;
    ELSE
        bal := COALESCE(rec.opening_balance, 0) + tc - td;
    END IF;
    RETURN bal;
END;
$$;


--
-- Name: gen_txn_number(); Type: FUNCTION; Schema: accounting; Owner: -
--

CREATE FUNCTION accounting.gen_txn_number() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
DECLARE
    pr VARCHAR(8);
    sn INTEGER;
    nn VARCHAR(50);
BEGIN
    IF NEW.transaction_number IS NOT NULL AND NEW.transaction_number <> '' THEN
        RETURN NEW;
    END IF;
    pr := TO_CHAR(NEW.transaction_date, 'YYYYMMDD');
    sn := nextval('accounting.transaction_number_seq');
    nn := 'TRX-' || pr || '-' || LPAD(sn::TEXT, 4, '0');
    WHILE EXISTS (SELECT 1 FROM accounting.transactions WHERE transaction_number = nn) LOOP
        sn := nextval('accounting.transaction_number_seq');
        nn := 'TRX-' || pr || '-' || LPAD(sn::TEXT, 4, '0');
    END LOOP;
    NEW.transaction_number := nn;
    RETURN NEW;
END;
$$;


--
-- Name: get_aging_report(date, integer); Type: FUNCTION; Schema: accounting; Owner: -
--

CREATE FUNCTION accounting.get_aging_report(p_as_of_date date DEFAULT CURRENT_DATE, p_customer_id integer DEFAULT NULL::integer) RETURNS TABLE(customer_id integer, customer_name character varying, current_balance numeric, days_0_30 numeric, days_31_60 numeric, days_61_90 numeric, days_over_90 numeric)
    LANGUAGE plpgsql
    AS $$
BEGIN
    RETURN;
END;
$$;


--
-- Name: get_balance_sheet(date); Type: FUNCTION; Schema: accounting; Owner: -
--

CREATE FUNCTION accounting.get_balance_sheet(p_as_of_date date DEFAULT CURRENT_DATE) RETURNS TABLE(account_type character varying, account_number character varying, account_name character varying, balance numeric)
    LANGUAGE plpgsql
    AS $$
BEGIN
    RETURN QUERY
    SELECT
        a.account_type,
        a.account_number,
        a.account_name,
        (accounting.calculate_account_balance(a.id, p_as_of_date))::DECIMAL(19,4)
    FROM accounting.accounts a
    WHERE a.is_active = TRUE
      AND a.account_type IN ('Asset', 'Liability', 'Equity')
    ORDER BY a.account_type, a.account_number;
END;
$$;


--
-- Name: get_profit_and_loss(date, date); Type: FUNCTION; Schema: accounting; Owner: -
--

CREATE FUNCTION accounting.get_profit_and_loss(p_start_date date, p_end_date date) RETURNS TABLE(account_type character varying, account_number character varying, account_name character varying, balance numeric)
    LANGUAGE plpgsql
    AS $$
BEGIN
    RETURN QUERY
    SELECT
        a.account_type,
        a.account_number,
        a.account_name,
        (CASE WHEN a.balance_type = 'debit' THEN
            COALESCE(SUM(tl.debit_amount), 0) - COALESCE(SUM(tl.credit_amount), 0)
         ELSE
            COALESCE(SUM(tl.credit_amount), 0) - COALESCE(SUM(tl.debit_amount), 0)
         END)::DECIMAL(19,4)
    FROM accounting.accounts a
    LEFT JOIN accounting.transaction_lines tl ON a.id = tl.account_id
    LEFT JOIN accounting.transactions t ON tl.transaction_id = t.id
        AND t.is_posted = TRUE AND t.is_void = FALSE
        AND t.transaction_date >= p_start_date AND t.transaction_date <= p_end_date
    WHERE a.is_active = TRUE
      AND a.account_type IN ('Revenue', 'Expense', 'COGS', 'Cost of Goods Sold', 'Other Income', 'Other Expense')
    GROUP BY a.id, a.account_type, a.account_number, a.account_name, a.balance_type
    HAVING (CASE WHEN a.balance_type = 'debit' THEN
            COALESCE(SUM(tl.debit_amount), 0) - COALESCE(SUM(tl.credit_amount), 0)
         ELSE
            COALESCE(SUM(tl.credit_amount), 0) - COALESCE(SUM(tl.debit_amount), 0)
         END) <> 0
    ORDER BY a.account_type, a.account_number;
END;
$$;


--
-- Name: get_trial_balance(date); Type: FUNCTION; Schema: accounting; Owner: -
--

CREATE FUNCTION accounting.get_trial_balance(p_as_of_date date DEFAULT CURRENT_DATE) RETURNS TABLE(account_number character varying, account_name character varying, account_type character varying, total_debits numeric, total_credits numeric, balance numeric)
    LANGUAGE plpgsql
    AS $$
BEGIN
    RETURN QUERY
    SELECT
        a.account_number,
        a.account_name,
        a.account_type,
        COALESCE(SUM(tl.debit_amount), 0)::DECIMAL(19,4),
        COALESCE(SUM(tl.credit_amount), 0)::DECIMAL(19,4),
        (CASE WHEN a.balance_type = 'debit' THEN
            COALESCE(a.opening_balance, 0) + COALESCE(SUM(tl.debit_amount), 0) - COALESCE(SUM(tl.credit_amount), 0)
         ELSE
            COALESCE(a.opening_balance, 0) + COALESCE(SUM(tl.credit_amount), 0) - COALESCE(SUM(tl.debit_amount), 0)
         END)::DECIMAL(19,4)
    FROM accounting.accounts a
    LEFT JOIN accounting.transaction_lines tl ON a.id = tl.account_id
    LEFT JOIN accounting.transactions t ON tl.transaction_id = t.id AND t.is_posted = TRUE AND t.is_void = FALSE AND t.transaction_date <= p_as_of_date
    WHERE a.is_active = TRUE
    GROUP BY a.id, a.account_number, a.account_name, a.account_type, a.balance_type, a.opening_balance
    HAVING COALESCE(SUM(tl.debit_amount), 0) <> 0 OR COALESCE(SUM(tl.credit_amount), 0) <> 0 OR COALESCE(a.opening_balance, 0) <> 0
    ORDER BY a.account_number;
END;
$$;


--
-- Name: validate_txn_balance(); Type: FUNCTION; Schema: accounting; Owner: -
--

CREATE FUNCTION accounting.validate_txn_balance() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
DECLARE
    td DECIMAL(19,4);
    tc DECIMAL(19,4);
    tid INTEGER;
BEGIN
    tid := COALESCE(NEW.transaction_id, OLD.transaction_id);
    SELECT COALESCE(SUM(debit_amount), 0), COALESCE(SUM(credit_amount), 0)
    INTO td, tc
    FROM accounting.transaction_lines WHERE transaction_id = tid;
    IF ABS(td - tc) > 0.01 THEN
        RAISE EXCEPTION 'Transaction not balanced. Debits: %, Credits: %', td, tc;
    END IF;
    RETURN COALESCE(NEW, OLD);
END;
$$;


--
-- Name: audit_trigger_function(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.audit_trigger_function() RETURNS trigger
    LANGUAGE plpgsql
    AS $_$
DECLARE
    old_data TEXT;
    new_data TEXT;
    employee_id_val INTEGER;
    establishment_id_val INTEGER;
    action_type_val TEXT;
    record_id_val INTEGER;
    pk_column_name TEXT;
    pk_value INTEGER;
BEGIN
    -- Get employee_id from current session or use default
    -- In production, you'd get this from session context
    BEGIN
        employee_id_val := current_setting('app.employee_id', TRUE)::INTEGER;
    EXCEPTION WHEN OTHERS THEN
        employee_id_val := NULL;
    END;
    
    -- If employee_id is NULL, try to get default (admin employee or first active employee)
    IF employee_id_val IS NULL THEN
        BEGIN
            -- Try to get admin employee (employee_id = 1) or first active employee
            SELECT employee_id INTO employee_id_val 
            FROM employees 
            WHERE (employee_id = 1 OR active = TRUE)
            ORDER BY employee_id = 1 DESC, employee_id ASC
            LIMIT 1;
            
            -- If still NULL, use 1 as fallback (will fail if employees table is empty, but that's a bigger problem)
            IF employee_id_val IS NULL THEN
                employee_id_val := 1;
            END IF;
        EXCEPTION WHEN OTHERS THEN
            -- Last resort: use 1
            employee_id_val := 1;
        END;
    END IF;
    
    -- Get establishment_id from current session or default to 1
    BEGIN
        establishment_id_val := current_setting('app.establishment_id', TRUE)::INTEGER;
        IF establishment_id_val IS NULL THEN
            RAISE EXCEPTION 'establishment_id is NULL';
        END IF;
    EXCEPTION WHEN OTHERS THEN
        -- Try to get from establishments table
        BEGIN
            SELECT establishment_id INTO establishment_id_val FROM establishments LIMIT 1;
        EXCEPTION WHEN OTHERS THEN
            establishment_id_val := NULL;
        END;
        
        -- If still NULL, try to create default establishment or use 1
        IF establishment_id_val IS NULL THEN
            BEGIN
                -- Try to insert default establishment if it doesn't exist
                INSERT INTO establishments (establishment_name, establishment_code, is_active)
                VALUES ('Default Establishment', 'default', TRUE)
                ON CONFLICT (establishment_code) DO NOTHING
                RETURNING establishment_id INTO establishment_id_val;
                
                -- If insert didn't return ID, try to get it
                IF establishment_id_val IS NULL THEN
                    SELECT establishment_id INTO establishment_id_val 
                    FROM establishments 
                    WHERE establishment_code = 'default' 
                    LIMIT 1;
                END IF;
            EXCEPTION WHEN OTHERS THEN
                -- Last resort: use 1 (will fail if establishments table doesn't exist, but that's a bigger problem)
                establishment_id_val := 1;
            END;
        END IF;
        
        -- Final fallback
        IF establishment_id_val IS NULL THEN
            establishment_id_val := 1;
        END IF;
    END;
    
    -- Dynamically find the primary key column name for this table
    SELECT a.attname INTO pk_column_name
    FROM pg_index i
    JOIN pg_attribute a ON a.attrelid = i.indrelid AND a.attnum = ANY(i.indkey)
    WHERE i.indrelid = TG_RELID
      AND i.indisprimary
    LIMIT 1;
    
    -- If no primary key found, try common patterns
    IF pk_column_name IS NULL THEN
        -- Try 'id' first
        BEGIN
            IF TG_OP = 'DELETE' THEN
                EXECUTE format('SELECT ($1).%I', 'id') USING OLD INTO pk_value;
            ELSE
                EXECUTE format('SELECT ($1).%I', 'id') USING NEW INTO pk_value;
            END IF;
            pk_column_name := 'id';
        EXCEPTION WHEN OTHERS THEN
            -- Try table_name + '_id'
            BEGIN
                IF TG_OP = 'DELETE' THEN
                    EXECUTE format('SELECT ($1).%I', TG_TABLE_NAME || '_id') USING OLD INTO pk_value;
                ELSE
                    EXECUTE format('SELECT ($1).%I', TG_TABLE_NAME || '_id') USING NEW INTO pk_value;
                END IF;
                pk_column_name := TG_TABLE_NAME || '_id';
            EXCEPTION WHEN OTHERS THEN
                -- Last resort: use 0
                pk_value := 0;
                pk_column_name := 'unknown';
            END;
        END;
    ELSE
        -- Get the primary key value dynamically
        IF TG_OP = 'DELETE' THEN
            EXECUTE format('SELECT ($1).%I', pk_column_name) USING OLD INTO pk_value;
        ELSE
            EXECUTE format('SELECT ($1).%I', pk_column_name) USING NEW INTO pk_value;
        END IF;
    END IF;
    
    record_id_val := COALESCE(pk_value, 0);
    
    -- Map TG_OP to action_type values
    IF TG_OP = 'DELETE' THEN
        action_type_val := 'DELETE';
        old_data := row_to_json(OLD)::TEXT;
        INSERT INTO audit_log (
            establishment_id, table_name, record_id, action_type, old_values, employee_id, action_timestamp
        ) VALUES (
            establishment_id_val, TG_TABLE_NAME, record_id_val, action_type_val, old_data, employee_id_val, CURRENT_TIMESTAMP
        );
        RETURN OLD;
    ELSIF TG_OP = 'UPDATE' THEN
        action_type_val := 'UPDATE';
        old_data := row_to_json(OLD)::TEXT;
        new_data := row_to_json(NEW)::TEXT;
        INSERT INTO audit_log (
            establishment_id, table_name, record_id, action_type, old_values, new_values, employee_id, action_timestamp
        ) VALUES (
            establishment_id_val, TG_TABLE_NAME, record_id_val, action_type_val, old_data, new_data, employee_id_val, CURRENT_TIMESTAMP
        );
        RETURN NEW;
    ELSIF TG_OP = 'INSERT' THEN
        action_type_val := 'INSERT';
        new_data := row_to_json(NEW)::TEXT;
        INSERT INTO audit_log (
            establishment_id, table_name, record_id, action_type, new_values, employee_id, action_timestamp
        ) VALUES (
            establishment_id_val, TG_TABLE_NAME, record_id_val, action_type_val, new_data, employee_id_val, CURRENT_TIMESTAMP
        );
        RETURN NEW;
    END IF;
    RETURN NULL;
END;
$_$;


--
-- Name: calculate_account_balance(integer, date); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.calculate_account_balance(p_account_id integer, p_as_of_date date DEFAULT CURRENT_DATE) RETURNS numeric
    LANGUAGE plpgsql
    AS $$
DECLARE
    account_record RECORD;
    total_debits DECIMAL(19,4);
    total_credits DECIMAL(19,4);
    account_balance DECIMAL(19,4);
BEGIN
    -- Get account information
    SELECT balance_type, opening_balance, opening_balance_date
    INTO account_record
    FROM accounts
    WHERE id = p_account_id;
    
    IF NOT FOUND THEN
        RAISE EXCEPTION 'Account % not found', p_account_id;
    END IF;
    
    -- Calculate debits and credits from posted transactions
    SELECT 
        COALESCE(SUM(tl.debit_amount), 0),
        COALESCE(SUM(tl.credit_amount), 0)
    INTO total_debits, total_credits
    FROM transaction_lines tl
    JOIN transactions t ON tl.transaction_id = t.id
    WHERE tl.account_id = p_account_id
        AND t.is_posted = TRUE
        AND t.is_void = FALSE
        AND t.transaction_date <= p_as_of_date;
    
    -- Calculate balance based on normal balance type
    IF account_record.balance_type = 'debit' THEN
        account_balance := account_record.opening_balance + total_debits - total_credits;
    ELSE
        account_balance := account_record.opening_balance + total_credits - total_debits;
    END IF;
    
    RETURN account_balance;
END;
$$;


--
-- Name: generate_bill_number(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.generate_bill_number() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
DECLARE
    seq_num INTEGER;
    new_number VARCHAR(50);
BEGIN
    seq_num := nextval('bill_number_seq');
    new_number := 'BILL-' || LPAD(seq_num::TEXT, 6, '0');
    
    -- Ensure uniqueness
    WHILE EXISTS (SELECT 1 FROM bills WHERE bill_number = new_number) LOOP
        seq_num := nextval('bill_number_seq');
        new_number := 'BILL-' || LPAD(seq_num::TEXT, 6, '0');
    END LOOP;
    
    NEW.bill_number := new_number;
    RETURN NEW;
END;
$$;


--
-- Name: generate_bill_payment_number(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.generate_bill_payment_number() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
DECLARE
    seq_num INTEGER;
    new_number VARCHAR(50);
BEGIN
    seq_num := nextval('bill_payment_number_seq');
    new_number := 'BP-' || LPAD(seq_num::TEXT, 6, '0');
    
    WHILE EXISTS (SELECT 1 FROM bill_payments WHERE payment_number = new_number) LOOP
        seq_num := nextval('bill_payment_number_seq');
        new_number := 'BP-' || LPAD(seq_num::TEXT, 6, '0');
    END LOOP;
    
    NEW.payment_number := new_number;
    RETURN NEW;
END;
$$;


--
-- Name: generate_invoice_number(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.generate_invoice_number() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
DECLARE
    seq_num INTEGER;
    new_number VARCHAR(50);
BEGIN
    seq_num := nextval('invoice_number_seq');
    new_number := 'INV-' || LPAD(seq_num::TEXT, 6, '0');
    
    -- Ensure uniqueness
    WHILE EXISTS (SELECT 1 FROM invoices WHERE invoice_number = new_number) LOOP
        seq_num := nextval('invoice_number_seq');
        new_number := 'INV-' || LPAD(seq_num::TEXT, 6, '0');
    END LOOP;
    
    NEW.invoice_number := new_number;
    RETURN NEW;
END;
$$;


--
-- Name: generate_payment_number(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.generate_payment_number() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
DECLARE
    seq_num INTEGER;
    new_number VARCHAR(50);
BEGIN
    seq_num := nextval('payment_number_seq');
    new_number := 'PAY-' || LPAD(seq_num::TEXT, 6, '0');
    
    WHILE EXISTS (SELECT 1 FROM payments WHERE payment_number = new_number) LOOP
        seq_num := nextval('payment_number_seq');
        new_number := 'PAY-' || LPAD(seq_num::TEXT, 6, '0');
    END LOOP;
    
    NEW.payment_number := new_number;
    RETURN NEW;
END;
$$;


--
-- Name: generate_transaction_number(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.generate_transaction_number() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
DECLARE
    date_prefix VARCHAR(8);
    seq_num INTEGER;
    new_number VARCHAR(50);
BEGIN
    -- Generate date prefix (YYYYMMDD)
    date_prefix := TO_CHAR(NEW.transaction_date, 'YYYYMMDD');
    
    -- Get next sequence number for today
    -- Note: In production, you might want a more sophisticated numbering system
    -- that resets daily or uses a separate sequence per day
    seq_num := nextval('transaction_number_seq');
    
    -- Format: TRX-YYYYMMDD-####
    new_number := 'TRX-' || date_prefix || '-' || LPAD(seq_num::TEXT, 4, '0');
    
    -- Ensure uniqueness (handle collisions)
    WHILE EXISTS (SELECT 1 FROM transactions WHERE transaction_number = new_number) LOOP
        seq_num := nextval('transaction_number_seq');
        new_number := 'TRX-' || date_prefix || '-' || LPAD(seq_num::TEXT, 4, '0');
    END LOOP;
    
    NEW.transaction_number := new_number;
    RETURN NEW;
END;
$$;


--
-- Name: get_account_balance_by_period(integer, date, date); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.get_account_balance_by_period(p_account_id integer, p_start_date date, p_end_date date) RETURNS TABLE(period_start_balance numeric, period_debits numeric, period_credits numeric, period_end_balance numeric)
    LANGUAGE plpgsql
    AS $$
DECLARE
    account_record RECORD;
    start_balance DECIMAL(19,4);
    period_debits DECIMAL(19,4);
    period_credits DECIMAL(19,4);
    end_balance DECIMAL(19,4);
BEGIN
    -- Get account information
    SELECT balance_type, opening_balance
    INTO account_record
    FROM accounts
    WHERE id = p_account_id;
    
    -- Calculate balance at start of period
    start_balance := calculate_account_balance(p_account_id, p_start_date - INTERVAL '1 day');
    
    -- Calculate period activity
    SELECT 
        COALESCE(SUM(tl.debit_amount), 0),
        COALESCE(SUM(tl.credit_amount), 0)
    INTO period_debits, period_credits
    FROM transaction_lines tl
    JOIN transactions t ON tl.transaction_id = t.id
    WHERE tl.account_id = p_account_id
        AND t.is_posted = TRUE
        AND t.is_void = FALSE
        AND t.transaction_date >= p_start_date
        AND t.transaction_date <= p_end_date;
    
    -- Calculate end balance
    IF account_record.balance_type = 'debit' THEN
        end_balance := start_balance + period_debits - period_credits;
    ELSE
        end_balance := start_balance + period_credits - period_debits;
    END IF;
    
    RETURN QUERY SELECT start_balance, period_debits, period_credits, end_balance;
END;
$$;


--
-- Name: get_aging_report(date, integer); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.get_aging_report(p_as_of_date date DEFAULT CURRENT_DATE, p_customer_id integer DEFAULT NULL::integer) RETURNS TABLE(customer_id integer, customer_name character varying, current_balance numeric, days_0_30 numeric, days_31_60 numeric, days_61_90 numeric, days_over_90 numeric, total_balance numeric)
    LANGUAGE plpgsql
    AS $$
BEGIN
    RETURN QUERY
    SELECT 
        c.id AS customer_id,
        c.display_name AS customer_name,
        COALESCE(SUM(CASE 
            WHEN i.due_date >= p_as_of_date THEN i.balance_due 
            ELSE 0 
        END), 0) AS current_balance,
        COALESCE(SUM(CASE 
            WHEN i.due_date < p_as_of_date 
                AND i.due_date >= p_as_of_date - INTERVAL '30 days' 
            THEN i.balance_due 
            ELSE 0 
        END), 0) AS days_0_30,
        COALESCE(SUM(CASE 
            WHEN i.due_date < p_as_of_date - INTERVAL '30 days'
                AND i.due_date >= p_as_of_date - INTERVAL '60 days' 
            THEN i.balance_due 
            ELSE 0 
        END), 0) AS days_31_60,
        COALESCE(SUM(CASE 
            WHEN i.due_date < p_as_of_date - INTERVAL '60 days'
                AND i.due_date >= p_as_of_date - INTERVAL '90 days' 
            THEN i.balance_due 
            ELSE 0 
        END), 0) AS days_61_90,
        COALESCE(SUM(CASE 
            WHEN i.due_date < p_as_of_date - INTERVAL '90 days' 
            THEN i.balance_due 
            ELSE 0 
        END), 0) AS days_over_90,
        COALESCE(SUM(i.balance_due), 0) AS total_balance
    FROM customers c
    LEFT JOIN invoices i ON c.id = i.customer_id
        AND i.status NOT IN ('paid', 'void')
        AND i.balance_due > 0
    WHERE (p_customer_id IS NULL OR c.id = p_customer_id)
        AND c.is_active = TRUE
    GROUP BY c.id, c.display_name
    HAVING COALESCE(SUM(i.balance_due), 0) > 0
    ORDER BY total_balance DESC;
END;
$$;


--
-- Name: get_balance_sheet(date); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.get_balance_sheet(p_as_of_date date DEFAULT CURRENT_DATE) RETURNS TABLE(account_type character varying, account_name character varying, amount numeric)
    LANGUAGE plpgsql
    AS $$
BEGIN
    RETURN QUERY
    SELECT 
        a.account_type,
        a.account_name,
        calculate_account_balance(a.id, p_as_of_date) AS amount
    FROM accounts a
    WHERE a.account_type IN ('Asset', 'Liability', 'Equity')
        AND a.is_active = TRUE
    ORDER BY 
        CASE a.account_type
            WHEN 'Asset' THEN 1
            WHEN 'Liability' THEN 2
            WHEN 'Equity' THEN 3
        END,
        a.account_number;
END;
$$;


--
-- Name: get_customer_balance(integer, date); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.get_customer_balance(p_customer_id integer, p_as_of_date date DEFAULT CURRENT_DATE) RETURNS numeric
    LANGUAGE plpgsql
    AS $$
DECLARE
    customer_balance DECIMAL(19,4);
BEGIN
    SELECT COALESCE(SUM(balance_due), 0)
    INTO customer_balance
    FROM invoices
    WHERE customer_id = p_customer_id
        AND status NOT IN ('paid', 'void')
        AND invoice_date <= p_as_of_date;
    
    RETURN customer_balance;
END;
$$;


--
-- Name: get_profit_and_loss(date, date); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.get_profit_and_loss(p_start_date date, p_end_date date) RETURNS TABLE(account_type character varying, account_name character varying, amount numeric)
    LANGUAGE plpgsql
    AS $$
BEGIN
    RETURN QUERY
    WITH revenue_expense AS (
        SELECT 
            a.account_type,
            a.account_name,
            CASE 
                WHEN a.account_type IN ('Revenue', 'Other Income') THEN
                    COALESCE(SUM(tl.credit_amount) - SUM(tl.debit_amount), 0)
                WHEN a.account_type IN ('Expense', 'COGS', 'Other Expense') THEN
                    COALESCE(SUM(tl.debit_amount) - SUM(tl.credit_amount), 0)
                ELSE 0
            END AS amount
        FROM accounts a
        LEFT JOIN transaction_lines tl ON a.id = tl.account_id
        LEFT JOIN transactions t ON tl.transaction_id = t.id
        WHERE a.account_type IN ('Revenue', 'Expense', 'COGS', 'Other Income', 'Other Expense')
            AND a.is_active = TRUE
            AND (t.id IS NULL OR (t.is_posted = TRUE AND t.is_void = FALSE 
                AND t.transaction_date >= p_start_date 
                AND t.transaction_date <= p_end_date))
        GROUP BY a.account_type, a.account_name
    )
    SELECT * FROM revenue_expense
    WHERE amount != 0
    ORDER BY 
        CASE account_type
            WHEN 'Revenue' THEN 1
            WHEN 'Other Income' THEN 2
            WHEN 'COGS' THEN 3
            WHEN 'Expense' THEN 4
            WHEN 'Other Expense' THEN 5
        END,
        account_name;
END;
$$;


--
-- Name: get_trial_balance(date, character varying); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.get_trial_balance(p_as_of_date date DEFAULT CURRENT_DATE, p_account_type character varying DEFAULT NULL::character varying) RETURNS TABLE(account_id integer, account_number character varying, account_name character varying, account_type character varying, debit_balance numeric, credit_balance numeric)
    LANGUAGE plpgsql
    AS $$
BEGIN
    RETURN QUERY
    SELECT 
        a.id AS account_id,
        a.account_number,
        a.account_name,
        a.account_type,
        CASE 
            WHEN a.balance_type = 'debit' THEN 
                COALESCE(calculate_account_balance(a.id, p_as_of_date), 0)
            ELSE 0
        END AS debit_balance,
        CASE 
            WHEN a.balance_type = 'credit' THEN 
                ABS(COALESCE(calculate_account_balance(a.id, p_as_of_date), 0))
            ELSE 0
        END AS credit_balance
    FROM accounts a
    WHERE a.is_active = TRUE
        AND (p_account_type IS NULL OR a.account_type = p_account_type)
    ORDER BY a.account_type, a.account_number;
END;
$$;


--
-- Name: get_vendor_balance(integer, date); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.get_vendor_balance(p_vendor_id integer, p_as_of_date date DEFAULT CURRENT_DATE) RETURNS numeric
    LANGUAGE plpgsql
    AS $$
DECLARE
    vendor_balance DECIMAL(19,4);
BEGIN
    SELECT COALESCE(SUM(balance_due), 0)
    INTO vendor_balance
    FROM bills
    WHERE vendor_id = p_vendor_id
        AND status NOT IN ('paid', 'void')
        AND bill_date <= p_as_of_date;
    
    RETURN vendor_balance;
END;
$$;


--
-- Name: post_transaction(integer); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.post_transaction(p_transaction_id integer) RETURNS boolean
    LANGUAGE plpgsql
    AS $$
BEGIN
    -- Validate transaction
    PERFORM validate_transaction_for_posting(p_transaction_id);
    
    -- Mark as posted
    UPDATE transactions
    SET is_posted = TRUE,
        updated_at = CURRENT_TIMESTAMP
    WHERE id = p_transaction_id;
    
    RETURN TRUE;
END;
$$;


--
-- Name: update_bill_balance(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.update_bill_balance() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
DECLARE
    total_applied DECIMAL(19,4);
    bill_total DECIMAL(19,4);
BEGIN
    SELECT COALESCE(SUM(amount_applied), 0)
    INTO total_applied
    FROM bill_payment_applications
    WHERE bill_id = COALESCE(NEW.bill_id, OLD.bill_id);
    
    SELECT total_amount
    INTO bill_total
    FROM bills
    WHERE id = COALESCE(NEW.bill_id, OLD.bill_id);
    
    UPDATE bills
    SET 
        amount_paid = total_applied,
        balance_due = bill_total - total_applied,
        status = CASE
            WHEN total_applied = 0 THEN 'open'
            WHEN total_applied >= bill_total THEN 'paid'
            WHEN total_applied > 0 THEN 'partial'
            ELSE status
        END,
        paid_date = CASE WHEN total_applied >= bill_total THEN CURRENT_DATE ELSE NULL END
    WHERE id = COALESCE(NEW.bill_id, OLD.bill_id);
    
    RETURN COALESCE(NEW, OLD);
END;
$$;


--
-- Name: update_inventory_quantity(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.update_inventory_quantity() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
BEGIN
    -- Update quantity_on_hand when inventory transaction is created
    IF TG_OP = 'INSERT' THEN
        UPDATE items
        SET quantity_on_hand = quantity_on_hand + NEW.quantity_change
        WHERE id = NEW.item_id;
        
        -- Update average cost if needed
        IF NEW.transaction_type = 'purchase' THEN
            UPDATE items
            SET average_cost = (
                (average_cost * quantity_on_hand - NEW.quantity_change * NEW.unit_cost + NEW.total_cost) / 
                NULLIF(quantity_on_hand, 0)
            )
            WHERE id = NEW.item_id AND quantity_on_hand > 0;
        END IF;
        
        RETURN NEW;
    ELSIF TG_OP = 'DELETE' THEN
        UPDATE items
        SET quantity_on_hand = quantity_on_hand - OLD.quantity_change
        WHERE id = OLD.item_id;
        RETURN OLD;
    END IF;
    RETURN NULL;
END;
$$;


--
-- Name: update_invoice_balance(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.update_invoice_balance() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
DECLARE
    total_applied DECIMAL(19,4);
    invoice_total DECIMAL(19,4);
BEGIN
    -- Calculate total amount applied to invoice
    SELECT COALESCE(SUM(amount_applied), 0)
    INTO total_applied
    FROM payment_applications
    WHERE invoice_id = COALESCE(NEW.invoice_id, OLD.invoice_id);
    
    -- Get invoice total
    SELECT total_amount
    INTO invoice_total
    FROM invoices
    WHERE id = COALESCE(NEW.invoice_id, OLD.invoice_id);
    
    -- Update invoice
    UPDATE invoices
    SET 
        amount_paid = total_applied,
        balance_due = invoice_total - total_applied,
        status = CASE
            WHEN total_applied = 0 THEN 'sent'
            WHEN total_applied >= invoice_total THEN 'paid'
            WHEN total_applied > 0 THEN 'partial'
            ELSE status
        END,
        paid_date = CASE WHEN total_applied >= invoice_total THEN CURRENT_DATE ELSE NULL END
    WHERE id = COALESCE(NEW.invoice_id, OLD.invoice_id);
    
    RETURN COALESCE(NEW, OLD);
END;
$$;


--
-- Name: update_updated_at_column(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.update_updated_at_column() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$;


--
-- Name: validate_post_transaction(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.validate_post_transaction() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
DECLARE
    total_debits DECIMAL(19,4);
    total_credits DECIMAL(19,4);
BEGIN
    IF NEW.is_posted = TRUE AND OLD.is_posted = FALSE THEN
        -- Validate balance before allowing post
        SELECT 
            COALESCE(SUM(debit_amount), 0),
            COALESCE(SUM(credit_amount), 0)
        INTO total_debits, total_credits
        FROM transaction_lines
        WHERE transaction_id = NEW.id;
        
        IF ABS(total_debits - total_credits) > 0.01 THEN
            RAISE EXCEPTION 'Cannot post unbalanced transaction. Debits: %, Credits: %', 
                total_debits, total_credits;
        END IF;
    END IF;
    
    RETURN NEW;
END;
$$;


--
-- Name: validate_transaction_balance(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.validate_transaction_balance() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
DECLARE
    total_debits DECIMAL(19,4);
    total_credits DECIMAL(19,4);
BEGIN
    -- Calculate totals for the transaction
    SELECT 
        COALESCE(SUM(debit_amount), 0),
        COALESCE(SUM(credit_amount), 0)
    INTO total_debits, total_credits
    FROM transaction_lines
    WHERE transaction_id = COALESCE(NEW.transaction_id, OLD.transaction_id);
    
    -- Check if debits equal credits (allow small rounding differences)
    IF ABS(total_debits - total_credits) > 0.01 THEN
        RAISE EXCEPTION 'Transaction is not balanced. Debits: %, Credits: %. Difference: %', 
            total_debits, total_credits, ABS(total_debits - total_credits);
    END IF;
    
    RETURN COALESCE(NEW, OLD);
END;
$$;


--
-- Name: validate_transaction_for_posting(integer); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.validate_transaction_for_posting(p_transaction_id integer) RETURNS boolean
    LANGUAGE plpgsql
    AS $$
DECLARE
    total_debits DECIMAL(19,4);
    total_credits DECIMAL(19,4);
    line_count INTEGER;
BEGIN
    -- Check if transaction exists
    IF NOT EXISTS (SELECT 1 FROM transactions WHERE id = p_transaction_id) THEN
        RAISE EXCEPTION 'Transaction % does not exist', p_transaction_id;
    END IF;
    
    -- Check if transaction has lines
    SELECT COUNT(*)
    INTO line_count
    FROM transaction_lines
    WHERE transaction_id = p_transaction_id;
    
    IF line_count = 0 THEN
        RAISE EXCEPTION 'Transaction % has no lines', p_transaction_id;
    END IF;
    
    -- Check balance
    SELECT 
        COALESCE(SUM(debit_amount), 0),
        COALESCE(SUM(credit_amount), 0)
    INTO total_debits, total_credits
    FROM transaction_lines
    WHERE transaction_id = p_transaction_id;
    
    IF ABS(total_debits - total_credits) > 0.01 THEN
        RAISE EXCEPTION 'Transaction % is not balanced. Debits: %, Credits: %', 
            p_transaction_id, total_debits, total_credits;
    END IF;
    
    RETURN TRUE;
END;
$$;


--
-- Name: void_transaction(integer, text); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.void_transaction(p_transaction_id integer, p_reason text DEFAULT NULL::text) RETURNS boolean
    LANGUAGE plpgsql
    AS $$
BEGIN
    -- Check if transaction exists and is not already void
    IF NOT EXISTS (SELECT 1 FROM transactions WHERE id = p_transaction_id) THEN
        RAISE EXCEPTION 'Transaction % does not exist', p_transaction_id;
    END IF;
    
    IF EXISTS (SELECT 1 FROM transactions WHERE id = p_transaction_id AND is_void = TRUE) THEN
        RAISE EXCEPTION 'Transaction % is already void', p_transaction_id;
    END IF;
    
    -- Mark as void
    UPDATE transactions
    SET is_void = TRUE,
        void_date = CURRENT_DATE,
        void_reason = p_reason,
        updated_at = CURRENT_TIMESTAMP
    WHERE id = p_transaction_id;
    
    RETURN TRUE;
END;
$$;


SET default_tablespace = '';

SET default_table_access_method = heap;

--
-- Name: accounting_settings; Type: TABLE; Schema: accounting; Owner: -
--

CREATE TABLE accounting.accounting_settings (
    id integer NOT NULL,
    establishment_id integer NOT NULL,
    sales_revenue_account_id integer,
    discounts_account_id integer,
    returns_account_id integer,
    cogs_account_id integer,
    inventory_account_id integer,
    processor_fees_account_id integer,
    tips_payable_account_id integer,
    tips_expense_account_id integer,
    sales_tax_account_id integer,
    cash_account_id integer,
    card_clearing_account_id integer,
    store_credit_account_id integer,
    accounts_payable_account_id integer,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    vertical character varying(50) DEFAULT 'retail'::character varying,
    gift_card_account_id integer,
    loyalty_expense_account_id integer,
    platform_fees_account_id integer,
    inventory_writeoff_account_id integer,
    theft_account_id integer,
    cash_over_short_account_id integer
);


--
-- Name: accounting_settings_id_seq; Type: SEQUENCE; Schema: accounting; Owner: -
--

CREATE SEQUENCE accounting.accounting_settings_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: accounting_settings_id_seq; Type: SEQUENCE OWNED BY; Schema: accounting; Owner: -
--

ALTER SEQUENCE accounting.accounting_settings_id_seq OWNED BY accounting.accounting_settings.id;


--
-- Name: accounts; Type: TABLE; Schema: accounting; Owner: -
--

CREATE TABLE accounting.accounts (
    id integer NOT NULL,
    account_number character varying(20),
    account_name character varying(255) NOT NULL,
    account_type character varying(50) NOT NULL,
    sub_type character varying(100),
    parent_account_id integer,
    balance_type character varying(10) NOT NULL,
    description text,
    is_active boolean DEFAULT true,
    is_system_account boolean DEFAULT false,
    tax_line_id integer,
    opening_balance numeric(19,4) DEFAULT 0,
    opening_balance_date date,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    created_by integer,
    updated_by integer,
    establishment_id integer,
    CONSTRAINT accounts_balance_type_check CHECK (((balance_type)::text = ANY ((ARRAY['debit'::character varying, 'credit'::character varying])::text[])))
);


--
-- Name: accounts_id_seq; Type: SEQUENCE; Schema: accounting; Owner: -
--

CREATE SEQUENCE accounting.accounts_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: accounts_id_seq; Type: SEQUENCE OWNED BY; Schema: accounting; Owner: -
--

ALTER SEQUENCE accounting.accounts_id_seq OWNED BY accounting.accounts.id;


--
-- Name: posting_rules; Type: TABLE; Schema: accounting; Owner: -
--

CREATE TABLE accounting.posting_rules (
    id integer NOT NULL,
    establishment_id integer,
    event_type character varying(50) NOT NULL,
    rule_json jsonb NOT NULL,
    is_active boolean DEFAULT true,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);


--
-- Name: posting_rules_id_seq; Type: SEQUENCE; Schema: accounting; Owner: -
--

CREATE SEQUENCE accounting.posting_rules_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: posting_rules_id_seq; Type: SEQUENCE OWNED BY; Schema: accounting; Owner: -
--

ALTER SEQUENCE accounting.posting_rules_id_seq OWNED BY accounting.posting_rules.id;


--
-- Name: transaction_lines; Type: TABLE; Schema: accounting; Owner: -
--

CREATE TABLE accounting.transaction_lines (
    id integer NOT NULL,
    transaction_id integer NOT NULL,
    account_id integer NOT NULL,
    line_number integer NOT NULL,
    debit_amount numeric(19,4) DEFAULT 0,
    credit_amount numeric(19,4) DEFAULT 0,
    description text,
    entity_type character varying(50),
    entity_id integer,
    class_id integer,
    location_id integer,
    billable boolean DEFAULT false,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    establishment_id integer,
    CONSTRAINT chk_debit_credit_excl CHECK ((((debit_amount > (0)::numeric) AND (credit_amount = (0)::numeric)) OR ((debit_amount = (0)::numeric) AND (credit_amount > (0)::numeric)))),
    CONSTRAINT transaction_lines_credit_amount_check CHECK ((credit_amount >= (0)::numeric)),
    CONSTRAINT transaction_lines_debit_amount_check CHECK ((debit_amount >= (0)::numeric))
);


--
-- Name: transaction_lines_id_seq; Type: SEQUENCE; Schema: accounting; Owner: -
--

CREATE SEQUENCE accounting.transaction_lines_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: transaction_lines_id_seq; Type: SEQUENCE OWNED BY; Schema: accounting; Owner: -
--

ALTER SEQUENCE accounting.transaction_lines_id_seq OWNED BY accounting.transaction_lines.id;


--
-- Name: transaction_number_seq; Type: SEQUENCE; Schema: accounting; Owner: -
--

CREATE SEQUENCE accounting.transaction_number_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: transactions; Type: TABLE; Schema: accounting; Owner: -
--

CREATE TABLE accounting.transactions (
    id integer NOT NULL,
    transaction_number character varying(50) DEFAULT ''::character varying NOT NULL,
    transaction_date date NOT NULL,
    transaction_type character varying(50) NOT NULL,
    reference_number character varying(100),
    description text,
    source_document_id integer,
    source_document_type character varying(50),
    is_posted boolean DEFAULT false,
    is_void boolean DEFAULT false,
    void_date date,
    void_reason text,
    reconciliation_status character varying(20) DEFAULT 'unreconciled'::character varying,
    reconciled_date date,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    created_by integer,
    updated_by integer,
    establishment_id integer,
    CONSTRAINT transactions_reconciliation_status_check CHECK (((reconciliation_status)::text = ANY ((ARRAY['unreconciled'::character varying, 'reconciled'::character varying, 'cleared'::character varying])::text[]))),
    CONSTRAINT transactions_transaction_type_check CHECK (((transaction_type)::text = ANY ((ARRAY['journal_entry'::character varying, 'invoice'::character varying, 'bill'::character varying, 'payment'::character varying, 'sales_receipt'::character varying, 'purchase'::character varying, 'refund'::character varying, 'adjustment'::character varying, 'transfer'::character varying, 'deposit'::character varying, 'withdrawal'::character varying])::text[])))
);


--
-- Name: transactions_id_seq; Type: SEQUENCE; Schema: accounting; Owner: -
--

CREATE SEQUENCE accounting.transactions_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: transactions_id_seq; Type: SEQUENCE OWNED BY; Schema: accounting; Owner: -
--

ALTER SEQUENCE accounting.transactions_id_seq OWNED BY accounting.transactions.id;


--
-- Name: accounting_customers; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.accounting_customers (
    id integer NOT NULL,
    customer_id integer,
    customer_number character varying(50) NOT NULL,
    customer_type character varying(20) NOT NULL,
    company_name character varying(255),
    first_name character varying(100),
    last_name character varying(100),
    display_name character varying(255) NOT NULL,
    email character varying(255),
    phone character varying(50),
    mobile character varying(50),
    website character varying(255),
    billing_address_line1 character varying(255),
    billing_address_line2 character varying(255),
    billing_city character varying(100),
    billing_state character varying(50),
    billing_postal_code character varying(20),
    billing_country character varying(50) DEFAULT 'US'::character varying,
    shipping_address_line1 character varying(255),
    shipping_address_line2 character varying(255),
    shipping_city character varying(100),
    shipping_state character varying(50),
    shipping_postal_code character varying(20),
    shipping_country character varying(50) DEFAULT 'US'::character varying,
    payment_terms character varying(50),
    payment_terms_days integer DEFAULT 30,
    credit_limit numeric(19,4) DEFAULT 0,
    tax_exempt boolean DEFAULT false,
    tax_exempt_id character varying(100),
    tax_rate_id integer,
    account_balance numeric(19,4) DEFAULT 0,
    notes text,
    is_active boolean DEFAULT true,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    created_by integer,
    updated_by integer,
    CONSTRAINT accounting_customers_customer_type_check CHECK (((customer_type)::text = ANY ((ARRAY['individual'::character varying, 'business'::character varying])::text[])))
);


--
-- Name: accounting_customers_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.accounting_customers_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: accounting_customers_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.accounting_customers_id_seq OWNED BY public.accounting_customers.id;


--
-- Name: accounting_vendors; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.accounting_vendors (
    id integer NOT NULL,
    vendor_id integer,
    vendor_number character varying(50) NOT NULL,
    vendor_name character varying(255) NOT NULL,
    contact_name character varying(100),
    email character varying(255),
    phone character varying(50),
    website character varying(255),
    address_line1 character varying(255),
    address_line2 character varying(255),
    city character varying(100),
    state character varying(50),
    postal_code character varying(20),
    country character varying(50) DEFAULT 'US'::character varying,
    payment_terms character varying(50),
    payment_terms_days integer DEFAULT 30,
    account_number character varying(100),
    tax_id character varying(50),
    is_1099_vendor boolean DEFAULT false,
    payment_method character varying(50),
    account_balance numeric(19,4) DEFAULT 0,
    notes text,
    is_active boolean DEFAULT true,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    created_by integer,
    updated_by integer
);


--
-- Name: accounting_vendors_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.accounting_vendors_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: accounting_vendors_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.accounting_vendors_id_seq OWNED BY public.accounting_vendors.id;


--
-- Name: accounts; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.accounts (
    id integer NOT NULL,
    account_number character varying(20),
    account_name character varying(255) NOT NULL,
    account_type character varying(50) NOT NULL,
    sub_type character varying(100),
    parent_account_id integer,
    balance_type character varying(10) NOT NULL,
    description text,
    is_active boolean DEFAULT true,
    is_system_account boolean DEFAULT false,
    tax_line_id integer,
    opening_balance numeric(19,4) DEFAULT 0,
    opening_balance_date date,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    created_by integer,
    updated_by integer,
    CONSTRAINT accounts_account_type_check CHECK (((account_type)::text = ANY ((ARRAY['Asset'::character varying, 'Liability'::character varying, 'Equity'::character varying, 'Revenue'::character varying, 'Expense'::character varying, 'COGS'::character varying, 'Other Income'::character varying, 'Other Expense'::character varying, 'Cost of Goods Sold'::character varying])::text[]))),
    CONSTRAINT accounts_balance_type_check CHECK (((balance_type)::text = ANY ((ARRAY['debit'::character varying, 'credit'::character varying])::text[])))
);


--
-- Name: accounts_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.accounts_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: accounts_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.accounts_id_seq OWNED BY public.accounts.id;


--
-- Name: approved_shipment_items; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.approved_shipment_items (
    approved_item_id integer NOT NULL,
    shipment_id integer NOT NULL,
    product_id integer NOT NULL,
    quantity_received integer NOT NULL,
    unit_cost numeric NOT NULL,
    lot_number text,
    expiration_date date,
    received_by integer NOT NULL,
    received_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT approved_shipment_items_quantity_received_check CHECK ((quantity_received > 0)),
    CONSTRAINT approved_shipment_items_unit_cost_check CHECK ((unit_cost >= (0)::numeric))
);


--
-- Name: approved_shipment_items_approved_item_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.approved_shipment_items_approved_item_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: approved_shipment_items_approved_item_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.approved_shipment_items_approved_item_id_seq OWNED BY public.approved_shipment_items.approved_item_id;


--
-- Name: approved_shipments; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.approved_shipments (
    shipment_id integer NOT NULL,
    pending_shipment_id integer,
    vendor_id integer NOT NULL,
    purchase_order_number text,
    received_date date,
    approved_by integer NOT NULL,
    approved_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    total_items_received integer DEFAULT 0,
    total_cost numeric DEFAULT 0,
    has_issues integer DEFAULT 0,
    issue_count integer DEFAULT 0,
    CONSTRAINT approved_shipments_has_issues_check CHECK ((has_issues = ANY (ARRAY[0, 1])))
);


--
-- Name: approved_shipments_shipment_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.approved_shipments_shipment_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: approved_shipments_shipment_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.approved_shipments_shipment_id_seq OWNED BY public.approved_shipments.shipment_id;


--
-- Name: audit_log; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.audit_log (
    audit_id integer NOT NULL,
    establishment_id integer NOT NULL,
    table_name text NOT NULL,
    record_id integer NOT NULL,
    action_type text NOT NULL,
    employee_id integer NOT NULL,
    action_timestamp timestamp without time zone DEFAULT now(),
    old_values text,
    new_values text,
    ip_address text,
    notes text,
    resource_type text,
    details text,
    CONSTRAINT audit_log_action_type_check CHECK ((action_type = ANY (ARRAY['INSERT'::text, 'UPDATE'::text, 'DELETE'::text, 'APPROVE'::text, 'VOID'::text, 'RETURN'::text, 'LOGIN'::text, 'LOGOUT'::text, 'CLOCK_IN'::text, 'CLOCK_OUT'::text])))
);


--
-- Name: audit_log_audit_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.audit_log_audit_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: audit_log_audit_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.audit_log_audit_id_seq OWNED BY public.audit_log.audit_id;


--
-- Name: bill_number_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.bill_number_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: bill_payment_number_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.bill_payment_number_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: calendar_subscriptions; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.calendar_subscriptions (
    subscription_id integer NOT NULL,
    employee_id integer NOT NULL,
    subscription_token character varying(255) NOT NULL,
    include_shifts smallint DEFAULT 1,
    include_shipments smallint DEFAULT 1,
    include_meetings smallint DEFAULT 1,
    include_deadlines smallint DEFAULT 1,
    calendar_name character varying(255) DEFAULT 'My Work Schedule'::character varying,
    is_active smallint DEFAULT 1,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);


--
-- Name: calendar_subscriptions_subscription_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.calendar_subscriptions_subscription_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: calendar_subscriptions_subscription_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.calendar_subscriptions_subscription_id_seq OWNED BY public.calendar_subscriptions.subscription_id;


--
-- Name: cash_register_sessions; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.cash_register_sessions (
    register_session_id integer NOT NULL,
    establishment_id integer NOT NULL,
    register_id integer DEFAULT 1,
    employee_id integer NOT NULL,
    opened_at timestamp without time zone DEFAULT now(),
    closed_at timestamp without time zone,
    starting_cash numeric(10,2) DEFAULT 0 NOT NULL,
    ending_cash numeric(10,2),
    expected_cash numeric(10,2),
    cash_sales numeric(10,2) DEFAULT 0,
    cash_refunds numeric(10,2) DEFAULT 0,
    cash_in numeric(10,2) DEFAULT 0,
    cash_out numeric(10,2) DEFAULT 0,
    discrepancy numeric(10,2) DEFAULT 0,
    status text DEFAULT 'open'::text,
    notes text,
    closed_by integer,
    reconciled_by integer,
    reconciled_at timestamp without time zone,
    CONSTRAINT cash_register_sessions_starting_cash_check CHECK ((starting_cash >= (0)::numeric)),
    CONSTRAINT cash_register_sessions_status_check CHECK ((status = ANY (ARRAY['open'::text, 'closed'::text, 'reconciled'::text])))
);


--
-- Name: cash_register_sessions_session_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.cash_register_sessions_session_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: cash_register_sessions_session_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.cash_register_sessions_session_id_seq OWNED BY public.cash_register_sessions.register_session_id;


--
-- Name: cash_transactions; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.cash_transactions (
    transaction_id integer NOT NULL,
    establishment_id integer NOT NULL,
    session_id integer,
    transaction_type text NOT NULL,
    amount numeric(10,2) NOT NULL,
    reason text,
    employee_id integer NOT NULL,
    transaction_date timestamp without time zone DEFAULT now(),
    notes text,
    CONSTRAINT cash_transactions_amount_check CHECK ((amount > (0)::numeric)),
    CONSTRAINT cash_transactions_transaction_type_check CHECK ((transaction_type = ANY (ARRAY['cash_in'::text, 'cash_out'::text, 'deposit'::text, 'withdrawal'::text, 'adjustment'::text])))
);


--
-- Name: cash_transactions_transaction_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.cash_transactions_transaction_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: cash_transactions_transaction_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.cash_transactions_transaction_id_seq OWNED BY public.cash_transactions.transaction_id;


--
-- Name: categories; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.categories (
    category_id integer NOT NULL,
    category_name text NOT NULL,
    description text,
    parent_category_id integer,
    is_auto_generated integer DEFAULT 0,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    archived boolean DEFAULT false,
    CONSTRAINT categories_is_auto_generated_check CHECK ((is_auto_generated = ANY (ARRAY[0, 1])))
);


--
-- Name: categories_category_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.categories_category_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: categories_category_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.categories_category_id_seq OWNED BY public.categories.category_id;


--
-- Name: chart_of_accounts; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.chart_of_accounts (
    account_id integer NOT NULL,
    establishment_id integer NOT NULL,
    account_number text NOT NULL,
    account_name text NOT NULL,
    account_type text NOT NULL,
    account_subtype text,
    normal_balance text NOT NULL,
    parent_account_id integer,
    is_active integer DEFAULT 1,
    description text,
    CONSTRAINT chart_of_accounts_account_type_check CHECK ((account_type = ANY (ARRAY['asset'::text, 'liability'::text, 'equity'::text, 'revenue'::text, 'expense'::text, 'contra_asset'::text, 'contra_revenue'::text]))),
    CONSTRAINT chart_of_accounts_is_active_check CHECK ((is_active = ANY (ARRAY[0, 1]))),
    CONSTRAINT chart_of_accounts_normal_balance_check CHECK ((normal_balance = ANY (ARRAY['debit'::text, 'credit'::text])))
);


--
-- Name: chart_of_accounts_account_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.chart_of_accounts_account_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: chart_of_accounts_account_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.chart_of_accounts_account_id_seq OWNED BY public.chart_of_accounts.account_id;


--
-- Name: classes; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.classes (
    id integer NOT NULL,
    class_name character varying(100) NOT NULL,
    description text,
    is_active boolean DEFAULT true,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);


--
-- Name: classes_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.classes_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: classes_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.classes_id_seq OWNED BY public.classes.id;


--
-- Name: clockin_notification_settings; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.clockin_notification_settings (
    id integer NOT NULL,
    store_id integer DEFAULT 1 NOT NULL,
    notify_admin_on_clockin boolean DEFAULT false NOT NULL,
    notify_admin_on_clockout boolean DEFAULT false NOT NULL,
    admin_email_ids integer[] DEFAULT '{}'::integer[],
    notify_employee_self boolean DEFAULT false NOT NULL,
    late_alert_enabled boolean DEFAULT false NOT NULL,
    late_alert_threshold_min integer DEFAULT 10 NOT NULL,
    late_alert_to_employee boolean DEFAULT false NOT NULL,
    late_alert_to_admin boolean DEFAULT true NOT NULL,
    late_alert_delay_min integer DEFAULT 15 NOT NULL,
    overtime_alert_enabled boolean DEFAULT false NOT NULL,
    overtime_threshold_hours numeric(4,2) DEFAULT 8.0 NOT NULL,
    updated_at timestamp with time zone DEFAULT now()
);


--
-- Name: clockin_notification_settings_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.clockin_notification_settings_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: clockin_notification_settings_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.clockin_notification_settings_id_seq OWNED BY public.clockin_notification_settings.id;


--
-- Name: customer_display_sessions; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.customer_display_sessions (
    session_id integer NOT NULL,
    establishment_id integer NOT NULL,
    transaction_id integer NOT NULL,
    created_at timestamp without time zone DEFAULT now(),
    updated_at timestamp without time zone DEFAULT now()
);


--
-- Name: customer_display_sessions_session_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.customer_display_sessions_session_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: customer_display_sessions_session_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.customer_display_sessions_session_id_seq OWNED BY public.customer_display_sessions.session_id;


--
-- Name: customer_display_settings; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.customer_display_settings (
    setting_id integer NOT NULL,
    establishment_id integer NOT NULL,
    tip_enabled integer DEFAULT 0 NOT NULL,
    tip_suggestions text,
    receipt_enabled integer DEFAULT 1 NOT NULL,
    signature_required integer DEFAULT 0 NOT NULL,
    display_message text,
    created_at timestamp without time zone DEFAULT now(),
    updated_at timestamp without time zone DEFAULT now(),
    checkout_ui text,
    CONSTRAINT customer_display_settings_receipt_enabled_check CHECK ((receipt_enabled = ANY (ARRAY[0, 1]))),
    CONSTRAINT customer_display_settings_signature_required_check CHECK ((signature_required = ANY (ARRAY[0, 1]))),
    CONSTRAINT customer_display_settings_tip_enabled_check CHECK ((tip_enabled = ANY (ARRAY[0, 1])))
);


--
-- Name: customer_display_settings_setting_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.customer_display_settings_setting_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: customer_display_settings_setting_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.customer_display_settings_setting_id_seq OWNED BY public.customer_display_settings.setting_id;


--
-- Name: customer_rewards_settings; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.customer_rewards_settings (
    id integer NOT NULL,
    enabled integer DEFAULT 0,
    require_email integer DEFAULT 0,
    require_phone integer DEFAULT 0,
    require_both integer DEFAULT 0,
    reward_type text DEFAULT 'points'::text,
    points_per_dollar real DEFAULT 1.0,
    percentage_discount real DEFAULT 0.0,
    fixed_discount real DEFAULT 0.0,
    minimum_spend real DEFAULT 0.0,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    points_enabled integer DEFAULT 1,
    percentage_enabled integer DEFAULT 0,
    fixed_enabled integer DEFAULT 0,
    CONSTRAINT customer_rewards_settings_enabled_check CHECK ((enabled = ANY (ARRAY[0, 1]))),
    CONSTRAINT customer_rewards_settings_fixed_discount_check CHECK ((fixed_discount >= (0)::double precision)),
    CONSTRAINT customer_rewards_settings_minimum_spend_check CHECK ((minimum_spend >= (0)::double precision)),
    CONSTRAINT customer_rewards_settings_percentage_discount_check CHECK (((percentage_discount >= (0)::double precision) AND (percentage_discount <= (100)::double precision))),
    CONSTRAINT customer_rewards_settings_points_per_dollar_check CHECK ((points_per_dollar >= (0)::double precision)),
    CONSTRAINT customer_rewards_settings_require_both_check CHECK ((require_both = ANY (ARRAY[0, 1]))),
    CONSTRAINT customer_rewards_settings_require_email_check CHECK ((require_email = ANY (ARRAY[0, 1]))),
    CONSTRAINT customer_rewards_settings_require_phone_check CHECK ((require_phone = ANY (ARRAY[0, 1]))),
    CONSTRAINT customer_rewards_settings_reward_type_check CHECK ((reward_type = ANY (ARRAY['points'::text, 'percentage'::text, 'fixed'::text])))
);


--
-- Name: customer_rewards_settings_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.customer_rewards_settings_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: customer_rewards_settings_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.customer_rewards_settings_id_seq OWNED BY public.customer_rewards_settings.id;


--
-- Name: customers; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.customers (
    customer_id integer NOT NULL,
    establishment_id integer NOT NULL,
    customer_name text,
    email text,
    phone text,
    loyalty_points integer DEFAULT 0,
    created_date timestamp without time zone DEFAULT now(),
    updated_at timestamp without time zone DEFAULT now(),
    total_spent numeric(12,2) DEFAULT 0,
    address text
);


--
-- Name: customers_customer_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.customers_customer_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: customers_customer_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.customers_customer_id_seq OWNED BY public.customers.customer_id;


--
-- Name: daily_cash_counts; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.daily_cash_counts (
    count_id integer NOT NULL,
    establishment_id integer NOT NULL,
    register_id integer DEFAULT 1 NOT NULL,
    count_date date NOT NULL,
    count_type text DEFAULT 'drop'::text NOT NULL,
    total_amount numeric(10,2) NOT NULL,
    denominations text,
    counted_by integer NOT NULL,
    counted_at timestamp without time zone DEFAULT now(),
    notes text,
    CONSTRAINT daily_cash_counts_count_type_check CHECK ((count_type = ANY (ARRAY['drop'::text, 'opening'::text, 'closing'::text])))
);


--
-- Name: daily_cash_counts_count_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.daily_cash_counts_count_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: daily_cash_counts_count_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.daily_cash_counts_count_id_seq OWNED BY public.daily_cash_counts.count_id;


--
-- Name: doordash_order_lines; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.doordash_order_lines (
    id integer NOT NULL,
    order_id integer NOT NULL,
    line_item_id text,
    line_option_id text,
    product_id integer NOT NULL,
    quantity integer DEFAULT 1 NOT NULL,
    unit_price_cents integer DEFAULT 0 NOT NULL
);


--
-- Name: TABLE doordash_order_lines; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON TABLE public.doordash_order_lines IS 'DoorDash adjustment: line_item_id (main item) and line_option_id (modifier) from order payload for PATCH .../orders/{id}/adjustment.';


--
-- Name: doordash_order_lines_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.doordash_order_lines_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: doordash_order_lines_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.doordash_order_lines_id_seq OWNED BY public.doordash_order_lines.id;


--
-- Name: doordash_store_deactivation_events; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.doordash_store_deactivation_events (
    id integer NOT NULL,
    establishment_id integer NOT NULL,
    doordash_store_id integer,
    merchant_supplied_id text,
    reason_id integer,
    reason text,
    notes text,
    start_time timestamp with time zone,
    end_time timestamp with time zone,
    created_at timestamp with time zone DEFAULT now()
);


--
-- Name: doordash_store_deactivation_events_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.doordash_store_deactivation_events_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: doordash_store_deactivation_events_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.doordash_store_deactivation_events_id_seq OWNED BY public.doordash_store_deactivation_events.id;


--
-- Name: email_templates; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.email_templates (
    id integer NOT NULL,
    store_id integer NOT NULL,
    category text NOT NULL,
    name text NOT NULL,
    subject_template text NOT NULL,
    body_html_template text NOT NULL,
    body_text_template text,
    variables jsonb,
    is_default integer DEFAULT 0,
    created_at timestamp without time zone DEFAULT now(),
    updated_at timestamp without time zone DEFAULT now(),
    CONSTRAINT email_templates_category_check CHECK ((category = ANY (ARRAY['receipt'::text, 'order'::text, 'report'::text, 'schedule'::text, 'clockin'::text, 'generic'::text]))),
    CONSTRAINT email_templates_is_default_check CHECK ((is_default = ANY (ARRAY[0, 1])))
);


--
-- Name: email_templates_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.email_templates_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: email_templates_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.email_templates_id_seq OWNED BY public.email_templates.id;


--
-- Name: employee_availability; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.employee_availability (
    availability_id integer NOT NULL,
    establishment_id integer NOT NULL,
    employee_id integer NOT NULL,
    monday text,
    tuesday text,
    wednesday text,
    thursday text,
    friday text,
    saturday text,
    sunday text,
    updated_at timestamp without time zone DEFAULT now()
);


--
-- Name: employee_availability_availability_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.employee_availability_availability_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: employee_availability_availability_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.employee_availability_availability_id_seq OWNED BY public.employee_availability.availability_id;


--
-- Name: employee_permission_overrides; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.employee_permission_overrides (
    override_id integer NOT NULL,
    establishment_id integer NOT NULL,
    employee_id integer NOT NULL,
    permission_id integer NOT NULL,
    granted integer,
    reason text,
    created_by integer,
    created_at timestamp without time zone DEFAULT now(),
    CONSTRAINT employee_permission_overrides_granted_check CHECK ((granted = ANY (ARRAY[0, 1])))
);


--
-- Name: employee_permission_overrides_override_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.employee_permission_overrides_override_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: employee_permission_overrides_override_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.employee_permission_overrides_override_id_seq OWNED BY public.employee_permission_overrides.override_id;


--
-- Name: employee_positions; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.employee_positions (
    employee_position_id integer NOT NULL,
    employee_id integer NOT NULL,
    position_name text NOT NULL,
    hourly_rate numeric(10,2)
);


--
-- Name: employee_positions_employee_position_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.employee_positions_employee_position_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: employee_positions_employee_position_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.employee_positions_employee_position_id_seq OWNED BY public.employee_positions.employee_position_id;


--
-- Name: employee_schedule; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.employee_schedule (
    schedule_id integer NOT NULL,
    establishment_id integer NOT NULL,
    employee_id integer NOT NULL,
    schedule_date date NOT NULL,
    start_time time without time zone,
    end_time time without time zone,
    break_duration integer DEFAULT 0,
    notes text,
    status text DEFAULT 'scheduled'::text,
    confirmed integer DEFAULT 0,
    confirmed_at timestamp without time zone,
    time_entry_id integer,
    CONSTRAINT employee_schedule_confirmed_check CHECK ((confirmed = ANY (ARRAY[0, 1]))),
    CONSTRAINT employee_schedule_status_check CHECK ((status = ANY (ARRAY['scheduled'::text, 'clocked_in'::text, 'clocked_out'::text, 'no_show'::text, 'cancelled'::text])))
);


--
-- Name: employee_schedule_schedule_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.employee_schedule_schedule_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: employee_schedule_schedule_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.employee_schedule_schedule_id_seq OWNED BY public.employee_schedule.schedule_id;


--
-- Name: employee_sessions; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.employee_sessions (
    session_id integer NOT NULL,
    establishment_id integer NOT NULL,
    employee_id integer NOT NULL,
    login_time timestamp without time zone DEFAULT now(),
    logout_time timestamp without time zone,
    session_token text,
    ip_address text,
    device_info text,
    is_active integer DEFAULT 1,
    expires_at timestamp without time zone,
    last_activity timestamp without time zone,
    CONSTRAINT employee_sessions_is_active_check CHECK ((is_active = ANY (ARRAY[0, 1])))
);


--
-- Name: employee_sessions_session_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.employee_sessions_session_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: employee_sessions_session_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.employee_sessions_session_id_seq OWNED BY public.employee_sessions.session_id;


--
-- Name: employees; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.employees (
    employee_id integer NOT NULL,
    establishment_id integer NOT NULL,
    employee_code text NOT NULL,
    first_name text NOT NULL,
    last_name text NOT NULL,
    email text,
    phone text,
    password_hash text,
    "position" text NOT NULL,
    department text,
    date_started date NOT NULL,
    date_terminated date,
    hourly_rate numeric(10,2),
    salary numeric(10,2),
    employment_type text DEFAULT 'part_time'::text,
    active integer DEFAULT 1,
    address text,
    emergency_contact_name text,
    emergency_contact_phone text,
    notes text,
    last_login timestamp without time zone,
    created_at timestamp without time zone DEFAULT now(),
    updated_at timestamp without time zone DEFAULT now(),
    role_id integer,
    max_hours_per_week integer DEFAULT 40,
    min_hours_per_week integer DEFAULT 0,
    pin_code text,
    allow_unscheduled_clockin boolean DEFAULT true,
    is_admin boolean DEFAULT false NOT NULL,
    CONSTRAINT employees_active_check CHECK ((active = ANY (ARRAY[0, 1]))),
    CONSTRAINT employees_employment_type_check CHECK ((employment_type = ANY (ARRAY['full_time'::text, 'part_time'::text, 'contract'::text, 'temporary'::text]))),
    CONSTRAINT employees_position_check CHECK (("position" = ANY (ARRAY['cashier'::text, 'stock_clerk'::text, 'manager'::text, 'admin'::text, 'supervisor'::text, 'assistant_manager'::text, 'employee'::text])))
);


--
-- Name: employees_employee_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.employees_employee_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: employees_employee_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.employees_employee_id_seq OWNED BY public.employees.employee_id;


--
-- Name: establishments; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.establishments (
    establishment_id integer NOT NULL,
    establishment_name text NOT NULL,
    establishment_code text NOT NULL,
    subdomain text,
    created_at timestamp without time zone DEFAULT now(),
    is_active boolean DEFAULT true,
    settings jsonb DEFAULT '{}'::jsonb
);


--
-- Name: establishments_establishment_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.establishments_establishment_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: establishments_establishment_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.establishments_establishment_id_seq OWNED BY public.establishments.establishment_id;


--
-- Name: extraction_cost_log; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.extraction_cost_log (
    log_id integer NOT NULL,
    extractor text NOT NULL,
    model text NOT NULL,
    filename text,
    file_type text,
    extraction_method text,
    input_tokens integer,
    output_tokens integer,
    input_cost_usd numeric(10,6),
    output_cost_usd numeric(10,6),
    total_cost_usd numeric(10,6),
    items_extracted integer,
    avg_confidence real,
    success integer DEFAULT 1,
    error_message text,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT extraction_cost_log_success_check CHECK ((success = ANY (ARRAY[0, 1])))
);


--
-- Name: extraction_cost_by_model; Type: VIEW; Schema: public; Owner: -
--

CREATE VIEW public.extraction_cost_by_model AS
 SELECT extraction_cost_log.extractor,
    extraction_cost_log.model,
    count(*) AS total_calls,
    sum(
        CASE
            WHEN (extraction_cost_log.success = 1) THEN 1
            ELSE 0
        END) AS successful_calls,
    sum(extraction_cost_log.input_tokens) AS total_input_tokens,
    sum(extraction_cost_log.output_tokens) AS total_output_tokens,
    sum(extraction_cost_log.total_cost_usd) AS total_cost_usd
   FROM public.extraction_cost_log
  GROUP BY extraction_cost_log.extractor, extraction_cost_log.model;


--
-- Name: extraction_cost_log_log_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.extraction_cost_log_log_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: extraction_cost_log_log_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.extraction_cost_log_log_id_seq OWNED BY public.extraction_cost_log.log_id;


--
-- Name: fiscal_periods; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.fiscal_periods (
    period_id integer NOT NULL,
    establishment_id integer NOT NULL,
    period_name text NOT NULL,
    start_date date NOT NULL,
    end_date date NOT NULL,
    is_closed integer DEFAULT 0,
    closed_by integer,
    closed_date timestamp without time zone,
    CONSTRAINT fiscal_periods_is_closed_check CHECK ((is_closed = ANY (ARRAY[0, 1])))
);


--
-- Name: fiscal_periods_period_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.fiscal_periods_period_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: fiscal_periods_period_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.fiscal_periods_period_id_seq OWNED BY public.fiscal_periods.period_id;


--
-- Name: google_calendar_tokens; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.google_calendar_tokens (
    id integer NOT NULL,
    employee_id integer NOT NULL,
    access_token text NOT NULL,
    refresh_token text,
    token_expiry timestamp with time zone,
    created_at timestamp without time zone DEFAULT now(),
    updated_at timestamp without time zone DEFAULT now()
);


--
-- Name: google_calendar_tokens_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.google_calendar_tokens_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: google_calendar_tokens_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.google_calendar_tokens_id_seq OWNED BY public.google_calendar_tokens.id;


--
-- Name: image_identifications; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.image_identifications (
    identification_id integer NOT NULL,
    establishment_id integer NOT NULL,
    product_id integer NOT NULL,
    query_image_path text NOT NULL,
    confidence_score numeric(3,2) NOT NULL,
    identified_by text,
    identified_at timestamp without time zone DEFAULT now(),
    context text DEFAULT 'manual_lookup'::text,
    CONSTRAINT image_identifications_confidence_score_check CHECK (((confidence_score >= (0)::numeric) AND (confidence_score <= (1)::numeric))),
    CONSTRAINT image_identifications_context_check CHECK ((context = ANY (ARRAY['inventory_check'::text, 'shipment_receiving'::text, 'manual_lookup'::text])))
);


--
-- Name: image_identifications_identification_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.image_identifications_identification_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: image_identifications_identification_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.image_identifications_identification_id_seq OWNED BY public.image_identifications.identification_id;


--
-- Name: inventory; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.inventory (
    product_id integer NOT NULL,
    establishment_id integer NOT NULL,
    product_name text NOT NULL,
    sku text NOT NULL,
    barcode text,
    product_price numeric(10,2) NOT NULL,
    product_cost numeric(10,2) NOT NULL,
    vendor_id integer,
    photo text,
    current_quantity integer DEFAULT 0 NOT NULL,
    category text,
    last_restocked timestamp without time zone,
    created_at timestamp without time zone DEFAULT now(),
    updated_at timestamp without time zone DEFAULT now(),
    item_type text DEFAULT 'product'::text NOT NULL,
    unit text,
    sell_at_pos boolean DEFAULT true NOT NULL,
    archived boolean DEFAULT false,
    item_special_hours jsonb,
    doordash_operation_context jsonb,
    doordash_calorific_display_type text,
    doordash_calorific_lower_range integer,
    doordash_calorific_higher_range integer,
    doordash_classification_tags jsonb,
    CONSTRAINT inventory_current_quantity_check CHECK ((current_quantity >= 0)),
    CONSTRAINT inventory_product_cost_check CHECK ((product_cost >= (0)::numeric)),
    CONSTRAINT inventory_product_price_check CHECK ((product_price >= (0)::numeric))
);


--
-- Name: COLUMN inventory.item_special_hours; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.inventory.item_special_hours IS 'DoorDash item-level availability: array of { day_index?, start_time?, end_time?, start_date?, end_date? }. Example: [{"day_index":"MON","start_time":"05:00:00","end_time":"17:00:00"}]';


--
-- Name: COLUMN inventory.doordash_operation_context; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.inventory.doordash_operation_context IS 'DoorDash menu: operation_context array e.g. ["RECIPE"] for recipe-based items.';


--
-- Name: COLUMN inventory.doordash_calorific_display_type; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.inventory.doordash_calorific_display_type IS 'DoorDash: display_type for calorific_info (e.g. cal).';


--
-- Name: COLUMN inventory.doordash_calorific_lower_range; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.inventory.doordash_calorific_lower_range IS 'DoorDash: lower_range for calorific_info (calories).';


--
-- Name: COLUMN inventory.doordash_calorific_higher_range; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.inventory.doordash_calorific_higher_range IS 'DoorDash: higher_range for calorific_info (calories).';


--
-- Name: COLUMN inventory.doordash_classification_tags; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.inventory.doordash_classification_tags IS 'DoorDash: classification_tags array e.g. [TAG_KEY_DIETARY_VEGETARIAN, TAG_KEY_DIETARY_VEGAN, TAG_KEY_DIETARY_GLUTEN_FREE].';


--
-- Name: inventory_product_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.inventory_product_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: inventory_product_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.inventory_product_id_seq OWNED BY public.inventory.product_id;


--
-- Name: invoice_lines; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.invoice_lines (
    id integer NOT NULL,
    invoice_id integer NOT NULL,
    line_number integer NOT NULL,
    item_id integer,
    description text NOT NULL,
    quantity numeric(19,4) NOT NULL,
    unit_price numeric(19,4) NOT NULL,
    line_total numeric(19,4) NOT NULL,
    discount_amount numeric(19,4) DEFAULT 0,
    discount_percentage numeric(5,2) DEFAULT 0,
    tax_rate_id integer,
    tax_amount numeric(19,4) DEFAULT 0,
    line_total_with_tax numeric(19,4) NOT NULL,
    account_id integer NOT NULL,
    item_type character varying(50) DEFAULT 'product'::character varying,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT invoice_lines_item_type_check CHECK (((item_type)::text = ANY ((ARRAY['product'::character varying, 'service'::character varying, 'discount'::character varying, 'subtotal'::character varying, 'tax'::character varying])::text[]))),
    CONSTRAINT invoice_lines_quantity_check CHECK ((quantity > (0)::numeric)),
    CONSTRAINT invoice_lines_unit_price_check CHECK ((unit_price >= (0)::numeric))
);


--
-- Name: invoice_lines_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.invoice_lines_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: invoice_lines_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.invoice_lines_id_seq OWNED BY public.invoice_lines.id;


--
-- Name: invoice_number_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.invoice_number_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: invoices; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.invoices (
    id integer NOT NULL,
    invoice_number character varying(50) NOT NULL,
    customer_id integer NOT NULL,
    invoice_date date NOT NULL,
    due_date date NOT NULL,
    terms character varying(50),
    status character varying(20) DEFAULT 'draft'::character varying NOT NULL,
    subtotal numeric(19,4) DEFAULT 0,
    tax_amount numeric(19,4) DEFAULT 0,
    discount_amount numeric(19,4) DEFAULT 0,
    discount_percentage numeric(5,2) DEFAULT 0,
    total_amount numeric(19,4) NOT NULL,
    amount_paid numeric(19,4) DEFAULT 0,
    balance_due numeric(19,4) NOT NULL,
    currency character varying(3) DEFAULT 'USD'::character varying,
    exchange_rate numeric(10,6) DEFAULT 1.0,
    billing_address_line1 character varying(255),
    billing_address_line2 character varying(255),
    billing_city character varying(100),
    billing_state character varying(50),
    billing_postal_code character varying(20),
    billing_country character varying(50),
    shipping_address_line1 character varying(255),
    shipping_address_line2 character varying(255),
    shipping_city character varying(100),
    shipping_state character varying(50),
    shipping_postal_code character varying(20),
    shipping_country character varying(50),
    memo text,
    internal_notes text,
    transaction_id integer,
    sent_date timestamp without time zone,
    viewed_date timestamp without time zone,
    paid_date date,
    void_date date,
    void_reason text,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    created_by integer,
    updated_by integer,
    CONSTRAINT check_due_date CHECK ((due_date >= invoice_date)),
    CONSTRAINT check_invoice_balance CHECK (((amount_paid + balance_due) = total_amount)),
    CONSTRAINT invoices_status_check CHECK (((status)::text = ANY ((ARRAY['draft'::character varying, 'sent'::character varying, 'viewed'::character varying, 'partial'::character varying, 'paid'::character varying, 'overdue'::character varying, 'void'::character varying])::text[])))
);


--
-- Name: invoices_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.invoices_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: invoices_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.invoices_id_seq OWNED BY public.invoices.id;


--
-- Name: items; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.items (
    id integer NOT NULL,
    item_number character varying(100) NOT NULL,
    item_name character varying(255) NOT NULL,
    item_type character varying(50) NOT NULL,
    description text,
    barcode character varying(100),
    unit_of_measure character varying(20) DEFAULT 'ea'::character varying,
    category_id integer,
    income_account_id integer NOT NULL,
    expense_account_id integer NOT NULL,
    asset_account_id integer,
    quantity_on_hand numeric(19,4) DEFAULT 0,
    reorder_point numeric(19,4) DEFAULT 0,
    reorder_quantity numeric(19,4) DEFAULT 0,
    purchase_cost numeric(19,4) DEFAULT 0,
    average_cost numeric(19,4) DEFAULT 0,
    sales_price numeric(19,4) DEFAULT 0,
    is_taxable boolean DEFAULT true,
    tax_rate_id integer,
    cost_method character varying(20) DEFAULT 'Average'::character varying,
    is_active boolean DEFAULT true,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    created_by integer,
    updated_by integer,
    CONSTRAINT items_cost_method_check CHECK (((cost_method)::text = ANY ((ARRAY['FIFO'::character varying, 'LIFO'::character varying, 'Average'::character varying, 'Specific'::character varying])::text[]))),
    CONSTRAINT items_item_type_check CHECK (((item_type)::text = ANY ((ARRAY['inventory'::character varying, 'non_inventory'::character varying, 'service'::character varying, 'bundle'::character varying])::text[])))
);


--
-- Name: items_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.items_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: items_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.items_id_seq OWNED BY public.items.id;


--
-- Name: journal_entries; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.journal_entries (
    journal_entry_id integer NOT NULL,
    establishment_id integer NOT NULL,
    entry_number text,
    entry_date date NOT NULL,
    entry_type text DEFAULT 'standard'::text,
    transaction_source text NOT NULL,
    source_id integer,
    description text NOT NULL,
    employee_id integer NOT NULL,
    posted integer DEFAULT 0,
    posted_date timestamp without time zone,
    notes text,
    CONSTRAINT journal_entries_entry_type_check CHECK ((entry_type = ANY (ARRAY['standard'::text, 'adjusting'::text, 'closing'::text, 'reversing'::text]))),
    CONSTRAINT journal_entries_posted_check CHECK ((posted = ANY (ARRAY[0, 1]))),
    CONSTRAINT journal_entries_transaction_source_check CHECK ((transaction_source = ANY (ARRAY['sale'::text, 'purchase'::text, 'shipment'::text, 'return'::text, 'adjustment'::text, 'payroll'::text, 'other'::text])))
);


--
-- Name: journal_entries_journal_entry_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.journal_entries_journal_entry_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: journal_entries_journal_entry_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.journal_entries_journal_entry_id_seq OWNED BY public.journal_entries.journal_entry_id;


--
-- Name: journal_entry_lines; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.journal_entry_lines (
    line_id integer NOT NULL,
    establishment_id integer NOT NULL,
    journal_entry_id integer NOT NULL,
    line_number integer NOT NULL,
    account_id integer NOT NULL,
    debit_amount numeric(10,2) DEFAULT 0,
    credit_amount numeric(10,2) DEFAULT 0,
    description text,
    CONSTRAINT journal_entry_lines_credit_amount_check CHECK ((credit_amount >= (0)::numeric)),
    CONSTRAINT journal_entry_lines_debit_amount_check CHECK ((debit_amount >= (0)::numeric))
);


--
-- Name: journal_entry_lines_line_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.journal_entry_lines_line_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: journal_entry_lines_line_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.journal_entry_lines_line_id_seq OWNED BY public.journal_entry_lines.line_id;


--
-- Name: locations; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.locations (
    id integer NOT NULL,
    location_name character varying(100) NOT NULL,
    address_line1 character varying(255),
    address_line2 character varying(255),
    city character varying(100),
    state character varying(50),
    postal_code character varying(20),
    country character varying(50) DEFAULT 'US'::character varying,
    is_active boolean DEFAULT true,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);


--
-- Name: locations_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.locations_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: locations_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.locations_id_seq OWNED BY public.locations.id;


--
-- Name: login_attempts; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.login_attempts (
    id integer NOT NULL,
    identifier text NOT NULL,
    establishment_id integer,
    ip_address text,
    attempted_at timestamp without time zone DEFAULT now(),
    succeeded boolean DEFAULT false
);


--
-- Name: login_attempts_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.login_attempts_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: login_attempts_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.login_attempts_id_seq OWNED BY public.login_attempts.id;


--
-- Name: master_calendar; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.master_calendar (
    calendar_id integer NOT NULL,
    establishment_id integer NOT NULL,
    event_date date NOT NULL,
    event_type text NOT NULL,
    title text NOT NULL,
    description text,
    start_time time without time zone,
    end_time time without time zone,
    related_id integer,
    related_table text,
    created_by integer,
    created_at timestamp without time zone DEFAULT now(),
    updated_at timestamp without time zone DEFAULT now(),
    google_event_id text,
    CONSTRAINT master_calendar_event_type_check CHECK ((event_type = ANY (ARRAY['schedule'::text, 'shipment'::text, 'holiday'::text, 'event'::text, 'meeting'::text, 'maintenance'::text, 'other'::text])))
);


--
-- Name: master_calendar_calendar_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.master_calendar_calendar_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: master_calendar_calendar_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.master_calendar_calendar_id_seq OWNED BY public.master_calendar.calendar_id;


--
-- Name: metadata_extraction_log; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.metadata_extraction_log (
    log_id integer NOT NULL,
    product_id integer NOT NULL,
    extraction_method text NOT NULL,
    data_extracted text,
    execution_time_ms integer,
    success integer DEFAULT 1,
    error_message text,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT metadata_extraction_log_success_check CHECK ((success = ANY (ARRAY[0, 1])))
);


--
-- Name: metadata_extraction_log_log_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.metadata_extraction_log_log_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: metadata_extraction_log_log_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.metadata_extraction_log_log_id_seq OWNED BY public.metadata_extraction_log.log_id;


--
-- Name: order_items; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.order_items (
    order_item_id integer NOT NULL,
    establishment_id integer NOT NULL,
    order_id integer NOT NULL,
    product_id integer NOT NULL,
    quantity integer NOT NULL,
    unit_price numeric(10,2) NOT NULL,
    discount numeric(10,2) DEFAULT 0,
    subtotal numeric(10,2) NOT NULL,
    tax_rate numeric(5,4) DEFAULT 0,
    tax_amount numeric(10,2) DEFAULT 0,
    variant_id integer,
    notes text,
    CONSTRAINT order_items_discount_check CHECK ((discount >= (0)::numeric)),
    CONSTRAINT order_items_quantity_check CHECK ((quantity > 0)),
    CONSTRAINT order_items_subtotal_check CHECK ((subtotal >= (0)::numeric)),
    CONSTRAINT order_items_tax_amount_check CHECK ((tax_amount >= (0)::numeric)),
    CONSTRAINT order_items_tax_rate_check CHECK (((tax_rate >= (0)::numeric) AND (tax_rate <= (1)::numeric))),
    CONSTRAINT order_items_unit_price_check CHECK ((unit_price >= (0)::numeric))
);


--
-- Name: order_items_order_item_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.order_items_order_item_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: order_items_order_item_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.order_items_order_item_id_seq OWNED BY public.order_items.order_item_id;


--
-- Name: orders; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.orders (
    order_id integer NOT NULL,
    establishment_id integer NOT NULL,
    order_number text,
    order_date timestamp without time zone DEFAULT now(),
    customer_id integer,
    employee_id integer NOT NULL,
    subtotal numeric(10,2) DEFAULT 0,
    tax_rate numeric(5,4) DEFAULT 0,
    tax_amount numeric(10,2) DEFAULT 0,
    discount numeric(10,2) DEFAULT 0,
    transaction_fee numeric(10,2) DEFAULT 0,
    total numeric(10,2) DEFAULT 0,
    payment_status text DEFAULT 'completed'::text,
    order_status text DEFAULT 'completed'::text,
    notes text,
    payment_method text NOT NULL,
    tip numeric(10,2) DEFAULT 0,
    order_type text,
    discount_type text,
    exchange_return_id integer,
    order_source text,
    prepare_by timestamp with time zone,
    external_order_id text,
    integration_experience text,
    doordash_promo_details jsonb,
    doordash_total_merchant_funded_discount_cents integer,
    doordash_total_doordash_funded_discount_cents integer,
    dasher_status text,
    dasher_status_at timestamp with time zone,
    dasher_info jsonb,
    scheduled_time timestamp without time zone,
    CONSTRAINT orders_discount_check CHECK ((discount >= (0)::numeric)),
    CONSTRAINT orders_order_status_check CHECK ((order_status = ANY (ARRAY['placed'::text, 'being_made'::text, 'ready'::text, 'out_for_delivery'::text, 'delivered'::text, 'completed'::text, 'voided'::text, 'returned'::text]))),
    CONSTRAINT orders_order_type_check CHECK ((order_type = ANY (ARRAY['pickup'::text, 'delivery'::text]))),
    CONSTRAINT orders_payment_method_check CHECK ((payment_method = ANY (ARRAY['cash'::text, 'credit_card'::text, 'debit_card'::text, 'mobile_payment'::text, 'check'::text, 'store_credit'::text]))),
    CONSTRAINT orders_payment_status_check CHECK ((payment_status = ANY (ARRAY['pending'::text, 'completed'::text, 'refunded'::text, 'partially_refunded'::text]))),
    CONSTRAINT orders_subtotal_check CHECK ((subtotal >= (0)::numeric)),
    CONSTRAINT orders_tax_amount_check CHECK ((tax_amount >= (0)::numeric)),
    CONSTRAINT orders_tax_rate_check CHECK (((tax_rate >= (0)::numeric) AND (tax_rate <= (1)::numeric))),
    CONSTRAINT orders_tip_check CHECK ((tip >= (0)::numeric)),
    CONSTRAINT orders_total_check CHECK ((total >= (0)::numeric)),
    CONSTRAINT orders_transaction_fee_check CHECK ((transaction_fee >= (0)::numeric))
);


--
-- Name: COLUMN orders.doordash_promo_details; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.orders.doordash_promo_details IS 'DoorDash Integrated Promotions: applied_discounts_details, applied_item_discount_details, funding breakdown.';


--
-- Name: COLUMN orders.doordash_total_merchant_funded_discount_cents; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.orders.doordash_total_merchant_funded_discount_cents IS 'Total merchant-funded promo discount (cents) for reconciliation.';


--
-- Name: COLUMN orders.doordash_total_doordash_funded_discount_cents; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.orders.doordash_total_doordash_funded_discount_cents IS 'Total DoorDash-funded promo discount (cents).';


--
-- Name: orders_order_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.orders_order_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: orders_order_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.orders_order_id_seq OWNED BY public.orders.order_id;


--
-- Name: payment_methods; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.payment_methods (
    payment_method_id integer NOT NULL,
    establishment_id integer NOT NULL,
    method_name text NOT NULL,
    method_type text NOT NULL,
    is_active integer DEFAULT 1 NOT NULL,
    display_order integer DEFAULT 0 NOT NULL,
    icon text,
    color text,
    created_at timestamp without time zone DEFAULT now(),
    updated_at timestamp without time zone DEFAULT now(),
    CONSTRAINT payment_methods_is_active_check CHECK ((is_active = ANY (ARRAY[0, 1]))),
    CONSTRAINT payment_methods_method_type_check CHECK ((method_type = ANY (ARRAY['cash'::text, 'credit_card'::text, 'debit_card'::text, 'mobile_payment'::text, 'check'::text, 'store_credit'::text, 'other'::text])))
);


--
-- Name: payment_methods_payment_method_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.payment_methods_payment_method_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: payment_methods_payment_method_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.payment_methods_payment_method_id_seq OWNED BY public.payment_methods.payment_method_id;


--
-- Name: payment_number_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.payment_number_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: payment_transactions; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.payment_transactions (
    transaction_id integer NOT NULL,
    establishment_id integer NOT NULL,
    order_id integer NOT NULL,
    payment_method text,
    amount numeric(10,2) NOT NULL,
    transaction_fee numeric(10,2) DEFAULT 0,
    transaction_fee_rate numeric(5,4) DEFAULT 0,
    net_amount numeric(10,2) NOT NULL,
    transaction_date timestamp without time zone DEFAULT now(),
    card_last_four text,
    authorization_code text,
    processor_name text,
    status text DEFAULT 'approved'::text,
    tip numeric(10,2) DEFAULT 0,
    employee_id integer,
    CONSTRAINT payment_transactions_payment_method_check CHECK ((payment_method = ANY (ARRAY['cash'::text, 'credit_card'::text, 'debit_card'::text, 'mobile_payment'::text, 'check'::text, 'store_credit'::text, 'refund'::text]))),
    CONSTRAINT payment_transactions_status_check CHECK ((status = ANY (ARRAY['approved'::text, 'declined'::text, 'pending'::text, 'refunded'::text]))),
    CONSTRAINT payment_transactions_transaction_fee_check CHECK ((transaction_fee >= (0)::numeric)),
    CONSTRAINT payment_transactions_transaction_fee_rate_check CHECK (((transaction_fee_rate >= (0)::numeric) AND (transaction_fee_rate <= (1)::numeric)))
);


--
-- Name: payment_transactions_transaction_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.payment_transactions_transaction_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: payment_transactions_transaction_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.payment_transactions_transaction_id_seq OWNED BY public.payment_transactions.transaction_id;


--
-- Name: payments; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.payments (
    payment_id integer NOT NULL,
    establishment_id integer NOT NULL,
    transaction_id integer NOT NULL,
    payment_method_id integer,
    amount numeric(10,2) NOT NULL,
    card_last_four text,
    card_type text,
    authorization_code text,
    payment_status text DEFAULT 'approved'::text NOT NULL,
    processed_at timestamp without time zone DEFAULT now(),
    created_at timestamp without time zone DEFAULT now(),
    CONSTRAINT payments_amount_check CHECK ((amount >= (0)::numeric)),
    CONSTRAINT payments_payment_status_check CHECK ((payment_status = ANY (ARRAY['pending'::text, 'approved'::text, 'declined'::text, 'refunded'::text])))
);


--
-- Name: payments_payment_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.payments_payment_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: payments_payment_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.payments_payment_id_seq OWNED BY public.payments.payment_id;


--
-- Name: pending_return_items; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.pending_return_items (
    return_item_id integer NOT NULL,
    establishment_id integer NOT NULL,
    return_id integer NOT NULL,
    order_item_id integer,
    product_id integer NOT NULL,
    quantity integer NOT NULL,
    unit_price numeric(10,2) NOT NULL,
    discount numeric(10,2) DEFAULT 0,
    refund_amount numeric(10,2) NOT NULL,
    condition text,
    notes text,
    CONSTRAINT pending_return_items_condition_check CHECK ((condition = ANY (ARRAY['new'::text, 'opened'::text, 'damaged'::text, 'defective'::text]))),
    CONSTRAINT pending_return_items_discount_check CHECK ((discount >= (0)::numeric)),
    CONSTRAINT pending_return_items_quantity_check CHECK ((quantity > 0)),
    CONSTRAINT pending_return_items_refund_amount_check CHECK ((refund_amount >= (0)::numeric)),
    CONSTRAINT pending_return_items_unit_price_check CHECK ((unit_price >= (0)::numeric))
);


--
-- Name: pending_return_items_return_item_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.pending_return_items_return_item_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: pending_return_items_return_item_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.pending_return_items_return_item_id_seq OWNED BY public.pending_return_items.return_item_id;


--
-- Name: pending_returns; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.pending_returns (
    return_id integer NOT NULL,
    establishment_id integer NOT NULL,
    return_number text,
    order_id integer NOT NULL,
    employee_id integer NOT NULL,
    customer_id integer,
    return_date timestamp without time zone DEFAULT now(),
    total_refund_amount numeric(10,2) DEFAULT 0,
    reason text,
    status text DEFAULT 'pending'::text,
    approved_by integer,
    approved_date timestamp without time zone,
    notes text,
    return_subtotal numeric(10,2),
    return_discount numeric(10,2),
    return_tax numeric(10,2),
    return_processing_fee numeric(10,2),
    return_tip numeric(10,2),
    signature text,
    exchange_transaction_id integer,
    CONSTRAINT pending_returns_status_check CHECK ((status = ANY (ARRAY['pending'::text, 'approved'::text, 'rejected'::text, 'cancelled'::text]))),
    CONSTRAINT pending_returns_total_refund_amount_check CHECK ((total_refund_amount >= (0)::numeric))
);


--
-- Name: pending_returns_return_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.pending_returns_return_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: pending_returns_return_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.pending_returns_return_id_seq OWNED BY public.pending_returns.return_id;


--
-- Name: pending_shipment_items; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.pending_shipment_items (
    pending_item_id integer NOT NULL,
    establishment_id integer NOT NULL,
    pending_shipment_id integer NOT NULL,
    product_sku text,
    product_name text,
    quantity_expected integer NOT NULL,
    quantity_verified integer,
    unit_cost numeric(10,2) NOT NULL,
    lot_number text,
    expiration_date text,
    discrepancy_notes text,
    product_id integer,
    barcode text,
    line_number integer,
    status text DEFAULT 'pending'::text,
    verified_by integer,
    verified_at timestamp without time zone,
    unit_price numeric(10,2),
    CONSTRAINT pending_shipment_items_quantity_expected_check CHECK ((quantity_expected > 0)),
    CONSTRAINT pending_shipment_items_unit_cost_check CHECK ((unit_cost >= (0)::numeric))
);


--
-- Name: COLUMN pending_shipment_items.unit_price; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.pending_shipment_items.unit_price IS 'Optional sale/retail price; used as product_price when creating inventory.';


--
-- Name: pending_shipment_items_pending_item_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.pending_shipment_items_pending_item_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: pending_shipment_items_pending_item_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.pending_shipment_items_pending_item_id_seq OWNED BY public.pending_shipment_items.pending_item_id;


--
-- Name: pending_shipments; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.pending_shipments (
    pending_shipment_id integer NOT NULL,
    establishment_id integer NOT NULL,
    vendor_id integer NOT NULL,
    expected_date text,
    upload_timestamp timestamp without time zone DEFAULT now(),
    file_path text,
    purchase_order_number text,
    tracking_number text,
    status text DEFAULT 'pending_review'::text,
    uploaded_by integer,
    approved_by integer,
    approved_date timestamp without time zone,
    reviewed_by text,
    reviewed_date timestamp without time zone,
    notes text,
    started_by integer,
    verification_mode text DEFAULT 'verify_whole_shipment'::text,
    started_at timestamp without time zone,
    completed_by integer,
    completed_at timestamp without time zone,
    workflow_step text,
    added_to_inventory integer DEFAULT 0,
    CONSTRAINT pending_shipments_added_to_inventory_check CHECK ((added_to_inventory = ANY (ARRAY[0, 1]))),
    CONSTRAINT pending_shipments_status_check CHECK ((status = ANY (ARRAY['pending_review'::text, 'in_progress'::text, 'approved'::text, 'rejected'::text, 'completed_with_issues'::text, 'draft'::text])))
);


--
-- Name: pending_shipments_pending_shipment_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.pending_shipments_pending_shipment_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: pending_shipments_pending_shipment_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.pending_shipments_pending_shipment_id_seq OWNED BY public.pending_shipments.pending_shipment_id;


--
-- Name: permissions; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.permissions (
    permission_id integer NOT NULL,
    permission_name text NOT NULL,
    permission_category text,
    description text,
    created_at timestamp without time zone DEFAULT now()
);


--
-- Name: permissions_permission_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.permissions_permission_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: permissions_permission_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.permissions_permission_id_seq OWNED BY public.permissions.permission_id;


--
-- Name: pos_integrations; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.pos_integrations (
    id integer NOT NULL,
    establishment_id integer NOT NULL,
    provider text NOT NULL,
    enabled boolean DEFAULT false NOT NULL,
    config jsonb DEFAULT '{}'::jsonb NOT NULL,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now()
);


--
-- Name: pos_integrations_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.pos_integrations_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: pos_integrations_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.pos_integrations_id_seq OWNED BY public.pos_integrations.id;


--
-- Name: pos_settings; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.pos_settings (
    id integer NOT NULL,
    num_registers integer DEFAULT 1,
    register_type text DEFAULT 'one_screen'::text,
    created_at timestamp without time zone DEFAULT now(),
    updated_at timestamp without time zone DEFAULT now(),
    return_transaction_fee_take_loss boolean DEFAULT false,
    return_tip_refund boolean DEFAULT false,
    require_signature_for_return boolean DEFAULT false,
    discount_presets text
);


--
-- Name: COLUMN pos_settings.return_transaction_fee_take_loss; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.pos_settings.return_transaction_fee_take_loss IS 'When true, store takes the loss: do not deduct transaction fee from return refund.';


--
-- Name: COLUMN pos_settings.return_tip_refund; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.pos_settings.return_tip_refund IS 'When true, refund tip to customer on returns (do not deduct proportional tip from refund).';


--
-- Name: pos_settings_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.pos_settings_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: pos_settings_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.pos_settings_id_seq OWNED BY public.pos_settings.id;


--
-- Name: product_ingredients; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.product_ingredients (
    id integer NOT NULL,
    product_id integer NOT NULL,
    variant_id integer,
    ingredient_id integer NOT NULL,
    quantity_required numeric(12,4) NOT NULL,
    unit text NOT NULL,
    created_at timestamp without time zone DEFAULT now(),
    CONSTRAINT product_ingredients_quantity_required_check CHECK ((quantity_required > (0)::numeric))
);


--
-- Name: product_ingredients_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.product_ingredients_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: product_ingredients_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.product_ingredients_id_seq OWNED BY public.product_ingredients.id;


--
-- Name: product_metadata; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.product_metadata (
    metadata_id integer NOT NULL,
    product_id integer NOT NULL,
    brand text,
    color text,
    size text,
    tags text,
    keywords text,
    attributes text,
    search_vector text,
    category_id integer,
    category_confidence real DEFAULT 0,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT product_metadata_category_confidence_check CHECK (((category_confidence >= (0)::double precision) AND (category_confidence <= (1)::double precision)))
);


--
-- Name: product_metadata_metadata_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.product_metadata_metadata_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: product_metadata_metadata_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.product_metadata_metadata_id_seq OWNED BY public.product_metadata.metadata_id;


--
-- Name: product_variants; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.product_variants (
    variant_id integer NOT NULL,
    product_id integer NOT NULL,
    variant_name text NOT NULL,
    price numeric(10,2) NOT NULL,
    cost numeric(10,2) DEFAULT 0 NOT NULL,
    sort_order integer DEFAULT 0 NOT NULL,
    created_at timestamp without time zone DEFAULT now(),
    photo text,
    doordash_default_quantity integer,
    doordash_charge_above integer,
    doordash_recipe_default boolean DEFAULT false,
    doordash_calorific_display_type text,
    doordash_calorific_lower_range integer,
    doordash_calorific_higher_range integer,
    doordash_classification_tags jsonb,
    CONSTRAINT product_variants_cost_check CHECK ((cost >= (0)::numeric)),
    CONSTRAINT product_variants_price_check CHECK ((price >= (0)::numeric))
);


--
-- Name: COLUMN product_variants.photo; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.product_variants.photo IS 'Optional image path or URL for DoorDash modifier (option) images. Same rules as item images: .jpg/.jpeg/.png, public URL.';


--
-- Name: COLUMN product_variants.doordash_default_quantity; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.product_variants.doordash_default_quantity IS 'Recipe default quantity for this option (included in item price).';


--
-- Name: COLUMN product_variants.doordash_charge_above; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.product_variants.doordash_charge_above IS 'Charge above this quantity (each extra charged at option price).';


--
-- Name: COLUMN product_variants.doordash_recipe_default; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.product_variants.doordash_recipe_default IS 'True if this option is the default recipe option for the modifier group.';


--
-- Name: COLUMN product_variants.doordash_calorific_display_type; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.product_variants.doordash_calorific_display_type IS 'DoorDash: display_type for option calorific_info.';


--
-- Name: COLUMN product_variants.doordash_calorific_lower_range; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.product_variants.doordash_calorific_lower_range IS 'DoorDash: lower_range for option calorific_info.';


--
-- Name: COLUMN product_variants.doordash_calorific_higher_range; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.product_variants.doordash_calorific_higher_range IS 'DoorDash: higher_range for option calorific_info.';


--
-- Name: COLUMN product_variants.doordash_classification_tags; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.product_variants.doordash_classification_tags IS 'DoorDash: classification_tags for option (dietary tags).';


--
-- Name: product_variants_variant_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.product_variants_variant_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: product_variants_variant_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.product_variants_variant_id_seq OWNED BY public.product_variants.variant_id;


--
-- Name: receipt_preferences; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.receipt_preferences (
    preference_id integer NOT NULL,
    transaction_id integer NOT NULL,
    receipt_type text NOT NULL,
    email_address text,
    phone_number text,
    created_at timestamp without time zone DEFAULT now(),
    CONSTRAINT receipt_preferences_receipt_type_check CHECK ((receipt_type = ANY (ARRAY['email'::text, 'sms'::text, 'print'::text, 'none'::text])))
);


--
-- Name: receipt_preferences_preference_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.receipt_preferences_preference_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: receipt_preferences_preference_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.receipt_preferences_preference_id_seq OWNED BY public.receipt_preferences.preference_id;


--
-- Name: receipt_settings; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.receipt_settings (
    id integer NOT NULL,
    receipt_type text DEFAULT 'traditional'::text,
    store_name text DEFAULT 'Store'::text,
    store_address text DEFAULT ''::text,
    store_city text DEFAULT ''::text,
    store_state text DEFAULT ''::text,
    store_zip text DEFAULT ''::text,
    store_phone text DEFAULT ''::text,
    store_email text DEFAULT ''::text,
    store_website text DEFAULT ''::text,
    footer_message text DEFAULT 'Thank you for your business!'::text,
    return_policy text DEFAULT ''::text,
    show_tax_breakdown integer DEFAULT 1,
    show_payment_method integer DEFAULT 1,
    show_signature integer DEFAULT 0,
    created_at timestamp without time zone DEFAULT now(),
    updated_at timestamp without time zone DEFAULT now(),
    template_preset text DEFAULT 'custom'::text,
    template_styles jsonb DEFAULT '{}'::jsonb,
    CONSTRAINT receipt_settings_receipt_type_check CHECK ((receipt_type = ANY (ARRAY['traditional'::text, 'custom'::text]))),
    CONSTRAINT receipt_settings_show_payment_method_check CHECK ((show_payment_method = ANY (ARRAY[0, 1]))),
    CONSTRAINT receipt_settings_show_signature_check CHECK ((show_signature = ANY (ARRAY[0, 1]))),
    CONSTRAINT receipt_settings_show_tax_breakdown_check CHECK ((show_tax_breakdown = ANY (ARRAY[0, 1])))
);


--
-- Name: COLUMN receipt_settings.template_preset; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.receipt_settings.template_preset IS 'Selected preset: traditional, thermal, minimal, custom, or template_{id} for saved templates';


--
-- Name: COLUMN receipt_settings.template_styles; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.receipt_settings.template_styles IS 'Full receipt template: fonts, sizes, alignment per section. Matches Settings receipt editor. Variables inserted at print.';


--
-- Name: receipt_settings_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.receipt_settings_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: receipt_settings_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.receipt_settings_id_seq OWNED BY public.receipt_settings.id;


--
-- Name: receipt_templates; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.receipt_templates (
    id integer NOT NULL,
    name text NOT NULL,
    settings jsonb DEFAULT '{}'::jsonb NOT NULL,
    created_at timestamp without time zone DEFAULT now()
);


--
-- Name: receipt_templates_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.receipt_templates_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: receipt_templates_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.receipt_templates_id_seq OWNED BY public.receipt_templates.id;


--
-- Name: register_cash_settings; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.register_cash_settings (
    setting_id integer NOT NULL,
    establishment_id integer NOT NULL,
    register_id integer DEFAULT 1 NOT NULL,
    cash_mode text DEFAULT 'total'::text NOT NULL,
    total_amount numeric(10,2),
    denominations text,
    is_active integer DEFAULT 1,
    created_at timestamp without time zone DEFAULT now(),
    updated_at timestamp without time zone DEFAULT now(),
    CONSTRAINT register_cash_settings_cash_mode_check CHECK ((cash_mode = ANY (ARRAY['total'::text, 'denominations'::text]))),
    CONSTRAINT register_cash_settings_is_active_check CHECK ((is_active = ANY (ARRAY[0, 1])))
);


--
-- Name: register_cash_settings_setting_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.register_cash_settings_setting_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: register_cash_settings_setting_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.register_cash_settings_setting_id_seq OWNED BY public.register_cash_settings.setting_id;


--
-- Name: register_notification_settings; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.register_notification_settings (
    id integer NOT NULL,
    store_id integer DEFAULT 1 NOT NULL,
    notify_admin_on_open boolean DEFAULT false NOT NULL,
    notify_admin_on_close boolean DEFAULT false NOT NULL,
    notify_admin_on_drop boolean DEFAULT false NOT NULL,
    notify_admin_on_withdraw boolean DEFAULT false NOT NULL,
    admin_email_ids integer[] DEFAULT '{}'::integer[],
    notify_employee_self boolean DEFAULT false NOT NULL,
    updated_at timestamp with time zone DEFAULT now()
);


--
-- Name: register_notification_settings_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.register_notification_settings_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: register_notification_settings_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.register_notification_settings_id_seq OWNED BY public.register_notification_settings.id;


--
-- Name: retained_earnings; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.retained_earnings (
    retained_earnings_id integer NOT NULL,
    establishment_id integer NOT NULL,
    fiscal_period_id integer NOT NULL,
    beginning_balance numeric(10,2) NOT NULL,
    net_income numeric(10,2) NOT NULL,
    dividends numeric(10,2) DEFAULT 0,
    ending_balance numeric(10,2) NOT NULL,
    calculation_date timestamp without time zone DEFAULT now()
);


--
-- Name: retained_earnings_retained_earnings_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.retained_earnings_retained_earnings_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: retained_earnings_retained_earnings_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.retained_earnings_retained_earnings_id_seq OWNED BY public.retained_earnings.retained_earnings_id;


--
-- Name: role_permissions; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.role_permissions (
    role_permission_id integer NOT NULL,
    role_id integer NOT NULL,
    permission_id integer NOT NULL,
    granted integer DEFAULT 1,
    CONSTRAINT role_permissions_granted_check CHECK ((granted = ANY (ARRAY[0, 1])))
);


--
-- Name: role_permissions_role_permission_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.role_permissions_role_permission_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: role_permissions_role_permission_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.role_permissions_role_permission_id_seq OWNED BY public.role_permissions.role_permission_id;


--
-- Name: roles; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.roles (
    role_id integer NOT NULL,
    establishment_id integer NOT NULL,
    role_name text NOT NULL,
    description text,
    is_system_role integer DEFAULT 0,
    created_at timestamp without time zone DEFAULT now(),
    CONSTRAINT roles_is_system_role_check CHECK ((is_system_role = ANY (ARRAY[0, 1])))
);


--
-- Name: roles_role_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.roles_role_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: roles_role_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.roles_role_id_seq OWNED BY public.roles.role_id;


--
-- Name: schedule_changes; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.schedule_changes (
    change_id integer NOT NULL,
    period_id integer,
    scheduled_shift_id integer,
    change_type text NOT NULL,
    changed_by integer,
    changed_at timestamp without time zone DEFAULT now(),
    old_values text,
    new_values text,
    reason text,
    CONSTRAINT schedule_changes_change_type_check CHECK ((change_type = ANY (ARRAY['created'::text, 'modified'::text, 'deleted'::text, 'published'::text])))
);


--
-- Name: schedule_changes_change_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.schedule_changes_change_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: schedule_changes_change_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.schedule_changes_change_id_seq OWNED BY public.schedule_changes.change_id;


--
-- Name: schedule_notification_settings; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.schedule_notification_settings (
    store_id integer NOT NULL,
    employee_schedule_view character varying(20) DEFAULT 'shifts_only'::character varying,
    notify_on_edit boolean DEFAULT true,
    admin_email_ids jsonb DEFAULT '[]'::jsonb
);


--
-- Name: schedule_notifications; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.schedule_notifications (
    notification_id integer NOT NULL,
    period_id integer NOT NULL,
    employee_id integer NOT NULL,
    notification_type text,
    sent_via text,
    sent_at timestamp without time zone DEFAULT now(),
    viewed integer DEFAULT 0,
    viewed_at timestamp without time zone,
    CONSTRAINT schedule_notifications_notification_type_check CHECK ((notification_type = ANY (ARRAY['new_schedule'::text, 'schedule_change'::text, 'shift_reminder'::text]))),
    CONSTRAINT schedule_notifications_sent_via_check CHECK ((sent_via = ANY (ARRAY['email'::text, 'sms'::text, 'push'::text, 'all'::text]))),
    CONSTRAINT schedule_notifications_viewed_check CHECK ((viewed = ANY (ARRAY[0, 1])))
);


--
-- Name: schedule_notifications_notification_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.schedule_notifications_notification_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: schedule_notifications_notification_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.schedule_notifications_notification_id_seq OWNED BY public.schedule_notifications.notification_id;


--
-- Name: schedule_periods; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.schedule_periods (
    period_id integer NOT NULL,
    week_start_date date NOT NULL,
    week_end_date date NOT NULL,
    status text DEFAULT 'draft'::text,
    created_by integer,
    created_at timestamp without time zone DEFAULT now(),
    published_by integer,
    published_at timestamp without time zone,
    template_id integer,
    generation_method text DEFAULT 'manual'::text,
    generation_settings text,
    total_labor_hours numeric(10,2),
    estimated_labor_cost numeric(10,2),
    CONSTRAINT schedule_periods_generation_method_check CHECK ((generation_method = ANY (ARRAY['manual'::text, 'auto'::text, 'template'::text]))),
    CONSTRAINT schedule_periods_status_check CHECK ((status = ANY (ARRAY['draft'::text, 'published'::text, 'archived'::text])))
);


--
-- Name: schedule_periods_period_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.schedule_periods_period_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: schedule_periods_period_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.schedule_periods_period_id_seq OWNED BY public.schedule_periods.period_id;


--
-- Name: scheduled_order_alerts; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.scheduled_order_alerts (
    alert_id integer NOT NULL,
    order_id integer NOT NULL,
    alert_type text NOT NULL,
    title text NOT NULL,
    body text,
    created_at timestamp without time zone DEFAULT now(),
    viewed integer DEFAULT 0,
    viewed_at timestamp without time zone
);


--
-- Name: scheduled_order_alerts_alert_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.scheduled_order_alerts_alert_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: scheduled_order_alerts_alert_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.scheduled_order_alerts_alert_id_seq OWNED BY public.scheduled_order_alerts.alert_id;


--
-- Name: scheduled_shifts; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.scheduled_shifts (
    scheduled_shift_id integer NOT NULL,
    period_id integer NOT NULL,
    employee_id integer NOT NULL,
    shift_date date NOT NULL,
    start_time time without time zone NOT NULL,
    end_time time without time zone NOT NULL,
    break_duration integer DEFAULT 30,
    "position" text,
    notes text,
    is_draft integer DEFAULT 1,
    conflicts text,
    CONSTRAINT scheduled_shifts_is_draft_check CHECK ((is_draft = ANY (ARRAY[0, 1])))
);


--
-- Name: scheduled_shifts_scheduled_shift_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.scheduled_shifts_scheduled_shift_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: scheduled_shifts_scheduled_shift_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.scheduled_shifts_scheduled_shift_id_seq OWNED BY public.scheduled_shifts.scheduled_shift_id;


--
-- Name: search_history; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.search_history (
    search_id integer NOT NULL,
    search_query text NOT NULL,
    results_count integer DEFAULT 0,
    filters text,
    user_id integer,
    search_timestamp timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);


--
-- Name: search_history_search_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.search_history_search_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: search_history_search_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.search_history_search_id_seq OWNED BY public.search_history.search_id;


--
-- Name: shipment_discrepancies; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.shipment_discrepancies (
    discrepancy_id integer NOT NULL,
    establishment_id integer NOT NULL,
    shipment_id integer,
    pending_shipment_id integer,
    product_id integer NOT NULL,
    discrepancy_type text NOT NULL,
    expected_quantity integer,
    actual_quantity integer,
    discrepancy_quantity integer,
    expected_product_sku text,
    actual_product_sku text,
    financial_impact numeric(10,2),
    reported_by integer NOT NULL,
    reported_date timestamp without time zone DEFAULT now(),
    resolution_status text DEFAULT 'reported'::text,
    resolved_by integer,
    resolved_date timestamp without time zone,
    resolution_notes text,
    vendor_notified integer DEFAULT 0,
    vendor_response text,
    claim_number text,
    photos text,
    CONSTRAINT shipment_discrepancies_discrepancy_type_check CHECK ((discrepancy_type = ANY (ARRAY['missing'::text, 'extra'::text, 'damaged'::text, 'wrong_product'::text, 'quantity_short'::text, 'quantity_over'::text, 'expired'::text, 'wrong_lot'::text]))),
    CONSTRAINT shipment_discrepancies_resolution_status_check CHECK ((resolution_status = ANY (ARRAY['reported'::text, 'investigating'::text, 'resolved'::text, 'written_off'::text, 'credit_issued'::text]))),
    CONSTRAINT shipment_discrepancies_vendor_notified_check CHECK ((vendor_notified = ANY (ARRAY[0, 1])))
);


--
-- Name: shipment_discrepancies_discrepancy_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.shipment_discrepancies_discrepancy_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: shipment_discrepancies_discrepancy_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.shipment_discrepancies_discrepancy_id_seq OWNED BY public.shipment_discrepancies.discrepancy_id;


--
-- Name: shipment_issues; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.shipment_issues (
    issue_id integer NOT NULL,
    pending_shipment_id integer NOT NULL,
    pending_item_id integer,
    issue_type text NOT NULL,
    severity text DEFAULT 'minor'::text,
    quantity_affected integer DEFAULT 1,
    reported_by integer NOT NULL,
    reported_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    description text,
    photo_path text,
    resolution_status text DEFAULT 'open'::text,
    resolved_by integer,
    resolved_at timestamp without time zone,
    resolution_notes text,
    accounting_posted boolean DEFAULT false,
    CONSTRAINT shipment_issues_issue_type_check CHECK ((issue_type = ANY (ARRAY['missing'::text, 'damaged'::text, 'wrong_item'::text, 'quantity_mismatch'::text, 'expired'::text, 'quality'::text, 'other'::text]))),
    CONSTRAINT shipment_issues_resolution_status_check CHECK ((resolution_status = ANY (ARRAY['open'::text, 'resolved'::text, 'vendor_contacted'::text, 'credit_issued'::text]))),
    CONSTRAINT shipment_issues_severity_check CHECK ((severity = ANY (ARRAY['minor'::text, 'major'::text, 'critical'::text])))
);


--
-- Name: shipment_issues_issue_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.shipment_issues_issue_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: shipment_issues_issue_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.shipment_issues_issue_id_seq OWNED BY public.shipment_issues.issue_id;


--
-- Name: shipment_items; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.shipment_items (
    shipment_item_id integer NOT NULL,
    establishment_id integer NOT NULL,
    shipment_id integer NOT NULL,
    product_id integer NOT NULL,
    quantity_received integer NOT NULL,
    unit_cost numeric(10,2) NOT NULL,
    lot_number text,
    expiration_date text,
    received_timestamp timestamp without time zone DEFAULT now(),
    CONSTRAINT shipment_items_quantity_received_check CHECK ((quantity_received > 0)),
    CONSTRAINT shipment_items_unit_cost_check CHECK ((unit_cost >= (0)::numeric))
);


--
-- Name: shipment_items_shipment_item_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.shipment_items_shipment_item_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: shipment_items_shipment_item_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.shipment_items_shipment_item_id_seq OWNED BY public.shipment_items.shipment_item_id;


--
-- Name: shipment_scan_log; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.shipment_scan_log (
    scan_id integer NOT NULL,
    pending_shipment_id integer NOT NULL,
    pending_item_id integer,
    scanned_barcode text NOT NULL,
    scanned_by integer NOT NULL,
    scanned_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    scan_result text DEFAULT 'match'::text,
    device_id text,
    location text,
    CONSTRAINT shipment_scan_log_scan_result_check CHECK ((scan_result = ANY (ARRAY['match'::text, 'mismatch'::text, 'unknown'::text, 'duplicate'::text])))
);


--
-- Name: shipment_scan_log_scan_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.shipment_scan_log_scan_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: shipment_scan_log_scan_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.shipment_scan_log_scan_id_seq OWNED BY public.shipment_scan_log.scan_id;


--
-- Name: shipment_verification_settings; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.shipment_verification_settings (
    setting_key text NOT NULL,
    setting_value text NOT NULL,
    description text,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);


--
-- Name: shipments; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.shipments (
    shipment_id integer NOT NULL,
    establishment_id integer NOT NULL,
    vendor_id integer,
    purchase_order_number text,
    tracking_number text,
    total_cost numeric(10,2),
    received_by integer,
    verified_by integer,
    notes text,
    created_at timestamp without time zone DEFAULT now(),
    status text DEFAULT 'completed'::text,
    upload_timestamp timestamp without time zone,
    file_path text,
    uploaded_by integer,
    reviewed_by text,
    reviewed_date timestamp without time zone,
    approved_by integer,
    approved_date timestamp without time zone,
    shipment_date date,
    received_date date,
    CONSTRAINT shipments_status_check CHECK ((status = ANY (ARRAY['pending_review'::text, 'approved'::text, 'rejected'::text, 'received'::text, 'completed'::text])))
);


--
-- Name: shipments_shipment_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.shipments_shipment_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: shipments_shipment_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.shipments_shipment_id_seq OWNED BY public.shipments.shipment_id;


--
-- Name: sms_messages; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.sms_messages (
    message_id integer NOT NULL,
    store_id integer NOT NULL,
    customer_id integer,
    phone_number text NOT NULL,
    message_text text NOT NULL,
    direction text DEFAULT 'outbound'::text NOT NULL,
    status text DEFAULT 'pending'::text NOT NULL,
    message_type text DEFAULT 'manual'::text,
    provider text,
    provider_sid text,
    sent_at timestamp without time zone,
    error_message text,
    created_by integer,
    created_at timestamp without time zone DEFAULT now(),
    CONSTRAINT sms_messages_direction_check CHECK ((direction = ANY (ARRAY['inbound'::text, 'outbound'::text]))),
    CONSTRAINT sms_messages_status_check CHECK ((status = ANY (ARRAY['pending'::text, 'sent'::text, 'failed'::text, 'delivered'::text])))
);


--
-- Name: sms_messages_message_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.sms_messages_message_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: sms_messages_message_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.sms_messages_message_id_seq OWNED BY public.sms_messages.message_id;


--
-- Name: sms_opt_outs; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.sms_opt_outs (
    opt_out_id integer NOT NULL,
    phone_number text NOT NULL,
    store_id integer,
    created_at timestamp without time zone DEFAULT now()
);


--
-- Name: sms_opt_outs_opt_out_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.sms_opt_outs_opt_out_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: sms_opt_outs_opt_out_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.sms_opt_outs_opt_out_id_seq OWNED BY public.sms_opt_outs.opt_out_id;


--
-- Name: sms_settings; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.sms_settings (
    setting_id integer NOT NULL,
    store_id integer NOT NULL,
    sms_provider text DEFAULT 'email'::text NOT NULL,
    smtp_server text DEFAULT 'smtp.gmail.com'::text,
    smtp_port integer DEFAULT 587,
    smtp_user text,
    smtp_password text,
    smtp_use_tls integer DEFAULT 1,
    business_name text,
    store_phone_number text,
    auto_send_rewards_earned integer DEFAULT 1,
    auto_send_rewards_redeemed integer DEFAULT 1,
    aws_access_key_id text,
    aws_secret_access_key text,
    aws_region text DEFAULT 'us-east-1'::text,
    is_active integer DEFAULT 1,
    created_at timestamp without time zone DEFAULT now(),
    updated_at timestamp without time zone DEFAULT now(),
    email_provider text DEFAULT 'gmail'::text,
    email_from_address text,
    notification_preferences jsonb DEFAULT '{}'::jsonb,
    use_platform_aws integer DEFAULT 0,
    CONSTRAINT sms_settings_auto_send_rewards_earned_check CHECK ((auto_send_rewards_earned = ANY (ARRAY[0, 1]))),
    CONSTRAINT sms_settings_auto_send_rewards_redeemed_check CHECK ((auto_send_rewards_redeemed = ANY (ARRAY[0, 1]))),
    CONSTRAINT sms_settings_email_provider_check CHECK ((email_provider = ANY (ARRAY['gmail'::text, 'aws_ses'::text]))),
    CONSTRAINT sms_settings_is_active_check CHECK ((is_active = ANY (ARRAY[0, 1]))),
    CONSTRAINT sms_settings_sms_provider_check CHECK ((sms_provider = ANY (ARRAY['email'::text, 'aws_sns'::text, 'twilio'::text]))),
    CONSTRAINT sms_settings_smtp_use_tls_check CHECK ((smtp_use_tls = ANY (ARRAY[0, 1])))
);


--
-- Name: COLUMN sms_settings.email_provider; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.sms_settings.email_provider IS 'gmail = SMTP (testing), aws_ses = AWS SES (production)';


--
-- Name: COLUMN sms_settings.notification_preferences; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.sms_settings.notification_preferences IS 'JSON: per-category email/sms toggles';


--
-- Name: sms_settings_setting_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.sms_settings_setting_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: sms_settings_setting_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.sms_settings_setting_id_seq OWNED BY public.sms_settings.setting_id;


--
-- Name: sms_templates; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.sms_templates (
    template_id integer NOT NULL,
    store_id integer NOT NULL,
    template_name text NOT NULL,
    template_text text NOT NULL,
    category text DEFAULT 'rewards'::text,
    variables text,
    is_active integer DEFAULT 1,
    created_by integer,
    created_at timestamp without time zone DEFAULT now(),
    CONSTRAINT sms_templates_is_active_check CHECK ((is_active = ANY (ARRAY[0, 1])))
);


--
-- Name: sms_templates_template_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.sms_templates_template_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: sms_templates_template_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.sms_templates_template_id_seq OWNED BY public.sms_templates.template_id;


--
-- Name: store_location_settings; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.store_location_settings (
    id integer NOT NULL,
    store_name text DEFAULT 'Store'::text,
    latitude numeric(10,7),
    longitude numeric(10,7),
    address text,
    allowed_radius_meters numeric(10,2) DEFAULT 100.0,
    require_location integer DEFAULT 1,
    created_at timestamp without time zone DEFAULT now(),
    updated_at timestamp without time zone DEFAULT now(),
    city text,
    state text,
    zip text,
    country text,
    store_phone text,
    store_email text,
    store_website text,
    store_type text,
    store_logo text,
    store_hours jsonb,
    CONSTRAINT store_location_settings_require_location_check CHECK ((require_location = ANY (ARRAY[0, 1])))
);


--
-- Name: store_location_settings_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.store_location_settings_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: store_location_settings_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.store_location_settings_id_seq OWNED BY public.store_location_settings.id;


--
-- Name: stores; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.stores (
    store_id integer NOT NULL,
    store_name text DEFAULT 'Store'::text NOT NULL,
    is_active integer DEFAULT 1,
    created_at timestamp without time zone DEFAULT now(),
    CONSTRAINT stores_is_active_check CHECK ((is_active = ANY (ARRAY[0, 1])))
);


--
-- Name: stores_store_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.stores_store_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: stores_store_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.stores_store_id_seq OWNED BY public.stores.store_id;


--
-- Name: tax_rates; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.tax_rates (
    id integer NOT NULL,
    tax_name character varying(100) NOT NULL,
    tax_rate numeric(5,4) NOT NULL,
    tax_type character varying(50) DEFAULT 'sales_tax'::character varying,
    description text,
    tax_agency_id integer,
    is_active boolean DEFAULT true,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT tax_rates_tax_rate_check CHECK ((tax_rate >= (0)::numeric)),
    CONSTRAINT tax_rates_tax_type_check CHECK (((tax_type)::text = ANY ((ARRAY['sales_tax'::character varying, 'vat'::character varying, 'gst'::character varying, 'other'::character varying])::text[])))
);


--
-- Name: tax_rates_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.tax_rates_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: tax_rates_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.tax_rates_id_seq OWNED BY public.tax_rates.id;


--
-- Name: time_clock; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.time_clock (
    time_entry_id integer NOT NULL,
    establishment_id integer NOT NULL,
    employee_id integer NOT NULL,
    clock_in timestamp without time zone NOT NULL,
    clock_out timestamp without time zone,
    break_start timestamp without time zone,
    break_end timestamp without time zone,
    total_hours numeric(5,2),
    notes text,
    status text DEFAULT 'clocked_in'::text,
    is_unscheduled boolean DEFAULT false,
    CONSTRAINT time_clock_status_check CHECK ((status = ANY (ARRAY['clocked_in'::text, 'on_break'::text, 'clocked_out'::text])))
);


--
-- Name: time_clock_time_entry_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.time_clock_time_entry_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: time_clock_time_entry_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.time_clock_time_entry_id_seq OWNED BY public.time_clock.time_entry_id;


--
-- Name: transaction_items; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.transaction_items (
    transaction_item_id integer NOT NULL,
    establishment_id integer NOT NULL,
    transaction_id integer NOT NULL,
    product_id integer NOT NULL,
    quantity integer NOT NULL,
    unit_price numeric(10,2) NOT NULL,
    subtotal numeric(10,2) NOT NULL,
    created_at timestamp without time zone DEFAULT now(),
    CONSTRAINT transaction_items_quantity_check CHECK ((quantity > 0)),
    CONSTRAINT transaction_items_subtotal_check CHECK ((subtotal >= (0)::numeric)),
    CONSTRAINT transaction_items_unit_price_check CHECK ((unit_price >= (0)::numeric))
);


--
-- Name: transaction_items_transaction_item_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.transaction_items_transaction_item_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: transaction_items_transaction_item_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.transaction_items_transaction_item_id_seq OWNED BY public.transaction_items.transaction_item_id;


--
-- Name: transaction_number_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.transaction_number_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: transactions; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.transactions (
    transaction_id integer NOT NULL,
    establishment_id integer NOT NULL,
    employee_id integer NOT NULL,
    subtotal numeric(10,2) DEFAULT 0 NOT NULL,
    tax numeric(10,2) DEFAULT 0 NOT NULL,
    total numeric(10,2) DEFAULT 0 NOT NULL,
    tip numeric(10,2) DEFAULT 0,
    status text DEFAULT 'pending'::text NOT NULL,
    created_at timestamp without time zone DEFAULT now(),
    updated_at timestamp without time zone DEFAULT now(),
    payment_status text,
    amount_paid numeric(10,2),
    change_amount numeric(10,2) DEFAULT 0,
    completed_at timestamp without time zone,
    signature text,
    customer_id integer,
    order_id integer,
    CONSTRAINT transactions_payment_status_check CHECK ((payment_status = ANY (ARRAY['pending'::text, 'paid'::text, 'partial'::text, 'refunded'::text]))),
    CONSTRAINT transactions_status_check CHECK ((status = ANY (ARRAY['pending'::text, 'completed'::text, 'cancelled'::text])))
);


--
-- Name: transactions_transaction_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.transactions_transaction_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: transactions_transaction_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.transactions_transaction_id_seq OWNED BY public.transactions.transaction_id;


--
-- Name: users; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.users (
    id integer NOT NULL,
    username character varying(100) NOT NULL,
    email character varying(255) NOT NULL,
    password_hash character varying(255) NOT NULL,
    first_name character varying(100),
    last_name character varying(100),
    role character varying(50) NOT NULL,
    is_active boolean DEFAULT true,
    last_login timestamp without time zone,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT users_role_check CHECK (((role)::text = ANY ((ARRAY['admin'::character varying, 'manager'::character varying, 'accountant'::character varying, 'employee'::character varying, 'viewer'::character varying])::text[])))
);


--
-- Name: users_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.users_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: users_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.users_id_seq OWNED BY public.users.id;


--
-- Name: vendors; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.vendors (
    vendor_id integer NOT NULL,
    establishment_id integer NOT NULL,
    vendor_name text NOT NULL,
    contact_person text,
    email text,
    phone text,
    address text,
    created_at timestamp without time zone DEFAULT now(),
    updated_at timestamp without time zone DEFAULT now(),
    archived boolean DEFAULT false
);


--
-- Name: vendors_vendor_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.vendors_vendor_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: vendors_vendor_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.vendors_vendor_id_seq OWNED BY public.vendors.vendor_id;


--
-- Name: verification_sessions; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.verification_sessions (
    session_id integer NOT NULL,
    pending_shipment_id integer NOT NULL,
    employee_id integer NOT NULL,
    started_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    ended_at timestamp without time zone,
    total_scans integer DEFAULT 0,
    items_verified integer DEFAULT 0,
    issues_reported integer DEFAULT 0,
    device_id text
);


--
-- Name: verification_sessions_session_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.verification_sessions_session_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: verification_sessions_session_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.verification_sessions_session_id_seq OWNED BY public.verification_sessions.session_id;


--
-- Name: accounting_settings id; Type: DEFAULT; Schema: accounting; Owner: -
--

ALTER TABLE ONLY accounting.accounting_settings ALTER COLUMN id SET DEFAULT nextval('accounting.accounting_settings_id_seq'::regclass);


--
-- Name: accounts id; Type: DEFAULT; Schema: accounting; Owner: -
--

ALTER TABLE ONLY accounting.accounts ALTER COLUMN id SET DEFAULT nextval('accounting.accounts_id_seq'::regclass);


--
-- Name: posting_rules id; Type: DEFAULT; Schema: accounting; Owner: -
--

ALTER TABLE ONLY accounting.posting_rules ALTER COLUMN id SET DEFAULT nextval('accounting.posting_rules_id_seq'::regclass);


--
-- Name: transaction_lines id; Type: DEFAULT; Schema: accounting; Owner: -
--

ALTER TABLE ONLY accounting.transaction_lines ALTER COLUMN id SET DEFAULT nextval('accounting.transaction_lines_id_seq'::regclass);


--
-- Name: transactions id; Type: DEFAULT; Schema: accounting; Owner: -
--

ALTER TABLE ONLY accounting.transactions ALTER COLUMN id SET DEFAULT nextval('accounting.transactions_id_seq'::regclass);


--
-- Name: accounting_customers id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.accounting_customers ALTER COLUMN id SET DEFAULT nextval('public.accounting_customers_id_seq'::regclass);


--
-- Name: accounting_vendors id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.accounting_vendors ALTER COLUMN id SET DEFAULT nextval('public.accounting_vendors_id_seq'::regclass);


--
-- Name: accounts id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.accounts ALTER COLUMN id SET DEFAULT nextval('public.accounts_id_seq'::regclass);


--
-- Name: approved_shipment_items approved_item_id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.approved_shipment_items ALTER COLUMN approved_item_id SET DEFAULT nextval('public.approved_shipment_items_approved_item_id_seq'::regclass);


--
-- Name: approved_shipments shipment_id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.approved_shipments ALTER COLUMN shipment_id SET DEFAULT nextval('public.approved_shipments_shipment_id_seq'::regclass);


--
-- Name: audit_log audit_id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.audit_log ALTER COLUMN audit_id SET DEFAULT nextval('public.audit_log_audit_id_seq'::regclass);


--
-- Name: calendar_subscriptions subscription_id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.calendar_subscriptions ALTER COLUMN subscription_id SET DEFAULT nextval('public.calendar_subscriptions_subscription_id_seq'::regclass);


--
-- Name: cash_register_sessions register_session_id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.cash_register_sessions ALTER COLUMN register_session_id SET DEFAULT nextval('public.cash_register_sessions_session_id_seq'::regclass);


--
-- Name: cash_transactions transaction_id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.cash_transactions ALTER COLUMN transaction_id SET DEFAULT nextval('public.cash_transactions_transaction_id_seq'::regclass);


--
-- Name: categories category_id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.categories ALTER COLUMN category_id SET DEFAULT nextval('public.categories_category_id_seq'::regclass);


--
-- Name: chart_of_accounts account_id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.chart_of_accounts ALTER COLUMN account_id SET DEFAULT nextval('public.chart_of_accounts_account_id_seq'::regclass);


--
-- Name: classes id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.classes ALTER COLUMN id SET DEFAULT nextval('public.classes_id_seq'::regclass);


--
-- Name: clockin_notification_settings id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.clockin_notification_settings ALTER COLUMN id SET DEFAULT nextval('public.clockin_notification_settings_id_seq'::regclass);


--
-- Name: customer_display_sessions session_id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.customer_display_sessions ALTER COLUMN session_id SET DEFAULT nextval('public.customer_display_sessions_session_id_seq'::regclass);


--
-- Name: customer_display_settings setting_id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.customer_display_settings ALTER COLUMN setting_id SET DEFAULT nextval('public.customer_display_settings_setting_id_seq'::regclass);


--
-- Name: customer_rewards_settings id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.customer_rewards_settings ALTER COLUMN id SET DEFAULT nextval('public.customer_rewards_settings_id_seq'::regclass);


--
-- Name: customers customer_id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.customers ALTER COLUMN customer_id SET DEFAULT nextval('public.customers_customer_id_seq'::regclass);


--
-- Name: daily_cash_counts count_id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.daily_cash_counts ALTER COLUMN count_id SET DEFAULT nextval('public.daily_cash_counts_count_id_seq'::regclass);


--
-- Name: doordash_order_lines id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.doordash_order_lines ALTER COLUMN id SET DEFAULT nextval('public.doordash_order_lines_id_seq'::regclass);


--
-- Name: doordash_store_deactivation_events id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.doordash_store_deactivation_events ALTER COLUMN id SET DEFAULT nextval('public.doordash_store_deactivation_events_id_seq'::regclass);


--
-- Name: email_templates id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.email_templates ALTER COLUMN id SET DEFAULT nextval('public.email_templates_id_seq'::regclass);


--
-- Name: employee_availability availability_id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.employee_availability ALTER COLUMN availability_id SET DEFAULT nextval('public.employee_availability_availability_id_seq'::regclass);


--
-- Name: employee_permission_overrides override_id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.employee_permission_overrides ALTER COLUMN override_id SET DEFAULT nextval('public.employee_permission_overrides_override_id_seq'::regclass);


--
-- Name: employee_positions employee_position_id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.employee_positions ALTER COLUMN employee_position_id SET DEFAULT nextval('public.employee_positions_employee_position_id_seq'::regclass);


--
-- Name: employee_schedule schedule_id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.employee_schedule ALTER COLUMN schedule_id SET DEFAULT nextval('public.employee_schedule_schedule_id_seq'::regclass);


--
-- Name: employee_sessions session_id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.employee_sessions ALTER COLUMN session_id SET DEFAULT nextval('public.employee_sessions_session_id_seq'::regclass);


--
-- Name: employees employee_id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.employees ALTER COLUMN employee_id SET DEFAULT nextval('public.employees_employee_id_seq'::regclass);


--
-- Name: establishments establishment_id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.establishments ALTER COLUMN establishment_id SET DEFAULT nextval('public.establishments_establishment_id_seq'::regclass);


--
-- Name: extraction_cost_log log_id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.extraction_cost_log ALTER COLUMN log_id SET DEFAULT nextval('public.extraction_cost_log_log_id_seq'::regclass);


--
-- Name: fiscal_periods period_id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.fiscal_periods ALTER COLUMN period_id SET DEFAULT nextval('public.fiscal_periods_period_id_seq'::regclass);


--
-- Name: google_calendar_tokens id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.google_calendar_tokens ALTER COLUMN id SET DEFAULT nextval('public.google_calendar_tokens_id_seq'::regclass);


--
-- Name: image_identifications identification_id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.image_identifications ALTER COLUMN identification_id SET DEFAULT nextval('public.image_identifications_identification_id_seq'::regclass);


--
-- Name: inventory product_id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.inventory ALTER COLUMN product_id SET DEFAULT nextval('public.inventory_product_id_seq'::regclass);


--
-- Name: invoice_lines id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.invoice_lines ALTER COLUMN id SET DEFAULT nextval('public.invoice_lines_id_seq'::regclass);


--
-- Name: invoices id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.invoices ALTER COLUMN id SET DEFAULT nextval('public.invoices_id_seq'::regclass);


--
-- Name: items id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.items ALTER COLUMN id SET DEFAULT nextval('public.items_id_seq'::regclass);


--
-- Name: journal_entries journal_entry_id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.journal_entries ALTER COLUMN journal_entry_id SET DEFAULT nextval('public.journal_entries_journal_entry_id_seq'::regclass);


--
-- Name: journal_entry_lines line_id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.journal_entry_lines ALTER COLUMN line_id SET DEFAULT nextval('public.journal_entry_lines_line_id_seq'::regclass);


--
-- Name: locations id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.locations ALTER COLUMN id SET DEFAULT nextval('public.locations_id_seq'::regclass);


--
-- Name: login_attempts id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.login_attempts ALTER COLUMN id SET DEFAULT nextval('public.login_attempts_id_seq'::regclass);


--
-- Name: master_calendar calendar_id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.master_calendar ALTER COLUMN calendar_id SET DEFAULT nextval('public.master_calendar_calendar_id_seq'::regclass);


--
-- Name: metadata_extraction_log log_id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.metadata_extraction_log ALTER COLUMN log_id SET DEFAULT nextval('public.metadata_extraction_log_log_id_seq'::regclass);


--
-- Name: order_items order_item_id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.order_items ALTER COLUMN order_item_id SET DEFAULT nextval('public.order_items_order_item_id_seq'::regclass);


--
-- Name: orders order_id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.orders ALTER COLUMN order_id SET DEFAULT nextval('public.orders_order_id_seq'::regclass);


--
-- Name: payment_methods payment_method_id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.payment_methods ALTER COLUMN payment_method_id SET DEFAULT nextval('public.payment_methods_payment_method_id_seq'::regclass);


--
-- Name: payment_transactions transaction_id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.payment_transactions ALTER COLUMN transaction_id SET DEFAULT nextval('public.payment_transactions_transaction_id_seq'::regclass);


--
-- Name: payments payment_id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.payments ALTER COLUMN payment_id SET DEFAULT nextval('public.payments_payment_id_seq'::regclass);


--
-- Name: pending_return_items return_item_id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.pending_return_items ALTER COLUMN return_item_id SET DEFAULT nextval('public.pending_return_items_return_item_id_seq'::regclass);


--
-- Name: pending_returns return_id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.pending_returns ALTER COLUMN return_id SET DEFAULT nextval('public.pending_returns_return_id_seq'::regclass);


--
-- Name: pending_shipment_items pending_item_id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.pending_shipment_items ALTER COLUMN pending_item_id SET DEFAULT nextval('public.pending_shipment_items_pending_item_id_seq'::regclass);


--
-- Name: pending_shipments pending_shipment_id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.pending_shipments ALTER COLUMN pending_shipment_id SET DEFAULT nextval('public.pending_shipments_pending_shipment_id_seq'::regclass);


--
-- Name: permissions permission_id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.permissions ALTER COLUMN permission_id SET DEFAULT nextval('public.permissions_permission_id_seq'::regclass);


--
-- Name: pos_integrations id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.pos_integrations ALTER COLUMN id SET DEFAULT nextval('public.pos_integrations_id_seq'::regclass);


--
-- Name: pos_settings id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.pos_settings ALTER COLUMN id SET DEFAULT nextval('public.pos_settings_id_seq'::regclass);


--
-- Name: product_ingredients id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.product_ingredients ALTER COLUMN id SET DEFAULT nextval('public.product_ingredients_id_seq'::regclass);


--
-- Name: product_metadata metadata_id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.product_metadata ALTER COLUMN metadata_id SET DEFAULT nextval('public.product_metadata_metadata_id_seq'::regclass);


--
-- Name: product_variants variant_id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.product_variants ALTER COLUMN variant_id SET DEFAULT nextval('public.product_variants_variant_id_seq'::regclass);


--
-- Name: receipt_preferences preference_id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.receipt_preferences ALTER COLUMN preference_id SET DEFAULT nextval('public.receipt_preferences_preference_id_seq'::regclass);


--
-- Name: receipt_settings id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.receipt_settings ALTER COLUMN id SET DEFAULT nextval('public.receipt_settings_id_seq'::regclass);


--
-- Name: receipt_templates id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.receipt_templates ALTER COLUMN id SET DEFAULT nextval('public.receipt_templates_id_seq'::regclass);


--
-- Name: register_cash_settings setting_id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.register_cash_settings ALTER COLUMN setting_id SET DEFAULT nextval('public.register_cash_settings_setting_id_seq'::regclass);


--
-- Name: register_notification_settings id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.register_notification_settings ALTER COLUMN id SET DEFAULT nextval('public.register_notification_settings_id_seq'::regclass);


--
-- Name: retained_earnings retained_earnings_id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.retained_earnings ALTER COLUMN retained_earnings_id SET DEFAULT nextval('public.retained_earnings_retained_earnings_id_seq'::regclass);


--
-- Name: role_permissions role_permission_id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.role_permissions ALTER COLUMN role_permission_id SET DEFAULT nextval('public.role_permissions_role_permission_id_seq'::regclass);


--
-- Name: roles role_id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.roles ALTER COLUMN role_id SET DEFAULT nextval('public.roles_role_id_seq'::regclass);


--
-- Name: schedule_changes change_id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.schedule_changes ALTER COLUMN change_id SET DEFAULT nextval('public.schedule_changes_change_id_seq'::regclass);


--
-- Name: schedule_notifications notification_id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.schedule_notifications ALTER COLUMN notification_id SET DEFAULT nextval('public.schedule_notifications_notification_id_seq'::regclass);


--
-- Name: schedule_periods period_id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.schedule_periods ALTER COLUMN period_id SET DEFAULT nextval('public.schedule_periods_period_id_seq'::regclass);


--
-- Name: scheduled_order_alerts alert_id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.scheduled_order_alerts ALTER COLUMN alert_id SET DEFAULT nextval('public.scheduled_order_alerts_alert_id_seq'::regclass);


--
-- Name: scheduled_shifts scheduled_shift_id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.scheduled_shifts ALTER COLUMN scheduled_shift_id SET DEFAULT nextval('public.scheduled_shifts_scheduled_shift_id_seq'::regclass);


--
-- Name: search_history search_id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.search_history ALTER COLUMN search_id SET DEFAULT nextval('public.search_history_search_id_seq'::regclass);


--
-- Name: shipment_discrepancies discrepancy_id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.shipment_discrepancies ALTER COLUMN discrepancy_id SET DEFAULT nextval('public.shipment_discrepancies_discrepancy_id_seq'::regclass);


--
-- Name: shipment_issues issue_id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.shipment_issues ALTER COLUMN issue_id SET DEFAULT nextval('public.shipment_issues_issue_id_seq'::regclass);


--
-- Name: shipment_items shipment_item_id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.shipment_items ALTER COLUMN shipment_item_id SET DEFAULT nextval('public.shipment_items_shipment_item_id_seq'::regclass);


--
-- Name: shipment_scan_log scan_id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.shipment_scan_log ALTER COLUMN scan_id SET DEFAULT nextval('public.shipment_scan_log_scan_id_seq'::regclass);


--
-- Name: shipments shipment_id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.shipments ALTER COLUMN shipment_id SET DEFAULT nextval('public.shipments_shipment_id_seq'::regclass);


--
-- Name: sms_messages message_id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.sms_messages ALTER COLUMN message_id SET DEFAULT nextval('public.sms_messages_message_id_seq'::regclass);


--
-- Name: sms_opt_outs opt_out_id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.sms_opt_outs ALTER COLUMN opt_out_id SET DEFAULT nextval('public.sms_opt_outs_opt_out_id_seq'::regclass);


--
-- Name: sms_settings setting_id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.sms_settings ALTER COLUMN setting_id SET DEFAULT nextval('public.sms_settings_setting_id_seq'::regclass);


--
-- Name: sms_templates template_id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.sms_templates ALTER COLUMN template_id SET DEFAULT nextval('public.sms_templates_template_id_seq'::regclass);


--
-- Name: store_location_settings id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.store_location_settings ALTER COLUMN id SET DEFAULT nextval('public.store_location_settings_id_seq'::regclass);


--
-- Name: stores store_id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.stores ALTER COLUMN store_id SET DEFAULT nextval('public.stores_store_id_seq'::regclass);


--
-- Name: tax_rates id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.tax_rates ALTER COLUMN id SET DEFAULT nextval('public.tax_rates_id_seq'::regclass);


--
-- Name: time_clock time_entry_id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.time_clock ALTER COLUMN time_entry_id SET DEFAULT nextval('public.time_clock_time_entry_id_seq'::regclass);


--
-- Name: transaction_items transaction_item_id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.transaction_items ALTER COLUMN transaction_item_id SET DEFAULT nextval('public.transaction_items_transaction_item_id_seq'::regclass);


--
-- Name: transactions transaction_id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.transactions ALTER COLUMN transaction_id SET DEFAULT nextval('public.transactions_transaction_id_seq'::regclass);


--
-- Name: users id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.users ALTER COLUMN id SET DEFAULT nextval('public.users_id_seq'::regclass);


--
-- Name: vendors vendor_id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.vendors ALTER COLUMN vendor_id SET DEFAULT nextval('public.vendors_vendor_id_seq'::regclass);


--
-- Name: verification_sessions session_id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.verification_sessions ALTER COLUMN session_id SET DEFAULT nextval('public.verification_sessions_session_id_seq'::regclass);


--
-- Name: accounting_settings accounting_settings_establishment_id_key; Type: CONSTRAINT; Schema: accounting; Owner: -
--

ALTER TABLE ONLY accounting.accounting_settings
    ADD CONSTRAINT accounting_settings_establishment_id_key UNIQUE (establishment_id);


--
-- Name: accounting_settings accounting_settings_pkey; Type: CONSTRAINT; Schema: accounting; Owner: -
--

ALTER TABLE ONLY accounting.accounting_settings
    ADD CONSTRAINT accounting_settings_pkey PRIMARY KEY (id);


--
-- Name: accounts accounts_pkey; Type: CONSTRAINT; Schema: accounting; Owner: -
--

ALTER TABLE ONLY accounting.accounts
    ADD CONSTRAINT accounts_pkey PRIMARY KEY (id);


--
-- Name: posting_rules posting_rules_pkey; Type: CONSTRAINT; Schema: accounting; Owner: -
--

ALTER TABLE ONLY accounting.posting_rules
    ADD CONSTRAINT posting_rules_pkey PRIMARY KEY (id);


--
-- Name: transaction_lines transaction_lines_pkey; Type: CONSTRAINT; Schema: accounting; Owner: -
--

ALTER TABLE ONLY accounting.transaction_lines
    ADD CONSTRAINT transaction_lines_pkey PRIMARY KEY (id);


--
-- Name: transactions transactions_pkey; Type: CONSTRAINT; Schema: accounting; Owner: -
--

ALTER TABLE ONLY accounting.transactions
    ADD CONSTRAINT transactions_pkey PRIMARY KEY (id);


--
-- Name: accounting_customers accounting_customers_customer_number_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.accounting_customers
    ADD CONSTRAINT accounting_customers_customer_number_key UNIQUE (customer_number);


--
-- Name: accounting_customers accounting_customers_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.accounting_customers
    ADD CONSTRAINT accounting_customers_pkey PRIMARY KEY (id);


--
-- Name: accounting_vendors accounting_vendors_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.accounting_vendors
    ADD CONSTRAINT accounting_vendors_pkey PRIMARY KEY (id);


--
-- Name: accounting_vendors accounting_vendors_vendor_number_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.accounting_vendors
    ADD CONSTRAINT accounting_vendors_vendor_number_key UNIQUE (vendor_number);


--
-- Name: accounts accounts_account_number_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.accounts
    ADD CONSTRAINT accounts_account_number_key UNIQUE (account_number);


--
-- Name: accounts accounts_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.accounts
    ADD CONSTRAINT accounts_pkey PRIMARY KEY (id);


--
-- Name: approved_shipment_items approved_shipment_items_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.approved_shipment_items
    ADD CONSTRAINT approved_shipment_items_pkey PRIMARY KEY (approved_item_id);


--
-- Name: approved_shipments approved_shipments_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.approved_shipments
    ADD CONSTRAINT approved_shipments_pkey PRIMARY KEY (shipment_id);


--
-- Name: audit_log audit_log_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.audit_log
    ADD CONSTRAINT audit_log_pkey PRIMARY KEY (audit_id);


--
-- Name: calendar_subscriptions calendar_subscriptions_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.calendar_subscriptions
    ADD CONSTRAINT calendar_subscriptions_pkey PRIMARY KEY (subscription_id);


--
-- Name: cash_register_sessions cash_register_sessions_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.cash_register_sessions
    ADD CONSTRAINT cash_register_sessions_pkey PRIMARY KEY (register_session_id);


--
-- Name: cash_transactions cash_transactions_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.cash_transactions
    ADD CONSTRAINT cash_transactions_pkey PRIMARY KEY (transaction_id);


--
-- Name: categories categories_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.categories
    ADD CONSTRAINT categories_pkey PRIMARY KEY (category_id);


--
-- Name: chart_of_accounts chart_of_accounts_establishment_id_account_number_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.chart_of_accounts
    ADD CONSTRAINT chart_of_accounts_establishment_id_account_number_key UNIQUE (establishment_id, account_number);


--
-- Name: chart_of_accounts chart_of_accounts_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.chart_of_accounts
    ADD CONSTRAINT chart_of_accounts_pkey PRIMARY KEY (account_id);


--
-- Name: classes classes_class_name_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.classes
    ADD CONSTRAINT classes_class_name_key UNIQUE (class_name);


--
-- Name: classes classes_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.classes
    ADD CONSTRAINT classes_pkey PRIMARY KEY (id);


--
-- Name: clockin_notification_settings clockin_notification_settings_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.clockin_notification_settings
    ADD CONSTRAINT clockin_notification_settings_pkey PRIMARY KEY (id);


--
-- Name: clockin_notification_settings clockin_notification_settings_store_id_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.clockin_notification_settings
    ADD CONSTRAINT clockin_notification_settings_store_id_key UNIQUE (store_id);


--
-- Name: customer_display_sessions customer_display_sessions_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.customer_display_sessions
    ADD CONSTRAINT customer_display_sessions_pkey PRIMARY KEY (session_id);


--
-- Name: customer_display_settings customer_display_settings_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.customer_display_settings
    ADD CONSTRAINT customer_display_settings_pkey PRIMARY KEY (setting_id);


--
-- Name: customer_rewards_settings customer_rewards_settings_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.customer_rewards_settings
    ADD CONSTRAINT customer_rewards_settings_pkey PRIMARY KEY (id);


--
-- Name: customers customers_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.customers
    ADD CONSTRAINT customers_pkey PRIMARY KEY (customer_id);


--
-- Name: daily_cash_counts daily_cash_counts_establishment_id_register_id_count_date_c_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.daily_cash_counts
    ADD CONSTRAINT daily_cash_counts_establishment_id_register_id_count_date_c_key UNIQUE (establishment_id, register_id, count_date, count_type);


--
-- Name: daily_cash_counts daily_cash_counts_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.daily_cash_counts
    ADD CONSTRAINT daily_cash_counts_pkey PRIMARY KEY (count_id);


--
-- Name: doordash_order_lines doordash_order_lines_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.doordash_order_lines
    ADD CONSTRAINT doordash_order_lines_pkey PRIMARY KEY (id);


--
-- Name: doordash_store_deactivation_events doordash_store_deactivation_events_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.doordash_store_deactivation_events
    ADD CONSTRAINT doordash_store_deactivation_events_pkey PRIMARY KEY (id);


--
-- Name: email_templates email_templates_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.email_templates
    ADD CONSTRAINT email_templates_pkey PRIMARY KEY (id);


--
-- Name: employee_availability employee_availability_employee_id_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.employee_availability
    ADD CONSTRAINT employee_availability_employee_id_key UNIQUE (employee_id);


--
-- Name: employee_availability employee_availability_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.employee_availability
    ADD CONSTRAINT employee_availability_pkey PRIMARY KEY (availability_id);


--
-- Name: employee_permission_overrides employee_permission_overrides_employee_id_permission_id_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.employee_permission_overrides
    ADD CONSTRAINT employee_permission_overrides_employee_id_permission_id_key UNIQUE (employee_id, permission_id);


--
-- Name: employee_permission_overrides employee_permission_overrides_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.employee_permission_overrides
    ADD CONSTRAINT employee_permission_overrides_pkey PRIMARY KEY (override_id);


--
-- Name: employee_positions employee_positions_employee_id_position_name_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.employee_positions
    ADD CONSTRAINT employee_positions_employee_id_position_name_key UNIQUE (employee_id, position_name);


--
-- Name: employee_positions employee_positions_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.employee_positions
    ADD CONSTRAINT employee_positions_pkey PRIMARY KEY (employee_position_id);


--
-- Name: employee_schedule employee_schedule_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.employee_schedule
    ADD CONSTRAINT employee_schedule_pkey PRIMARY KEY (schedule_id);


--
-- Name: employee_sessions employee_sessions_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.employee_sessions
    ADD CONSTRAINT employee_sessions_pkey PRIMARY KEY (session_id);


--
-- Name: employee_sessions employee_sessions_session_token_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.employee_sessions
    ADD CONSTRAINT employee_sessions_session_token_key UNIQUE (session_token);


--
-- Name: employees employees_establishment_id_employee_code_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.employees
    ADD CONSTRAINT employees_establishment_id_employee_code_key UNIQUE (establishment_id, employee_code);


--
-- Name: employees employees_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.employees
    ADD CONSTRAINT employees_pkey PRIMARY KEY (employee_id);


--
-- Name: establishments establishments_establishment_code_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.establishments
    ADD CONSTRAINT establishments_establishment_code_key UNIQUE (establishment_code);


--
-- Name: establishments establishments_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.establishments
    ADD CONSTRAINT establishments_pkey PRIMARY KEY (establishment_id);


--
-- Name: establishments establishments_subdomain_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.establishments
    ADD CONSTRAINT establishments_subdomain_key UNIQUE (subdomain);


--
-- Name: extraction_cost_log extraction_cost_log_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.extraction_cost_log
    ADD CONSTRAINT extraction_cost_log_pkey PRIMARY KEY (log_id);


--
-- Name: fiscal_periods fiscal_periods_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.fiscal_periods
    ADD CONSTRAINT fiscal_periods_pkey PRIMARY KEY (period_id);


--
-- Name: google_calendar_tokens google_calendar_tokens_employee_id_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.google_calendar_tokens
    ADD CONSTRAINT google_calendar_tokens_employee_id_key UNIQUE (employee_id);


--
-- Name: google_calendar_tokens google_calendar_tokens_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.google_calendar_tokens
    ADD CONSTRAINT google_calendar_tokens_pkey PRIMARY KEY (id);


--
-- Name: image_identifications image_identifications_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.image_identifications
    ADD CONSTRAINT image_identifications_pkey PRIMARY KEY (identification_id);


--
-- Name: inventory inventory_establishment_id_sku_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.inventory
    ADD CONSTRAINT inventory_establishment_id_sku_key UNIQUE (establishment_id, sku);


--
-- Name: inventory inventory_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.inventory
    ADD CONSTRAINT inventory_pkey PRIMARY KEY (product_id);


--
-- Name: invoice_lines invoice_lines_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.invoice_lines
    ADD CONSTRAINT invoice_lines_pkey PRIMARY KEY (id);


--
-- Name: invoices invoices_invoice_number_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.invoices
    ADD CONSTRAINT invoices_invoice_number_key UNIQUE (invoice_number);


--
-- Name: invoices invoices_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.invoices
    ADD CONSTRAINT invoices_pkey PRIMARY KEY (id);


--
-- Name: items items_item_number_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.items
    ADD CONSTRAINT items_item_number_key UNIQUE (item_number);


--
-- Name: items items_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.items
    ADD CONSTRAINT items_pkey PRIMARY KEY (id);


--
-- Name: journal_entries journal_entries_establishment_id_entry_number_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.journal_entries
    ADD CONSTRAINT journal_entries_establishment_id_entry_number_key UNIQUE (establishment_id, entry_number);


--
-- Name: journal_entries journal_entries_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.journal_entries
    ADD CONSTRAINT journal_entries_pkey PRIMARY KEY (journal_entry_id);


--
-- Name: journal_entry_lines journal_entry_lines_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.journal_entry_lines
    ADD CONSTRAINT journal_entry_lines_pkey PRIMARY KEY (line_id);


--
-- Name: locations locations_location_name_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.locations
    ADD CONSTRAINT locations_location_name_key UNIQUE (location_name);


--
-- Name: locations locations_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.locations
    ADD CONSTRAINT locations_pkey PRIMARY KEY (id);


--
-- Name: login_attempts login_attempts_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.login_attempts
    ADD CONSTRAINT login_attempts_pkey PRIMARY KEY (id);


--
-- Name: master_calendar master_calendar_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.master_calendar
    ADD CONSTRAINT master_calendar_pkey PRIMARY KEY (calendar_id);


--
-- Name: metadata_extraction_log metadata_extraction_log_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.metadata_extraction_log
    ADD CONSTRAINT metadata_extraction_log_pkey PRIMARY KEY (log_id);


--
-- Name: order_items order_items_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.order_items
    ADD CONSTRAINT order_items_pkey PRIMARY KEY (order_item_id);


--
-- Name: orders orders_establishment_id_order_number_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.orders
    ADD CONSTRAINT orders_establishment_id_order_number_key UNIQUE (establishment_id, order_number);


--
-- Name: orders orders_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.orders
    ADD CONSTRAINT orders_pkey PRIMARY KEY (order_id);


--
-- Name: payment_methods payment_methods_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.payment_methods
    ADD CONSTRAINT payment_methods_pkey PRIMARY KEY (payment_method_id);


--
-- Name: payment_transactions payment_transactions_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.payment_transactions
    ADD CONSTRAINT payment_transactions_pkey PRIMARY KEY (transaction_id);


--
-- Name: payments payments_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.payments
    ADD CONSTRAINT payments_pkey PRIMARY KEY (payment_id);


--
-- Name: pending_return_items pending_return_items_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.pending_return_items
    ADD CONSTRAINT pending_return_items_pkey PRIMARY KEY (return_item_id);


--
-- Name: pending_returns pending_returns_establishment_id_return_number_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.pending_returns
    ADD CONSTRAINT pending_returns_establishment_id_return_number_key UNIQUE (establishment_id, return_number);


--
-- Name: pending_returns pending_returns_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.pending_returns
    ADD CONSTRAINT pending_returns_pkey PRIMARY KEY (return_id);


--
-- Name: pending_shipment_items pending_shipment_items_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.pending_shipment_items
    ADD CONSTRAINT pending_shipment_items_pkey PRIMARY KEY (pending_item_id);


--
-- Name: pending_shipments pending_shipments_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.pending_shipments
    ADD CONSTRAINT pending_shipments_pkey PRIMARY KEY (pending_shipment_id);


--
-- Name: permissions permissions_permission_name_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.permissions
    ADD CONSTRAINT permissions_permission_name_key UNIQUE (permission_name);


--
-- Name: permissions permissions_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.permissions
    ADD CONSTRAINT permissions_pkey PRIMARY KEY (permission_id);


--
-- Name: pos_integrations pos_integrations_establishment_id_provider_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.pos_integrations
    ADD CONSTRAINT pos_integrations_establishment_id_provider_key UNIQUE (establishment_id, provider);


--
-- Name: pos_integrations pos_integrations_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.pos_integrations
    ADD CONSTRAINT pos_integrations_pkey PRIMARY KEY (id);


--
-- Name: pos_settings pos_settings_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.pos_settings
    ADD CONSTRAINT pos_settings_pkey PRIMARY KEY (id);


--
-- Name: product_ingredients product_ingredients_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.product_ingredients
    ADD CONSTRAINT product_ingredients_pkey PRIMARY KEY (id);


--
-- Name: product_metadata product_metadata_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.product_metadata
    ADD CONSTRAINT product_metadata_pkey PRIMARY KEY (metadata_id);


--
-- Name: product_metadata product_metadata_product_id_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.product_metadata
    ADD CONSTRAINT product_metadata_product_id_key UNIQUE (product_id);


--
-- Name: product_variants product_variants_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.product_variants
    ADD CONSTRAINT product_variants_pkey PRIMARY KEY (variant_id);


--
-- Name: product_variants product_variants_product_id_variant_name_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.product_variants
    ADD CONSTRAINT product_variants_product_id_variant_name_key UNIQUE (product_id, variant_name);


--
-- Name: receipt_preferences receipt_preferences_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.receipt_preferences
    ADD CONSTRAINT receipt_preferences_pkey PRIMARY KEY (preference_id);


--
-- Name: receipt_settings receipt_settings_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.receipt_settings
    ADD CONSTRAINT receipt_settings_pkey PRIMARY KEY (id);


--
-- Name: receipt_templates receipt_templates_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.receipt_templates
    ADD CONSTRAINT receipt_templates_pkey PRIMARY KEY (id);


--
-- Name: register_cash_settings register_cash_settings_establishment_id_register_id_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.register_cash_settings
    ADD CONSTRAINT register_cash_settings_establishment_id_register_id_key UNIQUE (establishment_id, register_id);


--
-- Name: register_cash_settings register_cash_settings_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.register_cash_settings
    ADD CONSTRAINT register_cash_settings_pkey PRIMARY KEY (setting_id);


--
-- Name: register_notification_settings register_notification_settings_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.register_notification_settings
    ADD CONSTRAINT register_notification_settings_pkey PRIMARY KEY (id);


--
-- Name: register_notification_settings register_notification_settings_store_id_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.register_notification_settings
    ADD CONSTRAINT register_notification_settings_store_id_key UNIQUE (store_id);


--
-- Name: retained_earnings retained_earnings_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.retained_earnings
    ADD CONSTRAINT retained_earnings_pkey PRIMARY KEY (retained_earnings_id);


--
-- Name: role_permissions role_permissions_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.role_permissions
    ADD CONSTRAINT role_permissions_pkey PRIMARY KEY (role_permission_id);


--
-- Name: role_permissions role_permissions_role_id_permission_id_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.role_permissions
    ADD CONSTRAINT role_permissions_role_id_permission_id_key UNIQUE (role_id, permission_id);


--
-- Name: roles roles_establishment_id_role_name_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.roles
    ADD CONSTRAINT roles_establishment_id_role_name_key UNIQUE (establishment_id, role_name);


--
-- Name: roles roles_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.roles
    ADD CONSTRAINT roles_pkey PRIMARY KEY (role_id);


--
-- Name: schedule_changes schedule_changes_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.schedule_changes
    ADD CONSTRAINT schedule_changes_pkey PRIMARY KEY (change_id);


--
-- Name: schedule_notification_settings schedule_notification_settings_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.schedule_notification_settings
    ADD CONSTRAINT schedule_notification_settings_pkey PRIMARY KEY (store_id);


--
-- Name: schedule_notifications schedule_notifications_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.schedule_notifications
    ADD CONSTRAINT schedule_notifications_pkey PRIMARY KEY (notification_id);


--
-- Name: schedule_periods schedule_periods_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.schedule_periods
    ADD CONSTRAINT schedule_periods_pkey PRIMARY KEY (period_id);


--
-- Name: schedule_periods schedule_periods_week_start_date_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.schedule_periods
    ADD CONSTRAINT schedule_periods_week_start_date_key UNIQUE (week_start_date);


--
-- Name: scheduled_order_alerts scheduled_order_alerts_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.scheduled_order_alerts
    ADD CONSTRAINT scheduled_order_alerts_pkey PRIMARY KEY (alert_id);


--
-- Name: scheduled_shifts scheduled_shifts_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.scheduled_shifts
    ADD CONSTRAINT scheduled_shifts_pkey PRIMARY KEY (scheduled_shift_id);


--
-- Name: search_history search_history_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.search_history
    ADD CONSTRAINT search_history_pkey PRIMARY KEY (search_id);


--
-- Name: shipment_discrepancies shipment_discrepancies_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.shipment_discrepancies
    ADD CONSTRAINT shipment_discrepancies_pkey PRIMARY KEY (discrepancy_id);


--
-- Name: shipment_issues shipment_issues_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.shipment_issues
    ADD CONSTRAINT shipment_issues_pkey PRIMARY KEY (issue_id);


--
-- Name: shipment_items shipment_items_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.shipment_items
    ADD CONSTRAINT shipment_items_pkey PRIMARY KEY (shipment_item_id);


--
-- Name: shipment_scan_log shipment_scan_log_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.shipment_scan_log
    ADD CONSTRAINT shipment_scan_log_pkey PRIMARY KEY (scan_id);


--
-- Name: shipment_verification_settings shipment_verification_settings_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.shipment_verification_settings
    ADD CONSTRAINT shipment_verification_settings_pkey PRIMARY KEY (setting_key);


--
-- Name: shipments shipments_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.shipments
    ADD CONSTRAINT shipments_pkey PRIMARY KEY (shipment_id);


--
-- Name: sms_messages sms_messages_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.sms_messages
    ADD CONSTRAINT sms_messages_pkey PRIMARY KEY (message_id);


--
-- Name: sms_opt_outs sms_opt_outs_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.sms_opt_outs
    ADD CONSTRAINT sms_opt_outs_pkey PRIMARY KEY (opt_out_id);


--
-- Name: sms_settings sms_settings_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.sms_settings
    ADD CONSTRAINT sms_settings_pkey PRIMARY KEY (setting_id);


--
-- Name: sms_settings sms_settings_store_id_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.sms_settings
    ADD CONSTRAINT sms_settings_store_id_key UNIQUE (store_id);


--
-- Name: sms_templates sms_templates_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.sms_templates
    ADD CONSTRAINT sms_templates_pkey PRIMARY KEY (template_id);


--
-- Name: store_location_settings store_location_settings_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.store_location_settings
    ADD CONSTRAINT store_location_settings_pkey PRIMARY KEY (id);


--
-- Name: stores stores_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.stores
    ADD CONSTRAINT stores_pkey PRIMARY KEY (store_id);


--
-- Name: tax_rates tax_rates_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.tax_rates
    ADD CONSTRAINT tax_rates_pkey PRIMARY KEY (id);


--
-- Name: time_clock time_clock_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.time_clock
    ADD CONSTRAINT time_clock_pkey PRIMARY KEY (time_entry_id);


--
-- Name: transaction_items transaction_items_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.transaction_items
    ADD CONSTRAINT transaction_items_pkey PRIMARY KEY (transaction_item_id);


--
-- Name: transactions transactions_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.transactions
    ADD CONSTRAINT transactions_pkey PRIMARY KEY (transaction_id);


--
-- Name: users users_email_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_email_key UNIQUE (email);


--
-- Name: users users_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_pkey PRIMARY KEY (id);


--
-- Name: users users_username_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_username_key UNIQUE (username);


--
-- Name: vendors vendors_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.vendors
    ADD CONSTRAINT vendors_pkey PRIMARY KEY (vendor_id);


--
-- Name: verification_sessions verification_sessions_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.verification_sessions
    ADD CONSTRAINT verification_sessions_pkey PRIMARY KEY (session_id);


--
-- Name: idx_acc_account_type; Type: INDEX; Schema: accounting; Owner: -
--

CREATE INDEX idx_acc_account_type ON accounting.accounts USING btree (account_type);


--
-- Name: idx_acc_acct_est_type; Type: INDEX; Schema: accounting; Owner: -
--

CREATE INDEX idx_acc_acct_est_type ON accounting.accounts USING btree (establishment_id, account_type);


--
-- Name: idx_acc_acct_num_global; Type: INDEX; Schema: accounting; Owner: -
--

CREATE UNIQUE INDEX idx_acc_acct_num_global ON accounting.accounts USING btree (account_number) WHERE (establishment_id IS NULL);


--
-- Name: idx_acc_acct_num_tenant; Type: INDEX; Schema: accounting; Owner: -
--

CREATE UNIQUE INDEX idx_acc_acct_num_tenant ON accounting.accounts USING btree (account_number, establishment_id) WHERE (establishment_id IS NOT NULL);


--
-- Name: idx_acc_active; Type: INDEX; Schema: accounting; Owner: -
--

CREATE INDEX idx_acc_active ON accounting.accounts USING btree (is_active);


--
-- Name: idx_acc_establishment; Type: INDEX; Schema: accounting; Owner: -
--

CREATE INDEX idx_acc_establishment ON accounting.accounts USING btree (establishment_id);


--
-- Name: idx_acc_number; Type: INDEX; Schema: accounting; Owner: -
--

CREATE INDEX idx_acc_number ON accounting.accounts USING btree (account_number);


--
-- Name: idx_acc_parent; Type: INDEX; Schema: accounting; Owner: -
--

CREATE INDEX idx_acc_parent ON accounting.accounts USING btree (parent_account_id);


--
-- Name: idx_acc_settings_establishment; Type: INDEX; Schema: accounting; Owner: -
--

CREATE INDEX idx_acc_settings_establishment ON accounting.accounting_settings USING btree (establishment_id);


--
-- Name: idx_acc_txl_account; Type: INDEX; Schema: accounting; Owner: -
--

CREATE INDEX idx_acc_txl_account ON accounting.transaction_lines USING btree (account_id);


--
-- Name: idx_acc_txl_est_date_acct; Type: INDEX; Schema: accounting; Owner: -
--

CREATE INDEX idx_acc_txl_est_date_acct ON accounting.transaction_lines USING btree (establishment_id, account_id) INCLUDE (debit_amount, credit_amount);


--
-- Name: idx_acc_txl_establishment; Type: INDEX; Schema: accounting; Owner: -
--

CREATE INDEX idx_acc_txl_establishment ON accounting.transaction_lines USING btree (establishment_id, account_id);


--
-- Name: idx_acc_txl_establishment_date; Type: INDEX; Schema: accounting; Owner: -
--

CREATE INDEX idx_acc_txl_establishment_date ON accounting.transaction_lines USING btree (establishment_id);


--
-- Name: idx_acc_txl_txn; Type: INDEX; Schema: accounting; Owner: -
--

CREATE INDEX idx_acc_txl_txn ON accounting.transaction_lines USING btree (transaction_id);


--
-- Name: idx_acc_txn_date; Type: INDEX; Schema: accounting; Owner: -
--

CREATE INDEX idx_acc_txn_date ON accounting.transactions USING btree (transaction_date);


--
-- Name: idx_acc_txn_est_date; Type: INDEX; Schema: accounting; Owner: -
--

CREATE INDEX idx_acc_txn_est_date ON accounting.transactions USING btree (establishment_id, transaction_date) WHERE ((is_posted = true) AND (is_void = false));


--
-- Name: idx_acc_txn_establishment; Type: INDEX; Schema: accounting; Owner: -
--

CREATE INDEX idx_acc_txn_establishment ON accounting.transactions USING btree (establishment_id);


--
-- Name: idx_acc_txn_num_global; Type: INDEX; Schema: accounting; Owner: -
--

CREATE UNIQUE INDEX idx_acc_txn_num_global ON accounting.transactions USING btree (transaction_number) WHERE (establishment_id IS NULL);


--
-- Name: idx_acc_txn_num_tenant; Type: INDEX; Schema: accounting; Owner: -
--

CREATE UNIQUE INDEX idx_acc_txn_num_tenant ON accounting.transactions USING btree (transaction_number, establishment_id) WHERE (establishment_id IS NOT NULL);


--
-- Name: idx_acc_txn_number; Type: INDEX; Schema: accounting; Owner: -
--

CREATE INDEX idx_acc_txn_number ON accounting.transactions USING btree (transaction_number);


--
-- Name: idx_acc_txn_posted; Type: INDEX; Schema: accounting; Owner: -
--

CREATE INDEX idx_acc_txn_posted ON accounting.transactions USING btree (is_posted);


--
-- Name: idx_acc_txn_type; Type: INDEX; Schema: accounting; Owner: -
--

CREATE INDEX idx_acc_txn_type ON accounting.transactions USING btree (transaction_type);


--
-- Name: idx_posting_rules_establishment; Type: INDEX; Schema: accounting; Owner: -
--

CREATE INDEX idx_posting_rules_establishment ON accounting.posting_rules USING btree (establishment_id);


--
-- Name: idx_posting_rules_global_event; Type: INDEX; Schema: accounting; Owner: -
--

CREATE UNIQUE INDEX idx_posting_rules_global_event ON accounting.posting_rules USING btree (event_type) WHERE (establishment_id IS NULL);


--
-- Name: idx_posting_rules_tenant_event; Type: INDEX; Schema: accounting; Owner: -
--

CREATE UNIQUE INDEX idx_posting_rules_tenant_event ON accounting.posting_rules USING btree (establishment_id, event_type) WHERE (establishment_id IS NOT NULL);


--
-- Name: idx_accounting_customers_company_name; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_accounting_customers_company_name ON public.accounting_customers USING btree (company_name);


--
-- Name: idx_accounting_customers_customer_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_accounting_customers_customer_id ON public.accounting_customers USING btree (customer_id);


--
-- Name: idx_accounting_customers_customer_number; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_accounting_customers_customer_number ON public.accounting_customers USING btree (customer_number);


--
-- Name: idx_accounting_customers_email; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_accounting_customers_email ON public.accounting_customers USING btree (email);


--
-- Name: idx_accounting_customers_is_active; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_accounting_customers_is_active ON public.accounting_customers USING btree (is_active);


--
-- Name: idx_accounting_customers_name; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_accounting_customers_name ON public.accounting_customers USING btree (last_name, first_name);


--
-- Name: idx_accounting_vendors_is_1099; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_accounting_vendors_is_1099 ON public.accounting_vendors USING btree (is_1099_vendor);


--
-- Name: idx_accounting_vendors_is_active; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_accounting_vendors_is_active ON public.accounting_vendors USING btree (is_active);


--
-- Name: idx_accounting_vendors_vendor_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_accounting_vendors_vendor_id ON public.accounting_vendors USING btree (vendor_id);


--
-- Name: idx_accounting_vendors_vendor_name; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_accounting_vendors_vendor_name ON public.accounting_vendors USING btree (vendor_name);


--
-- Name: idx_accounting_vendors_vendor_number; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_accounting_vendors_vendor_number ON public.accounting_vendors USING btree (vendor_number);


--
-- Name: idx_accounts_account_number; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_accounts_account_number ON public.accounts USING btree (account_number);


--
-- Name: idx_accounts_account_type; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_accounts_account_type ON public.accounts USING btree (account_type);


--
-- Name: idx_accounts_is_active; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_accounts_is_active ON public.accounts USING btree (is_active);


--
-- Name: idx_accounts_parent_account_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_accounts_parent_account_id ON public.accounts USING btree (parent_account_id);


--
-- Name: idx_approved_shipments_pending; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_approved_shipments_pending ON public.approved_shipments USING btree (pending_shipment_id);


--
-- Name: idx_audit_log_establishment; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_audit_log_establishment ON public.audit_log USING btree (establishment_id);


--
-- Name: idx_cash_register_sessions_establishment; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_cash_register_sessions_establishment ON public.cash_register_sessions USING btree (establishment_id);


--
-- Name: idx_cash_transactions_establishment; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_cash_transactions_establishment ON public.cash_transactions USING btree (establishment_id);


--
-- Name: idx_categories_archived; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_categories_archived ON public.categories USING btree (archived) WHERE (archived = false);


--
-- Name: idx_categories_name; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_categories_name ON public.categories USING btree (category_name);


--
-- Name: idx_categories_name_parent; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX idx_categories_name_parent ON public.categories USING btree (category_name, parent_category_id) WHERE (parent_category_id IS NOT NULL);


--
-- Name: idx_categories_parent; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_categories_parent ON public.categories USING btree (parent_category_id);


--
-- Name: idx_categories_root_name; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX idx_categories_root_name ON public.categories USING btree (category_name) WHERE (parent_category_id IS NULL);


--
-- Name: idx_chart_of_accounts_establishment; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_chart_of_accounts_establishment ON public.chart_of_accounts USING btree (establishment_id);


--
-- Name: idx_customer_display_sessions_transaction; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_customer_display_sessions_transaction ON public.customer_display_sessions USING btree (transaction_id);


--
-- Name: idx_customer_display_settings_establishment; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_customer_display_settings_establishment ON public.customer_display_settings USING btree (establishment_id);


--
-- Name: idx_customers_establishment; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_customers_establishment ON public.customers USING btree (establishment_id);


--
-- Name: idx_daily_cash_counts_establishment; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_daily_cash_counts_establishment ON public.daily_cash_counts USING btree (establishment_id);


--
-- Name: idx_doordash_order_lines_order_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_doordash_order_lines_order_id ON public.doordash_order_lines USING btree (order_id);


--
-- Name: idx_doordash_store_deactivation_events_establishment_created; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_doordash_store_deactivation_events_establishment_created ON public.doordash_store_deactivation_events USING btree (establishment_id, created_at DESC);


--
-- Name: idx_email_templates_store_category; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_email_templates_store_category ON public.email_templates USING btree (store_id, category);


--
-- Name: idx_employee_availability_establishment; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_employee_availability_establishment ON public.employee_availability USING btree (establishment_id);


--
-- Name: idx_employee_permission_overrides_establishment; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_employee_permission_overrides_establishment ON public.employee_permission_overrides USING btree (establishment_id);


--
-- Name: idx_employee_positions_employee; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_employee_positions_employee ON public.employee_positions USING btree (employee_id);


--
-- Name: idx_employee_schedule_establishment; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_employee_schedule_establishment ON public.employee_schedule USING btree (establishment_id);


--
-- Name: idx_employee_sessions_active; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_employee_sessions_active ON public.employee_sessions USING btree (establishment_id, is_active, employee_id);


--
-- Name: idx_employee_sessions_establishment; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_employee_sessions_establishment ON public.employee_sessions USING btree (establishment_id);


--
-- Name: idx_employee_sessions_token; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_employee_sessions_token ON public.employee_sessions USING btree (session_token);


--
-- Name: idx_employees_establishment; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_employees_establishment ON public.employees USING btree (establishment_id);


--
-- Name: idx_employees_is_admin; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_employees_is_admin ON public.employees USING btree (establishment_id, is_admin);


--
-- Name: idx_establishments_code; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_establishments_code ON public.establishments USING btree (establishment_code);


--
-- Name: idx_establishments_subdomain; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_establishments_subdomain ON public.establishments USING btree (subdomain);


--
-- Name: idx_extraction_cost_log_created; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_extraction_cost_log_created ON public.extraction_cost_log USING btree (created_at);


--
-- Name: idx_fiscal_periods_establishment; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_fiscal_periods_establishment ON public.fiscal_periods USING btree (establishment_id);


--
-- Name: idx_image_identifications_establishment; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_image_identifications_establishment ON public.image_identifications USING btree (establishment_id);


--
-- Name: idx_inventory_archived; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_inventory_archived ON public.inventory USING btree (archived) WHERE (archived = false);


--
-- Name: idx_inventory_establishment; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_inventory_establishment ON public.inventory USING btree (establishment_id);


--
-- Name: idx_inventory_sku; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_inventory_sku ON public.inventory USING btree (establishment_id, sku);


--
-- Name: idx_invoice_lines_invoice_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_invoice_lines_invoice_id ON public.invoice_lines USING btree (invoice_id);


--
-- Name: idx_invoice_lines_invoice_line; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_invoice_lines_invoice_line ON public.invoice_lines USING btree (invoice_id, line_number);


--
-- Name: idx_invoices_customer_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_invoices_customer_id ON public.invoices USING btree (customer_id);


--
-- Name: idx_invoices_invoice_date; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_invoices_invoice_date ON public.invoices USING btree (invoice_date);


--
-- Name: idx_invoices_invoice_number; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_invoices_invoice_number ON public.invoices USING btree (invoice_number);


--
-- Name: idx_invoices_status; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_invoices_status ON public.invoices USING btree (status);


--
-- Name: idx_invoices_transaction_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_invoices_transaction_id ON public.invoices USING btree (transaction_id);


--
-- Name: idx_items_barcode; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_items_barcode ON public.items USING btree (barcode);


--
-- Name: idx_items_is_active; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_items_is_active ON public.items USING btree (is_active);


--
-- Name: idx_items_item_name; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_items_item_name ON public.items USING btree (item_name);


--
-- Name: idx_items_item_number; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_items_item_number ON public.items USING btree (item_number);


--
-- Name: idx_items_item_type; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_items_item_type ON public.items USING btree (item_type);


--
-- Name: idx_journal_entries_establishment; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_journal_entries_establishment ON public.journal_entries USING btree (establishment_id);


--
-- Name: idx_journal_entry_lines_establishment; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_journal_entry_lines_establishment ON public.journal_entry_lines USING btree (establishment_id);


--
-- Name: idx_login_attempts_identifier; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_login_attempts_identifier ON public.login_attempts USING btree (identifier, attempted_at);


--
-- Name: idx_master_calendar_establishment; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_master_calendar_establishment ON public.master_calendar USING btree (establishment_id);


--
-- Name: idx_metadata_log_product; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_metadata_log_product ON public.metadata_extraction_log USING btree (product_id);


--
-- Name: idx_order_items_establishment; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_order_items_establishment ON public.order_items USING btree (establishment_id);


--
-- Name: idx_orders_date; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_orders_date ON public.orders USING btree (establishment_id, order_date);


--
-- Name: idx_orders_establishment; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_orders_establishment ON public.orders USING btree (establishment_id);


--
-- Name: idx_orders_external_order_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_orders_external_order_id ON public.orders USING btree (external_order_id) WHERE (external_order_id IS NOT NULL);


--
-- Name: idx_payment_methods_active; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_payment_methods_active ON public.payment_methods USING btree (is_active);


--
-- Name: idx_payment_methods_establishment; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_payment_methods_establishment ON public.payment_methods USING btree (establishment_id);


--
-- Name: idx_payment_transactions_establishment; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_payment_transactions_establishment ON public.payment_transactions USING btree (establishment_id);


--
-- Name: idx_pending_return_items_establishment; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_pending_return_items_establishment ON public.pending_return_items USING btree (establishment_id);


--
-- Name: idx_pending_return_items_product; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_pending_return_items_product ON public.pending_return_items USING btree (product_id);


--
-- Name: idx_pending_return_items_return; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_pending_return_items_return ON public.pending_return_items USING btree (return_id);


--
-- Name: idx_pending_returns_date; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_pending_returns_date ON public.pending_returns USING btree (return_date);


--
-- Name: idx_pending_returns_establishment; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_pending_returns_establishment ON public.pending_returns USING btree (establishment_id);


--
-- Name: idx_pending_returns_order; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_pending_returns_order ON public.pending_returns USING btree (order_id);


--
-- Name: idx_pending_returns_status; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_pending_returns_status ON public.pending_returns USING btree (status);


--
-- Name: idx_pos_integrations_establishment; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_pos_integrations_establishment ON public.pos_integrations USING btree (establishment_id);


--
-- Name: idx_product_ingredients_ingredient; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_product_ingredients_ingredient ON public.product_ingredients USING btree (ingredient_id);


--
-- Name: idx_product_ingredients_product; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_product_ingredients_product ON public.product_ingredients USING btree (product_id);


--
-- Name: idx_product_ingredients_unique_base; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX idx_product_ingredients_unique_base ON public.product_ingredients USING btree (product_id, ingredient_id) WHERE (variant_id IS NULL);


--
-- Name: idx_product_ingredients_unique_variant; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX idx_product_ingredients_unique_variant ON public.product_ingredients USING btree (product_id, variant_id, ingredient_id) WHERE (variant_id IS NOT NULL);


--
-- Name: idx_product_ingredients_variant; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_product_ingredients_variant ON public.product_ingredients USING btree (variant_id);


--
-- Name: idx_product_metadata_brand; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_product_metadata_brand ON public.product_metadata USING btree (brand);


--
-- Name: idx_product_metadata_category; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_product_metadata_category ON public.product_metadata USING btree (category_id);


--
-- Name: idx_product_metadata_product; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_product_metadata_product ON public.product_metadata USING btree (product_id);


--
-- Name: idx_product_variants_product; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_product_variants_product ON public.product_variants USING btree (product_id);


--
-- Name: idx_receipt_templates_name; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_receipt_templates_name ON public.receipt_templates USING btree (name);


--
-- Name: idx_register_cash_settings_establishment; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_register_cash_settings_establishment ON public.register_cash_settings USING btree (establishment_id);


--
-- Name: idx_retained_earnings_establishment; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_retained_earnings_establishment ON public.retained_earnings USING btree (establishment_id);


--
-- Name: idx_roles_establishment; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_roles_establishment ON public.roles USING btree (establishment_id);


--
-- Name: idx_schedule_changes_period; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_schedule_changes_period ON public.schedule_changes USING btree (period_id);


--
-- Name: idx_schedule_notifications_employee; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_schedule_notifications_employee ON public.schedule_notifications USING btree (employee_id);


--
-- Name: idx_schedule_notifications_period; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_schedule_notifications_period ON public.schedule_notifications USING btree (period_id);


--
-- Name: idx_scheduled_shifts_employee_date; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_scheduled_shifts_employee_date ON public.scheduled_shifts USING btree (employee_id, shift_date);


--
-- Name: idx_scheduled_shifts_period_date; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_scheduled_shifts_period_date ON public.scheduled_shifts USING btree (period_id, shift_date);


--
-- Name: idx_search_history_timestamp; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_search_history_timestamp ON public.search_history USING btree (search_timestamp);


--
-- Name: idx_shipment_discrepancies_establishment; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_shipment_discrepancies_establishment ON public.shipment_discrepancies USING btree (establishment_id);


--
-- Name: idx_shipment_issues_item; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_shipment_issues_item ON public.shipment_issues USING btree (pending_item_id);


--
-- Name: idx_shipment_issues_shipment; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_shipment_issues_shipment ON public.shipment_issues USING btree (pending_shipment_id);


--
-- Name: idx_shipment_items_establishment; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_shipment_items_establishment ON public.shipment_items USING btree (establishment_id);


--
-- Name: idx_shipment_scan_log_item; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_shipment_scan_log_item ON public.shipment_scan_log USING btree (pending_item_id);


--
-- Name: idx_shipment_scan_log_shipment; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_shipment_scan_log_shipment ON public.shipment_scan_log USING btree (pending_shipment_id);


--
-- Name: idx_shipments_establishment; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_shipments_establishment ON public.shipments USING btree (establishment_id);


--
-- Name: idx_sms_messages_created_at; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_sms_messages_created_at ON public.sms_messages USING btree (created_at DESC);


--
-- Name: idx_sms_messages_phone; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_sms_messages_phone ON public.sms_messages USING btree (phone_number);


--
-- Name: idx_sms_messages_store_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_sms_messages_store_id ON public.sms_messages USING btree (store_id);


--
-- Name: idx_sms_opt_outs_phone; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_sms_opt_outs_phone ON public.sms_opt_outs USING btree (phone_number);


--
-- Name: idx_tax_rates_is_active; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_tax_rates_is_active ON public.tax_rates USING btree (is_active);


--
-- Name: idx_time_clock_establishment; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_time_clock_establishment ON public.time_clock USING btree (establishment_id);


--
-- Name: idx_transaction_items_product; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_transaction_items_product ON public.transaction_items USING btree (product_id);


--
-- Name: idx_transaction_items_transaction; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_transaction_items_transaction ON public.transaction_items USING btree (transaction_id);


--
-- Name: idx_transactions_employee; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_transactions_employee ON public.transactions USING btree (employee_id);


--
-- Name: idx_transactions_establishment; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_transactions_establishment ON public.transactions USING btree (establishment_id);


--
-- Name: idx_transactions_order_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_transactions_order_id ON public.transactions USING btree (order_id);


--
-- Name: idx_transactions_status; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_transactions_status ON public.transactions USING btree (status);


--
-- Name: idx_users_email; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_users_email ON public.users USING btree (email);


--
-- Name: idx_users_username; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_users_username ON public.users USING btree (username);


--
-- Name: idx_vendors_archived; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_vendors_archived ON public.vendors USING btree (archived) WHERE (archived = false);


--
-- Name: idx_vendors_establishment; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_vendors_establishment ON public.vendors USING btree (establishment_id);


--
-- Name: idx_verification_sessions_shipment; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_verification_sessions_shipment ON public.verification_sessions USING btree (pending_shipment_id);


--
-- Name: transactions trigger_gen_txn_number; Type: TRIGGER; Schema: accounting; Owner: -
--

CREATE TRIGGER trigger_gen_txn_number BEFORE INSERT ON accounting.transactions FOR EACH ROW WHEN (((new.transaction_number IS NULL) OR ((new.transaction_number)::text = ''::text))) EXECUTE FUNCTION accounting.gen_txn_number();


--
-- Name: customers audit_customers; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER audit_customers AFTER INSERT OR DELETE OR UPDATE ON public.customers FOR EACH ROW EXECUTE FUNCTION public.audit_trigger_function();


--
-- Name: payments audit_payments; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER audit_payments AFTER INSERT OR DELETE OR UPDATE ON public.payments FOR EACH ROW EXECUTE FUNCTION public.audit_trigger_function();


--
-- Name: transactions audit_transactions; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER audit_transactions AFTER INSERT OR DELETE OR UPDATE ON public.transactions FOR EACH ROW EXECUTE FUNCTION public.audit_trigger_function();


--
-- Name: vendors audit_vendors; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER audit_vendors AFTER INSERT OR DELETE OR UPDATE ON public.vendors FOR EACH ROW EXECUTE FUNCTION public.audit_trigger_function();


--
-- Name: customers update_customers_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER update_customers_updated_at BEFORE UPDATE ON public.customers FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- Name: payments update_payments_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER update_payments_updated_at BEFORE UPDATE ON public.payments FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- Name: transactions update_transactions_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER update_transactions_updated_at BEFORE UPDATE ON public.transactions FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- Name: vendors update_vendors_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER update_vendors_updated_at BEFORE UPDATE ON public.vendors FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- Name: accounting_settings accounting_settings_accounts_payable_account_id_fkey; Type: FK CONSTRAINT; Schema: accounting; Owner: -
--

ALTER TABLE ONLY accounting.accounting_settings
    ADD CONSTRAINT accounting_settings_accounts_payable_account_id_fkey FOREIGN KEY (accounts_payable_account_id) REFERENCES accounting.accounts(id);


--
-- Name: accounting_settings accounting_settings_card_clearing_account_id_fkey; Type: FK CONSTRAINT; Schema: accounting; Owner: -
--

ALTER TABLE ONLY accounting.accounting_settings
    ADD CONSTRAINT accounting_settings_card_clearing_account_id_fkey FOREIGN KEY (card_clearing_account_id) REFERENCES accounting.accounts(id);


--
-- Name: accounting_settings accounting_settings_cash_account_id_fkey; Type: FK CONSTRAINT; Schema: accounting; Owner: -
--

ALTER TABLE ONLY accounting.accounting_settings
    ADD CONSTRAINT accounting_settings_cash_account_id_fkey FOREIGN KEY (cash_account_id) REFERENCES accounting.accounts(id);


--
-- Name: accounting_settings accounting_settings_cash_over_short_account_id_fkey; Type: FK CONSTRAINT; Schema: accounting; Owner: -
--

ALTER TABLE ONLY accounting.accounting_settings
    ADD CONSTRAINT accounting_settings_cash_over_short_account_id_fkey FOREIGN KEY (cash_over_short_account_id) REFERENCES accounting.accounts(id);


--
-- Name: accounting_settings accounting_settings_cogs_account_id_fkey; Type: FK CONSTRAINT; Schema: accounting; Owner: -
--

ALTER TABLE ONLY accounting.accounting_settings
    ADD CONSTRAINT accounting_settings_cogs_account_id_fkey FOREIGN KEY (cogs_account_id) REFERENCES accounting.accounts(id);


--
-- Name: accounting_settings accounting_settings_discounts_account_id_fkey; Type: FK CONSTRAINT; Schema: accounting; Owner: -
--

ALTER TABLE ONLY accounting.accounting_settings
    ADD CONSTRAINT accounting_settings_discounts_account_id_fkey FOREIGN KEY (discounts_account_id) REFERENCES accounting.accounts(id);


--
-- Name: accounting_settings accounting_settings_establishment_id_fkey; Type: FK CONSTRAINT; Schema: accounting; Owner: -
--

ALTER TABLE ONLY accounting.accounting_settings
    ADD CONSTRAINT accounting_settings_establishment_id_fkey FOREIGN KEY (establishment_id) REFERENCES public.establishments(establishment_id) ON DELETE CASCADE;


--
-- Name: accounting_settings accounting_settings_gift_card_account_id_fkey; Type: FK CONSTRAINT; Schema: accounting; Owner: -
--

ALTER TABLE ONLY accounting.accounting_settings
    ADD CONSTRAINT accounting_settings_gift_card_account_id_fkey FOREIGN KEY (gift_card_account_id) REFERENCES accounting.accounts(id);


--
-- Name: accounting_settings accounting_settings_inventory_account_id_fkey; Type: FK CONSTRAINT; Schema: accounting; Owner: -
--

ALTER TABLE ONLY accounting.accounting_settings
    ADD CONSTRAINT accounting_settings_inventory_account_id_fkey FOREIGN KEY (inventory_account_id) REFERENCES accounting.accounts(id);


--
-- Name: accounting_settings accounting_settings_inventory_writeoff_account_id_fkey; Type: FK CONSTRAINT; Schema: accounting; Owner: -
--

ALTER TABLE ONLY accounting.accounting_settings
    ADD CONSTRAINT accounting_settings_inventory_writeoff_account_id_fkey FOREIGN KEY (inventory_writeoff_account_id) REFERENCES accounting.accounts(id);


--
-- Name: accounting_settings accounting_settings_loyalty_expense_account_id_fkey; Type: FK CONSTRAINT; Schema: accounting; Owner: -
--

ALTER TABLE ONLY accounting.accounting_settings
    ADD CONSTRAINT accounting_settings_loyalty_expense_account_id_fkey FOREIGN KEY (loyalty_expense_account_id) REFERENCES accounting.accounts(id);


--
-- Name: accounting_settings accounting_settings_platform_fees_account_id_fkey; Type: FK CONSTRAINT; Schema: accounting; Owner: -
--

ALTER TABLE ONLY accounting.accounting_settings
    ADD CONSTRAINT accounting_settings_platform_fees_account_id_fkey FOREIGN KEY (platform_fees_account_id) REFERENCES accounting.accounts(id);


--
-- Name: accounting_settings accounting_settings_processor_fees_account_id_fkey; Type: FK CONSTRAINT; Schema: accounting; Owner: -
--

ALTER TABLE ONLY accounting.accounting_settings
    ADD CONSTRAINT accounting_settings_processor_fees_account_id_fkey FOREIGN KEY (processor_fees_account_id) REFERENCES accounting.accounts(id);


--
-- Name: accounting_settings accounting_settings_returns_account_id_fkey; Type: FK CONSTRAINT; Schema: accounting; Owner: -
--

ALTER TABLE ONLY accounting.accounting_settings
    ADD CONSTRAINT accounting_settings_returns_account_id_fkey FOREIGN KEY (returns_account_id) REFERENCES accounting.accounts(id);


--
-- Name: accounting_settings accounting_settings_sales_revenue_account_id_fkey; Type: FK CONSTRAINT; Schema: accounting; Owner: -
--

ALTER TABLE ONLY accounting.accounting_settings
    ADD CONSTRAINT accounting_settings_sales_revenue_account_id_fkey FOREIGN KEY (sales_revenue_account_id) REFERENCES accounting.accounts(id);


--
-- Name: accounting_settings accounting_settings_sales_tax_account_id_fkey; Type: FK CONSTRAINT; Schema: accounting; Owner: -
--

ALTER TABLE ONLY accounting.accounting_settings
    ADD CONSTRAINT accounting_settings_sales_tax_account_id_fkey FOREIGN KEY (sales_tax_account_id) REFERENCES accounting.accounts(id);


--
-- Name: accounting_settings accounting_settings_store_credit_account_id_fkey; Type: FK CONSTRAINT; Schema: accounting; Owner: -
--

ALTER TABLE ONLY accounting.accounting_settings
    ADD CONSTRAINT accounting_settings_store_credit_account_id_fkey FOREIGN KEY (store_credit_account_id) REFERENCES accounting.accounts(id);


--
-- Name: accounting_settings accounting_settings_theft_account_id_fkey; Type: FK CONSTRAINT; Schema: accounting; Owner: -
--

ALTER TABLE ONLY accounting.accounting_settings
    ADD CONSTRAINT accounting_settings_theft_account_id_fkey FOREIGN KEY (theft_account_id) REFERENCES accounting.accounts(id);


--
-- Name: accounting_settings accounting_settings_tips_expense_account_id_fkey; Type: FK CONSTRAINT; Schema: accounting; Owner: -
--

ALTER TABLE ONLY accounting.accounting_settings
    ADD CONSTRAINT accounting_settings_tips_expense_account_id_fkey FOREIGN KEY (tips_expense_account_id) REFERENCES accounting.accounts(id);


--
-- Name: accounting_settings accounting_settings_tips_payable_account_id_fkey; Type: FK CONSTRAINT; Schema: accounting; Owner: -
--

ALTER TABLE ONLY accounting.accounting_settings
    ADD CONSTRAINT accounting_settings_tips_payable_account_id_fkey FOREIGN KEY (tips_payable_account_id) REFERENCES accounting.accounts(id);


--
-- Name: accounts accounts_establishment_id_fkey; Type: FK CONSTRAINT; Schema: accounting; Owner: -
--

ALTER TABLE ONLY accounting.accounts
    ADD CONSTRAINT accounts_establishment_id_fkey FOREIGN KEY (establishment_id) REFERENCES public.establishments(establishment_id) ON DELETE CASCADE;


--
-- Name: accounts accounts_parent_account_id_fkey; Type: FK CONSTRAINT; Schema: accounting; Owner: -
--

ALTER TABLE ONLY accounting.accounts
    ADD CONSTRAINT accounts_parent_account_id_fkey FOREIGN KEY (parent_account_id) REFERENCES accounting.accounts(id) ON DELETE SET NULL;


--
-- Name: posting_rules posting_rules_establishment_id_fkey; Type: FK CONSTRAINT; Schema: accounting; Owner: -
--

ALTER TABLE ONLY accounting.posting_rules
    ADD CONSTRAINT posting_rules_establishment_id_fkey FOREIGN KEY (establishment_id) REFERENCES public.establishments(establishment_id) ON DELETE CASCADE;


--
-- Name: transaction_lines transaction_lines_account_id_fkey; Type: FK CONSTRAINT; Schema: accounting; Owner: -
--

ALTER TABLE ONLY accounting.transaction_lines
    ADD CONSTRAINT transaction_lines_account_id_fkey FOREIGN KEY (account_id) REFERENCES accounting.accounts(id);


--
-- Name: transaction_lines transaction_lines_establishment_id_fkey; Type: FK CONSTRAINT; Schema: accounting; Owner: -
--

ALTER TABLE ONLY accounting.transaction_lines
    ADD CONSTRAINT transaction_lines_establishment_id_fkey FOREIGN KEY (establishment_id) REFERENCES public.establishments(establishment_id) ON DELETE CASCADE;


--
-- Name: transaction_lines transaction_lines_transaction_id_fkey; Type: FK CONSTRAINT; Schema: accounting; Owner: -
--

ALTER TABLE ONLY accounting.transaction_lines
    ADD CONSTRAINT transaction_lines_transaction_id_fkey FOREIGN KEY (transaction_id) REFERENCES accounting.transactions(id) ON DELETE CASCADE;


--
-- Name: transactions transactions_establishment_id_fkey; Type: FK CONSTRAINT; Schema: accounting; Owner: -
--

ALTER TABLE ONLY accounting.transactions
    ADD CONSTRAINT transactions_establishment_id_fkey FOREIGN KEY (establishment_id) REFERENCES public.establishments(establishment_id) ON DELETE CASCADE;


--
-- Name: accounts accounts_parent_account_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.accounts
    ADD CONSTRAINT accounts_parent_account_id_fkey FOREIGN KEY (parent_account_id) REFERENCES public.accounts(id) ON DELETE SET NULL;


--
-- Name: approved_shipment_items approved_shipment_items_product_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.approved_shipment_items
    ADD CONSTRAINT approved_shipment_items_product_id_fkey FOREIGN KEY (product_id) REFERENCES public.inventory(product_id);


--
-- Name: approved_shipment_items approved_shipment_items_received_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.approved_shipment_items
    ADD CONSTRAINT approved_shipment_items_received_by_fkey FOREIGN KEY (received_by) REFERENCES public.employees(employee_id);


--
-- Name: approved_shipment_items approved_shipment_items_shipment_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.approved_shipment_items
    ADD CONSTRAINT approved_shipment_items_shipment_id_fkey FOREIGN KEY (shipment_id) REFERENCES public.approved_shipments(shipment_id);


--
-- Name: approved_shipments approved_shipments_approved_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.approved_shipments
    ADD CONSTRAINT approved_shipments_approved_by_fkey FOREIGN KEY (approved_by) REFERENCES public.employees(employee_id);


--
-- Name: approved_shipments approved_shipments_pending_shipment_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.approved_shipments
    ADD CONSTRAINT approved_shipments_pending_shipment_id_fkey FOREIGN KEY (pending_shipment_id) REFERENCES public.pending_shipments(pending_shipment_id);


--
-- Name: approved_shipments approved_shipments_vendor_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.approved_shipments
    ADD CONSTRAINT approved_shipments_vendor_id_fkey FOREIGN KEY (vendor_id) REFERENCES public.vendors(vendor_id);


--
-- Name: audit_log audit_log_employee_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.audit_log
    ADD CONSTRAINT audit_log_employee_id_fkey FOREIGN KEY (employee_id) REFERENCES public.employees(employee_id);


--
-- Name: audit_log audit_log_establishment_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.audit_log
    ADD CONSTRAINT audit_log_establishment_id_fkey FOREIGN KEY (establishment_id) REFERENCES public.establishments(establishment_id) ON DELETE CASCADE;


--
-- Name: cash_register_sessions cash_register_sessions_closed_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.cash_register_sessions
    ADD CONSTRAINT cash_register_sessions_closed_by_fkey FOREIGN KEY (closed_by) REFERENCES public.employees(employee_id);


--
-- Name: cash_register_sessions cash_register_sessions_employee_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.cash_register_sessions
    ADD CONSTRAINT cash_register_sessions_employee_id_fkey FOREIGN KEY (employee_id) REFERENCES public.employees(employee_id);


--
-- Name: cash_register_sessions cash_register_sessions_establishment_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.cash_register_sessions
    ADD CONSTRAINT cash_register_sessions_establishment_id_fkey FOREIGN KEY (establishment_id) REFERENCES public.establishments(establishment_id) ON DELETE CASCADE;


--
-- Name: cash_register_sessions cash_register_sessions_reconciled_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.cash_register_sessions
    ADD CONSTRAINT cash_register_sessions_reconciled_by_fkey FOREIGN KEY (reconciled_by) REFERENCES public.employees(employee_id);


--
-- Name: cash_transactions cash_transactions_employee_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.cash_transactions
    ADD CONSTRAINT cash_transactions_employee_id_fkey FOREIGN KEY (employee_id) REFERENCES public.employees(employee_id);


--
-- Name: cash_transactions cash_transactions_establishment_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.cash_transactions
    ADD CONSTRAINT cash_transactions_establishment_id_fkey FOREIGN KEY (establishment_id) REFERENCES public.establishments(establishment_id) ON DELETE CASCADE;


--
-- Name: cash_transactions cash_transactions_register_session_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.cash_transactions
    ADD CONSTRAINT cash_transactions_register_session_id_fkey FOREIGN KEY (session_id) REFERENCES public.cash_register_sessions(register_session_id);


--
-- Name: cash_transactions cash_transactions_session_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.cash_transactions
    ADD CONSTRAINT cash_transactions_session_id_fkey FOREIGN KEY (session_id) REFERENCES public.cash_register_sessions(register_session_id) ON DELETE SET NULL;


--
-- Name: categories categories_parent_category_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.categories
    ADD CONSTRAINT categories_parent_category_id_fkey FOREIGN KEY (parent_category_id) REFERENCES public.categories(category_id);


--
-- Name: chart_of_accounts chart_of_accounts_establishment_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.chart_of_accounts
    ADD CONSTRAINT chart_of_accounts_establishment_id_fkey FOREIGN KEY (establishment_id) REFERENCES public.establishments(establishment_id) ON DELETE CASCADE;


--
-- Name: chart_of_accounts chart_of_accounts_parent_account_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.chart_of_accounts
    ADD CONSTRAINT chart_of_accounts_parent_account_id_fkey FOREIGN KEY (parent_account_id) REFERENCES public.chart_of_accounts(account_id);


--
-- Name: customer_display_sessions customer_display_sessions_establishment_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.customer_display_sessions
    ADD CONSTRAINT customer_display_sessions_establishment_id_fkey FOREIGN KEY (establishment_id) REFERENCES public.establishments(establishment_id) ON DELETE CASCADE;


--
-- Name: customer_display_sessions customer_display_sessions_transaction_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.customer_display_sessions
    ADD CONSTRAINT customer_display_sessions_transaction_id_fkey FOREIGN KEY (transaction_id) REFERENCES public.transactions(transaction_id) ON DELETE CASCADE;


--
-- Name: customer_display_settings customer_display_settings_establishment_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.customer_display_settings
    ADD CONSTRAINT customer_display_settings_establishment_id_fkey FOREIGN KEY (establishment_id) REFERENCES public.establishments(establishment_id) ON DELETE CASCADE;


--
-- Name: customers customers_establishment_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.customers
    ADD CONSTRAINT customers_establishment_id_fkey FOREIGN KEY (establishment_id) REFERENCES public.establishments(establishment_id) ON DELETE CASCADE;


--
-- Name: daily_cash_counts daily_cash_counts_counted_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.daily_cash_counts
    ADD CONSTRAINT daily_cash_counts_counted_by_fkey FOREIGN KEY (counted_by) REFERENCES public.employees(employee_id);


--
-- Name: daily_cash_counts daily_cash_counts_establishment_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.daily_cash_counts
    ADD CONSTRAINT daily_cash_counts_establishment_id_fkey FOREIGN KEY (establishment_id) REFERENCES public.establishments(establishment_id) ON DELETE CASCADE;


--
-- Name: doordash_order_lines doordash_order_lines_order_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.doordash_order_lines
    ADD CONSTRAINT doordash_order_lines_order_id_fkey FOREIGN KEY (order_id) REFERENCES public.orders(order_id) ON DELETE CASCADE;


--
-- Name: doordash_order_lines doordash_order_lines_product_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.doordash_order_lines
    ADD CONSTRAINT doordash_order_lines_product_id_fkey FOREIGN KEY (product_id) REFERENCES public.inventory(product_id);


--
-- Name: email_templates email_templates_store_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.email_templates
    ADD CONSTRAINT email_templates_store_id_fkey FOREIGN KEY (store_id) REFERENCES public.stores(store_id) ON DELETE CASCADE;


--
-- Name: employee_availability employee_availability_employee_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.employee_availability
    ADD CONSTRAINT employee_availability_employee_id_fkey FOREIGN KEY (employee_id) REFERENCES public.employees(employee_id) ON DELETE CASCADE;


--
-- Name: employee_availability employee_availability_establishment_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.employee_availability
    ADD CONSTRAINT employee_availability_establishment_id_fkey FOREIGN KEY (establishment_id) REFERENCES public.establishments(establishment_id) ON DELETE CASCADE;


--
-- Name: employee_permission_overrides employee_permission_overrides_created_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.employee_permission_overrides
    ADD CONSTRAINT employee_permission_overrides_created_by_fkey FOREIGN KEY (created_by) REFERENCES public.employees(employee_id);


--
-- Name: employee_permission_overrides employee_permission_overrides_employee_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.employee_permission_overrides
    ADD CONSTRAINT employee_permission_overrides_employee_id_fkey FOREIGN KEY (employee_id) REFERENCES public.employees(employee_id) ON DELETE CASCADE;


--
-- Name: employee_permission_overrides employee_permission_overrides_establishment_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.employee_permission_overrides
    ADD CONSTRAINT employee_permission_overrides_establishment_id_fkey FOREIGN KEY (establishment_id) REFERENCES public.establishments(establishment_id) ON DELETE CASCADE;


--
-- Name: employee_permission_overrides employee_permission_overrides_permission_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.employee_permission_overrides
    ADD CONSTRAINT employee_permission_overrides_permission_id_fkey FOREIGN KEY (permission_id) REFERENCES public.permissions(permission_id) ON DELETE CASCADE;


--
-- Name: employee_positions employee_positions_employee_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.employee_positions
    ADD CONSTRAINT employee_positions_employee_id_fkey FOREIGN KEY (employee_id) REFERENCES public.employees(employee_id) ON DELETE CASCADE;


--
-- Name: employee_schedule employee_schedule_employee_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.employee_schedule
    ADD CONSTRAINT employee_schedule_employee_id_fkey FOREIGN KEY (employee_id) REFERENCES public.employees(employee_id) ON DELETE CASCADE;


--
-- Name: employee_schedule employee_schedule_establishment_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.employee_schedule
    ADD CONSTRAINT employee_schedule_establishment_id_fkey FOREIGN KEY (establishment_id) REFERENCES public.establishments(establishment_id) ON DELETE CASCADE;


--
-- Name: employee_schedule employee_schedule_time_entry_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.employee_schedule
    ADD CONSTRAINT employee_schedule_time_entry_id_fkey FOREIGN KEY (time_entry_id) REFERENCES public.time_clock(time_entry_id);


--
-- Name: employee_sessions employee_sessions_employee_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.employee_sessions
    ADD CONSTRAINT employee_sessions_employee_id_fkey FOREIGN KEY (employee_id) REFERENCES public.employees(employee_id) ON DELETE CASCADE;


--
-- Name: employee_sessions employee_sessions_establishment_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.employee_sessions
    ADD CONSTRAINT employee_sessions_establishment_id_fkey FOREIGN KEY (establishment_id) REFERENCES public.establishments(establishment_id) ON DELETE CASCADE;


--
-- Name: employees employees_establishment_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.employees
    ADD CONSTRAINT employees_establishment_id_fkey FOREIGN KEY (establishment_id) REFERENCES public.establishments(establishment_id) ON DELETE CASCADE;


--
-- Name: employees employees_role_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.employees
    ADD CONSTRAINT employees_role_id_fkey FOREIGN KEY (role_id) REFERENCES public.roles(role_id);


--
-- Name: fiscal_periods fiscal_periods_closed_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.fiscal_periods
    ADD CONSTRAINT fiscal_periods_closed_by_fkey FOREIGN KEY (closed_by) REFERENCES public.employees(employee_id);


--
-- Name: fiscal_periods fiscal_periods_establishment_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.fiscal_periods
    ADD CONSTRAINT fiscal_periods_establishment_id_fkey FOREIGN KEY (establishment_id) REFERENCES public.establishments(establishment_id) ON DELETE CASCADE;


--
-- Name: items fk_items_tax_rate; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.items
    ADD CONSTRAINT fk_items_tax_rate FOREIGN KEY (tax_rate_id) REFERENCES public.tax_rates(id) ON DELETE SET NULL;


--
-- Name: image_identifications image_identifications_establishment_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.image_identifications
    ADD CONSTRAINT image_identifications_establishment_id_fkey FOREIGN KEY (establishment_id) REFERENCES public.establishments(establishment_id) ON DELETE CASCADE;


--
-- Name: image_identifications image_identifications_product_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.image_identifications
    ADD CONSTRAINT image_identifications_product_id_fkey FOREIGN KEY (product_id) REFERENCES public.inventory(product_id);


--
-- Name: inventory inventory_establishment_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.inventory
    ADD CONSTRAINT inventory_establishment_id_fkey FOREIGN KEY (establishment_id) REFERENCES public.establishments(establishment_id) ON DELETE CASCADE;


--
-- Name: inventory inventory_vendor_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.inventory
    ADD CONSTRAINT inventory_vendor_id_fkey FOREIGN KEY (vendor_id) REFERENCES public.vendors(vendor_id);


--
-- Name: invoice_lines invoice_lines_account_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.invoice_lines
    ADD CONSTRAINT invoice_lines_account_id_fkey FOREIGN KEY (account_id) REFERENCES accounting.accounts(id);


--
-- Name: invoice_lines invoice_lines_invoice_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.invoice_lines
    ADD CONSTRAINT invoice_lines_invoice_id_fkey FOREIGN KEY (invoice_id) REFERENCES public.invoices(id) ON DELETE CASCADE;


--
-- Name: invoice_lines invoice_lines_tax_rate_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.invoice_lines
    ADD CONSTRAINT invoice_lines_tax_rate_id_fkey FOREIGN KEY (tax_rate_id) REFERENCES public.tax_rates(id) ON DELETE SET NULL;


--
-- Name: invoices invoices_customer_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.invoices
    ADD CONSTRAINT invoices_customer_id_fkey FOREIGN KEY (customer_id) REFERENCES public.accounting_customers(id);


--
-- Name: invoices invoices_transaction_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.invoices
    ADD CONSTRAINT invoices_transaction_id_fkey FOREIGN KEY (transaction_id) REFERENCES accounting.transactions(id);


--
-- Name: items items_asset_account_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.items
    ADD CONSTRAINT items_asset_account_id_fkey FOREIGN KEY (asset_account_id) REFERENCES public.accounts(id);


--
-- Name: items items_expense_account_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.items
    ADD CONSTRAINT items_expense_account_id_fkey FOREIGN KEY (expense_account_id) REFERENCES public.accounts(id);


--
-- Name: items items_income_account_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.items
    ADD CONSTRAINT items_income_account_id_fkey FOREIGN KEY (income_account_id) REFERENCES public.accounts(id);


--
-- Name: journal_entries journal_entries_employee_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.journal_entries
    ADD CONSTRAINT journal_entries_employee_id_fkey FOREIGN KEY (employee_id) REFERENCES public.employees(employee_id);


--
-- Name: journal_entries journal_entries_establishment_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.journal_entries
    ADD CONSTRAINT journal_entries_establishment_id_fkey FOREIGN KEY (establishment_id) REFERENCES public.establishments(establishment_id) ON DELETE CASCADE;


--
-- Name: journal_entry_lines journal_entry_lines_account_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.journal_entry_lines
    ADD CONSTRAINT journal_entry_lines_account_id_fkey FOREIGN KEY (account_id) REFERENCES public.chart_of_accounts(account_id);


--
-- Name: journal_entry_lines journal_entry_lines_establishment_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.journal_entry_lines
    ADD CONSTRAINT journal_entry_lines_establishment_id_fkey FOREIGN KEY (establishment_id) REFERENCES public.establishments(establishment_id) ON DELETE CASCADE;


--
-- Name: journal_entry_lines journal_entry_lines_journal_entry_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.journal_entry_lines
    ADD CONSTRAINT journal_entry_lines_journal_entry_id_fkey FOREIGN KEY (journal_entry_id) REFERENCES public.journal_entries(journal_entry_id) ON DELETE CASCADE;


--
-- Name: master_calendar master_calendar_created_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.master_calendar
    ADD CONSTRAINT master_calendar_created_by_fkey FOREIGN KEY (created_by) REFERENCES public.employees(employee_id);


--
-- Name: master_calendar master_calendar_establishment_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.master_calendar
    ADD CONSTRAINT master_calendar_establishment_id_fkey FOREIGN KEY (establishment_id) REFERENCES public.establishments(establishment_id) ON DELETE CASCADE;


--
-- Name: metadata_extraction_log metadata_extraction_log_product_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.metadata_extraction_log
    ADD CONSTRAINT metadata_extraction_log_product_id_fkey FOREIGN KEY (product_id) REFERENCES public.inventory(product_id) ON DELETE CASCADE;


--
-- Name: order_items order_items_establishment_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.order_items
    ADD CONSTRAINT order_items_establishment_id_fkey FOREIGN KEY (establishment_id) REFERENCES public.establishments(establishment_id) ON DELETE CASCADE;


--
-- Name: order_items order_items_order_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.order_items
    ADD CONSTRAINT order_items_order_id_fkey FOREIGN KEY (order_id) REFERENCES public.orders(order_id) ON DELETE CASCADE;


--
-- Name: order_items order_items_product_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.order_items
    ADD CONSTRAINT order_items_product_id_fkey FOREIGN KEY (product_id) REFERENCES public.inventory(product_id);


--
-- Name: orders orders_customer_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.orders
    ADD CONSTRAINT orders_customer_id_fkey FOREIGN KEY (customer_id) REFERENCES public.customers(customer_id);


--
-- Name: orders orders_employee_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.orders
    ADD CONSTRAINT orders_employee_id_fkey FOREIGN KEY (employee_id) REFERENCES public.employees(employee_id);


--
-- Name: orders orders_establishment_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.orders
    ADD CONSTRAINT orders_establishment_id_fkey FOREIGN KEY (establishment_id) REFERENCES public.establishments(establishment_id) ON DELETE CASCADE;


--
-- Name: payment_methods payment_methods_establishment_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.payment_methods
    ADD CONSTRAINT payment_methods_establishment_id_fkey FOREIGN KEY (establishment_id) REFERENCES public.establishments(establishment_id) ON DELETE CASCADE;


--
-- Name: payment_transactions payment_transactions_employee_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.payment_transactions
    ADD CONSTRAINT payment_transactions_employee_id_fkey FOREIGN KEY (employee_id) REFERENCES public.employees(employee_id);


--
-- Name: payment_transactions payment_transactions_establishment_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.payment_transactions
    ADD CONSTRAINT payment_transactions_establishment_id_fkey FOREIGN KEY (establishment_id) REFERENCES public.establishments(establishment_id) ON DELETE CASCADE;


--
-- Name: payment_transactions payment_transactions_order_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.payment_transactions
    ADD CONSTRAINT payment_transactions_order_id_fkey FOREIGN KEY (order_id) REFERENCES public.orders(order_id);


--
-- Name: payments payments_establishment_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.payments
    ADD CONSTRAINT payments_establishment_id_fkey FOREIGN KEY (establishment_id) REFERENCES public.establishments(establishment_id) ON DELETE CASCADE;


--
-- Name: payments payments_payment_method_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.payments
    ADD CONSTRAINT payments_payment_method_id_fkey FOREIGN KEY (payment_method_id) REFERENCES public.payment_methods(payment_method_id);


--
-- Name: payments payments_transaction_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.payments
    ADD CONSTRAINT payments_transaction_id_fkey FOREIGN KEY (transaction_id) REFERENCES public.transactions(transaction_id) ON DELETE CASCADE;


--
-- Name: pending_return_items pending_return_items_establishment_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.pending_return_items
    ADD CONSTRAINT pending_return_items_establishment_id_fkey FOREIGN KEY (establishment_id) REFERENCES public.establishments(establishment_id) ON DELETE CASCADE;


--
-- Name: pending_return_items pending_return_items_order_item_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.pending_return_items
    ADD CONSTRAINT pending_return_items_order_item_id_fkey FOREIGN KEY (order_item_id) REFERENCES public.order_items(order_item_id) ON DELETE SET NULL;


--
-- Name: pending_return_items pending_return_items_product_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.pending_return_items
    ADD CONSTRAINT pending_return_items_product_id_fkey FOREIGN KEY (product_id) REFERENCES public.inventory(product_id);


--
-- Name: pending_return_items pending_return_items_return_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.pending_return_items
    ADD CONSTRAINT pending_return_items_return_id_fkey FOREIGN KEY (return_id) REFERENCES public.pending_returns(return_id) ON DELETE CASCADE;


--
-- Name: pending_returns pending_returns_approved_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.pending_returns
    ADD CONSTRAINT pending_returns_approved_by_fkey FOREIGN KEY (approved_by) REFERENCES public.employees(employee_id);


--
-- Name: pending_returns pending_returns_customer_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.pending_returns
    ADD CONSTRAINT pending_returns_customer_id_fkey FOREIGN KEY (customer_id) REFERENCES public.customers(customer_id);


--
-- Name: pending_returns pending_returns_employee_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.pending_returns
    ADD CONSTRAINT pending_returns_employee_id_fkey FOREIGN KEY (employee_id) REFERENCES public.employees(employee_id);


--
-- Name: pending_returns pending_returns_establishment_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.pending_returns
    ADD CONSTRAINT pending_returns_establishment_id_fkey FOREIGN KEY (establishment_id) REFERENCES public.establishments(establishment_id) ON DELETE CASCADE;


--
-- Name: pending_returns pending_returns_order_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.pending_returns
    ADD CONSTRAINT pending_returns_order_id_fkey FOREIGN KEY (order_id) REFERENCES public.orders(order_id);


--
-- Name: pending_shipment_items pending_shipment_items_establishment_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.pending_shipment_items
    ADD CONSTRAINT pending_shipment_items_establishment_id_fkey FOREIGN KEY (establishment_id) REFERENCES public.establishments(establishment_id) ON DELETE CASCADE;


--
-- Name: pending_shipment_items pending_shipment_items_pending_shipment_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.pending_shipment_items
    ADD CONSTRAINT pending_shipment_items_pending_shipment_id_fkey FOREIGN KEY (pending_shipment_id) REFERENCES public.pending_shipments(pending_shipment_id) ON DELETE CASCADE;


--
-- Name: pending_shipment_items pending_shipment_items_product_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.pending_shipment_items
    ADD CONSTRAINT pending_shipment_items_product_id_fkey FOREIGN KEY (product_id) REFERENCES public.inventory(product_id);


--
-- Name: pending_shipments pending_shipments_establishment_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.pending_shipments
    ADD CONSTRAINT pending_shipments_establishment_id_fkey FOREIGN KEY (establishment_id) REFERENCES public.establishments(establishment_id) ON DELETE CASCADE;


--
-- Name: pending_shipments pending_shipments_vendor_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.pending_shipments
    ADD CONSTRAINT pending_shipments_vendor_id_fkey FOREIGN KEY (vendor_id) REFERENCES public.vendors(vendor_id);


--
-- Name: pos_integrations pos_integrations_establishment_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.pos_integrations
    ADD CONSTRAINT pos_integrations_establishment_id_fkey FOREIGN KEY (establishment_id) REFERENCES public.establishments(establishment_id) ON DELETE CASCADE;


--
-- Name: product_ingredients product_ingredients_ingredient_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.product_ingredients
    ADD CONSTRAINT product_ingredients_ingredient_id_fkey FOREIGN KEY (ingredient_id) REFERENCES public.inventory(product_id) ON DELETE CASCADE;


--
-- Name: product_ingredients product_ingredients_product_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.product_ingredients
    ADD CONSTRAINT product_ingredients_product_id_fkey FOREIGN KEY (product_id) REFERENCES public.inventory(product_id) ON DELETE CASCADE;


--
-- Name: product_ingredients product_ingredients_variant_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.product_ingredients
    ADD CONSTRAINT product_ingredients_variant_id_fkey FOREIGN KEY (variant_id) REFERENCES public.product_variants(variant_id) ON DELETE CASCADE;


--
-- Name: product_metadata product_metadata_category_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.product_metadata
    ADD CONSTRAINT product_metadata_category_id_fkey FOREIGN KEY (category_id) REFERENCES public.categories(category_id);


--
-- Name: product_metadata product_metadata_product_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.product_metadata
    ADD CONSTRAINT product_metadata_product_id_fkey FOREIGN KEY (product_id) REFERENCES public.inventory(product_id) ON DELETE CASCADE;


--
-- Name: product_variants product_variants_product_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.product_variants
    ADD CONSTRAINT product_variants_product_id_fkey FOREIGN KEY (product_id) REFERENCES public.inventory(product_id) ON DELETE CASCADE;


--
-- Name: receipt_preferences receipt_preferences_transaction_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.receipt_preferences
    ADD CONSTRAINT receipt_preferences_transaction_id_fkey FOREIGN KEY (transaction_id) REFERENCES public.transactions(transaction_id) ON DELETE CASCADE;


--
-- Name: register_cash_settings register_cash_settings_establishment_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.register_cash_settings
    ADD CONSTRAINT register_cash_settings_establishment_id_fkey FOREIGN KEY (establishment_id) REFERENCES public.establishments(establishment_id) ON DELETE CASCADE;


--
-- Name: retained_earnings retained_earnings_establishment_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.retained_earnings
    ADD CONSTRAINT retained_earnings_establishment_id_fkey FOREIGN KEY (establishment_id) REFERENCES public.establishments(establishment_id) ON DELETE CASCADE;


--
-- Name: retained_earnings retained_earnings_fiscal_period_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.retained_earnings
    ADD CONSTRAINT retained_earnings_fiscal_period_id_fkey FOREIGN KEY (fiscal_period_id) REFERENCES public.fiscal_periods(period_id);


--
-- Name: role_permissions role_permissions_permission_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.role_permissions
    ADD CONSTRAINT role_permissions_permission_id_fkey FOREIGN KEY (permission_id) REFERENCES public.permissions(permission_id) ON DELETE CASCADE;


--
-- Name: role_permissions role_permissions_role_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.role_permissions
    ADD CONSTRAINT role_permissions_role_id_fkey FOREIGN KEY (role_id) REFERENCES public.roles(role_id) ON DELETE CASCADE;


--
-- Name: roles roles_establishment_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.roles
    ADD CONSTRAINT roles_establishment_id_fkey FOREIGN KEY (establishment_id) REFERENCES public.establishments(establishment_id) ON DELETE CASCADE;


--
-- Name: schedule_changes schedule_changes_changed_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.schedule_changes
    ADD CONSTRAINT schedule_changes_changed_by_fkey FOREIGN KEY (changed_by) REFERENCES public.employees(employee_id);


--
-- Name: schedule_changes schedule_changes_period_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.schedule_changes
    ADD CONSTRAINT schedule_changes_period_id_fkey FOREIGN KEY (period_id) REFERENCES public.schedule_periods(period_id);


--
-- Name: schedule_changes schedule_changes_scheduled_shift_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.schedule_changes
    ADD CONSTRAINT schedule_changes_scheduled_shift_id_fkey FOREIGN KEY (scheduled_shift_id) REFERENCES public.scheduled_shifts(scheduled_shift_id);


--
-- Name: schedule_notifications schedule_notifications_employee_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.schedule_notifications
    ADD CONSTRAINT schedule_notifications_employee_id_fkey FOREIGN KEY (employee_id) REFERENCES public.employees(employee_id);


--
-- Name: schedule_notifications schedule_notifications_period_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.schedule_notifications
    ADD CONSTRAINT schedule_notifications_period_id_fkey FOREIGN KEY (period_id) REFERENCES public.schedule_periods(period_id);


--
-- Name: schedule_periods schedule_periods_created_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.schedule_periods
    ADD CONSTRAINT schedule_periods_created_by_fkey FOREIGN KEY (created_by) REFERENCES public.employees(employee_id);


--
-- Name: schedule_periods schedule_periods_published_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.schedule_periods
    ADD CONSTRAINT schedule_periods_published_by_fkey FOREIGN KEY (published_by) REFERENCES public.employees(employee_id);


--
-- Name: scheduled_order_alerts scheduled_order_alerts_order_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.scheduled_order_alerts
    ADD CONSTRAINT scheduled_order_alerts_order_id_fkey FOREIGN KEY (order_id) REFERENCES public.orders(order_id);


--
-- Name: scheduled_shifts scheduled_shifts_employee_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.scheduled_shifts
    ADD CONSTRAINT scheduled_shifts_employee_id_fkey FOREIGN KEY (employee_id) REFERENCES public.employees(employee_id);


--
-- Name: scheduled_shifts scheduled_shifts_period_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.scheduled_shifts
    ADD CONSTRAINT scheduled_shifts_period_id_fkey FOREIGN KEY (period_id) REFERENCES public.schedule_periods(period_id) ON DELETE CASCADE;


--
-- Name: search_history search_history_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.search_history
    ADD CONSTRAINT search_history_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.employees(employee_id);


--
-- Name: shipment_discrepancies shipment_discrepancies_establishment_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.shipment_discrepancies
    ADD CONSTRAINT shipment_discrepancies_establishment_id_fkey FOREIGN KEY (establishment_id) REFERENCES public.establishments(establishment_id) ON DELETE CASCADE;


--
-- Name: shipment_discrepancies shipment_discrepancies_product_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.shipment_discrepancies
    ADD CONSTRAINT shipment_discrepancies_product_id_fkey FOREIGN KEY (product_id) REFERENCES public.inventory(product_id);


--
-- Name: shipment_discrepancies shipment_discrepancies_reported_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.shipment_discrepancies
    ADD CONSTRAINT shipment_discrepancies_reported_by_fkey FOREIGN KEY (reported_by) REFERENCES public.employees(employee_id);


--
-- Name: shipment_discrepancies shipment_discrepancies_resolved_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.shipment_discrepancies
    ADD CONSTRAINT shipment_discrepancies_resolved_by_fkey FOREIGN KEY (resolved_by) REFERENCES public.employees(employee_id);


--
-- Name: shipment_discrepancies shipment_discrepancies_shipment_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.shipment_discrepancies
    ADD CONSTRAINT shipment_discrepancies_shipment_id_fkey FOREIGN KEY (shipment_id) REFERENCES public.shipments(shipment_id);


--
-- Name: shipment_issues shipment_issues_pending_item_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.shipment_issues
    ADD CONSTRAINT shipment_issues_pending_item_id_fkey FOREIGN KEY (pending_item_id) REFERENCES public.pending_shipment_items(pending_item_id);


--
-- Name: shipment_issues shipment_issues_pending_shipment_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.shipment_issues
    ADD CONSTRAINT shipment_issues_pending_shipment_id_fkey FOREIGN KEY (pending_shipment_id) REFERENCES public.pending_shipments(pending_shipment_id);


--
-- Name: shipment_issues shipment_issues_reported_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.shipment_issues
    ADD CONSTRAINT shipment_issues_reported_by_fkey FOREIGN KEY (reported_by) REFERENCES public.employees(employee_id);


--
-- Name: shipment_issues shipment_issues_resolved_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.shipment_issues
    ADD CONSTRAINT shipment_issues_resolved_by_fkey FOREIGN KEY (resolved_by) REFERENCES public.employees(employee_id);


--
-- Name: shipment_items shipment_items_establishment_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.shipment_items
    ADD CONSTRAINT shipment_items_establishment_id_fkey FOREIGN KEY (establishment_id) REFERENCES public.establishments(establishment_id) ON DELETE CASCADE;


--
-- Name: shipment_items shipment_items_product_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.shipment_items
    ADD CONSTRAINT shipment_items_product_id_fkey FOREIGN KEY (product_id) REFERENCES public.inventory(product_id);


--
-- Name: shipment_items shipment_items_shipment_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.shipment_items
    ADD CONSTRAINT shipment_items_shipment_id_fkey FOREIGN KEY (shipment_id) REFERENCES public.shipments(shipment_id) ON DELETE CASCADE;


--
-- Name: shipment_scan_log shipment_scan_log_pending_item_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.shipment_scan_log
    ADD CONSTRAINT shipment_scan_log_pending_item_id_fkey FOREIGN KEY (pending_item_id) REFERENCES public.pending_shipment_items(pending_item_id);


--
-- Name: shipment_scan_log shipment_scan_log_pending_shipment_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.shipment_scan_log
    ADD CONSTRAINT shipment_scan_log_pending_shipment_id_fkey FOREIGN KEY (pending_shipment_id) REFERENCES public.pending_shipments(pending_shipment_id);


--
-- Name: shipment_scan_log shipment_scan_log_scanned_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.shipment_scan_log
    ADD CONSTRAINT shipment_scan_log_scanned_by_fkey FOREIGN KEY (scanned_by) REFERENCES public.employees(employee_id);


--
-- Name: shipments shipments_approved_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.shipments
    ADD CONSTRAINT shipments_approved_by_fkey FOREIGN KEY (approved_by) REFERENCES public.employees(employee_id);


--
-- Name: shipments shipments_establishment_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.shipments
    ADD CONSTRAINT shipments_establishment_id_fkey FOREIGN KEY (establishment_id) REFERENCES public.establishments(establishment_id) ON DELETE CASCADE;


--
-- Name: shipments shipments_uploaded_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.shipments
    ADD CONSTRAINT shipments_uploaded_by_fkey FOREIGN KEY (uploaded_by) REFERENCES public.employees(employee_id);


--
-- Name: shipments shipments_vendor_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.shipments
    ADD CONSTRAINT shipments_vendor_id_fkey FOREIGN KEY (vendor_id) REFERENCES public.vendors(vendor_id);


--
-- Name: sms_messages sms_messages_store_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.sms_messages
    ADD CONSTRAINT sms_messages_store_id_fkey FOREIGN KEY (store_id) REFERENCES public.stores(store_id) ON DELETE CASCADE;


--
-- Name: sms_opt_outs sms_opt_outs_store_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.sms_opt_outs
    ADD CONSTRAINT sms_opt_outs_store_id_fkey FOREIGN KEY (store_id) REFERENCES public.stores(store_id) ON DELETE CASCADE;


--
-- Name: sms_settings sms_settings_store_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.sms_settings
    ADD CONSTRAINT sms_settings_store_id_fkey FOREIGN KEY (store_id) REFERENCES public.stores(store_id) ON DELETE CASCADE;


--
-- Name: sms_templates sms_templates_store_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.sms_templates
    ADD CONSTRAINT sms_templates_store_id_fkey FOREIGN KEY (store_id) REFERENCES public.stores(store_id) ON DELETE CASCADE;


--
-- Name: tax_rates tax_rates_tax_agency_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.tax_rates
    ADD CONSTRAINT tax_rates_tax_agency_id_fkey FOREIGN KEY (tax_agency_id) REFERENCES public.accounting_vendors(id);


--
-- Name: time_clock time_clock_employee_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.time_clock
    ADD CONSTRAINT time_clock_employee_id_fkey FOREIGN KEY (employee_id) REFERENCES public.employees(employee_id) ON DELETE CASCADE;


--
-- Name: time_clock time_clock_establishment_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.time_clock
    ADD CONSTRAINT time_clock_establishment_id_fkey FOREIGN KEY (establishment_id) REFERENCES public.establishments(establishment_id) ON DELETE CASCADE;


--
-- Name: transaction_items transaction_items_establishment_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.transaction_items
    ADD CONSTRAINT transaction_items_establishment_id_fkey FOREIGN KEY (establishment_id) REFERENCES public.establishments(establishment_id) ON DELETE CASCADE;


--
-- Name: transaction_items transaction_items_product_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.transaction_items
    ADD CONSTRAINT transaction_items_product_id_fkey FOREIGN KEY (product_id) REFERENCES public.inventory(product_id);


--
-- Name: transaction_items transaction_items_transaction_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.transaction_items
    ADD CONSTRAINT transaction_items_transaction_id_fkey FOREIGN KEY (transaction_id) REFERENCES public.transactions(transaction_id) ON DELETE CASCADE;


--
-- Name: transactions transactions_customer_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.transactions
    ADD CONSTRAINT transactions_customer_id_fkey FOREIGN KEY (customer_id) REFERENCES public.customers(customer_id);


--
-- Name: transactions transactions_employee_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.transactions
    ADD CONSTRAINT transactions_employee_id_fkey FOREIGN KEY (employee_id) REFERENCES public.employees(employee_id);


--
-- Name: transactions transactions_establishment_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.transactions
    ADD CONSTRAINT transactions_establishment_id_fkey FOREIGN KEY (establishment_id) REFERENCES public.establishments(establishment_id) ON DELETE CASCADE;


--
-- Name: transactions transactions_order_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.transactions
    ADD CONSTRAINT transactions_order_id_fkey FOREIGN KEY (order_id) REFERENCES public.orders(order_id) ON DELETE SET NULL;


--
-- Name: vendors vendors_establishment_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.vendors
    ADD CONSTRAINT vendors_establishment_id_fkey FOREIGN KEY (establishment_id) REFERENCES public.establishments(establishment_id) ON DELETE CASCADE;


--
-- Name: verification_sessions verification_sessions_employee_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.verification_sessions
    ADD CONSTRAINT verification_sessions_employee_id_fkey FOREIGN KEY (employee_id) REFERENCES public.employees(employee_id);


--
-- Name: verification_sessions verification_sessions_pending_shipment_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.verification_sessions
    ADD CONSTRAINT verification_sessions_pending_shipment_id_fkey FOREIGN KEY (pending_shipment_id) REFERENCES public.pending_shipments(pending_shipment_id);


--
-- PostgreSQL database dump complete
--

