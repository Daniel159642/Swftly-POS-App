# SMS Testing

Test SMS from **Settings → SMS & Notifications**.

## Important: Email-to-SMS is largely discontinued

**ATT** (June 2025), **Verizon**, and **T-Mobile** (late 2024) have shut down their free email-to-SMS gateways. Sending to addresses like `number@txt.att.net` will often fail with "domain not found" or similar. For **reliable delivery**, use **AWS SNS** in Settings (~$0.006/SMS).

## Quick test from Settings

1. **Open Settings** and go to the **SMS & Notifications** tab.
2. **Store**: Leave "Default Store" selected (or pick another store if you have more).
3. **SMS Provider**: For reliable delivery choose **AWS SNS** and add your AWS credentials. (Email-to-SMS is kept for legacy; most US carriers no longer support it.)
4. **If using Email-to-SMS** (Gmail setup):
   - **SMTP Server**: `smtp.gmail.com`
   - **SMTP Port**: `587`
   - **Email**: Your Gmail address
   - **App Password**: Create one at [Google Account → Security → 2-Step Verification → App passwords](https://myaccount.google.com/apppasswords). Use that 16-character password here (not your normal Gmail password).
5. Click **Save SMS Settings**.
6. Click **Send Test SMS**.
7. Enter a **10-digit US mobile number** (e.g. `5551234567`) and a short message, then **Send**.

Messages are limited to **160 characters** and only **US 10-digit numbers** are supported for email-to-SMS.

## If you just set up the database

The migration `migrations/add_sms_tables_postgres.sql` creates the `stores`, `sms_settings`, `sms_messages`, `sms_opt_outs`, and `sms_templates` tables and seeds one **Default Store**. If you added the SMS feature after initial setup, run:

```bash
# From project root, with .env loaded for DB connection:
psql $DATABASE_URL -f migrations/add_sms_tables_postgres.sql
# Or: psql -h localhost -p 5432 -U postgres -d pos_db -f migrations/add_sms_tables_postgres.sql
```

Then restart the backend and test from Settings as above.
