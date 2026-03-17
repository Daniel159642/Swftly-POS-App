import { useTheme } from '../contexts/ThemeContext'
import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { apiFetch } from '../utils/apiFetch'
import {
  startRegistration,
  startAuthentication,
  browserSupportsWebAuthn,
} from '@simplewebauthn/browser'

const PASSKEY_PROMPT_KEY = 'pos_passkey_prompt_dismissed'

function MasterLogin({ onMasterLoginSuccess }) {
  const { themeColor } = useTheme()
  const navigate = useNavigate()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [passkeyLoading, setPasskeyLoading] = useState(false)
  const [supportsPasskey, setSupportsPasskey] = useState(false)
  // After a password login we may offer to register a passkey
  const [showPasskeyPrompt, setShowPasskeyPrompt] = useState(false)
  const [sessionAfterLogin, setSessionAfterLogin] = useState(null)

  useEffect(() => {
    setSupportsPasskey(browserSupportsWebAuthn())
  }, [])

  const hexToRgb = (hex) => {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex)
    return result
      ? `${parseInt(result[1], 16)}, ${parseInt(result[2], 16)}, ${parseInt(result[3], 16)}`
      : '132, 0, 255'
  }
  const themeColorRgb = hexToRgb(themeColor)

  const finishLogin = (result) => {
    try {
      localStorage.setItem('session_token', result.session_token)
      localStorage.setItem('employee_id', String(result.employee_id))
      localStorage.setItem('employee_name', result.employee_name || '')
      localStorage.setItem('position', result.position || '')
    } catch (_) {}
    if (onMasterLoginSuccess) {
      onMasterLoginSuccess(result)
    } else {
      navigate('/login')
    }
  }

  // ── Password login ──────────────────────────────────────────────
  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      const response = await apiFetch('/api/admin/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email.trim(), password }),
      })
      const result = await response.json()
      if (result.success) {
        // Offer passkey setup if browser supports it and user hasn't dismissed before
        const dismissed = localStorage.getItem(PASSKEY_PROMPT_KEY)
        if (supportsPasskey && !dismissed) {
          setSessionAfterLogin(result)
          setShowPasskeyPrompt(true)
        } else {
          finishLogin(result)
        }
      } else {
        setError(result.message || 'Invalid email or password')
      }
    } catch (err) {
      setError(!navigator.onLine || err.name === 'TypeError'
        ? 'No connection. Manager login requires internet access.'
        : 'Sign in failed. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  // ── Passkey login ───────────────────────────────────────────────
  const handlePasskeyLogin = async () => {
    setError('')
    setPasskeyLoading(true)
    try {
      // Begin — send email if entered, otherwise discoverable flow
      const beginResp = await apiFetch('/api/admin/webauthn/login/begin', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email.trim() || undefined }),
      })
      const beginData = await beginResp.json()
      if (!beginData.success) {
        setError(beginData.message || 'Could not start passkey login')
        return
      }

      // Browser shows biometric prompt
      const credential = await startAuthentication({ optionsJSON: beginData.options })

      // Complete
      const completeResp = await apiFetch('/api/admin/webauthn/login/complete', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ credential }),
      })
      const result = await completeResp.json()
      if (result.success) {
        finishLogin(result)
      } else {
        setError(result.message || 'Passkey verification failed')
      }
    } catch (err) {
      // User cancelled browser dialog — not a real error
      if (err.name !== 'NotAllowedError') {
        setError('Passkey sign in failed. Try email + password instead.')
      }
    } finally {
      setPasskeyLoading(false)
    }
  }

  // ── Register passkey after password login ───────────────────────
  const handleRegisterPasskey = async (deviceName) => {
    try {
      const token = sessionAfterLogin?.session_token
      const beginResp = await apiFetch('/api/admin/webauthn/register/begin', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Session-Token': token,
        },
        body: JSON.stringify({}),
      })
      const beginData = await beginResp.json()
      if (!beginData.success) {
        finishLogin(sessionAfterLogin)
        return
      }

      const credential = await startRegistration({ optionsJSON: beginData.options })

      await apiFetch('/api/admin/webauthn/register/complete', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Session-Token': token,
        },
        body: JSON.stringify({ credential, device_name: deviceName }),
      })
    } catch (_) {
      // Non-fatal — proceed to login regardless
    }
    finishLogin(sessionAfterLogin)
  }

  // ── Passkey setup prompt (shown after password login) ────────────
  if (showPasskeyPrompt) {
    return (
      <PasskeySetupPrompt
        themeColor={themeColor}
        themeColorRgb={themeColorRgb}
        onSetUp={(deviceName) => handleRegisterPasskey(deviceName)}
        onDismiss={() => {
          try { localStorage.setItem(PASSKEY_PROMPT_KEY, '1') } catch (_) {}
          finishLogin(sessionAfterLogin)
        }}
      />
    )
  }

  return (
    <div style={{
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
      minHeight: '100vh',
      backgroundColor: 'var(--bg-secondary)',
      padding: '20px',
    }}>
      <div style={{
        backgroundColor: 'var(--bg-primary)',
        padding: '32px 40px',
        borderRadius: '8px',
        boxShadow: '0 2px 8px var(--shadow)',
        border: '1px solid var(--border-light)',
        width: '100%',
        maxWidth: '400px',
      }}>
        <div style={{ textAlign: 'center', marginBottom: '28px' }}>
          <h1 style={{ fontSize: '24px', fontWeight: 600, color: 'var(--text-primary)', margin: 0, marginBottom: '8px' }}>
            Manager / Admin Login
          </h1>
          <p style={{ fontSize: '14px', color: 'var(--text-secondary)', margin: 0 }}>
            Sign in with your work email and password
          </p>
        </div>

        {/* Passkey button */}
        {supportsPasskey && (
          <>
            <button
              type="button"
              onClick={handlePasskeyLogin}
              disabled={passkeyLoading}
              style={{
                width: '100%',
                padding: '12px',
                backgroundColor: passkeyLoading ? `rgba(${themeColorRgb}, 0.4)` : `rgba(${themeColorRgb}, 0.08)`,
                color: passkeyLoading ? '#999' : `rgb(${themeColorRgb})`,
                border: `1.5px solid rgba(${themeColorRgb}, 0.35)`,
                borderRadius: '8px',
                fontSize: '15px',
                fontWeight: 600,
                cursor: passkeyLoading ? 'not-allowed' : 'pointer',
                marginBottom: '16px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px',
                transition: 'all 0.2s ease',
              }}
              onMouseEnter={(e) => {
                if (!passkeyLoading) e.currentTarget.style.backgroundColor = `rgba(${themeColorRgb}, 0.14)`
              }}
              onMouseLeave={(e) => {
                if (!passkeyLoading) e.currentTarget.style.backgroundColor = `rgba(${themeColorRgb}, 0.08)`
              }}
            >
              <span style={{ fontSize: '18px' }}>🔑</span>
              {passkeyLoading ? 'Waiting for passkey…' : 'Sign in with Passkey'}
            </button>

            <div style={{ display: 'flex', alignItems: 'center', margin: '0 0 20px', color: 'var(--text-secondary)', fontSize: '13px' }}>
              <div style={{ flex: 1, height: '1px', backgroundColor: 'var(--border-light)' }} />
              <span style={{ padding: '0 12px' }}>or use password</span>
              <div style={{ flex: 1, height: '1px', backgroundColor: 'var(--border-light)' }} />
            </div>
          </>
        )}

        <form onSubmit={handleSubmit}>
          <div style={{ marginBottom: '16px' }}>
            <label style={{ display: 'block', fontSize: '14px', fontWeight: 500, color: 'var(--text-primary)', marginBottom: '8px' }}>
              Email address
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Enter your email address"
              required
              style={inputStyle}
              onFocus={(e) => { e.target.style.borderColor = `rgba(${themeColorRgb}, 0.7)`; e.target.style.boxShadow = `0 0 0 3px rgba(${themeColorRgb}, 0.1)` }}
              onBlur={(e) => { e.target.style.borderColor = 'var(--border-light)'; e.target.style.boxShadow = 'none' }}
            />
          </div>

          <div style={{ marginBottom: '24px' }}>
            <label style={{ display: 'block', fontSize: '14px', fontWeight: 500, color: 'var(--text-primary)', marginBottom: '8px' }}>
              Password
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Enter your password"
              required
              style={inputStyle}
              onFocus={(e) => { e.target.style.borderColor = `rgba(${themeColorRgb}, 0.7)`; e.target.style.boxShadow = `0 0 0 3px rgba(${themeColorRgb}, 0.1)` }}
              onBlur={(e) => { e.target.style.borderColor = 'var(--border-light)'; e.target.style.boxShadow = 'none' }}
            />
          </div>

          <button
            type="submit"
            disabled={loading || !email || !password}
            style={{
              width: '100%',
              padding: '12px',
              backgroundColor: (loading || !email || !password)
                ? `rgba(${themeColorRgb}, 0.4)`
                : `rgba(${themeColorRgb}, 0.7)`,
              backdropFilter: 'blur(10px)',
              WebkitBackdropFilter: 'blur(10px)',
              color: '#fff',
              border: '1px solid rgba(255,255,255,0.2)',
              borderRadius: '8px',
              fontSize: '16px',
              fontWeight: 600,
              cursor: (loading || !email || !password) ? 'not-allowed' : 'pointer',
              transition: 'all 0.3s ease',
            }}
            onMouseEnter={(e) => { if (!loading && email && password) e.currentTarget.style.backgroundColor = `rgba(${themeColorRgb}, 0.85)` }}
            onMouseLeave={(e) => { if (!loading && email && password) e.currentTarget.style.backgroundColor = `rgba(${themeColorRgb}, 0.7)` }}
          >
            {loading ? 'Signing in…' : 'Sign In'}
          </button>

          {error && (
            <div style={{ marginTop: '16px', padding: '12px', backgroundColor: '#ffebee', color: '#d32f2f', borderRadius: '8px', fontSize: '14px' }}>
              {error}
            </div>
          )}

          <div style={{ marginTop: '20px', textAlign: 'center', fontSize: '14px', color: 'var(--text-secondary)' }}>
            <button type="button" onClick={() => navigate('/login')}
              style={{ background: 'none', border: 'none', padding: 0, color: themeColor, fontWeight: 500, cursor: 'pointer', fontSize: '14px', fontFamily: 'inherit' }}>
              ← Back to Employee Login
            </button>
          </div>

          <div style={{ marginTop: '12px', textAlign: 'center', fontSize: '14px', color: 'var(--text-secondary)' }}>
            New to the system?{' '}
            <button type="button" onClick={() => navigate('/onboarding')}
              style={{ background: 'none', border: 'none', padding: 0, color: themeColor, fontWeight: 500, cursor: 'pointer', fontSize: '14px', fontFamily: 'inherit' }}
              onMouseEnter={(e) => { e.currentTarget.style.textDecoration = 'underline' }}
              onMouseLeave={(e) => { e.currentTarget.style.textDecoration = 'none' }}>
              Start Setup
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

const inputStyle = {
  width: '100%',
  padding: '12px 16px',
  backgroundColor: 'var(--bg-secondary)',
  color: 'var(--text-primary)',
  border: '1px solid var(--border-light)',
  borderRadius: '8px',
  fontSize: '14px',
  outline: 'none',
  transition: 'all 0.2s ease',
  boxSizing: 'border-box',
}

// ── PasskeySetupPrompt ─────────────────────────────────────────────
function PasskeySetupPrompt({ themeColor, themeColorRgb, onSetUp, onDismiss }) {
  const [deviceName, setDeviceName] = useState(() => {
    // Auto-detect a reasonable default device name
    const ua = navigator.userAgent
    if (/iPhone/i.test(ua)) return 'iPhone'
    if (/iPad/i.test(ua)) return 'iPad'
    if (/Android/i.test(ua)) return 'Android Phone'
    if (/Mac/i.test(ua)) return 'Mac'
    if (/Windows/i.test(ua)) return 'Windows PC'
    return 'My Device'
  })
  const [loading, setLoading] = useState(false)

  const handleSetUp = async () => {
    setLoading(true)
    await onSetUp(deviceName.trim() || 'My Device')
    setLoading(false)
  }

  return (
    <div style={{
      display: 'flex', justifyContent: 'center', alignItems: 'center',
      minHeight: '100vh', backgroundColor: 'var(--bg-secondary)', padding: '20px',
    }}>
      <div style={{
        backgroundColor: 'var(--bg-primary)', padding: '32px 40px', borderRadius: '8px',
        boxShadow: '0 2px 8px var(--shadow)', border: '1px solid var(--border-light)',
        width: '100%', maxWidth: '400px', textAlign: 'center',
      }}>
        <div style={{ fontSize: '48px', marginBottom: '16px' }}>🔑</div>
        <h2 style={{ fontSize: '20px', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '12px' }}>
          Save a passkey for faster sign-in?
        </h2>
        <p style={{ fontSize: '14px', color: 'var(--text-secondary)', marginBottom: '24px', lineHeight: 1.5 }}>
          Use Face ID, Touch ID, or Windows Hello next time — no password needed.
        </p>

        <div style={{ marginBottom: '20px', textAlign: 'left' }}>
          <label style={{ display: 'block', fontSize: '13px', fontWeight: 500, color: 'var(--text-secondary)', marginBottom: '6px' }}>
            Name this device (optional)
          </label>
          <input
            type="text"
            value={deviceName}
            onChange={(e) => setDeviceName(e.target.value)}
            maxLength={40}
            style={{ ...inputStyle, fontSize: '14px' }}
            onFocus={(e) => { e.target.style.borderColor = `rgba(${themeColorRgb}, 0.7)` }}
            onBlur={(e) => { e.target.style.borderColor = 'var(--border-light)' }}
          />
        </div>

        <button
          onClick={handleSetUp}
          disabled={loading}
          style={{
            width: '100%', padding: '12px', marginBottom: '12px',
            backgroundColor: loading ? `rgba(${themeColorRgb}, 0.4)` : `rgba(${themeColorRgb}, 0.7)`,
            color: '#fff', border: '1px solid rgba(255,255,255,0.2)', borderRadius: '8px',
            fontSize: '15px', fontWeight: 600, cursor: loading ? 'not-allowed' : 'pointer',
          }}
        >
          {loading ? 'Setting up…' : 'Set Up Passkey'}
        </button>

        <button
          onClick={onDismiss}
          disabled={loading}
          style={{
            width: '100%', padding: '10px', backgroundColor: 'transparent',
            color: 'var(--text-secondary)', border: '1px solid var(--border-light)',
            borderRadius: '8px', fontSize: '14px', cursor: 'pointer',
          }}
        >
          Not Now
        </button>
      </div>
    </div>
  )
}

export default MasterLogin
