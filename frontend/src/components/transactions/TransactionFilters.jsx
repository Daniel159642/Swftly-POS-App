import React from 'react'
import { useTheme } from '../../contexts/ThemeContext'
import Input from '../common/Input'
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

  const containerStyle = {
    backgroundColor: isDarkMode ? '#2a2a2a' : 'white',
    padding: '20px',
    borderRadius: '8px',
    border: `1px solid ${isDarkMode ? '#3a3a3a' : '#e5e7eb'}`,
    marginBottom: '24px',
    boxShadow: isDarkMode ? '0 2px 8px rgba(0,0,0,0.3)' : '0 2px 8px rgba(0,0,0,0.08)'
  }

  const gridStyle = {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))',
    gap: '16px',
    marginBottom: '16px'
  }

  return (
    <div style={containerStyle}>
      <div style={gridStyle}>
        <Input
          name="start_date"
          type="date"
          label="Start Date"
          value={filters.start_date || ''}
          onChange={handleChange}
        />

        <Input
          name="end_date"
          type="date"
          label="End Date"
          value={filters.end_date || ''}
          onChange={handleChange}
        />

        <CustomDropdown
          name="transaction_type"
          label="Type"
          value={filters.transaction_type || ''}
          onChange={handleChange}
          options={transactionTypeOptions}
          placeholder="All Types"
          isDarkMode={isDarkMode}
          themeColorRgb={themeColorRgb}
        />

        <CustomDropdown
          name="is_posted"
          label="Status"
          value={filters.is_posted === undefined ? '' : String(filters.is_posted)}
          onChange={handleChange}
          options={statusOptions}
          placeholder="All Status"
          isDarkMode={isDarkMode}
          themeColorRgb={themeColorRgb}
        />

        <CustomDropdown
          name="is_void"
          label="Void Status"
          value={filters.is_void === undefined ? '' : String(filters.is_void)}
          onChange={handleChange}
          options={voidOptions}
          placeholder="Include All"
          isDarkMode={isDarkMode}
          themeColorRgb={themeColorRgb}
        />

        <div style={{ marginBottom: 0 }}>
          <label style={{ display: 'block', fontSize: '14px', fontWeight: 500, marginBottom: '4px', visibility: 'hidden', lineHeight: 1.2 }} aria-hidden>Clear</label>
          <Button type="button" variant="primary" onClick={onClearFilters} style={{ width: '100%' }}>
            Clear Filters
          </Button>
        </div>
      </div>
      
      <div>
        <Input
          name="search"
          label="Search"
          value={filters.search || ''}
          onChange={handleChange}
          placeholder="Search by transaction number or description..."
        />
      </div>
    </div>
  )
}

export default TransactionFilters
