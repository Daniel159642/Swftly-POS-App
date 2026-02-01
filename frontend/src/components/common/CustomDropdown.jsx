import React, { useState, useRef, useEffect } from 'react'
import { ChevronDown } from 'lucide-react'

/**
 * Custom dropdown matching Inventory parent-category style.
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
  disabled = false
}) {
  const [isOpen, setIsOpen] = useState(false)
  const triggerRef = useRef(null)
  const menuRef = useRef(null)

  const _isDark = isDarkMode ?? document.documentElement.classList.contains('dark-theme')

  useEffect(() => {
    const handleClickOutside = (event) => {
      const isClickInsideTrigger = triggerRef.current?.contains(event.target)
      const isClickInsideMenu = menuRef.current?.contains(event.target)
      if (!isClickInsideTrigger && !isClickInsideMenu) setIsOpen(false)
    }
    if (isOpen) document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [isOpen])

  const selectedOption = options.find((opt) => String(opt.value) === String(value))

  const getDropdownPosition = () => {
    if (!triggerRef.current) return { top: 0, left: 0, width: 0 }
    const rect = triggerRef.current.getBoundingClientRect()
    return {
      top: rect.bottom + window.scrollY + 4,
      left: rect.left + window.scrollX,
      width: rect.width
    }
  }

  const dropdownPosition = isOpen ? getDropdownPosition() : { top: 0, left: 0, width: 0 }

  const handleSelect = (option) => {
    if (disabled) return
    onChange(name != null ? { target: { name, value: option.value } } : { target: { value: option.value } })
    setIsOpen(false)
  }

  return (
    <div style={{ marginBottom: label || error ? '16px' : 0, ...style }}>
      {label && (
        <label
          style={{
            display: 'block',
            fontSize: '14px',
            fontWeight: 500,
            color: _isDark ? '#ffffff' : '#374151',
            marginBottom: '4px'
          }}
        >
          {label}
          {required && <span style={{ color: '#ef4444', marginLeft: '4px' }}>*</span>}
        </label>
      )}
      <div style={{ position: 'relative' }}>
        <div
          ref={triggerRef}
          onClick={() => !disabled && setIsOpen(!isOpen)}
          role="button"
          tabIndex={disabled ? -1 : 0}
          onKeyDown={(e) => {
            if (e.key === 'Enter' || e.key === ' ') {
              e.preventDefault()
              if (!disabled) setIsOpen((prev) => !prev)
            }
          }}
          style={{
            width: '100%',
            padding: '6px 10px',
            minHeight: '34px',
            border: error ? '1px solid #ef4444' : _isDark ? '1px solid var(--border-color, #404040)' : '1px solid #ddd',
            borderRadius: '6px',
            fontSize: '14px',
            backgroundColor: disabled ? (_isDark ? '#2a2a2a' : '#f3f4f6') : _isDark ? 'var(--bg-secondary, #2d2d2d)' : '#fff',
            color: _isDark ? 'var(--text-primary, #fff)' : '#333',
            transition: 'all 0.2s ease',
            outline: 'none',
            cursor: disabled ? 'not-allowed' : 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            boxSizing: 'border-box',
            opacity: disabled ? 0.6 : 1,
            ...(isOpen && {
              borderColor: `rgba(${themeColorRgb}, 0.5)`,
              boxShadow: `0 0 0 3px rgba(${themeColorRgb}, 0.1)`
            })
          }}
          onMouseEnter={(e) => {
            if (!disabled && !isOpen) e.currentTarget.style.borderColor = `rgba(${themeColorRgb}, 0.3)`
          }}
          onMouseLeave={(e) => {
            if (!isOpen) e.currentTarget.style.borderColor = error ? '#ef4444' : _isDark ? 'var(--border-color, #404040)' : '#ddd'
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
        </div>
      </div>
      {isOpen && (
        <div
          ref={menuRef}
          style={{
            position: 'fixed',
            top: `${dropdownPosition.top}px`,
            left: `${dropdownPosition.left}px`,
            width: `${Math.max(dropdownPosition.width, 120)}px`,
            backgroundColor: _isDark ? 'var(--bg-secondary, #2d2d2d)' : '#fff',
            border: _isDark ? '1px solid var(--border-color, #404040)' : '1px solid #ddd',
            borderRadius: '6px',
            boxShadow: _isDark ? '0 4px 12px rgba(0, 0, 0, 0.3)' : '0 4px 12px rgba(0, 0, 0, 0.1)',
            zIndex: 10000,
            maxHeight: '200px',
            overflowY: 'auto',
            overflowX: 'hidden'
          }}
        >
          {options.map((option) => (
            <div
              key={String(option.value)}
              onClick={() => handleSelect(option)}
              style={{
                padding: '10px 14px',
                cursor: 'pointer',
                fontSize: '14px',
                color: _isDark ? 'var(--text-primary, #fff)' : '#333',
                backgroundColor: String(value) === String(option.value) ? `rgba(${themeColorRgb}, 0.2)` : 'transparent',
                transition: 'background-color 0.15s ease',
                borderLeft: String(value) === String(option.value) ? `3px solid rgba(${themeColorRgb}, 0.7)` : '3px solid transparent'
              }}
              onMouseEnter={(e) => {
                if (String(value) !== String(option.value)) {
                  e.currentTarget.style.backgroundColor = _isDark ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.05)'
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
        <p style={{ marginTop: '4px', fontSize: '12px', color: '#ef4444' }}>{error}</p>
      )}
    </div>
  )
}

export default CustomDropdown
