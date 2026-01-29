-- SMS feature: stores + sms_settings, sms_messages, sms_opt_outs, sms_templates
-- Run this migration so Settings > SMS & Notifications and Send Test SMS work.

-- Stores (used by SMS and optionally other multi-location features)
CREATE TABLE IF NOT EXISTS stores (
    store_id SERIAL PRIMARY KEY,
    store_name TEXT NOT NULL DEFAULT 'Store',
    is_active INTEGER DEFAULT 1 CHECK (is_active IN (0, 1)),
    created_at TIMESTAMP DEFAULT NOW()
);

-- SMS settings per store (email-to-SMS or AWS SNS)
CREATE TABLE IF NOT EXISTS sms_settings (
    setting_id SERIAL PRIMARY KEY,
    store_id INTEGER NOT NULL REFERENCES stores(store_id) ON DELETE CASCADE,
    sms_provider TEXT NOT NULL DEFAULT 'email' CHECK (sms_provider IN ('email', 'aws_sns', 'twilio')),
    smtp_server TEXT DEFAULT 'smtp.gmail.com',
    smtp_port INTEGER DEFAULT 587,
    smtp_user TEXT,
    smtp_password TEXT,
    smtp_use_tls INTEGER DEFAULT 1 CHECK (smtp_use_tls IN (0, 1)),
    business_name TEXT,
    store_phone_number TEXT,
    auto_send_rewards_earned INTEGER DEFAULT 1 CHECK (auto_send_rewards_earned IN (0, 1)),
    auto_send_rewards_redeemed INTEGER DEFAULT 1 CHECK (auto_send_rewards_redeemed IN (0, 1)),
    aws_access_key_id TEXT,
    aws_secret_access_key TEXT,
    aws_region TEXT DEFAULT 'us-east-1',
    is_active INTEGER DEFAULT 1 CHECK (is_active IN (0, 1)),
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW(),
    UNIQUE(store_id)
);

-- Outbound/inbound SMS log
CREATE TABLE IF NOT EXISTS sms_messages (
    message_id SERIAL PRIMARY KEY,
    store_id INTEGER NOT NULL REFERENCES stores(store_id) ON DELETE CASCADE,
    customer_id INTEGER,
    phone_number TEXT NOT NULL,
    message_text TEXT NOT NULL,
    direction TEXT NOT NULL DEFAULT 'outbound' CHECK (direction IN ('inbound', 'outbound')),
    status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'sent', 'failed', 'delivered')),
    message_type TEXT DEFAULT 'manual',
    provider TEXT,
    provider_sid TEXT,
    sent_at TIMESTAMP,
    error_message TEXT,
    created_by INTEGER,
    created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_sms_messages_store_id ON sms_messages(store_id);
CREATE INDEX IF NOT EXISTS idx_sms_messages_phone ON sms_messages(phone_number);
CREATE INDEX IF NOT EXISTS idx_sms_messages_created_at ON sms_messages(created_at DESC);

-- Opt-outs (per store or global)
CREATE TABLE IF NOT EXISTS sms_opt_outs (
    opt_out_id SERIAL PRIMARY KEY,
    phone_number TEXT NOT NULL,
    store_id INTEGER REFERENCES stores(store_id) ON DELETE CASCADE,
    created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_sms_opt_outs_phone ON sms_opt_outs(phone_number);

-- Templates for rewards, etc.
CREATE TABLE IF NOT EXISTS sms_templates (
    template_id SERIAL PRIMARY KEY,
    store_id INTEGER NOT NULL REFERENCES stores(store_id) ON DELETE CASCADE,
    template_name TEXT NOT NULL,
    template_text TEXT NOT NULL,
    category TEXT DEFAULT 'rewards',
    variables TEXT,  -- JSON array of variable names
    is_active INTEGER DEFAULT 1 CHECK (is_active IN (0, 1)),
    created_by INTEGER,
    created_at TIMESTAMP DEFAULT NOW()
);

-- Seed one default store so Settings > SMS has a store to select
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM stores LIMIT 1) THEN
    INSERT INTO stores (store_name, is_active) VALUES ('Default Store', 1);
  END IF;
END $$;
