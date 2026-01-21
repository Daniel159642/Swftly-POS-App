import { useState, useEffect } from 'react'
import { useSignUp, useUser, useAuth } from '@clerk/clerk-react'
import { useTheme } from '../contexts/ThemeContext'
import OnboardingHeader from './OnboardingHeader'

function OnboardingStepAdminAccount({ onNext, onBack, adminAccount, setAdminAccount, direction = 'forward' }) {
  const { themeColor } = useTheme()
  const { user, isLoaded } = useUser()
  const { isSignedIn } = useAuth()
  const { isLoaded: signUpLoaded, signUp, setActive } = useSignUp()
  const [clerkUserId, setClerkUserId] = useState(adminAccount?.clerk_user_id || '')
  const [pin, setPin] = useState(adminAccount?.pin || '')
  const [pinGenerated, setPinGenerated] = useState(!!adminAccount?.pin)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  
  // Signup form state
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [firstName, setFirstName] = useState('')
  const [lastName, setLastName] = useState('')
  const [verificationCode, setVerificationCode] = useState('')
  const [pendingVerification, setPendingVerification] = useState(false)
  
  // Debug logging
  useEffect(() => {
    console.log('OnboardingStepAdminAccount - isLoaded:', isLoaded, 'isSignedIn:', isSignedIn, 'user:', user)
  }, [isLoaded, isSignedIn, user])

  const hexToRgb = (hex) => {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex)
    return result ? `${parseInt(result[1], 16)}, ${parseInt(result[2], 16)}, ${parseInt(result[3], 16)}` : '132, 0, 255'
  }
  
  const themeColorRgb = hexToRgb(themeColor)

  useEffect(() => {
    if (isLoaded && user && user.id && clerkUserId !== user.id) {
      const userId = user.id
      setClerkUserId(userId)
      setAdminAccount(prev => {
        // Only update if the value actually changed
        if (prev?.clerk_user_id === userId) {
          return prev
        }
        return { ...prev, clerk_user_id: userId }
      })
    }
  }, [isLoaded, user?.id, clerkUserId]) // Removed setAdminAccount from dependencies - it's a stable function reference

  // Reset verification state when user signs up
  useEffect(() => {
    if (user) {
      setPendingVerification(false)
      setVerificationCode('')
      setEmail('')
      setPassword('')
      setFirstName('')
      setLastName('')
    }
  }, [user])

  const generatePin = async () => {
    try {
      setLoading(true)
      setError('')
      const response = await fetch('/api/generate-pin', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        }
      })
      const data = await response.json()
      
      if (data.success && data.pin) {
        const newPin = data.pin
        setPin(newPin)
        setPinGenerated(true)
        // Use functional update to avoid dependency issues
        setAdminAccount(prev => {
          const updated = { ...prev, pin: newPin }
          if (clerkUserId) {
            updated.clerk_user_id = clerkUserId
          }
          return updated
        })
      } else {
        setError(data.message || 'Failed to generate PIN')
      }
    } catch (err) {
      setError('Failed to generate PIN. Please try again.')
      console.error('Error generating PIN:', err)
    } finally {
      setLoading(false)
    }
  }

  const handleNext = () => {
    if (!clerkUserId) {
      setError('Please create your Clerk account first')
      return
    }
    if (!pin) {
      setError('Please generate a PIN')
      return
    }
    
    // Prepare the admin account data to pass to parent
    const adminAccountData = {
      clerk_user_id: clerkUserId,
      pin: pin
    }
    
    // Update local state
    setAdminAccount(prev => {
      if (prev?.clerk_user_id === clerkUserId && prev?.pin === pin) {
        return prev
      }
      return adminAccountData
    })
    
    // Pass the admin account data to the parent component
    onNext(adminAccountData)
  }

  return (
    <div style={{ width: '100%', maxWidth: '800px', margin: '0 auto', padding: '20px' }}>
      <OnboardingHeader 
        title="Create Admin Account"
        subtitle="Set up your main account and PIN for dashboard access"
        step={1}
        totalSteps={7}
        direction={direction}
      />

      <div style={{
        backgroundColor: 'var(--bg-primary)',
        borderRadius: '12px',
        padding: '32px',
        marginTop: '24px',
        boxShadow: '0 2px 8px var(--shadow)',
        border: '1px solid var(--border-light)'
      }}>
        {/* Clerk Sign Up */}
        <div style={{ marginBottom: '32px' }}>
          <h3 style={{
            fontSize: '18px',
            fontWeight: 600,
            marginBottom: '16px',
            color: 'var(--text-primary)'
          }}>
            Step 1: Create Your Account
          </h3>
          <p style={{
            fontSize: '14px',
            color: 'var(--text-secondary)',
            marginBottom: '20px'
          }}>
            Create your account using email and password. This will create your establishment and admin account for the POS system.
          </p>
          
          {!user ? (
            <div style={{
              border: `2px dashed rgba(${themeColorRgb}, 0.3)`,
              borderRadius: '8px',
              padding: '24px',
              backgroundColor: 'var(--bg-secondary)'
            }}>
              {pendingVerification ? (
                <form onSubmit={async (e) => {
                  e.preventDefault()
                  setError('')
                  setLoading(true)
                  try {
                    if (!signUpLoaded || !signUp) {
                      throw new Error('Please wait for authentication to load')
                    }
                    const result = await signUp.attemptEmailAddressVerification({
                      code: verificationCode,
                    })
                    if (result.status === 'complete') {
                      await setActive({ session: signUp.createdSessionId })
                      // Wait for user to be set
                      await new Promise(resolve => setTimeout(resolve, 500))
                      setPendingVerification(false)
                      // User will be set after session is active, component will re-render
                    }
                  } catch (err) {
                    setError(err?.errors?.[0]?.message || 'Invalid verification code')
                  } finally {
                    setLoading(false)
                  }
                }}>
                  <div style={{ marginBottom: '16px' }}>
                    <label style={{
                      display: 'block',
                      fontSize: '14px',
                      fontWeight: 500,
                      color: 'var(--text-primary)',
                      marginBottom: '8px'
                    }}>
                      Verification Code
                    </label>
                    <input
                      type="text"
                      value={verificationCode}
                      onChange={(e) => setVerificationCode(e.target.value)}
                      placeholder="Enter 6-digit code"
                      required
                      maxLength={6}
                      style={{
                        width: '100%',
                        padding: '14px 16px',
                        border: `2px solid rgba(${themeColorRgb}, 0.4)`,
                        borderRadius: '12px',
                        fontSize: '20px',
                        fontFamily: 'monospace',
                        letterSpacing: '8px',
                        textAlign: 'center',
                        background: 'var(--bg-primary)',
                        color: 'var(--text-primary)',
                        outline: 'none'
                      }}
                    />
                  </div>
                  <button
                    type="submit"
                    disabled={loading || verificationCode.length !== 6}
                    style={{
                      width: '100%',
                      padding: '12px',
                      backgroundColor: (loading || verificationCode.length !== 6) 
                        ? 'var(--bg-secondary)' 
                        : `rgba(${themeColorRgb}, 0.7)`,
                      color: '#fff',
                      border: 'none',
                      borderRadius: '8px',
                      cursor: (loading || verificationCode.length !== 6) ? 'not-allowed' : 'pointer',
                      opacity: (loading || verificationCode.length !== 6) ? 0.6 : 1
                    }}
                  >
                    {loading ? 'Verifying...' : 'Verify Email'}
                  </button>
                </form>
              ) : (
                <form onSubmit={async (e) => {
                  e.preventDefault()
                  setError('')
                  setLoading(true)
                  try {
                    if (!signUpLoaded || !signUp) {
                      throw new Error('Please wait for authentication to load')
                    }
                    await signUp.create({
                      emailAddress: email,
                      password: password,
                      firstName: firstName || undefined,
                      lastName: lastName || undefined,
                    })
                    if (signUp.status === 'missing_requirements') {
                      // Email verification required
                      await signUp.prepareEmailAddressVerification({ strategy: 'email_code' })
                      setPendingVerification(true)
                    } else if (signUp.status === 'complete') {
                      // Signup complete without verification needed
                      await setActive({ session: signUp.createdSessionId })
                      // Wait for user to be set
                      await new Promise(resolve => setTimeout(resolve, 500))
                    }
                  } catch (err) {
                    setError(err?.errors?.[0]?.message || 'Failed to create account')
                  } finally {
                    setLoading(false)
                  }
                }}>
                  <div style={{ marginBottom: '16px' }}>
                    <label style={{
                      display: 'block',
                      fontSize: '14px',
                      fontWeight: 500,
                      color: 'var(--text-primary)',
                      marginBottom: '8px'
                    }}>
                      First Name (Optional)
                    </label>
                    <input
                      type="text"
                      value={firstName}
                      onChange={(e) => setFirstName(e.target.value)}
                      placeholder="John"
                      style={{
                        width: '100%',
                        padding: '14px 16px',
                        border: `2px solid rgba(${themeColorRgb}, 0.4)`,
                        borderRadius: '12px',
                        fontSize: '15px',
                        background: 'var(--bg-primary)',
                        color: 'var(--text-primary)',
                        outline: 'none'
                      }}
                    />
                  </div>
                  <div style={{ marginBottom: '16px' }}>
                    <label style={{
                      display: 'block',
                      fontSize: '14px',
                      fontWeight: 500,
                      color: 'var(--text-primary)',
                      marginBottom: '8px'
                    }}>
                      Last Name (Optional)
                    </label>
                    <input
                      type="text"
                      value={lastName}
                      onChange={(e) => setLastName(e.target.value)}
                      placeholder="Doe"
                      style={{
                        width: '100%',
                        padding: '14px 16px',
                        border: `2px solid rgba(${themeColorRgb}, 0.4)`,
                        borderRadius: '12px',
                        fontSize: '15px',
                        background: 'var(--bg-primary)',
                        color: 'var(--text-primary)',
                        outline: 'none'
                      }}
                    />
                  </div>
                  <div style={{ marginBottom: '16px' }}>
                    <label style={{
                      display: 'block',
                      fontSize: '14px',
                      fontWeight: 500,
                      color: 'var(--text-primary)',
                      marginBottom: '8px'
                    }}>
                      Email Address *
                    </label>
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="you@example.com"
                      required
                      style={{
                        width: '100%',
                        padding: '14px 16px',
                        border: `2px solid rgba(${themeColorRgb}, 0.4)`,
                        borderRadius: '12px',
                        fontSize: '15px',
                        background: 'var(--bg-primary)',
                        color: 'var(--text-primary)',
                        outline: 'none'
                      }}
                    />
                  </div>
                  <div style={{ marginBottom: '20px' }}>
                    <label style={{
                      display: 'block',
                      fontSize: '14px',
                      fontWeight: 500,
                      color: 'var(--text-primary)',
                      marginBottom: '8px'
                    }}>
                      Password *
                    </label>
                    <input
                      type="password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="Create a strong password"
                      required
                      minLength={8}
                      style={{
                        width: '100%',
                        padding: '14px 16px',
                        border: `2px solid rgba(${themeColorRgb}, 0.4)`,
                        borderRadius: '12px',
                        fontSize: '15px',
                        background: 'var(--bg-primary)',
                        color: 'var(--text-primary)',
                        outline: 'none'
                      }}
                    />
                  </div>
                  
                  {/* Google Sign Up Button */}
                  <button
                    type="button"
                    onClick={async () => {
                      if (!signUpLoaded || !signUp) {
                        setError('Please wait for authentication to load')
                        return
                      }
                      try {
                        setError('')
                        setLoading(true)
                        // Redirect to Google OAuth
                        await signUp.authenticateWithRedirect({
                          strategy: 'oauth_google',
                          redirectUrl: '/onboarding',
                          redirectUrlComplete: '/onboarding'
                        })
                      } catch (err) {
                        console.error('Google sign up error:', err)
                        setError(err?.errors?.[0]?.message || 'Failed to sign up with Google. Please try again.')
                        setLoading(false)
                      }
                    }}
                    disabled={loading || !signUpLoaded}
                    style={{
                      width: '100%',
                      padding: '12px',
                      fontSize: '16px',
                      fontWeight: 600,
                      backgroundColor: loading || !signUpLoaded ? 'var(--bg-secondary)' : '#fff',
                      color: loading || !signUpLoaded ? 'var(--text-secondary)' : '#1f1f1f',
                      border: '2px solid var(--border-light)',
                      borderRadius: '8px',
                      cursor: (loading || !signUpLoaded) ? 'not-allowed' : 'pointer',
                      opacity: (loading || !signUpLoaded) ? 0.6 : 1,
                      boxShadow: (loading || !signUpLoaded) 
                        ? 'none' 
                        : '0 2px 8px rgba(0, 0, 0, 0.1)',
                      transition: 'all 0.3s ease',
                      marginBottom: '12px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '10px'
                    }}
                    onMouseEnter={(e) => {
                      if (!loading && signUpLoaded) {
                        e.target.style.boxShadow = '0 4px 12px rgba(0, 0, 0, 0.15)'
                        e.target.style.transform = 'scale(0.98)'
                      }
                    }}
                    onMouseLeave={(e) => {
                      if (!loading && signUpLoaded) {
                        e.target.style.boxShadow = '0 2px 8px rgba(0, 0, 0, 0.1)'
                        e.target.style.transform = 'scale(1)'
                      }
                    }}
                  >
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
                      <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                      <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                      <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
                      <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
                    </svg>
                    {loading ? 'Connecting...' : 'Continue with Google'}
                  </button>

                  {/* Divider */}
                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    marginBottom: '12px'
                  }}>
                    <div style={{
                      flex: 1,
                      height: '1px',
                      backgroundColor: 'var(--border-light)'
                    }} />
                    <span style={{
                      padding: '0 12px',
                      fontSize: '13px',
                      color: 'var(--text-tertiary)'
                    }}>
                      or
                    </span>
                    <div style={{
                      flex: 1,
                      height: '1px',
                      backgroundColor: 'var(--border-light)'
                    }} />
                  </div>

                  <button
                    type="submit"
                    disabled={loading || !email || !password}
                    style={{
                      width: '100%',
                      padding: '12px',
                      backgroundColor: (loading || !email || !password) 
                        ? 'var(--bg-secondary)' 
                        : `rgba(${themeColorRgb}, 0.7)`,
                      color: '#fff',
                      border: 'none',
                      borderRadius: '8px',
                      cursor: (loading || !email || !password) ? 'not-allowed' : 'pointer',
                      opacity: (loading || !email || !password) ? 0.6 : 1
                    }}
                  >
                    {loading ? 'Creating Account...' : 'Create Account with Email'}
                  </button>
                </form>
              )}
              {error && (
                <div style={{
                  padding: '12px',
                  backgroundColor: 'rgba(239, 68, 68, 0.1)',
                  border: '1px solid rgba(239, 68, 68, 0.3)',
                  borderRadius: '8px',
                  color: '#ef4444',
                  marginTop: '16px',
                  fontSize: '14px'
                }}>
                  {error}
                </div>
              )}
            </div>
          ) : (
            <div style={{
              padding: '16px',
              backgroundColor: 'rgba(34, 197, 94, 0.1)',
              border: '1px solid rgba(34, 197, 94, 0.3)',
              borderRadius: '8px',
              color: 'var(--text-primary)'
            }}>
              ✓ Account created successfully: {user.primaryEmailAddress?.emailAddress}
            </div>
          )}
        </div>

        {/* PIN Generation */}
        <div style={{ marginBottom: '32px' }}>
          <h3 style={{
            fontSize: '18px',
            fontWeight: 600,
            marginBottom: '16px',
            color: 'var(--text-primary)'
          }}>
            Step 2: Generate Dashboard PIN
          </h3>
          <p style={{
            fontSize: '14px',
            color: 'var(--text-secondary)',
            marginBottom: '20px'
          }}>
            Generate a 6-digit PIN that you'll use to quickly log into the dashboard after authenticating with your main account.
          </p>

          {!pinGenerated ? (
            <button
              onClick={generatePin}
              disabled={loading || !user}
              style={{
                padding: '12px 24px',
                backgroundColor: user ? `rgba(${themeColorRgb}, 0.7)` : 'var(--bg-secondary)',
                color: '#fff',
                border: 'none',
                borderRadius: '8px',
                fontSize: '16px',
                fontWeight: 600,
                cursor: user && !loading ? 'pointer' : 'not-allowed',
                opacity: user && !loading ? 1 : 0.6,
                boxShadow: user ? `0 4px 15px rgba(${themeColorRgb}, 0.3)` : 'none'
              }}
            >
              {loading ? 'Generating...' : 'Generate PIN'}
            </button>
          ) : (
            <div>
              <div style={{
                padding: '20px',
                backgroundColor: 'var(--bg-secondary)',
                borderRadius: '8px',
                border: `2px solid rgba(${themeColorRgb}, 0.3)`,
                marginBottom: '16px'
              }}>
                <div style={{
                  fontSize: '32px',
                  fontFamily: 'monospace',
                  letterSpacing: '8px',
                  textAlign: 'center',
                  color: 'var(--text-primary)',
                  fontWeight: 600
                }}>
                  {pin}
                </div>
              </div>
              <p style={{
                fontSize: '12px',
                color: 'var(--text-tertiary)',
                textAlign: 'center',
                marginTop: '8px'
              }}>
                Save this PIN securely. You'll need it to access the dashboard.
              </p>
              <button
                onClick={generatePin}
                disabled={loading}
                style={{
                  padding: '8px 16px',
                  backgroundColor: 'transparent',
                  color: 'var(--text-secondary)',
                  border: '1px solid var(--border-light)',
                  borderRadius: '6px',
                  fontSize: '14px',
                  cursor: loading ? 'not-allowed' : 'pointer',
                  marginTop: '12px'
                }}
              >
                {loading ? 'Generating...' : 'Generate New PIN'}
              </button>
            </div>
          )}
        </div>

        {error && (
          <div style={{
            padding: '12px',
            backgroundColor: 'rgba(239, 68, 68, 0.1)',
            border: '1px solid rgba(239, 68, 68, 0.3)',
            borderRadius: '8px',
            color: '#ef4444',
            marginBottom: '20px'
          }}>
            {error}
          </div>
        )}

        {/* Navigation */}
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          marginTop: '32px',
          paddingTop: '24px',
          borderTop: '1px solid var(--border-light)'
        }}>
          <button
            onClick={onBack}
            style={{
              padding: '12px 24px',
              backgroundColor: 'transparent',
              color: 'var(--text-primary)',
              border: '1px solid var(--border-light)',
              borderRadius: '8px',
              fontSize: '16px',
              cursor: 'pointer'
            }}
          >
            Back
          </button>
          <button
            onClick={handleNext}
            disabled={!user || !pin}
            style={{
              padding: '12px 32px',
              backgroundColor: (user && pin) ? `rgba(${themeColorRgb}, 0.7)` : 'var(--bg-secondary)',
              color: '#fff',
              border: 'none',
              borderRadius: '8px',
              fontSize: '16px',
              fontWeight: 600,
              cursor: (user && pin) ? 'pointer' : 'not-allowed',
              opacity: (user && pin) ? 1 : 0.6,
              boxShadow: (user && pin) ? `0 4px 15px rgba(${themeColorRgb}, 0.3)` : 'none'
            }}
          >
            Continue
          </button>
        </div>
      </div>
    </div>
  )
}

export default OnboardingStepAdminAccount
