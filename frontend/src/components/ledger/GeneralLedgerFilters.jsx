import React, { useState, useEffect, useRef } from 'react'
import { useTheme } from '../../contexts/ThemeContext'
import CustomDropdown from '../common/CustomDropdown'
import Button from '../common/Button'
import { ChevronDown } from 'lucide-react'

function GeneralLedgerFilters({ filters, accounts, onFilterChange, onClearFilters, onExport, onExportExcel, onExportPdf, loading = false }) {
  const { themeColor } = useTheme()
  const isDarkMode = document.documentElement.classList.contains('dark-theme')
  const [exportOpen, setExportOpen] = useState(false)
  const exportRef = useRef(null)

  const hexToRgb = (hex) => {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex)
    return result ? `${parseInt(result[1], 16)}, ${parseInt(result[2], 16)}, ${parseInt(result[3], 16)}` : '132, 0, 255'
  }
  const themeColorRgb = hexToRgb(themeColor)

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (exportRef.current && !exportRef.current.contains(e.target)) setExportOpen(false)
    }
    if (exportOpen) document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [exportOpen])

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

  const buttonStyle = {
    padding: '4px 16px',
    minHeight: '28px',
    height: '28px',
    borderRadius: '8px',
    fontSize: '14px',
    fontWeight: 500,
    backgroundColor: isDarkMode ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.05)',
    border: isDarkMode ? '1px solid var(--border-light, #333)' : '1px solid #ddd',
    color: isDarkMode ? 'var(--text-primary, #fff)' : '#333',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    gap: '6px',
    transition: 'border-color 0.2s ease'
  }

  return (
    <div style={{ marginBottom: '24px' }}>
      <div style={gridStyle}>
        <CustomDropdown
          name="account_id"
          value={filters.account_id ?? ''}
          onChange={handleChange}
          options={accountOptions}
          placeholder="All Accounts"
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

        {(onExport || onExportExcel || onExportPdf) && (
          <div ref={exportRef} style={{ position: 'relative', marginBottom: 0 }}>
            <button
              type="button"
              onClick={() => setExportOpen((o) => !o)}
              disabled={loading}
              style={{
                ...buttonStyle,
                opacity: loading ? 0.6 : 1,
                width: '100%',
                justifyContent: 'center'
              }}
            >
              Export
              <ChevronDown size={16} style={{ transform: exportOpen ? 'rotate(180deg)' : 'rotate(0deg)', transition: 'transform 0.2s' }} />
            </button>
            {exportOpen && (
              <div
                style={{
                  position: 'absolute',
                  top: '100%',
                  left: 0,
                  marginTop: '4px',
                  minWidth: '140px',
                  backgroundColor: isDarkMode ? '#2d2d2d' : '#fff',
                  border: isDarkMode ? '1px solid #333' : '1px solid #e5e7eb',
                  borderRadius: '6px',
                  boxShadow: isDarkMode ? '0 4px 12px rgba(0,0,0,0.4)' : '0 4px 12px rgba(0,0,0,0.15)',
                  zIndex: 1000,
                  overflow: 'hidden'
                }}
              >
                {onExport && (
                  <button
                    type="button"
                    onClick={() => {
                      onExport()
                      setExportOpen(false)
                    }}
                    disabled={loading}
                    style={{
                      display: 'block',
                      width: '100%',
                      padding: '10px 14px',
                      textAlign: 'left',
                      border: 'none',
                      background: 'none',
                      color: isDarkMode ? '#fff' : '#333',
                      fontSize: '14px',
                      cursor: loading ? 'not-allowed' : 'pointer',
                      opacity: loading ? 0.6 : 1
                    }}
                    onMouseEnter={(e) => { if (!loading) e.target.style.backgroundColor = isDarkMode ? '#3a3a3a' : '#f0f0f0' }}
                    onMouseLeave={(e) => { e.target.style.backgroundColor = 'transparent' }}
                  >
                    Export to CSV
                  </button>
                )}
                {onExportExcel && (
                  <button
                    type="button"
                    onClick={() => {
                      onExportExcel()
                      setExportOpen(false)
                    }}
                    disabled={loading}
                    style={{
                      display: 'block',
                      width: '100%',
                      padding: '10px 14px',
                      textAlign: 'left',
                      border: 'none',
                      background: 'none',
                      color: isDarkMode ? '#fff' : '#333',
                      fontSize: '14px',
                      cursor: loading ? 'not-allowed' : 'pointer',
                      opacity: loading ? 0.6 : 1,
                      borderTop: isDarkMode ? '1px solid #333' : '1px solid #eee'
                    }}
                    onMouseEnter={(e) => { if (!loading) e.target.style.backgroundColor = isDarkMode ? '#3a3a3a' : '#f0f0f0' }}
                    onMouseLeave={(e) => { e.target.style.backgroundColor = 'transparent' }}
                  >
                    Export to Excel
                  </button>
                )}
                {onExportPdf && (
                  <button
                    type="button"
                    onClick={() => {
                      onExportPdf()
                      setExportOpen(false)
                    }}
                    disabled={loading}
                    style={{
                      display: 'block',
                      width: '100%',
                      padding: '10px 14px',
                      textAlign: 'left',
                      border: 'none',
                      background: 'none',
                      color: isDarkMode ? '#fff' : '#333',
                      fontSize: '14px',
                      cursor: loading ? 'not-allowed' : 'pointer',
                      opacity: loading ? 0.6 : 1,
                      borderTop: isDarkMode ? '1px solid #333' : '1px solid #eee'
                    }}
                    onMouseEnter={(e) => { if (!loading) e.target.style.backgroundColor = isDarkMode ? '#3a3a3a' : '#f0f0f0' }}
                    onMouseLeave={(e) => { e.target.style.backgroundColor = 'transparent' }}
                  >
                    Export to PDF
                  </button>
                )}
              </div>
            )}
          </div>
        )}

        <div style={{ marginBottom: 0 }}>
          <label style={{ display: 'block', fontSize: '14px', fontWeight: 500, marginBottom: '4px', visibility: 'hidden', lineHeight: 1.2 }} aria-hidden>Clear</label>
          <Button type="button" variant="primary" onClick={onClearFilters} disabled={loading} style={{ width: '100%' }}>
            Clear Filters
          </Button>
        </div>
      </div>
    </div>
  )
}

export default GeneralLedgerFilters
