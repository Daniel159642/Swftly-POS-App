import { useState, useEffect } from 'react'
import { useTheme } from '../contexts/ThemeContext'
import Statistics from '../components/Statistics'
import StatisticsDashboard from '../components/dashboard/StatisticsDashboard'
import { LayoutGrid, BarChart3 } from 'lucide-react'

function StatisticsPage() {
  const { themeMode, themeColor } = useTheme()
  const [viewMode, setViewMode] = useState(() => {
    try {
      return localStorage.getItem('statistics-view-mode') || 'widgets'
    } catch (_) {
      return 'widgets'
    }
  })
  const [isDarkMode, setIsDarkMode] = useState(() =>
    document.documentElement.classList.contains('dark-theme')
  )

  useEffect(() => {
    const checkDarkMode = () =>
      setIsDarkMode(document.documentElement.classList.contains('dark-theme'))
    checkDarkMode()
    const observer = new MutationObserver(checkDarkMode)
    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ['class']
    })
    return () => observer.disconnect()
  }, [themeMode])

  useEffect(() => {
    try {
      localStorage.setItem('statistics-view-mode', viewMode)
    } catch (_) {}
  }, [viewMode])

  const hexToRgb = (hex) => {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex)
    return result ? `${parseInt(result[1], 16)}, ${parseInt(result[2], 16)}, ${parseInt(result[3], 16)}` : '107, 163, 240'
  }
  const themeColorRgb = hexToRgb(themeColor || '#6ba3f0')
  const backgroundColor = isDarkMode ? 'var(--bg-primary, #1a1a1a)' : 'var(--bg-primary, #ffffff)'
  const textColor = isDarkMode ? 'var(--text-primary, #fff)' : '#333'
  const borderColor = isDarkMode ? '#3a3a3a' : '#e0e0e0'

  return (
    <div style={{
      minHeight: '100vh',
      width: '100%',
      backgroundColor,
      padding: '24px 32px 48px',
      maxWidth: '1600px',
      margin: '0 auto'
    }}>
      <div style={{
        display: 'flex',
        alignItems: 'center',
        gap: '8px',
        marginBottom: '20px',
        flexWrap: 'wrap'
      }}>
        <span style={{ fontSize: '14px', fontWeight: 600, color: textColor, marginRight: '8px' }}>
          View:
        </span>
        <button
          type="button"
          onClick={() => setViewMode('widgets')}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            padding: '8px 16px',
            borderRadius: '8px',
            border: `1px solid ${viewMode === 'widgets' ? themeColor : borderColor}`,
            backgroundColor: viewMode === 'widgets' ? `rgba(${themeColorRgb}, 0.15)` : 'transparent',
            color: viewMode === 'widgets' ? themeColor : textColor,
            fontWeight: viewMode === 'widgets' ? 600 : 500,
            cursor: 'pointer',
            fontSize: '14px'
          }}
        >
          <LayoutGrid size={18} />
          Widget dashboard
        </button>
        <button
          type="button"
          onClick={() => setViewMode('classic')}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            padding: '8px 16px',
            borderRadius: '8px',
            border: `1px solid ${viewMode === 'classic' ? themeColor : borderColor}`,
            backgroundColor: viewMode === 'classic' ? `rgba(${themeColorRgb}, 0.15)` : 'transparent',
            color: viewMode === 'classic' ? themeColor : textColor,
            fontWeight: viewMode === 'classic' ? 600 : 500,
            cursor: 'pointer',
            fontSize: '14px'
          }}
        >
          <BarChart3 size={18} />
          Classic view
        </button>
      </div>
      <div style={{ width: '100%', minHeight: 'calc(100vh - 140px)' }}>
        {viewMode === 'widgets' ? <StatisticsDashboard /> : <Statistics />}
      </div>
    </div>
  )
}

export default StatisticsPage

