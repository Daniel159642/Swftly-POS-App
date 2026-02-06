import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { LayoutDashboard, ShoppingCart, ClipboardList, Calendar as CalendarIcon, Package, ChevronRight, ScanBarcode, Search, Clock, Truck, CheckCircle } from 'lucide-react'

const STATUS_ICONS = {
  in_progress: Clock,
  out_for_delivery: Truck,
  completed: CheckCircle
}

function shortOrderNumber(order) {
  const num = (order.order_number || order.order_id || '').toString().replace(/\D/g, '')
  if (num.length >= 4) return num.slice(-4)
  return num.padStart(4, '0').slice(-4) || '0000'
}
import api from '../services/api'
import CameraScanner from '../components/CameraScanner'
import ProfileButton from '../components/ProfileButton'
import './RecentOrders.css'

export default function RecentOrders() {
  const navigate = useNavigate()
  const [statusFilter, setStatusFilter] = useState('in_progress')
  const [orders, setOrders] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [searchTerm, setSearchTerm] = useState('')
  const [showScanner, setShowScanner] = useState(false)

  useEffect(() => {
    loadOrders(statusFilter)
  }, [statusFilter])

  const loadOrders = async (status) => {
    setLoading(true)
    setError('')
    try {
      const params = new URLSearchParams({ limit: '50' })
      if (status) params.set('order_status', status)
      const res = await api.get(`orders?${params.toString()}`)
      const data = res.data?.data || res.data || []
      setOrders(Array.isArray(data) ? data : [])
    } catch (e) {
      setError('Could not load orders')
      setOrders([])
    } finally {
      setLoading(false)
    }
  }

  const formatDate = (d) => {
    if (!d) return '—'
    const date = new Date(d)
    if (isNaN(date.getTime())) return d
    const now = new Date()
    const isToday = date.toDateString() === now.toDateString()
    if (isToday) return date.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })
    return date.toLocaleDateString([], { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' })
  }

  const formatPayment = (status) => (status || '—').replace(/_/g, ' ')
  const getStatusIcon = (status) => STATUS_ICONS[status] || Clock

  const filteredOrders = searchTerm.trim()
    ? orders.filter((o) => {
        const term = searchTerm.toLowerCase().trim()
        const num = (o.order_number || '').toString().toLowerCase()
        const id = (o.order_id ?? '').toString()
        const short = shortOrderNumber(o)
        const customer = (o.customer_name || '').toLowerCase()
        return num.includes(term) || id.includes(term) || short.includes(term) || customer.includes(term)
      })
    : orders

  const handleScanResult = (barcode) => {
    setSearchTerm(barcode)
    setShowScanner(false)
  }

  return (
    <div className="recent-orders-page">
      <div className="recent-orders-header-container">
        <div className="recent-orders-search-row-wrap">
          <ProfileButton />
          <div className="recent-orders-search-row">
            <Search size={20} className="recent-orders-search-icon" />
            <input
              type="search"
              placeholder="Order #, customer..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="recent-orders-search-input"
            />
          </div>
          <button
            type="button"
            className="recent-orders-scan-btn"
            onClick={() => setShowScanner((s) => !s)}
            aria-label="Scan barcode"
          >
            <ScanBarcode size={22} strokeWidth={2} />
          </button>
        </div>
      </div>

      <div className="recent-orders-filters">
        <button
          type="button"
          className={`recent-orders-filter-chip ${statusFilter === 'in_progress' ? 'recent-orders-filter-chip--active' : ''}`}
          onClick={() => setStatusFilter('in_progress')}
          title="In progress"
        >
          <Clock size={18} strokeWidth={2} />
          <span>In progress</span>
        </button>
        <button
          type="button"
          className={`recent-orders-filter-chip ${statusFilter === 'out_for_delivery' ? 'recent-orders-filter-chip--active' : ''}`}
          onClick={() => setStatusFilter('out_for_delivery')}
          title="Out for delivery"
        >
          <Truck size={18} strokeWidth={2} />
          <span>Out for delivery</span>
        </button>
        <button
          type="button"
          className={`recent-orders-filter-chip ${statusFilter === 'completed' ? 'recent-orders-filter-chip--active' : ''}`}
          onClick={() => setStatusFilter('completed')}
          title="Completed"
        >
          <CheckCircle size={18} strokeWidth={2} />
          <span>Completed</span>
        </button>
      </div>

      {showScanner && (
        <CameraScanner
          onScan={handleScanResult}
          onClose={() => setShowScanner(false)}
        />
      )}

      {error && <div className="recent-orders-error">{error}</div>}

      <div className="recent-orders-list-wrap">
        {loading ? (
          <p className="recent-orders-muted">Loading…</p>
        ) : filteredOrders.length === 0 ? (
          <p className="recent-orders-muted">{searchTerm.trim() ? 'No orders match.' : 'No orders yet.'}</p>
        ) : (
          <ul className="recent-orders-list">
            {filteredOrders.map((order) => {
              const StatusIcon = getStatusIcon(order.order_status)
              return (
                <li key={order.order_id} className="recent-orders-row">
                  <div className="recent-orders-row-main">
                    <span className="recent-orders-number">{shortOrderNumber(order)}</span>
                    <span className="recent-orders-date">{formatDate(order.order_date)}</span>
                  </div>
                  <div className="recent-orders-row-status" title={(order.order_status || '').replace(/_/g, ' ')}>
                    <StatusIcon size={20} strokeWidth={2} />
                  </div>
                  <div className="recent-orders-row-total">
                    ${(parseFloat(order.total) || 0).toFixed(2)}
                  </div>
                  <ChevronRight size={20} className="recent-orders-chevron" />
                </li>
              )
            })}
          </ul>
        )}
      </div>

      <nav className="bottom-nav">
        <button type="button" className="nav-item" aria-label="Dashboard" onClick={() => navigate('/')}>
          <LayoutDashboard size={24} strokeWidth={2} />
        </button>
        <button
          type="button"
          className="nav-item nav-item--active"
          aria-label="Orders"
          onClick={() => navigate('/orders')}
        >
          <ClipboardList size={24} strokeWidth={2} />
        </button>
        <button
          type="button"
          className="nav-item nav-item--cart"
          aria-label="POS"
          onClick={() => navigate('/checkout')}
        >
          <span className="nav-cart-circle">
            <ShoppingCart size={24} strokeWidth={2} />
          </span>
        </button>
        <button type="button" className="nav-item" aria-label="Calendar" onClick={() => navigate('/calendar')}>
          <CalendarIcon size={24} strokeWidth={2} />
        </button>
        <button type="button" className="nav-item" aria-label="Inventory" onClick={() => navigate('/inventory')}>
          <Package size={24} strokeWidth={2} />
        </button>
      </nav>
    </div>
  )
}
