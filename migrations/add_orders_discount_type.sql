-- Store discount reason/type with order (e.g. student, employee, senior)
ALTER TABLE orders ADD COLUMN IF NOT EXISTS discount_type TEXT;
