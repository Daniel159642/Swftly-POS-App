import { useState, useEffect } from 'react'
import { useAuth, useUser } from '@clerk/clerk-react'
import { useTheme } from '../contexts/ThemeContext'
import '../index.css'

function Login({ onLogin }) {
  const { isSignedIn, isLoaded: clerkLoaded, signOut } = useAuth()
  const { user } = useUser()
  const { themeColor } = useTheme()
  const [employeeCode, setEmployeeCode] = useState('')
  const [password, setPassword] = useState('')
  const [pin, setPin] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [employees, setEmployees] = useState([])
  const [loadingEmployees, setLoadingEmployees] = useState(true)
  const [usePinLogin, setUsePinLogin] = useState(false)
  const [showLogoutPin, setShowLogoutPin] = useState(false)
  const [logoutPin, setLogoutPin] = useState('')

  // Convert hex to RGB for rgba usage
  const hexToRgb = (hex) => {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex)
    return result ? `${parseInt(result[1], 16)}, ${parseInt(result[2], 16)}, ${parseInt(result[3], 16)}` : '132, 0, 255'
  }
  
  const themeColorRgb = hexToRgb(themeColor)

  useEffect(() => {
    // Check if user is authenticated with Clerk and has an employee account
    if (clerkLoaded && isSignedIn && user) {
      checkEmployeeAccount()
    } else {
      // If not signed in with Clerk, fetch employees for regular login
      fetchEmployees()
    }
  }, [clerkLoaded, isSignedIn, user])

  const checkEmployeeAccount = async () => {
    try {
      const response = await fetch(`/api/clerk/employee?clerk_user_id=${user.id}`)
      const data = await response.json()
      
      if (data.success && data.employee) {
        // User has an employee account linked to Clerk - show PIN login
        setUsePinLogin(true)
        setLoadingEmployees(false)
      } else {
        // User doesn't have employee account - show regular login
        setUsePinLogin(false)
        fetchEmployees()
      }
    } catch (err) {
      console.error('Error checking employee account:', err)
      setUsePinLogin(false)
      fetchEmployees()
    }
  }

  const fetchEmployees = async () => {
    try {
      const response = await fetch('/api/employees')
      const data = await response.json()
      setEmployees(data.data || [])
    } catch (err) {
      console.error('Error fetching employees:', err)
    } finally {
      setLoadingEmployees(false)
    }
  }

  const handleNumpadClick = (value) => {
    if (value === 'backspace') {
      if (showLogoutPin) {
        setLogoutPin(prev => prev.slice(0, -1))
      } else if (usePinLogin) {
        setPin(prev => prev.slice(0, -1))
      } else {
        setPassword(prev => prev.slice(0, -1))
      }
    } else {
      if (showLogoutPin) {
        setLogoutPin(prev => {
          if (prev.length >= 6) {
            return prev
          }
          return prev + value
        })
      } else if (usePinLogin) {
        setPin(prev => {
          if (prev.length >= 6) {
            return prev
          }
          return prev + value
        })
      } else {
        setPassword(prev => {
          if (prev.length >= 6) {
            return prev
          }
          return prev + value
        })
      }
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    // Create AbortController for timeout
    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), 10000) // 10 second timeout

    try {
      let response
      
      if (usePinLogin && user) {
        // PIN login after Clerk authentication
        response = await fetch('/api/clerk/pin-login', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            clerk_user_id: user.id,
            pin_code: pin
          }),
          signal: controller.signal
        })
      } else {
        // Regular employee code/password login
        response = await fetch('/api/login', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            username: employeeCode,  // Support both username and employee_code
            employee_code: employeeCode,
            password: password
          }),
          signal: controller.signal
        })
      }

      clearTimeout(timeoutId)

      if (!response.ok) {
        const errorText = await response.text()
        try {
          const errorJson = JSON.parse(errorText)
          setError(errorJson.message || `Server error: ${response.status}`)
        } catch {
          setError(`Server error: ${response.status} - ${errorText}`)
        }
        setLoading(false)
        return
      }

      const result = await response.json()
      
      if (result.success) {
        onLogin(result)
      } else {
        setError(result.message || 'Login failed')
      }
    } catch (err) {
      clearTimeout(timeoutId)
      if (err.name === 'AbortError') {
        setError('Request timed out. Please check if the backend server is running on port 5001.')
      } else {
        setError('Connection error. Please make sure the backend server is running on port 5001.')
      }
      console.error('Login error:', err)
    } finally {
      setLoading(false)
    }
  }

  const handleLogoutClick = () => {
    // Show PIN verification dialog
    setShowLogoutPin(true)
    setLogoutPin('')
    setError('')
  }

  const handleLogoutPinSubmit = async () => {
    if (logoutPin.length !== 6) {
      setError('Please enter a 6-digit PIN')
      return
    }

    try {
      // Verify PIN before allowing logout
      const response = await fetch('/api/clerk/pin-login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          clerk_user_id: user.id,
          pin_code: logoutPin
        })
      })

      const result = await response.json()
      
      if (result.success) {
        // PIN verified, proceed with logout
        await signOut()
        // Reset state after logout
        setUsePinLogin(false)
        setPin('')
        setPassword('')
        setEmployeeCode('')
        setError('')
        setShowLogoutPin(false)
        setLogoutPin('')
      } else {
        setError('Invalid PIN. Cannot log out.')
        setLogoutPin('')
      }
    } catch (err) {
      console.error('Error verifying PIN for logout:', err)
      setError('Failed to verify PIN. Please try again.')
      setLogoutPin('')
    }
  }

  const handleCancelLogout = () => {
    setShowLogoutPin(false)
    setLogoutPin('')
    setError('')
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
      {showLogoutPin ? (
        // PIN verification modal for logout
        <div style={{
          backgroundColor: 'var(--bg-primary)',
          padding: '32px 40px 40px 40px',
          borderRadius: '8px',
          boxShadow: '0 2px 8px var(--shadow)',
          width: '100%',
          maxWidth: '400px',
          border: '1px solid var(--border-light)'
        }}>
          <h2 style={{
            fontSize: '20px',
            fontWeight: 600,
            color: 'var(--text-primary)',
            marginBottom: '8px',
            textAlign: 'center'
          }}>
            Verify PIN to Log Out
          </h2>
          <p style={{
            fontSize: '14px',
            color: 'var(--text-secondary)',
            marginBottom: '24px',
            textAlign: 'center'
          }}>
            Enter your 6-digit PIN to sign out
          </p>

          <div style={{
            textAlign: 'center',
            fontSize: '36px',
            letterSpacing: '12px',
            fontFamily: 'monospace',
            minHeight: '50px',
            padding: '15px 0',
            marginBottom: '15px',
            display: 'flex',
            justifyContent: 'center',
            gap: '8px'
          }}>
            {Array.from({ length: 6 }, (_, index) => (
              <div key={index} style={{
                width: '24px',
                height: '24px',
                borderRadius: '50%',
                backgroundColor: index < logoutPin.length ? '#666' : 'transparent',
                border: '2px solid #666',
                transition: 'background-color 0.2s ease'
              }}>
              </div>
            ))}
          </div>

          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(3, 1fr)',
            gap: '8px',
            marginTop: '15px',
            marginBottom: '8px',
            justifyContent: 'center'
          }}>
            {[1, 2, 3, 4, 5, 6, 7, 8, 9].map(num => (
              <button
                key={num}
                type="button"
                onClick={() => handleNumpadClick(num.toString())}
                style={{
                  width: '80px',
                  height: '80px',
                  padding: 0,
                  fontSize: '28px',
                  fontWeight: 600,
                  backgroundColor: `rgba(${themeColorRgb}, 0.7)`,
                  backdropFilter: 'blur(10px)',
                  WebkitBackdropFilter: 'blur(10px)',
                  color: '#fff',
                  border: '1px solid rgba(255, 255, 255, 0.2)',
                  borderRadius: '50%',
                  cursor: 'pointer',
                  boxShadow: `0 4px 15px rgba(${themeColorRgb}, 0.3), inset 0 1px 0 rgba(255, 255, 255, 0.2)`,
                  transition: 'all 0.3s ease',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  margin: '0 auto'
                }}
                onMouseEnter={(e) => {
                  e.target.style.backgroundColor = `rgba(${themeColorRgb}, 0.85)`
                  e.target.style.transform = 'scale(0.95)'
                }}
                onMouseLeave={(e) => {
                  e.target.style.backgroundColor = `rgba(${themeColorRgb}, 0.7)`
                  e.target.style.transform = 'scale(1)'
                }}
              >
                {num}
              </button>
            ))}
          </div>
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(3, 1fr)',
            gap: '8px',
            marginBottom: '20px',
            justifyContent: 'center'
          }}>
            <button
              type="button"
              onClick={() => handleNumpadClick('backspace')}
              style={{
                background: 'none',
                border: 'none',
                padding: 0,
                fontSize: '24px',
                fontWeight: 500,
                color: 'var(--text-primary)',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                margin: '0 auto'
              }}
            >
              ⌫
            </button>
            <button
              type="button"
              onClick={() => handleNumpadClick('0')}
              style={{
                width: '80px',
                height: '80px',
                padding: 0,
                fontSize: '28px',
                fontWeight: 600,
                backgroundColor: `rgba(${themeColorRgb}, 0.7)`,
                backdropFilter: 'blur(10px)',
                WebkitBackdropFilter: 'blur(10px)',
                color: '#fff',
                border: '1px solid rgba(255, 255, 255, 0.2)',
                borderRadius: '50%',
                cursor: 'pointer',
                boxShadow: `0 4px 15px rgba(${themeColorRgb}, 0.3), inset 0 1px 0 rgba(255, 255, 255, 0.2)`,
                transition: 'all 0.3s ease',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                margin: '0 auto'
              }}
              onMouseEnter={(e) => {
                e.target.style.backgroundColor = `rgba(${themeColorRgb}, 0.85)`
                e.target.style.transform = 'scale(0.95)'
              }}
              onMouseLeave={(e) => {
                e.target.style.backgroundColor = `rgba(${themeColorRgb}, 0.7)`
                e.target.style.transform = 'scale(1)'
              }}
            >
              0
            </button>
            <button
              type="button"
              onClick={handleLogoutPinSubmit}
              disabled={logoutPin.length !== 6}
              style={{
                background: 'none',
                border: 'none',
                padding: 0,
                fontSize: '16px',
                fontWeight: 500,
                color: logoutPin.length === 6 ? 'var(--text-primary)' : 'var(--text-tertiary)',
                cursor: logoutPin.length === 6 ? 'pointer' : 'not-allowed',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                margin: '0 auto'
              }}
            >
              {logoutPin.length === 6 ? 'Verify' : '...'}
            </button>
          </div>

          <button
            type="button"
            onClick={handleCancelLogout}
            style={{
              width: '100%',
              padding: '10px',
              fontSize: '14px',
              backgroundColor: 'transparent',
              color: 'var(--text-secondary)',
              border: '1px solid var(--border-light)',
              borderRadius: '6px',
              cursor: 'pointer',
              marginTop: '8px',
              transition: 'all 0.2s ease'
            }}
            onMouseEnter={(e) => {
              e.target.style.backgroundColor = 'var(--bg-secondary)'
              e.target.style.color = 'var(--text-primary)'
            }}
            onMouseLeave={(e) => {
              e.target.style.backgroundColor = 'transparent'
              e.target.style.color = 'var(--text-secondary)'
            }}
          >
            Cancel
          </button>

          {error && (
            <div className="alert alert-error" style={{ marginTop: '20px', marginBottom: '0' }}>
              {error}
            </div>
          )}
        </div>
      ) : (
        <div style={{
          backgroundColor: 'var(--bg-primary)',
          padding: '24px 40px 40px 40px',
          borderRadius: '8px',
          boxShadow: '0 2px 8px var(--shadow)',
          width: '100%',
          maxWidth: '400px',
          border: '1px solid var(--border-light)',
          position: 'relative'
        }}>
          {isSignedIn && user && (
            <div style={{
              marginBottom: '20px',
              paddingBottom: '16px',
              borderBottom: '1px solid var(--border-light)',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center'
            }}>
              <div>
                <div style={{
                  fontSize: '12px',
                  color: 'var(--text-secondary)',
                  marginBottom: '4px'
                }}>
                  Signed in as
                </div>
                <div style={{
                  fontSize: '14px',
                  color: 'var(--text-primary)',
                  fontWeight: 500
                }}>
                  {user.primaryEmailAddress?.emailAddress || user.firstName || 'User'}
                </div>
              </div>
              <button
                type="button"
                onClick={handleLogoutClick}
                style={{
                  padding: '8px 16px',
                  fontSize: '12px',
                  backgroundColor: 'transparent',
                  color: 'var(--text-secondary)',
                  border: '1px solid var(--border-light)',
                  borderRadius: '6px',
                  cursor: 'pointer',
                  transition: 'all 0.2s ease'
                }}
                onMouseEnter={(e) => {
                  e.target.style.backgroundColor = 'var(--bg-secondary)'
                  e.target.style.color = 'var(--text-primary)'
                }}
                onMouseLeave={(e) => {
                  e.target.style.backgroundColor = 'transparent'
                  e.target.style.color = 'var(--text-secondary)'
                }}
              >
                Sign Out
              </button>
            </div>
          )}
          <form onSubmit={handleSubmit}>
          {!usePinLogin && (
            <div style={{ marginBottom: '20px' }}>
              <select
                value={employeeCode}
                onChange={(e) => setEmployeeCode(e.target.value)}
                required
                disabled={loadingEmployees}
                style={{
                width: '100%',
                padding: '14px 16px',
                border: `2px solid rgba(${themeColorRgb}, 0.4)`,
                borderRadius: '12px',
                fontSize: '15px',
                fontFamily: 'inherit',
                background: 'var(--bg-primary)',
                color: 'var(--text-primary)',
                cursor: loadingEmployees ? 'wait' : 'pointer',
                opacity: loadingEmployees ? 0.6 : 1,
                outline: 'none',
                transition: 'all 0.2s ease',
                boxShadow: `0 2px 8px rgba(${themeColorRgb}, 0.1)`
              }}
              onFocus={(e) => {
                e.target.style.borderColor = `rgba(${themeColorRgb}, 0.7)`
                e.target.style.boxShadow = `0 4px 12px rgba(${themeColorRgb}, 0.2)`
              }}
              onBlur={(e) => {
                e.target.style.borderColor = `rgba(${themeColorRgb}, 0.4)`
                e.target.style.boxShadow = `0 2px 8px rgba(${themeColorRgb}, 0.1)`
              }}
            >
              <option value="">
                {loadingEmployees ? 'Loading employees...' : 'Select an employee...'}
              </option>
              {employees.map((emp) => (
                <option key={emp.employee_id} value={emp.username || emp.employee_code}>
                  {emp.first_name} {emp.last_name} {emp.username ? `(${emp.username})` : emp.employee_code ? `(${emp.employee_code})` : ''}
                </option>
              ))}
              </select>
            </div>
          )}

          {usePinLogin && (
            <div style={{
              marginBottom: '20px',
              padding: '16px',
              backgroundColor: 'var(--bg-secondary)',
              borderRadius: '8px',
              textAlign: 'center'
            }}>
              <p style={{
                fontSize: '14px',
                color: 'var(--text-secondary)',
                marginBottom: '8px'
              }}>
                Enter your 6-digit PIN
              </p>
            </div>
          )}

          <div style={{
            textAlign: 'center',
            fontSize: '36px',
            letterSpacing: '12px',
            fontFamily: 'monospace',
            minHeight: '50px',
            padding: '15px 0',
            marginBottom: '15px',
            display: 'flex',
            justifyContent: 'center',
            gap: '8px'
          }}>
            {Array.from({ length: 6 }, (_, index) => (
              <div key={index} style={{
                width: '24px',
                height: '24px',
                borderRadius: '50%',
                backgroundColor: index < (usePinLogin ? pin.length : password.length) ? '#666' : 'transparent',
                border: '2px solid #666',
                transition: 'background-color 0.2s ease'
              }}>
              </div>
            ))}
          </div>

          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(3, 1fr)',
            gap: '8px',
            marginTop: '15px',
            marginBottom: '8px',
            justifyContent: 'center'
          }}>
            {[1, 2, 3, 4, 5, 6, 7, 8, 9].map(num => (
              <button
                key={num}
                type="button"
                onClick={() => handleNumpadClick(num.toString())}
                style={{
                  width: '80px',
                  height: '80px',
                  padding: 0,
                  fontSize: '28px',
                  fontWeight: 600,
                  backgroundColor: `rgba(${themeColorRgb}, 0.7)`,
                  backdropFilter: 'blur(10px)',
                  WebkitBackdropFilter: 'blur(10px)',
                  color: '#fff',
                  border: '1px solid rgba(255, 255, 255, 0.2)',
                  borderRadius: '50%',
                  cursor: 'pointer',
                  boxShadow: `0 4px 15px rgba(${themeColorRgb}, 0.3), inset 0 1px 0 rgba(255, 255, 255, 0.2)`,
                  transition: 'all 0.3s ease',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  margin: '0 auto'
                }}
                onMouseEnter={(e) => {
                  e.target.style.backgroundColor = `rgba(${themeColorRgb}, 0.85)`
                  e.target.style.transform = 'scale(0.95)'
                }}
                onMouseLeave={(e) => {
                  e.target.style.backgroundColor = `rgba(${themeColorRgb}, 0.7)`
                  e.target.style.transform = 'scale(1)'
                }}
              >
                {num}
              </button>
            ))}
          </div>
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(3, 1fr)',
            gap: '8px',
            marginBottom: '20px',
            justifyContent: 'center'
          }}>
            <button
              type="button"
              onClick={() => handleNumpadClick('backspace')}
              style={{
                background: 'none',
                border: 'none',
                padding: 0,
                fontSize: '24px',
                fontWeight: 500,
                color: 'var(--text-primary)',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                margin: '0 auto'
              }}
            >
              ⌫
            </button>
            <button
              type="button"
              onClick={() => handleNumpadClick('0')}
              style={{
                width: '80px',
                height: '80px',
                padding: 0,
                fontSize: '28px',
                fontWeight: 600,
                backgroundColor: `rgba(${themeColorRgb}, 0.7)`,
                backdropFilter: 'blur(10px)',
                WebkitBackdropFilter: 'blur(10px)',
                color: '#fff',
                border: '1px solid rgba(255, 255, 255, 0.2)',
                borderRadius: '50%',
                cursor: 'pointer',
                boxShadow: `0 4px 15px rgba(${themeColorRgb}, 0.3), inset 0 1px 0 rgba(255, 255, 255, 0.2)`,
                transition: 'all 0.3s ease',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                margin: '0 auto'
              }}
              onMouseEnter={(e) => {
                e.target.style.backgroundColor = `rgba(${themeColorRgb}, 0.85)`
                e.target.style.transform = 'scale(0.95)'
              }}
              onMouseLeave={(e) => {
                e.target.style.backgroundColor = `rgba(${themeColorRgb}, 0.7)`
                e.target.style.transform = 'scale(1)'
              }}
            >
              0
            </button>
            <button
              type="submit"
              disabled={loading}
              style={{
                background: 'none',
                border: 'none',
                padding: 0,
                fontSize: '16px',
                fontWeight: 500,
                color: loading ? 'var(--text-tertiary)' : 'var(--text-primary)',
                cursor: loading ? 'not-allowed' : 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                margin: '0 auto'
              }}
            >
              {loading ? '...' : 'Login'}
            </button>
          </div>

          {error && (
            <div className="alert alert-error" style={{ marginTop: '20px', marginBottom: '0' }}>
              {error}
            </div>
          )}
        </form>
      </div>
      )}
    </div>
  )
}

export default Login

