import { useState, useEffect } from 'react'
import { useTheme } from '../contexts/ThemeContext'
import OnboardingHeader from './OnboardingHeader'
import { ArrowLeft } from 'lucide-react'

// State tax rates (approximate average state sales tax rates)
const STATE_TAX_RATES = {
  'AL': 4.00, 'AK': 0.00, 'AZ': 5.60, 'AR': 6.50, 'CA': 7.25,
  'CO': 2.90, 'CT': 6.35, 'DE': 0.00, 'FL': 6.00, 'GA': 4.00,
  'HI': 4.17, 'ID': 6.00, 'IL': 6.25, 'IN': 7.00, 'IA': 6.00,
  'KS': 6.50, 'KY': 6.00, 'LA': 4.45, 'ME': 5.50, 'MD': 6.00,
  'MA': 6.25, 'MI': 6.00, 'MN': 6.88, 'MS': 7.00, 'MO': 4.23,
  'MT': 0.00, 'NE': 5.50, 'NV': 6.85, 'NH': 0.00, 'NJ': 6.63,
  'NM': 5.13, 'NY': 4.00, 'NC': 4.75, 'ND': 5.00, 'OH': 5.75,
  'OK': 4.50, 'OR': 0.00, 'PA': 6.00, 'RI': 7.00, 'SC': 6.00,
  'SD': 4.50, 'TN': 7.00, 'TX': 6.25, 'UT': 6.10, 'VT': 6.00,
  'VA': 5.30, 'WA': 6.50, 'WV': 6.00, 'WI': 5.00, 'WY': 4.00,
  'DC': 6.00
}

