import React, { useState, useRef, useEffect, useLayoutEffect } from 'react'
import { ChevronDown } from 'lucide-react'

/**
 * Custom dropdown matching Store Information store type style.
 * API compatible with native select: onChange receives { target: { value, name? } }.
 */
function CustomDropdown({
  value,
  onChange,
  options,
  placeholder = 'Select…',
  label,
  name,
  required = false,
  error,
  isDarkMode,
  themeColorRgb = '132, 0, 255',
  style = {},
  disabled = false,
  triggerVariant = 'input',
  triggerFullWidth = false,
  compactTrigger = false
}) {
  const [isOpen, setIsOpen] = useState(false)
  const [dropdownPosition, setDropdownPosition] = useState({ top: 0, left: 0, width: 120 })
  const triggerRef = useRef(null)
  const menuRef = useRef(null)

  const _isDark = isDarkMode ?? document.documentElement.classList.contains('dark-theme')

  const updateDropdownPosition = () => {
    if (!triggerRef.current) return
    const rect = triggerRef.current.getBoundingClientRect()
    setDropdownPosition({
      top: rect.bottom + 4,
      left: rect.left,
      width: Math.max(rect.width, 120)
    })
  }

  useLayoutEffect(() => {
    if (!isOpen) return
    updateDropdownPosition()
    const onScrollOrResize = () => updateDropdownPosition()
    window.addEventListener('scroll', onScrollOrResize, true)
    window.addEventListener('resize', onScrollOrResize)
    return () => {
      window.removeEventListener('scroll', onScrollOrResize, true)
      window.removeEventListener('resize', onScrollOrResize)
    }
  }, [isOpen])

  const closeDropdown = () => {
    setIsOpen(false)
    // Blur on next tick so focus moves away before any re-render
    requestAnimationFrame(() => {
      triggerRef.current?.blur()
    })
  }

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (!triggerRef.current || !menuRef.current) return
      const insideTrigger = triggerRef.current.contains(event.target)
      const insideMenu = menuRef.current.contains(event.target)
      if (!insideTrigger && !insideMenu) closeDropdown()
    }
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside)
      return () => document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [isOpen])

  const selectedOption = options.find((opt) => String(opt.value) === String(value))

  const handleSelect = (option) => {
    if (disabled) return
    onChange(name != null ? { target: { name, value: option.value } } : { target: { value: option.value } })
    closeDropdown()
  }

  const handleTriggerClick = (e) => {
    e.preventDefault()
    if (disabled) return
    setIsOpen((prev) => !prev)
  }

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault()
      if (!disabled) setIsOpen((prev) => !prev)
    }
    if (e.key === 'Escape') closeDropdown()
  }

  // Trigger styles - only apply focus ring when OPEN, never when closed
  const borderColor = isOpen ? `rgba(${themeColorRgb}, 0.5)` : (error ? '#ef4444' : (_isDark ? 'var(--border-color, #404040)' : '#ddd'))
  const boxShadow = isOpen ? `0 0 0 3px rgba(${themeColorRgb}, 0.1)` : 'none'

  const isButtonTrigger = triggerVariant === 'button'
  const triggerStyle = {
    width: isButtonTrigger ? undefined : '100%',
    padding: compactTrigger ? '5px 14px' : (isButtonTrigger ? '4px 16px' : '6px 10px'),
    minHeight: compactTrigger ? 32 : (isButtonTrigger ? 28 : 34),
    border: `1px solid ${borderColor}`,
    borderRadius: isButtonTrigger ? 8 : 6,
    fontSize: 14,
    fontFamily: 'inherit',
    backgroundColor: disabled ? (_isDark ? '#2a2a2a' : '#f3f4f6') : (_isDark ? 'var(--bg-secondary, #2d2d2d)' : '#fff'),
    color: _isDark ? 'var(--text-primary, #fff)' : '#333',
    boxShadow,
    outline: 'none',
    cursor: disabled ? 'not-allowed' : 'pointer',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    boxSizing: 'border-box',
    opacity: disabled ? 0.6 : 1,
    transition: 'border-color 0.2s ease, box-shadow 0.2s ease',
    ...(isButtonTrigger && {
      minWidth: triggerFullWidth ? 0 : undefined,
      flex: triggerFullWidth ? 1 : undefined
    })
  }

  return (
    <div style={{ marginBottom: label || error ? 16 : 0, ...style }}>
      {label && (
        <label
          style={{
            display: 'block',
            fontSize: 14,
            fontWeight: 500,
            color: _isDark ? '#fff' : '#374151',
            marginBottom: 4
          }}
        >
          {label}
          {required && <span style={{ color: '#ef4444', marginLeft: 4 }}>*</span>}
        </label>
      )}
      <div style={{ position: 'relative', width: triggerFullWidth ? '100%' : undefined }}>
        <button
          ref={triggerRef}
          type="button"
          onClick={handleTriggerClick}
          onKeyDown={handleKeyDown}
          disabled={disabled}
          tabIndex={disabled ? -1 : 0}
          style={triggerStyle}
          onMouseEnter={(e) => {
            if (disabled) return
            if (!isOpen) {
              e.currentTarget.style.borderColor = `rgba(${themeColorRgb}, 0.3)`
            }
          }}
          onMouseLeave={(e) => {
            if (!isOpen) {
              e.currentTarget.style.borderColor = error ? '#ef4444' : (_isDark ? 'var(--border-color, #404040)' : '#ddd')
            }
          }}
        >
          <span style={{ color: selectedOption ? (_isDark ? 'var(--text-primary, #fff)' : '#333') : (_isDark ? 'var(--text-tertiary, #999)' : '#999') }}>
            {selectedOption ? selectedOption.label : placeholder}
          </span>
          <ChevronDown
            size={16}
            style={{
              transition: 'transform 0.2s ease',
              transform: isOpen ? 'rotate(180deg)' : 'rotate(0deg)',
              color: _isDark ? 'var(--text-tertiary, #999)' : '#666',
              flexShrink: 0
            }}
          />
        </button>
      </div>
      {isOpen && (
        <div
          ref={menuRef}
          style={{
            position: 'fixed',
            top: `${dropdownPosition.top}px`,
            left: `${dropdownPosition.left}px`,
            width: `${dropdownPosition.width}px`,
            backgroundColor: _isDark ? 'var(--bg-secondary, #2d2d2d)' : '#fff',
            border: _isDark ? '1px solid var(--border-color, #404040)' : '1px solid #ddd',
            borderRadius: 6,
            boxShadow: _isDark ? '0 4px 12px rgba(0,0,0,0.3)' : '0 4px 12px rgba(0,0,0,0.1)',
            zIndex: 10000,
            maxHeight: 200,
            overflowY: 'auto',
            overflowX: 'hidden'
          }}
        >
          {options.map((option) => (
            <div
              key={String(option.value)}
              role="option"
              aria-selected={String(value) === String(option.value)}
              onClick={() => handleSelect(option)}
              onMouseDown={(e) => e.preventDefault()}
              style={{
                padding: '10px 14px',
                cursor: 'pointer',
                fontSize: 14,
                color: _isDark ? 'var(--text-primary, #fff)' : '#333',
                backgroundColor: String(value) === String(option.value) ? `rgba(${themeColorRgb}, 0.2)` : 'transparent',
                transition: 'background-color 0.15s ease',
                borderLeft: `3px solid ${String(value) === String(option.value) ? `rgba(${themeColorRgb}, 0.7)` : 'transparent'}`
              }}
              onMouseEnter={(e) => {
                if (String(value) !== String(option.value)) {
                  e.currentTarget.style.backgroundColor = _isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)'
                }
              }}
              onMouseLeave={(e) => {
                if (String(value) !== String(option.value)) e.currentTarget.style.backgroundColor = 'transparent'
              }}
            >
              {option.label}
            </div>
          ))}
        </div>
      )}
      {error && (
        <p style={{ marginTop: 4, fontSize: 12, color: '#ef4444' }}>{error}</p>
      )}
    </div>
  )
}

export default CustomDropdown
