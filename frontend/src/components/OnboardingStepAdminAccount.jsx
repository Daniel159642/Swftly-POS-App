import { useState, useEffect } from 'react'
import { SignUp, useUser, useAuth } from '@clerk/clerk-react'
import { useTheme } from '../contexts/ThemeContext'
import OnboardingHeader from './OnboardingHeader'

function OnboardingStepAdminAccount({ onNext, onBack, adminAccount, setAdminAccount, direction = 'forward' }) {
  const { themeColor } = useTheme()
  const { user, isLoaded } = useUser()
  const { isSignedIn } = useAuth()
  const [clerkUserId, setClerkUserId] = useState(adminAccount?.clerk_user_id || '')
  const [pin, setPin] = useState(adminAccount?.pin || '')
  const [pinGenerated, setPinGenerated] = useState(!!adminAccount?.pin)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  
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
            Step 1: Create Your Main Account
          </h3>
          <p style={{
            fontSize: '14px',
            color: 'var(--text-secondary)',
            marginBottom: '20px'
          }}>
            Create your main account using email and password. This will be your primary login for the POS system.
          </p>
          
          {!user ? (
            <div style={{
              border: `2px dashed rgba(${themeColorRgb}, 0.3)`,
              borderRadius: '8px',
              padding: '20px',
              backgroundColor: 'var(--bg-secondary)',
              position: 'relative',
              zIndex: 1,
              pointerEvents: 'auto'
            }}>
              <div style={{ pointerEvents: 'auto', minHeight: '400px' }}>
                {!isLoaded ? (
                  <div style={{ textAlign: 'center', padding: '40px', color: 'var(--text-secondary)' }}>
                    Loading Clerk sign-up...
                  </div>
                ) : (
                  <SignUp 
                    routing="virtual"
                    signInUrl="/master-login"
                    afterSignUpUrl="/onboarding"
                    appearance={{
                    elements: {
                      rootBox: {
                        margin: '0 auto',
                        pointerEvents: 'auto'
                      },
                      card: {
                        backgroundColor: 'var(--bg-primary)',
                        boxShadow: 'none',
                        pointerEvents: 'auto'
                      },
                      headerTitle: {
                        color: 'var(--text-primary)'
                      },
                      headerSubtitle: {
                        color: 'var(--text-secondary)'
                      },
                      formButtonPrimary: {
                        backgroundColor: themeColor,
                        '&:hover': {
                          backgroundColor: themeColor,
                          opacity: 0.9
                        }
                      },
                      formFieldInput: {
                        backgroundColor: 'var(--bg-secondary)',
                        color: 'var(--text-primary)',
                        borderColor: 'var(--border-light)',
                        pointerEvents: 'auto'
                      },
                      formFieldLabel: {
                        color: 'var(--text-primary)'
                      },
                      footerActionLink: {
                        color: themeColor
                      }
                    }
                  }}
                  />
                )}
              </div>
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
