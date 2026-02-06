-- ============================================================================
-- Use vendor_id only on inventory; drop deprecated vendor (TEXT) column
-- ============================================================================

-- 1. Backfill vendor_id from vendor name where vendor is set and vendor_id is null
UPDATE inventory i
SET vendor_id = (
    SELECT v.vendor_id FROM vendors v
    WHERE v.vendor_name = TRIM(i.vendor)
      AND v.establishment_id = i.establishment_id
    LIMIT 1
)
WHERE i.vendor IS NOT NULL AND TRIM(i.vendor) != ''
  AND (i.vendor_id IS NULL OR i.vendor_id = 0);

-- 2. Drop the vendor text column
ALTER TABLE inventory DROP COLUMN IF EXISTS vendor;
