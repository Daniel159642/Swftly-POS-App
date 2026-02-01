import React from 'react'
import { useTheme } from '../../contexts/ThemeContext'
import Input from '../common/Input'
import CustomDropdown from '../common/CustomDropdown'
import Button from '../common/Button'

function GeneralLedgerFilters({ filters, accounts, onFilterChange, onClearFilters, onExport, onExportExcel, loading = false }) {
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
      [name]: value === '' ? undefined : name === 'account_id' ? parseInt(value) : value,
    })
  }

  const accountOptions = [
    { value: '', label: 'All Accounts' },
    ...accounts
      .filter((acc) => acc.is_active)
      .sort((a, b) => {
        const numA = a.account_number || ''
        const numB = b.account_number || ''
        return numA.localeCompare(numB)
      })
      .map((acc) => ({
        value: acc.id,
        label: `${acc.account_number ? acc.account_number + ' - ' : ''}${acc.account_name}`,
      })),
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

  const buttonContainerStyle = {
    display: 'flex',
    justifyContent: 'flex-end',
    gap: '12px',
    marginTop: '16px'
  }

  return (
    <div style={containerStyle}>
      <h3 style={{ 
        fontSize: '18px', 
        fontWeight: '600', 
        marginBottom: '16px',
        color: isDarkMode ? '#ffffff' : '#1a1a1a'
      }}>
        Filter Ledger
      </h3>
      
      <div style={gridStyle}>
        <div style={{ gridColumn: 'span 2' }}>
          <CustomDropdown
            label="Account"
            name="account_id"
            value={filters.account_id ?? ''}
            onChange={handleChange}
            options={accountOptions}
            placeholder="All Accounts"
            isDarkMode={isDarkMode}
            themeColorRgb={themeColorRgb}
          />
        </div>

        <Input
          label="Start Date"
          name="start_date"
          type="date"
          value={filters.start_date || ''}
          onChange={handleChange}
        />

        <Input
          label="End Date"
          name="end_date"
          type="date"
          value={filters.end_date || ''}
          onChange={handleChange}
        />
      </div>

      <div style={buttonContainerStyle}>
        {onExport && (
          <Button
            type="button"
            variant="primary"
            onClick={onExport}
            disabled={loading}
          >
            📊 Export to CSV
          </Button>
        )}
        {onExportExcel && (
          <Button
            type="button"
            variant="primary"
            onClick={onExportExcel}
            disabled={loading}
          >
            📗 Export to Excel
          </Button>
        )}
        <Button
          type="button"
          variant="primary"
          onClick={onClearFilters}
          disabled={loading}
        >
          Clear Filters
        </Button>
      </div>
    </div>
  )
}

export default GeneralLedgerFilters
