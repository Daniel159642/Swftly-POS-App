import React from 'react'
import { useTheme } from '../../contexts/ThemeContext'
import CustomDropdown from '../common/CustomDropdown'
import Button from '../common/Button'

function hexToRgb(hex) {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex)
  return result ? `${parseInt(result[1], 16)}, ${parseInt(result[2], 16)}, ${parseInt(result[3], 16)}` : '132, 0, 255'
}

const gridStyle = {
  display: 'grid',
  gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
  gap: '16px',
  alignItems: 'end'
}

function InvoiceFilters({ filters, customers = [], onFilterChange, onClearFilters }) {
  const { themeColor } = useTheme()
  const themeColorRgb = hexToRgb(themeColor)
  const isDarkMode = document.documentElement.classList.contains('dark-theme')

  const handleChange = (e) => {
    const { name, value, type } = e.target
    const checked = e.target.checked
    let v = value
    if (type === 'checkbox') v = checked
    else if (name === 'customer_id') v = value === '' ? undefined : parseInt(value, 10)
    else if (value === '') v = undefined
    const next = { ...filters, [name]: v }
    if (['customer_id', 'status', 'start_date', 'end_date', 'search', 'overdue_only'].includes(name)) {
      next.page = 1
    }
    onFilterChange(next)
  }

  const customerOptions = [
    { value: '', label: 'All Customers' },
    ...customers.map((c) => ({
      value: c.id,
      label: `${c.customer_number || ''} - ${c.display_name || c.company_name || [c.first_name, c.last_name].filter(Boolean).join(' ') || 'Customer'}`
    }))
  ]

  const statusOptions = [
    { value: '', label: 'All Status' },
    { value: 'draft', label: 'Draft' },
    { value: 'sent', label: 'Sent' },
    { value: 'partial', label: 'Partial' },
    { value: 'paid', label: 'Paid' },
    { value: 'overdue', label: 'Overdue' },
    { value: 'void', label: 'Void' }
  ]

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

  const searchContainerStyle = {
    ...dateContainerStyle,
    flex: '1 1 200px',
    minWidth: '200px'
  }

  return (
    <div style={{ marginBottom: '24px' }}>
      <div style={gridStyle}>
        <CustomDropdown
          name="customer_id"
          value={filters.customer_id ?? ''}
          onChange={handleChange}
          options={customerOptions}
          placeholder="All Customers"
          isDarkMode={isDarkMode}
          themeColorRgb={themeColorRgb}
          triggerVariant="button"
          style={{ marginBottom: 0 }}
        />
        <CustomDropdown
          name="status"
          value={filters.status || ''}
          onChange={handleChange}
          options={statusOptions}
          placeholder="All Status"
          isDarkMode={isDarkMode}
          themeColorRgb={themeColorRgb}
          triggerVariant="button"
          style={{ marginBottom: 0 }}
        />
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
        <div style={{ ...searchContainerStyle, marginBottom: 0 }}>
          <span style={{ whiteSpace: 'nowrap', color: isDarkMode ? '#9ca3af' : '#6b7280', fontSize: '13px' }}>Search</span>
          <input
            type="text"
            name="search"
            value={filters.search || ''}
            onChange={handleChange}
            placeholder="Invoice #..."
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
        <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '14px', color: isDarkMode ? '#d1d5db' : '#374151', cursor: 'pointer', whiteSpace: 'nowrap', marginBottom: 0 }}>
          <input type="checkbox" name="overdue_only" checked={!!filters.overdue_only} onChange={handleChange} style={{ width: '16px', height: '16px' }} />
          Overdue Only
        </label>
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

export default InvoiceFilters
