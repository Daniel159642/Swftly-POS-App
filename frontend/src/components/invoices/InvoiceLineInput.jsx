import React, { useMemo } from 'react'
import { useTheme } from '../../contexts/ThemeContext'
import Input from '../common/Input'
import CustomDropdown from '../common/CustomDropdown'

function hexToRgb(hex) {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex)
  return result ? `${parseInt(result[1], 16)}, ${parseInt(result[2], 16)}, ${parseInt(result[3], 16)}` : '132, 0, 255'
}

function InvoiceLineInput({ line, lineIndex, revenueAccounts, taxRates, onChange, onRemove, canRemove }) {
  const { themeColor } = useTheme()
  const themeColorRgb = hexToRgb(themeColor)
  const isDarkMode = document.documentElement.classList.contains('dark-theme')

  const calculatedTotal = useMemo(() => {
    const lineTotal = (line.quantity || 0) * (line.unit_price || 0)
    const discountAmount = line.discount_percentage ? lineTotal * (line.discount_percentage / 100) : 0
    const afterDiscount = lineTotal - discountAmount
    let taxAmount = 0
    if (line.tax_rate_id && Array.isArray(taxRates)) {
      const tr = taxRates.find((t) => t.id === line.tax_rate_id)
      if (tr && (tr.tax_rate != null)) {
        const rate = typeof tr.tax_rate === 'number' ? tr.tax_rate : parseFloat(tr.tax_rate) || 0
        taxAmount = afterDiscount * (rate / 100)
      }
    }
    return afterDiscount + taxAmount
  }, [line.quantity, line.unit_price, line.discount_percentage, line.tax_rate_id, taxRates])

  const handleChange = (field, value) => {
    const updated = { ...line, [field]: value }
    onChange(lineIndex, updated)
  }

  const accountOptions = (revenueAccounts || []).map((acc) => ({
    value: acc.id,
    label: `${acc.account_number ? acc.account_number + ' - ' : ''}${acc.account_name}`
  }))

  const taxRateOptions = [
    { value: '', label: 'No Tax' },
    ...(taxRates || []).map((r) => ({
      value: r.id,
      label: `${r.tax_name || 'Tax'} (${(r.tax_rate != null ? r.tax_rate : 0)}%)`
    }))
  ]

  const rowStyle = {
    display: 'grid',
    gridTemplateColumns: '28px 1fr 72px 90px 120px 90px 80px 36px',
    gap: '6px',
    alignItems: 'start',
    padding: '8px',
    borderRadius: '6px',
    backgroundColor: isDarkMode ? '#1f1f1f' : '#f9fafb',
    border: '1px solid ' + (isDarkMode ? '#3a3a3a' : '#e5e7eb'),
    marginBottom: '6px',
    minWidth: '640px'
  }

  return (
    <div style={rowStyle}>
      <div style={{ paddingTop: '6px', fontWeight: 600, color: isDarkMode ? '#9ca3af' : '#6b7280', fontSize: '13px', textAlign: 'center' }}>
        {lineIndex + 1}
      </div>
      <div style={{ marginBottom: 0 }}>
        <Input
          name={`description_${lineIndex}`}
          value={line.description || ''}
          onChange={(e) => handleChange('description', e.target.value)}
          placeholder="Item/Service description"
          required
          style={{ marginBottom: 0 }}
        />
      </div>
      <div style={{ marginBottom: 0 }}>
        <Input
          name={`quantity_${lineIndex}`}
          type="number"
          step="0.01"
          min="0"
          value={line.quantity ?? ''}
          onChange={(e) => handleChange('quantity', parseFloat(e.target.value) || 0)}
          placeholder="Qty"
          required
          style={{ marginBottom: 0, textAlign: 'right' }}
        />
      </div>
      <div style={{ marginBottom: 0 }}>
        <Input
          name={`unit_price_${lineIndex}`}
          type="number"
          step="0.01"
          min="0"
          value={line.unit_price ?? ''}
          onChange={(e) => handleChange('unit_price', parseFloat(e.target.value) || 0)}
          placeholder="0.00"
          required
          style={{ marginBottom: 0, textAlign: 'right' }}
        />
      </div>
      <div style={{ marginBottom: 0 }}>
        <CustomDropdown
          name={`account_${lineIndex}`}
          value={line.account_id ?? ''}
          onChange={(e) => handleChange('account_id', e.target.value ? parseInt(e.target.value, 10) : null)}
          options={accountOptions}
          placeholder="Revenue account"
          required
          isDarkMode={isDarkMode}
          themeColorRgb={themeColorRgb}
          compactTrigger
          triggerFullWidth
          style={{ marginBottom: 0 }}
        />
      </div>
      <div style={{ marginBottom: 0 }}>
        <CustomDropdown
          name={`tax_${lineIndex}`}
          value={line.tax_rate_id ?? ''}
          onChange={(e) => handleChange('tax_rate_id', e.target.value ? parseInt(e.target.value, 10) : undefined)}
          options={taxRateOptions}
          placeholder="No Tax"
          isDarkMode={isDarkMode}
          themeColorRgb={themeColorRgb}
          compactTrigger
          triggerFullWidth
          style={{ marginBottom: 0 }}
        />
      </div>
      <div style={{ paddingTop: '24px', textAlign: 'right', fontWeight: 600, fontSize: '14px', color: isDarkMode ? '#e5e7eb' : '#111' }}>
        ${Number(calculatedTotal).toFixed(2)}
      </div>
      <div style={{ paddingTop: '20px', display: 'flex', justifyContent: 'center' }}>
        {canRemove && (
          <button
            type="button"
            onClick={() => onRemove(lineIndex)}
            style={{
              background: 'none',
              border: 'none',
              color: '#dc2626',
              cursor: 'pointer',
              padding: '4px'
            }}
            title="Remove line"
          >
            <svg width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        )}
      </div>
    </div>
  )
}

export default InvoiceLineInput
