import { useState, useEffect } from 'react'
import { usePermissions } from '../contexts/PermissionContext'
import { useTheme } from '../contexts/ThemeContext'
import { useToast } from '../contexts/ToastContext'
import {
  formModalStyle,
  compactPrimaryButtonStyle,
  compactCancelButtonStyle
} from './FormStyles'

function hexToRgb(hex) {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex)
  return result ? `${parseInt(result[1], 16)}, ${parseInt(result[2], 16)}, ${parseInt(result[3], 16)}` : '132, 0, 255'
}

// Map permissions to pages and actions. Admin has all; Employee base is customizable.
const PAGE_PERMISSIONS = [
  {
    page: 'POS',
    label: 'POS',
    description: 'Point of Sale - process sales, returns, discounts',
    permissions: [
      { name: 'process_sale', label: 'Process sale' },
      { name: 'process_return', label: 'Process return' },
      { name: 'apply_discount', label: 'Apply discount' },
      { name: 'void_transaction', label: 'Void transaction' },
      { name: 'view_sales', label: 'View sales' },
      { name: 'edit_sale', label: 'Edit sale' }
    ]
  },
  {
    page: 'Inventory',
    label: 'Inventory',
    description: 'Manage products and stock',
    permissions: [
      { name: 'view_inventory', label: 'View inventory' },
      { name: 'add_product', label: 'Add product' },
      { name: 'edit_product', label: 'Edit product' },
      { name: 'delete_product', label: 'Delete product' },
      { name: 'adjust_inventory', label: 'Adjust inventory' },
      { name: 'receive_shipment', label: 'Receive shipment' },
      { name: 'transfer_inventory', label: 'Transfer inventory' }
    ]
  },
  {
    page: 'Shipment Verification',
    label: 'Shipment Verification',
    description: 'Verify incoming shipments',
    permissions: [
      { name: 'receive_shipment', label: 'Receive & verify shipments' }
    ]
  },
  {
    page: 'Customers',
    label: 'Customers',
    description: 'Manage customer database',
    permissions: [
      { name: 'manage_customers', label: 'Manage customers' }
    ]
  },
  {
    page: 'Reports',
    label: 'Reports & Statistics',
    description: 'View sales, inventory, and financial reports',
    permissions: [
      { name: 'view_sales_reports', label: 'View sales reports' },
      { name: 'view_inventory_reports', label: 'View inventory reports' },
      { name: 'view_employee_reports', label: 'View employee reports' },
      { name: 'view_financial_reports', label: 'View financial reports (Accounting)' },
      { name: 'export_reports', label: 'Export reports' }
    ]
  },
  {
    page: 'Employee Management',
    label: 'Employee Management (Admin tab)',
    description: 'Manage employees, roles, and permissions',
    permissions: [
      { name: 'view_employees', label: 'View employees' },
      { name: 'add_employee', label: 'Add employee' },
      { name: 'edit_employee', label: 'Edit employee' },
      { name: 'delete_employee', label: 'Delete employee' },
      { name: 'manage_permissions', label: 'Manage permissions' },
      { name: 'view_activity_log', label: 'View activity log' }
    ]
  },
  {
    page: 'Settings',
    label: 'Settings',
    description: 'System and store settings',
    permissions: [
      { name: 'modify_settings', label: 'Modify settings' },
      { name: 'manage_vendors', label: 'Manage vendors' },
      { name: 'backup_database', label: 'Backup database' },
      { name: 'view_audit_logs', label: 'View audit logs' }
    ]
  }
]

