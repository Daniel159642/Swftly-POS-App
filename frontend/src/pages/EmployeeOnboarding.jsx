import { useState, useEffect } from 'react'
import { useSignUp, useUser } from '@clerk/clerk-react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { useTheme } from '../contexts/ThemeContext'

function EmployeeOnboarding() {
  const { isLoaded, signUp, setActive } = useSignUp()
  const { user } = useUser()
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const { themeColor } = useTheme()
  const [pin, setPin] = useState('')
  const [confirmPin, setConfirmPin] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [step, setStep] = useState(1) // 1 = Complete signup, 2 = PIN setup
  
  // Convert hex to RGB for rgba usage
  const hexToRgb = (hex) => {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex)
    return result ? `${parseInt(result[1], 16)}, ${parseInt(result[2], 16)}, ${parseInt(result[3], 16)}` : '132, 0, 255'
  }
  
  const themeColorRgb = hexToRgb(themeColor)

  useEffect(() => {
    // Check if user is already signed up and just needs PIN setup
    if (isLoaded && user) {
      checkEmployeeStatus()
    }
  }, [isLoaded, user])

  const checkEmployeeStatus = async () => {
    try {
      const response = await fetch(`/api/clerk/employee?clerk_user_id=${user.id}`)
      const data = await response.json()
      
      if (data.success && data.employee) {
        // Employee already linked and has PIN
        if (data.employee.pin_code) {
          // Redirect to login
          navigate('/login')
        } else {
          // Need to set up PIN
          setStep(2)
        }
      } else {
        // Need to complete signup first (step 1)
        setStep(1)
      }
    } catch (err) {
      console.error('Error checking employee status:', err)
    }
  }

  const handleCompleteSignup = async () => {
    if (!isLoaded || !signUp) {
      setError('Please wait for authentication to load')
      return
    }

    setLoading(true)
    setError('')

    try {
      // Complete signup if needed
      if (signUp.status === 'missing_requirements') {
        await signUp.attemptEmailAddressVerification({
          code: searchParams.get('code') || ''
        })
      }

      // Check employee link
      await checkEmployeeStatus()
      
      if (user && signUp.status === 'complete') {
        await setActive({ session: signUp.createdSessionId })
        setStep(2)
      }
    } catch (err) {
      setError(err?.errors?.[0]?.message || 'Failed to complete signup')
    } finally {
      setLoading(false)
    }
  }

  const handleNumpadClick = (value, target = 'pin') => {
    if (value === 'backspace') {
      if (target === 'pin') {
        setPin(prev => prev.slice(0, -1))
      } else {
        setConfirmPin(prev => prev.slice(0, -1))
      }
    } else {
      if (target === 'pin') {
        setPin(prev => {
          if (prev.length >= 6) return prev
          return prev + value
        })
      } else {
        setConfirmPin(prev => {
          if (prev.length >= 6) return prev
          return prev + value
        })
      }
    }
  }

  const handlePinSetup = async () => {
    if (pin.length !== 6) {
      setError('PIN must be 6 digits')
      return
    }

    if (pin !== confirmPin) {
      setError('PINs do not match')
      return
    }

    if (!user) {
      setError('You must be signed in to set up your PIN')
      return
    }

    setLoading(true)
    setError('')

    try {
      // Link Clerk user to employee and set PIN
      const response = await fetch('/api/clerk/link', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          clerk_user_id: user.id,
          pin_code: pin
        })
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.message || 'Failed to link account')
      }

      // Success - redirect to login
      navigate('/login', { state: { message: 'PIN setup complete! Please log in with your PIN.' } })
    } catch (err) {
      setError(err.message || 'Failed to set up PIN. Please try again.')
    } finally {
      setLoading(false)
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
        padding: '40px',
        borderRadius: '12px',
        boxShadow: '0 4px 20px var(--shadow)',
        border: '1px solid var(--border-light)',
        width: '100%',
        maxWidth: '500px'
      }}>
        {step === 1 ? (
          <>
            <h1 style={{
              fontSize: '24px',
              fontWeight: 600,
              color: 'var(--text-primary)',
              marginBottom: '8px',
              textAlign: 'center'
            }}>
              Complete Your Account
            </h1>
            <p style={{
              fontSize: '14px',
              color: 'var(--text-secondary)',
              marginBottom: '24px',
              textAlign: 'center'
            }}>
              Please complete your Clerk account setup to continue
            </p>

            {error && (
              <div style={{
                padding: '12px',
                backgroundColor: '#ffebee',
                color: '#d32f2f',
                borderRadius: '8px',
                marginBottom: '20px',
                fontSize: '14px'
              }}>
                {error}
              </div>
            )}

            <button
              onClick={handleCompleteSignup}
              disabled={loading}
              style={{
                width: '100%',
                padding: '12px',
                backgroundColor: loading 
                  ? `rgba(${themeColorRgb}, 0.4)` 
                  : `rgba(${themeColorRgb}, 0.7)`,
                backdropFilter: 'blur(10px)',
                WebkitBackdropFilter: 'blur(10px)',
                color: '#fff',
                border: 'none',
                borderRadius: '8px',
                fontSize: '16px',
                fontWeight: 600,
                cursor: loading ? 'not-allowed' : 'pointer',
                boxShadow: loading 
                  ? 'none'
                  : `0 4px 15px rgba(${themeColorRgb}, 0.3), inset 0 1px 0 rgba(255, 255, 255, 0.2)`,
                transition: 'all 0.3s ease'
              }}
            >
              {loading ? 'Processing...' : 'Continue'}
            </button>
          </>
        ) : (
          <>
            <h1 style={{
              fontSize: '24px',
              fontWeight: 600,
              color: 'var(--text-primary)',
              marginBottom: '8px',
              textAlign: 'center'
            }}>
              Set Up Your PIN
            </h1>
            <p style={{
              fontSize: '14px',
              color: 'var(--text-secondary)',
              marginBottom: '32px',
              textAlign: 'center'
            }}>
              Create a 6-digit PIN to access your dashboard
            </p>

            {/* PIN Input */}
            <div style={{ marginBottom: '24px' }}>
              <label style={{
                display: 'block',
                fontSize: '14px',
                fontWeight: 500,
                marginBottom: '12px',
                color: 'var(--text-primary)'
              }}>
                Enter PIN
              </label>
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
                    backgroundColor: index < pin.length ? '#666' : 'transparent',
                    border: '2px solid #666',
                    transition: 'background-color 0.2s ease'
                  }}>
                  </div>
                ))}
              </div>
            </div>

            {/* Confirm PIN Input */}
            <div style={{ marginBottom: '24px' }}>
              <label style={{
                display: 'block',
                fontSize: '14px',
                fontWeight: 500,
                marginBottom: '12px',
                color: 'var(--text-primary)'
              }}>
                Confirm PIN
              </label>
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
                    backgroundColor: index < confirmPin.length ? '#666' : 'transparent',
                    border: '2px solid #666',
                    transition: 'background-color 0.2s ease'
                  }}>
                  </div>
                ))}
              </div>
            </div>

            {/* Numpad */}
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(3, 1fr)',
              gap: '8px',
              marginTop: '20px',
              marginBottom: '8px'
            }}>
              {[1, 2, 3, 4, 5, 6, 7, 8, 9].map(num => (
                <button
                  key={num}
                  type="button"
                  onClick={() => {
                    if (pin.length < 6) {
                      handleNumpadClick(num.toString(), 'pin')
                    } else if (confirmPin.length < 6) {
                      handleNumpadClick(num.toString(), 'confirm')
                    }
                  }}
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
              marginBottom: '20px'
            }}>
              <button
                type="button"
                onClick={() => handleNumpadClick('backspace', pin.length < 6 ? 'pin' : 'confirm')}
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
                onClick={() => {
                  if (pin.length < 6) {
                    handleNumpadClick('0', 'pin')
                  } else if (confirmPin.length < 6) {
                    handleNumpadClick('0', 'confirm')
                  }
                }}
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
                onClick={handlePinSetup}
                disabled={loading || pin.length !== 6 || confirmPin.length !== 6}
                style={{
                  background: 'none',
                  border: 'none',
                  padding: 0,
                  fontSize: '16px',
                  fontWeight: 500,
                  color: (loading || pin.length !== 6 || confirmPin.length !== 6) 
                    ? 'var(--text-tertiary)' 
                    : 'var(--text-primary)',
                  cursor: (loading || pin.length !== 6 || confirmPin.length !== 6) 
                    ? 'not-allowed' 
                    : 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  margin: '0 auto'
                }}
              >
                {loading ? '...' : 'Continue'}
              </button>
            </div>

            {error && (
              <div style={{
                padding: '12px',
                backgroundColor: '#ffebee',
                color: '#d32f2f',
                borderRadius: '8px',
                marginTop: '20px',
                fontSize: '14px',
                textAlign: 'center'
              }}>
                {error}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  )
}

export default EmployeeOnboarding
