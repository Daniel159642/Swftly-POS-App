import React from 'react'
import { useTheme } from '../../contexts/ThemeContext'
import CustomDropdown from '../common/CustomDropdown'
import Button from '../common/Button'

function AccountFilters({ filters, onFilterChange, onClearFilters }) {
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
      [name]: value === '' ? undefined : name === 'is_active' ? value === 'true' : value,
    })
  }

  const accountTypeOptions = [
    { value: '', label: 'All Types' },
    { value: 'Asset', label: 'Asset' },
    { value: 'Liability', label: 'Liability' },
    { value: 'Equity', label: 'Equity' },
    { value: 'Revenue', label: 'Revenue' },
    { value: 'Expense', label: 'Expense' },
    { value: 'COGS', label: 'COGS' },
  ]

  const statusOptions = [
    { value: '', label: 'All Status' },
    { value: 'true', label: 'Active Only' },
    { value: 'false', label: 'Inactive Only' },
  ]

  return (
    <div style={{ marginBottom: '24px' }}>
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
        gap: '16px',
        alignItems: 'end'
      }}>
        <CustomDropdown
          name="account_type"
          value={filters.account_type || ''}
          onChange={handleChange}
          options={accountTypeOptions}
          placeholder="All Types"
          isDarkMode={isDarkMode}
          themeColorRgb={themeColorRgb}
          triggerVariant="button"
          style={{ marginBottom: 0 }}
        />

        <CustomDropdown
          name="is_active"
          value={filters.is_active === undefined ? '' : String(filters.is_active)}
          onChange={handleChange}
          options={statusOptions}
          placeholder="All Status"
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

export default AccountFilters
