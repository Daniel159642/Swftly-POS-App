import React, { useState } from 'react'

function InvoiceTable({ invoices, loading = false, onView, onEdit, onDelete, onSend, onVoid, onRecordPayment }) {
  const isDarkMode = document.documentElement.classList.contains('dark-theme')
  const [expandedIds, setExpandedIds] = useState(new Set())

  // Match GeneralLedgerTable: teal/blue-grey headers, same borders and cell styles
  const mainHeaderBg = isDarkMode ? '#2d4a5a' : '#2d5a6b'
  const subHeaderBg = isDarkMode ? '#3a5566' : '#c5d9e0'
  const totalRowBg = isDarkMode ? '#2a3a45' : '#e8e8e8'
  const borderColor = isDarkMode ? '#3a4a55' : '#d0d0d0'
  const textColor = isDarkMode ? '#e8e8e8' : '#333'
  const subHeaderText = isDarkMode ? '#c8d4dc' : '#2d4a5a'
  const rowBg = isDarkMode ? '#1f2a33' : '#fff'

  const toggleExpand = (id) => {
    const next = new Set(expandedIds)
    if (next.has(id)) next.delete(id)
    else next.add(id)
    setExpandedIds(next)
  }

  const formatCurrency = (amount) => {
    const n = Number(amount)
    if (Number.isNaN(n)) return '$0.00'
    return `$${Math.abs(n).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
  }

  const statusColors = {
    draft: { bg: isDarkMode ? 'rgba(107,114,128,0.2)' : '#f3f4f6', color: '#4b5563' },
    sent: { bg: isDarkMode ? 'rgba(59,130,246,0.2)' : '#dbeafe', color: '#2563eb' },
    viewed: { bg: isDarkMode ? 'rgba(168,85,247,0.2)' : '#f3e8ff', color: '#9333ea' },
    partial: { bg: isDarkMode ? 'rgba(234,179,8,0.2)' : '#fef9c3', color: '#a16207' },
    paid: { bg: isDarkMode ? 'rgba(34,197,94,0.2)' : '#dcfce7', color: '#16a34a' },
    overdue: { bg: isDarkMode ? 'rgba(239,68,68,0.2)' : '#fee2e2', color: '#dc2626' },
    void: { bg: isDarkMode ? '#2a2a2a' : '#e5e7eb', color: '#6b7280' }
  }

  const getStatusStyle = (status) => statusColors[status] || statusColors.draft

  const getCustomerName = (customer) => {
    if (!customer) return 'Unknown Customer'
    return customer.display_name || customer.company_name || [customer.first_name, customer.last_name].filter(Boolean).join(' ').trim() || 'Customer'
  }

  const bannerStyle = {
    backgroundColor: mainHeaderBg,
    padding: '14px 20px',
    textAlign: 'center',
    border: `1px solid ${borderColor}`,
    borderBottom: 'none'
  }

  const columnHeaderStyle = {
    padding: '8px 12px',
    fontSize: '12px',
    fontWeight: 700,
    color: subHeaderText,
    backgroundColor: subHeaderBg,
    border: `1px solid ${borderColor}`,
    borderTop: 'none',
    textAlign: 'left',
    textTransform: 'uppercase',
    letterSpacing: '0.02em'
  }

  const getCellStyle = (backgroundColor) => ({
    padding: '6px 12px',
    fontSize: '14px',
    color: textColor,
    border: `1px solid ${borderColor}`,
    borderTop: 'none',
    backgroundColor: backgroundColor ?? rowBg
  })

  const tableStyle = {
    width: '100%',
    borderCollapse: 'collapse',
    fontSize: '14px'
  }

  const isEmpty = !invoices || invoices.length === 0
  if (loading || isEmpty) {
    return (
      <div style={{
        border: `1px solid ${borderColor}`,
        borderRadius: '8px',
        overflow: 'hidden',
        backgroundColor: rowBg
      }}>
        <div style={bannerStyle}>
          <span style={{ fontSize: '20px', fontWeight: 700, color: '#fff' }}>Invoices</span>
        </div>
        <div style={{ overflowX: 'auto' }}>
          <table style={tableStyle}>
            <thead>
              <tr>
                <th style={{ ...columnHeaderStyle, width: '36px' }} />
                <th style={columnHeaderStyle}>Invoice #</th>
                <th style={columnHeaderStyle}>Customer</th>
                <th style={columnHeaderStyle}>Date / Due</th>
                <th style={{ ...columnHeaderStyle, textAlign: 'right' }}>Total</th>
                <th style={{ ...columnHeaderStyle, textAlign: 'right' }}>Balance Due</th>
                <th style={columnHeaderStyle}>Status</th>
                <th style={{ ...columnHeaderStyle, textAlign: 'right' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td
                  colSpan={8}
                  style={{
                    padding: '48px 24px',
                    textAlign: 'center',
                    color: subHeaderText,
                    fontSize: '14px',
                    border: `1px solid ${borderColor}`,
                    borderTop: 'none',
                    backgroundColor: rowBg
                  }}
                >
                  {loading ? 'Loading…' : (
                    <>
                      <p style={{ marginBottom: '8px' }}>No invoices found</p>
                      <p style={{ fontSize: '14px', color: textColor }}>Try adjusting your filters or create a new invoice</p>
                    </>
                  )}
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    )
  }

  const baseCell = getCellStyle()

  return (
    <div style={{
      border: `1px solid ${borderColor}`,
      borderRadius: '8px',
      overflow: 'hidden',
      backgroundColor: rowBg
    }}>
      <div style={bannerStyle}>
        <span style={{ fontSize: '20px', fontWeight: 700, color: '#fff' }}>Invoices</span>
      </div>
      <div style={{ overflowX: 'auto' }}>
        <table style={tableStyle}>
          <thead>
            <tr>
              <th style={{ ...columnHeaderStyle, width: '36px' }} />
              <th style={columnHeaderStyle}>Invoice #</th>
              <th style={columnHeaderStyle}>Customer</th>
              <th style={columnHeaderStyle}>Date / Due</th>
              <th style={{ ...columnHeaderStyle, textAlign: 'right' }}>Total</th>
              <th style={{ ...columnHeaderStyle, textAlign: 'right' }}>Balance Due</th>
              <th style={columnHeaderStyle}>Status</th>
              <th style={{ ...columnHeaderStyle, textAlign: 'right' }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {invoices.map((item) => {
              const inv = item.invoice || item
              const lines = item.lines || []
              const customer = item.customer
              const isExpanded = expandedIds.has(inv.id)
              const isOverdue = inv.status === 'overdue'
              const statusStyle = getStatusStyle(inv.status)
              const rowBgOverride = isOverdue ? (isDarkMode ? 'rgba(239,68,68,0.08)' : '#fef2f2') : rowBg

              return (
                <React.Fragment key={inv.id}>
                  <tr style={{ opacity: inv.status === 'void' ? 0.6 : 1 }}>
                    <td style={getCellStyle(rowBgOverride)}>
                      <button
                        type="button"
                        onClick={() => toggleExpand(inv.id)}
                        style={{ background: 'none', border: 'none', color: subHeaderText, cursor: 'pointer', padding: '4px' }}
                      >
                        <svg width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} style={{ transform: isExpanded ? 'rotate(90deg)' : 'none', transition: 'transform 0.2s' }}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                        </svg>
                      </button>
                    </td>
                    <td style={{ ...getCellStyle(rowBgOverride), fontWeight: 600, color: isDarkMode ? '#93c5fd' : '#2563eb' }}>{inv.invoice_number}</td>
                    <td style={getCellStyle(rowBgOverride)}>{getCustomerName(customer)}</td>
                    <td style={getCellStyle(rowBgOverride)}>
                      <div>{new Date(inv.invoice_date).toLocaleDateString()}</div>
                      <div style={{ fontSize: '12px', color: subHeaderText, marginTop: '2px' }}>Due: {new Date(inv.due_date).toLocaleDateString()}</div>
                    </td>
                    <td style={{ ...getCellStyle(rowBgOverride), textAlign: 'right', fontWeight: 600 }}>{formatCurrency(inv.total_amount)}</td>
                    <td style={getCellStyle(rowBgOverride)}>
                      <span style={{ fontWeight: 600, color: (inv.balance_due || 0) > 0 ? '#dc2626' : '#16a34a' }}>{formatCurrency(inv.balance_due)}</span>
                    </td>
                    <td style={getCellStyle(rowBgOverride)}>
                      <span style={{ padding: '2px 8px', borderRadius: '9999px', fontSize: '12px', fontWeight: 600, backgroundColor: statusStyle.bg, color: statusStyle.color }}>
                        {String(inv.status || '').charAt(0).toUpperCase() + (inv.status || '').slice(1)}
                      </span>
                    </td>
                    <td style={{ ...getCellStyle(rowBgOverride), textAlign: 'right' }}>
                      <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end', flexWrap: 'wrap' }}>
                        <button type="button" onClick={() => onView(item)} style={{ background: 'none', border: 'none', color: isDarkMode ? '#93c5fd' : '#2563eb', cursor: 'pointer', fontSize: '14px', fontWeight: 500 }}>View</button>
                        {inv.status === 'draft' && (
                          <>
                            <button type="button" onClick={() => onEdit(item)} style={{ background: 'none', border: 'none', color: isDarkMode ? '#93c5fd' : '#2563eb', cursor: 'pointer', fontSize: '14px', fontWeight: 500 }}>Edit</button>
                            <button type="button" onClick={() => onSend(item)} style={{ background: 'none', border: 'none', color: '#16a34a', cursor: 'pointer', fontSize: '14px', fontWeight: 500 }}>Send</button>
                            <button type="button" onClick={() => onDelete(item)} style={{ background: 'none', border: 'none', color: '#dc2626', cursor: 'pointer', fontSize: '14px', fontWeight: 500 }}>Delete</button>
                          </>
                        )}
                        {(inv.balance_due || 0) > 0 && inv.status !== 'void' && inv.status !== 'draft' && (
                          <button type="button" onClick={() => onRecordPayment(item)} style={{ background: 'none', border: 'none', color: '#16a34a', cursor: 'pointer', fontSize: '14px', fontWeight: 500 }}>Payment</button>
                        )}
                        {inv.status !== 'void' && (inv.amount_paid || 0) === 0 && (
                          <button type="button" onClick={() => onVoid(item)} style={{ background: 'none', border: 'none', color: '#dc2626', cursor: 'pointer', fontSize: '14px', fontWeight: 500 }}>Void</button>
                        )}
                      </div>
                    </td>
                  </tr>
                  {isExpanded && (
                    <tr>
                      <td colSpan={8} style={{
                        padding: '16px 24px',
                        backgroundColor: isDarkMode ? '#2a3540' : '#f0f4f6',
                        border: `1px solid ${borderColor}`,
                        borderTop: 'none'
                      }}>
                        <div style={{ fontSize: '14px' }}>
                          <div style={{ fontWeight: 600, marginBottom: '8px', color: subHeaderText }}>Line Items</div>
                          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                            <thead>
                              <tr style={{ backgroundColor: subHeaderBg }}>
                                <th style={{ padding: '8px 12px', textAlign: 'left', fontSize: '12px', fontWeight: 700, color: subHeaderText, textTransform: 'uppercase' }}>Description</th>
                                <th style={{ padding: '8px 12px', textAlign: 'right', fontSize: '12px', fontWeight: 700, color: subHeaderText, textTransform: 'uppercase' }}>Qty</th>
                                <th style={{ padding: '8px 12px', textAlign: 'right', fontSize: '12px', fontWeight: 700, color: subHeaderText, textTransform: 'uppercase' }}>Price</th>
                                <th style={{ padding: '8px 12px', textAlign: 'right', fontSize: '12px', fontWeight: 700, color: subHeaderText, textTransform: 'uppercase' }}>Total</th>
                              </tr>
                            </thead>
                            <tbody>
                              {lines.map((line) => (
                                <tr key={line.id || line.line_number}>
                                  <td style={{ padding: '8px 12px', color: textColor, borderBottom: `1px solid ${borderColor}` }}>{line.description}</td>
                                  <td style={{ padding: '8px 12px', textAlign: 'right', color: textColor, borderBottom: `1px solid ${borderColor}` }}>{line.quantity}</td>
                                  <td style={{ padding: '8px 12px', textAlign: 'right', color: textColor, borderBottom: `1px solid ${borderColor}` }}>{formatCurrency(line.unit_price)}</td>
                                  <td style={{ padding: '8px 12px', textAlign: 'right', fontWeight: 600, borderBottom: `1px solid ${borderColor}` }}>{formatCurrency(line.line_total_with_tax)}</td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        {inv.memo && (
                          <div style={{ marginTop: '12px', padding: '8px 12px', borderRadius: '6px', backgroundColor: isDarkMode ? 'rgba(59,130,246,0.1)' : '#eff6ff', fontSize: '13px' }}>
                            <span style={{ fontWeight: 600, color: isDarkMode ? '#93c5fd' : '#1e40af' }}>Memo:</span> {inv.memo}
                          </div>
                        )}
                        </div>
                      </td>
                    </tr>
                  )}
                </React.Fragment>
              )
            })}
          </tbody>
        </table>
      </div>
    </div>
  )
}

export default InvoiceTable
