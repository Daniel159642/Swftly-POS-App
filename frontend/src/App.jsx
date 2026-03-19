import React, { useState, useEffect, createContext, useContext, useRef, useLayoutEffect, useCallback } from 'react'

export const MobileNavContext = createContext({
  setContextualNavItems: () => {},
  setStoreName: () => {},
  setStoreLogo: () => {}
})

export const useMobileNav = () => useContext(MobileNavContext)
import { BrowserRouter, Routes, Route, Navigate, useNavigate, useLocation } from 'react-router-dom'
import { PermissionProvider, usePermissions } from './contexts/PermissionContext'
import { ThemeProvider } from './contexts/ThemeContext'
import { ToastProvider, useToast } from './contexts/ToastContext'
import { PageScrollProvider, usePageScroll } from './contexts/PageScrollContext'
import { getCurrentWindow } from '@tauri-apps/api/window'

// When Shopify OAuth completes from Tauri, backend redirects to pos://...; we navigate the webview to that path.
function DeepLinkHandler() {
  const navigate = useNavigate()
  useEffect(() => {
    if (typeof window === 'undefined' || !window.__TAURI__) return
    let unlisten
    const handleUrl = (url) => {
      if (!url || !url.startsWith('pos://')) return
      try {
        const rest = url.slice('pos://'.length)
        const path = rest.split('?')[0] || '/'
        const search = rest.includes('?') ? '?' + rest.split('?').slice(1).join('?') : ''
        navigate((path.startsWith('/') ? path : '/' + path) + search, { replace: true })
      } catch (_) { }
    }
    import('@tauri-apps/plugin-deep-link').then(({ onOpenUrl, getCurrent }) => {
      onOpenUrl((urls) => { if (urls && urls[0]) handleUrl(urls[0]) }).then((fn) => { unlisten = fn })
      getCurrent().then((urls) => { if (urls && urls[0]) handleUrl(urls[0]) }).catch(() => { })
    }).catch(() => { })
    return () => { if (unlisten && typeof unlisten === 'function') unlisten() }
  }, [navigate])
  return null
}
import { Settings, User, LogOut, Bell, Menu } from 'lucide-react'
import Login from './components/Login'
import Dashboard from './components/Dashboard'
import POS from './components/POS'
import Tables from './pages/Tables'
import RecentOrders from './pages/RecentOrders'
import Inventory from './pages/Inventory'
import Calendar from './components/Calendar'
import EmployeeManagement from './components/EmployeeManagement'
import Profile from './pages/Profile'
import ShipmentVerification from './pages/ShipmentVerification'
import StatisticsPage from './pages/Statistics'
import SettingsPage from './pages/Settings'
import { lazy, Suspense } from 'react'
const Accounting = lazy(() => import('./pages/Accounting'))
import CashRegister from './pages/CashRegister'
import Customers from './pages/Customers'
import SetupWizard from './pages/SetupWizard'
import OfflineBanner from './components/OfflineBanner'
import NotificationPanel from './components/NotificationPanel'
import MobileNavBar from './components/MobileNavBar'
import { useOffline } from './contexts/OfflineContext'
import { NotificationProvider, useNotifications } from './contexts/NotificationContext'
import { cachedFetch } from './services/offlineSync'
import { getPermissionsCache } from './services/employeeRolesCache'
import './index.css'

function ProtectedRoute({ children, sessionToken, employee, sessionVerifying }) {
  if (!sessionToken) {
    return <Navigate to="/login" replace />
  }
  if (!employee) {
    if (sessionVerifying) {
      return (
        <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: 'var(--bg-secondary, #f5f5f5)' }}>
          <div style={{ fontSize: '18px', color: 'var(--text-secondary, #666)' }}>Loading session...</div>
        </div>
      )
    }
    return <Navigate to="/login" replace />
  }
  return children
}

