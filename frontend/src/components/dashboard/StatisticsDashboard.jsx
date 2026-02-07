import { useState, useEffect, useCallback } from 'react'
import DashboardGrid from './DashboardGrid'
import WidgetLibrary from './WidgetLibrary'
import {
  getWidgetById,
  WIDGET_SIZES,
  STORAGE_KEY_LAYOUT,
  STORAGE_KEY_WIDGETS
} from './widgetRegistry'

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

  return (
    <>
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
      <WidgetLibrary
        open={widgetLibraryOpen}
        onClose={() => setWidgetLibraryOpen(false)}
        onAddWidget={addWidget}
      />
    </>
  )
}
