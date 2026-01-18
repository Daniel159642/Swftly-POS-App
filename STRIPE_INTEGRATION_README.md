# Stripe Integration - Hybrid Payment Processing

This system supports three payment processing modes:
1. **Stripe Connect** - Recommended for new stores (we help set up Stripe account)
2. **Stripe Direct** - For stores with existing Stripe accounts (enter API keys)
3. **Cash Only** - Start without card payments

## Setup

### 1. Install Dependencies

```bash
pip install stripe cryptography
```

### 2. Run Migration

```bash
python3 migrate_stripe_integration.py
```

This creates the following tables:
- `stripe_accounts` - For Stripe Connect accounts
- `stripe_credentials` - For direct API keys (encrypted)
- `payment_settings` - Payment configuration

### 3. Environment Variables

For **Stripe Connect** (recommended for onboarding):
```bash
export STRIPE_SECRET_KEY="sk_live_..."  # Your platform Stripe secret key
```

For **encryption** (optional, auto-generated if not set):
```bash
export ENCRYPTION_KEY="your-encryption-key-here"  # For encrypting API keys
```

If `ENCRYPTION_KEY` is not set, a key will be auto-generated and saved to `.encryption_key` file (development only).

## Usage

### Onboarding Flow

The `OnboardingStepPayment` component handles payment setup:

```jsx
import OnboardingStepPayment from './components/OnboardingStepPayment'

<OnboardingStepPayment
  onNext={() => {/* proceed to next step */}}
  onBack={() => {/* go back */}}
  storeEmail="store@example.com"
  storeCountry="US"
/>
```

### API Endpoints

#### Get Payment Settings
```javascript
GET /api/payment-settings
```

#### Update Payment Settings
```javascript
POST /api/payment-settings
{
  "payment_processor": "stripe_connect", // or "stripe_direct" or "cash_only"
  "enabled_payment_methods": "[\"cash\", \"credit_card\"]"
}
```

#### Create Stripe Connect Account
```javascript
POST /api/stripe/connect/create
{
  "email": "store@example.com",
  "country": "US",
  "account_type": "express"
}

// Returns:
{
  "success": true,
  "onboarding_url": "https://connect.stripe.com/...",
  "account_id": "acct_...",
  "stripe_account_id": 1
}
```

#### Check Stripe Connect Status
```javascript
POST /api/stripe/connect/status
{
  "stripe_account_id": 1
}

// Returns:
{
  "success": true,
  "charges_enabled": true,
  "payouts_enabled": true,
  "onboarding_completed": true
}
```

#### Validate Stripe Direct Keys
```javascript
POST /api/stripe/credentials/validate
{
  "publishable_key": "pk_test_...",
  "secret_key": "sk_test_..."
}

// Returns:
{
  "success": true,
  "credential_id": 1,
  "test_mode": 1,
  "account_id": "acct_..."
}
```

#### Get Stripe Config (for payment processing)
```javascript
GET /api/stripe/config

// Returns:
{
  "success": true,
  "config": {
    "payment_processor": "stripe_connect",
    "default_currency": "usd",
    "enabled_payment_methods": ["cash", "credit_card"],
    "stripe_connect": {
      "account_id": "acct_...",
      "charges_enabled": true,
      "payouts_enabled": true
    }
  }
}
```

## Database Functions

### Get Payment Settings
```python
from database import get_payment_settings

settings = get_payment_settings(store_id=None)  # None for single store
```

### Get Stripe Configuration
```python
from database import get_stripe_config

config = get_stripe_config(store_id=None)
# Returns decrypted config with all Stripe settings
```

### Create Stripe Connect Account
```python
from database import create_stripe_connect_account

account = create_stripe_connect_account(
    store_id=None,
    account_type='express',
    email='store@example.com',
    country='US'
)
```

### Update Payment Settings
```python
from database import update_payment_settings

update_payment_settings(
    payment_processor='stripe_connect',
    stripe_account_id=1,
    enabled_payment_methods='["cash", "credit_card"]'
)
```

## Security

- **API Keys are encrypted** using Fernet (symmetric encryption)
- Encryption key should be stored in environment variable `ENCRYPTION_KEY` in production
- Secret keys are never exposed in API responses
- Use HTTPS in production

## Payment Processing

When processing payments, use the `get_stripe_config()` function to get the correct Stripe configuration:

```python
from database import get_stripe_config
import stripe

config = get_stripe_config()

if config['payment_processor'] == 'stripe_connect':
    # Use Stripe Connect
    stripe.api_key = os.getenv('STRIPE_SECRET_KEY')  # Platform key
    # Create payment intent on connected account
    intent = stripe.PaymentIntent.create(
        amount=amount_cents,
        currency='usd',
        on_behalf_of=config['stripe_connect']['account_id'],
        transfer_data={'destination': config['stripe_connect']['account_id']}
    )
elif config['payment_processor'] == 'stripe_direct':
    # Use direct API keys
    stripe.api_key = config['stripe_direct']['secret_key']
    intent = stripe.PaymentIntent.create(
        amount=amount_cents,
        currency='usd'
    )
else:
    # Cash only
    pass
```

## Integration with Onboarding

The payment step should be integrated into your onboarding flow:

1. **Step 1**: Store Information
2. **Step 2**: Tax & Payment Settings ← Add payment step here
3. **Step 3**: Inventory Import
4. **Step 4**: Employee Setup
5. **Step 5**: Preferences

The `OnboardingStepPayment` component handles all three payment modes and automatically saves the configuration.

## Testing

### Test Stripe Connect
1. Use test mode: Set `STRIPE_SECRET_KEY` to a test key (`sk_test_...`)
2. Create account via API
3. Complete onboarding in Stripe test mode
4. Check status via API

### Test Stripe Direct
1. Get test keys from Stripe Dashboard
2. Use `/api/stripe/credentials/validate` endpoint
3. Keys are validated and encrypted before saving

### Test Cash Only
1. Select "Cash Only" option
2. Payment settings are saved with `payment_processor: 'cash_only'`

## Troubleshooting

### "Stripe not configured" error
- Set `STRIPE_SECRET_KEY` environment variable
- For Stripe Connect, this should be your platform account key

### "Encryption error"
- Check that `cryptography` package is installed
- Ensure `ENCRYPTION_KEY` is set (or let it auto-generate for development)

### "Invalid API keys"
- Verify keys start with `pk_` (publishable) and `sk_` (secret)
- Check if using test vs live keys
- Ensure keys are from the same Stripe account

### Onboarding not completing
- Check Stripe Connect status via API
- Ensure user completed all steps in Stripe onboarding popup
- Verify `charges_enabled` and `payouts_enabled` are both true

## Next Steps

1. **Integrate into onboarding flow** - Add `OnboardingStepPayment` to your main onboarding component
2. **Update POS system** - Use `get_stripe_config()` when processing payments
3. **Add to Settings page** - Allow users to change payment settings after onboarding
4. **Add webhook handling** - Handle Stripe webhooks for payment events
5. **Add payment processing** - Implement actual payment processing in POS

## Files Created

- `migrate_stripe_integration.py` - Database migration
- `encryption_utils.py` - Encryption utilities for API keys
- `frontend/src/components/OnboardingStepPayment.jsx` - Payment setup component
- Database functions added to `database.py`
- API endpoints added to `web_viewer.py`

## Support

For Stripe-specific questions, see:
- [Stripe Connect Documentation](https://stripe.com/docs/connect)
- [Stripe API Reference](https://stripe.com/docs/api)
