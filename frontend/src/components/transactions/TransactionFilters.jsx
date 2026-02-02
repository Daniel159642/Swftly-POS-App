import React from 'react'
import { useTheme } from '../../contexts/ThemeContext'
import CustomDropdown from '../common/CustomDropdown'
import Button from '../common/Button'

function TransactionFilters({ filters, onFilterChange, onClearFilters }) {
  const { themeColor } = useTheme()
  const isDarkMode = document.documentElement.classList.contains('dark-theme')
  const hexToRgb = (hex) => {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex)
    return result ? `${parseInt(result[1], 16)}, ${parseInt(result[2], 16)}, ${parseInt(result[3], 16)}` : '132, 0, 255'
  }
  const themeColorRgb = hexToRgb(themeColor)

  const handleChange = (e) => {
    const { name, value } = e.target
    onFilterChange({
      ...filters,
      [name]: value === '' ? undefined : 
              name === 'is_posted' || name === 'is_void' ? value === 'true' :
              name === 'account_id' ? parseInt(value) : value,
    })
  }

  const transactionTypeOptions = [
    { value: '', label: 'All Types' },
    { value: 'journal_entry', label: 'Journal Entry' },
    { value: 'invoice', label: 'Invoice' },
    { value: 'bill', label: 'Bill' },
    { value: 'payment', label: 'Payment' },
    { value: 'adjustment', label: 'Adjustment' },
  ]

  const statusOptions = [
    { value: '', label: 'All Status' },
    { value: 'true', label: 'Posted Only' },
    { value: 'false', label: 'Draft Only' },
  ]

  const voidOptions = [
    { value: '', label: 'Include All' },
    { value: 'false', label: 'Active Only' },
    { value: 'true', label: 'Voided Only' },
  ]

  const gridStyle = {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
    gap: '16px',
    alignItems: 'end'
  }

  const dateContainerStyle = {
    padding: '4px 16px',
    minHeight: '28px',
    height: '28px',
    borderRadius: '8px',
    fontSize: '14px',
    fontWeight: 500,
    backgroundColor: isDarkMode ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.05)',
    border: isDarkMode ? '1px solid var(--border-light, #333)' : '1px solid #ddd',
    color: isDarkMode ? 'var(--text-primary, #fff)' : '#333',
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
    boxSizing: 'border-box',
    width: '100%',
    transition: 'border-color 0.2s ease'
  }

  const dateInputStyle = {
    border: 'none',
    background: 'transparent',
    color: 'inherit',
    fontSize: '14px',
    fontWeight: 500,
    outline: 'none',
    cursor: 'pointer',
    flex: 1,
    minWidth: 0
  }

  return (
    <div style={{ marginBottom: '24px' }}>
      <div style={gridStyle}>
        <div style={{ ...dateContainerStyle, marginBottom: 0 }}>
          <span style={{ whiteSpace: 'nowrap', color: isDarkMode ? '#9ca3af' : '#6b7280', fontSize: '13px' }}>Start date</span>
          <input
            type="date"
            name="start_date"
            value={filters.start_date || ''}
            onChange={handleChange}
            style={dateInputStyle}
            onFocus={(e) => {
              const container = e.target.closest('div')
              if (container) container.style.borderColor = `rgba(${themeColorRgb}, 0.5)`
            }}
            onBlur={(e) => {
              const container = e.target.closest('div')
              if (container) container.style.borderColor = isDarkMode ? '#333' : '#ddd'
            }}
          />
        </div>

        <div style={{ ...dateContainerStyle, marginBottom: 0 }}>
          <span style={{ whiteSpace: 'nowrap', color: isDarkMode ? '#9ca3af' : '#6b7280', fontSize: '13px' }}>End date</span>
          <input
            type="date"
            name="end_date"
            value={filters.end_date || ''}
            onChange={handleChange}
            style={dateInputStyle}
            onFocus={(e) => {
              const container = e.target.closest('div')
              if (container) container.style.borderColor = `rgba(${themeColorRgb}, 0.5)`
            }}
            onBlur={(e) => {
              const container = e.target.closest('div')
              if (container) container.style.borderColor = isDarkMode ? '#333' : '#ddd'
            }}
          />
        </div>

        <CustomDropdown
          name="transaction_type"
          value={filters.transaction_type || ''}
          onChange={handleChange}
          options={transactionTypeOptions}
          placeholder="All Types"
          isDarkMode={isDarkMode}
          themeColorRgb={themeColorRgb}
          triggerVariant="button"
          style={{ marginBottom: 0 }}
        />

        <CustomDropdown
          name="is_posted"
          value={filters.is_posted === undefined ? '' : String(filters.is_posted)}
          onChange={handleChange}
          options={statusOptions}
          placeholder="All Status"
          isDarkMode={isDarkMode}
          themeColorRgb={themeColorRgb}
          triggerVariant="button"
          style={{ marginBottom: 0 }}
        />

        <CustomDropdown
          name="is_void"
          value={filters.is_void === undefined ? '' : String(filters.is_void)}
          onChange={handleChange}
          options={voidOptions}
          placeholder="Include All"
          isDarkMode={isDarkMode}
          themeColorRgb={themeColorRgb}
          triggerVariant="button"
          style={{ marginBottom: 0 }}
        />

        <div style={{ marginBottom: 0 }}>
          <label style={{ display: 'block', fontSize: '14px', fontWeight: 500, marginBottom: '4px', visibility: 'hidden', lineHeight: 1.2 }} aria-hidden>Clear</label>
          <Button type="button" variant="primary" onClick={onClearFilters} style={{ width: '100%' }}>
            Clear Filters
          </Button>
        </div>
      </div>
    </div>
  )
}

export default TransactionFilters
