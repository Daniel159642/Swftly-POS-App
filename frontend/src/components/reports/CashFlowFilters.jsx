import React from 'react'
import { useTheme } from '../../contexts/ThemeContext'
import CustomDropdown from '../common/CustomDropdown'

function CashFlowFilters({ filters, onFilterChange }) {
  const { themeColor } = useTheme()
  const isDarkMode = document.documentElement.classList.contains('dark-theme')
  const hexToRgb = (hex) => {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex)
    return result ? `${parseInt(result[1], 16)}, ${parseInt(result[2], 16)}, ${parseInt(result[3], 16)}` : '132, 0, 255'
  }
  const themeColorRgb = hexToRgb(themeColor)

  const handleChange = (e) => {
    const { name, value } = e.target
    onFilterChange({ ...filters, [name]: value })
  }

  const setPresetPeriod = (preset) => {
    const today = new Date()
    let start
    let end = today

    switch (preset) {
      case 'this_month':
        start = new Date(today.getFullYear(), today.getMonth(), 1)
        break
      case 'last_month':
        start = new Date(today.getFullYear(), today.getMonth() - 1, 1)
        end = new Date(today.getFullYear(), today.getMonth(), 0)
        break
      case 'this_quarter':
        const quarter = Math.floor(today.getMonth() / 3)
        start = new Date(today.getFullYear(), quarter * 3, 1)
        break
      case 'this_year':
        start = new Date(today.getFullYear(), 0, 1)
        break
      case 'last_year':
        start = new Date(today.getFullYear() - 1, 0, 1)
        end = new Date(today.getFullYear() - 1, 11, 31)
        break
      default:
        return
    }

    onFilterChange({
      ...filters,
      start_date: start.toISOString().split('T')[0],
      end_date: end.toISOString().split('T')[0]
    })
  }

  const comparisonOptions = [
    { value: 'none', label: 'No Comparison' },
    { value: 'previous_period', label: 'Previous Period' },
    { value: 'previous_year', label: 'Previous Year' }
  ]

  const gridStyle = {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
    gap: '16px',
    alignItems: 'end',
    marginBottom: '16px'
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

  const quickSelectStyle = {
    display: 'flex',
    gap: '8px',
    flexWrap: 'wrap',
    alignItems: 'center',
    marginTop: '16px'
  }

  const quickSelectButtonStyle = {
    padding: '4px 16px',
    height: '28px',
    display: 'flex',
    alignItems: 'center',
    whiteSpace: 'nowrap',
    backgroundColor: isDarkMode ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.05)',
    border: isDarkMode ? '1px solid var(--border-light, #333)' : '1px solid #ddd',
    borderRadius: '8px',
    fontSize: '14px',
    fontWeight: 500,
    color: isDarkMode ? 'var(--text-primary, #fff)' : '#333',
    cursor: 'pointer',
    transition: 'all 0.2s ease'
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
          name="comparison_type"
          value={filters.comparison_type || 'none'}
          onChange={handleChange}
          options={comparisonOptions}
          placeholder="No Comparison"
          isDarkMode={isDarkMode}
          themeColorRgb={themeColorRgb}
          triggerVariant="button"
          style={{ marginBottom: 0 }}
        />
      </div>

      <div style={quickSelectStyle}>
        <button type="button" onClick={() => setPresetPeriod('this_month')} style={quickSelectButtonStyle}>This Month</button>
        <button type="button" onClick={() => setPresetPeriod('last_month')} style={quickSelectButtonStyle}>Last Month</button>
        <button type="button" onClick={() => setPresetPeriod('this_quarter')} style={quickSelectButtonStyle}>This Quarter</button>
        <button type="button" onClick={() => setPresetPeriod('this_year')} style={quickSelectButtonStyle}>This Year</button>
        <button type="button" onClick={() => setPresetPeriod('last_year')} style={quickSelectButtonStyle}>Last Year</button>
      </div>
    </div>
  )
}

export default CashFlowFilters
