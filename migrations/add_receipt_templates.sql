-- Custom named receipt templates (saved from Settings receipt editor)

CREATE TABLE IF NOT EXISTS receipt_templates (
    id SERIAL PRIMARY KEY,
    name TEXT NOT NULL,
    settings JSONB NOT NULL DEFAULT '{}',
    created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_receipt_templates_name ON receipt_templates (name);
