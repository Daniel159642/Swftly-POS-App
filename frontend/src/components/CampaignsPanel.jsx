import React, { useState, useEffect } from 'react'
import { useTheme } from '../contexts/ThemeContext'
import { ChevronRight, Plus } from 'lucide-react'
import AutomationCampaignModal from './AutomationCampaignModal'

const hexToRgb = (hex) => {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex)
  return result ? `${parseInt(result[1], 16)}, ${parseInt(result[2], 16)}, ${parseInt(result[3], 16)}` : '59, 130, 246'
}

export default function CampaignsPanel() {
  const { themeColor, themeMode } = useTheme()
  const themeColorRgb = hexToRgb(themeColor)
  const isDarkMode = themeMode === 'dark'
  const [activeTemplate, setActiveTemplate] = useState(null)
  
  const [stats, setStats] = useState(null)
  const [storeSettings, setStoreSettings] = useState(null)
  const [loadingStats, setLoadingStats] = useState(true)

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [statsRes, storeRes] = await Promise.all([
          fetch('/api/dashboard/statistics'),
          fetch('/api/store_location')
        ])
        
        if (statsRes.ok) {
          const statsData = await statsRes.json()
          setStats(statsData)
        }
        
        if (storeRes.ok) {
          const storeData = await storeRes.json()
          setStoreSettings(storeData)
        }
      } catch (err) {
        console.error('Failed to fetch dashboard data:', err)
      } finally {
        setLoadingStats(false)
      }
    }
    fetchData()
  }, [])

  const containerStyle = {
    backgroundColor: isDarkMode ? 'rgba(30, 41, 59, 0.5)' : '#ffffff',
    borderRadius: '12px',
    padding: '24px',
    border: `1px solid ${isDarkMode ? 'rgba(255,255,255,0.1)' : '#e5e7eb'}`,
    boxShadow: isDarkMode ? '0 4px 20px rgba(0,0,0,0.4)' : '0 4px 20px rgba(148,163,184,0.1)',
    display: 'flex',
    flexDirection: 'column',
    gap: '20px',
    height: '100%',
    backdropFilter: 'blur(10px)',
    transition: 'all 0.3s ease'
  }

  const sectionTitleStyle = {
    fontSize: '16px',
    fontWeight: 700,
    color: isDarkMode ? '#f8fafc' : '#1e293b',
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
    marginBottom: '4px'
  }

  const promoCardStyle = {
    padding: '16px',
    borderRadius: '8px',
    cursor: 'pointer',
    backgroundColor: isDarkMode ? 'rgba(15,23,42,0.4)' : '#f8fafc',
    border: `1px solid ${isDarkMode ? 'rgba(255,255,255,0.05)' : '#f1f5f9'}`,
    transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
    display: 'flex',
    flexDirection: 'column',
    gap: '8px'
  }

  const statCardStyle = {
    backgroundColor: isDarkMode ? 'rgba(15, 23, 42, 0.3)' : '#ffffff',
    border: `1px solid ${isDarkMode ? 'rgba(255,255,255,0.1)' : '#f1f5f9'}`,
    borderRadius: '8px',
    padding: '16px',
    flex: 1,
    display: 'flex',
    flexDirection: 'column',
    gap: '4px'
  }

  return (
    <div style={{ marginTop: '16px', display: 'flex', flexDirection: 'column', gap: '24px' }}>
      <div style={{ 
        display: 'grid', 
        gridTemplateColumns: 'repeat(3, 1fr)', 
        gridAutoRows: '1fr',
        gap: '24px',
        alignItems: 'stretch'
      }}>
        {/* TOP LEFT: NEW CAMPAIGN CONTAINER */}
        <div style={containerStyle}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <div>
              <h2 style={sectionTitleStyle}>
                New Campaign
              </h2>
              <p style={{ fontSize: '13px', color: '#64748b' }}>Create target reach for your customers</p>
            </div>
          </div>
          
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
            <div 
              style={promoCardStyle}
              onClick={() => setActiveTemplate('custom')}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = 'translateY(-2px)'
                e.currentTarget.style.backgroundColor = isDarkMode ? 'rgba(15,23,42,0.6)' : '#ffffff'
                e.currentTarget.style.boxShadow = '0 8px 15px rgba(0,0,0,0.1)'
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = 'translateY(0)'
                e.currentTarget.style.backgroundColor = isDarkMode ? 'rgba(15,23,42,0.4)' : '#f8fafc'
                e.currentTarget.style.boxShadow = 'none'
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#3b82f6' }}>
                <span style={{ fontSize: '14px', fontWeight: 600 }}>Discount</span>
              </div>
              <p style={{ fontSize: '12px', color: '#64748b' }}>Item, category, or order-wide coupons</p>
            </div>

            <div 
              style={promoCardStyle}
              onClick={() => setActiveTemplate('custom')}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = 'translateY(-2px)'
                e.currentTarget.style.backgroundColor = isDarkMode ? 'rgba(15,23,42,0.6)' : '#ffffff'
                e.currentTarget.style.boxShadow = '0 8px 15px rgba(0,0,0,0.1)'
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = 'translateY(0)'
                e.currentTarget.style.backgroundColor = isDarkMode ? 'rgba(15,23,42,0.4)' : '#f8fafc'
                e.currentTarget.style.boxShadow = 'none'
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#10b981' }}>
                <span style={{ fontSize: '14px', fontWeight: 600 }}>Promotion</span>
              </div>
              <p style={{ fontSize: '12px', color: '#64748b' }}>Announce new inventory & arrivals</p>
            </div>

            <div 
              style={{...promoCardStyle, gridColumn: 'span 2'}}
              onClick={() => setActiveTemplate('custom')}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = 'translateY(-2px)'
                e.currentTarget.style.backgroundColor = isDarkMode ? 'rgba(15,23,42,0.6)' : '#ffffff'
                e.currentTarget.style.boxShadow = '0 8px 15px rgba(0,0,0,0.1)'
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = 'translateY(0)'
                e.currentTarget.style.backgroundColor = isDarkMode ? 'rgba(15,23,42,0.4)' : '#f8fafc'
                e.currentTarget.style.boxShadow = 'none'
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: themeColor }}>
                <span style={{ fontSize: '14px', fontWeight: 600 }}>Event / Flash Sale</span>
              </div>
              <p style={{ fontSize: '12px', color: '#64748b' }}>Time-limited offers and special weekend events</p>
            </div>
          </div>
        </div>

        <div style={{...containerStyle, gridColumn: 'span 2'}}>
          <div style={{ 
            flex: 1, 
            display: 'flex', 
            alignItems: 'center', 
            justifyContent: 'center',
            opacity: 0.5,
            border: `1px dashed ${isDarkMode ? 'rgba(255,255,255,0.1)' : '#cbd5e1'}`,
            borderRadius: '8px',
            backgroundColor: isDarkMode ? 'rgba(15,23,42,0.2)' : '#f8fafc'
          }}>
            <div style={{ textAlign: 'center', color: '#64748b' }}>
              <div style={{ fontSize: '13px', fontWeight: 500 }}>Statistics appearing soon</div>
            </div>
          </div>
        </div>

        <div style={containerStyle}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <div>
              <h2 style={sectionTitleStyle}>
                {storeSettings?.store_name || 'Store'} Rewards
              </h2>
              <p style={{ fontSize: '13px', color: '#64748b' }}>Loyalty program configuration</p>
            </div>
          </div>
          
          <div style={{ 
            flex: 1, 
            display: 'flex', 
            flexDirection: 'column', 
            gap: '12px',
            padding: '16px',
            backgroundColor: isDarkMode ? 'rgba(245, 158, 11, 0.05)' : '#fffaf0',
            borderRadius: '8px',
            border: `1px solid ${isDarkMode ? 'rgba(245, 158, 11, 0.1)' : '#fed7aa'}`
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: '13px', color: isDarkMode ? '#f8fafc' : '#1e293b', fontWeight: 600 }}>Earning Rate</span>
              <span style={{ fontSize: '13px', color: '#f59e0b', fontWeight: 700 }}>1 Point / $1</span>
            </div>
            <div style={{ height: '1px', backgroundColor: isDarkMode ? 'rgba(255,255,255,0.05)' : '#f1f5f9' }} />
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: '13px', color: isDarkMode ? '#f8fafc' : '#1e293b', fontWeight: 600 }}>Active Tiers</span>
              <span style={{ fontSize: '13px', color: '#64748b' }}>Standard, Premium</span>
            </div>
            <button style={{
              marginTop: 'auto',
              padding: '10px',
              borderRadius: '6px',
              backgroundColor: isDarkMode ? 'rgba(245, 158, 11, 0.1)' : '#fff',
              border: `1px solid ${isDarkMode ? 'rgba(245, 158, 11, 0.2)' : '#f59e0b'}`,
              color: '#f59e0b',
              fontSize: '12px',
              fontWeight: 600,
              cursor: 'pointer'
            }}>
              Manage Rewards Settings
            </button>
          </div>
        </div>

        <div style={containerStyle}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <h2 style={sectionTitleStyle}>
              Automations
            </h2>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span style={{ 
                fontSize: '11px', 
                padding: '4px 10px', 
                borderRadius: '999px', 
                backgroundColor: 'rgba(59, 130, 246, 0.1)', 
                color: '#3b82f6',
                fontWeight: 700,
                letterSpacing: '0.02em'
              }}>
                4 ACTIVE
              </span>
              <button 
                onClick={() => setActiveTemplate('custom')}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  width: '24px',
                  height: '24px',
                  borderRadius: '6px',
                  backgroundColor: isDarkMode ? 'rgba(255,255,255,0.05)' : '#f1f5f9',
                  border: 'none',
                  cursor: 'pointer',
                  color: isDarkMode ? '#f8fafc' : '#1e293b'
                }}>
                <Plus size={14} />
              </button>
            </div>
          </div>

          <div style={{ 
            display: 'flex', 
            flexDirection: 'column', 
            gap: '8px',
            maxHeight: '180px',
            overflowY: 'auto',
            paddingRight: '4px'
          }}>
            {[
              { id: 'welcome', name: 'Welcome Message', description: 'Triggered on first purchase' },
              { id: 'birthday', name: 'Birthday Reward', description: 'Automated annual gift' },
              { id: 'winback', name: 'Win-back Series', description: 'Re-engage inactive customers' },
              { id: 'loyalty', name: 'Tier Up Alert', description: 'Notification on reach gold' }
            ].map((auto) => (
              <div 
                key={auto.id}
                onClick={() => setActiveTemplate(auto.id === 'custom' ? null : auto.id)}
                style={{
                  padding: '14px 18px',
                  borderRadius: '8px',
                  backgroundColor: auto.isAction ? 'transparent' : (isDarkMode ? 'rgba(15,23,42,0.3)' : '#f8fafc'),
                  border: auto.isAction 
                    ? `1px dashed ${isDarkMode ? 'rgba(255,255,255,0.2)' : '#cbd5e1'}`
                    : `1px solid ${isDarkMode ? 'rgba(255,255,255,0.05)' : '#f1f5f9'}`,
                  cursor: 'pointer',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '2px',
                  transition: 'all 0.2s ease',
                  position: 'relative',
                  flexShrink: 0
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = isDarkMode ? 'rgba(15,23,42,0.5)' : '#ffffff'
                  e.currentTarget.style.borderColor = themeColor
                  if (auto.isAction) e.currentTarget.style.borderStyle = 'solid'
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = auto.isAction ? 'transparent' : (isDarkMode ? 'rgba(15,23,42,0.3)' : '#f8fafc')
                  e.currentTarget.style.borderColor = auto.isAction 
                    ? (isDarkMode ? 'rgba(255,255,255,0.2)' : '#cbd5e1')
                    : (isDarkMode ? 'rgba(255,255,255,0.05)' : '#f1f5f9')
                  if (auto.isAction) e.currentTarget.style.borderStyle = 'dashed'
                }}
              >
                <div style={{ 
                  fontSize: '14px', 
                  fontWeight: 600, 
                  color: auto.isAction ? themeColor : (isDarkMode ? '#f8fafc' : '#1e293b') 
                }}>
                  {auto.name}
                </div>
                <div style={{ fontSize: '11px', color: '#64748b' }}>{auto.description}</div>
              </div>
            ))}
          </div>
        </div>

        {/* BOTTOM RIGHT: ACTIVE CAMPAIGNS CONTAINER */}
        <div style={containerStyle}>
          <h2 style={sectionTitleStyle}>
            Active Campaigns
          </h2>
          
          <div style={{ 
            flex: 1, 
            display: 'flex', 
            flexDirection: 'column', 
            justifyContent: 'center', 
            alignItems: 'center',
            gap: '12px',
            opacity: 0.8
          }}>
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: '14px', fontWeight: 600, color: isDarkMode ? '#f8fafc' : '#1e293b' }}>No Ongoing Campaigns</div>
            </div>
          </div>
        </div>
      </div>

      <AutomationCampaignModal
        open={Boolean(activeTemplate)}
        onClose={() => setActiveTemplate(null)}
        templateKey={activeTemplate === 'custom' ? null : activeTemplate}
      />
    </div>
  )
}

