import { useState, useEffect } from 'react'
import { useTheme } from '../contexts/ThemeContext'
import Statistics from '../components/Statistics'

function StatisticsPage() {
  const { themeMode } = useTheme()
  
  // Determine if dark mode is active
  const [isDarkMode, setIsDarkMode] = useState(() => {
    return document.documentElement.classList.contains('dark-theme')
  })
  
  useEffect(() => {
    const checkDarkMode = () => {
      setIsDarkMode(document.documentElement.classList.contains('dark-theme'))
    }
    
    checkDarkMode()
    
    const observer = new MutationObserver(checkDarkMode)
    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ['class']
    })
    
    return () => observer.disconnect()
  }, [themeMode])
  
  const backgroundColor = isDarkMode ? '#1a1a1a' : '#f5f5f5'
  const cardBackgroundColor = isDarkMode ? '#2a2a2a' : 'white'
  const borderColor = isDarkMode ? '#3a3a3a' : '#e0e0e0'
  const textColor = isDarkMode ? '#ffffff' : '#1a1a1a'
  const boxShadow = isDarkMode ? '0 2px 8px rgba(0,0,0,0.3)' : '0 2px 8px rgba(0,0,0,0.08)'
  
  return (
    <div style={{ 
      padding: '32px 24px', 
      backgroundColor: backgroundColor, 
      minHeight: 'calc(100vh - 200px)',
      maxWidth: '1400px',
      margin: '0 auto',
      transition: 'background-color 0.3s ease'
    }}>
      <div style={{
        border: `1px solid ${borderColor}`,
        borderRadius: '12px',
        padding: '28px',
        backgroundColor: cardBackgroundColor,
        boxShadow: boxShadow,
        minHeight: '600px',
        transition: 'background-color 0.3s ease, border-color 0.3s ease, box-shadow 0.3s ease'
      }}>
        <h1 style={{ 
          margin: '0 0 24px 0', 
          fontSize: '28px', 
          fontWeight: 600,
          color: textColor,
          fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Display", sans-serif',
          transition: 'color 0.3s ease'
        }}>
          Statistics
        </h1>
        <div style={{ height: 'calc(100vh - 350px)', minHeight: '500px' }}>
          <Statistics />
        </div>
      </div>
    </div>
  )
}

export default StatisticsPage