function AdminOnlyRedirect({ children }) {
  const { isAdmin, loading: permissionsLoading } = usePermissions()
  const navigate = useNavigate()
  const { show: showToast } = useToast()
  useEffect(() => {
    if (permissionsLoading) return
    if (!isAdmin) {
      showToast("You don't have permission", 'error')
      navigate('/dashboard', { replace: true })
    }
  }, [isAdmin, permissionsLoading, navigate, showToast])
  if (permissionsLoading) {
    return (
      <div style={{ minHeight: '60vh', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-secondary, #666)' }}>
        Loading…
      </div>
    )
  }
  if (!isAdmin) return null
  return children
}

function PermissionRedirect({ permission, children }) {
  const { hasPermission, isAdmin, loading: permissionsLoading } = usePermissions()
  const navigate = useNavigate()
  const { show: showToast } = useToast()
  const allowed = isAdmin || (permission && hasPermission(permission))
  useEffect(() => {
    if (permissionsLoading) return
    if (!allowed) {
      showToast("You don't have permission", 'error')
      navigate('/dashboard', { replace: true })
    }
  }, [allowed, permissionsLoading, navigate, showToast])
  if (permissionsLoading) {
    return (
      <div style={{ minHeight: '60vh', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-secondary, #666)' }}>
        Loading…
      </div>
    )
  }
  if (!allowed) return null
  return children
}

const EMPLOYEE_STORAGE_KEY = 'pos_employee'

function getStoredEmployee() {
  try {
    const raw = localStorage.getItem(EMPLOYEE_STORAGE_KEY)
    return raw ? JSON.parse(raw) : null
  } catch {
    return null
  }
}

function setStoredEmployee(employee) {
  if (employee) localStorage.setItem(EMPLOYEE_STORAGE_KEY, JSON.stringify(employee))
  else localStorage.removeItem(EMPLOYEE_STORAGE_KEY)
}

const loginSuccessHandler = (result, setSessionToken, setEmployee, restoreOfflineSession) => {
  if (!result.success) return
  if (result.offline) {
    const emp = result.employee || { employee_id: result.employee_id, employee_name: result.employee_name, position: result.position }
    setSessionToken('offline')
    setEmployee(emp)
    localStorage.setItem('sessionToken', 'offline')
    setStoredEmployee(emp)
    if (restoreOfflineSession) restoreOfflineSession(emp, result.permissions)
    return
  }
  const emp = {
    employee_id: result.employee_id,
    employee_name: result.employee_name,
    position: result.position,
    is_admin: result.is_admin === true
  }
  setSessionToken(result.session_token)
  setEmployee(emp)
  localStorage.setItem('sessionToken', result.session_token)
  setStoredEmployee(emp)
}

function AppContent({ sessionToken, setSessionToken, employee, setEmployee, onLogout, sessionVerifying }) {
  const { fetchPermissions, setEmployee: setPermissionEmployee, restoreOfflineSession } = usePermissions()
  const navigate = useNavigate()
  const location = useLocation()

  useEffect(() => {
    if (!employee?.employee_id) return
    if (sessionToken === 'offline') {
      const permissions = getPermissionsCache(employee.employee_id, true) || {}
      restoreOfflineSession(employee, permissions)
      return
    }
    fetchPermissions(employee.employee_id)
    setPermissionEmployee(employee)
  }, [employee?.employee_id, sessionToken])

  // Setup detection: redirect to /setup if no admin exists yet.
  // Skip if: already on /setup, has a session, or localStorage bypass key is set.
  useEffect(() => {
    if (sessionToken) return
    if (location.pathname === '/setup') return
    if (localStorage.getItem('pos_skip_setup') === '1') return
    fetch('/api/setup/status')
      .then(r => r.json())
      .then(d => { if (d.needs_setup) navigate('/setup', { replace: true }) })
      .catch(() => {})
  }, [sessionToken, location.pathname])

  const onLogin = (result) => loginSuccessHandler(result, setSessionToken, setEmployee, restoreOfflineSession)

  return (
    <>
      <DeepLinkHandler />
      <Routes>
        <Route path="/setup" element={<SetupWizard />} />
        <Route path="/login" element={
          sessionToken && employee ? (
            <Navigate to="/dashboard" replace />
          ) : sessionToken && sessionVerifying ? (
            <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: 'var(--bg-secondary, #f5f5f5)' }}>
              <div style={{ fontSize: '18px', color: 'var(--text-secondary, #666)' }}>Loading session...</div>
            </div>
          ) : (
            <Login onLogin={onLogin} />
          )
        } />
        <Route path="/dashboard" element={
          sessionToken && employee ? (
            <ProtectedRoute sessionToken={sessionToken} employee={employee} sessionVerifying={sessionVerifying}>
              <Layout employee={employee} onLogout={onLogout}>
                <Dashboard />
              </Layout>
            </ProtectedRoute>
          ) : sessionToken && sessionVerifying ? (
            <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: 'var(--bg-secondary, #f5f5f5)' }}>
              <div style={{ fontSize: '18px', color: 'var(--text-secondary, #666)' }}>Loading session...</div>
            </div>
          ) : (
            <Login onLogin={onLogin} />
          )
        } />
        <Route path="/pos" element={
          <ProtectedRoute sessionToken={sessionToken} employee={employee} sessionVerifying={sessionVerifying}>
            <Layout employee={employee} onLogout={onLogout}>
              <POS employeeId={employee?.employee_id} employeeName={employee?.employee_name} />
            </Layout>
          </ProtectedRoute>
        } />
        <Route path="/tables" element={
          <ProtectedRoute sessionToken={sessionToken} employee={employee} sessionVerifying={sessionVerifying}>
            <Layout employee={employee} onLogout={onLogout}>
              <AdminOnlyRedirect>
                <Tables />
              </AdminOnlyRedirect>
            </Layout>
          </ProtectedRoute>
        } />
        <Route path="/recent-orders" element={
          <ProtectedRoute sessionToken={sessionToken} employee={employee} sessionVerifying={sessionVerifying}>
            <Layout employee={employee} onLogout={onLogout}>
              <RecentOrders />
            </Layout>
          </ProtectedRoute>
        } />
        <Route path="/inventory" element={
          <ProtectedRoute sessionToken={sessionToken} employee={employee} sessionVerifying={sessionVerifying}>
            <Layout employee={employee} onLogout={onLogout}>
              <Inventory />
            </Layout>
          </ProtectedRoute>
        } />
        <Route path="/calendar" element={
          <ProtectedRoute sessionToken={sessionToken} employee={employee} sessionVerifying={sessionVerifying}>
            <Layout employee={employee} onLogout={onLogout}>
              <Calendar employee={employee} />
            </Layout>
          </ProtectedRoute>
        } />
        <Route path="/employee-management" element={
          <ProtectedRoute sessionToken={sessionToken} employee={employee} sessionVerifying={sessionVerifying}>
            <Layout employee={employee} onLogout={onLogout}>
              <EmployeeManagement />
            </Layout>
          </ProtectedRoute>
        } />
        <Route path="/profile" element={
          <ProtectedRoute sessionToken={sessionToken} employee={employee} sessionVerifying={sessionVerifying}>
            <Layout employee={employee} onLogout={onLogout}>
              <Profile employeeId={employee?.employee_id} employeeName={employee?.employee_name} />
            </Layout>
          </ProtectedRoute>
        } />
        <Route path="/shipment-verification" element={
          <ProtectedRoute sessionToken={sessionToken} employee={employee} sessionVerifying={sessionVerifying}>
            <Layout employee={employee} onLogout={onLogout}>
              <ShipmentVerification />
            </Layout>
          </ProtectedRoute>
        } />
        <Route path="/shipment-verification/:id" element={
          <ProtectedRoute sessionToken={sessionToken} employee={employee} sessionVerifying={sessionVerifying}>
            <Layout employee={employee} onLogout={onLogout}>
              <ShipmentVerification />
            </Layout>
          </ProtectedRoute>
        } />
        <Route path="/statistics" element={
          <ProtectedRoute sessionToken={sessionToken} employee={employee} sessionVerifying={sessionVerifying}>
            <Layout employee={employee} onLogout={onLogout}>
              <StatisticsPage />
            </Layout>
          </ProtectedRoute>
        } />
        <Route path="/settings" element={
          <ProtectedRoute sessionToken={sessionToken} employee={employee} sessionVerifying={sessionVerifying}>
            <Layout employee={employee} onLogout={onLogout}>
              <SettingsPage />
            </Layout>
          </ProtectedRoute>
        } />
        <Route path="/accounting" element={
          <ProtectedRoute sessionToken={sessionToken} employee={employee} sessionVerifying={sessionVerifying}>
            <Layout employee={employee} onLogout={onLogout}>
              <PermissionRedirect permission="view_financial_reports">
                <Suspense fallback={<div style={{ minHeight: '60vh', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-secondary, #666)' }}>Loading…</div>}>
                  <Accounting />
                </Suspense>
              </PermissionRedirect>
            </Layout>
          </ProtectedRoute>
        } />
        <Route path="/cash-register" element={
          <ProtectedRoute sessionToken={sessionToken} employee={employee} sessionVerifying={sessionVerifying}>
            <Layout employee={employee} onLogout={onLogout}>
              <CashRegister />
            </Layout>
          </ProtectedRoute>
        } />
        <Route path="/customers" element={
          <ProtectedRoute sessionToken={sessionToken} employee={employee} sessionVerifying={sessionVerifying}>
            <Layout employee={employee} onLogout={onLogout}>
              <Customers />
            </Layout>
          </ProtectedRoute>
        } />
        <Route path="/" element={
          sessionToken && employee ? (
            <Navigate to="/dashboard" replace />
          ) : sessionToken && sessionVerifying ? (
            <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: 'var(--bg-secondary, #f5f5f5)' }}>
              <div style={{ fontSize: '18px', color: 'var(--text-secondary, #666)' }}>Loading session...</div>
            </div>
          ) : (
            <Navigate to="/login" replace />
          )
        } />
        <Route path="/onboarding" element={<Navigate to="/login" replace />} />
        <Route path="/onboarding/*" element={<Navigate to="/login" replace />} />
        <Route path="/employee-onboarding" element={<Navigate to="/login" replace />} />
        <Route path="/master-login" element={<Navigate to="/login" replace />} />
        <Route path="/sign-up" element={<Navigate to="/login" replace />} />
        <Route path="*" element={
          sessionToken && employee ? (
            <Navigate to="/dashboard" replace />
          ) : sessionToken && sessionVerifying ? (
            <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: 'var(--bg-secondary, #f5f5f5)' }}>
              <div style={{ fontSize: '18px', color: 'var(--text-secondary, #666)' }}>Loading session...</div>
            </div>
          ) : (
            <Navigate to="/login" replace />
          )
        } />
      </Routes>
    </>
  )
}

