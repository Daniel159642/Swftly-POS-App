import React from 'react'
import { useTheme } from '../../contexts/ThemeContext'
import Input from '../common/Input'
import CustomDropdown from '../common/CustomDropdown'
import Button from '../common/Button'

function BalanceSheetFilters({ filters, onFilterChange, onGenerate, loading = false }) {
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

  const setPresetDate = (preset) => {
    const today = new Date()
    let asOfDate

    switch (preset) {
      case 'today':
        asOfDate = today
        break
      case 'end_of_month':
        asOfDate = new Date(today.getFullYear(), today.getMonth() + 1, 0)
        break
      case 'end_of_last_month':
        asOfDate = new Date(today.getFullYear(), today.getMonth(), 0)
        break
      case 'end_of_quarter':
        const quarter = Math.floor(today.getMonth() / 3)
        asOfDate = new Date(today.getFullYear(), (quarter + 1) * 3, 0)
        break
      case 'end_of_year':
        asOfDate = new Date(today.getFullYear(), 11, 31)
        break
      case 'end_of_last_year':
        asOfDate = new Date(today.getFullYear() - 1, 11, 31)
        break
      default:
        return
    }

    onFilterChange({
      ...filters,
      as_of_date: asOfDate.toISOString().split('T')[0]
    })
  }

  const comparisonOptions = [
    { value: 'none', label: 'No Comparison' },
    { value: 'previous_month', label: 'Previous Month' },
    { value: 'previous_year', label: 'Previous Year' }
  ]

  const containerStyle = {
    backgroundColor: isDarkMode ? '#2a2a2a' : 'white',
    padding: '24px',
    borderRadius: '8px',
    border: `1px solid ${isDarkMode ? '#3a3a3a' : '#e5e7eb'}`,
    marginBottom: '24px',
    boxShadow: isDarkMode ? '0 2px 8px rgba(0,0,0,0.3)' : '0 2px 8px rgba(0,0,0,0.08)'
  }

  const gridStyle = {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
    gap: '16px',
    marginBottom: '16px'
  }

  const quickSelectStyle = {
    display: 'flex',
    gap: '8px',
    flexWrap: 'wrap',
    alignItems: 'center',
    marginTop: '16px',
    paddingTop: '16px',
    borderTop: `1px solid ${isDarkMode ? '#3a3a3a' : '#e5e7eb'}`
  }

  const quickSelectButtonStyle = {
    padding: '4px 16px',
    height: '28px',
    display: 'flex',
    alignItems: 'center',
    whiteSpace: 'nowrap',
    backgroundColor: `rgba(${themeColorRgb}, 0.7)`,
    border: `1px solid rgba(${themeColorRgb}, 0.5)`,
    borderRadius: '8px',
    fontSize: '14px',
    fontWeight: 600,
    color: '#fff',
    cursor: 'pointer',
    transition: 'all 0.3s ease',
    boxShadow: `0 4px 15px rgba(${themeColorRgb}, 0.3)`
  }

  return (
    <div style={containerStyle}>
      <h3 style={{
        fontSize: '18px',
        fontWeight: '600',
        marginBottom: '16px',
        color: isDarkMode ? '#ffffff' : '#1a1a1a'
      }}>
        Report Settings
      </h3>

      <div style={gridStyle}>
        <Input
          label="As of Date"
          name="as_of_date"
          type="date"
          value={filters.as_of_date || ''}
          onChange={handleChange}
          required
        />
        <CustomDropdown
          label="Compare To"
          name="comparison_type"
          value={filters.comparison_type || 'none'}
          onChange={handleChange}
          options={comparisonOptions}
          placeholder="No Comparison"
          isDarkMode={isDarkMode}
          themeColorRgb={themeColorRgb}
        />
        <div style={{ marginBottom: '16px' }}>
          <label style={{ display: 'block', fontSize: '14px', fontWeight: 500, marginBottom: '4px', visibility: 'hidden', lineHeight: 1.2 }} aria-hidden>Generate</label>
          <Button
            type="button"
            onClick={onGenerate}
            disabled={loading || !filters.as_of_date}
            style={{ width: '100%' }}
          >
            {loading ? 'Generating...' : 'Generate Report'}
          </Button>
        </div>
      </div>

      <div style={quickSelectStyle}>
        <span style={{ fontSize: '14px', color: isDarkMode ? '#9ca3af' : '#6b7280', marginRight: '8px' }}>
          Quick Select:
        </span>
        <button type="button" onClick={() => setPresetDate('today')} style={quickSelectButtonStyle}>Today</button>
        <button type="button" onClick={() => setPresetDate('end_of_month')} style={quickSelectButtonStyle}>End of Month</button>
        <button type="button" onClick={() => setPresetDate('end_of_last_month')} style={quickSelectButtonStyle}>End of Last Month</button>
        <button type="button" onClick={() => setPresetDate('end_of_quarter')} style={quickSelectButtonStyle}>End of Quarter</button>
        <button type="button" onClick={() => setPresetDate('end_of_year')} style={quickSelectButtonStyle}>End of Year</button>
        <button type="button" onClick={() => setPresetDate('end_of_last_year')} style={quickSelectButtonStyle}>End of Last Year</button>
      </div>
    </div>
  )
}

export default BalanceSheetFilters
