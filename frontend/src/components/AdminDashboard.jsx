import React, { useState, useEffect } from 'react';
import { Plus, Activity, ShoppingBag, Wallet, Clock, Package, Users, Calendar, RefreshCw } from 'lucide-react';
import { usePermissions } from '../contexts/PermissionContext';
import { useTheme } from '../contexts/ThemeContext';
import { useToast } from '../contexts/ToastContext';
import { getEmployeesCache, setEmployeesCache, getRolesCache, setRolesCache } from '../services/employeeRolesCache';
import EmployeeForm from './EmployeeForm';
import PermissionManager from './PermissionManager';
import Table from './Table';

function AdminDashboard() {
  const { hasPermission } = usePermissions();
  const { themeColor, themeMode } = useTheme();
  const { show: showToast } = useToast();
  
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
  const [activityData, setActivityData] = useState(null);
  const [activityEmployeeId, setActivityEmployeeId] = useState('');
  const [activityStartDate, setActivityStartDate] = useState(() => {
    const d = new Date();
    d.setDate(d.getDate() - 30);
    return d.toISOString().split('T')[0];
  });
  const [activityEndDate, setActivityEndDate] = useState(() => new Date().toISOString().split('T')[0]);
  const [activityLoading, setActivityLoading] = useState(false);
  const [detailModal, setDetailModal] = useState({ open: false, title: '', dataType: '', employeeId: null, employeeName: '', statLabel: '' });
  const [detailData, setDetailData] = useState({ columns: [], data: [] });
  const [detailLoading, setDetailLoading] = useState(false);

  // Load employees and roles: show from local cache first (instant), then fetch in background
  useEffect(() => {
    const forOffline = typeof navigator !== 'undefined' && !navigator.onLine;
    const cachedEmployees = getEmployeesCache(forOffline);
    const cachedRoles = getRolesCache(forOffline);
    const hasCache = cachedEmployees != null && cachedRoles != null;
    if (cachedEmployees != null) setEmployees(cachedEmployees);
    if (cachedRoles != null) setRoles(cachedRoles);
    if (hasCache) setEmployeesLoading(false);

    let cancelled = false;
    const run = async () => {
      if (!hasCache) setEmployeesLoading(true);
      try {
        const [empRes, rolesRes] = await Promise.all([
          fetch('/api/employees'),
          fetch('/api/roles')
        ]);
        if (cancelled) return;
        const empData = await empRes.json();
        const rolesData = await rolesRes.json();
        const empList = empData.data || [];
        const roleList = rolesData.roles || [];
        setEmployees(empList);
        setRoles(roleList);
        setEmployeesCache(empList);
        setRolesCache(roleList);
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

  // Auto-load activity when Activity tab is selected so dashboard is always visible (all employees, current date range)
  useEffect(() => {
    if (activeTab === 'activity' && employees.length > 0) {
      loadActivity();
    }
  }, [activeTab, employees.length]);

  const loadEmployees = async () => {
    setEmployeesLoading(true);
    try {
      const response = await fetch('/api/employees');
      const data = await response.json();
      const list = data.data || [];
      setEmployees(list);
      setEmployeesCache(list);
    } catch (err) {
      setError('Failed to load employees');
    } finally {
      setEmployeesLoading(false);
    }
  };

  const loadActivity = async () => {
    setActivityLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams();
      if (activityEmployeeId) params.set('employee_id', activityEmployeeId);
      if (activityStartDate) params.set('start_date', activityStartDate);
      if (activityEndDate) params.set('end_date', activityEndDate);
      const res = await fetch(`/api/admin/employee_activity?${params}`);
      const data = await res.json();
      if (data.success) setActivityData(data);
      else setError(data.error || 'Failed to load activity');
    } catch (err) {
      setError(err.message || 'Failed to load activity');
    } finally {
      setActivityLoading(false);
    }
  };

  const openDetail = async (dataType, employeeId, employeeName, title, statLabel) => {
    setDetailModal({ open: true, title, dataType, employeeId, employeeName, statLabel: statLabel || title });
    setDetailLoading(true);
    setDetailData({ columns: [], data: [] });
    try {
      const params = new URLSearchParams({ employee_id: employeeId, data_type: dataType });
      if (activityStartDate) params.set('start_date', activityStartDate);
      if (activityEndDate) params.set('end_date', activityEndDate);
      const res = await fetch(`/api/admin/employee_activity_detail?${params}`);
      const data = await res.json();
      if (data.success) setDetailData({ columns: data.columns || [], data: data.data || [] });
    } catch (err) {
      setDetailData({ columns: [], data: [] });
    } finally {
      setDetailLoading(false);
    }
  };

  const closeDetailModal = () => {
    setDetailModal(prev => ({ ...prev, open: false }));
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
    setError(null);
    try {
      const token = typeof localStorage !== 'undefined' ? localStorage.getItem('sessionToken') : null;
      const headers = {};
      if (token && token !== 'offline') {
        headers['X-Session-Token'] = token;
        headers['Authorization'] = `Bearer ${token}`;
      }
      const response = await fetch(`/api/admin/employees/${employeeId}`, {
        method: 'DELETE',
        headers
      });

      let data = {};
      try {
        data = await response.json();
      } catch (_) {
        data = { success: false, error: response.status === 401 ? 'Session expired. Please sign in again.' : 'Request failed.' };
      }

      if (response.ok && data.success) {
        showToast('Employee deactivated successfully', 'success');
        loadEmployees();
      } else {
        setError(data.error || `Failed to deactivate employee${response.status ? ` (${response.status})` : ''}`);
      }
    } catch (err) {
      setError(err.message || 'Failed to deactivate employee');
    }
  };

  const handleReactivateEmployee = async (employeeId) => {
    setError(null);
    try {
      const token = typeof localStorage !== 'undefined' ? localStorage.getItem('sessionToken') : null;
      const headers = { 'Content-Type': 'application/json' };
      if (token && token !== 'offline') {
        headers['X-Session-Token'] = token;
        headers['Authorization'] = `Bearer ${token}`;
      }
      const response = await fetch(`/api/admin/employees/${employeeId}/reactivate`, { method: 'POST', headers });
      const data = await response.json().catch(() => ({}));
      if (response.ok && data.success) {
        showToast('Employee reactivated successfully', 'success');
        loadEmployees();
      } else {
        setError(data.error || 'Failed to reactivate employee');
      }
    } catch (err) {
      setError(err.message || 'Failed to reactivate employee');
    }
  };

  const handlePermanentDeleteEmployee = async (employeeId) => {
    setError(null);
    try {
      const token = typeof localStorage !== 'undefined' ? localStorage.getItem('sessionToken') : null;
      const headers = { 'Content-Type': 'application/json' };
      if (token && token !== 'offline') {
        headers['X-Session-Token'] = token;
        headers['Authorization'] = `Bearer ${token}`;
      }
      const response = await fetch(`/api/admin/employees/${employeeId}/permanent-delete`, { method: 'POST', headers });
      const data = await response.json().catch(() => ({}));
      if (response.ok && data.success) {
        showToast('Employee permanently deleted', 'success');
        loadEmployees();
      } else {
        setError(data.error || 'Failed to delete employee');
      }
    } catch (err) {
      setError(err.message || 'Failed to delete employee');
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
    showToast('Employee saved successfully', 'success');
  };

  const getRoleName = (roleId) => {
    if (roleId == null || roleId === '') return 'No Role';
    const role = roles.find(r => Number(r.role_id) === Number(roleId) || String(r.role_id) === String(roleId));
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
        <button
          onClick={() => setActiveTab('activity')}
          style={{
            padding: '4px 16px',
            height: '28px',
            display: 'flex',
            alignItems: 'center',
            whiteSpace: 'nowrap',
            backgroundColor: activeTab === 'activity' ? `rgba(${themeColorRgb}, 0.7)` : (isDarkMode ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.05)'),
            border: activeTab === 'activity' ? `1px solid rgba(${themeColorRgb}, 0.5)` : `1px solid ${isDarkMode ? 'var(--border-light, #333)' : '#ddd'}`,
            borderRadius: '8px',
            fontSize: '14px',
            fontWeight: activeTab === 'activity' ? 600 : 500,
            color: activeTab === 'activity' ? '#fff' : (isDarkMode ? 'var(--text-primary, #fff)' : '#333'),
            cursor: 'pointer',
            transition: 'all 0.3s ease',
            boxShadow: activeTab === 'activity' ? `0 4px 15px rgba(${themeColorRgb}, 0.3)` : 'none'
          }}
        >
          <Activity size={14} style={{ marginRight: '6px' }} />
          Activity
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

      {activeTab === 'employees' && (
        <div style={{ flex: 1, minHeight: 0, overflow: 'auto', marginTop: '4px' }}>
          <Table
            stickyHeader
            columns={['employee_id', 'name', 'username', 'email', 'position', 'role', 'status', 'actions']}
            data={employeesLoading ? [] : [...employees]
              .sort((a, b) => (b.active ? 1 : 0) - (a.active ? 1 : 0))
              .map((emp) => ({
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
              if (hasPermission('edit_employee') && row.active) {
                items.push({ label: 'Edit', onClick: () => handleEditEmployee(row) });
              }
              if (hasPermission('manage_permissions')) {
                items.push({ label: 'Permissions', onClick: () => handleManagePermissions(row.employee_id) });
              }
              if (hasPermission('delete_employee')) {
                if (row.active) {
                  items.push({
                    label: 'Deactivate',
                    onClick: () => handleDeleteEmployee(row.employee_id),
                    confirm: true,
                    confirmMessage: 'Are you sure you want to deactivate this employee?',
                    confirmButtonLabel: 'Deactivate',
                    confirmDanger: true
                  });
                } else {
                  items.push({
                    label: 'Reactivate',
                    onClick: () => handleReactivateEmployee(row.employee_id),
                    confirm: true,
                    confirmMessage: 'Are you sure you want to reactivate this employee?',
                    confirmButtonLabel: 'Reactivate'
                  });
                  items.push({
                    label: 'Delete',
                    onClick: () => handlePermanentDeleteEmployee(row.employee_id),
                    confirm: true,
                    confirmMessage: 'Permanently delete this employee? This cannot be undone and may fail if they have orders or schedule data.',
                    confirmButtonLabel: 'Delete',
                    confirmDanger: true
                  });
                }
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

      {activeTab === 'activity' && (
        <div style={{ flex: 1, minHeight: 0, overflow: 'auto', display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div style={{
            display: 'flex',
            flexWrap: 'wrap',
            gap: '12px',
            alignItems: 'center',
            padding: '12px',
            backgroundColor: isDarkMode ? 'var(--bg-secondary, #2d2d2d)' : '#f5f5f5',
            borderRadius: '8px'
          }}>
            <span style={{ fontSize: '13px', color: isDarkMode ? '#999' : '#666', marginRight: '8px' }}>
              All employees · narrow by date or select one:
            </span>
            <select
              value={activityEmployeeId}
              onChange={(e) => setActivityEmployeeId(e.target.value)}
              style={{
                padding: '6px 10px',
                borderRadius: '6px',
                border: `1px solid ${isDarkMode ? 'var(--border-color, #404040)' : '#ddd'}`,
                backgroundColor: isDarkMode ? 'var(--bg-primary, #1a1a1a)' : '#fff',
                color: isDarkMode ? 'var(--text-primary, #fff)' : '#333',
                fontSize: '14px',
                minWidth: '180px'
              }}
            >
              <option value="">All employees</option>
              {employees.filter(e => e.active).map((emp) => (
                <option key={emp.employee_id} value={emp.employee_id}>
                  {[emp.first_name, emp.last_name].filter(Boolean).join(' ')}
                </option>
              ))}
            </select>
            <input
              type="date"
              value={activityStartDate}
              onChange={(e) => setActivityStartDate(e.target.value)}
              style={{
                padding: '6px 10px',
                borderRadius: '6px',
                border: `1px solid ${isDarkMode ? 'var(--border-color, #404040)' : '#ddd'}`,
                backgroundColor: isDarkMode ? 'var(--bg-primary, #1a1a1a)' : '#fff',
                color: isDarkMode ? 'var(--text-primary, #fff)' : '#333',
                fontSize: '14px'
              }}
            />
            <span style={{ color: isDarkMode ? '#999' : '#666' }}>to</span>
            <input
              type="date"
              value={activityEndDate}
              onChange={(e) => setActivityEndDate(e.target.value)}
              style={{
                padding: '6px 10px',
                borderRadius: '6px',
                border: `1px solid ${isDarkMode ? 'var(--border-color, #404040)' : '#ddd'}`,
                backgroundColor: isDarkMode ? 'var(--bg-primary, #1a1a1a)' : '#fff',
                color: isDarkMode ? 'var(--text-primary, #fff)' : '#333',
                fontSize: '14px'
              }}
            />
            <button
              onClick={loadActivity}
              disabled={activityLoading}
              style={{
                padding: '6px 16px',
                borderRadius: '6px',
                border: 'none',
                backgroundColor: `rgba(${themeColorRgb}, 0.8)`,
                color: '#fff',
                fontSize: '14px',
                fontWeight: 600,
                cursor: activityLoading ? 'not-allowed' : 'pointer'
              }}
            >
              {activityLoading ? 'Loading…' : 'Refresh'}
            </button>
          </div>

          {activityData && activityData.by_employee && Object.keys(activityData.by_employee).length > 0 && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
              {Object.values(activityData.by_employee).map((emp) => {
                const o = emp.orders || {};
                const cr = emp.cash_register || {};
                const tc = emp.time_clock || {};
                const sh = emp.shipments || {};
                const cu = emp.customers || {};
                const sc = emp.schedule_changes || [];
                const ret = emp.returns || {};
                const cardStyle = {
                  backgroundColor: isDarkMode ? 'var(--bg-secondary, #2d2d2d)' : '#fff',
                  border: `1px solid ${isDarkMode ? 'var(--border-color, #404040)' : '#eee'}`,
                  borderRadius: '12px',
                  overflow: 'hidden',
                  padding: '16px'
                };
                const sectionTitle = { fontSize: '12px', fontWeight: 600, color: isDarkMode ? '#999' : '#666', marginBottom: '8px', textTransform: 'uppercase' };
                const rowStyle = { display: 'flex', justifyContent: 'space-between', padding: '4px 0', fontSize: '14px', color: isDarkMode ? 'var(--text-primary, #fff)' : '#333' };
                const clickableRow = () => ({
                  ...rowStyle,
                  cursor: 'pointer',
                  borderRadius: '4px',
                  paddingLeft: '6px',
                  marginLeft: '-6px'
                });
                const onOrder = () => openDetail('orders', emp.employee_id, emp.employee_name, `${emp.employee_name} – Orders`, 'Orders');
                const onReturns = () => openDetail('returns', emp.employee_id, emp.employee_name, `${emp.employee_name} – Returns / refunds / exchanges`, 'Returns & refunds');
                const onCashOpens = () => openDetail('cash_opens', emp.employee_id, emp.employee_name, `${emp.employee_name} – Register opens`, 'Register opens');
                const onCashCloses = () => openDetail('cash_closes', emp.employee_id, emp.employee_name, `${emp.employee_name} – Register closes`, 'Register closes');
                const onCashDrops = () => openDetail('cash_drops', emp.employee_id, emp.employee_name, `${emp.employee_name} – Cash drops`, 'Cash drops');
                const onCashOut = () => openDetail('cash_out', emp.employee_id, emp.employee_name, `${emp.employee_name} – Cash out`, 'Cash out');
                const onCashIn = () => openDetail('cash_in', emp.employee_id, emp.employee_name, `${emp.employee_name} – Cash in`, 'Cash in');
                const onTimeClock = () => openDetail('time_clock', emp.employee_id, emp.employee_name, `${emp.employee_name} – Time clock`, 'Time clock');
                const onShipments = () => openDetail('shipments', emp.employee_id, emp.employee_name, `${emp.employee_name} – Shipments`, 'Shipments');
                const onScheduleChanges = () => openDetail('schedule_changes', emp.employee_id, emp.employee_name, `${emp.employee_name} – Schedule changes`, 'Schedule changes');
                const onNewCustomers = () => openDetail('new_customers', emp.employee_id, emp.employee_name, `${emp.employee_name} – New customers added`, 'New customers added');
                const onCheckoutsWithCustomer = () => openDetail('checkouts_with_customer', emp.employee_id, emp.employee_name, `${emp.employee_name} – Checkouts with customer`, 'Checkouts with customer');
                const onCheckoutsWithoutCustomer = () => openDetail('checkouts_without_customer', emp.employee_id, emp.employee_name, `${emp.employee_name} – Checkouts without customer`, 'Checkouts without customer');
                return (
                  <div key={emp.employee_id} style={cardStyle}>
                    <h3 style={{ margin: '0 0 16px', fontSize: '18px', color: isDarkMode ? 'var(--text-primary, #fff)' : '#333' }}>
                      {emp.employee_name}
                    </h3>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '20px' }}>
                      <div>
                        <div style={sectionTitle}><ShoppingBag size={12} style={{ verticalAlign: 'middle', marginRight: '4px' }} /> Orders</div>
                        <div role="button" tabIndex={0} style={clickableRow()} onClick={onOrder} onKeyDown={(e) => e.key === 'Enter' && onOrder()}><span>Total orders</span><span>{o.total ?? 0}</span></div>
                        {o.by_type && Object.keys(o.by_type).length > 0 && (
                          <div role="button" tabIndex={0} style={clickableRow()} onClick={onOrder} onKeyDown={(e) => e.key === 'Enter' && onOrder()}><span>By type</span><span>{Object.entries(o.by_type).map(([k, v]) => `${k}: ${v}`).join(', ')}</span></div>
                        )}
                        <div role="button" tabIndex={0} style={clickableRow()} onClick={onOrder} onKeyDown={(e) => e.key === 'Enter' && onOrder()}><span>Tips (total / count / avg)</span><span>${Number(o.tip_total || 0).toFixed(2)} / {o.tip_count ?? 0} / ${(Number(o.tip_avg) || 0).toFixed(2)}</span></div>
                        <div role="button" tabIndex={0} style={clickableRow()} onClick={onOrder} onKeyDown={(e) => e.key === 'Enter' && onOrder()}><span>Discounts (total / count)</span><span>${Number(o.discount_total || 0).toFixed(2)} / {o.discount_count ?? 0}</span></div>
                      </div>
                      <div>
                        <div style={sectionTitle}><Wallet size={12} style={{ verticalAlign: 'middle', marginRight: '4px' }} /> Cash register</div>
                        <div role="button" tabIndex={0} style={clickableRow()} onClick={onCashOpens} onKeyDown={(e) => e.key === 'Enter' && onCashOpens()}><span>Opens</span><span>{cr.opens ?? 0}</span></div>
                        <div role="button" tabIndex={0} style={clickableRow()} onClick={onCashCloses} onKeyDown={(e) => e.key === 'Enter' && onCashCloses()}><span>Closes</span><span>{cr.closes ?? 0}</span></div>
                        <div role="button" tabIndex={0} style={clickableRow()} onClick={onCashDrops} onKeyDown={(e) => e.key === 'Enter' && onCashDrops()}><span>Drops (count / total)</span><span>{cr.drops ?? 0} / ${Number(cr.drops_total || 0).toFixed(2)}</span></div>
                        <div role="button" tabIndex={0} style={clickableRow()} onClick={onCashOut} onKeyDown={(e) => e.key === 'Enter' && onCashOut()}><span>Cash out (count / total)</span><span>{cr.cash_out_count ?? 0} / ${Number(cr.cash_out_total || 0).toFixed(2)}</span></div>
                        <div role="button" tabIndex={0} style={clickableRow()} onClick={onCashIn} onKeyDown={(e) => e.key === 'Enter' && onCashIn()}><span>Cash in (count / total)</span><span>{cr.cash_in_count ?? 0} / ${Number(cr.cash_in_total || 0).toFixed(2)}</span></div>
                        {(cr.cash_out_reasons || []).slice(0, 3).map((r, i) => (
                          <div key={i} style={{ ...rowStyle, fontSize: '12px', color: isDarkMode ? '#999' : '#666' }}>
                            <span>Take out: ${Number(r.amount).toFixed(2)} {r.reason ? `– ${r.reason}` : ''}</span>
                          </div>
                        ))}
                        {(cr.close_details || []).slice(0, 3).map((d, i) => (
                          <div key={i} style={{ ...rowStyle, fontSize: '12px', color: isDarkMode ? '#999' : '#666' }}>
                            <span>Close: ${Number(d.ending_cash).toFixed(2)} expected ${Number(d.expected_cash).toFixed(2)} {d.discrepancy != null && Number(d.discrepancy) !== 0 ? `(${Number(d.discrepancy) >= 0 ? '+' : ''}$${Number(d.discrepancy).toFixed(2)})` : ''}</span>
                          </div>
                        ))}
                      </div>
                      <div>
                        <div style={sectionTitle}><Clock size={12} style={{ verticalAlign: 'middle', marginRight: '4px' }} /> Time clock</div>
                        <div role="button" tabIndex={0} style={clickableRow()} onClick={onTimeClock} onKeyDown={(e) => e.key === 'Enter' && onTimeClock()}><span>Punch entries</span><span>{tc.total_entries ?? 0}</span></div>
                        <div style={rowStyle}><span>Arrival: late / on time / early</span><span>{tc.late_count ?? 0} / {tc.on_time_count ?? 0} / {tc.early_count ?? 0}</span></div>
                        <div style={rowStyle}><span>Leave: late / on time / early</span><span>{tc.leave_late_count ?? 0} / {tc.leave_on_time_count ?? 0} / {tc.leave_early_count ?? 0}</span></div>
                        {(tc.entries || []).slice(0, 5).map((e, i) => (
                          <div key={i} style={{ ...rowStyle, fontSize: '12px', color: isDarkMode ? '#999' : '#666' }}>
                            <span>{e.clock_in ? new Date(e.clock_in).toLocaleString() : '—'}</span>
                            <span>{e.clock_out ? new Date(e.clock_out).toLocaleString() : '—'}</span>
                          </div>
                        ))}
                      </div>
                      <div>
                        <div style={sectionTitle}><RefreshCw size={12} style={{ verticalAlign: 'middle', marginRight: '4px' }} /> Returns / refunds / exchanges</div>
                        <div role="button" tabIndex={0} style={clickableRow()} onClick={onReturns} onKeyDown={(e) => e.key === 'Enter' && onReturns()}><span>Total processed</span><span>{ret.count ?? 0}</span></div>
                        <div role="button" tabIndex={0} style={clickableRow()} onClick={onReturns} onKeyDown={(e) => e.key === 'Enter' && onReturns()}><span>Refunds</span><span>{ret.refunds_count ?? ret.count ?? 0}</span></div>
                        <div role="button" tabIndex={0} style={clickableRow()} onClick={onReturns} onKeyDown={(e) => e.key === 'Enter' && onReturns()}><span>Exchanges</span><span>{ret.exchanges_count ?? 0}</span></div>
                        <div role="button" tabIndex={0} style={clickableRow()} onClick={onReturns} onKeyDown={(e) => e.key === 'Enter' && onReturns()}><span>Total refund amount</span><span>${Number(ret.total_amount || 0).toFixed(2)}</span></div>
                      </div>
                      <div>
                        <div style={sectionTitle}><Package size={12} style={{ verticalAlign: 'middle', marginRight: '4px' }} /> Shipments & inventory</div>
                        <div role="button" tabIndex={0} style={clickableRow()} onClick={onShipments} onKeyDown={(e) => e.key === 'Enter' && onShipments()}><span>Shipments created</span><span>{sh.created ?? 0}</span></div>
                      </div>
                      <div>
                        <div style={sectionTitle}><Users size={12} style={{ verticalAlign: 'middle', marginRight: '4px' }} /> Customers</div>
                        <div role="button" tabIndex={0} style={clickableRow()} onClick={onNewCustomers} onKeyDown={(e) => e.key === 'Enter' && onNewCustomers()}><span>New customers added</span><span>{cu.new_customers ?? 0}</span></div>
                        <div role="button" tabIndex={0} style={clickableRow()} onClick={onCheckoutsWithCustomer} onKeyDown={(e) => e.key === 'Enter' && onCheckoutsWithCustomer()}><span>Checkouts with customer</span><span>{cu.checkouts_with_customer ?? 0}</span></div>
                        <div role="button" tabIndex={0} style={clickableRow()} onClick={onCheckoutsWithoutCustomer} onKeyDown={(e) => e.key === 'Enter' && onCheckoutsWithoutCustomer()}><span>Checkouts without customer</span><span>{cu.checkouts_without_customer ?? 0}</span></div>
                      </div>
                      <div>
                        <div style={sectionTitle}><Calendar size={12} style={{ verticalAlign: 'middle', marginRight: '4px' }} /> Schedule changes</div>
                        <div role="button" tabIndex={0} style={clickableRow()} onClick={onScheduleChanges} onKeyDown={(e) => e.key === 'Enter' && onScheduleChanges()}><span>Count</span><span>{sc.length}</span></div>
                        {sc.slice(0, 5).map((c, i) => (
                          <div key={i} style={{ ...rowStyle, fontSize: '12px', color: isDarkMode ? '#999' : '#666' }}>
                            <span>{c.change_type}</span>
                            <span>{c.changed_at ? new Date(c.changed_at).toLocaleString() : ''}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {activeTab === 'activity' && activityLoading && (
            <div style={{ textAlign: 'center', padding: '24px', color: isDarkMode ? '#999' : '#666', fontSize: '14px' }}>
              Loading activity…
            </div>
          )}
          {activeTab === 'activity' && !activityLoading && !activityData && employees.length === 0 && (
            <div style={{ textAlign: 'center', padding: '32px', color: isDarkMode ? '#999' : '#666', fontSize: '14px' }}>
              No employees to show activity for.
            </div>
          )}
          {activeTab === 'activity' && !activityLoading && !activityData && employees.length > 0 && (
            <div style={{ textAlign: 'center', padding: '32px', color: isDarkMode ? '#999' : '#666', fontSize: '14px' }}>
              Click Refresh to load activity.
            </div>
          )}
          {activeTab === 'activity' && !activityLoading && activityData && (!activityData.by_employee || Object.keys(activityData.by_employee).length === 0) && (
            <div style={{ textAlign: 'center', padding: '32px', color: isDarkMode ? '#999' : '#666', fontSize: '14px' }}>
              No activity data for the selected filters. Adjust dates or employee and click Refresh.
            </div>
          )}
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

      {detailModal.open && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            zIndex: 10000,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            backgroundColor: 'rgba(0,0,0,0.5)',
            padding: '24px'
          }}
          onClick={closeDetailModal}
          role="dialog"
          aria-modal="true"
          aria-labelledby="detail-modal-title"
        >
          <div
            style={{
              width: '920px',
              height: '560px',
              backgroundColor: isDarkMode ? 'var(--bg-primary, #1a1a1a)' : '#fff',
              borderRadius: '12px',
              display: 'flex',
              flexDirection: 'column',
              boxShadow: '0 8px 32px rgba(0,0,0,0.3)',
              border: isDarkMode ? '1px solid var(--border-color, #404040)' : '1px solid #ddd',
              overflow: 'hidden'
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 20px', borderBottom: isDarkMode ? '1px solid var(--border-color, #404040)' : '1px solid #eee', flexShrink: 0 }}>
              <h2 id="detail-modal-title" style={{ margin: 0, fontSize: '16px', fontWeight: 600, color: isDarkMode ? 'var(--text-primary, #fff)' : '#333' }}>
                {detailModal.title}
              </h2>
              <button
                type="button"
                onClick={closeDetailModal}
                style={{
                  padding: '6px 12px',
                  borderRadius: '6px',
                  border: 'none',
                  background: isDarkMode ? 'rgba(255,255,255,0.1)' : '#eee',
                  color: isDarkMode ? '#fff' : '#333',
                  cursor: 'pointer',
                  fontSize: '14px'
                }}
              >
                Close
              </button>
            </div>
            <div style={{ flex: 1, display: 'flex', minHeight: 0 }}>
              <div
                style={{
                  width: '240px',
                  flexShrink: 0,
                  padding: '20px',
                  borderRight: isDarkMode ? '1px solid var(--border-color, #404040)' : '1px solid #eee',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '16px',
                  backgroundColor: isDarkMode ? 'var(--bg-secondary, #2d2d2d)' : '#f8f9fa'
                }}
              >
                <div>
                  <div style={{ fontSize: '11px', fontWeight: 600, color: isDarkMode ? '#888' : '#666', textTransform: 'uppercase', marginBottom: '4px' }}>Employee</div>
                  <div style={{ fontSize: '16px', fontWeight: 600, color: isDarkMode ? 'var(--text-primary, #fff)' : '#333' }}>{detailModal.employeeName || '—'}</div>
                </div>
                <div>
                  <div style={{ fontSize: '11px', fontWeight: 600, color: isDarkMode ? '#888' : '#666', textTransform: 'uppercase', marginBottom: '4px' }}>Statistic</div>
                  <div style={{ fontSize: '15px', color: isDarkMode ? 'var(--text-primary, #fff)' : '#333' }}>{detailModal.statLabel || '—'}</div>
                </div>
                <div>
                  <div style={{ fontSize: '11px', fontWeight: 600, color: isDarkMode ? '#888' : '#666', textTransform: 'uppercase', marginBottom: '4px' }}>Date range</div>
                  <div style={{ fontSize: '13px', color: isDarkMode ? '#bbb' : '#555' }}>
                    {activityStartDate || '—'} to {activityEndDate || '—'}
                  </div>
                </div>
                <div>
                  <div style={{ fontSize: '11px', fontWeight: 600, color: isDarkMode ? '#888' : '#666', textTransform: 'uppercase', marginBottom: '4px' }}>Records</div>
                  <div style={{ fontSize: '18px', fontWeight: 600, color: isDarkMode ? 'var(--text-primary, #fff)' : '#333' }}>
                    {detailLoading ? '…' : (detailData.data || []).length}
                  </div>
                </div>
              </div>
              <div style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
                {detailLoading ? (
                  <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', color: isDarkMode ? '#999' : '#666' }}>Loading…</div>
                ) : detailData.data.length === 0 ? (
                  <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', color: isDarkMode ? '#999' : '#666' }}>No records for this period.</div>
                ) : (
                  <div style={{ flex: 1, overflow: 'auto', padding: '16px' }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
                      <thead>
                        <tr style={{ borderBottom: isDarkMode ? '2px solid var(--border-color, #404040)' : '2px solid #ddd' }}>
                          {(detailData.columns || []).map((col) => (
                            <th key={col.key} style={{ textAlign: 'left', padding: '8px 12px', fontWeight: 600, color: isDarkMode ? 'var(--text-primary, #fff)' : '#333', whiteSpace: 'nowrap' }}>
                              {col.label}
                            </th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {detailData.data.map((row, idx) => (
                          <tr
                            key={idx}
                            style={{
                              borderBottom: isDarkMode ? '1px solid var(--border-color, #404040)' : '1px solid #eee'
                            }}
                          >
                            {(detailData.columns || []).map((col) => (
                              <td key={col.key} style={{ padding: '8px 12px', color: isDarkMode ? 'var(--text-primary, #fff)' : '#333' }}>
                                {row[col.key] != null && row[col.key] !== '' ? String(row[col.key]) : '—'}
                              </td>
                            ))}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}

export default AdminDashboard;



