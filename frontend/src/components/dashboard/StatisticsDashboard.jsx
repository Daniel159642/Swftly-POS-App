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
  { id: 'layout-0', widgetId: 'revenue_today', chartType: 'number', size: 'small' },
  { id: 'layout-1', widgetId: 'revenue_week', chartType: 'number', size: 'small' },
  { id: 'layout-2', widgetId: 'weekly_revenue', chartType: 'bar', size: 'medium' },
  { id: 'layout-3', widgetId: 'order_status', chartType: 'donut', size: 'medium' }
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

function loadSavedWidgets() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY_WIDGETS)
    if (raw) return JSON.parse(raw)
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
      const newWidget = { id, widgetId, chartType: def.defaultChart || 'number', size }
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
