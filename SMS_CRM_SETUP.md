# SMS CRM Setup Guide

## ✅ Installation Complete!

Your SMS CRM system is now set up with:
- **Email-to-SMS (FREE)** - Start here, no cost
- **AWS SNS migration path** - Easy upgrade when ready (~$0.006/SMS)

## 🚀 Quick Start

### 1. Access SMS Settings
- Navigate to **SMS** in the top navigation (requires admin/settings permission)
- Or go directly to: `http://localhost:5001/sms`

### 2. Configure Email-to-SMS (FREE)

**For Gmail:**
1. Enable 2-Factor Authentication on your Gmail account
2. Go to Google Account → Security → App Passwords
3. Generate an App Password for "Mail"
4. In SMS Settings:
   - Provider: **Email-to-SMS (FREE)**
   - SMTP Server: `smtp.gmail.com`
   - SMTP Port: `587`
   - Email: Your Gmail address
   - App Password: The generated app password
5. Click **Save Settings**

**For other email providers:**
- Outlook: `smtp-mail.outlook.com`, port `587`
- Yahoo: `smtp.mail.yahoo.com`, port `587`
- Custom: Use your provider's SMTP settings

### 3. Test Sending SMS
1. Click **Send SMS** button
2. Enter a phone number (10 digits, US only for email-to-SMS)
3. Type your message (160 character limit)
4. Click **Send**

### 4. Enable Auto-Send for Rewards
- Check **Auto-send SMS when customers earn rewards**
- Check **Auto-send SMS when customers redeem rewards**
- Save settings

Now SMS will automatically send when customers earn/redeem points!

## 🔄 Migrate to AWS SNS (When Ready)

### Why Migrate?
- **Better reliability** - Delivery confirmation
- **Lower cost** - ~$0.006 per SMS (very cheap!)
- **International support** - Works worldwide
- **No carrier detection needed** - Direct SMS delivery

### Migration Steps:
1. Create AWS account (if you don't have one)
2. Go to IAM → Create User → Programmatic access
3. Attach policy: `AmazonSNSFullAccess` (or create custom policy)
4. Save Access Key ID and Secret Access Key
5. In SMS Settings:
   - Change Provider to **AWS SNS**
   - Enter AWS Access Key ID
   - Enter AWS Secret Access Key
   - Set Region (default: `us-east-1`)
6. Click **Save Settings**

Or use the **Migrate to AWS SNS** button (if currently on email provider)

## 📱 Features

### Settings Tab
- Configure SMS provider (Email or AWS)
- Set up credentials
- Enable/disable auto-send features
- Business name configuration

### Messages Tab
- View all sent SMS messages
- See delivery status
- Filter by customer, phone, status
- View provider used (email/aws_sns)

### Templates Tab
- Create reusable message templates
- Use variables: `{customer_name}`, `{points_earned}`, `{total_points}`
- Categories: Rewards, Promotion, Reminder, Custom

### Send SMS
- Manual SMS sending
- Customer lookup
- Character counter (160 limit)

## 🔧 API Integration

### Send Rewards Earned SMS (Automatic)
When a customer earns points, call:
```python
POST /api/sms/rewards/earned
{
  "store_id": 1,
  "customer_id": 123,
  "points_earned": 50,
  "total_points": 250
}
```

### Send Manual SMS
```python
POST /api/sms/send
{
  "store_id": 1,
  "phone_number": "5551234567",
  "message_text": "Your message here",
  "customer_id": 123  # Optional
}
```

## 📊 Database Tables

- `stores` - Store information
- `sms_settings` - Per-store SMS configuration
- `sms_messages` - Message history
- `sms_templates` - Reusable message templates
- `sms_opt_outs` - Compliance (phone numbers that opted out)

## ⚠️ Email-to-SMS Limitations

- **No delivery confirmation** - Can't verify if message was received
- **US numbers only** - Works best with US phone numbers
- **Carrier detection** - Tries multiple carriers (may not work for all)
- **Rate limiting** - Some carriers may throttle/block
- **Spam filtering** - Messages may be filtered

**Recommendation:** Use email-to-SMS for testing, migrate to AWS SNS for production.

## 💰 Cost Comparison

| Provider | Cost | Reliability | Delivery Confirmation |
|----------|------|-------------|----------------------|
| Email-to-SMS | FREE | ⚠️ Low | ❌ No |
| AWS SNS | ~$0.006/SMS | ✅ High | ✅ Yes |

## 🎯 Next Steps

1. ✅ Configure email settings
2. ✅ Test sending SMS
3. ✅ Enable auto-send for rewards
4. ⏭️ Monitor message delivery
5. ⏭️ Migrate to AWS SNS when ready for production

## 📝 Notes

- Each store can have its own SMS provider configuration
- Messages are stored in database for history
- Opt-out compliance is built-in
- Templates support variable substitution
- Character limit: 160 (SMS standard)

## 🆘 Troubleshooting

**Email-to-SMS not working?**
- Check SMTP credentials are correct
- Verify Gmail App Password (not regular password)
- Try different carrier gateways
- Check if phone number is 10 digits (US)

**AWS SNS not working?**
- Verify AWS credentials have SNS permissions
- Check region is correct
- Ensure boto3 is installed: `pip install boto3`
- Verify phone number format (E.164)

**Messages not sending?**
- Check SMS Settings are saved
- Verify store_id is correct
- Check opt-out list
- Review error messages in Messages tab

---

**Happy SMS sending! 📱**
