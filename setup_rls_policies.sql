-- ============================================================================
-- ROW-LEVEL SECURITY (RLS) POLICIES FOR MULTI-TENANT ISOLATION
-- ============================================================================
-- Run this in Supabase SQL Editor after creating tables
-- This ensures data isolation between establishments

-- Function to get current establishment from session variable
CREATE OR REPLACE FUNCTION get_current_establishment_id()
RETURNS INTEGER AS $$
BEGIN
    -- Try to get from session variable
    BEGIN
        RETURN current_setting('app.establishment_id', true)::INTEGER;
    EXCEPTION WHEN OTHERS THEN
        -- If not set, return NULL (will block access)
        RETURN NULL;
    END;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Enable RLS on all tenant tables (NOT on establishments table itself)
DO $$
DECLARE
    table_name TEXT;
    tables TEXT[] := ARRAY[
        'inventory', 'vendors', 'shipments', 'shipment_items', 'sales',
        'pending_shipments', 'pending_shipment_items', 'employees', 'customers',
        'orders', 'order_items', 'payment_transactions', 'employee_schedule',
        'employee_availability', 'employee_sessions', 'time_clock', 'audit_log',
        'master_calendar', 'chart_of_accounts', 'fiscal_periods', 'journal_entries',
        'journal_entry_lines', 'retained_earnings', 'shipment_discrepancies',
        'image_identifications', 'roles', 'role_permissions',
        'employee_permission_overrides', 'activity_log', 'cash_register_sessions',
        'cash_transactions', 'register_cash_settings', 'daily_cash_counts'
    ];
BEGIN
    FOREACH table_name IN ARRAY tables
    LOOP
        -- Enable RLS
        BEGIN
            EXECUTE format('ALTER TABLE %I ENABLE ROW LEVEL SECURITY', table_name);
            RAISE NOTICE 'Enabled RLS on %', table_name;
        EXCEPTION WHEN OTHERS THEN
            RAISE NOTICE 'Could not enable RLS on %: %', table_name, SQLERRM;
        END;
        
        -- Drop existing policies if they exist
        BEGIN
            EXECUTE format('DROP POLICY IF EXISTS "%s_select_policy" ON %I', table_name, table_name);
            EXECUTE format('DROP POLICY IF EXISTS "%s_insert_policy" ON %I', table_name, table_name);
            EXECUTE format('DROP POLICY IF EXISTS "%s_update_policy" ON %I', table_name, table_name);
            EXECUTE format('DROP POLICY IF EXISTS "%s_delete_policy" ON %I', table_name, table_name);
        EXCEPTION WHEN OTHERS THEN
            -- Policies might not exist, that's okay
            NULL;
        END;
        
        -- Create SELECT policy
        BEGIN
            EXECUTE format('
                CREATE POLICY "%s_select_policy"
                ON %I FOR SELECT
                USING (establishment_id = get_current_establishment_id())
            ', table_name, table_name);
            RAISE NOTICE 'Created SELECT policy for %', table_name;
        EXCEPTION WHEN OTHERS THEN
            RAISE NOTICE 'Could not create SELECT policy for %: %', table_name, SQLERRM;
        END;
        
        -- Create INSERT policy
        BEGIN
            EXECUTE format('
                CREATE POLICY "%s_insert_policy"
                ON %I FOR INSERT
                WITH CHECK (establishment_id = get_current_establishment_id())
            ', table_name, table_name);
            RAISE NOTICE 'Created INSERT policy for %', table_name;
        EXCEPTION WHEN OTHERS THEN
            RAISE NOTICE 'Could not create INSERT policy for %: %', table_name, SQLERRM;
        END;
        
        -- Create UPDATE policy
        BEGIN
            EXECUTE format('
                CREATE POLICY "%s_update_policy"
                ON %I FOR UPDATE
                USING (establishment_id = get_current_establishment_id())
                WITH CHECK (establishment_id = get_current_establishment_id())
            ', table_name, table_name);
            RAISE NOTICE 'Created UPDATE policy for %', table_name;
        EXCEPTION WHEN OTHERS THEN
            RAISE NOTICE 'Could not create UPDATE policy for %: %', table_name, SQLERRM;
        END;
        
        -- Create DELETE policy
        BEGIN
            EXECUTE format('
                CREATE POLICY "%s_delete_policy"
                ON %I FOR DELETE
                USING (establishment_id = get_current_establishment_id())
            ', table_name, table_name);
            RAISE NOTICE 'Created DELETE policy for %', table_name;
        EXCEPTION WHEN OTHERS THEN
            RAISE NOTICE 'Could not create DELETE policy for %: %', table_name, SQLERRM;
        END;
    END LOOP;
END $$;

-- Note: The 'permissions' table is shared across all establishments (no RLS)
-- The 'establishments' table should NOT have RLS (it's the tenant table itself)

-- Grant necessary permissions
GRANT USAGE ON SCHEMA public TO anon, authenticated;
GRANT ALL ON ALL TABLES IN SCHEMA public TO anon, authenticated;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO anon, authenticated;
