import { useState, useEffect } from 'react'
import { 
  Users, 
  Clock, 
  DollarSign, 
  TrendingUp, 
  AlertCircle,
  ExternalLink,
  CheckCircle2,
  Calendar,
  ChevronRight
} from 'lucide-react'
import { useToast } from '../contexts/ToastContext'
import Button from '../components/common/Button'
import LoadingSpinner from '../components/common/LoadingSpinner'

export default function PayrollTab({ formatCurrency, getAuthHeaders, isDarkMode }) {
  const { show: showToast } = useToast()
  const [loading, setLoading] = useState(true)
  const [data, setData] = useState({
    summary: {
      total_labor_cost: 0,
      total_hours: 0,
      total_tips: 0,
      employee_count: 0
    },
    employees: []
  })
  const [dateRange, setDateRange] = useState({
    start_date: new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().split('T')[0],
    end_date: new Date().toISOString().split('T')[0]
  })

  const loadPayrollData = async () => {
    try {
      setLoading(true)
      const headers = getAuthHeaders ? getAuthHeaders() : {}
      const res = await fetch(`/api/accounting/payroll-summary?start_date=${dateRange.start_date}&end_date=${dateRange.end_date}`, { headers })
      const json = await res.json()
      
      if (json.success) {
        setData(json.data)
      } else {
        showToast(json.message || 'Failed to load payroll data', 'error')
      }
    } catch (err) {
      console.error('Error loading payroll data:', err)
      showToast('Error loading payroll data', 'error')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadPayrollData()
  }, [dateRange])

  const textColor = isDarkMode ? '#ffffff' : '#1a1a1a'
  const textSecondary = isDarkMode ? '#9ca3af' : '#6b7280'
  const cardBg = isDarkMode ? '#2a2a2a' : 'white'
  const borderColor = isDarkMode ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)'

  const MetricCard = ({ title, value, icon: Icon, color }) => (
    <div style={{
      backgroundColor: cardBg,
      padding: '20px',
      borderRadius: '12px',
      border: `1px solid ${borderColor}`,
      display: 'flex',
      alignItems: 'center',
      gap: '16px',
      flex: 1,
      minWidth: '200px',
      boxShadow: isDarkMode ? '0 4px 6px rgba(0,0,0,0.2)' : '0 4px 6px rgba(0,0,0,0.05)'
    }}>
      <div style={{
        backgroundColor: `${color}15`,
        padding: '12px',
        borderRadius: '10px',
        color: color
      }}>
        <Icon size={24} />
      </div>
      <div>
        <p style={{ margin: 0, fontSize: '14px', color: textSecondary, fontWeight: 500 }}>{title}</p>
        <h3 style={{ margin: '4px 0 0 0', fontSize: '20px', fontWeight: 700, color: textColor }}>{value}</h3>
      </div>
    </div>
  )

  const IntegrationCard = ({ name, description, logoUrl, status = 'Available' }) => (
    <div style={{
      backgroundColor: cardBg,
      padding: '24px',
      borderRadius: '16px',
      border: `1px solid ${borderColor}`,
      display: 'flex',
      flexDirection: 'column',
      gap: '16px',
      flex: 1,
      minWidth: '300px',
      position: 'relative',
      overflow: 'hidden'
    }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div style={{ 
          width: '48px', 
          height: '48px', 
          borderRadius: '12px', 
          backgroundColor: '#f3f4f6', 
          display: 'flex', 
          alignItems: 'center', 
          justifyContent: 'center',
          fontSize: '20px',
          fontWeight: 700,
          color: '#374151'
        }}>
          {name[0]}
        </div>
        <span style={{ 
          fontSize: '12px', 
          padding: '4px 8px', 
          borderRadius: '20px', 
          backgroundColor: status === 'Connected' ? '#def7ec' : '#f3f4f6',
          color: status === 'Connected' ? '#03543f' : '#374151',
          fontWeight: 600
        }}>
          {status}
        </span>
      </div>
      <div>
        <h4 style={{ margin: '0 0 4px 0', fontSize: '18px', fontWeight: 600, color: textColor }}>{name}</h4>
        <p style={{ margin: 0, fontSize: '14px', color: textSecondary, lineHeight: 1.5 }}>{description}</p>
      </div>
      <Button 
        variant="secondary" 
        style={{ marginTop: 'auto', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}
        onClick={() => showToast(`${name} integration coming soon`, 'info')}
      >
        {status === 'Connected' ? 'Manage' : 'Connect'} <ExternalLink size={14} />
      </Button>
    </div>
  )

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '32px', paddingBottom: '40px' }}>
      {/* Header & Date Picker */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px' }}>
        <div>
          <h1 style={{ margin: 0, fontSize: '24px', fontWeight: 700, color: textColor }}>Payroll</h1>
          <p style={{ margin: '4px 0 0 0', color: textSecondary }}>Manage employee hours, earnings, and payroll integrations.</p>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', backgroundColor: cardBg, padding: '8px 16px', borderRadius: '10px', border: `1px solid ${borderColor}` }}>
          <Calendar size={18} color={textSecondary} />
          <input 
            type="date" 
            value={dateRange.start_date}
            onChange={(e) => setDateRange(prev => ({ ...prev, start_date: e.target.value }))}
            style={{ border: 'none', background: 'transparent', color: textColor, fontSize: '14px', outline: 'none' }}
          />
          <span style={{ color: textSecondary }}>to</span>
          <input 
            type="date" 
            value={dateRange.end_date}
            onChange={(e) => setDateRange(prev => ({ ...prev, end_date: e.target.value }))}
            style={{ border: 'none', background: 'transparent', color: textColor, fontSize: '14px', outline: 'none' }}
          />
        </div>
      </div>

      {/* Summary Metrics */}
      <div style={{ display: 'flex', gap: '20px', flexWrap: 'wrap' }}>
        <MetricCard 
          title="Total Labor Cost" 
          value={formatCurrency(data.summary.total_labor_cost)} 
          icon={DollarSign} 
          color="#10b981" 
        />
        <MetricCard 
          title="Total Hours" 
          value={`${data.summary.total_hours.toFixed(1)} hrs`} 
          icon={Clock} 
          color="#3b82f6" 
        />
        <MetricCard 
          title="Total Tips" 
          value={formatCurrency(data.summary.total_tips)} 
          icon={TrendingUp} 
          color="#8b5cf6" 
        />
        <MetricCard 
          title="Employees" 
          value={data.summary.employee_count} 
          icon={Users} 
          color="#f59e0b" 
        />
      </div>

      {/* Employee Details Table */}
      <div style={{ 
        backgroundColor: cardBg, 
        borderRadius: '16px', 
        border: `1px solid ${borderColor}`,
        overflow: 'hidden',
        boxShadow: isDarkMode ? '0 4px 6px rgba(0,0,0,0.2)' : '0 4px 6px rgba(0,0,0,0.05)'
      }}>
        <div style={{ padding: '20px 24px', borderBottom: `1px solid ${borderColor}`, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h3 style={{ margin: 0, fontSize: '18px', fontWeight: 600, color: textColor }}>Employee Performance</h3>
          <Button variant="outline" size="small" onClick={loadPayrollData}>Refresh</Button>
        </div>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ backgroundColor: isDarkMode ? 'rgba(255,255,255,0.02)' : '#f9fafb' }}>
                <th style={{ textAlign: 'left', padding: '16px 24px', fontSize: '12px', fontWeight: 600, color: textSecondary, textTransform: 'uppercase' }}>Employee</th>
                <th style={{ textAlign: 'center', padding: '16px 24px', fontSize: '12px', fontWeight: 600, color: textSecondary, textTransform: 'uppercase' }}>Scheduled</th>
                <th style={{ textAlign: 'center', padding: '16px 24px', fontSize: '12px', fontWeight: 600, color: textSecondary, textTransform: 'uppercase' }}>Actual</th>
                <th style={{ textAlign: 'center', padding: '16px 24px', fontSize: '12px', fontWeight: 600, color: textSecondary, textTransform: 'uppercase' }}>Variance</th>
                <th style={{ textAlign: 'center', padding: '16px 24px', fontSize: '12px', fontWeight: 600, color: textSecondary, textTransform: 'uppercase' }}>Shifts</th>
                <th style={{ textAlign: 'right', padding: '16px 24px', fontSize: '12px', fontWeight: 600, color: textSecondary, textTransform: 'uppercase' }}>Tips</th>
                <th style={{ textAlign: 'right', padding: '16px 24px', fontSize: '12px', fontWeight: 600, color: textSecondary, textTransform: 'uppercase' }}>Total Earned</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan="7" style={{ padding: '40px', textAlign: 'center' }}>
                    <LoadingSpinner />
                  </td>
                </tr>
              ) : data.employees.length === 0 ? (
                <tr>
                  <td colSpan="7" style={{ padding: '40px', textAlign: 'center', color: textSecondary }}>
                    No payroll data found for this period.
                  </td>
                </tr>
              ) : data.employees.map((emp, idx) => {
                const variance = emp.actual_hours - emp.scheduled_hours
                const varianceColor = variance > 0 ? '#ef4444' : variance < 0 ? '#3b82f6' : textSecondary
                
                return (
                  <tr key={emp.employee_id} style={{ 
                    borderBottom: idx === data.employees.length - 1 ? 'none' : `1px solid ${borderColor}`,
                    transition: 'background-color 0.2s'
                  }}>
                    <td style={{ padding: '16px 24px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                        <div style={{ 
                          width: '32px', 
                          height: '32px', 
                          borderRadius: '50%', 
                          backgroundColor: '#3b82f620', 
                          color: '#3b82f6',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          fontSize: '12px',
                          fontWeight: 600
                        }}>
                          {emp.employee_name.split(' ').map(n => n[0]).join('')}
                        </div>
                        <div>
                          <p style={{ margin: 0, fontSize: '14px', fontWeight: 600, color: textColor }}>{emp.employee_name}</p>
                          <p style={{ margin: 0, fontSize: '12px', color: textSecondary }}>{emp.position || 'Employee'}</p>
                        </div>
                      </div>
                    </td>
                    <td style={{ textAlign: 'center', padding: '16px 24px', fontSize: '14px', color: textColor }}>{emp.scheduled_hours.toFixed(1)}</td>
                    <td style={{ textAlign: 'center', padding: '16px 24px', fontSize: '14px', color: textColor }}>{emp.actual_hours.toFixed(1)}</td>
                    <td style={{ textAlign: 'center', padding: '16px 24px', fontSize: '14px' }}>
                      <div style={{ 
                        display: 'inline-flex', 
                        alignItems: 'center', 
                        gap: '4px',
                        padding: '4px 8px',
                        borderRadius: '6px',
                        backgroundColor: variance > 0 ? '#fee2e2' : variance < 0 ? '#dbeafe' : '#f3f4f6',
                        color: variance > 0 ? '#b91c1c' : variance < 0 ? '#1e40af' : '#374151',
                        fontWeight: 600,
                        fontSize: '12px'
                      }}>
                        {variance > 0 ? '+' : ''}{variance.toFixed(1)}
                      </div>
                    </td>
                    <td style={{ textAlign: 'center', padding: '16px 24px', fontSize: '14px', color: textColor }}>{emp.shift_count}</td>
                    <td style={{ textAlign: 'right', padding: '16px 24px', fontSize: '14px', color: '#8b5cf6', fontWeight: 600 }}>{formatCurrency(emp.tips)}</td>
                    <td style={{ textAlign: 'right', padding: '16px 24px', fontSize: '14px', color: '#10b981', fontWeight: 700 }}>
                      {formatCurrency(emp.total_earned)}
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Payroll Integrations */}
      <div>
        <h3 style={{ margin: '0 0 20px 0', fontSize: '20px', fontWeight: 700, color: textColor }}>Payroll Integrations</h3>
        <div style={{ display: 'flex', gap: '20px', flexWrap: 'wrap' }}>
          <IntegrationCard 
            name="Gusto" 
            description="Sync your team's hours and tips directly to Gusto for seamless payroll processing."
            status="Available"
          />
          <IntegrationCard 
            name="ADP" 
            description="Enterprise-grade payroll integration with ADP Workforce Now and RUN."
            status="Available"
          />
          <IntegrationCard 
            name="Justworks" 
            description="Manage benefits, payroll, and compliance by syncing your POS data to Justworks."
            status="Available"
          />
        </div>
      </div>

      {/* Overtime Alerts */}
      <div style={{ 
        backgroundColor: '#fffbeb', 
        border: '1px solid #fef3c7', 
        borderRadius: '12px', 
        padding: '16px 24px',
        display: 'flex',
        alignItems: 'flex-start',
        gap: '16px'
      }}>
        <AlertCircle color="#d97706" size={24} style={{ marginTop: '2px' }} />
        <div>
          <h4 style={{ margin: '0 0 4px 0', fontSize: '16px', fontWeight: 600, color: '#92400e' }}>Overtime Awareness</h4>
          <p style={{ margin: 0, fontSize: '14px', color: '#b45309', lineHeight: 1.5 }}>
            {data.employees.filter(e => e.actual_hours > 40).length} employees have worked over 40 hours this period. 
            Ensure you verify overtime pay requirements before processing payroll.
          </p>
        </div>
      </div>
    </div>
  )
}
