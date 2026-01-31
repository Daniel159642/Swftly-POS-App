import { createContext, useContext, useState, useCallback, useEffect } from 'react'
import { CheckCircle, AlertCircle, XCircle } from 'lucide-react'

const ToastContext = createContext(null)

export function ToastProvider({ children }) {
  const [toast, setToast] = useState(null) // { message, type: 'success' | 'error' | 'warning', action?: { label, onClick } }

  const show = useCallback((message, type = 'success', action) => {
    setToast({ message, type, action: action || undefined })
  }, [])

  useEffect(() => {
    if (!toast) return
    const t = setTimeout(() => setToast(null), 4000)
    return () => clearTimeout(t)
  }, [toast])

  return (
    <ToastContext.Provider value={{ show, toast, setToast }}>
      {children}
      {toast && (
        <div
          role="status"
          aria-live="polite"
          style={{
            position: 'fixed',
            bottom: '24px',
            left: '50%',
            transform: 'translateX(-50%)',
            display: 'flex',
            alignItems: 'center',
            gap: '12px',
            padding: '12px 20px',
            backgroundColor: 'var(--bg-secondary, #2d2d2d)',
            color: 'var(--text-primary, #fff)',
            border: '1px solid var(--border-color, #404040)',
            borderRadius: '12px',
            boxShadow: '0 4px 20px rgba(0,0,0,0.3)',
            zIndex: 10001,
            fontSize: '14px',
            fontWeight: 500,
            maxWidth: '90vw'
          }}
          onClick={() => setToast(null)}
        >
          {toast.type === 'error' && <XCircle size={20} style={{ flexShrink: 0, color: '#ef4444' }} />}
          {toast.type === 'warning' && <AlertCircle size={20} style={{ flexShrink: 0, color: '#f59e0b' }} />}
          {toast.type === 'success' && <CheckCircle size={20} style={{ flexShrink: 0, color: '#10b981' }} />}
          <span style={{ flex: 1 }}>{toast.message}</span>
          {toast.action && (
            <button
              type="button"
              onClick={(e) => { e.stopPropagation(); toast.action?.onClick?.() }}
              style={{
                flexShrink: 0,
                padding: '8px 16px',
                backgroundColor: 'var(--color-primary, #10b981)',
                color: '#fff',
                border: 'none',
                borderRadius: '8px',
                fontSize: '14px',
                fontWeight: 600,
                cursor: 'pointer',
                whiteSpace: 'nowrap'
              }}
            >
              {toast.action.label}
            </button>
          )}
        </div>
      )}
    </ToastContext.Provider>
  )
}

export function useToast() {
  const ctx = useContext(ToastContext)
  if (!ctx) return { show: () => {}, toast: null, setToast: () => {} }
  return ctx
}
