import React, { useState, useEffect } from 'react';
import { Plus } from 'lucide-react';
import { usePermissions } from '../contexts/PermissionContext';
import { useTheme } from '../contexts/ThemeContext';
import EmployeeForm from './EmployeeForm';
import PermissionManager from './PermissionManager';
import Table from './Table';

function AdminDashboard() {
  const { hasPermission } = usePermissions();
  const { themeColor, themeMode } = useTheme();
  
  // Convert hex to RGB for rgba usage
  const hexToRgb = (hex) => {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex)
    return result ? `${parseInt(result[1], 16)}, ${parseInt(result[2], 16)}, ${parseInt(result[3], 16)}` : '132, 0, 255'
  }
  
  const themeColorRgb = hexToRgb(themeColor)
  
  // Determine if dark mode is active
  const [isDarkMode, setIsDarkMode] = useState(() => {
    return document.documentElement.classList.contains('dark-theme')
  })
  
  useEffect(() => {
    const checkDarkMode = () => {
      setIsDarkMode(document.documentElement.classList.contains('dark-theme'))
    }
    
    checkDarkMode()
    
    const observer = new MutationObserver(checkDarkMode)
    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ['class']
    })
    
    return () => observer.disconnect()
  }, [themeMode])
  
  const [employees, setEmployees] = useState([]);
  const [roles, setRoles] = useState([]);
  const [schedules, setSchedules] = useState([]);
  const [employeesLoading, setEmployeesLoading] = useState(true);
  const [schedulesLoading, setSchedulesLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('employees');
  const [showEmployeeForm, setShowEmployeeForm] = useState(false);
  const [selectedEmployee, setSelectedEmployee] = useState(null);
  const [showPermissions, setShowPermissions] = useState(false);
  const [permissionEmployeeId, setPermissionEmployeeId] = useState(null);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);

  // Load employees and roles in parallel on mount; defer schedules until Schedules tab
  useEffect(() => {
    let cancelled = false;
    const run = async () => {
      setEmployeesLoading(true);
      try {
        const [empRes, rolesRes] = await Promise.all([
          fetch('/api/employees'),
          fetch('/api/roles')
        ]);
        if (cancelled) return;
        const empData = await empRes.json();
        const rolesData = await rolesRes.json();
        setEmployees(empData.data || []);
        setRoles(rolesData.roles || []);
      } catch (err) {
        if (!cancelled) setError('Failed to load employees');
      } finally {
        if (!cancelled) setEmployeesLoading(false);
      }
    };
    run();
    return () => { cancelled = true; };
  }, []);

  useEffect(() => {
    if (activeTab === 'schedules') {
      loadSchedules();
    }
  }, [activeTab]);

  const loadEmployees = async () => {
    setEmployeesLoading(true);
    try {
      const response = await fetch('/api/employees');
      const data = await response.json();
      setEmployees(data.data || []);
    } catch (err) {
      setError('Failed to load employees');
    } finally {
      setEmployeesLoading(false);
    }
  };

  const loadSchedules = async () => {
    setSchedulesLoading(true);
    setError(null);
    try {
      const today = new Date();
      const startDate = new Date(today);
      startDate.setDate(today.getDate() - 7);
      const endDate = new Date(today);
      endDate.setDate(today.getDate() + 14);
      const startDateStr = startDate.toISOString().split('T')[0];
      const endDateStr = endDate.toISOString().split('T')[0];
      const response = await fetch(`/api/employee_schedule?start_date=${startDateStr}&end_date=${endDateStr}`);
      const data = await response.json();
      setSchedules(data.data || []);
    } catch (err) {
      console.error('Failed to load schedules:', err);
      setError('Failed to load schedules');
    } finally {
      setSchedulesLoading(false);
    }
  };

  const formatTime = (timeStr) => {
    if (!timeStr) return '';
    const [hours, minutes] = timeStr.split(':');
    const hour = parseInt(hours);
    const ampm = hour >= 12 ? 'PM' : 'AM';
    const displayHour = hour % 12 || 12;
    return `${displayHour}:${minutes} ${ampm}`;
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return '';
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
  };

  const handleAddEmployee = () => {
    setSelectedEmployee(null);
    setShowEmployeeForm(true);
  };

  const handleEditEmployee = (employee) => {
    setSelectedEmployee(employee);
    setShowEmployeeForm(true);
  };

  const handleDeleteEmployee = async (employeeId) => {
    if (!window.confirm('Are you sure you want to deactivate this employee?')) {
      return;
    }

    try {
      const response = await fetch(`/api/admin/employees/${employeeId}`, {
        method: 'DELETE'
      });

      const data = await response.json();

      if (data.success) {
        setSuccess('Employee deactivated successfully');
        loadEmployees();
        setTimeout(() => setSuccess(null), 3000);
      } else {
        setError(data.error || 'Failed to deactivate employee');
      }
    } catch (err) {
      setError('Failed to deactivate employee');
    }
  };

  const handleManagePermissions = (employeeId) => {
    setPermissionEmployeeId(employeeId);
    setShowPermissions(true);
  };

  const handleEmployeeSaved = () => {
    setShowEmployeeForm(false);
    setSelectedEmployee(null);
    loadEmployees();
    setSuccess('Employee saved successfully');
    setTimeout(() => setSuccess(null), 3000);
  };

  const getRoleName = (roleId) => {
    const role = roles.find(r => r.role_id === roleId);
    return role ? role.role_name : 'No Role';
  };

  if (!hasPermission('manage_permissions') && !hasPermission('add_employee')) {
    return (
      <div style={{ padding: '40px', textAlign: 'center', color: isDarkMode ? 'var(--text-tertiary, #999)' : '#999' }}>
        You don't have permission to access the admin dashboard.
      </div>
    );
  }

  return (
    <div style={{ 
      padding: '0', 
      maxWidth: '100%',
      display: 'flex',
      flexDirection: 'column',
      height: '100%',
      overflow: 'hidden'
    }}>
      {/* Tabs and Add Employee inline (Inventory category tab + Create style) */}
      <div style={{ 
        display: 'flex', 
        flexWrap: 'nowrap',
        gap: '8px', 
        marginBottom: '20px', 
        alignItems: 'center',
        flexShrink: 0
      }}>
        <button
          onClick={() => setActiveTab('employees')}
          style={{
            padding: '4px 16px',
            height: '28px',
            display: 'flex',
            alignItems: 'center',
            whiteSpace: 'nowrap',
            backgroundColor: activeTab === 'employees' ? `rgba(${themeColorRgb}, 0.7)` : (isDarkMode ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.05)'),
            border: activeTab === 'employees' ? `1px solid rgba(${themeColorRgb}, 0.5)` : `1px solid ${isDarkMode ? 'var(--border-light, #333)' : '#ddd'}`,
            borderRadius: '8px',
            fontSize: '14px',
            fontWeight: activeTab === 'employees' ? 600 : 500,
            color: activeTab === 'employees' ? '#fff' : (isDarkMode ? 'var(--text-primary, #fff)' : '#333'),
            cursor: 'pointer',
            transition: 'all 0.3s ease',
            boxShadow: activeTab === 'employees' ? `0 4px 15px rgba(${themeColorRgb}, 0.3)` : 'none'
          }}
        >
          Employees
        </button>
        <button
          onClick={() => setActiveTab('schedules')}
          style={{
            padding: '4px 16px',
            height: '28px',
            display: 'flex',
            alignItems: 'center',
            whiteSpace: 'nowrap',
            backgroundColor: activeTab === 'schedules' ? `rgba(${themeColorRgb}, 0.7)` : (isDarkMode ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.05)'),
            border: activeTab === 'schedules' ? `1px solid rgba(${themeColorRgb}, 0.5)` : `1px solid ${isDarkMode ? 'var(--border-light, #333)' : '#ddd'}`,
            borderRadius: '8px',
            fontSize: '14px',
            fontWeight: activeTab === 'schedules' ? 600 : 500,
            color: activeTab === 'schedules' ? '#fff' : (isDarkMode ? 'var(--text-primary, #fff)' : '#333'),
            cursor: 'pointer',
            transition: 'all 0.3s ease',
            boxShadow: activeTab === 'schedules' ? `0 4px 15px rgba(${themeColorRgb}, 0.3)` : 'none'
          }}
        >
          All Schedules
        </button>
        {activeTab === 'schedules' && (
          <button
            onClick={loadSchedules}
            style={{
              padding: '4px 16px',
              height: '28px',
              display: 'flex',
              alignItems: 'center',
              whiteSpace: 'nowrap',
              backgroundColor: isDarkMode ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.05)',
              border: `1px solid ${isDarkMode ? 'var(--border-light, #333)' : '#ddd'}`,
              borderRadius: '8px',
              fontSize: '14px',
              fontWeight: 500,
              color: isDarkMode ? 'var(--text-primary, #fff)' : '#333',
              cursor: 'pointer',
              transition: 'all 0.3s ease'
            }}
          >
            Refresh
          </button>
        )}
        {hasPermission('add_employee') && (
          <button
            onClick={handleAddEmployee}
            style={{
              padding: '4px 16px',
              height: '28px',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              whiteSpace: 'nowrap',
              backgroundColor: isDarkMode ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.05)',
              border: `1px solid ${isDarkMode ? 'var(--border-light, #333)' : '#ddd'}`,
              borderRadius: '8px',
              fontSize: '14px',
              fontWeight: 500,
              color: isDarkMode ? 'var(--text-primary, #fff)' : '#333',
              cursor: 'pointer',
              transition: 'all 0.3s ease'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = isDarkMode ? 'rgba(255, 255, 255, 0.08)' : 'rgba(0, 0, 0, 0.08)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = isDarkMode ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.05)';
            }}
          >
            <Plus size={16} />
            Employee
          </button>
        )}
      </div>

      {error && (
        <div 
          onClick={() => setError(null)}
          style={{
            padding: '12px 16px',
            backgroundColor: isDarkMode ? 'rgba(198, 40, 40, 0.2)' : '#fee',
            border: isDarkMode ? '1px solid rgba(198, 40, 40, 0.4)' : '1px solid #fcc',
            borderRadius: '8px',
            color: isDarkMode ? '#ef5350' : '#c33',
            marginBottom: '16px',
            fontSize: '14px',
            cursor: 'pointer',
            flexShrink: 0
          }}
        >
          {error}
        </div>
      )}

      {success && (
        <div 
          onClick={() => setSuccess(null)}
          style={{
            padding: '12px 16px',
            backgroundColor: isDarkMode ? 'rgba(46, 125, 50, 0.2)' : '#efe',
            border: isDarkMode ? '1px solid rgba(46, 125, 50, 0.4)' : '1px solid #cfc',
            borderRadius: '8px',
            color: isDarkMode ? '#81c784' : '#3c3',
            marginBottom: '16px',
            fontSize: '14px',
            cursor: 'pointer',
            flexShrink: 0
          }}
        >
          {success}
        </div>
      )}

      {activeTab === 'employees' && (
        <div style={{ flex: 1, minHeight: 0, overflow: 'auto', marginTop: '4px' }}>
          <Table
            stickyHeader
            columns={['employee_id', 'name', 'username', 'email', 'position', 'role', 'status', 'actions']}
            data={employeesLoading ? [] : employees.map((emp) => ({
              ...emp,
              name: `${emp.first_name || ''} ${emp.last_name || ''}`.trim(),
              username: emp.username || emp.employee_code || 'N/A',
              email: emp.email || 'N/A',
              role: getRoleName(emp.role_id),
              status: emp.active ? 'Active' : 'Inactive'
            }))}
            getRowId={(row) => row.employee_id}
            actionsAsEllipsis
            themeColorRgb={themeColorRgb}
            ellipsisMenuItems={(row) => {
              const items = [];
              if (hasPermission('edit_employee')) {
                items.push({ label: 'Edit', onClick: () => handleEditEmployee(row) });
              }
              if (hasPermission('manage_permissions')) {
                items.push({ label: 'Permissions', onClick: () => handleManagePermissions(row.employee_id) });
              }
              if (hasPermission('delete_employee') && row.active) {
                items.push({
                  label: 'Deactivate',
                  onClick: () => handleDeleteEmployee(row.employee_id),
                  confirm: true,
                  confirmMessage: 'Are you sure you want to deactivate this employee?',
                  confirmButtonLabel: 'Deactivate',
                  confirmDanger: true
                });
              }
              return items;
            }}
          />
          {employeesLoading && (
            <div style={{
              textAlign: 'center',
              padding: '24px 16px',
              color: isDarkMode ? 'var(--text-tertiary, #999)' : '#999',
              fontSize: '14px'
            }}>
              Loading…
            </div>
          )}
        </div>
      )}

      {activeTab === 'schedules' && (
        <div style={{ flex: 1, minHeight: 0, overflow: 'auto' }}>
          <table style={{
            width: '100%',
            borderCollapse: 'collapse',
            backgroundColor: isDarkMode ? 'var(--bg-primary, #1a1a1a)' : '#fff',
            borderRadius: '8px',
            overflow: 'hidden'
          }}>
            <thead>
              <tr style={{ 
                backgroundColor: isDarkMode ? 'var(--bg-secondary, #2d2d2d)' : '#f5f5f5',
                borderBottom: isDarkMode ? '2px solid var(--border-color, #404040)' : '2px solid #ddd'
              }}>
                <th style={{
                  position: 'sticky',
                  top: 0,
                  zIndex: 1,
                  backgroundColor: isDarkMode ? 'var(--bg-secondary, #2d2d2d)' : '#f5f5f5', 
                  padding: '12px 16px', 
                  textAlign: 'left', 
                  fontWeight: 600,
                  fontSize: '14px',
                  color: isDarkMode ? 'var(--text-primary, #fff)' : '#333'
                }}>Employee</th>
                <th style={{ 
                  position: 'sticky', top: 0, zIndex: 1, backgroundColor: isDarkMode ? 'var(--bg-secondary, #2d2d2d)' : '#f5f5f5',
                  padding: '12px 16px', 
                  textAlign: 'left', 
                  fontWeight: 600,
                  fontSize: '14px',
                  color: isDarkMode ? 'var(--text-primary, #fff)' : '#333'
                }}>Date</th>
                <th style={{ 
                  position: 'sticky', top: 0, zIndex: 1, backgroundColor: isDarkMode ? 'var(--bg-secondary, #2d2d2d)' : '#f5f5f5',
                  padding: '12px 16px', 
                  textAlign: 'left', 
                  fontWeight: 600,
                  fontSize: '14px',
                  color: isDarkMode ? 'var(--text-primary, #fff)' : '#333'
                }}>Start Time</th>
                <th style={{ 
                  position: 'sticky', top: 0, zIndex: 1, backgroundColor: isDarkMode ? 'var(--bg-secondary, #2d2d2d)' : '#f5f5f5',
                  padding: '12px 16px', 
                  textAlign: 'left', 
                  fontWeight: 600,
                  fontSize: '14px',
                  color: isDarkMode ? 'var(--text-primary, #fff)' : '#333'
                }}>End Time</th>
                <th style={{ 
                  position: 'sticky', top: 0, zIndex: 1, backgroundColor: isDarkMode ? 'var(--bg-secondary, #2d2d2d)' : '#f5f5f5',
                  padding: '12px 16px', 
                  textAlign: 'left', 
                  fontWeight: 600,
                  fontSize: '14px',
                  color: isDarkMode ? 'var(--text-primary, #fff)' : '#333'
                }}>Hours</th>
                <th style={{ 
                  position: 'sticky', top: 0, zIndex: 1, backgroundColor: isDarkMode ? 'var(--bg-secondary, #2d2d2d)' : '#f5f5f5',
                  padding: '12px 16px', 
                  textAlign: 'left', 
                  fontWeight: 600,
                  fontSize: '14px',
                  color: isDarkMode ? 'var(--text-primary, #fff)' : '#333'
                }}>Notes</th>
              </tr>
            </thead>
            <tbody>
              {schedulesLoading ? (
                <tr>
                  <td colSpan="6" style={{ 
                    textAlign: 'center', 
                    padding: '40px 20px',
                    color: isDarkMode ? 'var(--text-tertiary, #999)' : '#999',
                    fontSize: '14px'
                  }}>
                    Loading…
                  </td>
                </tr>
              ) : schedules.length === 0 ? (
                <tr>
                  <td colSpan="6" style={{ 
                    textAlign: 'center', 
                    padding: '40px 20px',
                    color: isDarkMode ? 'var(--text-tertiary, #999)' : '#999',
                    fontSize: '14px'
                  }}>
                    No schedules found
                  </td>
                </tr>
              ) : (
                schedules.map((schedule, index) => {
                  const startTime = schedule.start_time ? formatTime(schedule.start_time) : '';
                  const endTime = schedule.end_time ? formatTime(schedule.end_time) : '';
                  const scheduleDate = schedule.schedule_date || schedule.shift_date;
                  const dateStr = formatDate(scheduleDate);
                  
                  // Calculate hours
                  let hours = '';
                  if (schedule.start_time && schedule.end_time) {
                    const [startH, startM] = schedule.start_time.split(':').map(Number);
                    const [endH, endM] = schedule.end_time.split(':').map(Number);
                    const startMinutes = startH * 60 + startM;
                    const endMinutes = endH * 60 + endM;
                    const breakMinutes = (schedule.break_duration || 0) * 60;
                    const totalMinutes = endMinutes - startMinutes - breakMinutes;
                    const totalHours = (totalMinutes / 60).toFixed(2);
                    hours = `${totalHours} hrs`;
                  }
                  
                  return (
                    <tr 
                      key={schedule.schedule_id || schedule.scheduled_shift_id || index}
                      style={{
                        borderBottom: isDarkMode ? '1px solid var(--border-color, #404040)' : '1px solid #eee',
                        transition: 'background-color 0.2s'
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.backgroundColor = isDarkMode ? 'var(--bg-secondary, #2d2d2d)' : '#f9f9f9'
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.backgroundColor = 'transparent'
                      }}
                    >
                      <td style={{ 
                        padding: '12px 16px',
                        color: isDarkMode ? 'var(--text-primary, #fff)' : '#333',
                        fontSize: '14px'
                      }}>{schedule.employee_name || 'N/A'}</td>
                      <td style={{ 
                        padding: '12px 16px',
                        color: isDarkMode ? 'var(--text-primary, #fff)' : '#333',
                        fontSize: '14px'
                      }}>{dateStr}</td>
                      <td style={{ 
                        padding: '12px 16px',
                        color: isDarkMode ? 'var(--text-primary, #fff)' : '#333',
                        fontSize: '14px'
                      }}>{startTime}</td>
                      <td style={{ 
                        padding: '12px 16px',
                        color: isDarkMode ? 'var(--text-primary, #fff)' : '#333',
                        fontSize: '14px'
                      }}>{endTime}</td>
                      <td style={{ 
                        padding: '12px 16px',
                        color: isDarkMode ? 'var(--text-primary, #fff)' : '#333',
                        fontSize: '14px'
                      }}>{hours}</td>
                      <td style={{ 
                        maxWidth: '200px', 
                        overflow: 'hidden', 
                        textOverflow: 'ellipsis', 
                        whiteSpace: 'nowrap',
                        padding: '12px 16px',
                        color: isDarkMode ? 'var(--text-primary, #fff)' : '#333',
                        fontSize: '14px'
                      }}>
                        {schedule.notes || ''}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      )}

      {showEmployeeForm && (
        <EmployeeForm
          employee={selectedEmployee}
          roles={roles}
          onSave={handleEmployeeSaved}
          onCancel={() => {
            setShowEmployeeForm(false);
            setSelectedEmployee(null);
          }}
        />
      )}

      {showPermissions && permissionEmployeeId && (
        <PermissionManager
          employeeId={permissionEmployeeId}
          onClose={() => {
            setShowPermissions(false);
            setPermissionEmployeeId(null);
          }}
        />
      )}

    </div>
  );
}

export default AdminDashboard;



