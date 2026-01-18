// Shared button styles for onboarding forms matching POS payment button style

export const getButtonStyles = (themeColorRgb, isPrimary = true, isDisabled = false) => {
  if (isPrimary) {
    return {
      padding: '16px 32px',
      backgroundColor: isDisabled ? `rgba(${themeColorRgb}, 0.4)` : `rgba(${themeColorRgb}, 0.7)`,
      backdropFilter: 'blur(10px)',
      WebkitBackdropFilter: 'blur(10px)',
      color: '#fff',
      border: isDisabled ? '1px solid rgba(255, 255, 255, 0.15)' : '1px solid rgba(255, 255, 255, 0.3)',
      borderRadius: '8px',
      cursor: isDisabled ? 'not-allowed' : 'pointer',
      fontSize: '16px',
      fontWeight: 600,
      boxShadow: isDisabled 
        ? `0 2px 8px rgba(${themeColorRgb}, 0.2), inset 0 1px 0 rgba(255, 255, 255, 0.15)` 
        : `0 4px 15px rgba(${themeColorRgb}, 0.3), inset 0 1px 0 rgba(255, 255, 255, 0.2)`,
      transition: 'all 0.3s ease',
      opacity: 1
    }
  } else {
    // Back button style
    return {
      padding: '16px 32px',
      backgroundColor: 'transparent',
      color: 'var(--text-primary, #000)',
      border: '2px solid rgba(0, 0, 0, 0.2)',
      borderRadius: '8px',
      cursor: 'pointer',
      fontSize: '16px',
      fontWeight: 600,
      transition: 'all 0.3s ease'
    }
  }
}

export const getButtonHoverHandlers = (themeColorRgb, isPrimary = true) => {
  if (isPrimary) {
    return {
      onMouseEnter: (e) => {
        if (!e.currentTarget.disabled) {
          e.currentTarget.style.backgroundColor = `rgba(${themeColorRgb}, 0.8)`
          e.currentTarget.style.boxShadow = `0 6px 20px rgba(${themeColorRgb}, 0.4), inset 0 1px 0 rgba(255, 255, 255, 0.2)`
        }
      },
      onMouseLeave: (e) => {
        if (!e.currentTarget.disabled) {
          e.currentTarget.style.backgroundColor = `rgba(${themeColorRgb}, 0.7)`
          e.currentTarget.style.boxShadow = `0 4px 15px rgba(${themeColorRgb}, 0.3), inset 0 1px 0 rgba(255, 255, 255, 0.2)`
        }
      }
    }
  } else {
    return {
      onMouseEnter: (e) => {
        e.currentTarget.style.backgroundColor = 'rgba(0, 0, 0, 0.05)'
        e.currentTarget.style.borderColor = 'rgba(0, 0, 0, 0.3)'
      },
      onMouseLeave: (e) => {
        e.currentTarget.style.backgroundColor = 'transparent'
        e.currentTarget.style.borderColor = 'rgba(0, 0, 0, 0.2)'
      }
    }
  }
}

export const getInputLineStyle = (themeColorRgb, hasError = false) => {
  return {
    width: '100%',
    padding: '8px 0',
    border: 'none',
    borderBottom: hasError ? '2px solid #e74c3c' : `2px solid rgba(${themeColorRgb}, 0.3)`,
    borderRadius: '0',
    fontSize: '16px',
    boxSizing: 'border-box',
    backgroundColor: 'transparent',
    outline: 'none',
    transition: 'border-color 0.2s'
  }
}

export const getInputFocusHandlers = (themeColorRgb, hasError = false) => {
  return {
    onFocus: (e) => {
      e.target.style.borderBottomColor = hasError ? '#e74c3c' : `rgba(${themeColorRgb}, 1)`
    },
    onBlur: (e) => {
      e.target.style.borderBottomColor = hasError ? '#e74c3c' : `rgba(${themeColorRgb}, 0.3)`
    }
  }
}