function OnboardingStepPayment({ onNext, onBack, storeEmail, storeCountry = 'US', storeState, direction = 'forward' }) {
  const { themeColor } = useTheme()
  const [paymentMethod, setPaymentMethod] = useState('cash_only') // 'stripe_connect', 'stripe_direct', 'cash_only'
  const [payrollPartner, setPayrollPartner] = useState('self') // 'self', 'gusto', 'adp', 'rippling'
  const [taxRate, setTaxRate] = useState('')
  const [taxIncluded, setTaxIncluded] = useState(false) // false = add on top, true = already included in prices
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  
  // Stripe Connect state
  const [connectOnboardingUrl, setConnectOnboardingUrl] = useState('')
  const [connectAccountId, setConnectAccountId] = useState('')
  const [connectStatus, setConnectStatus] = useState(null)
  const [checkingStatus, setCheckingStatus] = useState(false)
  
  // Stripe Direct state
  const [stripeKeys, setStripeKeys] = useState({
    publishable: '',
    secret: ''
  })
  const [showKeys, setShowKeys] = useState(false)
  
  // Convert hex to RGB
  const hexToRgb = (hex) => {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex)
    return result ? `${parseInt(result[1], 16)}, ${parseInt(result[2], 16)}, ${parseInt(result[3], 16)}` : '132, 0, 255'
  }
  
  const themeColorRgb = hexToRgb(themeColor)
  
  // Auto-fill tax rate based on state if not already set
  useEffect(() => {
    if (storeState && !taxRate && STATE_TAX_RATES[storeState]) {
      setTaxRate(STATE_TAX_RATES[storeState].toString())
    }
  }, [storeState, taxRate])
  
  const handleStripeConnect = async () => {
    setLoading(true)
    setError('')
    setSuccess('')
    
    try {
      const response = await fetch('/api/stripe/connect/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: storeEmail || 'store@example.com',
          country: storeCountry,
          account_type: 'express'
        })
      })
      
      const data = await response.json()
      
      if (data.success) {
        setConnectOnboardingUrl(data.onboarding_url)
        setConnectAccountId(data.account_id)
        setSuccess('Stripe account created! Opening onboarding...')
        
        // Open Stripe onboarding in new window
        window.open(data.onboarding_url, '_blank', 'width=800,height=600')
        
        // Start polling for status
        pollConnectStatus(data.stripe_account_id)
      } else {
        setError(data.message || 'Failed to create Stripe account')
      }
    } catch (err) {
      setError('Network error. Please try again.')
      console.error('Stripe Connect error:', err)
    } finally {
      setLoading(false)
    }
  }
  
  const pollConnectStatus = async (stripeAccountId) => {
    setCheckingStatus(true)
    
    const checkStatus = async () => {
      try {
        const response = await fetch('/api/stripe/connect/status', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ stripe_account_id: stripeAccountId })
        })
        
        const data = await response.json()
        
        if (data.success) {
          setConnectStatus(data)
          
          if (data.onboarding_completed) {
            setSuccess('Stripe account setup complete!')
            // Auto-advance after 2 seconds
            setTimeout(() => {
              handleNext()
            }, 2000)
          } else {
            // Check again in 3 seconds
            setTimeout(checkStatus, 3000)
          }
        }
      } catch (err) {
        console.error('Status check error:', err)
        // Retry in 5 seconds
        setTimeout(checkStatus, 5000)
      }
    }
    
    // Start checking
    checkStatus()
  }
  
  const handleValidateKeys = async () => {
    setLoading(true)
    setError('')
    setSuccess('')
    
    if (!stripeKeys.publishable.trim() || !stripeKeys.secret.trim()) {
      setError('Please enter both publishable and secret keys')
      setLoading(false)
      return
    }
    
    try {
      const response = await fetch('/api/stripe/credentials/validate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          publishable_key: stripeKeys.publishable.trim(),
          secret_key: stripeKeys.secret.trim()
        })
      })
      
      const data = await response.json()
      
      if (data.success) {
        setSuccess('Stripe credentials validated and saved!')
        setPaymentMethod('stripe_direct')
        // Auto-advance after 1 second
        setTimeout(() => {
          handleNext()
        }, 1000)
      } else {
        setError(data.message || 'Failed to validate credentials')
      }
    } catch (err) {
      setError('Network error. Please try again.')
      console.error('Validation error:', err)
    } finally {
      setLoading(false)
    }
  }
  
  const handleNext = () => {
    // Save payment settings
    // Update payment settings
    const enabledMethods = paymentMethod === 'cash_only' 
      ? ['cash'] 
      : paymentMethod === 'stripe_connect' || paymentMethod === 'stripe_direct'
      ? ['cash', 'credit_card', 'debit_card']
      : ['cash']
    
    fetch('/api/payment-settings', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        payment_processor: paymentMethod,
        enabled_payment_methods: JSON.stringify(enabledMethods)
      })
    }).catch(console.error)
    
    onNext()
  }
  
  return (
    <div style={{ 
      maxWidth: '800px', 
      margin: '0 auto', 
      padding: '40px 20px',
      position: 'relative'
    }}>
      <button
        onClick={onBack}
        style={{
          position: 'absolute',
          top: '20px',
          left: '20px',
          padding: '8px',
          backgroundColor: `rgba(${themeColorRgb}, 0.2)`,
          backdropFilter: 'blur(10px)',
          WebkitBackdropFilter: 'blur(10px)',
          color: `rgba(${themeColorRgb}, 1)`,
          border: `1px solid rgba(${themeColorRgb}, 0.3)`,
          borderRadius: '8px',
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          boxShadow: `0 2px 8px rgba(${themeColorRgb}, 0.1)`,
          transition: 'all 0.3s ease'
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.backgroundColor = `rgba(${themeColorRgb}, 0.3)`
          e.currentTarget.style.boxShadow = `0 4px 12px rgba(${themeColorRgb}, 0.15)`
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.backgroundColor = `rgba(${themeColorRgb}, 0.2)`
          e.currentTarget.style.boxShadow = `0 2px 8px rgba(${themeColorRgb}, 0.1)`
        }}
      >
        <ArrowLeft size={20} />
      </button>
      <div style={{ paddingTop: '60px' }}>
        <h2 style={{ 
          marginBottom: '30px',
          color: 'var(--text-primary, #000)',
          fontSize: '28px',
          fontWeight: 600
        }}>
          Payment Processing Setup
        </h2>
      
      <p style={{ 
        marginBottom: '30px',
        color: 'var(--text-secondary, #666)',
        fontSize: '16px',
        lineHeight: '1.6'
      }}>
        Choose how you want to accept payments. You can always change this later in settings.
      </p>
      
      {/* Payment Method Selection */}
      <div style={{ marginBottom: '30px' }}>
        <div style={{
          display: 'flex',
          flexDirection: 'column',
          gap: '15px'
        }}>
          {/* Stripe Connect Option */}
          <div
            onClick={() => setPaymentMethod('stripe_connect')}
            style={{
              padding: '20px',
              border: `2px solid ${paymentMethod === 'stripe_connect' ? `rgba(${themeColorRgb}, 0.7)` : '#e0e0e0'}`,
              borderRadius: '8px',
              cursor: 'pointer',
              backgroundColor: paymentMethod === 'stripe_connect' 
                ? `rgba(${themeColorRgb}, 0.1)` 
                : 'var(--bg-secondary, #f5f5f5)',
              transition: 'all 0.2s'
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
              <input
                type="radio"
                checked={paymentMethod === 'stripe_connect'}
                onChange={() => setPaymentMethod('stripe_connect')}
                style={{ width: '20px', height: '20px', cursor: 'pointer' }}
              />
              <div style={{ flex: 1 }}>
                <h3 style={{ margin: '0 0 5px 0', fontSize: '18px', fontWeight: 600 }}>
                  Stripe Connect (Recommended)
                </h3>
                <p style={{ margin: 0, color: 'var(--text-secondary, #666)', fontSize: '14px' }}>
                  We'll help you set up a Stripe account. Funds go directly to your bank account.
                </p>
              </div>
            </div>
            
            {paymentMethod === 'stripe_connect' && (
              <div style={{ marginTop: '20px', paddingTop: '20px', borderTop: '1px solid #e0e0e0' }}>
                {!connectOnboardingUrl ? (
                  <button
                    onClick={handleStripeConnect}
                    disabled={loading}
                    style={{
                      padding: '12px 24px',
                      backgroundColor: `rgba(${themeColorRgb}, 1)`,
                      color: '#fff',
                      border: 'none',
                      borderRadius: '6px',
                      cursor: loading ? 'not-allowed' : 'pointer',
                      fontSize: '16px',
                      fontWeight: 500,
                      opacity: loading ? 0.6 : 1
                    }}
                  >
                    {loading ? 'Creating Account...' : 'Start Stripe Setup'}
                  </button>
                ) : (
                  <div>
                    <p style={{ marginBottom: '10px', color: 'var(--text-secondary, #666)' }}>
                      Complete the Stripe onboarding in the popup window.
                    </p>
                    {connectStatus && (
                      <div style={{
                        padding: '12px',
                        backgroundColor: connectStatus.onboarding_completed 
                          ? '#d4edda' 
                          : '#fff3cd',
                        borderRadius: '6px',
                        marginBottom: '10px'
                      }}>
                        <p style={{ margin: 0, fontSize: '14px' }}>
                          {connectStatus.onboarding_completed
                            ? '✓ Stripe account setup complete!'
                            : 'Setting up your account...'}
                        </p>
                      </div>
                    )}
                    <button
                      onClick={() => window.open(connectOnboardingUrl, '_blank')}
                      style={{
                        padding: '8px 16px',
                        backgroundColor: 'transparent',
                        color: `rgba(${themeColorRgb}, 1)`,
                        border: `1px solid rgba(${themeColorRgb}, 1)`,
                        borderRadius: '6px',
                        cursor: 'pointer',
                        fontSize: '14px'
                      }}
                    >
                      Open Stripe Onboarding
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
          
          {/* Stripe Direct Option */}
          <div
            onClick={() => setPaymentMethod('stripe_direct')}
            style={{
              padding: '20px',
              border: `2px solid ${paymentMethod === 'stripe_direct' ? `rgba(${themeColorRgb}, 0.7)` : '#e0e0e0'}`,
              borderRadius: '8px',
              cursor: 'pointer',
              backgroundColor: paymentMethod === 'stripe_direct' 
                ? `rgba(${themeColorRgb}, 0.1)` 
                : 'var(--bg-secondary, #f5f5f5)',
              transition: 'all 0.2s'
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
              <input
                type="radio"
                checked={paymentMethod === 'stripe_direct'}
                onChange={() => setPaymentMethod('stripe_direct')}
                style={{ width: '20px', height: '20px', cursor: 'pointer' }}
              />
              <div style={{ flex: 1 }}>
                <h3 style={{ margin: '0 0 5px 0', fontSize: '18px', fontWeight: 600 }}>
                  I Have My Own Stripe Account
                </h3>
                <p style={{ margin: 0, color: 'var(--text-secondary, #666)', fontSize: '14px' }}>
                  Enter your Stripe API keys from your existing Stripe account.
                </p>
              </div>
            </div>
            
            {paymentMethod === 'stripe_direct' && (
              <div style={{ marginTop: '20px', paddingTop: '20px', borderTop: '1px solid #e0e0e0' }}>
                <div style={{ marginBottom: '15px' }}>
                  <label style={{ 
                    display: 'block', 
                    marginBottom: '8px', 
                    fontWeight: 500,
                    fontSize: '14px'
                  }}>
                    Publishable Key (pk_...)
                  </label>
                  <input
                    type="text"
                    value={stripeKeys.publishable}
                    onChange={(e) => setStripeKeys({...stripeKeys, publishable: e.target.value})}
                    placeholder="pk_test_..."
                    style={{
                      width: '100%',
                      padding: '10px',
                      border: '1px solid #ddd',
                      borderRadius: '6px',
                      fontSize: '14px'
                    }}
                  />
                </div>
                
                <div style={{ marginBottom: '15px' }}>
                  <label style={{ 
                    display: 'block', 
                    marginBottom: '8px', 
                    fontWeight: 500,
                    fontSize: '14px'
                  }}>
                    Secret Key (sk_...)
                  </label>
                  <div style={{ position: 'relative' }}>
                    <input
                      type={showKeys ? 'text' : 'password'}
                      value={stripeKeys.secret}
                      onChange={(e) => setStripeKeys({...stripeKeys, secret: e.target.value})}
                      placeholder="sk_test_..."
                      style={{
                        width: '100%',
                        padding: '10px',
                        paddingRight: '40px',
                        border: '1px solid #ddd',
                        borderRadius: '6px',
                        fontSize: '14px'
                      }}
                    />
                    <button
                      type="button"
                      onClick={() => setShowKeys(!showKeys)}
                      style={{
                        position: 'absolute',
                        right: '10px',
                        top: '50%',
                        transform: 'translateY(-50%)',
                        background: 'none',
                        border: 'none',
                        cursor: 'pointer',
                        fontSize: '12px',
                        color: 'var(--text-secondary, #666)'
                      }}
                    >
                      {showKeys ? 'Hide' : 'Show'}
                    </button>
                  </div>
                </div>
                
                <button
                  onClick={handleValidateKeys}
                  disabled={loading || !stripeKeys.publishable || !stripeKeys.secret}
                  style={{
                    padding: '12px 20px',
                    backgroundColor: (loading || !stripeKeys.publishable || !stripeKeys.secret) ? `rgba(${themeColorRgb}, 0.4)` : `rgba(${themeColorRgb}, 0.7)`,
                    backdropFilter: 'blur(10px)',
                    WebkitBackdropFilter: 'blur(10px)',
                    color: '#fff',
                    border: (loading || !stripeKeys.publishable || !stripeKeys.secret) ? '1px solid rgba(255, 255, 255, 0.15)' : '1px solid rgba(255, 255, 255, 0.3)',
                    borderRadius: '8px',
                    cursor: (loading || !stripeKeys.publishable || !stripeKeys.secret) ? 'not-allowed' : 'pointer',
                    fontSize: '16px',
                    fontWeight: 600,
                    boxShadow: (loading || !stripeKeys.publishable || !stripeKeys.secret) 
                      ? `0 2px 8px rgba(${themeColorRgb}, 0.2), inset 0 1px 0 rgba(255, 255, 255, 0.15)` 
                      : `0 4px 15px rgba(${themeColorRgb}, 0.3), inset 0 1px 0 rgba(255, 255, 255, 0.2)`,
                    transition: 'all 0.3s ease',
                    opacity: 1
                  }}
                  onMouseEnter={(e) => {
                    if (!loading && stripeKeys.publishable && stripeKeys.secret) {
                      e.currentTarget.style.backgroundColor = `rgba(${themeColorRgb}, 0.8)`
                      e.currentTarget.style.boxShadow = `0 6px 20px rgba(${themeColorRgb}, 0.4), inset 0 1px 0 rgba(255, 255, 255, 0.2)`
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (!loading && stripeKeys.publishable && stripeKeys.secret) {
                      e.currentTarget.style.backgroundColor = `rgba(${themeColorRgb}, 0.7)`
                      e.currentTarget.style.boxShadow = `0 4px 15px rgba(${themeColorRgb}, 0.3), inset 0 1px 0 rgba(255, 255, 255, 0.2)`
                    }
                  }}
                >
                  {loading ? 'Validating...' : 'Validate & Save Keys'}
                </button>
              </div>
            )}
          </div>
          
          {/* Cash Only Option */}
          <div
            onClick={() => setPaymentMethod('cash_only')}
            style={{
              padding: '20px',
              border: `2px solid ${paymentMethod === 'cash_only' ? `rgba(${themeColorRgb}, 0.7)` : '#e0e0e0'}`,
              borderRadius: '8px',
              cursor: 'pointer',
              backgroundColor: paymentMethod === 'cash_only' 
                ? `rgba(${themeColorRgb}, 0.1)` 
                : 'var(--bg-secondary, #f5f5f5)',
              transition: 'all 0.2s'
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
              <input
                type="radio"
                checked={paymentMethod === 'cash_only'}
                onChange={() => setPaymentMethod('cash_only')}
                style={{ width: '20px', height: '20px', cursor: 'pointer' }}
              />
              <div style={{ flex: 1 }}>
                <h3 style={{ margin: '0 0 5px 0', fontSize: '18px', fontWeight: 600 }}>
                  Cash Only (For Now)
                </h3>
                <p style={{ margin: 0, color: 'var(--text-secondary, #666)', fontSize: '14px' }}>
                  Start with cash payments only. You can add card payments later.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
      
      {/* Payroll Partner Selection */}
      <div style={{ marginTop: '40px', marginBottom: '30px' }}>
        <h3 style={{ 
          marginBottom: '15px',
          color: 'var(--text-primary, #000)',
          fontSize: '22px',
          fontWeight: 600
        }}>
          Payroll Partner
        </h3>
        
        <p style={{ 
          marginBottom: '20px',
          color: 'var(--text-secondary, #666)',
          fontSize: '14px',
          lineHeight: '1.6'
        }}>
          Choose which payroll partner you would like to use for employee payroll management.
        </p>
        
        <div style={{
          display: 'flex',
          flexDirection: 'column',
          gap: '12px'
        }}>
          {/* Manage Themselves */}
          <div
            onClick={() => setPayrollPartner('self')}
            style={{
              padding: '16px',
              border: `2px solid ${payrollPartner === 'self' ? `rgba(${themeColorRgb}, 0.7)` : '#e0e0e0'}`,
              borderRadius: '8px',
              cursor: 'pointer',
              backgroundColor: payrollPartner === 'self' 
                ? `rgba(${themeColorRgb}, 0.1)` 
                : 'var(--bg-secondary, #f5f5f5)',
              transition: 'all 0.2s'
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <input
                type="radio"
                checked={payrollPartner === 'self'}
                onChange={() => setPayrollPartner('self')}
                style={{ width: '18px', height: '18px', cursor: 'pointer' }}
              />
              <span style={{ fontSize: '16px', fontWeight: 500, color: 'var(--text-primary, #000)' }}>
                Manage ourselves
              </span>
            </div>
          </div>
          
          {/* Gusto */}
          <div
            onClick={() => setPayrollPartner('gusto')}
            style={{
              padding: '16px',
              border: `2px solid ${payrollPartner === 'gusto' ? `rgba(${themeColorRgb}, 0.7)` : '#e0e0e0'}`,
              borderRadius: '8px',
              cursor: 'pointer',
              backgroundColor: payrollPartner === 'gusto' 
                ? `rgba(${themeColorRgb}, 0.1)` 
                : 'var(--bg-secondary, #f5f5f5)',
              transition: 'all 0.2s'
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <input
                type="radio"
                checked={payrollPartner === 'gusto'}
                onChange={() => setPayrollPartner('gusto')}
                style={{ width: '18px', height: '18px', cursor: 'pointer' }}
              />
              <span style={{ fontSize: '16px', fontWeight: 500, color: 'var(--text-primary, #000)' }}>
                Gusto
              </span>
            </div>
          </div>
          
          {/* ADP */}
          <div
            onClick={() => setPayrollPartner('adp')}
            style={{
              padding: '16px',
              border: `2px solid ${payrollPartner === 'adp' ? `rgba(${themeColorRgb}, 0.7)` : '#e0e0e0'}`,
              borderRadius: '8px',
              cursor: 'pointer',
              backgroundColor: payrollPartner === 'adp' 
                ? `rgba(${themeColorRgb}, 0.1)` 
                : 'var(--bg-secondary, #f5f5f5)',
              transition: 'all 0.2s'
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <input
                type="radio"
                checked={payrollPartner === 'adp'}
                onChange={() => setPayrollPartner('adp')}
                style={{ width: '18px', height: '18px', cursor: 'pointer' }}
              />
              <span style={{ fontSize: '16px', fontWeight: 500, color: 'var(--text-primary, #000)' }}>
                ADP
              </span>
            </div>
          </div>
          
          {/* Rippling */}
          <div
            onClick={() => setPayrollPartner('rippling')}
            style={{
              padding: '16px',
              border: `2px solid ${payrollPartner === 'rippling' ? `rgba(${themeColorRgb}, 0.7)` : '#e0e0e0'}`,
              borderRadius: '8px',
              cursor: 'pointer',
              backgroundColor: payrollPartner === 'rippling' 
                ? `rgba(${themeColorRgb}, 0.1)` 
                : 'var(--bg-secondary, #f5f5f5)',
              transition: 'all 0.2s'
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <input
                type="radio"
                checked={payrollPartner === 'rippling'}
                onChange={() => setPayrollPartner('rippling')}
                style={{ width: '18px', height: '18px', cursor: 'pointer' }}
              />
              <span style={{ fontSize: '16px', fontWeight: 500, color: 'var(--text-primary, #000)' }}>
                Rippling
              </span>
            </div>
          </div>
        </div>
      </div>
      
      {/* Stripe Processing Fee Information */}
      {(paymentMethod === 'stripe_connect' || paymentMethod === 'stripe_direct') && (
        <div style={{
          padding: '15px',
          backgroundColor: `rgba(${themeColorRgb}, 0.05)`,
          border: `1px solid rgba(${themeColorRgb}, 0.2)`,
          borderRadius: '8px',
          marginBottom: '30px'
        }}>
          <p style={{ 
            margin: 0, 
            fontSize: '14px', 
            color: 'var(--text-secondary, #666)',
            lineHeight: '1.6'
          }}>
            <strong>Processing Fees:</strong> Stripe charges 2.9% + $0.30 per credit card transaction. 
            These fees are automatically deducted from each payment.
          </p>
        </div>
      )}
      
      {/* Tax Settings */}
      <div style={{ marginTop: '40px', marginBottom: '30px' }}>
        <h3 style={{ 
          marginBottom: '15px',
          color: 'var(--text-primary, #000)',
          fontSize: '22px',
          fontWeight: 600
        }}>
          Tax Settings
        </h3>
        
        <p style={{ 
          marginBottom: '20px',
          color: 'var(--text-secondary, #666)',
          fontSize: '14px',
          lineHeight: '1.6'
        }}>
          {storeState && STATE_TAX_RATES[storeState] 
            ? `Tax rate has been pre-filled based on your state (${storeState}). You can adjust it if needed.`
            : 'Enter your sales tax rate. You can always change this later in settings.'}
        </p>
        
        {/* Tax Rate Input */}
        <div style={{ marginBottom: '20px' }}>
          <input
            type="number"
            value={taxRate}
            onChange={(e) => setTaxRate(e.target.value)}
            placeholder="Tax Rate (%)"
            min="0"
            max="100"
            step="0.01"
            style={{
              width: '100%',
              padding: '8px 0',
              border: 'none',
              borderBottom: `1px solid rgba(${themeColorRgb}, 1)`,
              borderRadius: '0',
              fontSize: '16px',
              boxSizing: 'border-box',
              backgroundColor: 'transparent',
              outline: 'none'
            }}
          />
        </div>
        
        {/* Tax Included Option */}
        <div style={{
          padding: '15px',
          border: `1px solid ${taxIncluded ? `rgba(${themeColorRgb}, 0.3)` : '#ddd'}`,
          borderRadius: '6px',
          backgroundColor: taxIncluded ? `rgba(${themeColorRgb}, 0.05)` : 'var(--bg-secondary, #f5f5f5)'
        }}>
          <label style={{
            display: 'flex',
            alignItems: 'center',
            gap: '10px',
            cursor: 'pointer',
            fontWeight: 500,
            fontSize: '14px',
            color: 'var(--text-primary, #000)'
          }}>
            <input
              type="checkbox"
              checked={taxIncluded}
              onChange={(e) => setTaxIncluded(e.target.checked)}
              style={{ width: '18px', height: '18px', cursor: 'pointer' }}
            />
            Tax already included in prices (add on top when unchecked)
          </label>
          <p style={{ margin: '8px 0 0 0', color: 'var(--text-secondary, #666)', fontSize: '13px' }}>
            {taxIncluded 
              ? 'Your product prices already include tax. Tax will not be added at checkout.'
              : 'Tax will be added on top of your product prices at checkout.'}
          </p>
        </div>
      </div>
      
      {/* Error/Success Messages */}
      {error && (
        <div style={{
          padding: '12px',
          backgroundColor: '#f8d7da',
          color: '#721c24',
          borderRadius: '6px',
          marginBottom: '20px'
        }}>
          {error}
        </div>
      )}
      
      {success && (
        <div style={{
          padding: '12px',
          backgroundColor: '#d4edda',
          color: '#155724',
          borderRadius: '6px',
          marginBottom: '20px'
        }}>
          {success}
        </div>
      )}
      
      {/* Navigation Buttons */}
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        marginTop: '40px',
        gap: '15px'
      }}>
        <button
          onClick={onBack}
          style={{
            padding: '10px 16px',
            backgroundColor: `rgba(${themeColorRgb}, 0.2)`,
            backdropFilter: 'blur(10px)',
            WebkitBackdropFilter: 'blur(10px)',
            color: '#fff',
            border: `1px solid rgba(${themeColorRgb}, 0.3)`,
            borderRadius: '8px',
            cursor: 'pointer',
            fontSize: '14px',
            fontWeight: 500,
            boxShadow: `0 2px 8px rgba(${themeColorRgb}, 0.1)`,
            transition: 'all 0.3s ease'
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.backgroundColor = `rgba(${themeColorRgb}, 0.3)`
            e.currentTarget.style.boxShadow = `0 4px 12px rgba(${themeColorRgb}, 0.15)`
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.backgroundColor = `rgba(${themeColorRgb}, 0.2)`
            e.currentTarget.style.boxShadow = `0 2px 8px rgba(${themeColorRgb}, 0.1)`
          }}
        >
          Back
        </button>
        
        <button
          onClick={handleNext}
          disabled={paymentMethod === 'stripe_connect' && !connectStatus?.onboarding_completed}
          style={{
            padding: '12px 24px',
            backgroundColor: (paymentMethod === 'stripe_connect' && !connectStatus?.onboarding_completed) ? `rgba(${themeColorRgb}, 0.4)` : `rgba(${themeColorRgb}, 0.7)`,
            backdropFilter: 'blur(10px)',
            WebkitBackdropFilter: 'blur(10px)',
            color: '#fff',
            border: (paymentMethod === 'stripe_connect' && !connectStatus?.onboarding_completed) ? '1px solid rgba(255, 255, 255, 0.15)' : '1px solid rgba(255, 255, 255, 0.3)',
            borderRadius: '8px',
            cursor: (paymentMethod === 'stripe_connect' && !connectStatus?.onboarding_completed) 
              ? 'not-allowed' : 'pointer',
            fontSize: '16px',
            fontWeight: 600,
            boxShadow: (paymentMethod === 'stripe_connect' && !connectStatus?.onboarding_completed)
              ? `0 2px 8px rgba(${themeColorRgb}, 0.2), inset 0 1px 0 rgba(255, 255, 255, 0.15)`
              : `0 4px 15px rgba(${themeColorRgb}, 0.3), inset 0 1px 0 rgba(255, 255, 255, 0.2)`,
            transition: 'all 0.3s ease',
            opacity: 1
          }}
          onMouseEnter={(e) => {
            if (!(paymentMethod === 'stripe_connect' && !connectStatus?.onboarding_completed)) {
              e.currentTarget.style.backgroundColor = `rgba(${themeColorRgb}, 0.8)`
              e.currentTarget.style.boxShadow = `0 6px 20px rgba(${themeColorRgb}, 0.4), inset 0 1px 0 rgba(255, 255, 255, 0.2)`
            }
          }}
          onMouseLeave={(e) => {
            if (!(paymentMethod === 'stripe_connect' && !connectStatus?.onboarding_completed)) {
              e.currentTarget.style.backgroundColor = `rgba(${themeColorRgb}, 0.7)`
              e.currentTarget.style.boxShadow = `0 4px 15px rgba(${themeColorRgb}, 0.3), inset 0 1px 0 rgba(255, 255, 255, 0.2)`
            }
          }}
        >
          {paymentMethod === 'stripe_connect' && !connectStatus?.onboarding_completed
            ? 'Complete Stripe Setup First'
            : 'Continue'}
        </button>
      </div>
      </div>
    </div>
  )
}

export default OnboardingStepPayment
