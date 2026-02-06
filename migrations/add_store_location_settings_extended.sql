-- Extend store_location_settings with contact, address parts, and store hours (PostgreSQL)

-- Add new columns if they don't exist (safe for re-run)
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'store_location_settings' AND column_name = 'city') THEN
    ALTER TABLE store_location_settings ADD COLUMN city TEXT;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'store_location_settings' AND column_name = 'state') THEN
    ALTER TABLE store_location_settings ADD COLUMN state TEXT;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'store_location_settings' AND column_name = 'zip') THEN
    ALTER TABLE store_location_settings ADD COLUMN zip TEXT;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'store_location_settings' AND column_name = 'country') THEN
    ALTER TABLE store_location_settings ADD COLUMN country TEXT;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'store_location_settings' AND column_name = 'store_phone') THEN
    ALTER TABLE store_location_settings ADD COLUMN store_phone TEXT;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'store_location_settings' AND column_name = 'store_email') THEN
    ALTER TABLE store_location_settings ADD COLUMN store_email TEXT;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'store_location_settings' AND column_name = 'store_website') THEN
    ALTER TABLE store_location_settings ADD COLUMN store_website TEXT;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'store_location_settings' AND column_name = 'store_type') THEN
    ALTER TABLE store_location_settings ADD COLUMN store_type TEXT;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'store_location_settings' AND column_name = 'store_logo') THEN
    ALTER TABLE store_location_settings ADD COLUMN store_logo TEXT;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'store_location_settings' AND column_name = 'store_hours') THEN
    ALTER TABLE store_location_settings ADD COLUMN store_hours JSONB;
  END IF;
END $$;
