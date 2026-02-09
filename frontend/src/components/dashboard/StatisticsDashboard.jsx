import { useState, useEffect, useCallback } from 'react'
import { useTheme } from '../../contexts/ThemeContext'
import { BarChart2, FileText } from 'lucide-react'
import DashboardGrid from './DashboardGrid'
import WidgetLibrary from './WidgetLibrary'
import {
  getWidgetById,
  WIDGET_SIZES,
  STORAGE_KEY_LAYOUT,
  STORAGE_KEY_WIDGETS
} from './widgetRegistry'

function formatCurrency(value) {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', minimumFractionDigits: 0, maximumFractionDigits: 0 }).format(value)
}

function hexToRgb(hex) {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex)
  return result ? `${parseInt(result[1], 16)}, ${parseInt(result[2], 16)}, ${parseInt(result[3], 16)}` : '132, 0, 255'
}

const DEFAULT_WIDGETS = [
  { id: 'layout-0', widgetId: 'revenue', chartType: 'number', size: 'small', timeRange: 'today' },
  { id: 'layout-1', widgetId: 'revenue_chart', chartType: 'bar', size: 'medium', timeRange: 'week' },
  { id: 'layout-2', widgetId: 'order_status', chartType: 'donut', size: 'medium', timeRange: 'all' }
]

function getDefaultLayout() {
  return DEFAULT_WIDGETS.map((w, i) => {
    const def = getWidgetById(w.widgetId)
    const sz = WIDGET_SIZES[w.size] || WIDGET_SIZES.medium
    return {
      i: w.id,
      x: (i % 2) * 2,
      y: Math.floor(i / 2) * 2,
      w: sz.w,
      h: sz.h,
      minW: 1,
      minH: 1
    }
  })
}

function loadSavedLayout() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY_LAYOUT)
    if (raw) return JSON.parse(raw)
  } catch (_) {}
  return null
}

const LEGACY_REVENUE_IDS = { revenue_today: 'today', revenue_week: 'week', revenue_month: 'month', revenue_all_time: 'all' }
const LEGACY_TO_REVENUE_CHART = { weekly_revenue: 'week', monthly_revenue: 'month' }
const LEGACY_TOP_PRODUCTS_IDS = { top_products_weekly: 'week', top_products_yearly: 'year' }

function loadSavedWidgets() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY_WIDGETS)
    const list = raw ? JSON.parse(raw) : null
    if (!Array.isArray(list)) return null
    return list.map(w => {
      const range = LEGACY_REVENUE_IDS[w.widgetId]
      if (range != null) return { ...w, widgetId: 'revenue', timeRange: w.timeRange ?? range }
      const chartRange = LEGACY_TO_REVENUE_CHART[w.widgetId]
      if (chartRange != null) return { ...w, widgetId: 'revenue_chart', timeRange: w.timeRange ?? chartRange }
      const topRange = LEGACY_TOP_PRODUCTS_IDS[w.widgetId]
      if (topRange != null) return { ...w, widgetId: 'top_products', timeRange: w.timeRange ?? topRange }
      return w
    })
  } catch (_) {}
  return null
}

