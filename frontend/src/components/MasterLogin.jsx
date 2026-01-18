import { useSignIn } from '@clerk/clerk-react'
import { useTheme } from '../contexts/ThemeContext'
import { useState } from 'react'
import { useNavigate } from 'react-router-dom'

function MasterLogin({ onMasterLoginSuccess }) {
  const { themeColor } = useTheme()
  const { isLoaded, signIn, setActive } = useSignIn()
  const navigate = useNavigate()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  
  // Convert hex to RGB for rgba usage
  const hexToRgb = (hex) => {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex)
    return result ? `${parseInt(result[1], 16)}, ${parseInt(result[2], 16)}, ${parseInt(result[3], 16)}` : '132, 0, 255'
  }
  
  const themeColorRgb = hexToRgb(themeColor)

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    if (!isLoaded || !signIn) {
      setError('Please wait for authentication to load')
      setLoading(false)
      return
    }

    try {
      const result = await signIn.create({
        identifier: email,
        password,
      })

      if (result.status === 'complete') {
        await setActive({ session: result.createdSessionId })
        // Redirect to login page for PIN entry
        navigate('/login')
      } else {
        // Handle additional steps (2FA, etc.)
        setError('Additional verification needed. Please check your email.')
      }
    } catch (err) {
      setError(err?.errors?.[0]?.message || 'Sign in failed')
    } finally {
      setLoading(false)
    }
  }

  const handleGoogleSignIn = async () => {
    if (!isLoaded || !signIn) return

    try {
      await signIn.authenticateWithRedirect({
        strategy: 'oauth_google',
        redirectUrl: '/sso-callback',
        redirectUrlComplete: '/login',
      })
    } catch (err) {
      setError(err?.errors?.[0]?.message || 'Google sign in failed')
    }
  }

  if (!isLoaded) {
    return (
      <div style={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        minHeight: '100vh',
        backgroundColor: 'var(--bg-secondary)',
        padding: '20px'
      }}>
        <div style={{ fontSize: '18px', color: 'var(--text-secondary)' }}>
          Loading...
        </div>
      </div>
    )
  }

  return (
    <div style={{
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
      minHeight: '100vh',
      backgroundColor: 'var(--bg-secondary)',
      padding: '20px'
    }}>
      <div style={{
        backgroundColor: 'var(--bg-primary)',
        padding: '32px 40px',
        borderRadius: '8px',
        boxShadow: '0 2px 8px var(--shadow)',
        border: '1px solid var(--border-light)',
        width: '100%',
        maxWidth: '400px'
      }}>
        {/* Custom header */}
        <div style={{
          textAlign: 'center',
          marginBottom: '32px'
        }}>
          <h1 style={{
            fontSize: '24px',
            fontWeight: 600,
            color: 'var(--text-primary)',
            margin: 0,
            marginBottom: '8px'
          }}>
            Sign in to Swyft
          </h1>
          <p style={{
            fontSize: '14px',
            color: 'var(--text-secondary)',
            margin: 0
          }}>
            Welcome back! Please sign in to continue
          </p>
        </div>

        <form onSubmit={handleSubmit}>
          {/* Google Sign In Button */}
          <button
            type="button"
            onClick={handleGoogleSignIn}
            style={{
              width: '100%',
              padding: '12px',
              backgroundColor: '#fff',
              color: '#333',
              border: '1px solid var(--border-light)',
              borderRadius: '8px',
              fontSize: '16px',
              fontWeight: 500,
              cursor: 'pointer',
              marginBottom: '16px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '8px',
              transition: 'all 0.2s ease'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = '#f5f5f5'
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = '#fff'
            }}
          >
            <svg width="18" height="18" viewBox="0 0 18 18">
              <path fill="#4285F4" d="M17.64 9.2c0-.637-.057-1.251-.164-1.84H9v3.481h4.844c-.209 1.125-.843 2.078-1.796 2.717v2.258h2.908c1.702-1.567 2.684-3.874 2.684-6.615z"/>
              <path fill="#34A853" d="M9 18c2.43 0 4.467-.806 5.956-2.184l-2.908-2.258c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332C2.438 15.983 5.482 18 9 18z"/>
              <path fill="#FBBC05" d="M3.964 10.707c-.18-.54-.282-1.117-.282-1.707s.102-1.167.282-1.707V4.961H.957C.348 6.175 0 7.55 0 9s.348 2.825.957 4.039l3.007-2.332z"/>
              <path fill="#EA4335" d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0 5.482 0 2.438 2.017.957 4.961L3.964 7.293C4.672 5.163 6.656 3.58 9 3.58z"/>
            </svg>
            Continue with Google
          </button>

          <div style={{
            display: 'flex',
            alignItems: 'center',
            margin: '20px 0',
            color: 'var(--text-secondary)',
            fontSize: '14px'
          }}>
            <div style={{ flex: 1, height: '1px', backgroundColor: 'var(--border-light)' }} />
            <span style={{ padding: '0 12px' }}>or</span>
            <div style={{ flex: 1, height: '1px', backgroundColor: 'var(--border-light)' }} />
          </div>

          {/* Email Input */}
          <div style={{ marginBottom: '16px' }}>
            <label style={{
              display: 'block',
              fontSize: '14px',
              fontWeight: 500,
              color: 'var(--text-primary)',
              marginBottom: '8px'
            }}>
              Email address
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Enter your email address"
              required
              style={{
                width: '100%',
                padding: '12px 16px',
                backgroundColor: 'var(--bg-secondary)',
                color: 'var(--text-primary)',
                border: '1px solid var(--border-light)',
                borderRadius: '8px',
                fontSize: '14px',
                outline: 'none',
                transition: 'all 0.2s ease',
                boxSizing: 'border-box'
              }}
              onFocus={(e) => {
                e.target.style.borderColor = `rgba(${themeColorRgb}, 0.7)`
                e.target.style.boxShadow = `0 0 0 3px rgba(${themeColorRgb}, 0.1)`
              }}
              onBlur={(e) => {
                e.target.style.borderColor = 'var(--border-light)'
                e.target.style.boxShadow = 'none'
              }}
            />
          </div>

          {/* Continue Button - Styled like Pay button */}
          <button
            type="submit"
            disabled={loading || !email}
            style={{
              width: '100%',
              padding: '12px',
              backgroundColor: loading || !email ? `rgba(${themeColorRgb}, 0.4)` : `rgba(${themeColorRgb}, 0.7)`,
              backdropFilter: 'blur(10px)',
              WebkitBackdropFilter: 'blur(10px)',
              color: '#fff',
              border: '1px solid rgba(255, 255, 255, 0.2)',
              borderRadius: '8px',
              fontSize: '16px',
              fontWeight: 600,
              cursor: loading || !email ? 'not-allowed' : 'pointer',
              boxShadow: loading || !email 
                ? `0 2px 8px rgba(${themeColorRgb}, 0.2), inset 0 1px 0 rgba(255, 255, 255, 0.15)`
                : `0 4px 15px rgba(${themeColorRgb}, 0.3), inset 0 1px 0 rgba(255, 255, 255, 0.2)`,
              transition: 'all 0.3s ease',
              opacity: 1
            }}
            onMouseEnter={(e) => {
              if (!loading && email) {
                e.currentTarget.style.backgroundColor = `rgba(${themeColorRgb}, 0.85)`
                e.currentTarget.style.boxShadow = `0 6px 20px rgba(${themeColorRgb}, 0.4), inset 0 1px 0 rgba(255, 255, 255, 0.25)`
              }
            }}
            onMouseLeave={(e) => {
              if (!loading && email) {
                e.currentTarget.style.backgroundColor = `rgba(${themeColorRgb}, 0.7)`
                e.currentTarget.style.boxShadow = `0 4px 15px rgba(${themeColorRgb}, 0.3), inset 0 1px 0 rgba(255, 255, 255, 0.2)`
              }
            }}
          >
            {loading ? 'Processing...' : 'Continue'}
          </button>

          {/* Error Message */}
          {error && (
            <div style={{
              marginTop: '16px',
              padding: '12px',
              backgroundColor: '#ffebee',
              color: '#d32f2f',
              borderRadius: '8px',
              fontSize: '14px'
            }}>
              {error}
            </div>
          )}

          {/* Sign Up Link */}
          <div style={{
            marginTop: '20px',
            textAlign: 'center',
            fontSize: '14px',
            color: 'var(--text-secondary)'
          }}>
            Don't have an account?{' '}
            <a
              href="/sign-up"
              style={{
                color: themeColor,
                textDecoration: 'none',
                fontWeight: 500
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.textDecoration = 'underline'
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.textDecoration = 'none'
              }}
            >
              Sign up
            </a>
          </div>
        </form>
      </div>
    </div>
  )
}

export default MasterLogin
