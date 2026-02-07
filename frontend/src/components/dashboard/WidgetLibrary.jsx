import { useTheme } from '../../contexts/ThemeContext'
import { WIDGET_DEFINITIONS, CATEGORIES, CHART_TYPES } from './widgetRegistry'
import { DollarSign, Package, Users, TrendingUp, Box } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'

const CATEGORY_ICONS = {
  sales: DollarSign,
  product: Package,
  customer: Users,
  time: TrendingUp,
  inventory: Box
}

export default function WidgetLibrary({ open, onClose, onAddWidget }) {
  const { themeColor } = useTheme()
  const isDarkMode = document.documentElement.classList.contains('dark-theme')
  const bg = isDarkMode ? '#1e1e1e' : '#fff'
  const border = isDarkMode ? '#333' : '#e5e7eb'
  const text = isDarkMode ? '#fff' : '#1a1a1a'
  const muted = isDarkMode ? '#888' : '#666'

  const byCategory = {}
  WIDGET_DEFINITIONS.forEach(w => {
    if (!byCategory[w.category]) byCategory[w.category] = []
    byCategory[w.category].push(w)
  })
  const categoryOrder = ['sales', 'product', 'inventory', 'customer', 'time']

  if (!open) return null

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        style={{
          position: 'fixed',
          inset: 0,
          zIndex: 1000,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: 'rgba(0,0,0,0.5)',
          padding: '24px'
        }}
        onClick={onClose}
      >
        <motion.div
          initial={{ scale: 0.95, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.95, opacity: 0 }}
          transition={{ type: 'spring', duration: 0.3 }}
          onClick={e => e.stopPropagation()}
          style={{
            backgroundColor: bg,
            borderRadius: '16px',
            maxWidth: '560px',
            width: '100%',
            maxHeight: '85vh',
            overflow: 'hidden',
            display: 'flex',
            flexDirection: 'column',
            boxShadow: '0 24px 48px rgba(0,0,0,0.2)',
            border: `1px solid ${border}`
          }}
        >
          <div style={{ padding: '20px 24px', borderBottom: `1px solid ${border}`, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <h2 style={{ margin: 0, fontSize: '20px', fontWeight: 700, color: text }}>Widget library</h2>
            <button
              type="button"
              onClick={onClose}
              style={{ background: 'none', border: 'none', fontSize: '24px', color: muted, cursor: 'pointer', padding: '0 4px', lineHeight: 1 }}
              aria-label="Close"
            >
              ×
            </button>
          </div>
          <div style={{ overflow: 'auto', padding: '20px 24px', flex: 1 }}>
            {categoryOrder.map(catId => {
              const items = byCategory[catId]
              if (!items?.length) return null
              const cat = CATEGORIES[catId]
              const Icon = CATEGORY_ICONS[catId]
              return (
                <div key={catId} style={{ marginBottom: '24px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px', color: muted, fontSize: '13px', fontWeight: 600, textTransform: 'uppercase' }}>
                    {Icon && <Icon size={18} />}
                    {cat?.label ?? catId}
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    {items.map(w => (
                      <div
                        key={w.id}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          padding: '12px 16px',
                          backgroundColor: isDarkMode ? '#2a2a2a' : '#f9fafb',
                          borderRadius: '10px',
                          border: `1px solid ${border}`
                        }}
                      >
                        <div>
                          <div style={{ fontWeight: 600, color: text, fontSize: '14px' }}>{w.label}</div>
                          <div style={{ fontSize: '12px', color: muted, marginTop: '2px' }}>
                            {w.supportedCharts.map(cid => CHART_TYPES.find(t => t.id === cid)?.label || cid).join(', ')}
                          </div>
                        </div>
                        <button
                          type="button"
                          onClick={() => { onAddWidget(w.id); onClose() }}
                          style={{
                            padding: '8px 16px',
                            borderRadius: '8px',
                            border: 'none',
                            backgroundColor: themeColor,
                            color: '#fff',
                            fontWeight: 600,
                            cursor: 'pointer',
                            fontSize: '13px'
                          }}
                        >
                          Add
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )
            })}
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  )
}
