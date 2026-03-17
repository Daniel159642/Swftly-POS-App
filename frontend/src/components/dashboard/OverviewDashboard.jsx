import { useState, useEffect, useRef } from 'react'
import { createPortal } from 'react-dom'
import { useTheme } from '../../contexts/ThemeContext'
import { ChevronDown, X, Plus, Settings, Info, ExternalLink, BarChart2, PieChart, Users, Package, DollarSign, Percent } from 'lucide-react'
import Modal from '../common/Modal'

function MiniChart({ data, color = '#635bff', height = 120 }) {
  const safeData = Array.isArray(data) && data.length > 0 ? data : [0, 0, 0, 0, 0, 0, 0]
  const max = Math.max(...safeData, 0.01)
  const w = 280
  const h = height
  const points = safeData.map((v, i) => ({
    x: (i / Math.max(safeData.length - 1, 1)) * w,
    y: h - (v / max) * h
  }))
  const line = points.map((p, i) => `${i === 0 ? 'M' : 'L'}${p.x},${p.y}`).join(' ')

  return (
    <svg viewBox={`0 0 ${w} ${h}`} style={{ width: '100%', height }} preserveAspectRatio="none">
      <path d={line} fill="none" stroke={color} strokeWidth="2.5" />
    </svg>
  )
}

const CHART_TYPE_OPTIONS = [
  { id: 'line', label: 'Line' },
  { id: 'bar', label: 'Bar' },
  { id: 'area', label: 'Area' }
]

function MiniChartWithTooltip({
  data,
  dates = [],
  title,
  color = '#635bff',
  height = 120,
  formatValue = (v) => String(v),
  comparisonValue,
  comparisonLabel = 'Previous period',
  theme: { cardBg, borderColor, textColor, mutedColor },
  chartType = 'line',
  tooltipFixedPosition = false
}) {
  const containerRef = useRef(null)
  const [hoverIndex, setHoverIndex] = useState(null)
  const [tooltipPos, setTooltipPos] = useState(null)

  const safeData = Array.isArray(data) && data.length > 0 ? data : [0, 0, 0, 0, 0, 0, 0]
  const max = Math.max(...safeData, 0.01)
  const w = 280
  const h = height
  const n = safeData.length
  const points = safeData.map((v, i) => ({
    x: (i / Math.max(n - 1, 1)) * w,
    y: h - (v / max) * h
  }))
  const line = points.map((p, i) => `${i === 0 ? 'M' : 'L'}${p.x},${p.y}`).join(' ')
  const areaPath = line + ` L ${w},${h} L 0,${h} Z`
  const barWidth = n > 0 ? (w / n) * 0.7 : 0
  const barGap = n > 0 ? (w / n) * 0.15 : 0

  const handleMouseMove = (e) => {
    const el = containerRef.current
    if (!el) return
    const rect = el.getBoundingClientRect()
    const x = e.clientX - rect.left
    const pct = rect.width > 0 ? x / rect.width : 0
    const index = Math.min(Math.max(0, Math.round(pct * (n - 1))), n - 1)
    setHoverIndex(index)
  }

  const handleMouseLeave = () => setHoverIndex(null)

  // When tooltipFixedPosition (e.g. inside modal), update tooltip position so it isn't clipped; use rAF to track scroll/resize
  useEffect(() => {
    if (!tooltipFixedPosition || hoverIndex == null || !containerRef.current) {
      setTooltipPos(null)
      return
    }
    const updatePos = () => {
      if (!containerRef.current) return
      const rect = containerRef.current.getBoundingClientRect()
      const pct = n > 1 ? hoverIndex / (n - 1) : 0
      setTooltipPos({
        x: rect.left + pct * rect.width,
        y: rect.top - 10
      })
    }
    updatePos()
    const rafId = { current: null }
    const tick = () => {
      updatePos()
      rafId.current = requestAnimationFrame(tick)
    }
    rafId.current = requestAnimationFrame(tick)
    const onResize = () => updatePos()
    window.addEventListener('resize', onResize)
    return () => {
      if (rafId.current) cancelAnimationFrame(rafId.current)
      window.removeEventListener('resize', onResize)
      setTooltipPos(null)
    }
  }, [tooltipFixedPosition, hoverIndex, n])

  const dateLabel = (Array.isArray(dates) && dates[hoverIndex] != null) ? dates[hoverIndex] : (hoverIndex != null ? `Point ${hoverIndex + 1}` : '')
  const valueAtPoint = hoverIndex != null ? safeData[hoverIndex] : 0

  const tooltipContent = hoverIndex != null && (
    <div
      role="tooltip"
      style={{
        position: tooltipFixedPosition && tooltipPos ? 'fixed' : 'absolute',
        ...(tooltipFixedPosition && tooltipPos
          ? { left: tooltipPos.x, top: tooltipPos.y, transform: 'translate(-50%, -100%)', zIndex: 10002 }
          : {
              left: `${(hoverIndex / Math.max(safeData.length - 1, 1)) * 100}%`,
              bottom: '100%',
              transform: 'translate(-50%, -10px)',
              zIndex: 10001
            }),
        minWidth: 160,
        padding: '10px 12px',
        background: cardBg,
        border: `1px solid ${borderColor}`,
        borderRadius: 8,
        boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
        pointerEvents: 'none'
      }}
    >
      <div style={{ fontSize: 12, fontWeight: 600, color: textColor, marginBottom: 8 }}>{title}</div>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, fontSize: 13, color: textColor }}>
        <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <span style={{ width: 8, height: 8, borderRadius: 2, background: color }} />
          {dateLabel}
        </span>
        <span style={{ fontWeight: 600 }}>{formatValue(valueAtPoint)}</span>
      </div>
      {comparisonValue != null && (
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, fontSize: 13, color: mutedColor, marginTop: 4 }}>
          <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <span style={{ width: 8, height: 8, borderRadius: 2, background: mutedColor }} />
            {comparisonLabel}
          </span>
          <span style={{ fontWeight: 500 }}>{formatValue(comparisonValue)}</span>
        </div>
      )}
    </div>
  )

  return (
    <div
      ref={containerRef}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      style={{ position: 'relative', width: '100%', cursor: 'crosshair' }}
    >
      <svg viewBox={`0 0 ${w} ${h}`} style={{ width: '100%', height, display: 'block' }} preserveAspectRatio="none">
        {chartType === 'area' && <path d={areaPath} fill={color} fillOpacity={0.25} />}
        {chartType === 'area' && <path d={line} fill="none" stroke={color} strokeWidth="2.5" />}
        {chartType === 'line' && <path d={line} fill="none" stroke={color} strokeWidth="2.5" />}
        {chartType === 'bar' && safeData.map((v, i) => {
          const barH = max > 0 ? (v / max) * h : 0
          const x = i * (w / n) + barGap
          return (
            <rect
              key={i}
              x={x}
              y={h - barH}
              width={barWidth}
              height={barH}
              fill={color}
              rx={2}
              ry={2}
            />
          )
        })}
        {hoverIndex != null && (
          <g>
            <line
              x1={points[hoverIndex].x}
              y1={0}
              x2={points[hoverIndex].x}
              y2={h}
              stroke={mutedColor}
              strokeWidth="1"
              strokeDasharray="4 3"
              opacity={0.8}
            />
            {chartType !== 'bar' && (
              <circle
                cx={points[hoverIndex].x}
                cy={points[hoverIndex].y}
                r={5}
                fill={color}
                stroke={cardBg}
                strokeWidth="2"
              />
            )}
            {chartType === 'bar' && (
              <rect
                x={hoverIndex * (w / n) + barGap}
                y={h - (max > 0 ? (safeData[hoverIndex] / max) * h : 0)}
                width={barWidth}
                height={max > 0 ? (safeData[hoverIndex] / max) * h : 0}
                fill={color}
                opacity={0.8}
                stroke={cardBg}
                strokeWidth="2"
                rx={2}
                ry={2}
              />
            )}
          </g>
        )}
      </svg>
      {tooltipFixedPosition && tooltipContent && tooltipPos
        ? createPortal(tooltipContent, document.body)
        : tooltipContent}
    </div>
  )
}

function Dropdown({ label, value, options, onSelect, removable = false, onRemove, isDarkMode, borderColor, bg, textColor, mutedColor, chartColor }) {
  const [open, setOpen] = useState(false)
  const themeColor = chartColor || '#635bff'
  const themeColorRgb = themeColor.startsWith('#') ? 
    `${parseInt(themeColor.slice(1, 3), 16)}, ${parseInt(themeColor.slice(3, 5), 16)}, ${parseInt(themeColor.slice(5, 7), 16)}` :
    '99, 91, 255'
  return (
    <div style={{ position: 'relative', display: 'inline-flex', alignItems: 'center' }}>
      <button
        type="button"
        onClick={() => setOpen(!open)}
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 4,
          background: bg,
          border: `1px solid ${borderColor}`,
          borderRadius: 20,
          padding: '6px 12px',
          fontSize: 13,
          cursor: 'pointer',
          color: textColor,
          fontWeight: 500
        }}
      >
        {label && <span style={{ color: mutedColor, marginRight: 2 }}>{label}</span>}
        <span>{value}</span>
        <ChevronDown size={14} color={mutedColor} style={{ flexShrink: 0 }} />
      </button>
      {removable && (
        <button type="button" onClick={onRemove} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 2, marginLeft: -4 }}>
          <X size={14} color={mutedColor} />
        </button>
      )}
      {open && (
        <>
          <div style={{ position: 'fixed', inset: 0, zIndex: 9 }} onClick={() => setOpen(false)} aria-hidden="true" />
          <div
            style={{
              position: 'absolute',
              top: '100%',
              left: 0,
              marginTop: 4,
              background: bg,
              border: `1px solid ${borderColor}`,
              borderRadius: 8,
              boxShadow: isDarkMode ? '0 4px 12px rgba(0,0,0,0.4)' : '0 4px 12px rgba(0,0,0,0.1)',
              zIndex: 10,
              minWidth: 160,
              overflow: 'hidden'
            }}
          >
            {options.map((o) => (
              <div
                key={o}
                role="button"
                tabIndex={0}
                onClick={() => { onSelect(o); setOpen(false) }}
                onKeyDown={(e) => { if (e.key === 'Enter') { onSelect(o); setOpen(false) } }}
                style={{
                  padding: '8px 14px',
                  fontSize: 13,
                  cursor: 'pointer',
                  background: o === value ? (isDarkMode ? `rgba(${themeColorRgb}, 0.2)` : `rgba(${themeColorRgb}, 0.1)`) : bg,
                  color: o === value ? themeColor : textColor
                }}
              >
                {o}
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  )
}

function InfoWithPopover({ description, cardBg, borderColor, textColor, mutedColor, isDarkMode }) {
  const [open, setOpen] = useState(false)
  const ref = useRef(null)

  useEffect(() => {
    if (!open) return
    const close = (e) => {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false)
    }
    document.addEventListener('click', close)
    return () => document.removeEventListener('click', close)
  }, [open])

  return (
    <div ref={ref} style={{ position: 'relative', display: 'inline-flex' }}>
      <button
        type="button"
        onClick={(e) => { e.stopPropagation(); setOpen((o) => !o) }}
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          background: 'none',
          border: 'none',
          padding: 2,
          cursor: 'pointer',
          color: mutedColor,
          borderRadius: '50%'
        }}
        aria-label="What is this?"
        aria-expanded={open}
      >
        <Info size={13} />
      </button>
      {open && (
        <div
          role="tooltip"
          style={{
            position: 'absolute',
            left: 0,
            top: '100%',
            marginTop: 6,
            width: 220,
            maxWidth: 'min(220px, 90vw)',
            padding: '10px 12px',
            background: cardBg,
            border: `1px solid ${borderColor}`,
            borderRadius: 8,
            boxShadow: isDarkMode ? '0 4px 12px rgba(0,0,0,0.4)' : '0 4px 12px rgba(0,0,0,0.12)',
            zIndex: 20,
            fontSize: 12,
            lineHeight: 1.4,
            color: textColor
          }}
        >
          {description}
        </div>
      )}
    </div>
  )
}

function formatCurrency(value) {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(value || 0)
}