function PermissionManager({ employeeId, onClose }) {
  const { employee: currentEmployee } = usePermissions()
  const { themeColor } = useTheme()
  const { show: showToast } = useToast()
  const themeColorRgb = hexToRgb(themeColor || '#8400ff')
  const [isDarkMode, setIsDarkMode] = useState(() => document.documentElement.classList.contains('dark-theme'))

  useEffect(() => {
    const check = () => setIsDarkMode(document.documentElement.classList.contains('dark-theme'))
    const obs = new MutationObserver(check)
    obs.observe(document.documentElement, { attributes: true, attributeFilter: ['class'] })
    return () => obs.disconnect()
  }, [])

  const [employee, setEmployee] = useState(null)
  const [currentPermissions, setCurrentPermissions] = useState({})
  const [employeeRoleId, setEmployeeRoleId] = useState(null)
  const [rolePermissions, setRolePermissions] = useState({})
  const [roles, setRoles] = useState([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  const adminRole = roles.find(r => (r.role_name || '').toLowerCase() === 'admin')
  const employeeRole = roles.find(r => (r.role_name || '').toLowerCase() === 'employee')
  const isAdmin = employeeRoleId != null && adminRole && Number(employeeRoleId) === Number(adminRole.role_id)
  // Any non-Admin role (Employee, Manager, Cashier, etc.) can be customized
  const isNonAdmin = employeeRoleId != null && !isAdmin

  const hasPermission = (permName) => {
    for (const cat of Object.values(currentPermissions)) {
      if (Array.isArray(cat) && cat.some(p => (p.name || p.permission_name) === permName)) return true
    }
    return false
  }

  const isBaseEmployeePermission = (permName) => {
    return (rolePermissions[permName] || false)
  }

  useEffect(() => {
    if (employeeId) {
      loadAll()
    }
  }, [employeeId])

  const loadAll = async () => {
    setLoading(true)
    try {
      const [empRes, rolesRes, permRes] = await Promise.all([
        fetch(`/api/admin/employees/${employeeId}`),
        fetch('/api/roles'),
        fetch(`/api/employees/${employeeId}/permissions`)
      ])
      const empData = await empRes.json()
      const rolesData = await rolesRes.json()
      const permData = await permRes.json()

      const emp = empData.success ? empData.employee : null
      const rl = rolesData.success ? (rolesData.roles || []) : []
      const roleId = emp?.role_id ?? null

      setEmployee(emp)
      setEmployeeRoleId(roleId)
      setRoles(rl)
      if (permData.success) setCurrentPermissions(permData.permissions || {})

      // Load base permissions for this employee's role (Employee, Manager, Cashier, etc.)
      if (roleId) {
        const rpRes = await fetch(`/api/roles/${roleId}/permissions`)
        const rpData = await rpRes.json()
        if (rpData.success && rpData.permissions) {
          const byName = {}
          rpData.permissions.forEach(p => { byName[p.permission_name] = true })
          setRolePermissions(byName)
        }
      } else {
        setRolePermissions({})
      }
    } catch (err) {
      console.error('Error loading:', err)
    } finally {
      setLoading(false)
    }
  }

  const assignRole = async (roleId) => {
    setSaving(true)
    try {
      const token = typeof localStorage !== 'undefined' ? localStorage.getItem('sessionToken') : null
      const headers = { 'Content-Type': 'application/json' }
      if (token) {
        headers['X-Session-Token'] = token
        headers['Authorization'] = `Bearer ${token}`
      }
      const response = await fetch(`/api/employees/${employeeId}/assign_role`, {
        method: 'POST',
        headers,
        body: JSON.stringify({ role_id: roleId })
      })
      const data = await response.json()
      if (data.success) {
        await loadAll()
        showToast('Role updated', 'success')
      } else {
        showToast(data.error || 'Failed to assign role', 'error')
      }
    } catch (err) {
      showToast('Failed to assign role', 'error')
    } finally {
      setSaving(false)
    }
  }

  const grantPermission = async (permissionName) => {
    setSaving(true)
    try {
      const token = typeof localStorage !== 'undefined' ? localStorage.getItem('sessionToken') : null
      const headers = { 'Content-Type': 'application/json' }
      if (token) {
        headers['X-Session-Token'] = token
        headers['Authorization'] = `Bearer ${token}`
      }
      const response = await fetch(`/api/employees/${employeeId}/permissions/grant`, {
        method: 'POST',
        headers,
        body: JSON.stringify({ permission_name: permissionName, reason: 'Custom permission grant' })
      })
      const data = await response.json()
      if (data.success) {
        await loadAll()
        showToast('Permission granted', 'success')
      } else {
        showToast(data.error || 'Failed to grant permission', 'error')
      }
    } catch (err) {
      showToast('Failed to grant permission', 'error')
    } finally {
      setSaving(false)
    }
  }

  const revokePermission = async (permissionName) => {
    setSaving(true)
    try {
      const token = typeof localStorage !== 'undefined' ? localStorage.getItem('sessionToken') : null
      const headers = { 'Content-Type': 'application/json' }
      if (token) {
        headers['X-Session-Token'] = token
        headers['Authorization'] = `Bearer ${token}`
      }
      const response = await fetch(`/api/employees/${employeeId}/permissions/revoke`, {
        method: 'POST',
        headers,
        body: JSON.stringify({ permission_name: permissionName, reason: 'Custom permission revoke' })
      })
      const data = await response.json()
      if (data.success) {
        await loadAll()
        showToast('Permission revoked', 'success')
      } else {
        showToast(data.error || 'Failed to revoke permission', 'error')
      }
    } catch (err) {
      showToast('Failed to revoke permission', 'error')
    } finally {
      setSaving(false)
    }
  }

  const sectionTitleStyle = {
    fontSize: '14px',
    fontWeight: 600,
    marginBottom: '8px',
    color: isDarkMode ? 'var(--text-primary, #fff)' : '#333'
  }
  const categoryTitleStyle = {
    marginBottom: '6px',
    fontSize: '13px',
    fontWeight: 500,
    color: isDarkMode ? 'var(--text-secondary, #999)' : '#666'
  }

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          ...formModalStyle(isDarkMode),
          maxWidth: '920px',
          width: '95%',
          maxHeight: '90vh',
          display: 'flex',
          flexDirection: 'column',
          padding: '24px 24px 0 24px'
        }}
      >
        <h2 style={{
          margin: '0 0 4px 0',
          fontSize: '16px',
          fontWeight: 600,
          color: isDarkMode ? 'var(--text-primary, #fff)' : '#333',
          flexShrink: 0
        }}>
          Manage Permissions
          {employee && ` – ${employee.first_name || ''} ${employee.last_name || ''}`.trim()}
        </h2>
        <p style={{
          margin: '0 0 16px 0',
          fontSize: '13px',
          color: isDarkMode ? 'var(--text-secondary, #999)' : '#666'
        }}>
          Two roles: <strong>Admin</strong> (full access) and <strong>Employee</strong> (customizable). For employees, add or remove permissions below.
        </p>

        <div className="form-modal-scroll-hide-bar" style={{ flex: 1, minHeight: 0, overflowY: 'auto', paddingRight: '4px' }}>
          {loading && (
            <div style={{ color: isDarkMode ? 'var(--text-secondary, #999)' : '#666', fontSize: '14px', padding: '24px 0' }}>
              Loading...
            </div>
          )}

          {!loading && (
            <>
              {/* Role selection */}
              <div style={{ marginBottom: '24px' }}>
                <h3 style={sectionTitleStyle}>Role</h3>
                <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
                  {adminRole && (
                    <button
                      type="button"
                      onClick={() => assignRole(adminRole.role_id)}
                      disabled={saving}
                      style={{
                        padding: '10px 18px',
                        borderRadius: '8px',
                        border: `2px solid ${isAdmin ? `rgba(${themeColorRgb}, 0.8)` : (isDarkMode ? '#444' : '#ddd')}`,
                        backgroundColor: isAdmin ? `rgba(${themeColorRgb}, 0.2)` : (isDarkMode ? 'rgba(255,255,255,0.05)' : '#f5f5f5'),
                        color: isAdmin ? '#fff' : (isDarkMode ? '#ccc' : '#333'),
                        fontWeight: isAdmin ? 600 : 500,
                        cursor: saving ? 'not-allowed' : 'pointer',
                        fontSize: '14px'
                      }}
                    >
                      Admin – Full access
                    </button>
                  )}
                  {employeeRole && (
                    <button
                      type="button"
                      onClick={() => assignRole(employeeRole.role_id)}
                      disabled={saving}
                      style={{
                        padding: '10px 18px',
                        borderRadius: '8px',
                        border: `2px solid ${isNonAdmin ? `rgba(${themeColorRgb}, 0.8)` : (isDarkMode ? '#444' : '#ddd')}`,
                        backgroundColor: isNonAdmin ? `rgba(${themeColorRgb}, 0.2)` : (isDarkMode ? 'rgba(255,255,255,0.05)' : '#f5f5f5'),
                        color: isNonAdmin ? '#fff' : (isDarkMode ? '#ccc' : '#333'),
                        fontWeight: isNonAdmin ? 600 : 500,
                        cursor: saving ? 'not-allowed' : 'pointer',
                        fontSize: '14px'
                      }}
                    >
                      Employee – Customizable
                    </button>
                  )}
                </div>
              </div>

              {isAdmin && (
                <div style={{
                  padding: '16px',
                  borderRadius: '8px',
                  backgroundColor: isDarkMode ? 'rgba(46, 125, 50, 0.15)' : '#e8f5e9',
                  border: isDarkMode ? '1px solid rgba(46, 125, 50, 0.3)' : '1px solid #c8e6c9',
                  color: isDarkMode ? '#81c784' : '#2e7d32',
                  fontSize: '14px'
                }}>
                  Admin has full access to all pages, tabs, and actions. No customization needed.
                </div>
              )}

              {isNonAdmin && (
                <div style={{ marginTop: '16px' }}>
                  <h3 style={sectionTitleStyle}>Customize Employee Permissions</h3>
                  <p style={{ ...categoryTitleStyle, marginBottom: '16px' }}>
                    Base Employee permissions are pre-selected. Add or remove as needed.
                  </p>
                  {PAGE_PERMISSIONS.map(({ page, label, description, permissions }) => (
                    <div key={page} style={{
                      marginBottom: '20px',
                      padding: '14px',
                      borderRadius: '8px',
                      border: isDarkMode ? '1px solid var(--border-color, #404)' : '1px solid #eee',
                      backgroundColor: isDarkMode ? 'rgba(0,0,0,0.2)' : '#fafafa'
                    }}>
                      <div style={{ fontWeight: 600, fontSize: '13px', marginBottom: '4px', color: isDarkMode ? '#fff' : '#333' }}>
                        {label}
                      </div>
                      <div style={{ fontSize: '12px', color: isDarkMode ? '#999' : '#666', marginBottom: '10px' }}>
                        {description}
                      </div>
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                        {permissions.map(({ name, label: permLabel }) => {
                          const hasIt = hasPermission(name)
                          const fromBase = isBaseEmployeePermission(name)
                          return (
                            <div
                              key={name}
                              style={{
                                padding: '6px 12px',
                                borderRadius: '6px',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '8px',
                                backgroundColor: hasIt
                                  ? (isDarkMode ? 'rgba(46, 125, 50, 0.25)' : '#e8f5e9')
                                  : (isDarkMode ? 'rgba(0,0,0,0.3)' : '#fff'),
                                border: hasIt
                                  ? (isDarkMode ? '1px solid rgba(46, 125, 50, 0.4)' : '1px solid #c8e6c9')
                                  : (isDarkMode ? '1px solid #444' : '1px solid #ddd')
                              }}
                            >
                              <span style={{ fontSize: '13px', color: isDarkMode ? 'var(--text-primary)' : '#333' }}>
                                {permLabel}
                                {fromBase && hasIt && <span style={{ fontSize: '11px', opacity: 0.8, marginLeft: 4 }}>(base)</span>}
                              </span>
                              {hasIt ? (
                                <button
                                  type="button"
                                  onClick={() => revokePermission(name)}
                                  disabled={saving}
                                  style={{
                                    padding: '4px 10px',
                                    height: '24px',
                                    backgroundColor: isDarkMode ? 'rgba(198, 40, 40, 0.3)' : '#ffebee',
                                    color: isDarkMode ? '#ef5350' : '#c62828',
                                    border: isDarkMode ? '1px solid rgba(198, 40, 40, 0.5)' : '1px solid #ef9a9a',
                                    borderRadius: '6px',
                                    cursor: saving ? 'not-allowed' : 'pointer',
                                    fontSize: '11px',
                                    fontWeight: 500
                                  }}
                                >
                                  Revoke
                                </button>
                              ) : (
                                <button
                                  type="button"
                                  onClick={() => grantPermission(name)}
                                  disabled={saving}
                                  style={{
                                    ...compactPrimaryButtonStyle(themeColorRgb),
                                    padding: '4px 10px',
                                    height: '24px',
                                    fontSize: '11px'
                                  }}
                                >
                                  Grant
                                </button>
                              )}
                            </div>
                          )
                        })}
                      </div>
                    </div>
                  ))}
                </div>
              )}

            </>
          )}
        </div>

        <div style={{ flexShrink: 0 }}>
          <div
            style={{
              height: '24px',
              background: `linear-gradient(to bottom, transparent, ${isDarkMode ? 'var(--bg-secondary, #2d2d2d)' : '#fff'})`,
              pointerEvents: 'none'
            }}
          />
          <div style={{
            display: 'flex',
            justifyContent: 'flex-end',
            gap: '8px',
            padding: '8px 0 24px 0'
          }}>
            <button
              type="button"
              onClick={onClose}
              style={compactCancelButtonStyle(isDarkMode)}
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

export default PermissionManager
