-- Extended clock-in notification settings (per-alert email/sms/recipients)
-- Run after clockin_notification_settings exists.

-- Add JSONB column for extended per-alert settings
ALTER TABLE clockin_notification_settings
  ADD COLUMN IF NOT EXISTS settings_ext JSONB DEFAULT '{}';

COMMENT ON COLUMN clockin_notification_settings.settings_ext IS 'Extended settings: clockin_*, clockout_*, late_alert_*, overtime_* (email_enabled, sms_enabled, notify_employee, admin_email_ids, admin_sms_ids)';
