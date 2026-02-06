-- ============================================================================
-- Consolidate activity_log into audit_log (single audit trail)
-- Run this on existing DBs that have activity_log. New installs use schema_postgres.sql only.
-- ============================================================================

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_schema = 'public' AND table_name = 'audit_log' AND column_name = 'resource_type'
    ) THEN
        ALTER TABLE audit_log ADD COLUMN resource_type TEXT;
    END IF;
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_schema = 'public' AND table_name = 'audit_log' AND column_name = 'details'
    ) THEN
        ALTER TABLE audit_log ADD COLUMN details TEXT;
    END IF;
END $$;

-- Migrate existing activity_log rows into audit_log (skip duplicates)
INSERT INTO audit_log (
    establishment_id, employee_id, action_timestamp, ip_address,
    table_name, record_id, action_type, details, resource_type
)
SELECT
    al.establishment_id,
    al.employee_id,
    al.created_at,
    al.ip_address,
    COALESCE(al.resource_type, 'activity'),
    COALESCE(al.resource_id, 0),
    al.action,
    al.details,
    al.resource_type
FROM activity_log al
WHERE EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'activity_log')
  AND al.employee_id IS NOT NULL
  AND NOT EXISTS (
    SELECT 1 FROM audit_log a
    WHERE a.establishment_id = al.establishment_id
      AND a.employee_id = al.employee_id
      AND a.action_timestamp = al.created_at
      AND a.action_type = al.action
      AND a.record_id = COALESCE(al.resource_id, 0)
);

DROP TABLE IF EXISTS activity_log CASCADE;
