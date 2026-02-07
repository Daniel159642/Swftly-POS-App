import { useState, useEffect } from 'react'
import GridLayout, { useContainerWidth } from 'react-grid-layout'
import 'react-grid-layout/css/styles.css'
import 'react-resizable/css/styles.css'
import { useTheme } from '../../contexts/ThemeContext'
import { Plus } from 'lucide-react'
import WidgetCard from './WidgetCard'

export default function DashboardGrid({
  stats,
  loading,
  error,
  layout,
  widgets,
  onLayoutChange,
  onRemoveWidget,
  onWidgetChartTypeChange,
  onWidgetTimeRangeChange,
  onOpenWidgetLibrary
}) {
  const { themeColor } = useTheme()
  const { width, containerRef } = useContainerWidth({ initialWidth: 1280 })
  const [isDarkMode, setIsDarkMode] = useState(() => document.documentElement.classList.contains('dark-theme'))

  useEffect(() => {
    const check = () => setIsDarkMode(document.documentElement.classList.contains('dark-theme'))
    const obs = new MutationObserver(check)
    obs.observe(document.documentElement, { attributes: true, attributeFilter: ['class'] })
    return () => obs.disconnect()
  }, [])

  const gridBg = isDarkMode ? '#1a1a1a' : '#f5f5f5'
  const textColor = isDarkMode ? '#fff' : '#333'

  if (loading) {
    return (
      <div style={{ padding: '48px', textAlign: 'center', color: textColor, minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', width: '100%', backgroundColor: gridBg }}>
        Loading dashboard…
      </div>
    )
  }
  if (error) {
    return (
      <div style={{ padding: '48px', textAlign: 'center', color: '#c00', minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', width: '100%', backgroundColor: gridBg }}>
        {error}
      </div>
    )
  }

  return (
    <div style={{ padding: '24px', minHeight: '100vh', height: '100%', backgroundColor: gridBg, width: '100%', boxSizing: 'border-box' }} ref={containerRef}>
      <GridLayout
        className="layout"
        width={width}
        layout={Array.isArray(layout) ? layout : []}
        onLayoutChange={onLayoutChange}
        gridConfig={{ cols: 6, rowHeight: 120, margin: [16, 16], containerPadding: [0, 0] }}
        dragConfig={{ handle: '.widget-drag-handle' }}
      >
        {(Array.isArray(layout) ? layout : []).map(item => {
          const w = widgets.find(ww => ww.id === item.i)
          if (!w) return <div key={item.i} />
          return (
            <div key={item.i} style={{ overflow: 'hidden' }}>
              <WidgetCard
                widgetId={w.widgetId}
                chartType={w.chartType}
                size={w.size}
                stats={stats}
                onChartTypeChange={ct => onWidgetChartTypeChange(w.id, ct)}
                onRemove={() => onRemoveWidget(w.id)}
                isDarkMode={isDarkMode}
                dragHandleClassName="widget-drag-handle"
                timeRange={w.timeRange}
                onTimeRangeChange={tr => onWidgetTimeRangeChange?.(w.id, tr)}
              />
            </div>
          )
        })}
      </GridLayout>
      <button
        type="button"
        onClick={onOpenWidgetLibrary}
        title="Add widget"
        style={{
          position: 'fixed',
          bottom: '24px',
          right: '24px',
          width: '56px',
          height: '56px',
          borderRadius: '50%',
          border: 'none',
          backgroundColor: themeColor,
          color: '#fff',
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          boxShadow: '0 4px 12px rgba(0,0,0,0.15)'
        }}
      >
        <Plus size={24} />
      </button>
    </div>
  )
}
