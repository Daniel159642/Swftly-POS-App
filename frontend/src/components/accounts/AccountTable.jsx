import React, { useState, useEffect, useRef } from 'react'

function AccountTable({ accounts, onEdit, onDelete, onToggleStatus, onViewBalance, onViewLedger }) {
  const isDarkMode = document.documentElement.classList.contains('dark-theme')
  const [openMenuId, setOpenMenuId] = useState(null)
  const [expandedRowId, setExpandedRowId] = useState(null)
  const menuRef = useRef(null)

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target)) {
        setOpenMenuId(null)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const getAccountTypeColor = (type) => {
    const colors = {
      Asset: '#10b981',
      Liability: '#ef4444',
      Equity: '#3b82f6',
      Revenue: '#8b5cf6',
      Expense: '#f59e0b',
      COGS: '#eab308',
    }
    return colors[type] || (isDarkMode ? '#9ca3af' : '#6b7280')
  }

  if (accounts.length === 0) {
    return (
      <div style={{ textAlign: 'center', padding: '48px 16px', color: isDarkMode ? '#9ca3af' : '#6b7280' }}>
        No accounts found
      </div>
    )
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
    borderBottom: '1px solid ' + (isDarkMode ? '#3a3a3a' : '#e5e7eb')
  }

  const menuStyle = {
    position: 'absolute',
    top: '100%',
    right: 0,
    marginTop: '4px',
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

  return (
    <div style={{ overflowX: 'auto' }}>
      <table style={{ width: '100%', borderCollapse: 'collapse' }}>
        <thead>
          <tr>
            <th style={thStyle}>Account Number</th>
            <th style={thStyle}>Account Name</th>
            <th style={thStyle}>Type</th>
            <th style={thStyle}>Balance Type</th>
            <th style={thStyle}>Status</th>
            <th style={{ ...thStyle, textAlign: 'right' }}>Actions</th>
          </tr>
        </thead>
        <tbody>
          {accounts.map((account) => (
            <React.Fragment key={account.id}>
              <tr
                style={{
                  opacity: !account.is_active ? 0.6 : 1,
                  backgroundColor: !account.is_active ? (isDarkMode ? '#1f1f1f' : '#f9fafb') : 'transparent',
                  cursor: (account.description || account.is_system_account || account.sub_type) ? 'pointer' : 'default'
                }}
                onDoubleClick={() => {
                  if (account.description || account.is_system_account || account.sub_type) {
                    setExpandedRowId((id) => (id === account.id ? null : account.id))
                  }
                }}
              >
                <td style={tdStyle}>
                  <div style={{ fontWeight: 500, color: isDarkMode ? '#e5e7eb' : '#111' }}>
                    {account.account_number || '-'}
                  </div>
                </td>
                <td style={tdStyle}>
                  <div style={{ fontWeight: 500, color: isDarkMode ? '#e5e7eb' : '#111' }}>
                    {account.account_name}
                  </div>
                </td>
                <td style={tdStyle}>
                  <span style={{
                    fontSize: '14px',
                    fontWeight: 500,
                    color: getAccountTypeColor(account.account_type)
                  }}>
                    {account.account_type}
                  </span>
                </td>
              <td style={{ ...tdStyle, textTransform: 'capitalize' }}>
                <span style={{ color: isDarkMode ? '#e5e7eb' : '#111' }}>{account.balance_type}</span>
              </td>
              <td style={tdStyle}>
                <span
                  style={{
                    display: 'inline-block',
                    padding: '2px 8px',
                    borderRadius: '9999px',
                    fontSize: '12px',
                    fontWeight: 600,
                    backgroundColor: account.is_active
                      ? (isDarkMode ? 'rgba(34,197,94,0.2)' : '#dcfce7')
                      : (isDarkMode ? '#2a2a2a' : '#e5e7eb'),
                    color: account.is_active ? '#16a34a' : '#6b7280'
                  }}
                >
                  {account.is_active ? 'Active' : 'Inactive'}
                </span>
              </td>
              <td style={{ ...tdStyle, textAlign: 'right' }} onDoubleClick={(e) => e.stopPropagation()}>
                <div ref={openMenuId === account.id ? menuRef : null} style={{ position: 'relative', display: 'inline-block' }}>
                  <button
                    type="button"
                    onClick={() => setOpenMenuId((id) => (id === account.id ? null : account.id))}
                    aria-label="Actions"
                    aria-expanded={openMenuId === account.id}
                    style={{
                      padding: '4px 8px',
                      backgroundColor: openMenuId === account.id ? (isDarkMode ? '#3a3a3a' : '#eee') : 'transparent',
                      color: isDarkMode ? '#9ca3af' : '#6b7280',
                      border: 'none',
                      borderRadius: '4px',
                      cursor: 'pointer',
                      fontSize: '18px',
                      lineHeight: 1,
                      transition: 'color 0.2s, background-color 0.2s'
                    }}
                    onMouseEnter={(e) => {
                      if (openMenuId !== account.id) {
                        e.target.style.color = isDarkMode ? '#fff' : '#333'
                        e.target.style.backgroundColor = isDarkMode ? '#3a3a3a' : '#eee'
                      }
                    }}
                    onMouseLeave={(e) => {
                      if (openMenuId !== account.id) {
                        e.target.style.color = isDarkMode ? '#9ca3af' : '#6b7280'
                        e.target.style.backgroundColor = 'transparent'
                      }
                    }}
                  >
                    ⋮
                  </button>
                  {openMenuId === account.id && (
                    <div role="menu" style={menuStyle}>
                      <button
                        role="menuitem"
                        type="button"
                        style={menuItemStyle}
                        onMouseEnter={(e) => { e.target.style.backgroundColor = isDarkMode ? '#3a3a3a' : '#f0f0f0' }}
                        onMouseLeave={(e) => { e.target.style.backgroundColor = 'transparent' }}
                        onClick={() => {
                          onViewBalance(account)
                          setOpenMenuId(null)
                        }}
                      >
                        View Balance
                      </button>
                      {onViewLedger && (
                        <button
                          role="menuitem"
                          type="button"
                          style={menuItemStyle}
                          onMouseEnter={(e) => { e.target.style.backgroundColor = isDarkMode ? '#3a3a3a' : '#f0f0f0' }}
                          onMouseLeave={(e) => { e.target.style.backgroundColor = 'transparent' }}
                          onClick={() => {
                            onViewLedger(account)
                            setOpenMenuId(null)
                          }}
                        >
                          View Ledger
                        </button>
                      )}
                      <button
                        role="menuitem"
                        type="button"
                        style={menuItemStyle}
                        onMouseEnter={(e) => { e.target.style.backgroundColor = isDarkMode ? '#3a3a3a' : '#f0f0f0' }}
                        onMouseLeave={(e) => { e.target.style.backgroundColor = 'transparent' }}
                        onClick={() => {
                          onEdit(account)
                          setOpenMenuId(null)
                        }}
                      >
                        Edit
                      </button>
                      <button
                        role="menuitem"
                        type="button"
                        style={menuItemStyle}
                        onMouseEnter={(e) => { e.target.style.backgroundColor = isDarkMode ? '#3a3a3a' : '#f0f0f0' }}
                        onMouseLeave={(e) => { e.target.style.backgroundColor = 'transparent' }}
                        onClick={() => {
                          onToggleStatus(account)
                          setOpenMenuId(null)
                        }}
                      >
                        {account.is_active ? 'Deactivate' : 'Activate'}
                      </button>
                      {!account.is_system_account && (
                        <button
                          role="menuitem"
                          type="button"
                          style={{ ...menuItemStyle, color: '#dc2626' }}
                          onMouseEnter={(e) => { e.target.style.backgroundColor = isDarkMode ? '#3a3a3a' : '#f0f0f0' }}
                          onMouseLeave={(e) => { e.target.style.backgroundColor = 'transparent' }}
                          onClick={() => {
                            onDelete(account)
                            setOpenMenuId(null)
                          }}
                        >
                          Delete
                        </button>
                      )}
                    </div>
                  )}
                </div>
              </td>
            </tr>
            {expandedRowId === account.id && (account.description || account.is_system_account || account.sub_type) && (
              <tr style={{ backgroundColor: isDarkMode ? '#252525' : '#f9fafb' }}>
                <td style={{ ...tdStyle, paddingTop: '8px', paddingBottom: '12px', verticalAlign: 'top' }} colSpan={6}>
                  <div
                    style={{
                      padding: '12px 16px',
                      borderRadius: '6px',
                      border: `1px solid ${isDarkMode ? '#3a3a3a' : '#e5e7eb'}`,
                      backgroundColor: isDarkMode ? '#1f1f1f' : '#fff',
                      fontSize: '13px',
                      color: isDarkMode ? '#d1d5db' : '#374151'
                    }}
                  >
                    {(account.description || account.is_system_account || account.sub_type) && (
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '12px 16px', alignItems: 'center' }}>
                        {account.description && (
                          <span><strong style={{ color: isDarkMode ? '#9ca3af' : '#6b7280', marginRight: '6px' }}>Description:</strong>{account.description}</span>
                        )}
                        {account.is_system_account && (
                          <span style={{
                            display: 'inline-block',
                            padding: '2px 8px',
                            borderRadius: '9999px',
                            fontSize: '12px',
                            fontWeight: 500,
                            backgroundColor: isDarkMode ? 'rgba(59,130,246,0.2)' : '#dbeafe',
                            color: '#2563eb'
                          }}>
                            System Account
                          </span>
                        )}
                        {account.sub_type && (
                          <span><strong style={{ color: isDarkMode ? '#9ca3af' : '#6b7280', marginRight: '6px' }}>Sub-type:</strong>{account.sub_type}</span>
                        )}
                      </div>
                    )}
                  </div>
                </td>
              </tr>
            )}
          </React.Fragment>
          ))}
        </tbody>
      </table>
    </div>
  )
}

export default AccountTable