// Map order_status_breakdown + revenue/returns to payment-like rows
function buildPaymentsFromStats(stats) {
  const breakdown = stats?.order_status_breakdown ?? {}
  const rev = stats?.revenue ?? {}
  const ret = stats?.returns ?? {}
  const completed = Number(breakdown.completed ?? breakdown.paid ?? 0)
  const voided = Number(breakdown.voided ?? 0)
  const placed = Number(breakdown.placed ?? 0)
  return [
    { type: 'Successful', count: completed, amount: rev?.today ?? rev?.week ?? 0, color: '#22c55e' },
    { type: 'Refunded', count: ret?.today ?? 0, amount: ret?.today_amount ?? 0, color: '#f59e0b' },
    { type: 'Uncaptured', count: 0, amount: 0, color: '#94a3b8' },
    { type: 'Failed', count: voided, amount: 0, color: '#ef4444' },
    { type: 'Pending', count: placed, amount: 0, color: '#635bff' }
  ]
}

const MAIN_WIDGET_IDS_TOP = ['payments', 'gross_volume', 'net_volume']
const MAIN_WIDGET_IDS_BOTTOM = []
const DEFAULT_VISIBLE_MAIN = [...MAIN_WIDGET_IDS_TOP, ...MAIN_WIDGET_IDS_BOTTOM]

const ADDABLE_STAT_OPTIONS = [
  { id: 'weekly_revenue_chart', label: 'Weekly revenue chart', description: 'Line chart of revenue for the last 7 days', icon: BarChart2 },
  { id: 'order_status_breakdown', label: 'Order status breakdown', description: 'Count of orders by status (completed, voided, placed, etc.)', icon: PieChart },
  { id: 'top_products', label: 'Top products', description: 'Best-selling products by quantity and revenue (last 30 days)', icon: Package },
  { id: 'today_revenue', label: "Today's revenue", description: "Single card showing today's total revenue", icon: DollarSign },
  { id: 'inventory_snapshot', label: 'Inventory snapshot', description: 'Total products, low-stock count, and inventory value', icon: Package },
  { id: 'discounts_summary', label: 'Discounts summary', description: 'Discounts given today, this week, and this month', icon: Percent },
  { id: 'customers_count', label: 'Customers & rewards', description: 'Total customers and customers with loyalty points', icon: Users }
]

