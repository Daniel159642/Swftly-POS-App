/**
 * SetupWizard — first-time POS setup
 *
 * Steps:
 *   1. Store Info    — store name, type, code, contact details
 *   2. Admin Account — name, email, numeric PIN
 *   3. Payments      — Stripe Connect / own keys / cash only
 *   4. All Set!      — shows credentials, auto-logs in, redirects to dashboard
 *
 * Dev bypass:
 *   • Set SKIP_SETUP=true in the backend .env
 *   • OR: localStorage.setItem('pos_skip_setup', '1') then reload
 */
import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useTheme } from '../contexts/ThemeContext'

const SKIP_KEY = 'pos_skip_setup'

const STORE_TYPES = [
  { id: 'retail',     label: 'Retail',      icon: '🛍️',  desc: 'Clothing, hardware, general merchandise' },
  { id: 'restaurant', label: 'Restaurant',  icon: '🍽️',  desc: 'Dine-in, takeout, full-service' },
  { id: 'cafe',       label: 'Café / Bar',  icon: '☕',  desc: 'Coffee shop, bar, quick service' },
  { id: 'grocery',    label: 'Grocery',     icon: '🛒',  desc: 'Supermarket, deli, convenience store' },
  { id: 'service',    label: 'Services',    icon: '🔧',  desc: 'Salon, repair shop, professional services' },
  { id: 'other',      label: 'Other',       icon: '🏪',  desc: 'Anything else — customize later' },
]

const TIMEZONES = [
  'America/New_York', 'America/Chicago', 'America/Denver', 'America/Los_Angeles',
  'America/Phoenix', 'America/Anchorage', 'Pacific/Honolulu',
  'Europe/London', 'Europe/Paris', 'Europe/Berlin', 'Europe/Madrid',
  'Asia/Tokyo', 'Asia/Shanghai', 'Asia/Kolkata', 'Asia/Dubai',
  'Australia/Sydney', 'Australia/Melbourne', 'Pacific/Auckland',
]

const CURRENCIES = [
  { code: 'USD', label: 'USD — US Dollar' },
  { code: 'CAD', label: 'CAD — Canadian Dollar' },
  { code: 'GBP', label: 'GBP — British Pound' },
  { code: 'EUR', label: 'EUR — Euro' },
  { code: 'AUD', label: 'AUD — Australian Dollar' },
  { code: 'JPY', label: 'JPY — Japanese Yen' },
  { code: 'MXN', label: 'MXN — Mexican Peso' },
  { code: 'BRL', label: 'BRL — Brazilian Real' },
]

function hexToRgb(hex) {
  const r = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex)
  return r ? `${parseInt(r[1], 16)}, ${parseInt(r[2], 16)}, ${parseInt(r[3], 16)}` : '132, 0, 255'
}

function inputStyle(isDark, extra = {}) {
  return {
    width: '100%',
    padding: '11px 14px',
    border: `1px solid ${isDark ? '#404040' : '#e0e0e0'}`,
    borderRadius: '9px',
    fontSize: '14px',
    backgroundColor: isDark ? '#2d2d2d' : '#fff',
    color: isDark ? '#f0f0f0' : '#1a1a1a',
    boxSizing: 'border-box',
    outline: 'none',
    transition: 'border-color 0.15s',
    ...extra,
  }
}

function labelStyle(isDark) {
  return {
    display: 'block',
    fontSize: '12px',
    fontWeight: 600,
    marginBottom: '5px',
    color: isDark ? '#aaa' : '#555',
    textTransform: 'uppercase',
    letterSpacing: '0.05em',
  }
}

function FieldGroup({ label, isDark, children, hint }) {
  return (
    <div style={{ marginBottom: '16px' }}>
      <label style={labelStyle(isDark)}>{label}</label>
      {hint && <p style={{ fontSize: '12px', color: isDark ? '#777' : '#aaa', margin: '0 0 6px' }}>{hint}</p>}
      {children}
    </div>
  )
}

