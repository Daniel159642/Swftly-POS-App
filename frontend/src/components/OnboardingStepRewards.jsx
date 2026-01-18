import { useState, useEffect } from 'react'
import { useTheme } from '../contexts/ThemeContext'
import OnboardingHeader from './OnboardingHeader'
import { ArrowLeft } from 'lucide-react'

function OnboardingStepRewards({ onNext, onBack, direction = 'forward' }) {
  const { themeColor } = useTheme()
  const [rewardsEnabled, setRewardsEnabled] = useState(false)
  const [requireEmail, setRequireEmail] = useState(false)
  const [requirePhone, setRequirePhone] = useState(false)
  const [requireBoth, setRequireBoth] = useState(false)
  const [rewardType, setRewardType] = useState('points') // 'points', 'percentage', 'fixed'
  const [pointsPerDollar, setPointsPerDollar] = useState('1.0')
  const [percentageDiscount, setPercentageDiscount] = useState('0.0')
  const [fixedDiscount, setFixedDiscount] = useState('0.0')
  const [minimumSpend, setMinimumSpend] = useState('0.0')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  
  // Convert hex to RGB
  const hexToRgb = (hex) => {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex)
    return result ? `${parseInt(result[1], 16)}, ${parseInt(result[2], 16)}, ${parseInt(result[3], 16)}` : '132, 0, 255'
  }
  
  const themeColorRgb = hexToRgb(themeColor)
  
  // Load existing settings on mount
  useEffect(() => {
    loadExistingSettings()
  }, [])
  
  const loadExistingSettings = async () => {
    try {
      const response = await fetch('/api/customer-rewards-settings')
      const data = await response.json()
      if (data.success && data.settings) {
        setRewardsEnabled(data.settings.enabled === 1 || data.settings.enabled === true)
        setRequireEmail(data.settings.require_email === 1 || data.settings.require_email === true)
        setRequirePhone(data.settings.require_phone === 1 || data.settings.require_phone === true)
        setRequireBoth(data.settings.require_both === 1 || data.settings.require_both === true)
        setRewardType(data.settings.reward_type || 'points')
        setPointsPerDollar((data.settings.points_per_dollar || 1.0).toString())
        setPercentageDiscount((data.settings.percentage_discount || 0.0).toString())
        setFixedDiscount((data.settings.fixed_discount || 0.0).toString())
        setMinimumSpend((data.settings.minimum_spend || 0.0).toString())
      }
    } catch (err) {
      console.error('Error loading settings:', err)
      // Don't show error, just use defaults
    }
  }
  
  const handleRequirementChange = (type) => {
    if (type === 'none') {
      setRequireEmail(false)
      setRequirePhone(false)
      setRequireBoth(false)
    } else if (type === 'email') {
      setRequireEmail(true)
      setRequirePhone(false)
      setRequireBoth(false)
    } else if (type === 'phone') {
      setRequireEmail(false)
      setRequirePhone(true)
      setRequireBoth(false)
    } else if (type === 'both') {
      setRequireEmail(true)
      setRequirePhone(true)
      setRequireBoth(true)
    }
  }
  
  const handleNext = async () => {
    setLoading(true)
    setError('')
    setSuccess('')
    
    try {
      // Validate reward settings if enabled
      if (rewardsEnabled) {
        if (rewardType === 'points') {
          const points = parseFloat(pointsPerDollar)
          if (isNaN(points) || points < 0) {
            setError('Please enter a valid points per dollar value (0 or greater)')
            setLoading(false)
            return
          }
        } else if (rewardType === 'percentage') {
          const percentage = parseFloat(percentageDiscount)
          if (isNaN(percentage) || percentage < 0 || percentage > 100) {
            setError('Please enter a valid percentage discount (0-100)')
            setLoading(false)
            return
          }
        } else if (rewardType === 'fixed') {
          const fixed = parseFloat(fixedDiscount)
          if (isNaN(fixed) || fixed < 0) {
            setError('Please enter a valid fixed discount amount (0 or greater)')
            setLoading(false)
            return
          }
        }
        
        const minSpend = parseFloat(minimumSpend)
        if (isNaN(minSpend) || minSpend < 0) {
          setError('Please enter a valid minimum spend amount (0 or greater)')
          setLoading(false)
          return
        }
      }
      
      // Save rewards settings
      const response = await fetch('/api/customer-rewards-settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          enabled: rewardsEnabled ? 1 : 0,
          require_email: requireEmail ? 1 : 0,
          require_phone: requirePhone ? 1 : 0,
          require_both: requireBoth ? 1 : 0,
          reward_type: rewardType,
          points_per_dollar: parseFloat(pointsPerDollar) || 1.0,
          percentage_discount: parseFloat(percentageDiscount) || 0.0,
          fixed_discount: parseFloat(fixedDiscount) || 0.0,
          minimum_spend: parseFloat(minimumSpend) || 0.0
        })
      })
      
      if (!response.ok) {
        throw new Error('Failed to save customer rewards settings')
      }
      
      const data = await response.json()
      if (!data.success) {
        throw new Error(data.message || 'Failed to save settings')
      }
      
      setSuccess('Customer rewards settings saved successfully!')
      setTimeout(() => {
        onNext()
      }, 500)
    } catch (err) {
      console.error('Error saving customer rewards settings:', err)
      setError(err.message || 'Failed to save settings. Please try again.')
    } finally {
      setLoading(false)
    }
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
          Customer Rewards Setup
        </h2>
      
        <p style={{ 
          marginBottom: '30px',
          color: 'var(--text-secondary, #666)',
          fontSize: '16px',
          lineHeight: '1.6'
        }}>
          Configure your customer rewards program. You can always change this later in settings.
        </p>
        
        {/* Enable Rewards */}
        <div style={{ marginBottom: '30px' }}>
          <div style={{
            padding: '20px',
            border: `1px solid ${rewardsEnabled ? `rgba(${themeColorRgb}, 0.3)` : '#ddd'}`,
            borderRadius: '8px',
            backgroundColor: rewardsEnabled ? `rgba(${themeColorRgb}, 0.05)` : 'var(--bg-secondary, #f5f5f5)',
            transition: 'all 0.2s'
          }}>
            <label style={{
              display: 'flex',
              alignItems: 'center',
              gap: '12px',
              cursor: 'pointer',
              fontWeight: 600,
              fontSize: '18px',
              color: 'var(--text-primary, #000)'
            }}>
              <input
                type="checkbox"
                checked={rewardsEnabled}
                onChange={(e) => setRewardsEnabled(e.target.checked)}
                style={{ width: '20px', height: '20px', cursor: 'pointer' }}
              />
              Enable Customer Rewards Program
            </label>
            <p style={{ margin: '10px 0 0 0', color: 'var(--text-secondary, #666)', fontSize: '14px' }}>
              Allow customers to earn rewards for purchases.
            </p>
          </div>
        </div>
        
        {rewardsEnabled && (
          <>
            {/* Customer Information Requirements */}
            <div style={{ marginBottom: '30px' }}>
              <h3 style={{ 
                marginBottom: '15px',
                color: 'var(--text-primary, #000)',
                fontSize: '22px',
                fontWeight: 600
              }}>
                Customer Information Requirements
              </h3>
              
              <p style={{ 
                marginBottom: '20px',
                color: 'var(--text-secondary, #666)',
                fontSize: '14px',
                lineHeight: '1.6'
              }}>
                Choose what customer information is required to participate in the rewards program.
              </p>
              
              <div style={{
                display: 'flex',
                flexDirection: 'column',
                gap: '15px'
              }}>
                {/* No Requirements */}
                <div
                  onClick={() => handleRequirementChange('none')}
                  style={{
                    padding: '16px',
                    border: `2px solid ${!requireEmail && !requirePhone && !requireBoth ? `rgba(${themeColorRgb}, 0.7)` : '#e0e0e0'}`,
                    borderRadius: '8px',
                    cursor: 'pointer',
                    backgroundColor: (!requireEmail && !requirePhone && !requireBoth) 
                      ? `rgba(${themeColorRgb}, 0.1)` 
                      : 'var(--bg-secondary, #f5f5f5)',
                    transition: 'all 0.2s'
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <input
                      type="radio"
                      checked={!requireEmail && !requirePhone && !requireBoth}
                      onChange={() => handleRequirementChange('none')}
                      style={{ width: '18px', height: '18px', cursor: 'pointer' }}
                    />
                    <span style={{ fontSize: '16px', fontWeight: 500, color: 'var(--text-primary, #000)' }}>
                      No requirements (optional)
                    </span>
                  </div>
                </div>
                
                {/* Require Email */}
                <div
                  onClick={() => handleRequirementChange('email')}
                  style={{
                    padding: '16px',
                    border: `2px solid ${requireEmail && !requireBoth ? `rgba(${themeColorRgb}, 0.7)` : '#e0e0e0'}`,
                    borderRadius: '8px',
                    cursor: 'pointer',
                    backgroundColor: (requireEmail && !requireBoth) 
                      ? `rgba(${themeColorRgb}, 0.1)` 
                      : 'var(--bg-secondary, #f5f5f5)',
                    transition: 'all 0.2s'
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <input
                      type="radio"
                      checked={requireEmail && !requireBoth}
                      onChange={() => handleRequirementChange('email')}
                      style={{ width: '18px', height: '18px', cursor: 'pointer' }}
                    />
                    <span style={{ fontSize: '16px', fontWeight: 500, color: 'var(--text-primary, #000)' }}>
                      Require email
                    </span>
                  </div>
                </div>
                
                {/* Require Phone */}
                <div
                  onClick={() => handleRequirementChange('phone')}
                  style={{
                    padding: '16px',
                    border: `2px solid ${requirePhone && !requireBoth ? `rgba(${themeColorRgb}, 0.7)` : '#e0e0e0'}`,
                    borderRadius: '8px',
                    cursor: 'pointer',
                    backgroundColor: (requirePhone && !requireBoth) 
                      ? `rgba(${themeColorRgb}, 0.1)` 
                      : 'var(--bg-secondary, #f5f5f5)',
                    transition: 'all 0.2s'
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <input
                      type="radio"
                      checked={requirePhone && !requireBoth}
                      onChange={() => handleRequirementChange('phone')}
                      style={{ width: '18px', height: '18px', cursor: 'pointer' }}
                    />
                    <span style={{ fontSize: '16px', fontWeight: 500, color: 'var(--text-primary, #000)' }}>
                      Require phone number
                    </span>
                  </div>
                </div>
                
                {/* Require Both */}
                <div
                  onClick={() => handleRequirementChange('both')}
                  style={{
                    padding: '16px',
                    border: `2px solid ${requireBoth ? `rgba(${themeColorRgb}, 0.7)` : '#e0e0e0'}`,
                    borderRadius: '8px',
                    cursor: 'pointer',
                    backgroundColor: requireBoth 
                      ? `rgba(${themeColorRgb}, 0.1)` 
                      : 'var(--bg-secondary, #f5f5f5)',
                    transition: 'all 0.2s'
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <input
                      type="radio"
                      checked={requireBoth}
                      onChange={() => handleRequirementChange('both')}
                      style={{ width: '18px', height: '18px', cursor: 'pointer' }}
                    />
                    <span style={{ fontSize: '16px', fontWeight: 500, color: 'var(--text-primary, #000)' }}>
                      Require both email and phone number
                    </span>
                  </div>
                </div>
              </div>
            </div>
            
            {/* Reward Type */}
            <div style={{ marginBottom: '30px' }}>
              <h3 style={{ 
                marginBottom: '15px',
                color: 'var(--text-primary, #000)',
                fontSize: '22px',
                fontWeight: 600
              }}>
                Reward Type
              </h3>
              
              <div style={{
                display: 'flex',
                flexDirection: 'column',
                gap: '15px'
              }}>
                {/* Points */}
                <div
                  onClick={() => setRewardType('points')}
                  style={{
                    padding: '20px',
                    border: `2px solid ${rewardType === 'points' ? `rgba(${themeColorRgb}, 0.7)` : '#e0e0e0'}`,
                    borderRadius: '8px',
                    cursor: 'pointer',
                    backgroundColor: rewardType === 'points' 
                      ? `rgba(${themeColorRgb}, 0.1)` 
                      : 'var(--bg-secondary, #f5f5f5)',
                    transition: 'all 0.2s'
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
                    <input
                      type="radio"
                      checked={rewardType === 'points'}
                      onChange={() => setRewardType('points')}
                      style={{ width: '20px', height: '20px', cursor: 'pointer' }}
                    />
                    <div style={{ flex: 1 }}>
                      <h3 style={{ margin: '0 0 5px 0', fontSize: '18px', fontWeight: 600 }}>
                        Points (earn points per dollar spent)
                      </h3>
                      <p style={{ margin: 0, color: 'var(--text-secondary, #666)', fontSize: '14px' }}>
                        Customers earn points based on their purchases.
                      </p>
                    </div>
                  </div>
                </div>
                
                {/* Percentage */}
                <div
                  onClick={() => setRewardType('percentage')}
                  style={{
                    padding: '20px',
                    border: `2px solid ${rewardType === 'percentage' ? `rgba(${themeColorRgb}, 0.7)` : '#e0e0e0'}`,
                    borderRadius: '8px',
                    cursor: 'pointer',
                    backgroundColor: rewardType === 'percentage' 
                      ? `rgba(${themeColorRgb}, 0.1)` 
                      : 'var(--bg-secondary, #f5f5f5)',
                    transition: 'all 0.2s'
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
                    <input
                      type="radio"
                      checked={rewardType === 'percentage'}
                      onChange={() => setRewardType('percentage')}
                      style={{ width: '20px', height: '20px', cursor: 'pointer' }}
                    />
                    <div style={{ flex: 1 }}>
                      <h3 style={{ margin: '0 0 5px 0', fontSize: '18px', fontWeight: 600 }}>
                        Percentage Discount
                      </h3>
                      <p style={{ margin: 0, color: 'var(--text-secondary, #666)', fontSize: '14px' }}>
                        Customers receive a percentage discount on purchases.
                      </p>
                    </div>
                  </div>
                </div>
                
                {/* Fixed */}
                <div
                  onClick={() => setRewardType('fixed')}
                  style={{
                    padding: '20px',
                    border: `2px solid ${rewardType === 'fixed' ? `rgba(${themeColorRgb}, 0.7)` : '#e0e0e0'}`,
                    borderRadius: '8px',
                    cursor: 'pointer',
                    backgroundColor: rewardType === 'fixed' 
                      ? `rgba(${themeColorRgb}, 0.1)` 
                      : 'var(--bg-secondary, #f5f5f5)',
                    transition: 'all 0.2s'
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
                    <input
                      type="radio"
                      checked={rewardType === 'fixed'}
                      onChange={() => setRewardType('fixed')}
                      style={{ width: '20px', height: '20px', cursor: 'pointer' }}
                    />
                    <div style={{ flex: 1 }}>
                      <h3 style={{ margin: '0 0 5px 0', fontSize: '18px', fontWeight: 600 }}>
                        Fixed Discount Amount
                      </h3>
                      <p style={{ margin: 0, color: 'var(--text-secondary, #666)', fontSize: '14px' }}>
                        Customers receive a fixed dollar amount discount.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
            
            {/* Reward Configuration */}
            {rewardType === 'points' && (
              <div style={{ marginBottom: '30px' }}>
                <h3 style={{ 
                  marginBottom: '15px',
                  color: 'var(--text-primary, #000)',
                  fontSize: '22px',
                  fontWeight: 600
                }}>
                  Points Configuration
                </h3>
                
                <label style={{ 
                  display: 'block', 
                  marginBottom: '8px', 
                  fontWeight: 500,
                  fontSize: '14px',
                  color: 'var(--text-primary, #000)'
                }}>
                  Points per Dollar Spent
                </label>
                <input
                  type="number"
                  step="0.1"
                  min="0"
                  value={pointsPerDollar}
                  onChange={(e) => setPointsPerDollar(e.target.value)}
                  placeholder="1.0"
                  style={{
                    width: '100%',
                    padding: '12px',
                    border: `1px solid rgba(${themeColorRgb}, 0.3)`,
                    borderRadius: '8px',
                    fontSize: '16px',
                    backgroundColor: 'var(--bg-secondary, #f5f5f5)',
                    outline: 'none',
                    transition: 'border 0.2s'
                  }}
                  onFocus={(e) => {
                    e.currentTarget.style.border = `1px solid rgba(${themeColorRgb}, 0.7)`
                  }}
                  onBlur={(e) => {
                    e.currentTarget.style.border = `1px solid rgba(${themeColorRgb}, 0.3)`
                  }}
                />
              </div>
            )}
            
            {rewardType === 'percentage' && (
              <div style={{ marginBottom: '30px' }}>
                <h3 style={{ 
                  marginBottom: '15px',
                  color: 'var(--text-primary, #000)',
                  fontSize: '22px',
                  fontWeight: 600
                }}>
                  Percentage Discount Configuration
                </h3>
                
                <label style={{ 
                  display: 'block', 
                  marginBottom: '8px', 
                  fontWeight: 500,
                  fontSize: '14px',
                  color: 'var(--text-primary, #000)'
                }}>
                  Discount Percentage (%)
                </label>
                <input
                  type="number"
                  step="0.1"
                  min="0"
                  max="100"
                  value={percentageDiscount}
                  onChange={(e) => setPercentageDiscount(e.target.value)}
                  placeholder="10.0"
                  style={{
                    width: '100%',
                    padding: '12px',
                    border: `1px solid rgba(${themeColorRgb}, 0.3)`,
                    borderRadius: '8px',
                    fontSize: '16px',
                    backgroundColor: 'var(--bg-secondary, #f5f5f5)',
                    outline: 'none',
                    transition: 'border 0.2s'
                  }}
                  onFocus={(e) => {
                    e.currentTarget.style.border = `1px solid rgba(${themeColorRgb}, 0.7)`
                  }}
                  onBlur={(e) => {
                    e.currentTarget.style.border = `1px solid rgba(${themeColorRgb}, 0.3)`
                  }}
                />
              </div>
            )}
            
            {rewardType === 'fixed' && (
              <div style={{ marginBottom: '30px' }}>
                <h3 style={{ 
                  marginBottom: '15px',
                  color: 'var(--text-primary, #000)',
                  fontSize: '22px',
                  fontWeight: 600
                }}>
                  Fixed Discount Configuration
                </h3>
                
                <label style={{ 
                  display: 'block', 
                  marginBottom: '8px', 
                  fontWeight: 500,
                  fontSize: '14px',
                  color: 'var(--text-primary, #000)'
                }}>
                  Discount Amount ($)
                </label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  value={fixedDiscount}
                  onChange={(e) => setFixedDiscount(e.target.value)}
                  placeholder="5.00"
                  style={{
                    width: '100%',
                    padding: '12px',
                    border: `1px solid rgba(${themeColorRgb}, 0.3)`,
                    borderRadius: '8px',
                    fontSize: '16px',
                    backgroundColor: 'var(--bg-secondary, #f5f5f5)',
                    outline: 'none',
                    transition: 'border 0.2s'
                  }}
                  onFocus={(e) => {
                    e.currentTarget.style.border = `1px solid rgba(${themeColorRgb}, 0.7)`
                  }}
                  onBlur={(e) => {
                    e.currentTarget.style.border = `1px solid rgba(${themeColorRgb}, 0.3)`
                  }}
                />
              </div>
            )}
            
            {/* Minimum Spend */}
            <div style={{ marginBottom: '30px' }}>
              <h3 style={{ 
                marginBottom: '15px',
                color: 'var(--text-primary, #000)',
                fontSize: '22px',
                fontWeight: 600
              }}>
                Minimum Spend
              </h3>
              
              <label style={{ 
                display: 'block', 
                marginBottom: '8px', 
                fontWeight: 500,
                fontSize: '14px',
                color: 'var(--text-primary, #000)'
              }}>
                Minimum Purchase Amount ($)
              </label>
              <input
                type="number"
                step="0.01"
                min="0"
                value={minimumSpend}
                onChange={(e) => setMinimumSpend(e.target.value)}
                placeholder="0.00"
                style={{
                  width: '100%',
                  padding: '12px',
                  border: `1px solid rgba(${themeColorRgb}, 0.3)`,
                  borderRadius: '8px',
                  fontSize: '16px',
                  backgroundColor: 'var(--bg-secondary, #f5f5f5)',
                  outline: 'none',
                  transition: 'border 0.2s'
                }}
                onFocus={(e) => {
                  e.currentTarget.style.border = `1px solid rgba(${themeColorRgb}, 0.7)`
                }}
                onBlur={(e) => {
                  e.currentTarget.style.border = `1px solid rgba(${themeColorRgb}, 0.3)`
                }}
              />
              <p style={{ margin: '8px 0 0 0', color: 'var(--text-secondary, #666)', fontSize: '13px' }}>
                Minimum amount customers must spend to earn or use rewards.
              </p>
            </div>
          </>
        )}
        
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
            disabled={loading}
            style={{
              padding: '12px 24px',
              backgroundColor: loading ? `rgba(${themeColorRgb}, 0.4)` : `rgba(${themeColorRgb}, 0.7)`,
              backdropFilter: 'blur(10px)',
              WebkitBackdropFilter: 'blur(10px)',
              color: '#fff',
              border: loading ? '1px solid rgba(255, 255, 255, 0.15)' : '1px solid rgba(255, 255, 255, 0.3)',
              borderRadius: '8px',
              cursor: loading ? 'not-allowed' : 'pointer',
              fontSize: '16px',
              fontWeight: 600,
              boxShadow: loading
                ? `0 2px 8px rgba(${themeColorRgb}, 0.2), inset 0 1px 0 rgba(255, 255, 255, 0.15)` 
                : `0 4px 15px rgba(${themeColorRgb}, 0.3), inset 0 1px 0 rgba(255, 255, 255, 0.2)`,
              transition: 'all 0.3s ease',
              opacity: 1
            }}
            onMouseEnter={(e) => {
              if (!loading) {
                e.currentTarget.style.backgroundColor = `rgba(${themeColorRgb}, 0.8)`
                e.currentTarget.style.boxShadow = `0 6px 20px rgba(${themeColorRgb}, 0.4), inset 0 1px 0 rgba(255, 255, 255, 0.2)`
              }
            }}
            onMouseLeave={(e) => {
              if (!loading) {
                e.currentTarget.style.backgroundColor = `rgba(${themeColorRgb}, 0.7)`
                e.currentTarget.style.boxShadow = `0 4px 15px rgba(${themeColorRgb}, 0.3), inset 0 1px 0 rgba(255, 255, 255, 0.2)`
              }
            }}
          >
            {loading ? 'Saving...' : 'Continue'}
          </button>
        </div>
      </div>
    </div>
  )
}

export default OnboardingStepRewards