const isTauri = typeof window !== 'undefined' && window.__TAURI__

function Layout({ children, employee, onLogout }) {
  const navigate = useNavigate()
  const { hasPermission } = usePermissions()
  const { isOnline, isSyncing, pendingCount } = useOffline()
  const { disableScroll } = usePageScroll()
  const { notifications, notificationCount, dismissNotification } = useNotifications()
  const showBanner = !isOnline || isSyncing || pendingCount > 0
  const [notificationPanelOpen, setNotificationPanelOpen] = useState(false)
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [userDropdownOpen, setUserDropdownOpen] = useState(false)
  const userDropdownRef = useRef(null)
  const [storeName, setStoreName] = useState('')
  const [storeLogo, setStoreLogo] = useState(null)
  const [isMobile, setIsMobile] = useState(window.innerWidth <= 768)
  const [touchStart, setTouchStart] = useState(null)
  const [touchEnd, setTouchEnd] = useState(null)

  // Minimum swipe distance in pixels
  const minSwipeDistance = 50

  const onTouchStart = (e) => {
    setTouchEnd(null)
    setTouchStart(e.targetTouches[0].clientX)
  }

  const onTouchMove = (e) => setTouchEnd(e.targetTouches[0].clientX)

  const onTouchEnd = () => {
    if (!touchStart || !touchEnd) return
    const distance = touchStart - touchEnd
    const isLeftSwipe = distance > minSwipeDistance
    const isRightSwipe = distance < -minSwipeDistance
    if (isLeftSwipe && sidebarOpen) {
      setSidebarOpen(false)
    } else if (isRightSwipe && notificationPanelOpen) {
      setNotificationPanelOpen(false)
    }
  }

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth <= 768)
    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [])

  const getInitials = (name) => {
    if (!name) return '?'
    const parts = name.split(' ')
    if (parts.length >= 2) return (parts[0][0] + parts[1][0]).toUpperCase()
    return name[0].toUpperCase()
  }

  const handleNotificationClick = (notification) => {
    if (notification.type === 'shipment_issue' && notification.pending_shipment_id) {
      setNotificationPanelOpen(false)
      navigate(`/shipment-verification?filter=all`, { state: { openShipmentId: notification.pending_shipment_id } })
    } else if (notification.type === 'order' && notification.order_number) {
      setNotificationPanelOpen(false)
      navigate(`/recent-orders`, { state: { searchQuery: notification.order_number } })
    }
  }

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (userDropdownRef.current && !userDropdownRef.current.contains(event.target)) {
        setUserDropdownOpen(false)
      }
    }
    if (userDropdownOpen) {
      document.addEventListener('mousedown', handleClickOutside)
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [userDropdownOpen])

  const fetchBranding = useCallback((e) => {
    // If data is passed in the event detail, use it immediately
    if (e && e.detail) {
      if (typeof e.detail.store_name !== 'undefined') setStoreName(e.detail.store_name)
      if (typeof e.detail.store_logo !== 'undefined') setStoreLogo(e.detail.store_logo)
      return
    }

    const token = typeof localStorage !== 'undefined' ? localStorage.getItem('sessionToken') : null
    
    // Fetch store location settings (prioritize name and logo from here)
    cachedFetch('/api/store-location-settings', {}, { skipCache: true }).then(async res => {
      const data = await res.json()
      const settings = data.settings || {}
      if (settings.store_name) setStoreName(settings.store_name)
      // Always update store_logo, even if null/empty
      setStoreLogo(settings.store_logo || null)
    }).catch(() => { })

    // Fetch receipt settings (fallback logo)
    cachedFetch('/api/receipt-settings', {}, { skipCache: true }).then(async res => {
      const data = await res.json()
      const settings = data.settings || {}
      // Only set if not already set by location settings
      if (settings.store_logo) setStoreLogo(prev => prev || settings.store_logo)
      // Also fallback store name if still empty
      if (settings.store_name) setStoreName(prev => prev || settings.store_name)
    }).catch(() => { })
  }, [])

  useEffect(() => {
    if (!navigator.onLine) return
    const token = typeof localStorage !== 'undefined' ? localStorage.getItem('sessionToken') : null
    
    // Initial fetch
    fetchBranding()

    // Background pre-fetching
    cachedFetch('/api/inventory?limit=50&offset=0').then(() => { }).catch(() => { })
    cachedFetch('/api/inventory?item_type=product&include_variants=1').then(() => { }).catch(() => { })
    cachedFetch('/api/vendors').then(() => { }).catch(() => { })
    cachedFetch('/api/categories').then(() => { }).catch(() => { })
    cachedFetch('/api/pos-bootstrap').then(() => { }).catch(() => { })
    cachedFetch('/api/settings-bootstrap', { headers: { 'X-Session-Token': token || '' } }).then(() => { }).catch(() => { })
    cachedFetch('/api/pos-settings').then(() => { }).catch(() => { })

    if (token) {
      cachedFetch('/api/order-delivery-settings', { headers: { 'X-Session-Token': token } }).then(() => { }).catch(() => { })
      cachedFetch(`/api/register/session?session_token=${token}`).then(() => { }).catch(() => { })
      cachedFetch(`/api/register/session?status=open&session_token=${token}`).then(() => { }).catch(() => { })
    }

    // Listen for branding updates from other components
    window.addEventListener('branding_updated', fetchBranding)
    return () => window.removeEventListener('branding_updated', fetchBranding)
  }, [fetchBranding])

  const handleHeaderDrag = (e) => {
    if (e.target.closest('button')) return
    e.preventDefault()
    e.stopPropagation()
    getCurrentWindow().startDragging()
  }

  const [contextualNavItems, setContextualNavItems] = useState([])
  const location = useLocation()

  useEffect(() => {
    setContextualNavItems([])
  }, [location.pathname])

  const headerHeight = 52
  const contentTop = showBanner ? 88 : headerHeight

  return (
    <div
      style={{
        height: '100vh',
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden',
        backgroundColor: 'var(--bg-secondary, #f5f5f5)',
        position: 'relative'
      }}
    >
      {isMobile && (
        <div className={`mobile-sidebar ${sidebarOpen ? 'open' : ''}`}>
           <div className="mobile-sidebar-header">
             <div className="mobile-sidebar-profile">
               <div className="mobile-sidebar-avatar">
                 {getInitials(employee?.employee_name)}
               </div>
               <div className="mobile-sidebar-user-info">
                 <div className="mobile-sidebar-username">{employee?.employee_name || 'Guest'}</div>
                 <div className="mobile-sidebar-role">{employee?.position || 'Staff'}</div>
               </div>
               <button 
                 className="mobile-sidebar-logout"
                 onClick={() => { onLogout(); setSidebarOpen(false); }}
                 title="Logout"
               >
                 <LogOut size={18} />
               </button>
             </div>
           </div>
          <nav className="mobile-sidebar-nav">
            {contextualNavItems.length > 0 ? (
              <>
                {contextualNavItems.map((item, idx) => (
                  <button 
                   key={idx} 
                   onClick={() => { item.onClick(); setSidebarOpen(false); }}
                   className={item.active ? 'active' : ''}
                  >
                    {item.icon && <item.icon size={18} style={{ marginRight: '10px' }} />}
                    {item.label}
                  </button>
                ))}
              </>
            ) : (
               <>
                 <button className={window.location.pathname === '/dashboard' ? 'active' : ''} onClick={() => { navigate('/dashboard'); setSidebarOpen(false); }}>Dashboard</button>
                 <button className={window.location.pathname === '/pos' ? 'active' : ''} onClick={() => { navigate('/pos'); setSidebarOpen(false); }}>Checkout</button>
                 <button className={window.location.pathname === '/inventory' ? 'active' : ''} onClick={() => { navigate('/inventory'); setSidebarOpen(false); }}>Inventory</button>
                 <button className={window.location.pathname === '/recent-orders' ? 'active' : ''} onClick={() => { navigate('/recent-orders'); setSidebarOpen(false); }}>Orders</button>
                 <button className={window.location.pathname === '/customers' ? 'active' : ''} onClick={() => { navigate('/customers'); setSidebarOpen(false); }}>Customers</button>
                 <button className={window.location.pathname === '/tables' ? 'active' : ''} onClick={() => { navigate('/tables'); setSidebarOpen(false); }}>Tables</button>
                 <button className={window.location.pathname === '/accounting' ? 'active' : ''} onClick={() => { navigate('/accounting'); setSidebarOpen(false); }}>Accounting</button>
                 <button className={window.location.pathname === '/settings' ? 'active' : ''} onClick={() => { navigate('/settings'); setSidebarOpen(false); }}>Settings</button>
               </>
             )}
           </nav>
        </div>
      )}
      {/* Mobile notifications menu (right side) */}
      {isMobile && notificationPanelOpen && (
        <>
          <div
            className="mobile-notifications-overlay"
            onClick={() => setNotificationPanelOpen(false)}
            onTouchStart={onTouchStart}
            onTouchMove={onTouchMove}
            onTouchEnd={onTouchEnd}
          />
          <div
            className="mobile-notifications"
            onTouchStart={onTouchStart}
            onTouchMove={onTouchMove}
            onTouchEnd={onTouchEnd}
          >
            <div className="mobile-notifications-header">
              <span className="mobile-notifications-title">Notifications</span>
            </div>
            <div className="mobile-notifications-list">
              {notifications.length === 0 ? (
                <div className="mobile-notifications-empty">
                  No notifications yet
                </div>
              ) : (
                notifications.map((n) => (
                  <button
                    key={n.id}
                    type="button"
                    className="mobile-notifications-item"
                    onClick={() => {
                      handleNotificationClick(n)
                      setNotificationPanelOpen(false)
                    }}
                  >
                    <div className="mobile-notifications-item-main">
                      <div className="mobile-notifications-item-title">
                        {n.title}
                      </div>
                      {n.body && (
                        <div className="mobile-notifications-item-body">
                          {n.body}
                        </div>
                      )}
                    </div>
                    <div className="mobile-notifications-item-meta">
                      {/* Simple relative time, reuse same formatting as NotificationPanel */}
                    </div>
                  </button>
                ))
              )}
            </div>
          </div>
        </>
      )}
      <div 
        className={`main-layout-wrapper ${sidebarOpen ? 'sidebar-open' : ''} ${isMobile && notificationPanelOpen ? 'notifications-open' : ''}`}
        style={{
          minHeight: '100vh',
          display: 'flex',
          flexDirection: 'column',
          backgroundColor: 'var(--bg-secondary, #f5f5f5)',
          transition: 'transform 0.4s cubic-bezier(0.4, 0, 0.2, 1), border-radius 0.4s ease',
          zIndex: 10,
          boxShadow: (sidebarOpen || (isMobile && notificationPanelOpen)) ? '-10px 0 30px rgba(0,0,0,0.15)' : 'none',
          position: 'relative'
        }}
      >
        {isMobile && sidebarOpen && (
          <div 
            className="mobile-sidebar-overlay" 
            onClick={() => setSidebarOpen(false)}
            onTouchStart={onTouchStart}
            onTouchMove={onTouchMove}
            onTouchEnd={onTouchEnd}
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              zIndex: 9999, // Above everything in the wrapper
              backgroundColor: 'transparent'
            }}
          />
        )}
        <div
          className={isMobile ? 'mobile-header' : 'desktop-header'}
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            width: '100%',
            zIndex: 1000,
            flexShrink: 0,
            backgroundColor: isMobile ? 'transparent' : 'var(--bg-primary, #fff)',
            borderBottom: isMobile ? 'none' : '3px solid var(--border-color, #ddd)',
            padding: isMobile ? '8px 16px' : '8px 20px',
            paddingLeft: !isMobile && isTauri ? 72 : (isMobile ? 12 : 20),
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            transform: 'translateZ(0)',
            backdropFilter: isMobile ? 'blur(20px) saturate(180%)' : 'none',
            WebkitBackdropFilter: isMobile ? 'blur(20px) saturate(180%)' : 'none',
          }}
        >
        <div
          data-tauri-drag-region
          onMouseDown={!isMobile && isTauri ? handleHeaderDrag : undefined}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: isMobile ? '8px' : '20px',
            flex: 1,
            minWidth: 0,
            userSelect: 'none',
            cursor: !isMobile && isTauri ? 'move' : undefined,
            paddingLeft: isMobile ? '0' : '48px'
          }}
        >
          {isMobile && (
            <button
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className="mobile-menu-button"
            >
              <Menu size={20} />
            </button>
          )}
          {!isMobile && (
            <button
              onClick={() => navigate('/dashboard')}
              style={{
                padding: '4px 12px 2px 12px',
                backgroundColor: 'transparent',
                border: 'none',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '12px',
                lineHeight: 1.2
              }}
            >
              <span 
                style={{
                  fontSize: storeName.length > 15 ? '14px' : '16px',
                  fontWeight: 600,
                  fontFamily: 'Geist, "Inter", -apple-system, system-ui, sans-serif',
                  letterSpacing: '-0.02em',
                  color: 'var(--text-secondary, #4b5563)',
                  opacity: 0.9
                }}
              >
                {storeName || 'Store'}
              </span>
              {storeLogo && (
                <img 
                  src={storeLogo} 
                  alt="Logo" 
                  style={{ 
                    height: '20px', 
                    width: '20px', 
                    objectFit: 'contain',
                    borderRadius: '4px' 
                  }} 
                />
              )}
            </button>
          )}
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          {!isMobile && employee && (
            <>
              <button
                type="button"
                onClick={() => setNotificationPanelOpen(true)}
                title="Notifications"
                aria-label={notificationCount > 0 ? `Notifications (${notificationCount})` : 'Notifications'}
                style={{
                  padding: '4px',
                  margin: 0,
                  border: 'none',
                  background: 'none',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  position: 'relative',
                  marginRight: '8px'
                }}
              >
                <Bell size={24} style={{ color: 'var(--text-tertiary, #888)' }} />
                {notificationCount > 0 && (
                  <span
                    style={{
                      position: 'absolute',
                      top: -4,
                      right: -4,
                      minWidth: 18,
                      height: 18,
                      borderRadius: '50%',
                      backgroundColor: '#ef4444',
                      color: '#fff',
                      fontSize: 10,
                      fontWeight: 700,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      padding: '0 4px',
                      boxSizing: 'border-box',
                      border: '2px solid var(--bg-primary, #fff)'
                    }}
                  >
                    {notificationCount > 99 ? '99+' : notificationCount}
                  </span>
                )}
              </button>
              
              <div style={{ position: 'relative' }} ref={userDropdownRef}>
                <button
                  type="button"
                  onClick={() => setUserDropdownOpen(!userDropdownOpen)}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '10px',
                    padding: '4px 12px',
                    borderRadius: '24px',
                    border: '1px solid var(--border-color, #ddd)',
                    background: userDropdownOpen ? 'var(--bg-secondary, #f0f0f0)' : 'transparent',
                    cursor: 'pointer',
                    transition: 'all 0.2s ease',
                    outline: 'none'
                  }}
                  className="user-profile-trigger"
                >
                  <div 
                    style={{
                      width: '28px',
                      height: '28px',
                      borderRadius: '50%',
                      backgroundColor: '#4a90e2',
                      color: '#fff',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: '11px',
                      fontWeight: '600',
                      letterSpacing: '0.4px'
                    }}
                  >
                    {getInitials(employee?.employee_name)}
                  </div>
                  <span style={{ fontSize: '14px', fontWeight: '500', color: 'var(--text-primary, #333)' }}>
                    {employee?.employee_name}
                  </span>
                </button>

                {userDropdownOpen && (
                  <div 
                    className="user-dropdown-menu"
                    style={{
                      position: 'absolute',
                      top: '100%',
                      left: 0,
                      right: 0,
                      marginTop: '4px',
                      borderRadius: '12px',
                      padding: '4px',
                      zIndex: 1100,
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '2px'
                    }}
                  >
                    <button
                      onClick={() => { navigate('/profile'); setUserDropdownOpen(false); }}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '10px',
                        padding: '8px 12px',
                        border: 'none',
                        textAlign: 'left',
                        color: 'var(--text-primary)',
                      }}
                    >
                      <User size={15} style={{ color: '#888' }} />
                      <span style={{ fontSize: '13.5px', fontWeight: '500' }}>Profile</span>
                    </button>
                    <button
                      onClick={() => { navigate('/settings'); setUserDropdownOpen(false); }}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '10px',
                        padding: '8px 12px',
                        border: 'none',
                        textAlign: 'left',
                        color: 'var(--text-primary)',
                      }}
                    >
                      <Settings size={15} style={{ color: '#888' }} />
                      <span style={{ fontSize: '13.5px', fontWeight: '500' }}>Settings</span>
                    </button>
                  </div>
                )}
              </div>

              <button
                type="button"
                className="logout-icon-button"
                onClick={onLogout}
                title="Logout"
                style={{
                  padding: '8px',
                  borderRadius: '50%',
                  border: 'none',
                  background: 'none',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: '#888',
                  transition: 'background 0.2s ease'
                }}
                onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'var(--bg-secondary, #f5f5f5)'}
                onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
              >
                <LogOut size={20} />
              </button>
            </>
          )}
          {isMobile && (
             <div style={{ position: 'relative' }}>
               <button
                  onClick={() => setNotificationPanelOpen(true)}
                  className="mobile-profile-circle"
                  aria-label={notificationCount > 0 ? `Notifications (${notificationCount})` : 'Notifications'}
                  title="Notifications"
                >
                  <Bell size={18} />
                </button>
                {notificationCount > 0 && (
                  <span className="mobile-notification-badge" style={{ pointerEvents: 'none' }}>
                    {notificationCount > 99 ? '99+' : notificationCount}
                  </span>
                )}
             </div>
          )}
        </div>
      </div>
      {!isMobile && (
        <NotificationPanel
          open={notificationPanelOpen}
          onClose={() => setNotificationPanelOpen(false)}
          notifications={notifications}
          onNotificationClick={handleNotificationClick}
          onDismissNotification={dismissNotification}
        />
      )}
      <OfflineBanner />
      <MobileNavContext.Provider value={{ setContextualNavItems, setStoreName, setStoreLogo }}>
        <main
          style={{
            flex: 1,
            minHeight: 0,
            overflowY: disableScroll ? 'hidden' : 'auto',
            overscrollBehavior: 'none',
            WebkitOverflowScrolling: 'touch',
            paddingTop: contentTop,
            backgroundColor: 'var(--bg-secondary, #f5f5f5)'
          }}
        >
          {children}
        </main>
      </MobileNavContext.Provider>
      <MobileNavBar />
    </div>
  </div>
)
}

