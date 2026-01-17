import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useTheme } from '../contexts/ThemeContext'
import Table from '../components/Table'
import BarcodeScanner from '../components/BarcodeScanner'

function RecentOrders() {
  const navigate = useNavigate()
  const { themeColor, themeMode } = useTheme()
  
  // Convert hex to RGB for rgba usage
  const hexToRgb = (hex) => {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex)
    return result ? `${parseInt(result[1], 16)}, ${parseInt(result[2], 16)}, ${parseInt(result[3], 16)}` : '132, 0, 255'
  }
  
  const themeColorRgb = hexToRgb(themeColor)
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [expandedRow, setExpandedRow] = useState(null)
  const [orderDetails, setOrderDetails] = useState({})
  const [loadingDetails, setLoadingDetails] = useState({})
  const [searchQuery, setSearchQuery] = useState('')
  const [showBarcodeScanner, setShowBarcodeScanner] = useState(false)
  const [scannedProducts, setScannedProducts] = useState([]) // Array of {product_id, product_name, sku, barcode}
  const [orderItemsMap, setOrderItemsMap] = useState({}) // Map of order_id -> order items
  
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

  useEffect(() => {
    loadData()
  }, [])

  // Load all order items when products are scanned (for filtering)
  const loadAllOrderItems = async () => {
    try {
      const itemsResponse = await fetch('/api/order_items')
      const itemsResult = await itemsResponse.json()
      const items = itemsResult.data || []
      
      // Group items by order_id
      const itemsByOrder = {}
      items.forEach(item => {
        const orderId = item.order_id || item.orderId
        if (orderId) {
          if (!itemsByOrder[orderId]) {
            itemsByOrder[orderId] = []
          }
          itemsByOrder[orderId].push(item)
        }
      })
      
      setOrderItemsMap(itemsByOrder)
    } catch (err) {
      console.error('Error loading order items:', err)
    }
  }

  // Load order items when products are scanned
  useEffect(() => {
    if (scannedProducts.length > 0) {
      loadAllOrderItems()
    }
  }, [scannedProducts.length])

  const handleBarcodeScan = async (barcode) => {
    try {
      const scannedBarcode = barcode.toString().trim()
      console.log('Scanned barcode:', scannedBarcode, 'Length:', scannedBarcode.length)
      
      // First, check if barcode matches an order number (receipt barcode)
      // Fetch all orders (not just first 50) to find receipt barcodes
      const ordersResponse = await fetch('/api/orders')
      const ordersResult = await ordersResponse.json()
      
      if (ordersResult.data) {
        console.log('Checking', ordersResult.data.length, 'orders for receipt barcode match')
        
        // Extract numeric part from order numbers (e.g., "ORD-20260115-0004" -> "202601150004")
        // This handles cases where barcode might encode just the numeric part
        const extractNumericPart = (orderNum) => {
          if (!orderNum) return ''
          return orderNum.toString().replace(/[^0-9]/g, '')
        }
        
        // Try exact match first
        let matchingOrder = ordersResult.data.find(o => {
          if (!o.order_number) return false
          const orderNum = o.order_number.toString().trim()
          return orderNum === scannedBarcode
        })
        
        // If not found, try case-insensitive match
        if (!matchingOrder) {
          matchingOrder = ordersResult.data.find(o => {
            if (!o.order_number) return false
            const orderNum = o.order_number.toString().trim().toLowerCase()
            return orderNum === scannedBarcode.toLowerCase()
          })
        }
        
        // If not found, try matching numeric part only (for barcodes that encode just numbers)
        if (!matchingOrder) {
          matchingOrder = ordersResult.data.find(o => {
            if (!o.order_number) return false
            const numericPart = extractNumericPart(o.order_number)
            return numericPart === scannedBarcode || scannedBarcode.includes(numericPart) || numericPart.includes(scannedBarcode)
          })
          if (matchingOrder) {
            console.log('Found order by numeric part match:', matchingOrder.order_number)
          }
        }
        
        // If not found, try matching order_id (in case barcode is the order_id)
        if (!matchingOrder) {
          const orderIdMatch = parseInt(scannedBarcode)
          if (!isNaN(orderIdMatch)) {
            matchingOrder = ordersResult.data.find(o => o.order_id === orderIdMatch)
            if (matchingOrder) {
              console.log('Found order by order_id:', matchingOrder.order_id)
            }
          }
        }
        
        // If not found, try partial match (order number contains barcode or vice versa)
        if (!matchingOrder) {
          matchingOrder = ordersResult.data.find(o => {
            if (!o.order_number) return false
            const orderNum = o.order_number.toString().trim()
            return orderNum.includes(scannedBarcode) || scannedBarcode.includes(orderNum)
          })
        }
        
        // If still not found, try matching just the suffix part (e.g., "0004" from "ORD-20260115-0004")
        if (!matchingOrder && scannedBarcode.length <= 6) {
          matchingOrder = ordersResult.data.find(o => {
            if (!o.order_number) return false
            const orderNum = o.order_number.toString().trim()
            // Extract the suffix part (last digits after last hyphen or dash)
            const parts = orderNum.split(/[-_]/)
            if (parts.length > 0) {
              const suffix = parts[parts.length - 1]
              return suffix === scannedBarcode || suffix.includes(scannedBarcode) || scannedBarcode.includes(suffix)
            }
            return false
          })
          if (matchingOrder) {
            console.log('Found order by suffix match:', matchingOrder.order_number)
          }
        }
        
        if (matchingOrder) {
          console.log('Found matching order:', matchingOrder.order_number, 'ID:', matchingOrder.order_id)
          // Found order by receipt barcode - scroll to it or filter to show it
          setSearchQuery(matchingOrder.order_number || matchingOrder.order_id.toString())
          setShowBarcodeScanner(false)
          return
        } else {
          console.log('No matching order found for barcode:', scannedBarcode)
        }
      }
      
      // If not an order number, try to find product by barcode
      const inventoryResponse = await fetch('/api/inventory')
      const inventoryResult = await inventoryResponse.json()
      
      if (inventoryResult.data) {
        // Try to find by barcode first (exact match)
        let product = inventoryResult.data.find(p => 
          p.barcode && p.barcode.toString().trim() === barcode.toString().trim()
        )
        
        // If not found and barcode is 13 digits (EAN13), try without leading 0 (12 digits)
        if (!product && barcode.length === 13 && barcode.startsWith('0')) {
          const barcode12 = barcode.substring(1)
          product = inventoryResult.data.find(p => 
            p.barcode && p.barcode.toString().trim() === barcode12
          )
        }
        
        // If not found and barcode is 12 digits, try with leading 0 (13 digits)
        if (!product && barcode.length === 12) {
          const barcode13 = '0' + barcode
          product = inventoryResult.data.find(p => 
            p.barcode && (p.barcode.toString().trim() === barcode13 || p.barcode.toString().trim() === barcode)
          )
        }
        
        // If not found by barcode, try by SKU
        if (!product) {
          product = inventoryResult.data.find(p => 
            p.sku && p.sku.toString().trim() === barcode.toString().trim()
          )
        }
        
        if (product) {
          // Check if product is already scanned
          const alreadyScanned = scannedProducts.some(sp => 
            sp.product_id === product.product_id || sp.sku === product.sku
          )
          
          if (!alreadyScanned) {
            setScannedProducts(prev => [...prev, {
              product_id: product.product_id,
              product_name: product.product_name,
              sku: product.sku,
              barcode: product.barcode
            }])
            // Keep scanner open for continuous scanning
            return
          }
          // Keep scanner open for continuous scanning
          return
        }
      }
      
      // Product not found - keep scanner open for retry
      console.error(`Product with barcode "${barcode}" not found`)
      
    } catch (err) {
      console.error('Barcode scan error:', err)
    }
  }

  const removeScannedProduct = (productId) => {
    setScannedProducts(prev => prev.filter(sp => sp.product_id !== productId))
  }

  const clearScannedProducts = () => {
    setScannedProducts([])
  }

  const loadData = async () => {
    setLoading(true)
    setError(null)
    
    try {
      const response = await fetch('/api/orders')
      const result = await response.json()
      // Show only recent orders (last 50)
      if (result.data) {
        result.data = result.data.slice(0, 50)
      }
      setData(result)
    } catch (err) {
      setError('Error loading data')
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  const handleReturn = (orderNumber, orderId) => {
    // Navigate to returns page with order number
    navigate(`/returns?orderNumber=${encodeURIComponent(orderNumber)}&orderId=${orderId}`)
  }

  const handleRowClick = async (row) => {
    const orderId = row.order_id || row.orderId
    if (!orderId) return

    // Toggle expansion
    if (expandedRow === orderId) {
      setExpandedRow(null)
      return
    }

    setExpandedRow(orderId)

    // If we already have the details, don't fetch again
    if (orderDetails[orderId]) {
      return
    }

    // Fetch order details
    setLoadingDetails(prev => ({ ...prev, [orderId]: true }))
    try {
      // Fetch order items
      const itemsResponse = await fetch('/api/order_items')
      const itemsResult = await itemsResponse.json()
      const items = itemsResult.data || []
      
      // Filter items for this order
      const orderItems = items.filter(item => 
        (item.order_id || item.orderId) === orderId
      )

      // Update orderItemsMap for filtering
      setOrderItemsMap(prev => ({
        ...prev,
        [orderId]: orderItems
      }))

      // Get order details from the row data
      const details = {
        employee_id: row.employee_id || row.employeeId || null,
        customer_id: row.customer_id || row.customerId || null,
        subtotal: row.subtotal || 0,
        tax_rate: row.tax_rate || 0,
        tax_amount: row.tax_amount || row.tax || 0,
        discount: row.discount || 0,
        transaction_fee: row.transaction_fee || 0,
        notes: row.notes || '',
        tip: row.tip || 0,
        payment_method_id: row.payment_method_id || row.paymentMethodId || null,
        customer_name: row.customer_name || row.customerName || null,
        receipt_type: row.receipt_type || row.receiptType || null,
        receipt_email: row.receipt_email || row.receiptEmail || null,
        receipt_phone: row.receipt_phone || row.receiptPhone || null,
        receipt_sent: row.receipt_sent || row.receiptSent || false,
        receipt_sent_at: row.receipt_sent_at || row.receiptSentAt || null,
        items: orderItems
      }

      setOrderDetails(prev => ({ ...prev, [orderId]: details }))
    } catch (err) {
      console.error('Error loading order details:', err)
    } finally {
      setLoadingDetails(prev => ({ ...prev, [orderId]: false }))
    }
  }

  // Add Actions column to the data
  const processedData = data && data.data ? data.data.map(row => ({
    ...row,
    _actions: row // Store the full row for actions
  })) : []

  // Filter data based on search query
  const filteredBySearch = searchQuery ? processedData.filter(row => {
    const query = searchQuery.toLowerCase()
    return Object.values(row).some(value => {
      if (value === null || value === undefined) return false
      return String(value).toLowerCase().includes(query)
    })
  }) : processedData

  // Filter by scanned products (orders that contain any of the scanned products)
  const filteredData = scannedProducts.length > 0 
    ? filteredBySearch.filter(row => {
        const orderId = row.order_id || row.orderId
        if (!orderId) return false
        
        // Check order items map first
        const items = orderItemsMap[orderId]
        if (items && items.length > 0) {
          return scannedProducts.some(scanned => 
            items.some(item => 
              item.product_id === scanned.product_id || 
              item.sku === scanned.sku ||
              (item.barcode && item.barcode === scanned.barcode)
            )
          )
        }
        
        // Check order details if available
        if (orderDetails[orderId] && orderDetails[orderId].items) {
          const items = orderDetails[orderId].items
          return scannedProducts.some(scanned => 
            items.some(item => 
              item.product_id === scanned.product_id || 
              item.sku === scanned.sku ||
              (item.barcode && item.barcode === scanned.barcode)
            )
          )
        }
        
        // If we don't have items loaded yet, include it (will be filtered when items load)
        return true
      })
    : filteredBySearch

  // Fields to hide from main table (shown in dropdown)
  const hiddenFields = ['order_id', 'orderId', 'employee_id', 'employeeId', 'customer_id', 'customerId', 'subtotal', 'tax_rate', 'tax_amount', 'tax', 'discount', 'transaction_fee', 'notes', 'tip', 'payment_method_id', 'paymentMethodId', 'customer_name', 'customerName', 'receipt_type', 'receiptType', 'receipt_email', 'receiptEmail', 'receipt_phone', 'receiptPhone', 'receipt_sent', 'receiptSent', 'receipt_sent_at', 'receiptSentAt']
  
  // Filter out hidden fields from columns
  const visibleColumns = data && data.columns ? data.columns.filter(col => !hiddenFields.includes(col)) : []
  const columnsWithActions = [...visibleColumns, 'Actions']

  return (
    <div style={{ padding: '40px', maxWidth: '1400px', margin: '0 auto' }}>
      <div style={{ marginBottom: '20px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: scannedProducts.length > 0 ? '12px' : '0' }}>
          <input
            type="text"
            placeholder="Search orders..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            style={{
              flex: 1,
              padding: '8px 0',
              border: 'none',
              borderBottom: isDarkMode ? '2px solid var(--border-color, #404040)' : '2px solid #ddd',
              borderRadius: '0',
              backgroundColor: 'transparent',
              outline: 'none',
              fontSize: '14px',
              boxSizing: 'border-box',
              fontFamily: '"Product Sans", sans-serif',
              color: isDarkMode ? 'var(--text-primary, #fff)' : '#333'
            }}
          />
          <button
            onClick={() => setShowBarcodeScanner(true)}
            style={{
              padding: '8px 16px',
              backgroundColor: `rgba(${themeColorRgb}, 0.7)`,
              backdropFilter: 'blur(10px)',
              WebkitBackdropFilter: 'blur(10px)',
              color: '#fff',
              border: '1px solid rgba(255, 255, 255, 0.2)',
              borderRadius: '8px',
              cursor: 'pointer',
              fontSize: '14px',
              fontWeight: 600,
              boxShadow: `0 4px 15px rgba(${themeColorRgb}, 0.3), inset 0 1px 0 rgba(255, 255, 255, 0.2)`,
              transition: 'all 0.3s ease',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              whiteSpace: 'nowrap'
            }}
            onMouseEnter={(e) => {
              e.target.style.backgroundColor = `rgba(${themeColorRgb}, 0.8)`
              e.target.style.boxShadow = `0 4px 20px rgba(${themeColorRgb}, 0.4), inset 0 1px 0 rgba(255, 255, 255, 0.2)`
            }}
            onMouseLeave={(e) => {
              e.target.style.backgroundColor = `rgba(${themeColorRgb}, 0.7)`
              e.target.style.boxShadow = `0 4px 15px rgba(${themeColorRgb}, 0.3), inset 0 1px 0 rgba(255, 255, 255, 0.2)`
            }}
            title="Scan barcode to filter by product or find order by receipt"
          >
            <span>📷</span>
            <span>Scan</span>
          </button>
        </div>
        
        {/* Scanned Products Chips */}
        {scannedProducts.length > 0 && (
          <div style={{ 
            display: 'flex', 
            flexWrap: 'wrap', 
            gap: '8px', 
            alignItems: 'center',
            padding: '12px',
            backgroundColor: isDarkMode ? 'var(--bg-secondary, #2d2d2d)' : '#f8f9fa',
            borderRadius: '8px',
            border: isDarkMode ? '1px solid var(--border-color, #404040)' : '1px solid #ddd'
          }}>
            <span style={{ 
              fontSize: '12px', 
              fontWeight: 600, 
              color: isDarkMode ? 'var(--text-secondary, #ccc)' : '#666',
              marginRight: '4px'
            }}>
              Filtering by:
            </span>
            {scannedProducts.map((product) => (
              <div
                key={product.product_id}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  padding: '6px 12px',
                  backgroundColor: `rgba(${themeColorRgb}, 0.2)`,
                  border: `1px solid rgba(${themeColorRgb}, 0.4)`,
                  borderRadius: '20px',
                  fontSize: '13px',
                  color: isDarkMode ? 'var(--text-primary, #fff)' : '#333'
                }}
              >
                <span>{product.product_name || product.sku}</span>
                <button
                  onClick={() => removeScannedProduct(product.product_id)}
                  style={{
                    background: 'none',
                    border: 'none',
                    color: isDarkMode ? 'var(--text-primary, #fff)' : '#333',
                    cursor: 'pointer',
                    padding: '0',
                    marginLeft: '4px',
                    fontSize: '16px',
                    lineHeight: '1',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    width: '18px',
                    height: '18px',
                    borderRadius: '50%',
                    transition: 'background-color 0.2s'
                  }}
                  onMouseEnter={(e) => {
                    e.target.style.backgroundColor = `rgba(${themeColorRgb}, 0.3)`
                  }}
                  onMouseLeave={(e) => {
                    e.target.style.backgroundColor = 'transparent'
                  }}
                  title="Remove filter"
                >
                  ×
                </button>
              </div>
            ))}
            <button
              onClick={clearScannedProducts}
              style={{
                padding: '6px 12px',
                backgroundColor: 'transparent',
                border: isDarkMode ? '1px solid var(--border-color, #404040)' : '1px solid #ddd',
                borderRadius: '20px',
                fontSize: '12px',
                color: isDarkMode ? 'var(--text-secondary, #ccc)' : '#666',
                cursor: 'pointer',
                marginLeft: 'auto',
                transition: 'all 0.2s'
              }}
              onMouseEnter={(e) => {
                e.target.style.backgroundColor = isDarkMode ? 'var(--bg-tertiary, #3a3a3a)' : '#e9ecef'
              }}
              onMouseLeave={(e) => {
                e.target.style.backgroundColor = 'transparent'
              }}
            >
              Clear All
            </button>
          </div>
        )}
      </div>
      <div style={{ overflowX: 'auto' }}>
        {loading && <div style={{ padding: '40px', textAlign: 'center', color: isDarkMode ? 'var(--text-tertiary, #999)' : '#999' }}>Loading...</div>}
        {error && <div style={{ padding: '40px', textAlign: 'center', color: isDarkMode ? 'var(--text-tertiary, #999)' : '#999' }}>{error}</div>}
        {!loading && !error && data && (
          data.data && data.data.length > 0 ? (
            <div style={{ 
              backgroundColor: isDarkMode ? 'var(--bg-primary, #1a1a1a)' : '#fff', 
              borderRadius: '4px', 
              overflowX: 'auto',
              overflowY: 'visible',
              boxShadow: isDarkMode ? '0 1px 3px rgba(0,0,0,0.3)' : '0 1px 3px rgba(0,0,0,0.1)',
              width: '100%'
            }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: 'max-content' }}>
                <thead>
                  <tr style={{ backgroundColor: isDarkMode ? 'var(--bg-secondary, #2d2d2d)' : '#f8f9fa' }}>
                    {columnsWithActions.map(col => (
                      <th
                        key={col}
                        style={{
                          padding: '12px',
                          textAlign: 'left',
                          fontWeight: 600,
                          borderBottom: isDarkMode ? '2px solid var(--border-color, #404040)' : '2px solid #dee2e6',
                          color: isDarkMode ? 'var(--text-primary, #fff)' : '#495057',
                          fontSize: '13px',
                          textTransform: 'uppercase',
                          letterSpacing: '0.5px'
                        }}
                      >
                        {col.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {filteredData.map((row, idx) => {
                    const orderId = row.order_id || row.orderId
                    const isExpanded = expandedRow === orderId
                    const details = orderDetails[orderId]
                    const isLoading = loadingDetails[orderId]

                    return (
                      <React.Fragment key={`order-${orderId || idx}`}>
                        <tr 
                          onClick={() => handleRowClick(row)}
                          style={{ 
                            backgroundColor: idx % 2 === 0 ? (isDarkMode ? 'var(--bg-primary, #1a1a1a)' : '#fff') : (isDarkMode ? 'var(--bg-tertiary, #3a3a3a)' : '#fafafa'),
                            cursor: 'pointer'
                          }}
                        >
                          {visibleColumns.map(col => {
                            const value = row[col]
                            let formattedValue = ''
                            
                            if (value === null || value === undefined) {
                              formattedValue = ''
                            } else if (col.includes('price') || col.includes('cost') || col.includes('total') || 
                                      col.includes('amount') || col.includes('fee')) {
                              formattedValue = typeof value === 'number' 
                                ? `$${value.toFixed(2)}` 
                                : `$${parseFloat(value || 0).toFixed(2)}`
                            } else if (col.includes('date') || col.includes('time')) {
                              try {
                                const date = new Date(value)
                                if (!isNaN(date.getTime())) {
                                  formattedValue = date.toLocaleString()
                                } else {
                                  formattedValue = String(value)
                                }
                              } catch {
                                formattedValue = String(value)
                              }
                            } else {
                              formattedValue = String(value)
                            }
                            
                            return (
                              <td 
                                key={col} 
                                style={{ 
                                  padding: '8px 12px', 
                                  borderBottom: isDarkMode ? '1px solid var(--border-light, #333)' : '1px solid #eee',
                                  fontSize: '14px',
                                  color: isDarkMode ? 'var(--text-primary, #fff)' : '#333',
                                  textAlign: (col.includes('price') || col.includes('cost') || col.includes('total') || 
                                             col.includes('amount') || col.includes('fee')) ? 'right' : 'left'
                                }}
                              >
                                {formattedValue}
                              </td>
                            )
                          })}
                          <td 
                            style={{ padding: '8px 12px', borderBottom: isDarkMode ? '1px solid var(--border-light, #333)' : '1px solid #eee' }}
                            onClick={(e) => e.stopPropagation()}
                          >
                            <button
                              onClick={() => handleReturn(row.order_number || row.orderNumber, orderId)}
                              style={{
                                padding: '6px 12px',
                                backgroundColor: `rgba(${themeColorRgb}, 0.7)`,
                                backdropFilter: 'blur(10px)',
                                WebkitBackdropFilter: 'blur(10px)',
                                color: '#fff',
                                border: '1px solid rgba(255, 255, 255, 0.2)',
                                borderRadius: '8px',
                                cursor: 'pointer',
                                fontSize: '14px',
                                fontWeight: 600,
                                boxShadow: `0 4px 15px rgba(${themeColorRgb}, 0.3), inset 0 1px 0 rgba(255, 255, 255, 0.2)`,
                                transition: 'all 0.3s ease'
                              }}
                              onMouseEnter={(e) => {
                                e.target.style.backgroundColor = `rgba(${themeColorRgb}, 0.8)`
                                e.target.style.boxShadow = `0 4px 20px rgba(${themeColorRgb}, 0.4), inset 0 1px 0 rgba(255, 255, 255, 0.2)`
                              }}
                              onMouseLeave={(e) => {
                                e.target.style.backgroundColor = `rgba(${themeColorRgb}, 0.7)`
                                e.target.style.boxShadow = `0 4px 15px rgba(${themeColorRgb}, 0.3), inset 0 1px 0 rgba(255, 255, 255, 0.2)`
                              }}
                            >
                              Return
                            </button>
                          </td>
                        </tr>
                        {isExpanded && (
                          <tr key={`${idx}-details`}>
                            <td colSpan={columnsWithActions.length} style={{ padding: '0', borderBottom: isDarkMode ? '1px solid var(--border-light, #333)' : '1px solid #eee' }}>
                              <div style={{
                                padding: '20px',
                                backgroundColor: isDarkMode ? 'var(--bg-secondary, #2d2d2d)' : '#f8f9fa',
                                borderTop: isDarkMode ? '2px solid var(--border-color, #404040)' : '2px solid #dee2e6'
                              }}>
                                {isLoading ? (
                                  <div style={{ textAlign: 'center', padding: '20px', color: isDarkMode ? 'var(--text-tertiary, #999)' : '#999' }}>
                                    Loading details...
                                  </div>
                                ) : details ? (
                                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '16px', color: isDarkMode ? 'var(--text-primary, #fff)' : '#333' }}>
                                    <div>
                                      <strong>Order ID:</strong> {orderId || 'N/A'}
                                    </div>
                                    <div>
                                      <strong>Employee ID:</strong> {details.employee_id || 'N/A'}
                                    </div>
                                    <div>
                                      <strong>Customer ID:</strong> {details.customer_id || 'N/A'}
                                    </div>
                                    <div>
                                      <strong>Subtotal:</strong> ${details.subtotal.toFixed(2)}
                                    </div>
                                    <div>
                                      <strong>Tax Rate:</strong> {(details.tax_rate * 100).toFixed(2)}%
                                    </div>
                                    <div>
                                      <strong>Tax Amount:</strong> ${details.tax_amount.toFixed(2)}
                                    </div>
                                    <div>
                                      <strong>Discount:</strong> ${details.discount.toFixed(2)}
                                    </div>
                                    <div>
                                      <strong>Transaction Fee:</strong> ${details.transaction_fee.toFixed(2)}
                                    </div>
                                    <div>
                                      <strong>Tip:</strong> ${details.tip.toFixed(2)}
                                    </div>
                                    {details.payment_method_id && (
                                      <div>
                                        <strong>Payment Method ID:</strong> {details.payment_method_id}
                                      </div>
                                    )}
                                    {details.customer_name && (
                                      <div>
                                        <strong>Customer Name:</strong> {details.customer_name}
                                      </div>
                                    )}
                                    {details.receipt_type && (
                                      <div>
                                        <strong>Receipt Type:</strong> {details.receipt_type}
                                      </div>
                                    )}
                                    {details.receipt_email && (
                                      <div>
                                        <strong>Receipt Email:</strong> {details.receipt_email}
                                      </div>
                                    )}
                                    {details.receipt_phone && (
                                      <div>
                                        <strong>Receipt Phone:</strong> {details.receipt_phone}
                                      </div>
                                    )}
                                    <div>
                                      <strong>Receipt Sent:</strong> {details.receipt_sent ? 'Yes' : 'No'}
                                    </div>
                                    {details.receipt_sent_at && (
                                      <div>
                                        <strong>Receipt Sent At:</strong> {new Date(details.receipt_sent_at).toLocaleString()}
                                      </div>
                                    )}
                                    {details.notes && (
                                      <div style={{ gridColumn: '1 / -1' }}>
                                        <strong>Notes:</strong> {details.notes}
                                      </div>
                                    )}
                                    <div style={{ gridColumn: '1 / -1', marginTop: '16px' }}>
                                      <strong>Items Purchased:</strong>
                                      {details.items && details.items.length > 0 ? (
                                        <table style={{ width: '100%', marginTop: '8px', borderCollapse: 'collapse' }}>
                                          <thead>
                                            <tr style={{ backgroundColor: isDarkMode ? 'var(--bg-tertiary, #3a3a3a)' : '#e9ecef' }}>
                                              <th style={{ padding: '8px', textAlign: 'left', fontSize: '12px', fontWeight: 600, color: isDarkMode ? 'var(--text-primary, #fff)' : '#333' }}>Product</th>
                                              <th style={{ padding: '8px', textAlign: 'left', fontSize: '12px', fontWeight: 600, color: isDarkMode ? 'var(--text-primary, #fff)' : '#333' }}>SKU</th>
                                              <th style={{ padding: '8px', textAlign: 'right', fontSize: '12px', fontWeight: 600, color: isDarkMode ? 'var(--text-primary, #fff)' : '#333' }}>Quantity</th>
                                              <th style={{ padding: '8px', textAlign: 'right', fontSize: '12px', fontWeight: 600, color: isDarkMode ? 'var(--text-primary, #fff)' : '#333' }}>Unit Price</th>
                                              <th style={{ padding: '8px', textAlign: 'right', fontSize: '12px', fontWeight: 600, color: isDarkMode ? 'var(--text-primary, #fff)' : '#333' }}>Discount</th>
                                              <th style={{ padding: '8px', textAlign: 'right', fontSize: '12px', fontWeight: 600, color: isDarkMode ? 'var(--text-primary, #fff)' : '#333' }}>Subtotal</th>
                                            </tr>
                                          </thead>
                                          <tbody>
                                            {details.items.map((item, itemIdx) => (
                                              <tr key={itemIdx} style={{ backgroundColor: itemIdx % 2 === 0 ? (isDarkMode ? 'var(--bg-primary, #1a1a1a)' : '#fff') : (isDarkMode ? 'var(--bg-secondary, #2d2d2d)' : '#f8f9fa') }}>
                                                <td style={{ padding: '8px', fontSize: '13px', color: isDarkMode ? 'var(--text-primary, #fff)' : '#333' }}>{item.product_name || 'N/A'}</td>
                                                <td style={{ padding: '8px', fontSize: '13px', color: isDarkMode ? 'var(--text-primary, #fff)' : '#333' }}>{item.sku || 'N/A'}</td>
                                                <td style={{ padding: '8px', textAlign: 'right', fontSize: '13px', color: isDarkMode ? 'var(--text-primary, #fff)' : '#333' }}>{item.quantity || 0}</td>
                                                <td style={{ padding: '8px', textAlign: 'right', fontSize: '13px', color: isDarkMode ? 'var(--text-primary, #fff)' : '#333' }}>${(item.unit_price || 0).toFixed(2)}</td>
                                                <td style={{ padding: '8px', textAlign: 'right', fontSize: '13px', color: isDarkMode ? 'var(--text-primary, #fff)' : '#333' }}>${(item.discount || 0).toFixed(2)}</td>
                                                <td style={{ padding: '8px', textAlign: 'right', fontSize: '13px', color: isDarkMode ? 'var(--text-primary, #fff)' : '#333' }}>${(item.subtotal || 0).toFixed(2)}</td>
                                              </tr>
                                            ))}
                                          </tbody>
                                        </table>
                                      ) : (
                                        <div style={{ marginTop: '8px', color: isDarkMode ? 'var(--text-tertiary, #999)' : '#999', fontSize: '13px' }}>No items found</div>
                                      )}
                                    </div>
                                  </div>
                                ) : (
                                  <div style={{ textAlign: 'center', padding: '20px', color: isDarkMode ? 'var(--text-tertiary, #999)' : '#999' }}>
                                    No details available
                                  </div>
                                )}
                              </div>
                            </td>
                          </tr>
                        )}
                      </React.Fragment>
                    )
                  })}
                </tbody>
              </table>
            </div>
          ) : (
            <div style={{ padding: '40px', textAlign: 'center', color: isDarkMode ? 'var(--text-tertiary, #999)' : '#999' }}>No orders found</div>
          )
        )}
      </div>

      {/* Barcode Scanner Modal */}
      {showBarcodeScanner && (
        <BarcodeScanner
          onScan={handleBarcodeScan}
          onClose={() => setShowBarcodeScanner(false)}
          themeColor={themeColor}
        />
      )}
    </div>
  )
}

export default RecentOrders