export default function OverviewDashboard() {
  const { themeColor } = useTheme()
  const [isDarkMode, setIsDarkMode] = useState(() => document.documentElement.classList.contains('dark-theme'))
  const [stats, setStats] = useState(null)
  const [topCustomers, setTopCustomers] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [dateRange, setDateRange] = useState('Last 7 days')
  const [granularity, setGranularity] = useState('Daily')
  const [dataMode, setDataMode] = useState(() => {
    try { return localStorage.getItem('overview_data_mode') || 'volume' } catch (_) { return 'volume' }
  })
  const [backfillState, setBackfillState] = useState('idle') // 'idle' | 'running' | 'done' | 'error'
  const [popularProducts, setPopularProducts] = useState([])
  const [popularLoading, setPopularLoading] = useState(true)
  const [restockItems, setRestockItems] = useState([])
  const [restockLoading, setRestockLoading] = useState(true)
  const [hoveredProduct, setHoveredProduct] = useState(null)
  const [hoveredProductPos, setHoveredProductPos] = useState({ x: 0, y: 0 })
  const [hoveredRestock, setHoveredRestock] = useState(null)
  const [hoveredRestockPos, setHoveredRestockPos] = useState({ x: 0, y: 0 })
  const [customerData, setCustomerData] = useState(null)
  const [customerLoading, setCustomerLoading] = useState(true)
  const [customerDays, setCustomerDays] = useState(30)
  const [employeeData, setEmployeeData] = useState([])
  const [employeeLoading, setEmployeeLoading] = useState(true)
  const [employeeDays, setEmployeeDays] = useState(30)
  const [employeeSortKey, setEmployeeSortKey] = useState('revenue_total')
  const [hoveredEmployee, setHoveredEmployee] = useState(null)
  const [hoveredEmployeePos, setHoveredEmployeePos] = useState({ x: 0, y: 0 })
  const [editMode, setEditMode] = useState(false)
  const [addModalOpen, setAddModalOpen] = useState(false)
  const [detailModalStatId, setDetailModalStatId] = useState(null) // 'gross_volume' | 'net_volume' | null
  const [draggedId, setDraggedId] = useState(null)
  const [draggedFrom, setDraggedFrom] = useState(null) // 'main' | 'added'
  const [dragOverId, setDragOverId] = useState(null)
  const [chartTypeByStatId, setChartTypeByStatId] = useState(() => {
    try {
      const saved = localStorage.getItem('overview_chart_type')
      if (saved) {
        const parsed = JSON.parse(saved)
        return typeof parsed === 'object' && parsed !== null ? parsed : {}
      }
    } catch (_) {}
    return {}
  })
  const [visibleMainWidgets, setVisibleMainWidgets] = useState(() => {
    try {
      const saved = localStorage.getItem('overview_visible_main_widgets')
      if (saved) {
        const parsed = JSON.parse(saved)
        return Array.isArray(parsed) && parsed.length > 0 ? parsed : DEFAULT_VISIBLE_MAIN
      }
    } catch (_) {}
    return DEFAULT_VISIBLE_MAIN
  })
  const [addedWidgetIds, setAddedWidgetIds] = useState(() => {
    try {
      const saved = localStorage.getItem('overview_added_widgets')
      if (saved) {
        const parsed = JSON.parse(saved)
        return Array.isArray(parsed) ? parsed : []
      }
    } catch (_) {}
    return []
  })

  useEffect(() => {
    const check = () => setIsDarkMode(document.documentElement.classList.contains('dark-theme'))
    const obs = new MutationObserver(check)
    obs.observe(document.documentElement, { attributes: true, attributeFilter: ['class'] })
    return () => obs.disconnect()
  }, [])

  useEffect(() => {
    try {
      localStorage.setItem('overview_added_widgets', JSON.stringify(addedWidgetIds))
    } catch (_) {}
  }, [addedWidgetIds])

  useEffect(() => {
    try {
      localStorage.setItem('overview_visible_main_widgets', JSON.stringify(visibleMainWidgets))
    } catch (_) {}
  }, [visibleMainWidgets])

  useEffect(() => {
    try {
      localStorage.setItem('overview_chart_type', JSON.stringify(chartTypeByStatId))
    } catch (_) {}
  }, [chartTypeByStatId])

  const setChartTypeForStat = (statId, type) => {
    setChartTypeByStatId((prev) => ({ ...prev, [statId]: type }))
  }

  const handleRemoveMainWidget = (id) => {
    const next = visibleMainWidgets.filter((x) => x !== id)
    setVisibleMainWidgets(next)
    try {
      localStorage.setItem('overview_visible_main_widgets', JSON.stringify(next))
    } catch (_) {}
  }

  const handleAddWidget = (id) => {
    if (!addedWidgetIds.includes(id)) {
      const next = [...addedWidgetIds, id]
      setAddedWidgetIds(next)
      try {
        localStorage.setItem('overview_added_widgets', JSON.stringify(next))
      } catch (_) {}
    }
    setAddModalOpen(false)
  }

  const handleRemoveAddedWidget = (id) => {
    const next = addedWidgetIds.filter((x) => x !== id)
    setAddedWidgetIds(next)
    try {
      localStorage.setItem('overview_added_widgets', JSON.stringify(next))
    } catch (_) {}
  }

  const handleDragStart = (e, id, from) => {
    if (!editMode) {
      e.preventDefault()
      return
    }
    // Don't start drag if clicking on a button or link
    if (e.target.tagName === 'BUTTON' || e.target.closest('button') || e.target.tagName === 'A' || e.target.closest('a')) {
      e.preventDefault()
      return
    }
    setDraggedId(id)
    setDraggedFrom(from)
    e.dataTransfer.effectAllowed = 'move'
    e.dataTransfer.setData('text/plain', id)
    e.currentTarget.style.opacity = '0.5'
  }

  const handleDragEnd = (e) => {
    e.currentTarget.style.opacity = '1'
    setDragOverId(null)
    // Don't reset draggedId/draggedFrom here - let handleDrop do it, but reset if drag was cancelled
    if (e.dataTransfer.dropEffect === 'none') {
      setDraggedId(null)
      setDraggedFrom(null)
    }
  }

  const handleDragOver = (e, targetId) => {
    if (!editMode || !draggedId) {
      e.preventDefault()
      return
    }
    e.preventDefault()
    e.stopPropagation()
    e.dataTransfer.dropEffect = 'move'
    if (targetId && draggedId !== targetId) {
      setDragOverId(targetId)
    }
  }

  const handleDragLeave = () => {
    setDragOverId(null)
  }

  const runBackfill = () => {
    setBackfillState('running')
    const sessionToken = localStorage.getItem('sessionToken') || ''
    const authHeaders = sessionToken ? { 'X-Session-Token': sessionToken, 'Authorization': `Bearer ${sessionToken}`, 'Content-Type': 'application/json' } : { 'Content-Type': 'application/json' }
    fetch('/api/accounting/backfill-orders', {
      method: 'POST',
      headers: authHeaders,
      body: JSON.stringify({ days_back: 365 }),
    })
      .then((r) => r.json())
      .then((data) => {
        setBackfillState(data.success ? 'done' : 'error')
        if (data.success) {
          // Re-fetch stats so charts refresh with new ledger data
          setTimeout(() => window.location.reload(), 800)
        }
      })
      .catch(() => setBackfillState('error'))
  }

  const handleDrop = (e, targetId, targetFrom) => {
    e.preventDefault()
    e.stopPropagation()
    setDragOverId(null)
    
    if (!editMode || !draggedId || draggedId === targetId || draggedFrom !== targetFrom) {
      setDraggedId(null)
      setDraggedFrom(null)
      return
    }
    
    if (draggedFrom === 'main' && targetFrom === 'main') {
      // Reorder main widgets
      const newOrder = [...visibleMainWidgets]
      const draggedIndex = newOrder.indexOf(draggedId)
      const targetIndex = newOrder.indexOf(targetId)
      if (draggedIndex !== -1 && targetIndex !== -1 && draggedIndex !== targetIndex) {
        newOrder.splice(draggedIndex, 1)
        newOrder.splice(targetIndex, 0, draggedId)
        setVisibleMainWidgets(newOrder)
        try {
          localStorage.setItem('overview_visible_main_widgets', JSON.stringify(newOrder))
        } catch (_) {}
      }
    } else if (draggedFrom === 'added' && targetFrom === 'added') {
      // Reorder added widgets
      const newOrder = [...addedWidgetIds]
      const draggedIndex = newOrder.indexOf(draggedId)
      const targetIndex = newOrder.indexOf(targetId)
      if (draggedIndex !== -1 && targetIndex !== -1 && draggedIndex !== targetIndex) {
        newOrder.splice(draggedIndex, 1)
        newOrder.splice(targetIndex, 0, draggedId)
        setAddedWidgetIds(newOrder)
        try {
          localStorage.setItem('overview_added_widgets', JSON.stringify(newOrder))
        } catch (_) {}
      }
    }
    setDraggedId(null)
    setDraggedFrom(null)
  }

  useEffect(() => {
    let cancelled = false
    setLoading(true)
    setError(null)
    const dateRangeParam = dateRange.toLowerCase().replace(/\s+/g, '_')
    const granularityParam = granularity.toLowerCase()
    const sessionToken = localStorage.getItem('sessionToken') || ''
    const authHeaders = sessionToken ? { 'X-Session-Token': sessionToken, 'Authorization': `Bearer ${sessionToken}` } : {}
    Promise.all([
      fetch(`/api/dashboard/statistics?date_range=${encodeURIComponent(dateRangeParam)}&granularity=${encodeURIComponent(granularityParam)}`, { headers: authHeaders }).then((r) => (r.ok ? r.json() : Promise.reject(new Error('Failed to load statistics')))),
      fetch('/api/dashboard/top_customers?limit=5', { headers: authHeaders }).then((r) => (r.ok ? r.json() : { data: [] })).catch(() => ({ data: [] }))
    ])
      .then(([statsData, customersData]) => {
        if (!cancelled) {
          setStats(statsData?.error ? null : statsData)
          setTopCustomers(Array.isArray(customersData?.data) ? customersData.data : [])
        }
      })
      .catch((err) => { if (!cancelled) setError(err.message || 'Error loading overview') })
      .finally(() => { if (!cancelled) setLoading(false) })
    return () => { cancelled = true }
  }, [dateRange, granularity])

  useEffect(() => {
    let cancelled = false
    const sessionToken = localStorage.getItem('sessionToken') || ''
    const authHeaders = sessionToken ? { 'X-Session-Token': sessionToken, 'Authorization': `Bearer ${sessionToken}` } : {}
    setPopularLoading(true)
    fetch('/api/dashboard/popular-products', { headers: authHeaders })
      .then((r) => r.ok ? r.json() : { data: [] })
      .then((d) => { if (!cancelled) setPopularProducts(Array.isArray(d.data) ? d.data : []) })
      .catch(() => { if (!cancelled) setPopularProducts([]) })
      .finally(() => { if (!cancelled) setPopularLoading(false) })
    return () => { cancelled = true }
  }, [])

  useEffect(() => {
    let cancelled = false
    const sessionToken = localStorage.getItem('sessionToken') || ''
    const authHeaders = sessionToken ? { 'X-Session-Token': sessionToken, 'Authorization': `Bearer ${sessionToken}` } : {}
    setRestockLoading(true)
    fetch('/api/dashboard/restock-recommendations', { headers: authHeaders })
      .then((r) => r.ok ? r.json() : { data: [] })
      .then((d) => { if (!cancelled) setRestockItems(Array.isArray(d.data) ? d.data : []) })
      .catch(() => { if (!cancelled) setRestockItems([]) })
      .finally(() => { if (!cancelled) setRestockLoading(false) })
    return () => { cancelled = true }
  }, [])

  useEffect(() => {
    let cancelled = false
    const sessionToken = localStorage.getItem('sessionToken') || ''
    const authHeaders = sessionToken ? { 'X-Session-Token': sessionToken, 'Authorization': `Bearer ${sessionToken}` } : {}
    setCustomerLoading(true)
    fetch(`/api/dashboard/customer-analytics?days=${customerDays}`, { headers: authHeaders })
      .then((r) => r.ok ? r.json() : null)
      .then((d) => { if (!cancelled) setCustomerData(d && d.success ? d : null) })
      .catch(() => { if (!cancelled) setCustomerData(null) })
      .finally(() => { if (!cancelled) setCustomerLoading(false) })
    return () => { cancelled = true }
  }, [customerDays])

  useEffect(() => {
    let cancelled = false
    const sessionToken = localStorage.getItem('sessionToken') || ''
    const authHeaders = sessionToken ? { 'X-Session-Token': sessionToken, 'Authorization': `Bearer ${sessionToken}` } : {}
    setEmployeeLoading(true)
    fetch(`/api/dashboard/employee-performance?days=${employeeDays}`, { headers: authHeaders })
      .then((r) => r.ok ? r.json() : { employees: [] })
      .then((d) => { if (!cancelled) setEmployeeData(Array.isArray(d.employees) ? d.employees : []) })
      .catch(() => { if (!cancelled) setEmployeeData([]) })
      .finally(() => { if (!cancelled) setEmployeeLoading(false) })
    return () => { cancelled = true }
  }, [employeeDays])

  const bg = isDarkMode ? '#101012' : '#ffffff'
  const cardBg = isDarkMode ? '#2a2a2a' : '#fff'
  const borderColor = isDarkMode ? '#3a3a3a' : '#e8e8ee'
  const textColor = isDarkMode ? '#e8e8e8' : '#1a1a2e'
  const mutedColor = isDarkMode ? '#9ca3af' : '#6b7280'
  const chartColor = themeColor && themeColor.startsWith('#') ? themeColor : '#635bff'

  const removeButtonStyle = {
    position: 'absolute',
    top: 4,
    right: 4,
    zIndex: 2,
    background: 'rgba(255, 255, 255, 0.95)',
    color: chartColor,
    border: `1px solid ${chartColor}`,
    borderRadius: '50%',
    width: 20,
    height: 20,
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 0,
    boxShadow: '0 2px 4px rgba(0, 0, 0, 0.15)'
  }
  const onRemoveButtonHover = (e, enter) => {
    const t = e.currentTarget
    if (enter) {
      t.style.background = chartColor
      t.style.color = '#fff'
    } else {
      t.style.background = '#fff'
      t.style.color = chartColor
    }
  }

  // Volume mode: order-based series
  const weekly = stats?.weekly_revenue ?? []
  const volChartGross = weekly.map((d) => d.revenue ?? 0)
  const volChartNet = weekly.map((d) => d.revenue ?? 0)

  // Revenue mode: accounting-ledger series
  const accBuckets = stats?.accounting_buckets ?? []
  const accSummary = stats?.revenue_accounting ?? {}
  const accChartGross = accBuckets.map((d) => d.gross_revenue ?? 0)
  const accChartNet   = accBuckets.map((d) => d.net_revenue   ?? 0)
  const accTooltipDates = accBuckets.map((d) => d.date || d.day || '')

  // Active series depends on mode
  const chartGross = dataMode === 'revenue' ? accChartGross : volChartGross
  const chartNet   = dataMode === 'revenue' ? accChartNet   : volChartNet

  // Tooltip labels: use the precise date / period info from the API
  const tooltipDates = dataMode === 'revenue'
    ? accTooltipDates
    : (Array.isArray(weekly) ? weekly.map((d) => d.date || d.day || '') : [])
  // Backwards-compat alias for existing usages (detail modal, extra widgets)
  const dates = tooltipDates

  // X-axis labels: friendly per-granularity labels (Mon/Tue, Week 1, Jan, ...)
  const axisLabels = (() => {
    if (!Array.isArray(weekly) || weekly.length === 0) return []
    const g = (granularity || '').toLowerCase()
    const dr = (dateRange || '').toLowerCase()

    // Last 7 days → show weekdays (Mon, Tue, ...)
    if (dr === 'last 7 days') {
      return weekly.map((d) => {
        const dateStr = d.date
        if (!dateStr) return d.day || ''
        const dt = new Date(dateStr)
        if (!Number.isNaN(dt.getTime())) {
          return dt.toLocaleDateString('en-US', { weekday: 'short' })
        }
        return d.day || ''
      })
    }

    // Last 4 weeks → only 4 labels (Week 1–4) spaced across all points
    if (dr === 'last 4 weeks') {
      const n = weekly.length
      if (n === 0) return []
      const labels = Array(n).fill('')
      const buckets = 4
      const step = Math.max(1, Math.round(n / buckets))
      for (let i = 0; i < buckets; i++) {
        const idx = Math.min(i * step, n - 1)
        labels[idx] = `Week ${i + 1}`
      }
      return labels
    }

    // Last 3 / 12 months (or explicit monthly granularity) → show month abbreviations (Jan, Feb, ...),
    // not day labels. We derive the month labels from "now" so they are always correct, even if the
    // series is daily data.
    if (dr === 'last 3 months' || dr === 'last 12 months' || g === 'monthly') {
      const n = weekly.length
      if (n === 0) return []

      const monthsToShow =
        dr === 'last 3 months' ? 3 :
        dr === 'last 12 months' ? 12 :
        Math.min(12, n)

      // Build chronological month labels ending with the current month
      const monthLabels = []
      const now = new Date()
      for (let i = monthsToShow - 1; i >= 0; i--) {
        const d = new Date(now.getFullYear(), now.getMonth() - i, 1)
        monthLabels.push(d.toLocaleDateString('en-US', { month: 'short' }))
      }

      // Spread those month labels across the underlying data points
      const labels = Array(n).fill('')
      if (monthsToShow === 1) {
        labels[Math.floor(n / 2)] = monthLabels[0]
        return labels
      }
      const step = (n - 1) / (monthsToShow - 1)
      for (let i = 0; i < monthsToShow; i++) {
        const idx = Math.round(i * step)
        labels[Math.min(idx, n - 1)] = monthLabels[i]
      }
      return labels
    }

    // Weekly granularity for other ranges → Week 1, Week 2, ...
    if (g === 'weekly') {
      return weekly.map((_, idx) => `Week ${idx + 1}`)
    }

    // Fallback – use simple day label from API
    return weekly.map((d) => d.day || '')
  })()
  const revWeek = stats?.revenue?.week ?? 0
  const revMonth = stats?.revenue?.month ?? 0
  const prevPeriod = dateRange === 'Last 7 days' ? 0 : revMonth * 0.5 // placeholder previous period
  const netWeek = revWeek - (stats?.returns?.today_amount ?? 0) // rough net

  // Headline figures switch by mode
  const headlineGross = dataMode === 'revenue' ? (accSummary.gross_revenue ?? 0) : revWeek
  const headlineNet   = dataMode === 'revenue' ? (accSummary.net_revenue   ?? 0) : netWeek

  const payments = stats ? buildPaymentsFromStats(stats) : []

  if (loading) {
    return (
      <div style={{ background: bg, minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif" }}>
        <span style={{ color: mutedColor, fontSize: 14 }}>Loading overview…</span>
      </div>
    )
  }

  if (error) {
    return (
      <div style={{ background: bg, minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif" }}>
        <span style={{ color: '#ef4444', fontSize: 14 }}>{error}</span>
      </div>
    )
  }

  return (
    <div style={{ background: bg, minHeight: '100vh', fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif" }}>
      <div style={{ maxWidth: 1200, margin: '0 auto', padding: '32px 24px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24, flexWrap: 'wrap', gap: 8 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
            <Dropdown
              label="Date range"
              value={dateRange}
              options={['Today', 'Last 7 days', 'Last 4 weeks', 'Last 3 months', 'Last 12 months']}
              onSelect={setDateRange}
              isDarkMode={isDarkMode}
              borderColor={borderColor}
              bg={cardBg}
              textColor={textColor}
              mutedColor={mutedColor}
              chartColor={chartColor}
            />
            <Dropdown
              value={granularity}
              options={['Hourly', 'Daily', 'Weekly', 'Monthly']}
              onSelect={setGranularity}
              isDarkMode={isDarkMode}
              borderColor={borderColor}
              bg={cardBg}
              textColor={textColor}
              mutedColor={mutedColor}
              chartColor={chartColor}
            />
          </div>
        </div>

        {/* Top Row */}
        {visibleMainWidgets.filter((id) => MAIN_WIDGET_IDS_TOP.includes(id)).length > 0 && (
          <div
            onDragOver={(e) => { if (editMode && draggedId) { e.preventDefault(); e.stopPropagation() } }}
            style={{
              display: 'grid',
              gridTemplateColumns: `repeat(${visibleMainWidgets.filter((id) => MAIN_WIDGET_IDS_TOP.includes(id)).length}, 1fr)`,
              gap: 0,
              background: cardBg,
              borderRadius: 12,
              border: `1px solid ${borderColor}`,
              marginBottom: 16,
              overflow: 'hidden'
            }}
          >
            {visibleMainWidgets.filter((id) => MAIN_WIDGET_IDS_TOP.includes(id)).map((id, idx, arr) => {
              if (id === 'payments') {
                return (
                  <div
                    key={id}
                    draggable={editMode}
                    onDragStart={(e) => handleDragStart(e, id, 'main')}
                    onDragEnd={handleDragEnd}
                    onDragOver={(e) => handleDragOver(e, id)}
                    onDragLeave={handleDragLeave}
                    onDrop={(e) => handleDrop(e, id, 'main')}
                    style={{
                      position: 'relative',
                      padding: '20px 24px',
                      borderRight: idx < arr.length - 1 ? `1px solid ${borderColor}` : 'none',
                      cursor: editMode ? 'move' : 'default',
                      opacity: draggedId === id ? 0.5 : 1,
                      border: dragOverId === id && draggedId !== id ? `2px dashed ${chartColor}` : 'none',
                      transition: 'border 0.2s'
                    }}
                  >
                    {editMode && (
                      <button type="button" onClick={(e) => { e.stopPropagation(); handleRemoveMainWidget('payments') }} onMouseDown={(e) => e.stopPropagation()} onDragStart={(e) => e.stopPropagation()} style={removeButtonStyle} onMouseEnter={(e) => onRemoveButtonHover(e, true)} onMouseLeave={(e) => onRemoveButtonHover(e, false)} aria-label="Remove Payments"><X size={12} strokeWidth={2.5} /></button>
                    )}
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                        <span style={{ fontSize: 14, fontWeight: 600, color: textColor }}>
                          {dataMode === 'revenue' ? 'Revenue breakdown' : 'Payments'}
                        </span>
                        <InfoWithPopover
                          description={dataMode === 'revenue'
                            ? 'What reduces gross revenue to net revenue: discounts, returns, tips, processor fees, tax, COGS, and platform fees.'
                            : 'Breakdown of payment types: successful, refunded, uncaptured, failed, and pending. Amounts reflect the selected date range.'}
                          cardBg={cardBg} borderColor={borderColor} textColor={textColor} mutedColor={mutedColor} isDarkMode={isDarkMode}
                        />
                      </div>
                      {/* Volume / Revenue toggle lives here */}
                      <div style={{ display: 'flex', background: isDarkMode ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.05)', borderRadius: 7, overflow: 'hidden', border: `1px solid ${borderColor}` }}>
                        {['volume', 'revenue'].map((mode) => (
                          <button
                            key={mode}
                            type="button"
                            onClick={() => { setDataMode(mode); try { localStorage.setItem('overview_data_mode', mode) } catch (_) {} }}
                            style={{
                              padding: '5px 12px',
                              fontSize: 12,
                              fontWeight: 500,
                              cursor: 'pointer',
                              border: 'none',
                              background: dataMode === mode ? chartColor : 'transparent',
                              color: dataMode === mode ? '#fff' : mutedColor,
                              transition: 'background 0.15s',
                              borderRadius: dataMode === mode ? 6 : 0,
                            }}
                          >
                            {mode === 'volume' ? 'Volume' : 'Revenue'}
                          </button>
                        ))}
                      </div>
                    </div>

                    {dataMode === 'revenue' ? (
                      /* ── Revenue deduction breakdown ── */
                      (() => {
                        const hasAccData = (accSummary.gross_revenue ?? 0) > 0
                        const deductions = [
                          { label: 'Tips (to employees)',  value: accSummary.tips           ?? 0, color: '#22c55e' },
                          { label: 'Discounts',            value: accSummary.discounts       ?? 0, color: '#f59e0b' },
                          { label: 'Returns & refunds',    value: accSummary.returns         ?? 0, color: '#ef4444' },
                          { label: 'Processor fees',       value: accSummary.processor_fees  ?? 0, color: '#8b5cf6' },
                          { label: 'Tax collected',        value: accSummary.taxes           ?? 0, color: '#06b6d4' },
                          { label: 'Cost of goods sold',   value: accSummary.cogs            ?? 0, color: '#64748b' },
                          { label: 'Platform fees',        value: accSummary.platform_fees   ?? 0, color: '#f97316' },
                          { label: 'Loyalty redemptions',  value: accSummary.loyalty         ?? 0, color: '#a855f7' },
                        ]
                        return (
                          <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                            {/* Gross revenue header */}
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingBottom: 8, borderBottom: `1px solid ${borderColor}`, marginBottom: 4 }}>
                              <span style={{ fontSize: 12, fontWeight: 600, color: mutedColor, textTransform: 'uppercase', letterSpacing: '0.04em' }}>Gross revenue</span>
                              <span style={{ fontSize: 13, fontWeight: 700, color: textColor }}>{formatCurrency(accSummary.gross_revenue ?? 0)}</span>
                            </div>
                            {!hasAccData && (
                              <div style={{ padding: '8px 0 6px', display: 'flex', flexDirection: 'column', gap: 6 }}>
                                <div style={{ fontSize: 11, color: mutedColor, fontStyle: 'italic', lineHeight: 1.5 }}>
                                  No accounting entries for this period yet. New orders are journalized automatically. To import past orders, run a backfill.
                                </div>
                                <button
                                  type="button"
                                  onClick={runBackfill}
                                  disabled={backfillState === 'running'}
                                  style={{
                                    alignSelf: 'flex-start',
                                    padding: '5px 12px',
                                    fontSize: 11,
                                    fontWeight: 600,
                                    borderRadius: 6,
                                    border: `1px solid ${chartColor}`,
                                    background: backfillState === 'running' ? 'transparent' : chartColor,
                                    color: backfillState === 'running' ? chartColor : '#fff',
                                    cursor: backfillState === 'running' ? 'not-allowed' : 'pointer',
                                  }}
                                >
                                  {backfillState === 'running' ? 'Backfilling…' : backfillState === 'done' ? 'Done — reloading…' : backfillState === 'error' ? 'Retry backfill' : 'Backfill orders'}
                                </button>
                              </div>
                            )}
                            {deductions.map(({ label, value, color }) => (
                              <div key={label} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '5px 0' }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                                  <div style={{ width: 7, height: 7, borderRadius: '50%', background: color, flexShrink: 0 }} />
                                  <span style={{ fontSize: 12, color: mutedColor }}>{label}</span>
                                </div>
                                <span style={{ fontSize: 12, fontWeight: value > 0 ? 600 : 400, color: value > 0 ? textColor : mutedColor }}>
                                  {value > 0 ? `−${formatCurrency(value)}` : '—'}
                                </span>
                              </div>
                            ))}
                            {/* Net revenue total row */}
                            <div style={{ borderTop: `1px solid ${borderColor}`, marginTop: 4, paddingTop: 8, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                              <span style={{ fontSize: 13, fontWeight: 700, color: textColor }}>Net revenue</span>
                              <span style={{ fontSize: 13, fontWeight: 700, color: chartColor }}>{formatCurrency(accSummary.net_revenue ?? 0)}</span>
                            </div>
                          </div>
                        )
                      })()
                    ) : (
                      /* ── Volume payment-status breakdown ── */
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                        {payments.map((p) => (
                          <div key={p.type} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                              <div style={{ width: 8, height: 8, borderRadius: '50%', background: p.color }} />
                              <span style={{ fontSize: 13, color: mutedColor }}>{p.count} {p.type}</span>
                            </div>
                            <span style={{ fontSize: 13, fontWeight: 600, color: textColor }}>{formatCurrency(p.amount)}</span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )
              }
              return null
            })}
            {visibleMainWidgets.includes('gross_volume') && (
              <div
                draggable={editMode}
                onDragStart={(e) => handleDragStart(e, 'gross_volume', 'main')}
                onDragEnd={handleDragEnd}
                onDragOver={(e) => handleDragOver(e, 'gross_volume')}
                onDragLeave={handleDragLeave}
                onDrop={(e) => handleDrop(e, 'gross_volume', 'main')}
                style={{
                  position: 'relative',
                  padding: '20px 24px',
                  borderRight: visibleMainWidgets.includes('net_volume') ? `1px solid ${borderColor}` : 'none',
                  display: 'flex',
                  flexDirection: 'column',
                  cursor: editMode ? 'move' : 'default',
                  opacity: draggedId === 'gross_volume' ? 0.5 : 1,
                  border: dragOverId === 'gross_volume' && draggedId !== 'gross_volume' ? `2px dashed ${chartColor}` : 'none',
                  transition: 'border 0.2s'
                }}
              >
                {editMode && (
                  <button type="button" onClick={() => handleRemoveMainWidget('gross_volume')} onDragStart={(e) => e.stopPropagation()} style={removeButtonStyle} onMouseEnter={(e) => onRemoveButtonHover(e, true)} onMouseLeave={(e) => onRemoveButtonHover(e, false)} aria-label="Remove Gross volume"><X size={12} strokeWidth={2.5} /></button>
                )}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    <span style={{ fontSize: 14, fontWeight: 600, color: textColor }}>
                    {dataMode === 'revenue' ? 'Gross revenue' : 'Gross volume'}
                  </span>
                    <InfoWithPopover description={dataMode === 'revenue' ? 'Total revenue from the accounting ledger for the selected period. Credits on revenue accounts.' : 'Total revenue (before refunds or fees) for the selected period. The chart shows daily or weekly values over time.'} cardBg={cardBg} borderColor={borderColor} textColor={textColor} mutedColor={mutedColor} isDarkMode={isDarkMode} />
                  </div>
                  <button
                    type="button"
                    onClick={() => setDetailModalStatId('gross_volume')}
                    onDragStart={(e) => e.stopPropagation()}
                    style={{ display: 'flex', alignItems: 'center', gap: 4, background: cardBg, border: `1px solid ${borderColor}`, borderRadius: 8, padding: '4px 10px', fontSize: 12, cursor: 'pointer', color: textColor, fontWeight: 500 }}
                  >
                    More details <ExternalLink size={11} />
                  </button>
                </div>
                <div style={{ fontSize: 28, fontWeight: 700, color: textColor }}>{formatCurrency(headlineGross)}</div>
                <div style={{ fontSize: 12, color: mutedColor, marginBottom: 12 }}>{formatCurrency(prevPeriod)} previous period</div>
                <div style={{ flex: 1, display: 'flex', alignItems: 'flex-end', position: 'relative' }}>
                  <div style={{ width: '100%' }}>
                    <div style={{ position: 'absolute', top: 0, right: 0, fontSize: 10, color: mutedColor }}>{formatCurrency(Math.max(...chartGross, 0.01))}</div>
                    <MiniChartWithTooltip
                      data={chartGross}
                      dates={tooltipDates}
                      title={dataMode === 'revenue' ? 'Gross revenue' : 'Gross volume'}
                      height={100}
                      color={chartColor}
                      formatValue={formatCurrency}
                      comparisonValue={prevPeriod}
                      comparisonLabel="Previous period"
                      theme={{ cardBg, borderColor, textColor, mutedColor }}
                      chartType={chartTypeByStatId.gross_volume || 'line'}
                    />
                    {axisLabels.length > 0 && (
                      <div
                        style={{
                          position: 'relative',
                          marginTop: 4,
                          height: 14
                        }}
                      >
                        {axisLabels.map((label, idx) => {
                          const n = axisLabels.length
                          const pct = n > 1 ? (idx / (n - 1)) * 100 : 50
                          return (
                            <span
                              key={idx}
                              style={{
                                position: 'absolute',
                                left: `${pct}%`,
                                transform: 'translateX(-50%)',
                                fontSize: 9,
                                color: mutedColor,
                                whiteSpace: 'nowrap',
                                maxWidth: 40,
                                textAlign: 'center',
                                overflow: 'hidden',
                                textOverflow: 'ellipsis'
                              }}
                            >
                              {label}
                            </span>
                          )
                        })}
                      </div>
                    )}
                  </div>
                </div>
                {/* footer row removed per design */}
              </div>
            )}
            {visibleMainWidgets.includes('net_volume') && (
              <div
                draggable={editMode}
                onDragStart={(e) => handleDragStart(e, 'net_volume', 'main')}
                onDragEnd={handleDragEnd}
                onDragOver={(e) => handleDragOver(e, 'net_volume')}
                onDragLeave={handleDragLeave}
                onDrop={(e) => handleDrop(e, 'net_volume', 'main')}
                style={{
                  position: 'relative',
                  padding: '20px 24px',
                  display: 'flex',
                  flexDirection: 'column',
                  cursor: editMode ? 'move' : 'default',
                  opacity: draggedId === 'net_volume' ? 0.5 : 1,
                  border: dragOverId === 'net_volume' && draggedId !== 'net_volume' ? `2px dashed ${chartColor}` : 'none',
                  transition: 'border 0.2s'
                }}
              >
                {editMode && (
                  <button type="button" onClick={() => handleRemoveMainWidget('net_volume')} onDragStart={(e) => e.stopPropagation()} style={removeButtonStyle} onMouseEnter={(e) => onRemoveButtonHover(e, true)} onMouseLeave={(e) => onRemoveButtonHover(e, false)} aria-label="Remove Net volume"><X size={12} strokeWidth={2.5} /></button>
                )}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    <span style={{ fontSize: 14, fontWeight: 600, color: textColor }}>
                    {dataMode === 'revenue' ? 'Net revenue' : 'Net volume'}
                  </span>
                    <InfoWithPopover description={dataMode === 'revenue' ? 'Revenue after discounts, returns, fees, and COGS for the selected period. Sourced from the accounting ledger.' : 'Revenue after refunds for the selected period. The chart shows daily or weekly net values over time.'} cardBg={cardBg} borderColor={borderColor} textColor={textColor} mutedColor={mutedColor} isDarkMode={isDarkMode} />
                  </div>
                  <button
                    type="button"
                    onClick={() => setDetailModalStatId('net_volume')}
                    onDragStart={(e) => e.stopPropagation()}
                    style={{ display: 'flex', alignItems: 'center', gap: 4, background: cardBg, border: `1px solid ${borderColor}`, borderRadius: 8, padding: '4px 10px', fontSize: 12, cursor: 'pointer', color: textColor, fontWeight: 500 }}
                  >
                    More details <ExternalLink size={11} />
                  </button>
                </div>
                <div style={{ fontSize: 28, fontWeight: 700, color: textColor }}>{formatCurrency(headlineNet)}</div>
                <div style={{ fontSize: 12, color: mutedColor, marginBottom: 12 }}>{formatCurrency(prevPeriod)} previous period</div>
                <div style={{ flex: 1, display: 'flex', alignItems: 'flex-end', position: 'relative' }}>
                  <div style={{ width: '100%' }}>
                    <div style={{ position: 'absolute', top: 0, right: 0, fontSize: 10, color: mutedColor }}>{formatCurrency(Math.max(...chartNet, 0.01))}</div>
                    <MiniChartWithTooltip
                      data={chartNet}
                      dates={tooltipDates}
                      title={dataMode === 'revenue' ? 'Net revenue' : 'Net volume'}
                      height={100}
                      color={chartColor}
                      formatValue={formatCurrency}
                      comparisonValue={prevPeriod}
                      comparisonLabel="Previous period"
                      theme={{ cardBg, borderColor, textColor, mutedColor }}
                      chartType={chartTypeByStatId.net_volume || 'line'}
                    />
                    {axisLabels.length > 0 && (
                      <div
                        style={{
                          position: 'relative',
                          marginTop: 4,
                          height: 14
                        }}
                      >
                        {axisLabels.map((label, idx) => {
                          const n = axisLabels.length
                          const pct = n > 1 ? (idx / (n - 1)) * 100 : 50
                          return (
                            <span
                              key={idx}
                              style={{
                                position: 'absolute',
                                left: `${pct}%`,
                                transform: 'translateX(-50%)',
                                fontSize: 9,
                                color: mutedColor,
                                whiteSpace: 'nowrap',
                                maxWidth: 40,
                                textAlign: 'center',
                                overflow: 'hidden',
                                textOverflow: 'ellipsis'
                              }}
                            >
                              {label}
                            </span>
                          )
                        })}
                      </div>
                    )}
                  </div>
                </div>
                {/* footer row removed per design */}
              </div>
            )}
          </div>
        )}

        {/* Product Recommendations & Popularity grid follows... */}

        {/* ── Popular Products & Restock Recommendations (side by side) ── */}
        <div style={{ marginTop: 32, marginBottom: 32, display: 'grid', gridTemplateColumns: 'minmax(0, 1fr) minmax(0, 1fr)', gap: 24 }}>
          {/* Popular products */}
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16 }}>
              <span style={{ fontSize: 16, fontWeight: 700, color: textColor }}>Popular products</span>
              <span style={{ fontSize: 12, color: mutedColor, fontStyle: 'italic' }}>scored by velocity, revenue, consistency &amp; turnover</span>
            </div>
            <div style={{ background: cardBg, borderRadius: 12, border: `1px solid ${borderColor}`, padding: '20px 24px' }}>
              {popularLoading ? (
                <div style={{ color: mutedColor, fontSize: 13, padding: '24px 0', textAlign: 'center' }}>Loading…</div>
              ) : popularProducts.length === 0 ? (
                <div>
                  <div style={{ color: mutedColor, fontSize: 13, marginBottom: 16, textAlign: 'center' }}>
                    No product data available yet. Sales activity will appear here once orders are recorded.
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                    {Array.from({ length: 4 }).map((_, i) => (
                      <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 12, opacity: 0.45 }}>
                        <div style={{ width: 160, flexShrink: 0 }}>
                          <div style={{ height: 10, borderRadius: 4, background: isDarkMode ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.06)', marginBottom: 4 }} />
                          <div style={{ height: 8, borderRadius: 4, background: isDarkMode ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.03)', width: '70%' }} />
                        </div>
                        <div style={{ flex: 1, position: 'relative', height: 20, background: isDarkMode ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.03)', borderRadius: 4, overflow: 'hidden' }}>
                          <div
                            style={{
                              position: 'absolute',
                              left: 0,
                              top: 0,
                              bottom: 0,
                              width: `${20 + i * 15}%`,
                              background: chartColor,
                              borderRadius: 4,
                              opacity: 0.25
                            }}
                          />
                        </div>
                        <div style={{ width: 70, height: 10, borderRadius: 4, background: isDarkMode ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.03)' }} />
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                  {popularProducts.map((p, i) => {
                    const maxScore = popularProducts[0]?.popularity_score ?? 1
                    const pct = maxScore > 0 ? Math.max(4, (p.popularity_score / maxScore) * 100) : 4
                    const isExpired = p.expiry_flag === 'expired'
                    const expiringSoon = p.expiry_flag === 'expires_soon'
                    const barColor = isExpired ? '#ef4444' : expiringSoon ? '#f97316' : chartColor
                    return (
                      <div
                        key={p.product_id || i}
                        style={{ position: 'relative' }}
                        onMouseEnter={(e) => {
                          const rect = e.currentTarget.getBoundingClientRect()
                          setHoveredProductPos({ x: rect.left, y: rect.bottom + 8 })
                          setHoveredProduct(p)
                        }}
                        onMouseLeave={() => setHoveredProduct(null)}
                      >
                        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                          <div style={{ width: 160, flexShrink: 0 }}>
                            <div style={{ fontSize: 12, fontWeight: 600, color: textColor, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                              {p.product_name}
                            </div>
                            <div style={{ fontSize: 11, color: mutedColor }}>{p.units_sold_30d ?? 0} sold (30d)</div>
                          </div>
                          <div style={{ flex: 1, position: 'relative', height: 20, background: isDarkMode ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.04)', borderRadius: 4, overflow: 'hidden' }}>
                            <div
                              style={{
                                position: 'absolute',
                                left: 0, top: 0, bottom: 0,
                                width: `${pct}%`,
                                background: barColor,
                                borderRadius: 4,
                                opacity: 0.85,
                                transition: 'width 0.5s ease'
                              }}
                            />
                            <div style={{ position: 'absolute', left: 8, top: 0, bottom: 0, display: 'flex', alignItems: 'center', fontSize: 10, color: pct > 30 ? '#fff' : textColor, fontWeight: 600 }}>
                              {(p.popularity_score ?? 0).toFixed(1)}
                            </div>
                          </div>
                          {(isExpired || expiringSoon) && (
                            <div style={{
                              flexShrink: 0,
                              fontSize: 10,
                              fontWeight: 700,
                              padding: '2px 6px',
                              borderRadius: 4,
                              background: isExpired ? 'rgba(239,68,68,0.15)' : 'rgba(249,115,22,0.15)',
                              color: isExpired ? '#ef4444' : '#f97316',
                              border: `1px solid ${isExpired ? '#ef4444' : '#f97316'}`,
                            }}>
                              {isExpired ? 'EXPIRED' : 'EXP SOON'}
                            </div>
                          )}
                          <div style={{ width: 70, textAlign: 'right', fontSize: 12, fontWeight: 600, color: textColor, flexShrink: 0 }}>
                            {formatCurrency(p.revenue_30d ?? 0)}
                          </div>
                        </div>
                      </div>
                    )
                  })}
                </div>
              )}
            </div>
          </div>

          {/* Restock recommendations */}
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16 }}>
              <span style={{ fontSize: 16, fontWeight: 700, color: textColor }}>Restock recommendations</span>
              <span style={{ fontSize: 12, color: mutedColor, fontStyle: 'italic' }}>based on demand trend, days of supply &amp; shipment history</span>
            </div>
            <div style={{ background: cardBg, borderRadius: 12, border: `1px solid ${borderColor}`, padding: '20px 24px' }}>
              {restockLoading ? (
                <div style={{ color: mutedColor, fontSize: 13, padding: '24px 0', textAlign: 'center' }}>Loading…</div>
              ) : restockItems.length === 0 ? (
                <div>
                  <div style={{ color: mutedColor, fontSize: 13, marginBottom: 16, textAlign: 'center' }}>
                    No restock recommendations — inventory levels look healthy.
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                    {Array.from({ length: 4 }).map((_, i) => (
                      <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 12, opacity: 0.45 }}>
                        <div style={{ width: 160, flexShrink: 0 }}>
                          <div style={{ height: 10, borderRadius: 4, background: isDarkMode ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.06)', marginBottom: 4 }} />
                          <div style={{ height: 8, borderRadius: 4, background: isDarkMode ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.03)', width: '70%' }} />
                        </div>
                        <div style={{ flex: 1, position: 'relative', height: 20, background: isDarkMode ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.03)', borderRadius: 4, overflow: 'hidden' }}>
                          <div
                            style={{
                              position: 'absolute',
                              left: 0,
                              top: 0,
                              bottom: 0,
                              width: `${25 + i * 15}%`,
                              background: '#22c55e',
                              borderRadius: 4,
                              opacity: 0.25
                            }}
                          />
                        </div>
                        <div style={{ width: 100, height: 10, borderRadius: 4, background: isDarkMode ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.03)' }} />
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                  {restockItems.map((item, i) => {
                    const maxScore = restockItems[0]?.urgency_score ?? 1
                    const pct = maxScore > 0 ? Math.max(4, (item.urgency_score / maxScore) * 100) : 4
                    const urgency = item.urgency_score ?? 0
                    const barColor = urgency >= 7 ? '#ef4444' : urgency >= 4 ? '#f97316' : '#22c55e'
                    const isExpired = item.expiry_flag === 'expired'
                    const expiringSoon = item.expiry_flag === 'expires_soon'
                    return (
                      <div
                        key={item.product_id || i}
                        style={{ position: 'relative' }}
                        onMouseEnter={(e) => {
                          const rect = e.currentTarget.getBoundingClientRect()
                          setHoveredRestockPos({ x: rect.left, y: rect.bottom + 8 })
                          setHoveredRestock(item)
                        }}
                        onMouseLeave={() => setHoveredRestock(null)}
                      >
                        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                          <div style={{ width: 160, flexShrink: 0 }}>
                            <div style={{ fontSize: 12, fontWeight: 600, color: textColor, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                              {item.product_name}
                            </div>
                            <div style={{ fontSize: 11, color: mutedColor }}>{item.current_stock ?? 0} in stock · {item.days_of_supply != null ? `${Math.round(item.days_of_supply)}d supply` : 'n/a'}</div>
                          </div>
                          <div style={{ flex: 1, position: 'relative', height: 20, background: isDarkMode ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.04)', borderRadius: 4, overflow: 'hidden' }}>
                            <div
                              style={{
                                position: 'absolute',
                                left: 0, top: 0, bottom: 0,
                                width: `${pct}%`,
                                background: barColor,
                                borderRadius: 4,
                                opacity: 0.85,
                                transition: 'width 0.5s ease'
                              }}
                            />
                            <div style={{ position: 'absolute', left: 8, top: 0, bottom: 0, display: 'flex', alignItems: 'center', fontSize: 10, color: pct > 30 ? '#fff' : textColor, fontWeight: 600 }}>
                              {urgency.toFixed(1)}
                            </div>
                          </div>
                          {(isExpired || expiringSoon) && (
                            <div style={{
                              flexShrink: 0,
                              fontSize: 10,
                              fontWeight: 700,
                              padding: '2px 6px',
                              borderRadius: 4,
                              background: isExpired ? 'rgba(239,68,68,0.15)' : 'rgba(249,115,22,0.15)',
                              color: isExpired ? '#ef4444' : '#f97316',
                              border: `1px solid ${isExpired ? '#ef4444' : '#f97316'}`,
                            }}>
                              {isExpired ? 'EXPIRED' : 'EXP SOON'}
                            </div>
                          )}
                          <div style={{ width: 100, textAlign: 'right', fontSize: 11, fontWeight: 600, color: barColor, flexShrink: 0 }}>
                            Order {item.suggested_order_qty ?? '—'}
                          </div>
                        </div>
                      </div>
                    )
                  })}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Added statistics section removed per design */}

        {/* ── Customer Analytics ── */}
        <div style={{ marginTop: 32 }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16, flexWrap: 'wrap', gap: 8 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <span style={{ fontSize: 16, fontWeight: 700, color: textColor }}>Customer analytics</span>
              <span style={{ fontSize: 12, color: mutedColor, fontStyle: 'italic' }}>registered vs guest, enrollment &amp; rewards</span>
            </div>
            <div style={{ display: 'flex', background: isDarkMode ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.05)', borderRadius: 7, overflow: 'hidden', border: `1px solid ${borderColor}` }}>
              {[7, 30, 90].map((d) => (
                <button key={d} type="button" onClick={() => setCustomerDays(d)}
                  style={{ padding: '5px 12px', fontSize: 12, fontWeight: 500, cursor: 'pointer', border: 'none', background: customerDays === d ? chartColor : 'transparent', color: customerDays === d ? '#fff' : mutedColor, borderRadius: customerDays === d ? 6 : 0, transition: 'background 0.15s' }}>
                  {d}d
                </button>
              ))}
            </div>
          </div>
          {customerLoading ? (
            <div style={{ color: mutedColor, fontSize: 13, textAlign: 'center', padding: '24px 0' }}>Loading…</div>
          ) : (() => {
            const hasCustomerData = !!customerData
            const safeData = customerData || {
              orders: {
                registered: 0,
                guest: 0,
                registered_revenue: 0,
                guest_revenue: 0
              },
              customers: {
                total: 0,
                with_points: 0,
                total_points_outstanding: 0
              },
              enrollment: {
                last_7d: 0,
                last_30d: 0,
                last_90d: 0
              },
              enrollment_trend: [],
              top_customers: [],
              rewards: {
                enabled: false
              }
            }

            const { orders, customers, enrollment, enrollment_trend, top_customers, rewards } = safeData
            const totalOrders = (orders.registered || 0) + (orders.guest || 0)
            const regPct = totalOrders > 0 ? Math.round((orders.registered / totalOrders) * 100) : 0
            const guestPct = 100 - regPct
            return (
              <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0,1fr) minmax(0,1fr)', gap: 16 }}>
                {/* Left: order split + enrollment */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                  {/* Registered vs Guest */}
                  <div style={{ background: cardBg, borderRadius: 12, border: `1px solid ${borderColor}`, padding: '20px 24px' }}>
                    <div style={{ fontSize: 13, fontWeight: 700, color: textColor, marginBottom: 14 }}>Orders by customer type</div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                      {[
                        { label: 'Registered customers', count: orders.registered, pct: regPct, color: chartColor },
                        { label: 'Guest / walk-in', count: orders.guest, pct: guestPct, color: isDarkMode ? '#4b5563' : '#d1d5db' },
                      ].map(({ label, count, pct, color }) => (
                        <div key={label}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                            <span style={{ fontSize: 12, color: mutedColor }}>{label}</span>
                            <span style={{ fontSize: 12, fontWeight: 700, color: textColor }}>{count.toLocaleString()} ({pct}%)</span>
                          </div>
                          <div style={{ height: 8, background: isDarkMode ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.06)', borderRadius: 4, overflow: 'hidden' }}>
                            <div style={{ height: '100%', width: `${pct}%`, background: color, borderRadius: 4, transition: 'width 0.5s ease' }} />
                          </div>
                        </div>
                      ))}
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 6, paddingTop: 10, borderTop: `1px solid ${borderColor}` }}>
                        <span style={{ fontSize: 12, color: mutedColor }}>Registered revenue</span>
                        <span style={{ fontSize: 12, fontWeight: 600, color: textColor }}>{formatCurrency(orders.registered_revenue)}</span>
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                        <span style={{ fontSize: 12, color: mutedColor }}>Guest revenue</span>
                        <span style={{ fontSize: 12, fontWeight: 600, color: textColor }}>{formatCurrency(orders.guest_revenue)}</span>
                      </div>
                    </div>
                  </div>

                  {/* Enrollment summary */}
                  <div style={{ background: cardBg, borderRadius: 12, border: `1px solid ${borderColor}`, padding: '20px 24px' }}>
                    <div style={{ fontSize: 13, fontWeight: 700, color: textColor, marginBottom: 14 }}>New customer enrollment</div>
                    <div style={{ display: 'flex', gap: 0, borderRadius: 8, overflow: 'hidden', border: `1px solid ${borderColor}` }}>
                      {[['Last 7d', enrollment.last_7d], ['Last 30d', enrollment.last_30d], ['Last 90d', enrollment.last_90d]].map(([label, val], i, arr) => (
                        <div key={label} style={{ flex: 1, padding: '12px 8px', textAlign: 'center', borderRight: i < arr.length - 1 ? `1px solid ${borderColor}` : 'none' }}>
                          <div style={{ fontSize: 22, fontWeight: 700, color: chartColor }}>{val}</div>
                          <div style={{ fontSize: 11, color: mutedColor }}>{label}</div>
                        </div>
                      ))}
                    </div>
                    <div style={{ marginTop: 12, display: 'flex', flexDirection: 'column', gap: 6 }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12 }}>
                        <span style={{ color: mutedColor }}>Total customers</span>
                        <span style={{ fontWeight: 600, color: textColor }}>{customers.total.toLocaleString()}</span>
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12 }}>
                        <span style={{ color: mutedColor }}>Active in rewards</span>
                        <span style={{ fontWeight: 600, color: textColor }}>{customers.with_points.toLocaleString()}</span>
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12 }}>
                        <span style={{ color: mutedColor }}>Points outstanding</span>
                        <span style={{ fontWeight: 600, color: textColor }}>{customers.total_points_outstanding.toLocaleString()} pts</span>
                      </div>
                      {!hasCustomerData && (
                        <div style={{ marginTop: 8, fontSize: 11, color: mutedColor, fontStyle: 'italic' }}>
                          No customer data yet. This section will fill in as customers place orders.
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Rewards config summary */}
                  {rewards.enabled && (
                    <div style={{ background: cardBg, borderRadius: 12, border: `1px solid ${borderColor}`, padding: '20px 24px' }}>
                      <div style={{ fontSize: 13, fontWeight: 700, color: textColor, marginBottom: 12 }}>Rewards program</div>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                        {rewards.points_enabled && (
                          <div style={{ fontSize: 12, color: mutedColor }}>Points: <strong style={{ color: textColor }}>{rewards.points_per_dollar} pt/$ · ${rewards.points_redemption_value}/pt</strong></div>
                        )}
                        {rewards.percentage_enabled && (
                          <div style={{ fontSize: 12, color: mutedColor }}>Percentage discount: <strong style={{ color: textColor }}>{rewards.percentage_discount}%</strong></div>
                        )}
                        {rewards.fixed_enabled && (
                          <div style={{ fontSize: 12, color: mutedColor }}>Fixed discount: <strong style={{ color: textColor }}>{formatCurrency(rewards.fixed_discount)}</strong></div>
                        )}
                        {!rewards.points_enabled && !rewards.percentage_enabled && !rewards.fixed_enabled && (
                          <div style={{ fontSize: 12, color: mutedColor }}>Type: <strong style={{ color: textColor }}>{rewards.reward_type}</strong></div>
                        )}
                      </div>
                    </div>
                  )}
                </div>

                {/* Right: enrollment sparkline + top customers */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                  {/* Enrollment trend mini-chart */}
                  <div style={{ background: cardBg, borderRadius: 12, border: `1px solid ${borderColor}`, padding: '20px 24px' }}>
                    <div style={{ fontSize: 13, fontWeight: 700, color: textColor, marginBottom: 12 }}>Enrollment trend ({customerDays}d)</div>
                    {enrollment_trend.length > 0 ? (
                      <MiniChartWithTooltip
                        data={enrollment_trend.map((d) => d.new_customers)}
                        dates={enrollment_trend.map((d) => d.date)}
                        title="New customers"
                        height={80}
                        color={chartColor}
                        formatValue={(v) => `${v} new`}
                        theme={{ cardBg, borderColor, textColor, mutedColor }}
                        chartType="bar"
                      />
                    ) : (
                      <div style={{ height: 80, borderRadius: 8, border: `1px dashed ${borderColor}`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, color: mutedColor }}>
                        No enrollment activity yet.
                      </div>
                    )}
                  </div>
                  {/* Top customers by spend */}
                  <div style={{ background: cardBg, borderRadius: 12, border: `1px solid ${borderColor}`, padding: '20px 24px' }}>
                    <div style={{ fontSize: 13, fontWeight: 700, color: textColor, marginBottom: 14 }}>Top customers by spend</div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                      {top_customers.length > 0 ? (
                        top_customers.map((c, i) => (
                          <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <div style={{ display: 'flex', flexDirection: 'column' }}>
                              <span style={{ fontSize: 13, fontWeight: 600, color: textColor }}>{c.name || 'Demo Customer'}</span>
                              <span style={{ fontSize: 11, color: mutedColor }}>{c.order_count || 0} orders</span>
                            </div>
                            <span style={{ fontSize: 13, fontWeight: 700, color: textColor }}>{formatCurrency(c.total_spend || 0)}</span>
                          </div>
                        ))
                      ) : (
                        <div style={{ padding: '12px 0', textAlign: 'center', fontSize: 12, color: mutedColor }}>
                          No customer spend data for this period.
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            )
          })()}
        </div>


        {/* ── Employee Performance ── */}
        <div style={{ marginTop: 32, marginBottom: 32 }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16, flexWrap: 'wrap', gap: 8 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <span style={{ fontSize: 16, fontWeight: 700, color: textColor }}>Employee performance</span>
              <span style={{ fontSize: 12, color: mutedColor, fontStyle: 'italic' }}>orders, revenue, tips, activity</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
              {/* Sort selector */}
              <div style={{ display: 'flex', background: isDarkMode ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.05)', borderRadius: 7, overflow: 'hidden', border: `1px solid ${borderColor}` }}>
                {[['revenue_total', 'Revenue'], ['orders_completed', 'Orders'], ['tips_total', 'Tips'], ['productivity_score', 'Score']].map(([key, label]) => (
                  <button key={key} type="button" onClick={() => setEmployeeSortKey(key)}
                    style={{ padding: '5px 10px', fontSize: 11, fontWeight: 500, cursor: 'pointer', border: 'none', background: employeeSortKey === key ? chartColor : 'transparent', color: employeeSortKey === key ? '#fff' : mutedColor, borderRadius: employeeSortKey === key ? 6 : 0, transition: 'background 0.15s', whiteSpace: 'nowrap' }}>
                    {label}
                  </button>
                ))}
              </div>
              {/* Day range */}
              <div style={{ display: 'flex', background: isDarkMode ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.05)', borderRadius: 7, overflow: 'hidden', border: `1px solid ${borderColor}` }}>
                {[7, 30, 90].map((d) => (
                  <button key={d} type="button" onClick={() => setEmployeeDays(d)}
                    style={{ padding: '5px 12px', fontSize: 12, fontWeight: 500, cursor: 'pointer', border: 'none', background: employeeDays === d ? chartColor : 'transparent', color: employeeDays === d ? '#fff' : mutedColor, borderRadius: employeeDays === d ? 6 : 0, transition: 'background 0.15s' }}>
                    {d}d
                  </button>
                ))}
              </div>
            </div>
          </div>
          <div style={{ background: cardBg, borderRadius: 12, border: `1px solid ${borderColor}`, padding: '20px 24px' }}>
            {employeeLoading ? (
              <div style={{ color: mutedColor, fontSize: 13, textAlign: 'center', padding: '24px 0' }}>Loading…</div>
            ) : (() => {
              const hasEmployeeData = employeeData.length > 0
              const baseEmployees = hasEmployeeData
                ? [...employeeData]
                : Array.from({ length: 4 }).map((_, i) => ({
                    employee_id: `placeholder-${i}`,
                    name: 'Employee name',
                    position: 'role',
                    revenue_total: 0,
                    orders_completed: 0,
                    tips_total: 0,
                    productivity_score: 0,
                    sparkline: []
                  }))

              const sorted = baseEmployees.sort((a, b) => (b[employeeSortKey] ?? 0) - (a[employeeSortKey] ?? 0))
              const maxVal = sorted[0]?.[employeeSortKey] ?? 1
              return (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                  {/* Header row */}
                  <div style={{ display: 'grid', gridTemplateColumns: '180px 1fr 80px 80px 80px 80px', gap: 8, paddingBottom: 8, borderBottom: `1px solid ${borderColor}`, fontSize: 11, fontWeight: 700, color: mutedColor, textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                    <span>Employee</span>
                    <span>Activity bar</span>
                    <span style={{ textAlign: 'right' }}>Revenue</span>
                    <span style={{ textAlign: 'right' }}>Orders</span>
                    <span style={{ textAlign: 'right' }}>Tips</span>
                    <span style={{ textAlign: 'right' }}>Score</span>
                  </div>
                  {sorted.map((emp, idx) => {
                    const barPct = maxVal > 0 ? Math.max(3, ((emp[employeeSortKey] ?? 0) / maxVal) * 100) : 3
                    const score = emp.productivity_score ?? 0
                    const scoreColor = score >= 15 ? '#22c55e' : score >= 5 ? chartColor : mutedColor
                    return (
                      <div
                        key={emp.employee_id || `placeholder-${idx}`}
                        style={{ display: 'grid', gridTemplateColumns: '180px 1fr 80px 80px 80px 80px', gap: 8, alignItems: 'center', cursor: 'default' }}
                        onMouseEnter={(e) => {
                          if (!hasEmployeeData) return
                          const rect = e.currentTarget.getBoundingClientRect()
                          setHoveredEmployeePos({ x: rect.left, y: rect.bottom + 8 })
                          setHoveredEmployee(emp)
                        }}
                        onMouseLeave={() => hasEmployeeData && setHoveredEmployee(null)}
                      >
                        <div>
                          <div style={{ fontSize: 12, fontWeight: 600, color: textColor, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                            {hasEmployeeData ? emp.name : 'Employee name'}
                          </div>
                          <div style={{ fontSize: 10, color: mutedColor, textTransform: 'capitalize' }}>
                            {hasEmployeeData ? (emp.position || '').replace(/_/g, ' ') : 'Role'}
                          </div>
                        </div>
                        <div style={{ position: 'relative', height: 16, background: isDarkMode ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.04)', borderRadius: 4, overflow: 'hidden' }}>
                          <div style={{ position: 'absolute', left: 0, top: 0, bottom: 0, width: `${barPct}%`, background: scoreColor, borderRadius: 4, opacity: hasEmployeeData ? 0.8 : 0.3, transition: 'width 0.5s ease' }} />
                          {/* Sparkline overlay */}
                          {hasEmployeeData && emp.sparkline && emp.sparkline.some((v) => v > 0) && (
                            <svg viewBox={`0 0 100 16`} preserveAspectRatio="none" style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', opacity: 0.35, mixBlendMode: 'overlay' }}>
                              {(() => {
                                const vals = emp.sparkline
                                const mx = Math.max(...vals, 1)
                                const pts = vals.map((v, i) => `${(i / (vals.length - 1)) * 100},${16 - (v / mx) * 14}`)
                                return <polyline points={pts.join(' ')} fill="none" stroke="#fff" strokeWidth="1.5" />
                              })()}
                            </svg>
                          )}
                        </div>
                        <span style={{ fontSize: 12, fontWeight: 600, color: textColor, textAlign: 'right' }}>
                          {hasEmployeeData ? formatCurrency(emp.revenue_total) : '$0.00'}
                        </span>
                        <span style={{ fontSize: 12, fontWeight: 600, color: textColor, textAlign: 'right' }}>
                          {hasEmployeeData ? emp.orders_completed : 0}
                        </span>
                        <span style={{ fontSize: 12, fontWeight: 600, color: textColor, textAlign: 'right' }}>
                          {hasEmployeeData ? formatCurrency(emp.tips_total) : '$0.00'}
                        </span>
                        <span style={{ fontSize: 12, fontWeight: 700, color: scoreColor, textAlign: 'right' }}>
                          {hasEmployeeData ? score.toFixed(1) : '0.0'}
                        </span>
                      </div>
                    )
                  })}
                  {!hasEmployeeData && (
                    <div style={{ marginTop: 8, fontSize: 11, color: mutedColor, fontStyle: 'italic', textAlign: 'center' }}>
                      No employee activity in this period yet. This chart will populate as employees take orders.
                    </div>
                  )}
                </div>
              )
            })()}
          </div>
        </div>
      </div>

      {/* Popular Products hover modal */}
      {hoveredProduct && createPortal(
        <div
          style={{
            position: 'fixed',
            left: Math.min(hoveredProductPos.x, window.innerWidth - 300),
            top: hoveredProductPos.y,
            zIndex: 9999,
            background: cardBg,
            border: `1px solid ${borderColor}`,
            borderRadius: 10,
            padding: '14px 16px',
            width: 280,
            boxShadow: '0 8px 24px rgba(0,0,0,0.18)',
            pointerEvents: 'none',
          }}
        >
          <div style={{ fontWeight: 700, fontSize: 13, color: textColor, marginBottom: 8 }}>{hoveredProduct.product_name}</div>
          {(hoveredProduct.expiry_flag === 'expired' || hoveredProduct.expiry_flag === 'expires_soon') && hoveredProduct.nearest_expiry && (
            <div style={{
              marginBottom: 8,
              padding: '4px 8px',
              borderRadius: 6,
              background: hoveredProduct.expiry_flag === 'expired' ? 'rgba(239,68,68,0.12)' : 'rgba(249,115,22,0.12)',
              color: hoveredProduct.expiry_flag === 'expired' ? '#ef4444' : '#f97316',
              fontSize: 11,
              fontWeight: 600
            }}>
              {hoveredProduct.expiry_flag === 'expired' ? '⚠ Stock has expired: ' : '⚠ Expires: '}{hoveredProduct.nearest_expiry}
            </div>
          )}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
            {[
              ['Popularity score', (hoveredProduct.popularity_score ?? 0).toFixed(2)],
              ['Units sold (30d)', hoveredProduct.units_sold_30d ?? 0],
              ['Units sold (7d)', hoveredProduct.units_sold_7d ?? 0],
              ['Daily velocity', `${(hoveredProduct.daily_velocity ?? 0).toFixed(2)} units/day`],
              ['Revenue (30d)', formatCurrency(hoveredProduct.revenue_30d ?? 0)],
              ['Order count (30d)', hoveredProduct.order_count_30d ?? 0],
              ['Current stock', hoveredProduct.current_stock ?? 0],
              ['Days of supply', hoveredProduct.days_of_supply != null ? `${Math.round(hoveredProduct.days_of_supply)} days` : 'n/a'],
              ['Last shipment', hoveredProduct.last_shipment_date ?? '—'],
              ['Avg shipment qty', hoveredProduct.avg_shipment_qty != null ? Math.round(hoveredProduct.avg_shipment_qty) : '—'],
              ['Nearest expiry', hoveredProduct.nearest_expiry ?? 'n/a'],
            ].map(([label, val]) => (
              <div key={label} style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12 }}>
                <span style={{ color: mutedColor }}>{label}</span>
                <span style={{ fontWeight: 600, color: textColor }}>{val}</span>
              </div>
            ))}
          </div>
          {hoveredProduct.score_breakdown && (
            <div style={{ marginTop: 8, paddingTop: 8, borderTop: `1px solid ${borderColor}` }}>
              <div style={{ fontSize: 11, color: mutedColor, marginBottom: 4, fontWeight: 600 }}>Score breakdown</div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
                {[
                  ['Velocity (40%)', hoveredProduct.score_breakdown.velocity],
                  ['Revenue density (25%)', hoveredProduct.score_breakdown.revenue_density],
                  ['Consistency (20%)', hoveredProduct.score_breakdown.consistency],
                  ['Turnover (15%)', hoveredProduct.score_breakdown.turnover],
                ].filter(([, v]) => v != null).map(([label, val]) => (
                  <div key={label} style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11 }}>
                    <span style={{ color: mutedColor }}>{label}</span>
                    <span style={{ color: textColor }}>{Number(val).toFixed(2)}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>,
        document.body
      )}

      {/* Restock hover modal */}
      {hoveredRestock && createPortal(
        <div
          style={{
            position: 'fixed',
            left: Math.min(hoveredRestockPos.x, window.innerWidth - 300),
            top: hoveredRestockPos.y,
            zIndex: 9999,
            background: cardBg,
            border: `1px solid ${borderColor}`,
            borderRadius: 10,
            padding: '14px 16px',
            width: 280,
            boxShadow: '0 8px 24px rgba(0,0,0,0.18)',
            pointerEvents: 'none',
          }}
        >
          <div style={{ fontWeight: 700, fontSize: 13, color: textColor, marginBottom: 8 }}>{hoveredRestock.product_name}</div>
          {(hoveredRestock.expiry_flag === 'expired' || hoveredRestock.expiry_flag === 'expires_soon') && hoveredRestock.nearest_expiry && (
            <div style={{
              marginBottom: 8,
              padding: '4px 8px',
              borderRadius: 6,
              background: hoveredRestock.expiry_flag === 'expired' ? 'rgba(239,68,68,0.12)' : 'rgba(249,115,22,0.12)',
              color: hoveredRestock.expiry_flag === 'expired' ? '#ef4444' : '#f97316',
              fontSize: 11,
              fontWeight: 600
            }}>
              {hoveredRestock.expiry_flag === 'expired' ? '⚠ Stock has expired: ' : '⚠ Expires: '}{hoveredRestock.nearest_expiry}
            </div>
          )}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
            {[
              ['Urgency score', (hoveredRestock.urgency_score ?? 0).toFixed(2)],
              ['Current stock', hoveredRestock.current_stock ?? 0],
              ['Days of supply', hoveredRestock.days_of_supply != null ? `${Math.round(hoveredRestock.days_of_supply)} days` : 'n/a'],
              ['Par level', hoveredRestock.par_level ?? '—'],
              ['Suggested order qty', hoveredRestock.suggested_order_qty ?? '—'],
              ['Daily velocity (30d)', `${(hoveredRestock.daily_velocity_30d ?? 0).toFixed(2)} units/day`],
              ['Daily velocity (7d)', `${(hoveredRestock.daily_velocity_7d ?? 0).toFixed(2)} units/day`],
              ['Demand trend', hoveredRestock.demand_trend != null ? `${(hoveredRestock.demand_trend * 100).toFixed(0)}%` : '—'],
              ['Last shipment', hoveredRestock.last_shipment_date ?? '—'],
              ['Avg shipment qty', hoveredRestock.avg_shipment_qty != null ? Math.round(hoveredRestock.avg_shipment_qty) : '—'],
              ['Avg lead time', hoveredRestock.avg_lead_days != null ? `${Math.round(hoveredRestock.avg_lead_days)} days` : '—'],
              ['Nearest expiry', hoveredRestock.nearest_expiry ?? 'n/a'],
            ].map(([label, val]) => (
              <div key={label} style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12 }}>
                <span style={{ color: mutedColor }}>{label}</span>
                <span style={{ fontWeight: 600, color: textColor }}>{val}</span>
              </div>
            ))}
          </div>
          {hoveredRestock.reason_tags && (
            <div style={{ marginTop: 8, paddingTop: 8, borderTop: `1px solid ${borderColor}` }}>
              <div style={{ fontSize: 11, color: mutedColor, marginBottom: 6, fontWeight: 600 }}>Why restock?</div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4 }}>
                {hoveredRestock.reason_tags.split(', ').map((tag) => (
                  <span
                    key={tag}
                    style={{
                      fontSize: 10,
                      fontWeight: 600,
                      padding: '2px 6px',
                      borderRadius: 4,
                      background: tag.includes('critical') || tag.includes('urgent') || tag === 'out_of_stock' || tag === 'expired' ? 'rgba(239,68,68,0.12)' : 'rgba(99,91,255,0.12)',
                      color: tag.includes('critical') || tag.includes('urgent') || tag === 'out_of_stock' || tag === 'expired' ? '#ef4444' : chartColor,
                      border: `1px solid ${tag.includes('critical') || tag.includes('urgent') || tag === 'out_of_stock' || tag === 'expired' ? '#ef4444' : chartColor}`,
                    }}
                  >
                    {tag.replace(/_/g, ' ')}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>,
        document.body
      )}

      {/* Employee hover modal */}
      {hoveredEmployee && createPortal(
        <div
          style={{
            position: 'fixed',
            left: Math.min(hoveredEmployeePos.x, window.innerWidth - 300),
            top: hoveredEmployeePos.y,
            zIndex: 9999,
            background: cardBg,
            border: `1px solid ${borderColor}`,
            borderRadius: 10,
            padding: '14px 16px',
            width: 290,
            boxShadow: '0 8px 24px rgba(0,0,0,0.18)',
            pointerEvents: 'none',
          }}
        >
          <div style={{ fontWeight: 700, fontSize: 13, color: textColor, marginBottom: 2 }}>{hoveredEmployee.name}</div>
          <div style={{ fontSize: 11, color: mutedColor, textTransform: 'capitalize', marginBottom: 10 }}>{(hoveredEmployee.position || '').replace(/_/g, ' ')} · {(hoveredEmployee.employment_type || '').replace(/_/g, ' ')}</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
            {[
              ['Productivity score', (hoveredEmployee.productivity_score ?? 0).toFixed(2)],
              ['Orders completed', hoveredEmployee.orders_completed ?? 0],
              ['Orders voided', hoveredEmployee.orders_voided ?? 0],
              ['Returns handled', hoveredEmployee.orders_returned ?? 0],
              ['Revenue generated', formatCurrency(hoveredEmployee.revenue_total ?? 0)],
              ['Avg order value', formatCurrency(hoveredEmployee.avg_order_value ?? 0)],
              ['Tips earned', formatCurrency(hoveredEmployee.tips_total ?? 0)],
              ['Discounts given', formatCurrency(hoveredEmployee.discounts_given ?? 0)],
              ['Days active', hoveredEmployee.days_active ?? 0],
              ['Login sessions', hoveredEmployee.session_count ?? 0],
              ['Total hours logged', `${(hoveredEmployee.total_hours ?? 0).toFixed(1)} hrs`],
              ['Return requests', hoveredEmployee.return_requests_handled ?? 0],
            ].map(([label, val]) => (
              <div key={label} style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12 }}>
                <span style={{ color: mutedColor }}>{label}</span>
                <span style={{ fontWeight: 600, color: textColor }}>{val}</span>
              </div>
            ))}
          </div>
          {hoveredEmployee.sparkline && hoveredEmployee.sparkline.some((v) => v > 0) && (
            <div style={{ marginTop: 10, paddingTop: 10, borderTop: `1px solid ${borderColor}` }}>
              <div style={{ fontSize: 11, color: mutedColor, marginBottom: 6, fontWeight: 600 }}>Daily orders (14d)</div>
              <svg viewBox="0 0 260 40" style={{ width: '100%', height: 40 }}>
                {(() => {
                  const vals = hoveredEmployee.sparkline
                  const mx = Math.max(...vals, 1)
                  const w = 260; const h = 40
                  const pts = vals.map((v, i) => ({ x: (i / (vals.length - 1)) * w, y: h - (v / mx) * (h - 4) - 2 }))
                  const line = pts.map((p, i) => `${i === 0 ? 'M' : 'L'}${p.x},${p.y}`).join(' ')
                  return (
                    <>
                      <path d={line} fill="none" stroke={chartColor} strokeWidth="1.5" />
                      {pts.map((p, i) => vals[i] > 0 && (
                        <circle key={i} cx={p.x} cy={p.y} r="2" fill={chartColor} />
                      ))}
                    </>
                  )
                })()}
              </svg>
            </div>
          )}
        </div>,
        document.body
      )}

      {/* Stat detail modal: chart on left, info on right */}
      <Modal
        isOpen={!!detailModalStatId}
        onClose={() => setDetailModalStatId(null)}
        title={detailModalStatId === 'gross_volume' ? 'Gross volume' : detailModalStatId === 'net_volume' ? 'Net volume' : ''}
        size="xl"
      >
        {detailModalStatId && (
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 320px', gap: 24, minHeight: 0 }}>
            <div style={{ display: 'flex', flexDirection: 'column', minWidth: 0 }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12, flexShrink: 0 }}>
                <span style={{ fontSize: 13, color: mutedColor }}>Chart type</span>
                <Dropdown
                  value={CHART_TYPE_OPTIONS.find((o) => o.id === (chartTypeByStatId[detailModalStatId] || 'line'))?.label ?? 'Line'}
                  options={CHART_TYPE_OPTIONS.map((o) => o.label)}
                  onSelect={(label) => {
                    const opt = CHART_TYPE_OPTIONS.find((o) => o.label === label)
                    if (opt) setChartTypeForStat(detailModalStatId, opt.id)
                  }}
                  isDarkMode={isDarkMode}
                  borderColor={borderColor}
                  bg={cardBg}
                  textColor={textColor}
                  mutedColor={mutedColor}
                />
              </div>
              <div style={{ height: 320, minHeight: 320, flexShrink: 0 }}>
                {detailModalStatId === 'gross_volume' && (
                  <MiniChartWithTooltip
                    data={chartGross}
                    dates={dates}
                    title="Gross volume"
                    height={300}
                    color={chartColor}
                    formatValue={formatCurrency}
                    comparisonValue={prevPeriod}
                    comparisonLabel="Previous period"
                    theme={{ cardBg, borderColor, textColor, mutedColor }}
                    chartType={chartTypeByStatId.gross_volume || 'line'}
                    tooltipFixedPosition
                  />
                )}
                {detailModalStatId === 'net_volume' && (
                  <MiniChartWithTooltip
                    data={chartNet}
                    dates={dates}
                    title="Net volume"
                    height={300}
                    color={chartColor}
                    formatValue={formatCurrency}
                    comparisonValue={prevPeriod}
                    comparisonLabel="Previous period"
                    theme={{ cardBg, borderColor, textColor, mutedColor }}
                    chartType={chartTypeByStatId.net_volume || 'line'}
                    tooltipFixedPosition
                  />
                )}
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 8, fontSize: 12, color: mutedColor, flexShrink: 0 }}>
                <span>{dates[0] || '—'}</span>
                <span>{dates[dates.length - 1] || '—'}</span>
              </div>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16, paddingLeft: 16, borderLeft: `1px solid ${borderColor}` }}>
              <div>
                <div style={{ fontSize: 13, color: mutedColor, marginBottom: 8 }}>
                  {detailModalStatId === 'gross_volume' && 'Total revenue (before refunds or fees) for the selected period. The chart shows daily or weekly values over time.'}
                  {detailModalStatId === 'net_volume' && 'Revenue after refunds for the selected period. The chart shows daily or weekly net values over time.'}
                </div>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontSize: 13, color: mutedColor }}>Current period</span>
                  <span style={{ fontSize: 16, fontWeight: 700, color: textColor }}>
                    {detailModalStatId === 'gross_volume' && formatCurrency(revWeek)}
                    {detailModalStatId === 'net_volume' && formatCurrency(netWeek)}
                  </span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontSize: 13, color: mutedColor }}>Previous period</span>
                  <span style={{ fontSize: 14, fontWeight: 600, color: textColor }}>{formatCurrency(prevPeriod)}</span>
                </div>
              </div>
              <div style={{ marginTop: 'auto', paddingTop: 16, fontSize: 12, color: mutedColor }}>
                Updated from platform
              </div>
            </div>
          </div>
        )}
      </Modal>

      <Modal isOpen={addModalOpen} onClose={() => setAddModalOpen(false)} title="Add statistics" size="lg">
        <p style={{ fontSize: 14, color: mutedColor, marginBottom: 20 }}>
          Choose a statistic to add to your overview page. Added items appear in the &quot;Added statistics&quot; section below.
        </p>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          {ADDABLE_STAT_OPTIONS.map((opt) => {
            const Icon = opt.icon
            const isAdded = addedWidgetIds.includes(opt.id)
            return (
              <div
                key={opt.id}
                style={{
                  background: cardBg,
                  borderRadius: 12,
                  border: `1px solid ${borderColor}`,
                  padding: '20px 24px',
                  position: 'relative'
                }}
              >
                {isAdded ? (
                  <button
                    type="button"
                    disabled
                    style={{
                      position: 'absolute',
                      top: 12,
                      right: 12,
                      display: 'flex',
                      alignItems: 'center',
                      gap: 4,
                      background: chartColor,
                      border: 'none',
                      borderRadius: 8,
                      padding: '6px 12px',
                      fontSize: 12,
                      cursor: 'default',
                      color: '#fff',
                      fontWeight: 600,
                      opacity: 0.7
                    }}
                  >
                    Added
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={() => handleAddWidget(opt.id)}
                    style={{
                      position: 'absolute',
                      top: 12,
                      right: 12,
                      display: 'flex',
                      alignItems: 'center',
                      gap: 4,
                      background: chartColor,
                      border: 'none',
                      borderRadius: 8,
                      padding: '6px 12px',
                      fontSize: 12,
                      cursor: 'pointer',
                      color: '#fff',
                      fontWeight: 600,
                      zIndex: 1
                    }}
                  >
                    <Plus size={12} /> Add
                  </button>
                )}
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
                    {Icon && <Icon size={18} color={chartColor} />}
                    <span style={{ fontSize: 14, fontWeight: 600, color: textColor }}>{opt.label}</span>
                  </div>
                  {opt.id === 'weekly_revenue_chart' && (
                    <div style={{ height: 100 }}>
                      <MiniChartWithTooltip
                        data={chartGross}
                        dates={dates}
                        title="Weekly revenue"
                        height={80}
                        color={chartColor}
                        formatValue={formatCurrency}
                        comparisonValue={prevPeriod}
                        comparisonLabel="Previous period"
                        theme={{ cardBg, borderColor, textColor, mutedColor }}
                        chartType={chartTypeByStatId.gross_volume || 'line'}
                      />
                    </div>
                  )}
                  {opt.id === 'order_status_breakdown' && (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                      {Object.entries(stats?.order_status_breakdown ?? {}).map(([status, count]) => (
                        <div key={status} style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, color: textColor }}>
                          <span>{status}</span>
                          <span>{count} order(s)</span>
                        </div>
                      ))}
                      {Object.keys(stats?.order_status_breakdown ?? {}).length === 0 && <span style={{ fontSize: 13, color: mutedColor }}>No data</span>}
                    </div>
                  )}
                  {opt.id === 'top_products' && (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                      {(stats?.top_products ?? []).slice(0, 5).map((p, i) => (
                        <div key={p.product_id || i} style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, color: textColor }}>
                          <span>{p.product_name}</span>
                          <span>{p.total_quantity} sold · {formatCurrency(p.total_revenue)}</span>
                        </div>
                      ))}
                      {(stats?.top_products ?? []).length === 0 && <span style={{ fontSize: 13, color: mutedColor }}>No data</span>}
                    </div>
                  )}
                  {opt.id === 'today_revenue' && (
                    <div style={{ fontSize: 24, fontWeight: 700, color: textColor }}>{formatCurrency(stats?.revenue?.today ?? 0)}</div>
                  )}
                  {opt.id === 'inventory_snapshot' && (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 8, fontSize: 13, color: textColor }}>
                      <div>Total products: <strong>{stats?.inventory?.total_products ?? 0}</strong></div>
                      <div>Low stock (≤10): <strong>{stats?.inventory?.low_stock ?? 0}</strong></div>
                      <div>Inventory value: <strong>{formatCurrency(stats?.inventory?.total_value)}</strong></div>
                    </div>
                  )}
                  {opt.id === 'discounts_summary' && (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 8, fontSize: 13, color: textColor }}>
                      <div>Today: {formatCurrency(stats?.discount?.today)}</div>
                      <div>This week: {formatCurrency(stats?.discount?.week)}</div>
                      <div>This month: {formatCurrency(stats?.discount?.month)}</div>
                    </div>
                  )}
                  {opt.id === 'customers_count' && (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 8, fontSize: 13, color: textColor }}>
                      <div>Total customers: <strong>{stats?.customers_total ?? 0}</strong></div>
                      <div>With loyalty points: <strong>{stats?.customers_in_rewards ?? 0}</strong></div>
                    </div>
                  )}
              </div>
            )
          })}
        </div>
      </Modal>
    </div>
  )
}