export default function StatisticsDashboard() {
  const { themeColor } = useTheme()
  const [isDarkMode, setIsDarkMode] = useState(() => document.documentElement.classList.contains('dark-theme'))
  const [activeTab, setActiveTab] = useState('charts') // 'charts' | 'reports'
  const [stats, setStats] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [widgetLibraryOpen, setWidgetLibraryOpen] = useState(false)
  const [layout, setLayout] = useState(() => {
    const saved = loadSavedLayout()
    return Array.isArray(saved) && saved.length > 0 ? saved : getDefaultLayout()
  })
  const [widgets, setWidgets] = useState(() => {
    const saved = loadSavedWidgets()
    return Array.isArray(saved) && saved.length > 0 ? saved : DEFAULT_WIDGETS
  })

  useEffect(() => {
    const check = () => setIsDarkMode(document.documentElement.classList.contains('dark-theme'))
    const obs = new MutationObserver(check)
    obs.observe(document.documentElement, { attributes: true, attributeFilter: ['class'] })
    return () => obs.disconnect()
  }, [])

  useEffect(() => {
    let cancelled = false
    setLoading(true)
    setError(null)
    fetch('/api/dashboard/statistics')
      .then(res => {
        if (!res.ok) throw new Error('Failed to load statistics')
        return res.json()
      })
      .then(data => {
        if (!cancelled) {
          if (data && data.error) setError(data.message || data.error)
          else setStats(data)
        }
      })
      .catch(err => {
        if (!cancelled) setError(err.message || 'Error loading statistics')
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })
    return () => { cancelled = true }
  }, [])

  // Persist layout and widgets to localStorage so time frame, chart style, add/remove all save
  const persist = useCallback((newLayout, newWidgets) => {
    if (newLayout != null) localStorage.setItem(STORAGE_KEY_LAYOUT, JSON.stringify(newLayout))
    if (newWidgets != null) localStorage.setItem(STORAGE_KEY_WIDGETS, JSON.stringify(newWidgets))
  }, [])

  const onLayoutChange = useCallback(
    (newLayout) => {
      setLayout(newLayout)
      persist(newLayout, null)
    },
    [persist]
  )

  const addWidget = useCallback(
    (widgetId) => {
      const def = getWidgetById(widgetId)
      if (!def) return
      const id = `layout-${Date.now()}`
      const size = def.defaultSize || 'medium'
      const sz = WIDGET_SIZES[size]
      const newWidget = { id, widgetId, chartType: def.defaultChart || 'number', size, timeRange: def.defaultTimeRange ?? 'all' }
      const maxY = layout.reduce((m, it) => Math.max(m, it.y + it.h), 0)
      const newItem = { i: id, x: 0, y: maxY, w: sz.w, h: sz.h, minW: 1, minH: 1 }
      setLayout(prev => {
        const next = [...prev, newItem]
        persist(next, null)
        return next
      })
      setWidgets(prev => {
        const next = [...prev, newWidget]
        persist(null, next)
        return next
      })
    },
    [layout, persist]
  )

  const removeWidget = useCallback(
    (id) => {
      setLayout(prev => {
        const next = prev.filter(it => it.i !== id)
        persist(next, null)
        return next
      })
      setWidgets(prev => {
        const next = prev.filter(w => w.id !== id)
        persist(null, next)
        return next
      })
    },
    [persist]
  )

  const setWidgetChartType = useCallback(
    (id, chartType) => {
      setWidgets(prev => {
        const next = prev.map(w => (w.id === id ? { ...w, chartType } : w))
        persist(null, next)
        return next
      })
    },
    [persist]
  )

  const setWidgetTimeRange = useCallback(
    (id, timeRange) => {
      setWidgets(prev => {
        const next = prev.map(w => (w.id === id ? { ...w, timeRange } : w))
        persist(null, next)
        return next
      })
    },
    [persist]
  )

  const themeColorRgb = hexToRgb(themeColor || '#8400ff')
  const borderColor = isDarkMode ? '#3a3a3a' : '#e0e0e0'

  const renderReportsTab = () => {
    const bg = isDarkMode ? '#1a1a1a' : '#f5f5f5'
    const textColor = isDarkMode ? '#fff' : '#1a1a1a'
    if (loading) {
      return (
        <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '48px', backgroundColor: bg, color: textColor }}>
          Loading reports…
        </div>
      )
    }
    if (error) {
      return (
        <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '48px', backgroundColor: bg, color: '#c00' }}>
          {error}
        </div>
      )
    }
    if (!stats) return null

    // Match Financial Statements: teal/blue-grey headers, bordered tables (GeneralLedgerTable / BalanceSheetTable)
    const mainHeaderBg = isDarkMode ? '#2d4a5a' : '#2d5a6b'
    const subHeaderBg = isDarkMode ? '#3a5566' : '#c5d9e0'
    const totalRowBg = isDarkMode ? '#2a3a45' : '#e8e8e8'
    const reportBorderColor = isDarkMode ? '#3a4a55' : '#d0d0d0'
    const reportTextColor = isDarkMode ? '#e8e8e8' : '#333'
    const subHeaderText = isDarkMode ? '#c8d4dc' : '#2d4a5a'
    const cellBg = isDarkMode ? '#1f2a33' : '#fff'

    const mainHeaderStyle = {
      padding: '12px 16px',
      fontSize: '13px',
      fontWeight: 700,
      color: '#fff',
      backgroundColor: mainHeaderBg,
      textTransform: 'uppercase',
      letterSpacing: '0.02em',
      border: `1px solid ${reportBorderColor}`,
      borderBottom: 'none'
    }
    const subHeaderStyle = {
      padding: '8px 12px',
      fontSize: '12px',
      fontWeight: 700,
      color: subHeaderText,
      backgroundColor: subHeaderBg,
      textTransform: 'uppercase',
      letterSpacing: '0.02em',
      border: `1px solid ${reportBorderColor}`,
      borderTop: 'none'
    }
    const cellStyle = {
      padding: '8px 12px',
      fontSize: '14px',
      color: reportTextColor,
      border: `1px solid ${reportBorderColor}`,
      borderTop: 'none',
      backgroundColor: cellBg
    }
    const totalRowStyle = {
      padding: '10px 12px',
      fontSize: '14px',
      fontWeight: 700,
      color: reportTextColor,
      backgroundColor: totalRowBg,
      border: `1px solid ${reportBorderColor}`,
      borderTop: `2px solid ${reportBorderColor}`
    }
    const tableStyle = { width: '100%', borderCollapse: 'collapse', fontSize: '14px', marginBottom: '24px' }

    const todayRev = stats.revenue?.today ?? 0
    const todayReturns = stats.returns?.today ?? 0
    const todayReturnsAmt = stats.returns?.today_amount ?? 0
    const weekRev = stats.revenue?.week ?? 0
    const monthRev = stats.revenue?.month ?? 0
    const allTimeRev = stats.revenue?.all_time ?? 0
    const avgOrder = stats.avg_order_value ?? 0
    const totalOrders = stats.total_orders ?? 0
    const returnsRate = stats.returns_rate ?? 0
    const inv = stats.inventory ?? {}
    const discount = stats.discount ?? {}
    const weekly = stats.weekly_revenue ?? []
    const weeklyTotal = weekly.reduce((s, d) => s + (d.revenue || 0), 0)
    const statusBreakdown = stats.order_status_breakdown ?? {}
    const topProducts = stats.top_products ?? []
    const customersTotal = stats.customers_total ?? 0
    const customersRewards = stats.customers_in_rewards ?? 0
    const reportDate = new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })

    return (
      <div style={{ overflowY: 'auto', overflowX: 'hidden', flex: 1, minHeight: 0, padding: '24px', boxSizing: 'border-box', backgroundColor: isDarkMode ? '#1a1a1a' : '#f5f5f5' }}>
        {/* Report title banner — same pattern as financial statements */}
        <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: '24px', border: `1px solid ${reportBorderColor}`, borderRadius: '8px', overflow: 'hidden' }}>
          <tbody>
            <tr>
              <td style={{ ...mainHeaderStyle, borderRadius: 0 }}>Statistics Report</td>
            </tr>
            <tr>
              <td style={{ padding: '8px 16px', fontSize: '12px', color: subHeaderText, backgroundColor: subHeaderBg, border: `1px solid ${reportBorderColor}`, borderTop: 'none' }}>As of {reportDate}</td>
            </tr>
          </tbody>
        </table>

        {/* Executive summary table */}
        <table style={tableStyle}>
          <thead>
            <tr><td colSpan={2} style={subHeaderStyle}>Executive Summary</td></tr>
          </thead>
          <tbody>
            <tr><td style={cellStyle}>Today&apos;s revenue</td><td style={{ ...cellStyle, textAlign: 'right' }}>{formatCurrency(todayRev)}</td></tr>
            <tr><td style={cellStyle}>Today&apos;s returns (count)</td><td style={{ ...cellStyle, textAlign: 'right' }}>{todayReturns}</td></tr>
            {todayReturns > 0 && <tr><td style={cellStyle}>Today&apos;s returns (amount refunded)</td><td style={{ ...cellStyle, textAlign: 'right' }}>{formatCurrency(todayReturnsAmt)}</td></tr>}
            <tr><td style={cellStyle}>Revenue — last 7 days</td><td style={{ ...cellStyle, textAlign: 'right' }}>{formatCurrency(weekRev)}</td></tr>
            <tr><td style={cellStyle}>Revenue — month to date</td><td style={{ ...cellStyle, textAlign: 'right' }}>{formatCurrency(monthRev)}</td></tr>
            <tr><td style={cellStyle}>Revenue — all time</td><td style={{ ...cellStyle, textAlign: 'right' }}>{formatCurrency(allTimeRev)}</td></tr>
            <tr><td style={totalRowStyle}>Average order value</td><td style={{ ...totalRowStyle, textAlign: 'right' }}>{formatCurrency(avgOrder)}</td></tr>
            <tr><td style={cellStyle}>Total orders (all time)</td><td style={{ ...cellStyle, textAlign: 'right' }}>{totalOrders}</td></tr>
            <tr><td style={cellStyle}>Returns rate</td><td style={{ ...cellStyle, textAlign: 'right' }}>{returnsRate}%</td></tr>
          </tbody>
        </table>

        {/* Weekly revenue */}
        <table style={tableStyle}>
          <thead>
            <tr><td colSpan={2} style={subHeaderStyle}>Weekly Revenue (Last 7 Days)</td></tr>
          </thead>
          <tbody>
            {weekly.length === 0 ? (
              <tr><td colSpan={2} style={cellStyle}>No revenue data for the last 7 days.</td></tr>
            ) : (
              <>
                {weekly.map((d) => (
                  <tr key={d.date}>
                    <td style={cellStyle}>{d.day} ({d.date})</td>
                    <td style={{ ...cellStyle, textAlign: 'right' }}>{formatCurrency(d.revenue || 0)}</td>
                  </tr>
                ))}
                <tr><td style={totalRowStyle}>Total</td><td style={{ ...totalRowStyle, textAlign: 'right' }}>{formatCurrency(weeklyTotal)}</td></tr>
              </>
            )}
          </tbody>
        </table>

        {/* Order status breakdown */}
        <table style={tableStyle}>
          <thead>
            <tr><td colSpan={2} style={subHeaderStyle}>Order Status Breakdown</td></tr>
          </thead>
          <tbody>
            {Object.keys(statusBreakdown).length === 0 ? (
              <tr><td colSpan={2} style={cellStyle}>No order status data available.</td></tr>
            ) : (
              <>
                {Object.entries(statusBreakdown).map(([status, count]) => (
                  <tr key={status}>
                    <td style={cellStyle}>{status}</td>
                    <td style={{ ...cellStyle, textAlign: 'right' }}>{count} order(s)</td>
                  </tr>
                ))}
              </>
            )}
          </tbody>
        </table>

        {/* Top products */}
        <table style={tableStyle}>
          <thead>
            <tr>
              <td style={subHeaderStyle}>Product</td>
              <td style={{ ...subHeaderStyle, textAlign: 'right' }}>Qty sold</td>
              <td style={{ ...subHeaderStyle, textAlign: 'right' }}>Revenue</td>
            </tr>
          </thead>
          <tbody>
            {topProducts.length === 0 ? (
              <tr><td colSpan={3} style={cellStyle}>No product sales data for the last 30 days.</td></tr>
            ) : (
              topProducts.map((p, i) => (
                <tr key={p.product_id || i}>
                  <td style={cellStyle}>{p.product_name}</td>
                  <td style={{ ...cellStyle, textAlign: 'right' }}>{p.total_quantity}</td>
                  <td style={{ ...cellStyle, textAlign: 'right' }}>{formatCurrency(p.total_revenue || 0)}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>

        {/* Inventory snapshot */}
        <table style={tableStyle}>
          <thead>
            <tr><td colSpan={2} style={subHeaderStyle}>Inventory Snapshot</td></tr>
          </thead>
          <tbody>
            <tr><td style={cellStyle}>Total products</td><td style={{ ...cellStyle, textAlign: 'right' }}>{inv.total_products ?? 0}</td></tr>
            {(inv.low_stock != null && inv.low_stock > 0) && <tr><td style={cellStyle}>Low stock (≤10 units)</td><td style={{ ...cellStyle, textAlign: 'right' }}>{inv.low_stock}</td></tr>}
            <tr><td style={totalRowStyle}>Total inventory value (cost)</td><td style={{ ...totalRowStyle, textAlign: 'right' }}>{formatCurrency(inv.total_value ?? 0)}</td></tr>
          </tbody>
        </table>

        {/* Customers & rewards */}
        <table style={tableStyle}>
          <thead>
            <tr><td colSpan={2} style={subHeaderStyle}>Customers &amp; Rewards</td></tr>
          </thead>
          <tbody>
            <tr><td style={cellStyle}>Total customers</td><td style={{ ...cellStyle, textAlign: 'right' }}>{customersTotal}</td></tr>
            <tr><td style={cellStyle}>Customers with loyalty points</td><td style={{ ...cellStyle, textAlign: 'right' }}>{customersRewards}</td></tr>
          </tbody>
        </table>

        {/* Discounts given */}
        <table style={tableStyle}>
          <thead>
            <tr><td colSpan={2} style={subHeaderStyle}>Discounts Given</td></tr>
          </thead>
          <tbody>
            <tr><td style={cellStyle}>Today</td><td style={{ ...cellStyle, textAlign: 'right' }}>{formatCurrency(discount.today ?? 0)}</td></tr>
            <tr><td style={cellStyle}>Last 7 days</td><td style={{ ...cellStyle, textAlign: 'right' }}>{formatCurrency(discount.week ?? 0)}</td></tr>
            <tr><td style={cellStyle}>This month</td><td style={{ ...cellStyle, textAlign: 'right' }}>{formatCurrency(discount.month ?? 0)}</td></tr>
            <tr><td style={totalRowStyle}>All time</td><td style={{ ...totalRowStyle, textAlign: 'right' }}>{formatCurrency(discount.all_time ?? 0)}</td></tr>
          </tbody>
        </table>
      </div>
    )
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', width: '100%', minHeight: '100vh', overflow: 'hidden' }}>
      <div style={{
        display: 'flex',
        gap: '4px',
        padding: '16px 24px 0',
        borderBottom: `1px solid ${borderColor}`,
        flexShrink: 0,
        backgroundColor: isDarkMode ? '#1a1a1a' : '#f5f5f5'
      }}>
        <button
          type="button"
          onClick={() => setActiveTab('charts')}
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '8px',
            padding: '10px 16px',
            border: 'none',
            borderBottom: activeTab === 'charts' ? `2px solid rgba(${themeColorRgb}, 0.9)` : '2px solid transparent',
            borderRadius: '8px',
            background: activeTab === 'charts' ? (isDarkMode ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.04)') : 'transparent',
            color: activeTab === 'charts' ? (isDarkMode ? '#fff' : '#1a1a1a') : (isDarkMode ? '#999' : '#666'),
            fontSize: '14px',
            fontWeight: 600,
            cursor: 'pointer',
            transition: 'all 0.2s ease'
          }}
        >
          <BarChart2 size={18} /> Charts
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('reports')}
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '8px',
            padding: '10px 16px',
            border: 'none',
            borderBottom: activeTab === 'reports' ? `2px solid rgba(${themeColorRgb}, 0.9)` : '2px solid transparent',
            borderRadius: '8px',
            background: activeTab === 'reports' ? (isDarkMode ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.04)') : 'transparent',
            color: activeTab === 'reports' ? (isDarkMode ? '#fff' : '#1a1a1a') : (isDarkMode ? '#999' : '#666'),
            fontSize: '14px',
            fontWeight: 600,
            cursor: 'pointer',
            transition: 'all 0.2s ease'
          }}
        >
          <FileText size={18} /> Reports
        </button>
      </div>
      {activeTab === 'reports' ? (
        renderReportsTab()
      ) : (
        <div style={{ flex: 1, minHeight: 0, overflow: 'hidden' }}>
      <DashboardGrid
        stats={stats}
        loading={loading}
        error={error}
        layout={layout}
        widgets={widgets}
        onLayoutChange={onLayoutChange}
        onRemoveWidget={removeWidget}
        onWidgetChartTypeChange={setWidgetChartType}
        onWidgetTimeRangeChange={setWidgetTimeRange}
        onOpenWidgetLibrary={() => setWidgetLibraryOpen(true)}
      />
        </div>
      )}
      <WidgetLibrary
        open={widgetLibraryOpen}
        onClose={() => setWidgetLibraryOpen(false)}
        onAddWidget={addWidget}
      />
    </div>
  )
}
