import { createContext, useContext, useState, useCallback, useEffect } from 'react'
import { CheckCircle, AlertCircle, XCircle } from 'lucide-react'

const ToastContext = createContext(null)

export function ToastProvider({ children }) {
  const [toast, setToast] = useState(null) // { message, type: 'success' | 'error' | 'warning', action?: { label, onClick } }

  const show = useCallback((message, type = 'success', actionOrOptions) => {
    const action = actionOrOptions && (actionOrOptions.label != null || actionOrOptions.onClick != null)
      ? actionOrOptions
      : undefined
    const icon = actionOrOptions && actionOrOptions.icon ? actionOrOptions.icon : undefined
    setToast({ message, type, action: action || undefined, icon: icon || undefined })
  }, [])

  useEffect(() => {
    if (!toast) return
    const t = setTimeout(() => setToast(null), 4000)
    return () => clearTimeout(t)
  }, [toast])

  const handleToastClick = () => {
    if (toast?.action?.onClick) {
      toast.action.onClick()
    }
    setToast(null)
  }

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
            borderRadius: '24px',
            boxShadow: '0 2px 12px rgba(0,0,0,0.2)',
            zIndex: 10001,
            fontSize: '14px',
            fontWeight: 500,
            maxWidth: '90vw',
            cursor: toast.action?.onClick ? 'pointer' : 'default'
          }}
          onClick={handleToastClick}
        >
          {toast.icon ? (
            <img src={toast.icon.src} alt="" style={{ height: '22px', width: 'auto', maxWidth: '72px', objectFit: 'contain', flexShrink: 0 }} />
          ) : (
            <>
              {toast.type === 'error' && <XCircle size={20} style={{ flexShrink: 0, color: toast.action?.iconColor ?? '#ef4444' }} />}
              {toast.type === 'warning' && <AlertCircle size={20} style={{ flexShrink: 0, color: toast.action?.iconColor ?? '#f59e0b' }} />}
              {toast.type === 'success' && <CheckCircle size={20} style={{ flexShrink: 0, color: toast.action?.iconColor ?? '#10b981' }} />}
            </>
          )}
          <span style={{ flex: 1 }}>{toast.message}</span>
          {toast.action && (
            <span
              style={{
                flexShrink: 0,
                padding: '8px 16px',
                backgroundColor: toast.action.buttonColor ?? 'var(--color-primary, #10b981)',
                color: '#fff',
                border: 'none',
                borderRadius: '12px',
                fontSize: '14px',
                fontWeight: 600,
                whiteSpace: 'nowrap'
              }}
            >
              {toast.action.label}
            </span>
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
