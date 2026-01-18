import { useState } from 'react'
import { useTheme } from '../contexts/ThemeContext'
import OnboardingHeader from './OnboardingHeader'

function OnboardingStep6({ onNext, onBack, preferences, setPreferences, direction = 'forward' }) {
  const { themeColor, setThemeColor } = useTheme()
  const [formData, setFormData] = useState({
    theme_color: preferences?.theme_color || themeColor || '#8400ff',
    enable_rewards: preferences?.enable_rewards || false,
    enable_tips: preferences?.enable_tips || false,
    enable_customer_display: preferences?.enable_customer_display || false,
    receipt_footer_message: preferences?.receipt_footer_message || 'Thank you for your business!'
  })
  
  const hexToRgb = (hex) => {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex)
    return result ? `${parseInt(result[1], 16)}, ${parseInt(result[2], 16)}, ${parseInt(result[3], 16)}` : '132, 0, 255'
  }
  
  const themeColorRgb = hexToRgb(formData.theme_color)
  
  const handleNext = () => {
    setPreferences(formData)
    if (setThemeColor) {
      setThemeColor(formData.theme_color)
    }
    onNext()
  }
  
  return (
    <div style={{ 
      maxWidth: '800px', 
      margin: '0 auto', 
      padding: '40px 20px',
      backgroundColor: 'transparent',
      backdropFilter: 'blur(60px) saturate(200%)',
      WebkitBackdropFilter: 'blur(60px) saturate(200%)',
      border: '1px solid rgba(255, 255, 255, 0.08)',
      borderRadius: '16px',
      boxShadow: `0 8px 32px 0 rgba(31, 38, 135, 0.1), inset 0 1px 0 rgba(255, 255, 255, 0.1)`
    }}>
      <OnboardingHeader step={6} direction={direction} />
      <h2 style={{ 
        marginBottom: '10px',
        color: 'var(--text-primary, #000)',
        fontSize: '28px',
        fontWeight: 600
      }}>
        Customize Your Experience
      </h2>
      
      <p style={{ 
        marginBottom: '30px',
        color: 'var(--text-secondary, #666)',
        fontSize: '16px',
        lineHeight: '1.6'
      }}>
        Personalize your POS system. You can change these settings anytime.
      </p>
      
      <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
        {/* Theme Color */}
        <div>
          <label style={{ 
            display: 'block', 
            marginBottom: '8px', 
            fontWeight: 500,
            fontSize: '14px',
            color: 'var(--text-primary, #000)'
          }}>
            Theme Color
          </label>
          <div style={{ display: 'flex', gap: '15px', alignItems: 'center' }}>
          <input
            type="color"
            value={formData.theme_color}
            onChange={(e) => setFormData(prev => ({ ...prev, theme_color: e.target.value }))}
            style={{
              width: '60px',
              height: '40px',
              border: '1px solid #ddd',
              borderRadius: '6px',
              cursor: 'pointer'
            }}
          />
          <input
            type="text"
            value={formData.theme_color}
            onChange={(e) => setFormData(prev => ({ ...prev, theme_color: e.target.value }))}
            placeholder="#8400ff"
            style={{
              flex: 1,
              padding: '8px 0',
              border: 'none',
              borderBottom: `2px solid rgba(${themeColorRgb}, 0.3)`,
              borderRadius: '0',
              fontSize: '14px',
              boxSizing: 'border-box',
              backgroundColor: 'transparent',
              outline: 'none',
              transition: 'border-color 0.2s'
            }}
            onFocus={(e) => {
              e.target.style.borderBottomColor = `rgba(${themeColorRgb}, 1)`
            }}
            onBlur={(e) => {
              e.target.style.borderBottomColor = `rgba(${themeColorRgb}, 0.3)`
            }}
          />
          </div>
        </div>
        
        {/* Receipt Footer */}
        <div>
          <label style={{ 
            display: 'block', 
            marginBottom: '8px', 
            fontWeight: 500,
            fontSize: '14px',
            color: 'var(--text-primary, #000)'
          }}>
            Receipt Footer Message
          </label>
          <input
            type="text"
            value={formData.receipt_footer_message}
            onChange={(e) => setFormData(prev => ({ ...prev, receipt_footer_message: e.target.value }))}
            placeholder="Thank you for your business!"
            style={{
              width: '100%',
              padding: '8px 0',
              border: 'none',
              borderBottom: `2px solid rgba(${themeColorRgb}, 0.3)`,
              borderRadius: '0',
              fontSize: '16px',
              boxSizing: 'border-box',
              backgroundColor: 'transparent',
              outline: 'none',
              transition: 'border-color 0.2s'
            }}
            onFocus={(e) => {
              e.target.style.borderBottomColor = `rgba(${themeColorRgb}, 1)`
            }}
            onBlur={(e) => {
              e.target.style.borderBottomColor = `rgba(${themeColorRgb}, 0.3)`
            }}
          />
        </div>
        
        {/* Feature Toggles */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
          <div style={{
            padding: '15px',
            border: '1px solid #ddd',
            borderRadius: '6px',
            backgroundColor: 'var(--bg-secondary, #f5f5f5)'
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
                checked={formData.enable_rewards}
                onChange={(e) => setFormData(prev => ({ ...prev, enable_rewards: e.target.checked }))}
                style={{ width: '18px', height: '18px', cursor: 'pointer' }}
              />
              Enable Customer Rewards Program
            </label>
            <p style={{ margin: '8px 0 0 0', color: 'var(--text-secondary, #666)', fontSize: '13px' }}>
              Allow customers to earn points or discounts on purchases
            </p>
          </div>
          
          <div style={{
            padding: '15px',
            border: '1px solid #ddd',
            borderRadius: '6px',
            backgroundColor: 'var(--bg-secondary, #f5f5f5)'
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
                checked={formData.enable_tips}
                onChange={(e) => setFormData(prev => ({ ...prev, enable_tips: e.target.checked }))}
                style={{ width: '18px', height: '18px', cursor: 'pointer' }}
              />
              Enable Tip Feature
            </label>
            <p style={{ margin: '8px 0 0 0', color: 'var(--text-secondary, #666)', fontSize: '13px' }}>
              Allow customers to add tips during checkout
            </p>
          </div>
          
          <div style={{
            padding: '15px',
            border: '1px solid #ddd',
            borderRadius: '6px',
            backgroundColor: 'var(--bg-secondary, #f5f5f5)'
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
                checked={formData.enable_customer_display}
                onChange={(e) => setFormData(prev => ({ ...prev, enable_customer_display: e.target.checked }))}
                style={{ width: '18px', height: '18px', cursor: 'pointer' }}
              />
              Enable Customer Display
            </label>
            <p style={{ margin: '8px 0 0 0', color: 'var(--text-secondary, #666)', fontSize: '13px' }}>
              Show order details on a separate display for customers
            </p>
          </div>
        </div>
      </div>
      
      {/* Navigation */}
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        marginTop: '40px'
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
          style={{
            padding: '12px 24px',
            backgroundColor: `rgba(${themeColorRgb}, 0.7)`,
            backdropFilter: 'blur(10px)',
            WebkitBackdropFilter: 'blur(10px)',
            color: '#fff',
            border: '1px solid rgba(255, 255, 255, 0.3)',
            borderRadius: '8px',
            cursor: 'pointer',
            fontSize: '16px',
            fontWeight: 600,
            boxShadow: `0 4px 15px rgba(${themeColorRgb}, 0.3), inset 0 1px 0 rgba(255, 255, 255, 0.2)`,
            transition: 'all 0.3s ease'
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.backgroundColor = `rgba(${themeColorRgb}, 0.8)`
            e.currentTarget.style.boxShadow = `0 6px 20px rgba(${themeColorRgb}, 0.4), inset 0 1px 0 rgba(255, 255, 255, 0.2)`
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.backgroundColor = `rgba(${themeColorRgb}, 0.7)`
            e.currentTarget.style.boxShadow = `0 4px 15px rgba(${themeColorRgb}, 0.3), inset 0 1px 0 rgba(255, 255, 255, 0.2)`
          }}
        >
          Continue
        </button>
      </div>
    </div>
  )
}

export default OnboardingStep6
