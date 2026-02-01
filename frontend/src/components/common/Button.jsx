import React from 'react'
import { useTheme } from '../../contexts/ThemeContext'

function hexToRgb(hex) {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex)
  return result ? `${parseInt(result[1], 16)}, ${parseInt(result[2], 16)}, ${parseInt(result[3], 16)}` : '107, 163, 240'
}

function Button({
  children,
  onClick,
  type = 'button',
  variant = 'primary',
  size = 'md',
  disabled = false,
  className = '',
  style = {},
  themeColorRgb: themeColorRgbProp,
  isDarkMode: isDarkModeProp
}) {
  const { themeColor } = useTheme()
  const themeColorRgb = typeof themeColorRgbProp === 'string' && themeColorRgbProp.length > 0 ? themeColorRgbProp : hexToRgb(themeColor || '#6ba3f0')
  const isDarkMode = isDarkModeProp ?? document.documentElement.classList.contains('dark-theme')
  const useInventoryStyle = true

  const baseStyle = {
    fontWeight: 500,
    borderRadius: useInventoryStyle ? '8px' : '6px',
    border: 'none',
    cursor: disabled ? 'not-allowed' : 'pointer',
    transition: 'all 0.2s ease',
    opacity: disabled ? 0.5 : 1,
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    ...style
  }

  const variantStyles = useInventoryStyle
    ? {
        primary: {
          backgroundColor: `rgba(${themeColorRgb}, 0.7)`,
          color: '#fff',
          border: `1px solid rgba(${themeColorRgb}, 0.5)`,
          boxShadow: `0 4px 15px rgba(${themeColorRgb}, 0.3)`
        },
        secondary: {
          backgroundColor: isDarkMode ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.05)',
          color: isDarkMode ? 'var(--text-primary, #fff)' : '#333',
          border: isDarkMode ? '1px solid var(--border-color, #404040)' : '1px solid #ddd'
        },
        danger: {
          backgroundColor: '#ef4444',
          color: 'white',
          border: '1px solid rgba(239, 68, 68, 0.5)'
        },
        success: {
          backgroundColor: '#10b981',
          color: 'white',
          border: '1px solid rgba(16, 185, 129, 0.5)'
        }
      }
    : {
        primary: { backgroundColor: '#3b82f6', color: 'white' },
        secondary: { backgroundColor: '#6b7280', color: 'white' },
        danger: { backgroundColor: '#ef4444', color: 'white' },
        success: { backgroundColor: '#10b981', color: 'white' }
      }

  const sizeStyles = useInventoryStyle
    ? {
        sm: { padding: '4px 12px', height: '26px', fontSize: '12px' },
        md: { padding: '4px 16px', height: '28px', fontSize: '14px' },
        lg: { padding: '8px 20px', height: '36px', fontSize: '14px' }
      }
    : {
        sm: { padding: '6px 12px', fontSize: '14px' },
        md: { padding: '8px 16px', fontSize: '16px' },
        lg: { padding: '12px 24px', fontSize: '18px' }
      }

  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      className={className}
      style={{
        ...baseStyle,
        ...variantStyles[variant] || variantStyles.primary,
        ...sizeStyles[size] || sizeStyles.md
      }}
      onMouseEnter={(e) => {
        if (!disabled && useInventoryStyle && variant === 'primary') {
          e.target.style.boxShadow = `0 4px 20px rgba(${themeColorRgb}, 0.4)`
        } else if (!disabled && !useInventoryStyle) {
          e.target.style.opacity = '0.9'
          e.target.style.transform = 'translateY(-1px)'
        }
      }}
      onMouseLeave={(e) => {
        if (!disabled && useInventoryStyle && variant === 'primary') {
          e.target.style.boxShadow = `0 4px 15px rgba(${themeColorRgb}, 0.3)`
        } else if (!disabled && !useInventoryStyle) {
          e.target.style.opacity = '1'
          e.target.style.transform = 'translateY(0)'
        }
      }}
    >
      {children}
    </button>
  )
}

export default Button