export default function SetupWizard({ onSetupComplete }) {
  const navigate = useNavigate()
  const { themeColor } = useTheme()
  const rgb = hexToRgb(themeColor)
  const isDark = document.documentElement.classList.contains('dark-theme')

  const [step, setStep] = useState(1)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  // ── Step 1 state ──────────────────────────────────────────────────────────
  const [establishmentId, setEstablishmentId] = useState(null)
  const [storeName, setStoreName] = useState('')
  const [storeType, setStoreType] = useState('')
  const [storeCode, setStoreCode] = useState('')
  const [storeCodeError, setStoreCodeError] = useState('')
  const [storePhone, setStorePhone] = useState('')
  const [storeAddress, setStoreAddress] = useState('')
  const [storeWebsite, setStoreWebsite] = useState('')
  const [timezone, setTimezone] = useState(Intl.DateTimeFormat().resolvedOptions().timeZone || 'America/New_York')
  const [currency, setCurrency] = useState('USD')

  // ── Step 2 state ──────────────────────────────────────────────────────────
  const [adminName, setAdminName] = useState('')
  const [adminEmail, setAdminEmail] = useState('')
  const [adminPin, setAdminPin] = useState('')
  const [adminPinConfirm, setAdminPinConfirm] = useState('')
  const [showPin, setShowPin] = useState(false)

  // ── Step 3 state ──────────────────────────────────────────────────────────
  const [paymentMethod, setPaymentMethod] = useState('stripe_connect')
  const [connectOnboardingUrl, setConnectOnboardingUrl] = useState('')
  const [connectStripeAccountId, setConnectStripeAccountId] = useState('')
  const [connectStatus, setConnectStatus] = useState(null)
  const [stripeKeys, setStripeKeys] = useState({ publishable: '', secret: '' })
  const [showStripeKeys, setShowStripeKeys] = useState(false)
  const [paymentLoading, setPaymentLoading] = useState(false)
  const [paymentError, setPaymentError] = useState('')
  const [paymentSuccess, setPaymentSuccess] = useState('')
  const [pollTimerRef] = useState({ current: null })

  // ── Step 4 state ──────────────────────────────────────────────────────────
  const [createdPin, setCreatedPin] = useState('')
  const [createdCode, setCreatedCode] = useState('')
  const [sessionToken, setSessionToken] = useState('')
  const [employeeId, setEmployeeId] = useState(null)

  useEffect(() => {
    fetch('/api/setup/status')
      .then(r => r.json())
      .then(d => {
        const intentional = sessionStorage.getItem('pos_goto_setup') === '1'
        sessionStorage.removeItem('pos_goto_setup')
        if (!d.needs_setup && !localStorage.getItem('sessionToken') && !intentional) {
          navigate('/login', { replace: true })
          return
        }
        setEstablishmentId(d.establishment_id)
        setStoreName(d.establishment_name || '')
        setStoreCode(d.establishment_code || '')
        // Pre-fill from existing settings
        const s = d.settings || {}
        if (s.store_type) setStoreType(s.store_type)
        if (s.phone) setStorePhone(s.phone)
        if (s.address) setStoreAddress(s.address)
        if (s.website) setStoreWebsite(s.website)
        if (s.timezone) setTimezone(s.timezone)
        if (s.currency) setCurrency(s.currency)
      })
      .catch(() => {})
  }, [])

  // ── Handlers ──────────────────────────────────────────────────────────────

  const validateStoreCode = (code) => {
    if (!code) return 'Store code is required'
    if (!/^[A-Z0-9]{2,12}$/.test(code.toUpperCase())) return 'Use 2–12 letters/numbers only'
    return ''
  }

  const handleStep1 = async (e) => {
    e.preventDefault()
    if (!storeType) { setError('Please select a store type'); return }
    const codeErr = validateStoreCode(storeCode)
    if (codeErr) { setStoreCodeError(codeErr); return }
    setStoreCodeError('')
    setError('')
    setLoading(true)
    try {
      const r = await fetch('/api/setup/establishment', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          establishment_id: establishmentId,
          establishment_name: storeName,
          establishment_code: storeCode.toUpperCase(),
          store_type: storeType,
          phone: storePhone,
          address: storeAddress,
          website: storeWebsite,
          timezone,
          currency,
        }),
      })
      const d = await r.json()
      if (!d.success) throw new Error(d.message || 'Failed to save store info')
      setStoreCode(storeCode.toUpperCase())
      setStep(2)
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  const handleStep2 = async (e) => {
    e.preventDefault()
    setError('')
    if (adminPin.length < 4) { setError('PIN must be at least 4 digits'); return }
    if (adminPin !== adminPinConfirm) { setError('PINs do not match'); return }
    setLoading(true)
    try {
      const r = await fetch('/api/setup/create-admin', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          establishment_id: establishmentId,
          email: adminEmail.trim(),
          password: adminPin,
          name: adminName.trim(),
        }),
      })
      const d = await r.json()
      if (!d.success) throw new Error(d.message || 'Failed to create admin account')
      setCreatedPin(adminPin)
      setCreatedCode(storeCode.toUpperCase())
      setSessionToken(d.session_token)
      setEmployeeId(d.employee_id)
      setStep(3)
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  const handleStripeConnect = async () => {
    setPaymentLoading(true)
    setPaymentError('')
    setPaymentSuccess('')
    try {
      const r = await fetch('/api/stripe/connect/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: adminEmail.trim(), country: 'US', account_type: 'express' }),
      })
      const d = await r.json()
      if (!d.success) throw new Error(d.message || 'Failed to create Stripe account')
      setConnectOnboardingUrl(d.onboarding_url)
      setConnectStripeAccountId(d.stripe_account_id)
      setPaymentSuccess('Stripe account created — complete onboarding in the new window.')
      window.open(d.onboarding_url, '_blank', 'width=820,height=640')
      _pollConnectStatus(d.stripe_account_id)
    } catch (err) {
      setPaymentError(err.message)
    } finally {
      setPaymentLoading(false)
    }
  }

  const _pollConnectStatus = (stripeAccountId) => {
    if (pollTimerRef.current) clearTimeout(pollTimerRef.current)
    const check = async () => {
      try {
        const r = await fetch('/api/stripe/connect/status', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ stripe_account_id: stripeAccountId }),
        })
        const d = await r.json()
        if (d.success) {
          setConnectStatus(d)
          if (d.onboarding_completed) {
            setPaymentSuccess("Stripe account connected! You're ready to accept payments.")
            return
          }
        }
      } catch (_) {}
      pollTimerRef.current = setTimeout(check, 4000)
    }
    check()
  }

  const handleValidateStripeKeys = async () => {
    if (!stripeKeys.publishable.trim() || !stripeKeys.secret.trim()) {
      setPaymentError('Enter both publishable and secret keys')
      return
    }
    setPaymentLoading(true)
    setPaymentError('')
    setPaymentSuccess('')
    try {
      const r = await fetch('/api/stripe/credentials/validate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ publishable_key: stripeKeys.publishable.trim(), secret_key: stripeKeys.secret.trim() }),
      })
      const d = await r.json()
      if (!d.success) throw new Error(d.message || 'Invalid credentials')
      setPaymentSuccess('Stripe keys validated and saved.')
    } catch (err) {
      setPaymentError(err.message)
    } finally {
      setPaymentLoading(false)
    }
  }

  const handleStep3 = () => {
    fetch('/api/payment-settings', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${sessionToken}` },
      body: JSON.stringify({
        payment_processor: paymentMethod,
        enabled_payment_methods: JSON.stringify(
          paymentMethod === 'cash_only' ? ['cash'] : ['cash', 'credit_card', 'debit_card']
        ),
      }),
    }).catch(() => {})
    if (pollTimerRef.current) clearTimeout(pollTimerRef.current)
    setStep(4)
  }

  const handleFinish = () => {
    if (sessionToken && employeeId) {
      localStorage.setItem('sessionToken', sessionToken)
      localStorage.setItem('pos_employee', JSON.stringify({
        employee_id: employeeId,
        employee_name: adminName.trim(),
        position: 'admin',
        is_admin: true,
      }))
    }
    if (onSetupComplete) onSetupComplete()
    window.location.href = '/dashboard'
  }

  const devSkip = () => {
    localStorage.setItem(SKIP_KEY, '1')
    navigate('/login', { replace: true })
  }

  // ── Styles ────────────────────────────────────────────────────────────────

  const bg = isDark ? '#111' : '#f5f5f7'
  const cardBg = isDark ? '#1a1a1a' : '#fff'
  const border = isDark ? '#2d2d2d' : '#ebebeb'
  const textPrimary = isDark ? '#f0f0f0' : '#111'
  const textMuted = isDark ? '#888' : '#888'

  const primaryBtn = (disabled) => ({
    width: '100%',
    padding: '13px',
    backgroundColor: disabled ? (isDark ? '#333' : '#e5e5e5') : `rgba(${rgb}, 0.88)`,
    color: disabled ? textMuted : '#fff',
    border: 'none',
    borderRadius: '10px',
    fontSize: '15px',
    fontWeight: 600,
    cursor: disabled ? 'not-allowed' : 'pointer',
    marginTop: '8px',
    transition: 'all 0.2s',
    boxShadow: disabled ? 'none' : `0 4px 14px rgba(${rgb}, 0.3)`,
  })

  const backBtn = {
    flex: 1,
    padding: '13px',
    backgroundColor: 'transparent',
    color: textMuted,
    border: `1px solid ${border}`,
    borderRadius: '10px',
    fontSize: '15px',
    cursor: 'pointer',
  }

  const TOTAL_STEPS = 4
  const stepLabels = ['Store info', 'Admin account', 'Payments', 'All set']

  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: bg,
      padding: '32px 16px',
      fontFamily: 'system-ui, -apple-system, sans-serif',
    }}>
      {/* Progress bar */}
      <div style={{ width: '100%', maxWidth: '520px', marginBottom: '28px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '10px' }}>
          {stepLabels.map((label, i) => (
            <div key={label} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', flex: 1 }}>
              <div style={{
                width: '28px', height: '28px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: '12px', fontWeight: 700,
                backgroundColor: step > i + 1 ? `rgba(${rgb}, 0.88)` : step === i + 1 ? `rgba(${rgb}, 0.88)` : (isDark ? '#333' : '#e8e8e8'),
                color: step >= i + 1 ? '#fff' : textMuted,
                transition: 'all 0.3s',
              }}>
                {step > i + 1 ? '✓' : i + 1}
              </div>
              <span style={{ fontSize: '10px', fontWeight: 500, color: step === i + 1 ? `rgba(${rgb}, 1)` : textMuted, marginTop: '4px', textAlign: 'center', lineHeight: 1.2 }}>
                {label}
              </span>
            </div>
          ))}
        </div>
        <div style={{ height: '3px', backgroundColor: isDark ? '#333' : '#e8e8e8', borderRadius: '2px', overflow: 'hidden' }}>
          <div style={{ height: '100%', width: `${((step - 1) / (TOTAL_STEPS - 1)) * 100}%`, backgroundColor: `rgba(${rgb}, 0.88)`, borderRadius: '2px', transition: 'width 0.4s ease' }} />
        </div>
      </div>

      {/* Card */}
      <div style={{
        backgroundColor: cardBg,
        borderRadius: '18px',
        padding: '36px 40px',
        boxShadow: isDark ? '0 8px 40px rgba(0,0,0,0.5)' : '0 8px 40px rgba(0,0,0,0.08)',
        width: '100%',
        maxWidth: '520px',
        border: `1px solid ${border}`,
      }}>

        {/* ── Step 1: Store Info ── */}
        {step === 1 && (
          <form onSubmit={handleStep1}>
            <div style={{ marginBottom: '28px' }}>
              <h1 style={{ fontSize: '24px', fontWeight: 700, margin: '0 0 6px', color: textPrimary }}>
                Welcome to Swftly
              </h1>
              <p style={{ fontSize: '14px', color: textMuted, margin: 0 }}>
                Tell us about your store — takes about 2 minutes.
              </p>
            </div>

            {/* Store Name */}
            <FieldGroup label="Store name" isDark={isDark}>
              <input
                type="text"
                value={storeName}
                onChange={e => setStoreName(e.target.value)}
                placeholder="e.g. The Corner Market"
                required
                style={inputStyle(isDark)}
              />
            </FieldGroup>

            {/* Store Type */}
            <div style={{ marginBottom: '20px' }}>
              <label style={labelStyle(isDark)}>Store type</label>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '8px' }}>
                {STORE_TYPES.map(({ id, label, icon, desc }) => {
                  const sel = storeType === id
                  return (
                    <button
                      key={id}
                      type="button"
                      onClick={() => { setStoreType(id); setError('') }}
                      title={desc}
                      style={{
                        padding: '10px 8px',
                        border: `2px solid ${sel ? `rgba(${rgb}, 0.8)` : (isDark ? '#333' : '#e0e0e0')}`,
                        borderRadius: '10px',
                        cursor: 'pointer',
                        backgroundColor: sel ? `rgba(${rgb}, 0.09)` : (isDark ? '#222' : '#fafafa'),
                        transition: 'all 0.15s',
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        gap: '4px',
                      }}
                    >
                      <span style={{ fontSize: '20px' }}>{icon}</span>
                      <span style={{ fontSize: '11px', fontWeight: 600, color: sel ? `rgba(${rgb}, 1)` : textPrimary }}>{label}</span>
                    </button>
                  )
                })}
              </div>
            </div>

            {/* Store Code */}
            <FieldGroup
              label="Store code"
              isDark={isDark}
              hint="Employees enter this on first login. 2–12 letters/numbers."
            >
              <input
                type="text"
                value={storeCode}
                onChange={e => { setStoreCode(e.target.value.toUpperCase()); setStoreCodeError('') }}
                placeholder="e.g. MAIN or STORE1"
                maxLength={12}
                required
                style={inputStyle(isDark, {
                  fontFamily: 'monospace',
                  letterSpacing: '0.1em',
                  textTransform: 'uppercase',
                  borderColor: storeCodeError ? '#ef4444' : undefined,
                })}
              />
              {storeCodeError && <p style={{ fontSize: '12px', color: '#ef4444', margin: '4px 0 0' }}>{storeCodeError}</p>}
            </FieldGroup>

            {/* Phone + Address side by side */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
              <FieldGroup label="Phone (optional)" isDark={isDark}>
                <input
                  type="tel"
                  value={storePhone}
                  onChange={e => setStorePhone(e.target.value)}
                  placeholder="+1 (555) 000-0000"
                  style={inputStyle(isDark)}
                />
              </FieldGroup>
              <FieldGroup label="Website (optional)" isDark={isDark}>
                <input
                  type="url"
                  value={storeWebsite}
                  onChange={e => setStoreWebsite(e.target.value)}
                  placeholder="https://yourstore.com"
                  style={inputStyle(isDark)}
                />
              </FieldGroup>
            </div>

            <FieldGroup label="Address (optional)" isDark={isDark}>
              <input
                type="text"
                value={storeAddress}
                onChange={e => setStoreAddress(e.target.value)}
                placeholder="123 Main St, City, State ZIP"
                style={inputStyle(isDark)}
              />
            </FieldGroup>

            {/* Timezone + Currency */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
              <FieldGroup label="Timezone" isDark={isDark}>
                <select
                  value={timezone}
                  onChange={e => setTimezone(e.target.value)}
                  style={{ ...inputStyle(isDark), cursor: 'pointer' }}
                >
                  {TIMEZONES.map(tz => (
                    <option key={tz} value={tz}>{tz.replace('_', ' ')}</option>
                  ))}
                </select>
              </FieldGroup>
              <FieldGroup label="Currency" isDark={isDark}>
                <select
                  value={currency}
                  onChange={e => setCurrency(e.target.value)}
                  style={{ ...inputStyle(isDark), cursor: 'pointer' }}
                >
                  {CURRENCIES.map(c => (
                    <option key={c.code} value={c.code}>{c.label}</option>
                  ))}
                </select>
              </FieldGroup>
            </div>

            {error && (
              <div style={{ padding: '10px 14px', backgroundColor: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.3)', borderRadius: '8px', color: '#ef4444', fontSize: '13px', marginTop: '8px' }}>
                {error}
              </div>
            )}

            <button type="submit" disabled={loading || !storeName || !storeType} style={primaryBtn(loading || !storeName || !storeType)}>
              {loading ? 'Saving…' : 'Continue →'}
            </button>
          </form>
        )}

        {/* ── Step 2: Admin Account ── */}
        {step === 2 && (
          <form onSubmit={handleStep2}>
            <div style={{ marginBottom: '28px' }}>
              <h1 style={{ fontSize: '24px', fontWeight: 700, margin: '0 0 6px', color: textPrimary }}>
                Create your admin account
              </h1>
              <p style={{ fontSize: '14px', color: textMuted, margin: 0 }}>
                This is the owner account with full access to everything.
              </p>
            </div>

            <FieldGroup label="Full name" isDark={isDark}>
              <input
                type="text"
                value={adminName}
                onChange={e => setAdminName(e.target.value)}
                placeholder="Your name"
                required
                autoFocus
                style={inputStyle(isDark)}
              />
            </FieldGroup>

            <FieldGroup label="Email address" isDark={isDark}>
              <input
                type="email"
                value={adminEmail}
                onChange={e => setAdminEmail(e.target.value)}
                placeholder="you@example.com"
                required
                style={inputStyle(isDark)}
              />
            </FieldGroup>

            <FieldGroup
              label="PIN (4–8 digits)"
              isDark={isDark}
              hint="You'll type this PIN to log into the POS quickly."
            >
              <div style={{ position: 'relative' }}>
                <input
                  type={showPin ? 'text' : 'password'}
                  inputMode="numeric"
                  value={adminPin}
                  onChange={e => setAdminPin(e.target.value.replace(/\D/g, '').slice(0, 8))}
                  placeholder="4–8 digits"
                  required
                  style={inputStyle(isDark, { letterSpacing: '0.25em', fontFamily: 'monospace', fontSize: '22px', paddingRight: '52px' })}
                />
                <button
                  type="button"
                  onClick={() => setShowPin(v => !v)}
                  style={{ position: 'absolute', right: '14px', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', fontSize: '12px', color: textMuted, fontWeight: 600 }}
                >
                  {showPin ? 'Hide' : 'Show'}
                </button>
              </div>
            </FieldGroup>

            <FieldGroup label="Confirm PIN" isDark={isDark}>
              <input
                type="password"
                inputMode="numeric"
                value={adminPinConfirm}
                onChange={e => setAdminPinConfirm(e.target.value.replace(/\D/g, '').slice(0, 8))}
                placeholder="Repeat PIN"
                required
                style={inputStyle(isDark, {
                  letterSpacing: '0.25em',
                  fontFamily: 'monospace',
                  fontSize: '22px',
                  borderColor: adminPinConfirm && adminPin !== adminPinConfirm ? '#ef4444' : undefined,
                })}
              />
              {adminPinConfirm && adminPin !== adminPinConfirm && (
                <p style={{ fontSize: '12px', color: '#ef4444', margin: '4px 0 0' }}>PINs don't match</p>
              )}
            </FieldGroup>

            {error && (
              <div style={{ padding: '10px 14px', backgroundColor: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.3)', borderRadius: '8px', color: '#ef4444', fontSize: '13px', marginTop: '4px' }}>
                {error}
              </div>
            )}

            <div style={{ display: 'flex', gap: '10px', marginTop: '20px' }}>
              <button type="button" onClick={() => { setStep(1); setError('') }} style={backBtn}>← Back</button>
              <button
                type="submit"
                disabled={loading || !adminName || !adminEmail || adminPin.length < 4 || adminPin !== adminPinConfirm}
                style={{ ...primaryBtn(loading || !adminName || !adminEmail || adminPin.length < 4 || adminPin !== adminPinConfirm), flex: 2, marginTop: 0 }}
              >
                {loading ? 'Creating…' : 'Create account →'}
              </button>
            </div>
          </form>
        )}

        {/* ── Step 3: Payments ── */}
        {step === 3 && (
          <div>
            <div style={{ marginBottom: '24px' }}>
              <h1 style={{ fontSize: '24px', fontWeight: 700, margin: '0 0 6px', color: textPrimary }}>
                Payment processing
              </h1>
              <p style={{ fontSize: '14px', color: textMuted, margin: 0 }}>
                Choose how you accept card payments. You can change this later in Settings.
              </p>
            </div>

            {['stripe_connect', 'stripe_direct', 'cash_only'].map((opt) => {
              const labels = {
                stripe_connect: ['Stripe Connect (Recommended)', 'We create a Stripe account for you — funds go straight to your bank.'],
                stripe_direct:  ['I have a Stripe account',      'Enter your existing Stripe API keys.'],
                cash_only:      ['Cash only for now',            'Skip card payments — set up Stripe later in Settings.'],
              }
              const selected = paymentMethod === opt
              return (
                <div
                  key={opt}
                  onClick={() => { setPaymentMethod(opt); setPaymentError(''); setPaymentSuccess('') }}
                  style={{
                    padding: '14px 16px',
                    border: `2px solid ${selected ? `rgba(${rgb}, 0.75)` : (isDark ? '#333' : '#e5e5e5')}`,
                    borderRadius: '10px',
                    cursor: 'pointer',
                    backgroundColor: selected ? `rgba(${rgb}, 0.07)` : (isDark ? '#222' : '#fafafa'),
                    marginBottom: '10px',
                    transition: 'all 0.15s',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <div style={{
                      width: '18px', height: '18px', borderRadius: '50%', flexShrink: 0,
                      border: `2px solid ${selected ? `rgba(${rgb}, 0.85)` : (isDark ? '#555' : '#ccc')}`,
                      backgroundColor: selected ? `rgba(${rgb}, 0.85)` : 'transparent',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                    }}>
                      {selected && <div style={{ width: '7px', height: '7px', borderRadius: '50%', backgroundColor: '#fff' }} />}
                    </div>
                    <div>
                      <div style={{ fontSize: '14px', fontWeight: 600, color: textPrimary }}>{labels[opt][0]}</div>
                      <div style={{ fontSize: '12px', color: textMuted, marginTop: '2px' }}>{labels[opt][1]}</div>
                    </div>
                  </div>

                  {opt === 'stripe_connect' && selected && (
                    <div style={{ marginTop: '12px', paddingTop: '12px', borderTop: `1px solid ${isDark ? '#333' : '#eee'}` }}>
                      {!connectOnboardingUrl ? (
                        <button
                          onClick={e => { e.stopPropagation(); handleStripeConnect() }}
                          disabled={paymentLoading}
                          style={{ padding: '9px 20px', fontSize: '13px', fontWeight: 600, background: `rgba(${rgb}, 0.85)`, color: '#fff', border: 'none', borderRadius: '8px', cursor: paymentLoading ? 'not-allowed' : 'pointer', opacity: paymentLoading ? 0.5 : 1 }}
                        >
                          {paymentLoading ? 'Creating…' : 'Connect with Stripe →'}
                        </button>
                      ) : connectStatus?.onboarding_completed ? (
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#22c55e', fontSize: '13px', fontWeight: 600 }}>✓ Stripe connected</div>
                      ) : (
                        <div>
                          <div style={{ fontSize: '12px', color: textMuted, marginBottom: '8px' }}>Complete onboarding in the Stripe window, then return here.</div>
                          <button onClick={e => { e.stopPropagation(); window.open(connectOnboardingUrl, '_blank') }} style={{ fontSize: '12px', padding: '7px 14px', background: 'transparent', border: `1px solid rgba(${rgb}, 0.6)`, color: `rgba(${rgb}, 1)`, borderRadius: '7px', cursor: 'pointer' }}>
                            Re-open Stripe →
                          </button>
                        </div>
                      )}
                    </div>
                  )}

                  {opt === 'stripe_direct' && selected && (
                    <div style={{ marginTop: '12px', paddingTop: '12px', borderTop: `1px solid ${isDark ? '#333' : '#eee'}` }} onClick={e => e.stopPropagation()}>
                      <div style={{ marginBottom: '10px' }}>
                        <label style={labelStyle(isDark)}>Publishable Key</label>
                        <input type="text" value={stripeKeys.publishable} onChange={e => setStripeKeys({ ...stripeKeys, publishable: e.target.value })} placeholder="pk_live_… or pk_test_…" style={inputStyle(isDark)} />
                      </div>
                      <div style={{ marginBottom: '10px' }}>
                        <label style={labelStyle(isDark)}>Secret Key</label>
                        <div style={{ position: 'relative' }}>
                          <input type={showStripeKeys ? 'text' : 'password'} value={stripeKeys.secret} onChange={e => setStripeKeys({ ...stripeKeys, secret: e.target.value })} placeholder="sk_live_… or sk_test_…" style={{ ...inputStyle(isDark), paddingRight: '52px' }} />
                          <button type="button" onClick={() => setShowStripeKeys(v => !v)} style={{ position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', fontSize: '12px', color: textMuted }}>
                            {showStripeKeys ? 'Hide' : 'Show'}
                          </button>
                        </div>
                      </div>
                      <button onClick={handleValidateStripeKeys} disabled={paymentLoading || !stripeKeys.publishable || !stripeKeys.secret} style={{ padding: '9px 20px', fontSize: '13px', fontWeight: 600, background: `rgba(${rgb}, 0.85)`, color: '#fff', border: 'none', borderRadius: '8px', cursor: (paymentLoading || !stripeKeys.publishable || !stripeKeys.secret) ? 'not-allowed' : 'pointer', opacity: (paymentLoading || !stripeKeys.publishable || !stripeKeys.secret) ? 0.5 : 1 }}>
                        {paymentLoading ? 'Validating…' : 'Validate & Save'}
                      </button>
                    </div>
                  )}
                </div>
              )
            })}

            {paymentError && <div style={{ padding: '10px 14px', backgroundColor: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.3)', borderRadius: '8px', color: '#ef4444', fontSize: '13px', marginTop: '4px' }}>{paymentError}</div>}
            {paymentSuccess && <div style={{ padding: '10px 14px', backgroundColor: 'rgba(34,197,94,0.08)', border: '1px solid rgba(34,197,94,0.3)', borderRadius: '8px', color: '#16a34a', fontSize: '13px', marginTop: '4px' }}>{paymentSuccess}</div>}

            <div style={{ display: 'flex', gap: '10px', marginTop: '20px' }}>
              <button type="button" onClick={() => setStep(2)} style={backBtn}>← Back</button>
              <button
                onClick={handleStep3}
                disabled={paymentMethod === 'stripe_connect' && connectOnboardingUrl && !connectStatus?.onboarding_completed}
                style={{ ...primaryBtn(paymentMethod === 'stripe_connect' && connectOnboardingUrl && !connectStatus?.onboarding_completed), flex: 2, marginTop: 0 }}
              >
                {paymentMethod === 'stripe_connect' && connectOnboardingUrl && !connectStatus?.onboarding_completed ? 'Finish Stripe setup first' : 'Continue →'}
              </button>
            </div>
          </div>
        )}

        {/* ── Step 4: All Set! ── */}
        {step === 4 && (
          <div>
            <div style={{ textAlign: 'center', marginBottom: '32px' }}>
              <div style={{ fontSize: '52px', marginBottom: '14px' }}>🎉</div>
              <h1 style={{ fontSize: '24px', fontWeight: 700, margin: '0 0 8px', color: textPrimary }}>You're all set!</h1>
              <p style={{ fontSize: '14px', color: textMuted, margin: 0 }}>Save these credentials before continuing — you'll need them to log in.</p>
            </div>

            <div style={{
              backgroundColor: isDark ? '#2a2a2a' : '#f8f8f8',
              borderRadius: '12px',
              padding: '22px 26px',
              marginBottom: '24px',
              border: `1px solid ${border}`,
            }}>
              {[
                ['Store', storeName],
                ['Store code', createdCode],
                ['Email', adminEmail],
              ].map(([k, v]) => (
                <div key={k} style={{ marginBottom: '14px' }}>
                  <span style={{ fontSize: '11px', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em', color: textMuted }}>{k}</span>
                  <div style={{ fontSize: '14px', color: textPrimary, marginTop: '2px', fontWeight: 500 }}>{v}</div>
                </div>
              ))}
              <div>
                <span style={{ fontSize: '11px', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em', color: textMuted }}>PIN</span>
                <div style={{ fontSize: '30px', fontFamily: 'monospace', fontWeight: 700, letterSpacing: '0.3em', color: `rgba(${rgb}, 1)`, marginTop: '2px' }}>
                  {createdPin}
                </div>
              </div>
            </div>

            <p style={{ fontSize: '12px', color: textMuted, textAlign: 'center', marginBottom: '20px' }}>
              Log in with your store code + PIN. Managers use email + PIN on the Manager Login screen.
            </p>

            <button onClick={handleFinish} style={primaryBtn(false)}>
              Go to dashboard →
            </button>
          </div>
        )}
      </div>

      {step < 4 && (
        <button
          onClick={devSkip}
          style={{ marginTop: '20px', background: 'none', border: 'none', fontSize: '11px', color: isDark ? '#444' : '#ccc', cursor: 'pointer', textDecoration: 'underline' }}
        >
          Dev: skip setup
        </button>
      )}
    </div>
  )
}