function App() {
  const [sessionToken, setSessionToken] = useState(localStorage.getItem('sessionToken'))
  const [employee, setEmployee] = useState(() => (localStorage.getItem('sessionToken') ? getStoredEmployee() : null))
  // Only show "Loading session..." when we have a token but no cached employee; otherwise show app immediately
  const [sessionVerifying, setSessionVerifying] = useState(() => {
    const token = localStorage.getItem('sessionToken')
    const emp = token ? getStoredEmployee() : null
    return !!(token && !emp)
  })

  const handleLogout = () => {
    if (sessionToken && sessionToken !== 'offline') {
      fetch('/api/logout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ session_token: sessionToken })
      }).catch(console.error)
    }
    setSessionToken(null)
    setEmployee(null)
    setSessionVerifying(false)
    localStorage.removeItem('sessionToken')
    setStoredEmployee(null)
  }

  const verifySession = async () => {
    if (!sessionToken) {
      setSessionVerifying(false)
      return
    }
    if (sessionToken === 'offline') {
      if (navigator.onLine) {
        // Back online with offline-only session — server requires a real session for register/settings etc.
        handleLogout()
        setSessionVerifying(false)
        return
      }
      const cached = getStoredEmployee()
      if (cached) setEmployee(cached)
      setSessionVerifying(false)
      return
    }
    if (!navigator.onLine) {
      const cached = getStoredEmployee()
      if (cached) {
        setEmployee(cached)
      } else {
        handleLogout()
      }
      setSessionVerifying(false)
      return
    }
    // Verify in background; don't set sessionVerifying(true) so UI stays visible when we have cached employee
    try {
      const response = await fetch('/api/verify_session', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ session_token: sessionToken })
      })

      if (!response.ok) {
        const errorText = await response.text()
        console.error('Session verification failed:', response.status, errorText)
        handleLogout()
        return
      }

      const result = await response.json()
      if (result.valid) {
        const emp = {
          employee_id: result.employee_id,
          employee_name: result.employee_name,
          position: result.position,
          is_admin: result.is_admin === true
        }
        setEmployee(emp)
        setStoredEmployee(emp)
      } else {
        handleLogout()
      }
    } catch (err) {
      console.error('Session verification failed:', err)
      const cached = getStoredEmployee()
      if (cached) {
        setEmployee(cached)
      } else {
        handleLogout()
      }
    } finally {
      setSessionVerifying(false)
    }
  }

  useEffect(() => {
    if (sessionToken) {
      verifySession()
    } else {
      setSessionVerifying(false)
    }
  }, [])

  // When app comes back online with an offline-only session, require re-login for server features (e.g. cash register)
  useEffect(() => {
    const onOnline = () => {
      if (localStorage.getItem('sessionToken') === 'offline') {
        setSessionToken(null)
        setEmployee(null)
        setSessionVerifying(false)
        localStorage.removeItem('sessionToken')
        setStoredEmployee(null)
      }
    }
    window.addEventListener('online', onOnline)
    return () => window.removeEventListener('online', onOnline)
  }, [])

  return (
    <BrowserRouter>
      <ThemeProvider>
        <ToastProvider>
          <PageScrollProvider>
            <NotificationProvider>
              <PermissionProvider initialEmployee={employee}>
                <AppContent
                  sessionToken={sessionToken}
                  setSessionToken={setSessionToken}
                  employee={employee}
                  setEmployee={setEmployee}
                  onLogout={handleLogout}
                  sessionVerifying={sessionVerifying}
                />
              </PermissionProvider>
            </NotificationProvider>
          </PageScrollProvider>
        </ToastProvider>
      </ThemeProvider>
    </BrowserRouter>
  )
}

export default App
