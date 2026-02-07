import { useState, useEffect } from 'react'
import GridLayout, { useContainerWidth } from 'react-grid-layout'
import 'react-grid-layout/css/styles.css'
import 'react-resizable/css/styles.css'
import { useTheme } from '../../contexts/ThemeContext'
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
      <div style={{ padding: '48px', textAlign: 'center', color: textColor }}>
        Loading dashboard…
      </div>
    )
  }
  if (error) {
    return (
      <div style={{ padding: '48px', textAlign: 'center', color: '#c00' }}>
        {error}
      </div>
    )
  }

  return (
    <div style={{ padding: '24px', minHeight: '100%', backgroundColor: gridBg, width: '100%' }} ref={containerRef}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px', flexWrap: 'wrap', gap: '16px' }}>
        <h1 style={{ margin: 0, fontSize: '24px', fontWeight: 700, color: textColor }}>Statistics Dashboard</h1>
        <button
          type="button"
          onClick={onOpenWidgetLibrary}
          style={{
            padding: '10px 20px',
            borderRadius: '10px',
            border: 'none',
            backgroundColor: themeColor,
            color: '#fff',
            fontWeight: 600,
            cursor: 'pointer',
            fontSize: '14px'
          }}
        >
          Add widget
        </button>
      </div>
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
              <div
                className="widget-drag-handle"
                style={{
                  position: 'absolute',
                  top: 0,
                  left: 0,
                  right: 0,
                  height: '28px',
                  zIndex: 1,
                  cursor: 'grab',
                  background: 'linear-gradient(180deg, rgba(128,128,128,0.15) 0%, transparent 100%)',
                  borderRadius: '12px 12px 0 0'
                }}
              />
              <div style={{ paddingTop: '28px', height: '100%', boxSizing: 'border-box' }}>
                <WidgetCard
                  widgetId={w.widgetId}
                  chartType={w.chartType}
                  size={w.size}
                  stats={stats}
                onChartTypeChange={ct => onWidgetChartTypeChange(w.id, ct)}
                onRemove={() => onRemoveWidget(w.id)}
                  isDarkMode={isDarkMode}
                />
              </div>
            </div>
          )
        })}
      </GridLayout>
    </div>
  )
}
