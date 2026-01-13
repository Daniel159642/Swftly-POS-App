import React, { useState, useEffect } from 'react';
import { usePermissions } from '../contexts/PermissionContext';
import EmployeeForm from './EmployeeForm';
import PermissionManager from './PermissionManager';

function AdminDashboard() {
  const { hasPermission } = usePermissions();
  const [employees, setEmployees] = useState([]);
  const [roles, setRoles] = useState([]);
  const [schedules, setSchedules] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('employees');
  const [showEmployeeForm, setShowEmployeeForm] = useState(false);
  const [selectedEmployee, setSelectedEmployee] = useState(null);
  const [showPermissions, setShowPermissions] = useState(false);
  const [permissionEmployeeId, setPermissionEmployeeId] = useState(null);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [showDisplaySettings, setShowDisplaySettings] = useState(false);
  const [displaySettings, setDisplaySettings] = useState({
    tip_enabled: false,
    tip_after_payment: false,
    tip_suggestions: [15, 18, 20, 25]
  });

  useEffect(() => {
    loadEmployees();
    loadRoles();
    loadDisplaySettings();
    loadSchedules();
  }, []);

  useEffect(() => {
    if (activeTab === 'schedules') {
      loadSchedules();
    }
  }, [activeTab]);

  const loadDisplaySettings = async () => {
    try {
      const response = await fetch('/api/customer-display/settings');
      const data = await response.json();
      if (data.success) {
        setDisplaySettings({
          tip_enabled: data.data.tip_enabled === 1 || data.data.tip_enabled === true,
          tip_after_payment: data.data.tip_after_payment === 1 || data.data.tip_after_payment === true,
          tip_suggestions: data.data.tip_suggestions || [15, 18, 20, 25]
        });
      }
    } catch (err) {
      console.error('Failed to load display settings:', err);
    }
  };

  const saveDisplaySettings = async () => {
    try {
      const sessionToken = localStorage.getItem('sessionToken');
      const response = await fetch('/api/customer-display/settings', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${sessionToken}`
        },
        body: JSON.stringify({
          tip_enabled: displaySettings.tip_enabled ? 1 : 0,
          tip_after_payment: displaySettings.tip_after_payment ? 1 : 0,
          tip_suggestions: displaySettings.tip_suggestions
        })
      });

      const data = await response.json();
      if (data.success) {
        setSuccess('Display settings saved successfully');
        setShowDisplaySettings(false);
        setTimeout(() => setSuccess(null), 3000);
      } else {
        setError(data.message || 'Failed to save display settings');
      }
    } catch (err) {
      setError('Failed to save display settings');
    }
  };

  const loadEmployees = async () => {
    try {
      const response = await fetch('/api/employees');
      const data = await response.json();
      setEmployees(data.data || []);
    } catch (err) {
      setError('Failed to load employees');
    } finally {
      setLoading(false);
    }
  };

  const loadRoles = async () => {
    try {
      const response = await fetch('/api/roles');
      const data = await response.json();
      setRoles(data.roles || []);
    } catch (err) {
      console.error('Failed to load roles:', err);
    }
  };

  const loadSchedules = async () => {
    try {
      // Calculate date range (current week + 2 weeks ahead)
      const today = new Date();
      const startDate = new Date(today);
      startDate.setDate(today.getDate() - 7); // Start from a week ago
      const endDate = new Date(today);
      endDate.setDate(today.getDate() + 14); // 2 weeks ahead

      const startDateStr = startDate.toISOString().split('T')[0];
      const endDateStr = endDate.toISOString().split('T')[0];

      const response = await fetch(`/api/employee_schedule?start_date=${startDateStr}&end_date=${endDateStr}`);
      const data = await response.json();
      setSchedules(data.data || []);
    } catch (err) {
      console.error('Failed to load schedules:', err);
      setError('Failed to load schedules');
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
      <div className="admin-dashboard">
        <div className="error-message">
          You don't have permission to access the admin dashboard.
        </div>
      </div>
    );
  }

  if (loading) {
    return <div className="admin-dashboard">Loading...</div>;
  }

  return (
    <div className="admin-dashboard" style={{ padding: '0', maxWidth: '100%' }}>
      <div className="admin-header" style={{ marginBottom: '20px' }}>
        <h1 style={{ fontSize: '24px', margin: 0 }}>Admin Dashboard</h1>
        <div style={{ display: 'flex', gap: '10px' }}>
          <button 
            className="btn btn-secondary" 
            onClick={() => setShowDisplaySettings(!showDisplaySettings)}
          >
            {showDisplaySettings ? 'Hide' : 'Show'} Display Settings
          </button>
          {activeTab === 'employees' && hasPermission('add_employee') && (
            <button className="btn btn-primary" onClick={handleAddEmployee}>
              Add Employee
            </button>
          )}
          {activeTab === 'schedules' && (
            <button className="btn btn-secondary" onClick={loadSchedules}>
              Refresh
            </button>
          )}
        </div>
      </div>

      {error && (
        <div className="alert alert-error" onClick={() => setError(null)}>
          {error}
        </div>
      )}

      {success && (
        <div className="alert alert-success" onClick={() => setSuccess(null)}>
          {success}
        </div>
      )}

      {/* Tabs */}
      <div style={{ display: 'flex', gap: '10px', marginBottom: '20px', borderBottom: '1px solid #ddd', paddingBottom: '10px' }}>
        <button
          onClick={() => setActiveTab('employees')}
          style={{
            padding: '8px 16px',
            backgroundColor: activeTab === 'employees' ? 'var(--theme-color, purple)' : 'transparent',
            color: activeTab === 'employees' ? '#fff' : '#666',
            border: 'none',
            borderRadius: '4px',
            cursor: 'pointer',
            fontWeight: activeTab === 'employees' ? 'bold' : 'normal'
          }}
        >
          Employees
        </button>
        <button
          onClick={() => setActiveTab('schedules')}
          style={{
            padding: '8px 16px',
            backgroundColor: activeTab === 'schedules' ? 'var(--theme-color, purple)' : 'transparent',
            color: activeTab === 'schedules' ? '#fff' : '#666',
            border: 'none',
            borderRadius: '4px',
            cursor: 'pointer',
            fontWeight: activeTab === 'schedules' ? 'bold' : 'normal'
          }}
        >
          All Schedules
        </button>
      </div>

      {activeTab === 'employees' && (
        <div className="employees-table">
        <table>
          <thead>
            <tr>
              <th>ID</th>
              <th>Name</th>
              <th>Username</th>
              <th>Email</th>
              <th>Position</th>
              <th>Role</th>
              <th>Status</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {employees.map((employee) => (
              <tr key={employee.employee_id}>
                <td>{employee.employee_id}</td>
                <td>{employee.first_name} {employee.last_name}</td>
                <td>{employee.username || employee.employee_code || 'N/A'}</td>
                <td>{employee.email || 'N/A'}</td>
                <td>{employee.position}</td>
                <td>{getRoleName(employee.role_id)}</td>
                <td>
                  <span className={`status-badge ${employee.active ? 'active' : 'inactive'}`}>
                    {employee.active ? 'Active' : 'Inactive'}
                  </span>
                </td>
                <td>
                  <div className="action-buttons">
                    {hasPermission('edit_employee') && (
                      <button
                        className="btn btn-sm btn-secondary"
                        onClick={() => handleEditEmployee(employee)}
                      >
                        Edit
                      </button>
                    )}
                    {hasPermission('manage_permissions') && (
                      <button
                        className="btn btn-sm btn-info"
                        onClick={() => handleManagePermissions(employee.employee_id)}
                      >
                        Permissions
                      </button>
                    )}
                    {hasPermission('delete_employee') && (
                      <button
                        className="btn btn-sm btn-danger"
                        onClick={() => handleDeleteEmployee(employee.employee_id)}
                        disabled={!employee.active}
                      >
                        Deactivate
                      </button>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      )}

      {activeTab === 'schedules' && (
        <div className="schedules-table">
          <table>
            <thead>
              <tr>
                <th>Employee</th>
                <th>Date</th>
                <th>Start Time</th>
                <th>End Time</th>
                <th>Hours</th>
                <th>Notes</th>
              </tr>
            </thead>
            <tbody>
              {schedules.length === 0 ? (
                <tr>
                  <td colSpan="6" style={{ textAlign: 'center', padding: '20px' }}>
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
                    <tr key={schedule.schedule_id || schedule.scheduled_shift_id || index}>
                      <td>{schedule.employee_name || 'N/A'}</td>
                      <td>{dateStr}</td>
                      <td>{startTime}</td>
                      <td>{endTime}</td>
                      <td>{hours}</td>
                      <td style={{ maxWidth: '200px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
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

      {showDisplaySettings && (
        <div style={{ 
          marginTop: '20px', 
          padding: '20px', 
          backgroundColor: '#fff', 
          borderRadius: '8px',
          boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
        }}>
          <h2>Customer Display Settings</h2>
          
          <div style={{ marginTop: '20px' }}>
            <label style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '15px' }}>
              <input
                type="checkbox"
                checked={displaySettings.tip_enabled}
                onChange={(e) => setDisplaySettings({ ...displaySettings, tip_enabled: e.target.checked })}
              />
              <span>Enable tip prompts before payment</span>
            </label>

            <label style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '15px' }}>
              <input
                type="checkbox"
                checked={displaySettings.tip_after_payment}
                onChange={(e) => setDisplaySettings({ ...displaySettings, tip_after_payment: e.target.checked })}
              />
              <span>Enable tip option after payment completion</span>
            </label>

            <div style={{ marginTop: '20px' }}>
              <button className="btn btn-primary" onClick={saveDisplaySettings}>
                Save Settings
              </button>
              <button 
                className="btn btn-secondary" 
                onClick={() => setShowDisplaySettings(false)}
                style={{ marginLeft: '10px' }}
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default AdminDashboard;



