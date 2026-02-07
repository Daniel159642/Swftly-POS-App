import { useState } from 'react'
import {
  LineChart, Line, BarChart, Bar, AreaChart, Area, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend
} from 'recharts'
import { useTheme } from '../../contexts/ThemeContext'
import { getWidgetById, getDataByKey, CHART_TYPES, WIDGET_SIZES } from './widgetRegistry'
import { ChevronDown, X } from 'lucide-react'

const COLORS = ['#6ba3f0', '#5a9bd5', '#4a8bc2', '#3a7baf', '#2a6b9c', '#1a5b89']

function formatCurrency(value) {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', minimumFractionDigits: 0, maximumFractionDigits: 0 }).format(value ?? 0)
}

export default function WidgetCard({ widgetId, chartType, size, stats, onChartTypeChange, onRemove, isDarkMode }) {
  const { themeColor } = useTheme()
  const [chartMenuOpen, setChartMenuOpen] = useState(false)
  const def = getWidgetById(widgetId)
  if (!def) return null

  const data = getDataByKey(stats, def.dataKey)
  const supportedCharts = (def.supportedCharts || ['number']).filter(t => CHART_TYPES.some(c => c.id === t))
  const currentChart = supportedCharts.includes(chartType) ? chartType : (def.defaultChart || 'number')
  const textColor = isDarkMode ? '#fff' : '#1a1a1a'
  const mutedColor = isDarkMode ? '#999' : '#666'
  const cardBg = isDarkMode ? '#2a2a2a' : '#fff'
  const borderColor = isDarkMode ? '#3a3a3a' : '#e5e7eb'

  const renderContent = () => {
    if (currentChart === 'number') {
      let display = data
      if (def.format === 'currency') display = formatCurrency(data)
      else if (typeof data === 'object' && data !== null) display = Object.keys(data).length ? JSON.stringify(data).slice(0, 50) + '…' : '—'
      return (
        <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', height: '100%', padding: '16px' }}>
          <div style={{ fontSize: 'clamp(1.5rem, 4vw, 2.5rem)', fontWeight: 700, color: themeColor }}>{display ?? '—'}</div>
          <div style={{ fontSize: '12px', color: mutedColor, marginTop: '4px', textAlign: 'center' }}>{def.label}</div>
        </div>
      )
    }

    if (currentChart === 'table') {
      let rows = []
      if (Array.isArray(data)) {
        rows = data.slice(0, 10).map((row, i) => {
          if (typeof row !== 'object' || row === null) return { name: `Item ${i + 1}`, value: row }
          const name = row.day ?? row.month ?? row.date ?? row.product_name ?? row.name
          const value = row.revenue ?? row.total_revenue ?? row.quantity ?? row.total_quantity ?? row.value
          return { name: name ?? `Row ${i + 1}`, value }
        })
      } else if (data && typeof data === 'object' && !Array.isArray(data)) {
        rows = Object.entries(data).map(([k, v]) => ({ name: String(k), value: v }))
      }
      return (
        <div style={{ overflow: 'auto', height: '100%', padding: '8px' }}>
          <table style={{ width: '100%', fontSize: '12px', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ borderBottom: `1px solid ${borderColor}` }}>
                <th style={{ textAlign: 'left', padding: '6px', color: mutedColor }}>Name</th>
                <th style={{ textAlign: 'right', padding: '6px', color: mutedColor }}>Value</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r, i) => (
                <tr key={i} style={{ borderBottom: `1px solid ${borderColor}` }}>
                  <td style={{ padding: '6px', color: textColor }}>{r.name ?? r.label ?? r.date ?? r.day}</td>
                  <td style={{ padding: '6px', textAlign: 'right', color: textColor }}>
                    {typeof r.value === 'number' && (r.value > 100 || r.value < 0) ? formatCurrency(r.value) : String(r.value ?? r.revenue ?? '—')}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {rows.length === 0 && <div style={{ padding: '16px', color: mutedColor, textAlign: 'center' }}>No data</div>}
        </div>
      )
    }

    // Chart data: weekly_revenue / monthly_revenue are { date, day/month, revenue }; order_status_breakdown is { [status]: count }; top_products is array of { product_name, quantity, revenue }
    let chartData = []
    let dataKey = 'value'
    let nameKey = 'name'
    if (Array.isArray(data) && data.length > 0) {
      const first = data[0]
      if (first.revenue !== undefined) {
        chartData = data.map(d => ({ name: d.day ?? d.month ?? d.date, value: d.revenue }))
      } else if (first.quantity !== undefined || first.total_quantity !== undefined) {
        chartData = data.map(d => ({ name: d.product_name || d.name, value: d.total_quantity ?? d.quantity ?? d.total_revenue ?? d.revenue }))
      } else {
        chartData = data.map(d => ({ name: String(d.name ?? d), value: Number(d.value ?? d) }))
      }
    } else if (data && typeof data === 'object' && !Array.isArray(data)) {
      chartData = Object.entries(data).map(([k, v]) => ({ name: k, value: Number(v) }))
    }

    if (chartData.length === 0) {
      return <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', color: mutedColor }}>No data</div>
    }

    const chartHeight = size === 'large' ? 220 : size === 'medium' ? 160 : 120

    if (currentChart === 'line') {
      return (
        <ResponsiveContainer width="100%" height={chartHeight}>
          <LineChart data={chartData} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke={borderColor} />
            <XAxis dataKey="name" tick={{ fontSize: 10, fill: mutedColor }} />
            <YAxis tick={{ fontSize: 10, fill: mutedColor }} tickFormatter={v => (v >= 1000 ? `$${v / 1000}k` : `$${v}`)} />
            <Tooltip formatter={v => [formatCurrency(v), '']} contentStyle={{ backgroundColor: cardBg, border: `1px solid ${borderColor}` }} />
            <Line type="monotone" dataKey="value" stroke={themeColor} strokeWidth={2} dot={{ r: 3 }} />
          </LineChart>
        </ResponsiveContainer>
      )
    }
    if (currentChart === 'bar') {
      return (
        <ResponsiveContainer width="100%" height={chartHeight}>
          <BarChart data={chartData} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke={borderColor} />
            <XAxis dataKey="name" tick={{ fontSize: 10, fill: mutedColor }} />
            <YAxis tick={{ fontSize: 10, fill: mutedColor }} tickFormatter={v => (v >= 1000 ? `$${v / 1000}k` : `$${v}`)} />
            <Tooltip formatter={v => [formatCurrency(v), '']} contentStyle={{ backgroundColor: cardBg, border: `1px solid ${borderColor}` }} />
            <Bar dataKey="value" fill={themeColor} radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      )
    }
    if (currentChart === 'area') {
      return (
        <ResponsiveContainer width="100%" height={chartHeight}>
          <AreaChart data={chartData} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke={borderColor} />
            <XAxis dataKey="name" tick={{ fontSize: 10, fill: mutedColor }} />
            <YAxis tick={{ fontSize: 10, fill: mutedColor }} tickFormatter={v => (v >= 1000 ? `$${v / 1000}k` : `$${v}`)} />
            <Tooltip formatter={v => [formatCurrency(v), '']} contentStyle={{ backgroundColor: cardBg, border: `1px solid ${borderColor}` }} />
            <Area type="monotone" dataKey="value" stroke={themeColor} fill={themeColor} fillOpacity={0.3} />
          </AreaChart>
        </ResponsiveContainer>
      )
    }
    if (currentChart === 'pie' || currentChart === 'donut') {
      return (
        <ResponsiveContainer width="100%" height={chartHeight}>
          <PieChart>
            <Pie
              data={chartData}
              dataKey="value"
              nameKey="name"
              cx="50%"
              cy="50%"
              innerRadius={currentChart === 'donut' ? '55%' : 0}
              outerRadius="80%"
              paddingAngle={2}
              label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
            >
              {chartData.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
            </Pie>
            <Tooltip formatter={v => [formatCurrency(v), '']} contentStyle={{ backgroundColor: cardBg, border: `1px solid ${borderColor}` }} />
          </PieChart>
        </ResponsiveContainer>
      )
    }

    return <div style={{ padding: '16px', color: mutedColor }}>No data</div>
  }

  return (
    <div
      style={{
        backgroundColor: cardBg,
        border: `1px solid ${borderColor}`,
        borderRadius: '12px',
        overflow: 'hidden',
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        boxShadow: isDarkMode ? '0 2px 8px rgba(0,0,0,0.2)' : '0 2px 8px rgba(0,0,0,0.06)'
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '8px 12px', borderBottom: `1px solid ${borderColor}`, flexShrink: 0 }}>
        <span style={{ fontSize: '13px', fontWeight: 600, color: textColor }}>{def.label}</span>
        <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
          {supportedCharts.length > 1 && (
            <div style={{ position: 'relative' }}>
              <button
                type="button"
                onClick={() => setChartMenuOpen(!chartMenuOpen)}
                style={{
                  background: 'none',
                  border: 'none',
                  padding: '4px',
                  cursor: 'pointer',
                  color: mutedColor,
                  display: 'flex',
                  alignItems: 'center'
                }}
                title="Chart type"
              >
                <ChevronDown size={16} />
              </button>
              {chartMenuOpen && (
                <>
                  <div style={{ position: 'fixed', inset: 0, zIndex: 10 }} onClick={() => setChartMenuOpen(false)} />
                  <div
                    style={{
                      position: 'absolute',
                      top: '100%',
                      right: 0,
                      marginTop: '4px',
                      backgroundColor: cardBg,
                      border: `1px solid ${borderColor}`,
                      borderRadius: '8px',
                      boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
                      zIndex: 11,
                      minWidth: '140px',
                      padding: '4px 0'
                    }}
                  >
                    {supportedCharts.map(cid => {
                      const ct = CHART_TYPES.find(t => t.id === cid)
                      return (
                        <button
                          key={cid}
                          type="button"
                          onClick={() => { onChartTypeChange(cid); setChartMenuOpen(false) }}
                          style={{
                            width: '100%',
                            padding: '8px 12px',
                            textAlign: 'left',
                            border: 'none',
                            background: currentChart === cid ? (isDarkMode ? '#333' : '#f0f0f0') : 'transparent',
                            color: textColor,
                            cursor: 'pointer',
                            fontSize: '13px'
                          }}
                        >
                          {ct?.label ?? cid}
                        </button>
                      )
                    })}
                  </div>
                </>
              )}
            </div>
          )}
          {onRemove && (
            <button type="button" onClick={onRemove} style={{ background: 'none', border: 'none', padding: '4px', cursor: 'pointer', color: mutedColor }} title="Remove widget">
              <X size={16} />
            </button>
          )}
        </div>
      </div>
      <div style={{ flex: 1, minHeight: 0 }}>{renderContent()}</div>
    </div>
  )
}
