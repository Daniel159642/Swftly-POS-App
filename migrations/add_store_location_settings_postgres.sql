-- Store location settings for geofencing / location validation (PostgreSQL)

CREATE TABLE IF NOT EXISTS store_location_settings (
    id SERIAL PRIMARY KEY,
    store_name TEXT DEFAULT 'Store',
    latitude NUMERIC(10, 7),
    longitude NUMERIC(10, 7),
    address TEXT,
    allowed_radius_meters NUMERIC(10, 2) DEFAULT 100.0,
    require_location INTEGER DEFAULT 1 CHECK(require_location IN (0, 1)),
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Seed one row so the app has defaults (code expects at most one row, ORDER BY id DESC LIMIT 1)
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM store_location_settings LIMIT 1) THEN
    INSERT INTO store_location_settings (store_name, allowed_radius_meters, require_location)
    VALUES ('Store', 100.0, 1);
  END IF;
END $$;
