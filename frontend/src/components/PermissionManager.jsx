import { useState, useEffect } from 'react'
import { usePermissions } from '../contexts/PermissionContext'
import { useTheme } from '../contexts/ThemeContext'
import {
  formModalStyle,
  compactPrimaryButtonStyle,
  compactCancelButtonStyle
} from './FormStyles'

function hexToRgb(hex) {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex)
  return result ? `${parseInt(result[1], 16)}, ${parseInt(result[2], 16)}, ${parseInt(result[3], 16)}` : '132, 0, 255'
}

function PermissionManager({ employeeId, onClose }) {
  const { hasPermission, employee: currentEmployee } = usePermissions()
  const { themeColor } = useTheme()
  const themeColorRgb = hexToRgb(themeColor || '#8400ff')
  const [isDarkMode, setIsDarkMode] = useState(() => document.documentElement.classList.contains('dark-theme'))
  useEffect(() => {
    const check = () => setIsDarkMode(document.documentElement.classList.contains('dark-theme'))
    const obs = new MutationObserver(check)
    obs.observe(document.documentElement, { attributes: true, attributeFilter: ['class'] })
    return () => obs.disconnect()
  }, [])
  const [employee, setEmployee] = useState(null)
  const [permissions, setPermissions] = useState({})
  const [allPermissions, setAllPermissions] = useState([])
  const [roles, setRoles] = useState([])
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (employeeId) {
      loadEmployeeData()
      loadAllPermissions()
      loadRoles()
    }
  }, [employeeId])

  const loadEmployeeData = async () => {
    setLoading(true)
    try {
      const response = await fetch(`/api/employees/${employeeId}/permissions`)
      const data = await response.json()
      if (data.success) {
        setPermissions(data.permissions || {})
      }
    } catch (err) {
      console.error('Error loading employee permissions:', err)
    } finally {
      setLoading(false)
    }
  }

  const loadAllPermissions = async () => {
    try {
      const response = await fetch('/api/permissions')
      const data = await response.json()
      if (data.success) {
        setAllPermissions(data.permissions || [])
      }
    } catch (err) {
      console.error('Error loading permissions:', err)
    }
  }

  const loadRoles = async () => {
    try {
      const response = await fetch('/api/roles')
      const data = await response.json()
      if (data.success) {
        setRoles(data.roles || [])
      }
    } catch (err) {
      console.error('Error loading roles:', err)
    }
  }

  const loadEmployeeInfo = async () => {
    try {
      const response = await fetch(`/api/admin/employees/${employeeId}`)
      const data = await response.json()
      if (data.success) {
        setEmployee(data.employee)
      }
    } catch (err) {
      console.error('Error loading employee info:', err)
    }
  }

  useEffect(() => {
    if (employeeId) {
      loadEmployeeInfo()
    }
  }, [employeeId])

  const grantPermission = async (permissionName) => {
    const reason = prompt('Reason for granting this permission:')
    if (!reason) return

    try {
      const response = await fetch(`/api/employees/${employeeId}/permissions/grant`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          permission_name: permissionName,
          granted_by: currentEmployee?.id || 1, // Get from current user context
          reason: reason
        })
      })
      const data = await response.json()
      if (data.success) {
        loadEmployeeData()
      }
    } catch (err) {
      console.error('Error granting permission:', err)
    }
  }

  const revokePermission = async (permissionName) => {
    const reason = prompt('Reason for revoking this permission:')
    if (!reason) return

    try {
      const response = await fetch(`/api/employees/${employeeId}/permissions/revoke`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          permission_name: permissionName,
          revoked_by: currentEmployee?.id || 1, // Get from current user context
          reason: reason
        })
      })
      const data = await response.json()
      if (data.success) {
        loadEmployeeData()
      }
    } catch (err) {
      console.error('Error revoking permission:', err)
    }
  }

  const assignRole = async (roleId) => {
    try {
      const response = await fetch(`/api/employees/${employeeId}/assign_role`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ role_id: roleId })
      })
      const data = await response.json()
      if (data.success) {
        loadEmployeeData()
      }
    } catch (err) {
      console.error('Error assigning role:', err)
    }
  }

  // Group permissions by category
  const permissionsByCategory = {}
  allPermissions.forEach(perm => {
    const category = perm.permission_category || 'other'
    if (!permissionsByCategory[category]) {
      permissionsByCategory[category] = []
    }
    permissionsByCategory[category].push(perm)
  })

  // Get current permissions as a set for quick lookup
  const currentPermissionNames = new Set()
  Object.values(permissions).forEach(categoryPerms => {
    categoryPerms.forEach(perm => currentPermissionNames.add(perm.name))
  })

  const sectionTitleStyle = {
    fontSize: '14px',
    fontWeight: 600,
    marginBottom: '12px',
    color: isDarkMode ? 'var(--text-primary, #fff)' : '#333'
  }
  const categoryTitleStyle = {
    textTransform: 'capitalize',
    marginBottom: '8px',
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
          maxWidth: '900px',
          width: '95%',
          maxHeight: '90vh',
          display: 'flex',
          flexDirection: 'column',
          padding: '24px 24px 0 24px'
        }}
      >
        <h2 style={{
          margin: '0 0 0 0',
          fontSize: '14px',
          fontWeight: 600,
          color: isDarkMode ? 'var(--text-primary, #fff)' : '#333',
          flexShrink: 0
        }}>
          Manage Permissions
          {employee && ` – ${employee.first_name} ${employee.last_name}`}
        </h2>
        <div
          style={{
            height: '20px',
            flexShrink: 0,
            background: `linear-gradient(to bottom, ${isDarkMode ? 'var(--bg-secondary, #2d2d2d)' : '#fff'}, transparent)`,
            pointerEvents: 'none'
          }}
        />

        <div className="form-modal-scroll-hide-bar" style={{ flex: 1, minHeight: 0, overflowY: 'auto', paddingRight: '4px' }}>
          {loading && (
            <div style={{ color: isDarkMode ? 'var(--text-secondary, #999)' : '#666', fontSize: '14px' }}>
              Loading...
            </div>
          )}

          {!loading && (
            <>
              {/* Current Permissions */}
              <div style={{ marginBottom: '24px' }}>
                <h3 style={sectionTitleStyle}>Current Permissions</h3>
                {Object.entries(permissions).map(([category, perms]) => (
                  <div key={category} style={{ marginBottom: '16px' }}>
                    <h4 style={categoryTitleStyle}>{category}</h4>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                      {perms.map(perm => (
                        <div
                          key={perm.name}
                          style={{
                            padding: '8px 12px',
                            backgroundColor: isDarkMode ? 'rgba(46, 125, 50, 0.2)' : '#e8f5e9',
                            border: isDarkMode ? '1px solid rgba(46, 125, 50, 0.3)' : '1px solid #c8e6c9',
                            borderRadius: '8px',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '8px'
                          }}
                        >
                          <span style={{ fontSize: '13px', color: isDarkMode ? '#81c784' : '#2e7d32' }}>
                            {perm.description || perm.name}
                          </span>
                          <button
                            type="button"
                            onClick={() => revokePermission(perm.name)}
                            style={{
                              padding: '4px 10px',
                              height: '26px',
                              backgroundColor: isDarkMode ? 'rgba(198, 40, 40, 0.3)' : '#ffebee',
                              color: isDarkMode ? '#ef5350' : '#c62828',
                              border: isDarkMode ? '1px solid rgba(198, 40, 40, 0.5)' : '1px solid #ef5350',
                              borderRadius: '8px',
                              cursor: 'pointer',
                              fontSize: '12px',
                              fontWeight: 500
                            }}
                          >
                            Revoke
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>

              {/* Grant Additional Permissions */}
              <div style={{ marginBottom: '24px' }}>
                <h3 style={sectionTitleStyle}>Available Permissions</h3>
                {Object.entries(permissionsByCategory).map(([category, perms]) => (
                  <div key={category} style={{ marginBottom: '16px' }}>
                    <h4 style={categoryTitleStyle}>{category}</h4>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                      {perms.map(perm => {
                        const hasPerm = currentPermissionNames.has(perm.permission_name)
                        return (
                          <div
                            key={perm.permission_id}
                            style={{
                              padding: '8px 12px',
                              backgroundColor: hasPerm
                                ? (isDarkMode ? 'rgba(46, 125, 50, 0.2)' : '#e8f5e9')
                                : (isDarkMode ? 'var(--bg-tertiary, #2d2d2d)' : '#fff'),
                              border: hasPerm
                                ? (isDarkMode ? '1px solid rgba(46, 125, 50, 0.3)' : '1px solid #c8e6c9')
                                : (isDarkMode ? '1px solid var(--border-color, #404040)' : '1px solid #ddd'),
                              borderRadius: '8px',
                              display: 'flex',
                              alignItems: 'center',
                              gap: '8px'
                            }}
                          >
                            <span style={{ fontSize: '13px', color: isDarkMode ? 'var(--text-primary, #fff)' : '#333' }}>
                              {perm.description || perm.permission_name}
                            </span>
                            {!hasPerm && (
                              <button
                                type="button"
                                onClick={() => grantPermission(perm.permission_name)}
                                style={compactPrimaryButtonStyle(themeColorRgb)}
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

              {/* Assign Role */}
              <div style={{ marginTop: '24px', paddingTop: '20px', borderTop: isDarkMode ? '1px solid var(--border-light, #333)' : '1px solid #eee' }}>
                <h3 style={sectionTitleStyle}>Assign Role</h3>
                <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                  {roles.map(role => (
                    <button
                      key={role.role_id}
                      type="button"
                      onClick={() => assignRole(role.role_id)}
                      style={compactPrimaryButtonStyle(themeColorRgb)}
                    >
                      {role.role_name}
                    </button>
                  ))}
                </div>
              </div>
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

