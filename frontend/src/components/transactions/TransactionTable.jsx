import React, { useState, useRef, useEffect } from 'react'
import Button from '../common/Button'

function TransactionTable({ transactions, onView, onEdit, onDelete, onPost, onUnpost, onVoid }) {
  const isDarkMode = document.documentElement.classList.contains('dark-theme')
  const [expandedIds, setExpandedIds] = useState(new Set())
  const [openMenuId, setOpenMenuId] = useState(null)
  const [confirmPostId, setConfirmPostId] = useState(null)
  const [confirmUnpostId, setConfirmUnpostId] = useState(null)
  const [confirmDeleteId, setConfirmDeleteId] = useState(null)
  const [confirmVoidId, setConfirmVoidId] = useState(null)
  const [voidReason, setVoidReason] = useState('')
  const [menuOpenUpward, setMenuOpenUpward] = useState(false)
  const menuRef = useRef(null)

  const isMenuOrConfirmOpen = (id) =>
    openMenuId === id || confirmPostId === id || confirmUnpostId === id || confirmDeleteId === id || confirmVoidId === id

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target)) {
        setOpenMenuId(null)
        setConfirmPostId(null)
        setConfirmUnpostId(null)
        setConfirmDeleteId(null)
        setConfirmVoidId(null)
        setVoidReason('')
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  useEffect(() => {
    if (!openMenuId && !confirmPostId && !confirmUnpostId && !confirmDeleteId && !confirmVoidId) {
      setMenuOpenUpward(false)
      return
    }
    const el = menuRef.current
    if (!el) return
    const rect = el.getBoundingClientRect()
    const estimatedHeight = 380
    const spaceBelow = typeof window !== 'undefined' ? window.innerHeight - rect.bottom - 8 : 400
    setMenuOpenUpward(spaceBelow < estimatedHeight)
  }, [openMenuId, confirmPostId, confirmUnpostId, confirmDeleteId, confirmVoidId])

  const toggleExpand = (id) => {
    const newExpanded = new Set(expandedIds)
    if (newExpanded.has(id)) {
      newExpanded.delete(id)
    } else {
      newExpanded.add(id)
    }
    setExpandedIds(newExpanded)
  }

  const calculateTotals = (lines) => {
    const debits = lines.reduce((sum, line) => sum + (line.debit_amount || 0), 0)
    const credits = lines.reduce((sum, line) => sum + (line.credit_amount || 0), 0)
    return { debits, credits }
  }

  const tableStyle = {
    width: '100%',
    borderCollapse: 'collapse',
    backgroundColor: isDarkMode ? '#2a2a2a' : 'white'
  }

  const thStyle = {
    padding: '12px 24px',
    fontSize: '12px',
    fontWeight: 500,
    color: isDarkMode ? '#9ca3af' : '#6b7280',
    textTransform: 'uppercase',
    textAlign: 'left',
    borderBottom: '1px solid ' + (isDarkMode ? '#3a3a3a' : '#e5e7eb'),
    backgroundColor: isDarkMode ? '#1f1f1f' : '#f9fafb'
  }

  const tdStyle = {
    padding: '12px 24px',
    fontSize: '14px',
    verticalAlign: 'middle',
    borderBottom: '1px solid ' + (isDarkMode ? '#3a3a3a' : '#e5e7eb'),
    color: isDarkMode ? '#e5e7eb' : '#111'
  }

  const statusBadgeStyle = (status) => {
    const baseStyle = {
      padding: '4px 8px',
      fontSize: '12px',
      fontWeight: '600',
      borderRadius: '12px',
      display: 'inline-block'
    }
    
    if (status === 'voided') {
      return { ...baseStyle, backgroundColor: '#fee2e2', color: '#991b1b' }
    } else if (status === 'posted') {
      return { ...baseStyle, backgroundColor: '#d1fae5', color: '#065f46' }
    } else {
      return { ...baseStyle, backgroundColor: '#fef3c7', color: '#92400e' }
    }
  }

  const menuStyle = {
    position: 'absolute',
    ...(menuOpenUpward ? { bottom: '100%', marginBottom: '4px' } : { top: '100%', marginTop: '4px' }),
    right: 0,
    minWidth: '140px',
    backgroundColor: isDarkMode ? '#2d2d2d' : '#fff',
    border: isDarkMode ? '1px solid #333' : '1px solid #e5e7eb',
    borderRadius: '6px',
    boxShadow: isDarkMode ? '0 4px 12px rgba(0,0,0,0.4)' : '0 4px 12px rgba(0,0,0,0.15)',
    zIndex: 1000,
    overflow: 'hidden'
  }

  const menuItemStyle = {
    display: 'block',
    width: '100%',
    padding: '10px 14px',
    textAlign: 'left',
    border: 'none',
    background: 'none',
    color: isDarkMode ? '#fff' : '#333',
    fontSize: '14px',
    cursor: 'pointer',
    transition: 'background-color 0.15s'
  }

  const confirmPanelStyle = {
    minWidth: '200px',
    padding: '12px 14px',
    textAlign: 'left'
  }

  const confirmButtonStyle = {
    padding: '6px 12px',
    fontSize: '13px',
    borderRadius: '6px',
    cursor: 'pointer'
  }

  if (transactions.length === 0) {
    return (
      <div style={{ textAlign: 'center', padding: '48px', color: isDarkMode ? '#9ca3af' : '#6b7280' }}>
        <p>No transactions found</p>
      </div>
    )
  }

  return (
    <div style={{ overflowX: 'auto' }}>
      <table style={tableStyle}>
        <thead>
          <tr>
            <th style={thStyle}>Date</th>
            <th style={thStyle}>Transaction #</th>
            <th style={thStyle}>Type</th>
            <th style={thStyle}>Description</th>
            <th style={{ ...thStyle, textAlign: 'right' }}>Amount</th>
            <th style={thStyle}>Status</th>
            <th style={{ ...thStyle, textAlign: 'right' }}>Actions</th>
          </tr>
        </thead>
        <tbody>
          {transactions.map((item) => {
            const isExpanded = expandedIds.has(item.transaction.id)
            const { debits, credits } = calculateTotals(item.lines)
            const status = item.transaction.is_void ? 'voided' : 
                          item.transaction.is_posted ? 'posted' : 'draft'
            
            return (
              <React.Fragment key={item.transaction.id}>
                <tr
                  style={{
                    backgroundColor: item.transaction.is_void
                      ? (isDarkMode ? '#2a1a1a' : '#fee2e2')
                      : (isDarkMode ? '#2a2a2a' : 'white'),
                    opacity: item.transaction.is_void ? 0.6 : 1,
                    cursor: 'pointer'
                  }}
                  onClick={() => toggleExpand(item.transaction.id)}
                >
                  <td style={tdStyle}>
                    {new Date(item.transaction.transaction_date).toLocaleDateString()}
                  </td>
                  <td style={{ ...tdStyle, fontWeight: '600' }}>
                    {item.transaction.transaction_number}
                  </td>
                  <td style={tdStyle}>
                    {item.transaction.transaction_type.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}
                  </td>
                  <td style={tdStyle}>
                    {item.transaction.description}
                    {item.transaction.reference_number && (
                      <div style={{ fontSize: '12px', color: isDarkMode ? '#9ca3af' : '#6b7280', marginTop: '4px' }}>
                        Ref: {item.transaction.reference_number}
                      </div>
                    )}
                  </td>
                  <td style={{ ...tdStyle, textAlign: 'right', fontWeight: '600' }}>
                    ${debits.toFixed(2)}
                  </td>
                  <td style={tdStyle}>
                    <span style={statusBadgeStyle(status)}>
                      {status === 'voided' ? 'Voided' : status === 'posted' ? 'Posted' : 'Draft'}
                    </span>
                  </td>
                  <td style={{ ...tdStyle, textAlign: 'right' }} onClick={(e) => e.stopPropagation()}>
                    <div ref={isMenuOrConfirmOpen(item.transaction.id) ? menuRef : null} style={{ position: 'relative', display: 'inline-block' }}>
                      <button
                        type="button"
                        onClick={() => {
                          setOpenMenuId((id) => (id === item.transaction.id ? null : item.transaction.id))
                          setConfirmPostId(null)
                          setConfirmUnpostId(null)
                          setConfirmDeleteId(null)
                          setConfirmVoidId(null)
                          setVoidReason('')
                        }}
                        aria-label="Actions"
                        aria-expanded={isMenuOrConfirmOpen(item.transaction.id)}
                        style={{
                          padding: '4px 8px',
                          backgroundColor: isMenuOrConfirmOpen(item.transaction.id) ? (isDarkMode ? '#3a3a3a' : '#eee') : 'transparent',
                          color: isDarkMode ? '#9ca3af' : '#6b7280',
                          border: 'none',
                          borderRadius: '4px',
                          cursor: 'pointer',
                          fontSize: '18px',
                          lineHeight: 1,
                          transition: 'color 0.2s, background-color 0.2s'
                        }}
                        onMouseEnter={(e) => {
                          if (!isMenuOrConfirmOpen(item.transaction.id)) {
                            e.target.style.color = isDarkMode ? '#fff' : '#333'
                            e.target.style.backgroundColor = isDarkMode ? '#3a3a3a' : '#eee'
                          }
                        }}
                        onMouseLeave={(e) => {
                          if (!isMenuOrConfirmOpen(item.transaction.id)) {
                            e.target.style.color = isDarkMode ? '#9ca3af' : '#6b7280'
                            e.target.style.backgroundColor = 'transparent'
                          }
                        }}
                      >
                        ⋮
                      </button>
                      {isMenuOrConfirmOpen(item.transaction.id) && (
                        <div role="menu" style={{ ...menuStyle, ...(confirmPostId === item.transaction.id || confirmUnpostId === item.transaction.id || confirmDeleteId === item.transaction.id || confirmVoidId === item.transaction.id ? confirmPanelStyle : {}) }}>
                          {confirmPostId === item.transaction.id ? (
                            <>
                              <p style={{ margin: '0 0 12px 0', fontSize: '13px', color: isDarkMode ? '#e5e7eb' : '#111' }}>Post this transaction? This will affect account balances.</p>
                              <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-start' }}>
                                <button type="button" onClick={() => setConfirmPostId(null)} style={{ ...confirmButtonStyle, border: isDarkMode ? '1px solid #333' : '1px solid #e5e7eb', background: isDarkMode ? '#2d2d2d' : '#fff', color: isDarkMode ? '#e5e7eb' : '#111' }}>Cancel</button>
                                <button type="button" onClick={() => { onPost(item); setConfirmPostId(null) }} style={{ ...confirmButtonStyle, border: 'none', background: isDarkMode ? '#10b981' : '#059669', color: '#fff' }}>Post</button>
                              </div>
                            </>
                          ) : confirmUnpostId === item.transaction.id ? (
                            <>
                              <p style={{ margin: '0 0 12px 0', fontSize: '13px', color: isDarkMode ? '#e5e7eb' : '#111' }}>Unpost this transaction? This will reverse its effect on account balances.</p>
                              <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-start' }}>
                                <button type="button" onClick={() => setConfirmUnpostId(null)} style={{ ...confirmButtonStyle, border: isDarkMode ? '1px solid #333' : '1px solid #e5e7eb', background: isDarkMode ? '#2d2d2d' : '#fff', color: isDarkMode ? '#e5e7eb' : '#111' }}>Cancel</button>
                                <button type="button" onClick={() => { onUnpost(item); setConfirmUnpostId(null) }} style={{ ...confirmButtonStyle, border: 'none', background: isDarkMode ? '#f59e0b' : '#d97706', color: '#fff' }}>Unpost</button>
                              </div>
                            </>
                          ) : confirmDeleteId === item.transaction.id ? (
                            <>
                              <p style={{ margin: '0 0 12px 0', fontSize: '13px', color: isDarkMode ? '#e5e7eb' : '#111' }}>Delete this transaction? This cannot be undone.</p>
                              <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-start' }}>
                                <button type="button" onClick={() => setConfirmDeleteId(null)} style={{ ...confirmButtonStyle, border: isDarkMode ? '1px solid #333' : '1px solid #e5e7eb', background: isDarkMode ? '#2d2d2d' : '#fff', color: isDarkMode ? '#e5e7eb' : '#111' }}>Cancel</button>
                                <button type="button" onClick={() => { onDelete(item); setConfirmDeleteId(null) }} style={{ ...confirmButtonStyle, border: 'none', background: isDarkMode ? '#dc2626' : '#ef4444', color: '#fff' }}>Delete</button>
                              </div>
                            </>
                          ) : confirmVoidId === item.transaction.id ? (
                            <>
                              <p style={{ margin: '0 0 8px 0', fontSize: '13px', color: isDarkMode ? '#e5e7eb' : '#111' }}>Void this transaction? This cannot be undone.</p>
                              <label style={{ display: 'block', marginBottom: '8px', fontSize: '12px', color: isDarkMode ? '#9ca3af' : '#6b7280' }}>Reason (required)</label>
                              <input
                                type="text"
                                value={voidReason}
                                onChange={(e) => setVoidReason(e.target.value)}
                                placeholder="Enter reason..."
                                style={{ width: '100%', boxSizing: 'border-box', padding: '6px 10px', fontSize: '13px', borderRadius: '6px', border: isDarkMode ? '1px solid #333' : '1px solid #e5e7eb', background: isDarkMode ? '#1f1f1f' : '#fff', color: isDarkMode ? '#e5e7eb' : '#111', marginBottom: '12px' }}
                              />
                              <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-start' }}>
                                <button type="button" onClick={() => { setConfirmVoidId(null); setVoidReason('') }} style={{ ...confirmButtonStyle, border: isDarkMode ? '1px solid #333' : '1px solid #e5e7eb', background: isDarkMode ? '#2d2d2d' : '#fff', color: isDarkMode ? '#e5e7eb' : '#111' }}>Cancel</button>
                                <button type="button" disabled={!voidReason.trim()} onClick={() => { onVoid(item, voidReason.trim()); setConfirmVoidId(null); setVoidReason('') }} style={{ ...confirmButtonStyle, border: 'none', background: voidReason.trim() ? (isDarkMode ? '#dc2626' : '#ef4444') : (isDarkMode ? '#4a4a4a' : '#d1d5db'), color: '#fff', cursor: voidReason.trim() ? 'pointer' : 'not-allowed' }}>Void</button>
                              </div>
                            </>
                          ) : !item.transaction.is_posted && !item.transaction.is_void ? (
                            <>
                              <button role="menuitem" type="button" style={menuItemStyle} onMouseEnter={(e) => { e.target.style.backgroundColor = isDarkMode ? '#3a3a3a' : '#f0f0f0' }} onMouseLeave={(e) => { e.target.style.backgroundColor = 'transparent' }} onClick={() => { onEdit(item); setOpenMenuId(null) }}>Edit</button>
                              <button role="menuitem" type="button" style={menuItemStyle} onMouseEnter={(e) => { e.target.style.backgroundColor = isDarkMode ? '#3a3a3a' : '#f0f0f0' }} onMouseLeave={(e) => { e.target.style.backgroundColor = 'transparent' }} onClick={() => setConfirmPostId(item.transaction.id)}>Post</button>
                              <button role="menuitem" type="button" style={{ ...menuItemStyle, color: '#ef4444' }} onMouseEnter={(e) => { e.target.style.backgroundColor = isDarkMode ? '#3a3a3a' : '#f0f0f0' }} onMouseLeave={(e) => { e.target.style.backgroundColor = 'transparent' }} onClick={() => setConfirmDeleteId(item.transaction.id)}>Delete</button>
                            </>
                          ) : item.transaction.is_posted && !item.transaction.is_void ? (
                            <>
                              <button role="menuitem" type="button" style={menuItemStyle} onMouseEnter={(e) => { e.target.style.backgroundColor = isDarkMode ? '#3a3a3a' : '#f0f0f0' }} onMouseLeave={(e) => { e.target.style.backgroundColor = 'transparent' }} onClick={() => setConfirmUnpostId(item.transaction.id)}>Unpost</button>
                              <button role="menuitem" type="button" style={{ ...menuItemStyle, color: '#ef4444' }} onMouseEnter={(e) => { e.target.style.backgroundColor = isDarkMode ? '#3a3a3a' : '#f0f0f0' }} onMouseLeave={(e) => { e.target.style.backgroundColor = 'transparent' }} onClick={() => { setConfirmVoidId(item.transaction.id); setVoidReason('') }}>Void</button>
                            </>
                          ) : (
                            <p style={{ margin: 0, padding: '10px 14px', fontSize: '13px', color: isDarkMode ? '#9ca3af' : '#6b7280' }}>No actions available</p>
                          )}
                        </div>
                      )}
                    </div>
                  </td>
                </tr>

                {/* Expanded Lines */}
                {isExpanded && (
                  <tr>
                    <td colSpan={7} style={{ ...tdStyle, padding: '16px', backgroundColor: isDarkMode ? '#1a1a1a' : '#f9fafb' }}>
                      <div style={{ fontSize: '14px' }}>
                        <div style={{ fontWeight: '600', marginBottom: '12px', color: isDarkMode ? '#ffffff' : '#1a1a1a' }}>
                          Transaction Lines:
                        </div>
                        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                          <thead>
                            <tr style={{ backgroundColor: isDarkMode ? '#2a2a2a' : '#f3f4f6' }}>
                              <th style={{ ...tdStyle, padding: '8px', fontSize: '12px', fontWeight: '600' }}>Account</th>
                              <th style={{ ...tdStyle, padding: '8px', fontSize: '12px', fontWeight: '600' }}>Description</th>
                              <th style={{ ...tdStyle, padding: '8px', fontSize: '12px', fontWeight: '600', textAlign: 'right' }}>Debit</th>
                              <th style={{ ...tdStyle, padding: '8px', fontSize: '12px', fontWeight: '600', textAlign: 'right' }}>Credit</th>
                            </tr>
                          </thead>
                          <tbody>
                            {item.lines.map((line) => (
                              <tr key={line.id} style={{ borderBottom: `1px solid ${isDarkMode ? '#3a3a3a' : '#e5e7eb'}` }}>
                                <td style={{ ...tdStyle, padding: '8px' }}>
                                  {line.account_number && `${line.account_number} - `}
                                  {line.account_name}
                                </td>
                                <td style={{ ...tdStyle, padding: '8px' }}>{line.description}</td>
                                <td style={{ ...tdStyle, padding: '8px', textAlign: 'right' }}>
                                  {line.debit_amount > 0 ? `$${line.debit_amount.toFixed(2)}` : '-'}
                                </td>
                                <td style={{ ...tdStyle, padding: '8px', textAlign: 'right' }}>
                                  {line.credit_amount > 0 ? `$${line.credit_amount.toFixed(2)}` : '-'}
                                </td>
                              </tr>
                            ))}
                            <tr style={{ fontWeight: '600', backgroundColor: isDarkMode ? '#2a2a2a' : '#f3f4f6' }}>
                              <td style={{ ...tdStyle, padding: '8px' }} colSpan={2}>
                                Totals:
                              </td>
                              <td style={{ ...tdStyle, padding: '8px', textAlign: 'right' }}>${debits.toFixed(2)}</td>
                              <td style={{ ...tdStyle, padding: '8px', textAlign: 'right' }}>${credits.toFixed(2)}</td>
                            </tr>
                          </tbody>
                        </table>
                        {item.transaction.is_void && (
                          <div style={{ marginTop: '12px', color: '#ef4444' }}>
                            <strong>Void Reason:</strong> {item.transaction.void_reason}
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
  )
}

export default TransactionTable
