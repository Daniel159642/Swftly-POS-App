import React from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { LayoutDashboard, ShoppingCart, Package, ClipboardList, Settings, ScanBarcode, Percent, UserPlus, Package as PackageIcon } from 'lucide-react'

const MobileNavBar = () => {
  const navigate = useNavigate()
  const location = useLocation()

  const navItems = [
    { icon: LayoutDashboard, label: 'Home', path: '/dashboard' },
    { icon: ShoppingCart, label: 'Checkout', path: '/pos' },
    { icon: Package, label: 'Inventory', path: '/inventory' },
    { icon: ClipboardList, label: 'Orders', path: '/recent-orders' },
    { icon: Settings, label: 'Settings', path: '/settings' },
  ]

  const isPOS = location.pathname === '/pos'

  const emitPosEvent = (type) => {
    window.dispatchEvent(new CustomEvent(type))
  }

  return (
    <div className="mobile-nav-bar">
      <div className="mobile-nav-container">
        {isPOS ? (
          <>
            {/* Add Customer */}
            <button
              className="mobile-nav-item"
              onClick={() => emitPosEvent('pos-add-customer')}
              title="Add Customer"
            >
              <div className="mobile-nav-icon-wrapper">
                <UserPlus size={24} />
              </div>
            </button>

            {/* Discount */}
            <button
              className="mobile-nav-item"
              onClick={() => emitPosEvent('pos-discount')}
              title="Discount"
            >
              <div className="mobile-nav-icon-wrapper">
                <Percent size={24} />
              </div>
            </button>

            {/* Order Type (pickup/delivery) */}
            <button
              className="mobile-nav-item"
              onClick={() => emitPosEvent('pos-order-options')}
              title="Order Type"
            >
              <div className="mobile-nav-icon-wrapper">
                <PackageIcon size={24} />
              </div>
            </button>

            {/* Scan */}
            <button
              className="mobile-nav-item"
              onClick={() => emitPosEvent('pos-scan')}
              title="Scan"
            >
              <div className="mobile-nav-icon-wrapper">
                <ScanBarcode size={24} />
              </div>
            </button>

            {/* Pay (text only) */}
            <button
              className="mobile-nav-item"
              onClick={() => emitPosEvent('pos-pay')}
              title="Pay"
            >
              <div className="mobile-nav-icon-wrapper" style={{ paddingInline: 10 }}>
                <span style={{ fontSize: 16, fontWeight: 600 }}>Pay</span>
              </div>
            </button>
          </>
        ) : (
          navItems.map((item) => {
            const Icon = item.icon
            const isActive = location.pathname === item.path
            return (
              <button
                key={item.path}
                className={`mobile-nav-item ${isActive ? 'active' : ''}`}
                onClick={() => navigate(item.path)}
                title={item.label}
              >
                <div className="mobile-nav-icon-wrapper">
                  <Icon size={26} strokeWidth={isActive ? 2.5 : 2} />
                </div>
              </button>
            )
          })
        )}
      </div>
    </div>
  )
}

export default MobileNavBar
