import { useNavigate } from 'react-router-dom'
import { LayoutDashboard, ShoppingCart, ClipboardList, Calendar as CalendarIcon, Package } from 'lucide-react'
import ProfileButton from '../components/ProfileButton'
import './Home.css'

export default function Home() {
  const navigate = useNavigate()
  return (
    <div className="home">
      <div className="home-header">
        <ProfileButton />
      </div>
      <main className="home-main" />

      <nav className="bottom-nav">
        <button type="button" className="nav-item nav-item--active" aria-label="Dashboard" onClick={() => navigate('/')}>
          <LayoutDashboard size={24} strokeWidth={2} />
        </button>
        <button type="button" className="nav-item" aria-label="Orders" onClick={() => navigate('/orders')}>
          <ClipboardList size={24} strokeWidth={2} />
        </button>
        <button type="button" className="nav-item nav-item--cart" aria-label="POS" onClick={() => navigate('/checkout')}>
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
