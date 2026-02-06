import React, { useState, useEffect } from 'react';
import { useTheme } from '../contexts/ThemeContext';
import CustomDropdown from './common/CustomDropdown';
import {
  FormField,
  formModalStyle,
  inputBaseStyle,
  getInputFocusHandlers,
  compactFormLabelStyle,
  compactFormFieldStyleTight,
  compactFormActionsStyle,
  compactCancelButtonStyle,
  compactPrimaryButtonStyle,
  requiredIndicatorStyle
} from './FormStyles';

function hexToRgb(hex) {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return result ? `${parseInt(result[1], 16)}, ${parseInt(result[2], 16)}, ${parseInt(result[3], 16)}` : '132, 0, 255';
}

function EmployeeForm({ employee, roles, onSave, onCancel }) {
  const { themeColor } = useTheme();
  const themeColorRgb = hexToRgb(themeColor || '#8400ff');
  const [isDarkMode, setIsDarkMode] = useState(() => document.documentElement.classList.contains('dark-theme'));
  useEffect(() => {
    const check = () => setIsDarkMode(document.documentElement.classList.contains('dark-theme'));
    const obs = new MutationObserver(check);
    obs.observe(document.documentElement, { attributes: true, attributeFilter: ['class'] });
    return () => obs.disconnect();
  }, []);

  const [formData, setFormData] = useState({
    username: '',
    first_name: '',
    last_name: '',
    email: '',
    phone: '',
    position: '',
    department: '',
    date_started: '',
    password: '',
    confirm_password: '',
    hourly_rate: '',
    salary: '',
    employment_type: 'part_time',
    address: '',
    emergency_contact_name: '',
    emergency_contact_phone: '',
    notes: '',
    role_id: '',
    pin_code: ''
  });
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (employee) {
      setFormData({
        username: employee.username || employee.employee_code || '',
        first_name: employee.first_name || '',
        last_name: employee.last_name || '',
        email: employee.email || '',
        phone: employee.phone || '',
        position: employee.position || '',
        department: employee.department || '',
        date_started: employee.date_started || '',
        password: '',
        confirm_password: '',
        hourly_rate: employee.hourly_rate || '',
        salary: employee.salary || '',
        employment_type: employee.employment_type || 'part_time',
        address: employee.address || '',
        emergency_contact_name: employee.emergency_contact_name || '',
        emergency_contact_phone: employee.emergency_contact_phone || '',
        notes: employee.notes || '',
        role_id: employee.role_id || '',
        pin_code: employee.pin_code || ''
      });
    }
  }, [employee]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);

    // Validation
    if (!formData.first_name || !formData.last_name || !formData.position || !formData.date_started) {
      setError('First name, last name, position, and date started are required');
      return;
    }

    if (!employee && !formData.password) {
      setError('Password is required for new employees');
      return;
    }

    if (formData.password && formData.password !== formData.confirm_password) {
      setError('Passwords do not match');
      return;
    }

    setLoading(true);

    try {
      const payload = {
        username: formData.username,
        first_name: formData.first_name,
        last_name: formData.last_name,
        email: formData.email || null,
        phone: formData.phone || null,
        position: formData.position,
        department: formData.department || null,
        date_started: formData.date_started,
        password: formData.password || null,
        hourly_rate: formData.hourly_rate ? parseFloat(formData.hourly_rate) : null,
        salary: formData.salary ? parseFloat(formData.salary) : null,
        employment_type: formData.employment_type,
        address: formData.address || null,
        emergency_contact_name: formData.emergency_contact_name || null,
        emergency_contact_phone: formData.emergency_contact_phone || null,
        notes: formData.notes || null,
        role_id: formData.role_id ? parseInt(formData.role_id) : null,
        pin_code: formData.pin_code || null
      };

      let response;
      if (employee) {
        // Update existing employee
        // Don't send password if it's empty
        if (!payload.password) {
          delete payload.password;
        }
        response = await fetch(`/api/admin/employees/${employee.employee_id}`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(payload)
        });
      } else {
        // Create new employee
        response = await fetch('/api/admin/employees', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(payload)
        });
      }

      const data = await response.json();

      if (data.success) {
        onSave();
      } else {
        setError(data.error || 'Failed to save employee');
      }
    } catch (err) {
      setError('Failed to save employee: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  const inputStyle = (opts = {}) => ({ ...inputBaseStyle(isDarkMode, themeColorRgb), ...opts });
  const focusHandlers = getInputFocusHandlers(themeColorRgb, isDarkMode);

  return (
    <div className="modal-overlay" onClick={onCancel}>
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          ...formModalStyle(isDarkMode),
          maxWidth: '560px',
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
          {employee ? 'Edit Employee' : 'Add Employee'}
        </h2>
        <div
          style={{
            height: '20px',
            flexShrink: 0,
            background: `linear-gradient(to bottom, ${isDarkMode ? 'var(--bg-secondary, #2d2d2d)' : '#fff'}, transparent)`,
            pointerEvents: 'none'
          }}
        />

        <form onSubmit={handleSubmit} style={{ flex: 1, minHeight: 0, display: 'flex', flexDirection: 'column' }}>
          <div className="form-modal-scroll-hide-bar" style={{ flex: 1, minHeight: 0, overflowY: 'auto', paddingRight: '4px' }}>
            {error && (
              <div style={{
                padding: '10px 14px',
                marginBottom: '16px',
                backgroundColor: isDarkMode ? 'rgba(198, 40, 40, 0.2)' : '#fee',
                border: isDarkMode ? '1px solid rgba(198, 40, 40, 0.4)' : '1px solid #fcc',
                borderRadius: '8px',
                color: isDarkMode ? '#ef5350' : '#c33',
                fontSize: '14px'
              }}>
                {error}
              </div>
            )}

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px 16px' }}>
            <FormField style={compactFormFieldStyleTight}>
              <label style={compactFormLabelStyle(isDarkMode)}>Username <span style={requiredIndicatorStyle}>*</span></label>
              <input
                type="text"
                name="username"
                value={formData.username}
                onChange={handleChange}
                required
                style={inputStyle()}
                {...focusHandlers}
              />
            </FormField>
            <FormField style={compactFormFieldStyleTight}>
              <label style={compactFormLabelStyle(isDarkMode)}>First Name <span style={requiredIndicatorStyle}>*</span></label>
              <input
                type="text"
                name="first_name"
                value={formData.first_name}
                onChange={handleChange}
                required
                style={inputStyle()}
                {...focusHandlers}
              />
            </FormField>
            <FormField style={compactFormFieldStyleTight}>
              <label style={compactFormLabelStyle(isDarkMode)}>Last Name <span style={requiredIndicatorStyle}>*</span></label>
              <input
                type="text"
                name="last_name"
                value={formData.last_name}
                onChange={handleChange}
                required
                style={inputStyle()}
                {...focusHandlers}
              />
            </FormField>
            <FormField style={compactFormFieldStyleTight}>
              <label style={compactFormLabelStyle(isDarkMode)}>Email</label>
              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                style={inputStyle()}
                {...focusHandlers}
              />
            </FormField>
            <FormField style={compactFormFieldStyleTight}>
              <label style={compactFormLabelStyle(isDarkMode)}>Phone</label>
              <input
                type="tel"
                name="phone"
                value={formData.phone}
                onChange={handleChange}
                style={inputStyle()}
                {...focusHandlers}
              />
            </FormField>
            <FormField style={compactFormFieldStyleTight}>
              <label style={compactFormLabelStyle(isDarkMode)}>Position <span style={requiredIndicatorStyle}>*</span></label>
              <input
                type="text"
                name="position"
                value={formData.position}
                onChange={handleChange}
                required
                style={inputStyle()}
                {...focusHandlers}
              />
            </FormField>
            <FormField style={compactFormFieldStyleTight}>
              <label style={compactFormLabelStyle(isDarkMode)}>Department</label>
              <input
                type="text"
                name="department"
                value={formData.department}
                onChange={handleChange}
                style={inputStyle()}
                {...focusHandlers}
              />
            </FormField>
            <FormField style={compactFormFieldStyleTight}>
              <label style={compactFormLabelStyle(isDarkMode)}>Date Started <span style={requiredIndicatorStyle}>*</span></label>
              <input
                type="date"
                name="date_started"
                value={formData.date_started}
                onChange={handleChange}
                required
                style={inputStyle()}
                {...focusHandlers}
              />
            </FormField>
            <FormField style={compactFormFieldStyleTight}>
              <label style={compactFormLabelStyle(isDarkMode)}>{employee ? 'New Password (leave blank to keep current)' : 'Password *'}</label>
              <input
                type="password"
                name="password"
                value={formData.password}
                onChange={handleChange}
                required={!employee}
                style={inputStyle()}
                {...focusHandlers}
              />
            </FormField>
            {formData.password ? (
              <FormField style={compactFormFieldStyleTight}>
                <label style={compactFormLabelStyle(isDarkMode)}>Confirm Password</label>
                <input
                  type="password"
                  name="confirm_password"
                  value={formData.confirm_password}
                  onChange={handleChange}
                  style={inputStyle()}
                  {...focusHandlers}
                />
              </FormField>
            ) : <div />}
            <FormField style={compactFormFieldStyleTight}>
              <label style={compactFormLabelStyle(isDarkMode)}>Role</label>
              <CustomDropdown
                name="role_id"
                value={formData.role_id ? String(formData.role_id) : ''}
                onChange={handleChange}
                options={[
                  { value: '', label: 'No Role' },
                  ...(roles || []).map((r) => ({ value: String(r.role_id), label: r.role_name }))
                ]}
                placeholder="No Role"
                isDarkMode={isDarkMode}
                themeColorRgb={themeColorRgb}
                compactTrigger
              />
            </FormField>
            <FormField style={compactFormFieldStyleTight}>
              <label style={compactFormLabelStyle(isDarkMode)}>PIN Code</label>
              <input
                type="text"
                name="pin_code"
                value={formData.pin_code}
                onChange={handleChange}
                maxLength="6"
                placeholder="6-digit PIN"
                style={inputStyle()}
                {...focusHandlers}
              />
            </FormField>
            <FormField style={compactFormFieldStyleTight}>
              <label style={compactFormLabelStyle(isDarkMode)}>Employment Type</label>
              <CustomDropdown
                name="employment_type"
                value={formData.employment_type}
                onChange={handleChange}
                options={[
                  { value: 'part_time', label: 'Part Time' },
                  { value: 'full_time', label: 'Full Time' },
                  { value: 'contract', label: 'Contract' },
                  { value: 'temporary', label: 'Temporary' }
                ]}
                placeholder="Part Time"
                isDarkMode={isDarkMode}
                themeColorRgb={themeColorRgb}
                compactTrigger
              />
            </FormField>
            <FormField style={compactFormFieldStyleTight}>
              <label style={compactFormLabelStyle(isDarkMode)}>Hourly Rate</label>
              <input
                type="number"
                step="0.01"
                name="hourly_rate"
                value={formData.hourly_rate}
                onChange={handleChange}
                style={inputStyle({ textAlign: 'right' })}
                {...focusHandlers}
              />
            </FormField>
            <FormField style={compactFormFieldStyleTight}>
              <label style={compactFormLabelStyle(isDarkMode)}>Salary</label>
              <input
                type="number"
                step="0.01"
                name="salary"
                value={formData.salary}
                onChange={handleChange}
                style={inputStyle({ textAlign: 'right' })}
                {...focusHandlers}
              />
            </FormField>
            <FormField style={{ ...compactFormFieldStyleTight, gridColumn: '1 / -1' }}>
              <label style={compactFormLabelStyle(isDarkMode)}>Address</label>
              <textarea
                name="address"
                value={formData.address}
                onChange={handleChange}
                rows={2}
                style={{ ...inputStyle(), minHeight: '56px', resize: 'vertical' }}
                {...focusHandlers}
              />
            </FormField>
            <FormField style={compactFormFieldStyleTight}>
              <label style={compactFormLabelStyle(isDarkMode)}>Emergency Contact Name</label>
              <input
                type="text"
                name="emergency_contact_name"
                value={formData.emergency_contact_name}
                onChange={handleChange}
                style={inputStyle()}
                {...focusHandlers}
              />
            </FormField>
            <FormField style={compactFormFieldStyleTight}>
              <label style={compactFormLabelStyle(isDarkMode)}>Emergency Contact Phone</label>
              <input
                type="tel"
                name="emergency_contact_phone"
                value={formData.emergency_contact_phone}
                onChange={handleChange}
                style={inputStyle()}
                {...focusHandlers}
              />
            </FormField>
            <FormField style={{ ...compactFormFieldStyleTight, gridColumn: '1 / -1' }}>
              <label style={compactFormLabelStyle(isDarkMode)}>Notes</label>
              <textarea
                name="notes"
                value={formData.notes}
                onChange={handleChange}
                rows={3}
                style={{ ...inputStyle(), minHeight: '72px', resize: 'vertical' }}
                {...focusHandlers}
              />
            </FormField>
            </div>
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
              ...compactFormActionsStyle,
              marginTop: 0,
              padding: '8px 0 24px 0'
            }}>
              <button
                type="button"
                onClick={onCancel}
                style={compactCancelButtonStyle(isDarkMode)}
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={loading}
                style={compactPrimaryButtonStyle(themeColorRgb, loading)}
              >
                {loading ? 'Saving...' : 'Save'}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}

export default EmployeeForm;











