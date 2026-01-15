import { useState, useEffect } from 'react'
import { useTheme } from '../contexts/ThemeContext'
import Table from '../components/Table'

function Inventory() {
  const { themeColor, themeMode } = useTheme()
  
  // Convert hex to RGB for rgba usage
  const hexToRgb = (hex) => {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex)
    return result ? `${parseInt(result[1], 16)}, ${parseInt(result[2], 16)}, ${parseInt(result[3], 16)}` : '132, 0, 255'
  }
  
  const themeColorRgb = hexToRgb(themeColor)
  
  const [inventory, setInventory] = useState([])
  const [allVendors, setAllVendors] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [filterView, setFilterView] = useState('category') // 'category', 'vendor', 'all'
  const [selectedCategory, setSelectedCategory] = useState(null)
  const [selectedVendor, setSelectedVendor] = useState(null)
  const [editingProduct, setEditingProduct] = useState(null)
  const [editFormData, setEditFormData] = useState({})
  const [editLoading, setEditLoading] = useState(false)
  const [editError, setEditError] = useState(null)
  const [editSuccess, setEditSuccess] = useState(false)
  const [sessionToken, setSessionToken] = useState(null)
  
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
    setSessionToken(localStorage.getItem('sessionToken'))
  }, [])

  useEffect(() => {
    loadInventory()
    loadVendors()
  }, [])

  const loadInventory = async () => {
    setLoading(true)
    setError(null)
    
    try {
      const response = await fetch('/api/inventory')
      const result = await response.json()
      // API returns { columns: [...], data: [...] }
      if (result.data) {
        setInventory(result.data)
      }
    } catch (err) {
      setError('Error loading inventory')
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  const loadVendors = async () => {
    try {
      const response = await fetch('/api/vendors')
      const result = await response.json()
      if (result.data) {
        setAllVendors(result.data)
      }
    } catch (err) {
      console.error('Error loading vendors:', err)
    }
  }

  const handleEditProduct = (product) => {
    setEditingProduct(product)
    setEditFormData({
      product_name: product.product_name || '',
      sku: product.sku || '',
      barcode: product.barcode || '',
      product_price: product.product_price || 0,
      product_cost: product.product_cost || 0,
      current_quantity: product.current_quantity || 0,
      category: product.category || '',
      vendor: product.vendor || '',
      vendor_id: product.vendor_id || null,
      photo: product.photo || ''
    })
    setEditError(null)
    setEditSuccess(false)
  }

  const handleCloseEdit = () => {
    setEditingProduct(null)
    setEditFormData({})
    setEditError(null)
    setEditSuccess(false)
  }

  const handleEditChange = (e) => {
    const { name, value } = e.target
    setEditFormData(prev => ({
      ...prev,
      [name]: name === 'product_price' || name === 'product_cost' || name === 'current_quantity' || name === 'vendor_id'
        ? (value === '' ? null : parseFloat(value))
        : value
    }))
  }

  const handleSaveProduct = async (e) => {
    if (e) e.preventDefault()
    setEditLoading(true)
    setEditError(null)
    setEditSuccess(false)

    try {
      const updateData = {
        ...editFormData,
        session_token: sessionToken
      }

      const response = await fetch(`/api/inventory/${editingProduct.product_id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(updateData)
      })

      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.message || 'Failed to update product')
      }

      setEditSuccess(true)
      setTimeout(() => {
        loadInventory() // Reload inventory after save
        handleCloseEdit()
      }, 1000)
    } catch (err) {
      setEditError(err.message || 'An error occurred while updating the product')
    } finally {
      setEditLoading(false)
    }
  }

  // Get unique categories
  const categories = [...new Set(inventory.map(item => item.category).filter(Boolean))].sort()
  
  // Get all vendors from vendors table (not just vendors with products)
  const vendors = allVendors.map(vendor => vendor.vendor_name).sort()

  // Fuzzy string matching function - allows for typos
  const fuzzyMatch = (str, pattern) => {
    if (!str || !pattern) return false
    
    const strLower = str.toLowerCase()
    const patternLower = pattern.toLowerCase()
    
    // Exact match or contains match (fastest)
    if (strLower.includes(patternLower)) return true
    
    // Simple fuzzy matching: allow 1-2 character differences for short patterns
    if (pattern.length <= 3) {
      // For very short patterns, be more lenient
      const maxDistance = Math.max(1, Math.floor(pattern.length * 0.5))
      return levenshteinDistance(strLower, patternLower) <= maxDistance
    }
    
    // For longer patterns, check if pattern is mostly contained
    // Allow up to 30% character difference
    const maxDistance = Math.max(1, Math.floor(pattern.length * 0.3))
    return levenshteinDistance(strLower, patternLower) <= maxDistance
  }
  
  // Simple Levenshtein distance calculation
  const levenshteinDistance = (str1, str2) => {
    const matrix = []
    
    for (let i = 0; i <= str2.length; i++) {
      matrix[i] = [i]
    }
    
    for (let j = 0; j <= str1.length; j++) {
      matrix[0][j] = j
    }
    
    for (let i = 1; i <= str2.length; i++) {
      for (let j = 1; j <= str1.length; j++) {
        if (str2.charAt(i - 1) === str1.charAt(j - 1)) {
          matrix[i][j] = matrix[i - 1][j - 1]
        } else {
          matrix[i][j] = Math.min(
            matrix[i - 1][j - 1] + 1, // substitution
            matrix[i][j - 1] + 1,     // insertion
            matrix[i - 1][j] + 1      // deletion
          )
        }
      }
    }
    
    return matrix[str2.length][str1.length]
  }

  // Filter inventory based on search
  const filteredInventory = inventory.filter(item => {
    if (!searchQuery) return true
    const query = searchQuery.toLowerCase()
    
    // Special handling for semantic searches (fruit, vegetable, etc.)
    const semanticTypes = {
      'fruit': 'fruit',
      'fruits': 'fruit',
      'vegetable': 'vegetable',
      'vegetables': 'vegetable',
      'dairy': 'dairy',
      'produce': null // Produce is a category, not a type
    }
    
    const expectedType = semanticTypes[query]
    
    const nameMatch = fuzzyMatch(item.product_name, searchQuery)
    const skuMatch = fuzzyMatch(item.sku, searchQuery)
    const barcodeMatch = fuzzyMatch(item.barcode, searchQuery)
    const categoryMatch = fuzzyMatch(item.category, searchQuery)
    const vendorMatch = fuzzyMatch(item.vendor_name || item.vendor, searchQuery)
    
    // Search in metadata keywords
    let keywordMatch = false
    if (item.keywords) {
      try {
        const keywords = typeof item.keywords === 'string' 
          ? JSON.parse(item.keywords) 
          : item.keywords
        if (Array.isArray(keywords)) {
          keywordMatch = keywords.some(kw => 
            kw && fuzzyMatch(kw, searchQuery)
          )
        }
      } catch (e) {
        // If not JSON, treat as string
        keywordMatch = fuzzyMatch(item.keywords, searchQuery)
      }
    }
    
    // Search in metadata tags
    let tagMatch = false
    if (item.tags) {
      try {
        const tags = typeof item.tags === 'string' 
          ? JSON.parse(item.tags) 
          : item.tags
        if (Array.isArray(tags)) {
          tagMatch = tags.some(tag => 
            tag && fuzzyMatch(tag, searchQuery)
          )
        }
      } catch (e) {
        // If not JSON, treat as string
        tagMatch = fuzzyMatch(item.tags, searchQuery)
      }
    }
    
    // Search in metadata attributes (type, texture, taste, etc.)
    let attributeMatch = false
    let typeMatch = false
    if (item.attributes) {
      try {
        const attrs = typeof item.attributes === 'string' 
          ? JSON.parse(item.attributes) 
          : item.attributes
        if (typeof attrs === 'object' && attrs !== null) {
          // Check all attribute values for general match
          attributeMatch = Object.values(attrs).some(val => {
            if (typeof val === 'string') {
              return fuzzyMatch(val, searchQuery)
            }
            return false
          })
          
          // For semantic searches (fruit, vegetable), check type attribute specifically
          // Use exact match for type to avoid false positives
          if (expectedType !== null && expectedType !== undefined) {
            typeMatch = attrs.type && attrs.type.toLowerCase() === expectedType
          }
        }
      } catch (e) {
        // If not JSON, treat as string
        attributeMatch = fuzzyMatch(item.attributes, searchQuery)
      }
    }
    
    // If searching for a specific type (fruit, vegetable), require type match
    if (expectedType !== null && expectedType !== undefined) {
      return typeMatch || nameMatch || skuMatch
    }
    
    // Otherwise, match on any field
    return nameMatch || skuMatch || barcodeMatch || categoryMatch || vendorMatch || keywordMatch || tagMatch || attributeMatch
  })

  // Get items by category
  const getItemsByCategory = (category) => {
    return filteredInventory.filter(item => item.category === category)
  }

  // Get items by vendor
  const getItemsByVendor = (vendorName) => {
    // Find vendor by name to get vendor_id
    const vendor = allVendors.find(v => v.vendor_name === vendorName)
    if (vendor) {
      return filteredInventory.filter(item => 
        item.vendor_id === vendor.vendor_id || 
        (item.vendor_name || item.vendor) === vendorName
      )
    }
    return filteredInventory.filter(item => 
      (item.vendor_name || item.vendor) === vendorName
    )
  }

  // Handle category click
  const handleCategoryClick = (category) => {
    setSelectedCategory(category)
    setSelectedVendor(null)
  }

  // Handle vendor click
  const handleVendorClick = (vendorName) => {
    setSelectedVendor(vendorName)
    setSelectedCategory(null)
  }

  // Handle filter view change
  const handleFilterChange = (view) => {
    setFilterView(view)
    setSelectedCategory(null)
    setSelectedVendor(null)
  }

  // Render category grid
  const renderCategoryGrid = () => {
    if (selectedCategory) {
      const items = getItemsByCategory(selectedCategory)
      return (
        <div>
          <div style={{ 
            display: 'flex', 
            alignItems: 'center', 
            gap: '12px', 
            marginBottom: '20px' 
          }}>
            <button
              onClick={() => setSelectedCategory(null)}
              style={{
                padding: '8px 16px',
                backgroundColor: isDarkMode ? 'var(--bg-secondary, #2d2d2d)' : '#f0f0f0',
                border: isDarkMode ? '1px solid var(--border-color, #404040)' : '1px solid #ddd',
                borderRadius: '4px',
                cursor: 'pointer',
                fontSize: '14px',
                color: isDarkMode ? 'var(--text-primary, #fff)' : '#333'
              }}
            >
              ← Back
            </button>
            <h2 style={{ margin: 0, fontSize: '20px', fontWeight: 500, color: isDarkMode ? 'var(--text-primary, #fff)' : '#333' }}>
              {selectedCategory} ({items.length} items)
            </h2>
          </div>
          {items.length > 0 ? (
            <Table 
              columns={['photo', 'product_name', 'sku', 'barcode', 'product_price', 'current_quantity', 'vendor_name', 'vendor']} 
              data={items}
              onEdit={handleEditProduct}
            />
          ) : (
            <div style={{ padding: '40px', textAlign: 'center', color: isDarkMode ? 'var(--text-tertiary, #999)' : '#999' }}>
              No items found in this category
            </div>
          )}
        </div>
      )
    }

    return (
      <div>
        <div style={{ 
          display: 'flex',
          flexWrap: 'wrap',
          gap: '8px',
          marginTop: '20px'
        }}>
          {categories.map(category => {
            const itemCount = getItemsByCategory(category).length
            return (
              <button
                key={category}
                onClick={() => handleCategoryClick(category)}
                style={{
                  padding: '10px 16px',
                  backgroundColor: selectedCategory === category ? `rgba(${themeColorRgb}, 0.7)` : `rgba(${themeColorRgb}, 0.2)`,
                  backdropFilter: 'blur(10px)',
                  WebkitBackdropFilter: 'blur(10px)',
                  border: selectedCategory === category ? '1px solid rgba(255, 255, 255, 0.3)' : `1px solid rgba(${themeColorRgb}, 0.3)`,
                  borderRadius: '8px',
                  fontSize: '14px',
                  fontWeight: selectedCategory === category ? 600 : 500,
                  color: '#fff',
                  cursor: 'pointer',
                  transition: 'all 0.3s ease',
                  boxShadow: selectedCategory === category ? `0 4px 15px rgba(${themeColorRgb}, 0.3), inset 0 1px 0 rgba(255, 255, 255, 0.2)` : `0 2px 8px rgba(${themeColorRgb}, 0.1)`
                }}
              >
                {category}
              </button>
            )
          })}
        </div>
        {categories.length === 0 && (
          <div style={{ padding: '40px', textAlign: 'center', color: isDarkMode ? 'var(--text-tertiary, #999)' : '#999' }}>
            No categories found
          </div>
        )}
      </div>
    )
  }

  // Render vendor grid
  const renderVendorGrid = () => {
    if (selectedVendor) {
      const items = getItemsByVendor(selectedVendor)
      return (
        <div>
          <div style={{ 
            display: 'flex', 
            alignItems: 'center', 
            gap: '12px', 
            marginBottom: '20px' 
          }}>
            <button
              onClick={() => setSelectedVendor(null)}
              style={{
                padding: '8px 16px',
                backgroundColor: isDarkMode ? 'var(--bg-secondary, #2d2d2d)' : '#f0f0f0',
                border: isDarkMode ? '1px solid var(--border-color, #404040)' : '1px solid #ddd',
                borderRadius: '4px',
                cursor: 'pointer',
                fontSize: '14px',
                color: isDarkMode ? 'var(--text-primary, #fff)' : '#333'
              }}
            >
              ← Back
            </button>
            <h2 style={{ margin: 0, fontSize: '20px', fontWeight: 500, color: isDarkMode ? 'var(--text-primary, #fff)' : '#333' }}>
              {selectedVendor} ({items.length} items)
            </h2>
          </div>
          {items.length > 0 ? (
            <Table 
              columns={['photo', 'product_name', 'sku', 'barcode', 'product_price', 'current_quantity', 'category']} 
              data={items}
              onEdit={handleEditProduct}
            />
          ) : (
            <div style={{ padding: '40px', textAlign: 'center', color: isDarkMode ? 'var(--text-tertiary, #999)' : '#999' }}>
              No items found for this vendor
            </div>
          )}
        </div>
      )
    }

    return (
      <div>
        <div style={{ 
          display: 'grid', 
          gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', 
          gap: '16px',
          marginTop: '20px'
        }}>
          {vendors.map(vendor => {
            const itemCount = getItemsByVendor(vendor).length
            return (
              <div
                key={vendor}
                onClick={() => handleVendorClick(vendor)}
                style={{
                  padding: '24px',
                  backgroundColor: isDarkMode ? 'var(--bg-primary, #1a1a1a)' : '#fff',
                  border: isDarkMode ? '2px solid var(--border-color, #404040)' : '2px solid #e0e0e0',
                  borderRadius: '8px',
                  cursor: 'pointer',
                  transition: 'all 0.2s',
                  textAlign: 'center'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.borderColor = isDarkMode ? `rgba(${themeColorRgb}, 0.5)` : '#4a90e2'
                  e.currentTarget.style.boxShadow = isDarkMode ? `0 4px 8px rgba(${themeColorRgb}, 0.2)` : '0 4px 8px rgba(0,0,0,0.1)'
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.borderColor = isDarkMode ? 'var(--border-color, #404040)' : '#e0e0e0'
                  e.currentTarget.style.boxShadow = 'none'
                }}
              >
                <div style={{ 
                  fontSize: '18px', 
                  fontWeight: 600, 
                  marginBottom: '8px',
                  color: isDarkMode ? 'var(--text-primary, #fff)' : '#333'
                }}>
                  {vendor}
                </div>
                <div style={{ 
                  fontSize: '14px', 
                  color: isDarkMode ? 'var(--text-secondary, #999)' : '#666' 
                }}>
                  {itemCount} {itemCount === 1 ? 'item' : 'items'}
                </div>
              </div>
            )
          })}
        </div>
        {vendors.length === 0 && (
          <div style={{ padding: '40px', textAlign: 'center', color: isDarkMode ? 'var(--text-tertiary, #999)' : '#999' }}>
            No vendors found
          </div>
        )}
      </div>
    )
  }

  // Render all items list
  const renderAllItems = () => {
    if (filteredInventory.length === 0) {
      return (
        <div style={{ padding: '40px', textAlign: 'center', color: isDarkMode ? 'var(--text-tertiary, #999)' : '#999' }}>
          {searchQuery ? 'No items match your search' : 'No items found'}
        </div>
      )
    }

    return (
      <div style={{ marginTop: '20px' }}>
        <Table 
          columns={['photo', 'product_name', 'sku', 'barcode', 'product_price', 'current_quantity', 'category', 'vendor_name', 'vendor']} 
          data={filteredInventory}
          onEdit={handleEditProduct}
        />
      </div>
    )
  }

  if (loading) {
    return (
      <div style={{ padding: '40px', textAlign: 'center', color: isDarkMode ? 'var(--text-tertiary, #999)' : '#999' }}>
        Loading...
      </div>
    )
  }

  if (error) {
    return (
      <div style={{ padding: '40px', textAlign: 'center', color: isDarkMode ? 'var(--text-tertiary, #999)' : '#999' }}>
        {error}
      </div>
    )
  }

  return (
    <div style={{ padding: '40px', maxWidth: '1600px', margin: '0 auto' }}>
      <div style={{ display: 'flex', gap: '30px', height: 'calc(100vh - 200px)' }}>
        {/* Left Column - Search */}
        <div style={{ 
          width: '300px', 
          flexShrink: 0,
          display: 'flex',
          flexDirection: 'column'
        }}>
          <div style={{ marginBottom: '20px' }}>
            <input
              type="text"
              placeholder="Search by name, SKU, barcode..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              style={{
                width: '100%',
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
          </div>

          {/* Edit Product Form */}
          {editingProduct && (
            <div style={{
              backgroundColor: isDarkMode ? 'var(--bg-primary, #1a1a1a)' : '#fff',
              border: isDarkMode ? '1px solid var(--border-color, #404040)' : '1px solid #ddd',
              borderRadius: '8px',
              padding: '12px',
              marginTop: '20px'
            }}>
              {editError && (
                <div style={{
                  padding: '8px',
                  backgroundColor: isDarkMode ? 'rgba(198, 40, 40, 0.2)' : '#fee',
                  border: isDarkMode ? '1px solid rgba(198, 40, 40, 0.4)' : '1px solid #fcc',
                  borderRadius: '4px',
                  color: isDarkMode ? '#ef5350' : '#c33',
                  marginBottom: '12px',
                  fontSize: '12px'
                }}>
                  {editError}
                </div>
              )}

              {editSuccess && (
                <div style={{
                  padding: '8px',
                  backgroundColor: isDarkMode ? 'rgba(46, 125, 50, 0.2)' : '#efe',
                  border: isDarkMode ? '1px solid rgba(46, 125, 50, 0.4)' : '1px solid #cfc',
                  borderRadius: '4px',
                  color: isDarkMode ? '#81c784' : '#3c3',
                  marginBottom: '12px',
                  fontSize: '12px'
                }}>
                  Product updated successfully!
                </div>
              )}

              <form onSubmit={handleSaveProduct}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  <div>
                    <label style={{ display: 'block', marginBottom: '4px', fontSize: '12px', fontWeight: 500, fontFamily: '"Product Sans", sans-serif', color: isDarkMode ? 'var(--text-primary, #fff)' : '#333' }}>
                      Product Name *
                    </label>
                    <input
                      type="text"
                      name="product_name"
                      value={editFormData.product_name || ''}
                      onChange={handleEditChange}
                      required
                      style={{
                        width: '100%',
                        padding: '6px',
                        border: isDarkMode ? '1px solid var(--border-color, #404040)' : '1px solid #ddd',
                        borderRadius: '4px',
                        fontSize: '13px',
                        boxSizing: 'border-box',
                        fontFamily: '"Product Sans", sans-serif',
                        backgroundColor: isDarkMode ? 'var(--bg-secondary, #2d2d2d)' : '#fff',
                        color: isDarkMode ? 'var(--text-primary, #fff)' : '#333'
                      }}
                    />
                  </div>

                  <div>
                    <label style={{ display: 'block', marginBottom: '4px', fontSize: '12px', fontWeight: 500, fontFamily: '"Product Sans", sans-serif', color: isDarkMode ? 'var(--text-primary, #fff)' : '#333' }}>
                      SKU *
                    </label>
                    <input
                      type="text"
                      name="sku"
                      value={editFormData.sku || ''}
                      onChange={handleEditChange}
                      required
                      style={{
                        width: '100%',
                        padding: '6px',
                        border: isDarkMode ? '1px solid var(--border-color, #404040)' : '1px solid #ddd',
                        borderRadius: '4px',
                        fontSize: '13px',
                        boxSizing: 'border-box',
                        fontFamily: '"Product Sans", sans-serif',
                        backgroundColor: isDarkMode ? 'var(--bg-secondary, #2d2d2d)' : '#fff',
                        color: isDarkMode ? 'var(--text-primary, #fff)' : '#333'
                      }}
                    />
                  </div>

                  <div>
                    <label style={{ display: 'block', marginBottom: '4px', fontSize: '12px', fontWeight: 500, fontFamily: '"Product Sans", sans-serif', color: isDarkMode ? 'var(--text-primary, #fff)' : '#333' }}>
                      Barcode
                    </label>
                    <input
                      type="text"
                      name="barcode"
                      value={editFormData.barcode || ''}
                      onChange={handleEditChange}
                      style={{
                        width: '100%',
                        padding: '6px',
                        border: isDarkMode ? '1px solid var(--border-color, #404040)' : '1px solid #ddd',
                        borderRadius: '4px',
                        fontSize: '13px',
                        boxSizing: 'border-box',
                        fontFamily: '"Product Sans", sans-serif',
                        backgroundColor: isDarkMode ? 'var(--bg-secondary, #2d2d2d)' : '#fff',
                        color: isDarkMode ? 'var(--text-primary, #fff)' : '#333'
                      }}
                    />
                  </div>

                  <div>
                    <label style={{ display: 'block', marginBottom: '4px', fontSize: '12px', fontWeight: 500, fontFamily: '"Product Sans", sans-serif', color: isDarkMode ? 'var(--text-primary, #fff)' : '#333' }}>
                      Category
                    </label>
                    <input
                      type="text"
                      name="category"
                      value={editFormData.category || ''}
                      onChange={handleEditChange}
                      style={{
                        width: '100%',
                        padding: '6px',
                        border: isDarkMode ? '1px solid var(--border-color, #404040)' : '1px solid #ddd',
                        borderRadius: '4px',
                        fontSize: '13px',
                        boxSizing: 'border-box',
                        fontFamily: '"Product Sans", sans-serif',
                        backgroundColor: isDarkMode ? 'var(--bg-secondary, #2d2d2d)' : '#fff',
                        color: isDarkMode ? 'var(--text-primary, #fff)' : '#333'
                      }}
                    />
                  </div>

                  <div>
                    <label style={{ display: 'block', marginBottom: '4px', fontSize: '12px', fontWeight: 500, fontFamily: '"Product Sans", sans-serif', color: isDarkMode ? 'var(--text-primary, #fff)' : '#333' }}>
                      Product Price *
                    </label>
                    <input
                      type="number"
                      name="product_price"
                      value={editFormData.product_price || ''}
                      onChange={handleEditChange}
                      required
                      min="0"
                      step="0.01"
                      style={{
                        width: '100%',
                        padding: '6px',
                        border: isDarkMode ? '1px solid var(--border-color, #404040)' : '1px solid #ddd',
                        borderRadius: '4px',
                        fontSize: '13px',
                        boxSizing: 'border-box',
                        fontFamily: '"Product Sans", sans-serif',
                        backgroundColor: isDarkMode ? 'var(--bg-secondary, #2d2d2d)' : '#fff',
                        color: isDarkMode ? 'var(--text-primary, #fff)' : '#333'
                      }}
                    />
                  </div>

                  <div>
                    <label style={{ display: 'block', marginBottom: '4px', fontSize: '12px', fontWeight: 500, fontFamily: '"Product Sans", sans-serif', color: isDarkMode ? 'var(--text-primary, #fff)' : '#333' }}>
                      Product Cost *
                    </label>
                    <input
                      type="number"
                      name="product_cost"
                      value={editFormData.product_cost || ''}
                      onChange={handleEditChange}
                      required
                      min="0"
                      step="0.01"
                      style={{
                        width: '100%',
                        padding: '6px',
                        border: isDarkMode ? '1px solid var(--border-color, #404040)' : '1px solid #ddd',
                        borderRadius: '4px',
                        fontSize: '13px',
                        boxSizing: 'border-box',
                        fontFamily: '"Product Sans", sans-serif',
                        backgroundColor: isDarkMode ? 'var(--bg-secondary, #2d2d2d)' : '#fff',
                        color: isDarkMode ? 'var(--text-primary, #fff)' : '#333'
                      }}
                    />
                  </div>

                  <div>
                    <label style={{ display: 'block', marginBottom: '4px', fontSize: '12px', fontWeight: 500, fontFamily: '"Product Sans", sans-serif', color: isDarkMode ? 'var(--text-primary, #fff)' : '#333' }}>
                      Current Quantity *
                    </label>
                    <input
                      type="number"
                      name="current_quantity"
                      value={editFormData.current_quantity || ''}
                      onChange={handleEditChange}
                      required
                      min="0"
                      step="1"
                      style={{
                        width: '100%',
                        padding: '6px',
                        border: isDarkMode ? '1px solid var(--border-color, #404040)' : '1px solid #ddd',
                        borderRadius: '4px',
                        fontSize: '13px',
                        boxSizing: 'border-box',
                        fontFamily: '"Product Sans", sans-serif',
                        backgroundColor: isDarkMode ? 'var(--bg-secondary, #2d2d2d)' : '#fff',
                        color: isDarkMode ? 'var(--text-primary, #fff)' : '#333'
                      }}
                    />
                  </div>

                  <div>
                    <label style={{ display: 'block', marginBottom: '4px', fontSize: '12px', fontWeight: 500, fontFamily: '"Product Sans", sans-serif', color: isDarkMode ? 'var(--text-primary, #fff)' : '#333' }}>
                      Vendor
                    </label>
                    <input
                      type="text"
                      name="vendor"
                      value={editFormData.vendor || ''}
                      onChange={handleEditChange}
                      style={{
                        width: '100%',
                        padding: '6px',
                        border: isDarkMode ? '1px solid var(--border-color, #404040)' : '1px solid #ddd',
                        borderRadius: '4px',
                        fontSize: '13px',
                        boxSizing: 'border-box',
                        fontFamily: '"Product Sans", sans-serif',
                        backgroundColor: isDarkMode ? 'var(--bg-secondary, #2d2d2d)' : '#fff',
                        color: isDarkMode ? 'var(--text-primary, #fff)' : '#333'
                      }}
                    />
                  </div>

                  <div style={{
                    display: 'flex',
                    gap: '8px',
                    marginTop: '4px'
                  }}>
                    <button
                      type="button"
                      onClick={handleCloseEdit}
                      disabled={editLoading}
                      style={{
                        flex: 1,
                        padding: '8px',
                        backgroundColor: isDarkMode ? 'var(--bg-secondary, #2d2d2d)' : '#f0f0f0',
                        border: isDarkMode ? '1px solid var(--border-color, #404040)' : '1px solid #ddd',
                        borderRadius: '4px',
                        cursor: editLoading ? 'not-allowed' : 'pointer',
                        fontSize: '13px',
                        fontWeight: 500,
                        fontFamily: '"Product Sans", sans-serif',
                        color: isDarkMode ? 'var(--text-primary, #fff)' : '#333'
                      }}
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={editLoading}
                      style={{
                        flex: 1,
                        padding: '8px',
                        backgroundColor: editLoading ? '#ccc' : `rgba(${themeColorRgb}, 0.7)`,
                        color: '#fff',
                        border: 'none',
                        borderRadius: '4px',
                        cursor: editLoading ? 'not-allowed' : 'pointer',
                        fontSize: '13px',
                        fontWeight: 500,
                        fontFamily: '"Product Sans", sans-serif'
                      }}
                    >
                      {editLoading ? 'Saving...' : 'Save'}
                    </button>
                  </div>
                </div>
              </form>
            </div>
          )}
        </div>

        {/* Right Column - Grid with Filters */}
        <div style={{ 
          flex: 1,
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
          borderLeft: isDarkMode ? '1px solid var(--border-color, #404040)' : '1px solid #ddd',
          paddingLeft: '30px'
        }}>
          {/* Filter Buttons */}
          <div style={{ 
            display: 'flex', 
            gap: '8px', 
            marginBottom: '20px',
            borderBottom: isDarkMode ? '2px solid var(--border-light, #333)' : '2px solid #eee',
            paddingBottom: '12px'
          }}>
            <button
              onClick={() => handleFilterChange('category')}
              style={{
                padding: '10px 16px',
                backgroundColor: filterView === 'category' ? `rgba(${themeColorRgb}, 0.7)` : `rgba(${themeColorRgb}, 0.2)`,
                backdropFilter: 'blur(10px)',
                WebkitBackdropFilter: 'blur(10px)',
                border: filterView === 'category' ? '1px solid rgba(255, 255, 255, 0.3)' : `1px solid rgba(${themeColorRgb}, 0.3)`,
                borderRadius: '8px',
                fontSize: '14px',
                fontWeight: filterView === 'category' ? 600 : 500,
                color: '#fff',
                cursor: 'pointer',
                transition: 'all 0.3s ease',
                boxShadow: filterView === 'category' ? `0 4px 15px rgba(${themeColorRgb}, 0.3), inset 0 1px 0 rgba(255, 255, 255, 0.2)` : `0 2px 8px rgba(${themeColorRgb}, 0.1)`
              }}
            >
              Category
            </button>
            <button
              onClick={() => handleFilterChange('vendor')}
              style={{
                padding: '10px 16px',
                backgroundColor: filterView === 'vendor' ? `rgba(${themeColorRgb}, 0.7)` : `rgba(${themeColorRgb}, 0.2)`,
                backdropFilter: 'blur(10px)',
                WebkitBackdropFilter: 'blur(10px)',
                border: filterView === 'vendor' ? '1px solid rgba(255, 255, 255, 0.3)' : `1px solid rgba(${themeColorRgb}, 0.3)`,
                borderRadius: '8px',
                fontSize: '14px',
                fontWeight: filterView === 'vendor' ? 600 : 500,
                color: '#fff',
                cursor: 'pointer',
                transition: 'all 0.3s ease',
                boxShadow: filterView === 'vendor' ? `0 4px 15px rgba(${themeColorRgb}, 0.3), inset 0 1px 0 rgba(255, 255, 255, 0.2)` : `0 2px 8px rgba(${themeColorRgb}, 0.1)`
              }}
            >
              Vendor
            </button>
            <button
              onClick={() => handleFilterChange('all')}
              style={{
                padding: '10px 16px',
                backgroundColor: filterView === 'all' ? `rgba(${themeColorRgb}, 0.7)` : `rgba(${themeColorRgb}, 0.2)`,
                backdropFilter: 'blur(10px)',
                WebkitBackdropFilter: 'blur(10px)',
                border: filterView === 'all' ? '1px solid rgba(255, 255, 255, 0.3)' : `1px solid rgba(${themeColorRgb}, 0.3)`,
                borderRadius: '8px',
                fontSize: '14px',
                fontWeight: filterView === 'all' ? 600 : 500,
                color: '#fff',
                cursor: 'pointer',
                transition: 'all 0.3s ease',
                boxShadow: filterView === 'all' ? `0 4px 15px rgba(${themeColorRgb}, 0.3), inset 0 1px 0 rgba(255, 255, 255, 0.2)` : `0 2px 8px rgba(${themeColorRgb}, 0.1)`
              }}
            >
              All
            </button>
          </div>

          {/* Content Area */}
          <div style={{ 
            flex: 1, 
            overflowY: 'auto',
            overflowX: 'hidden'
          }}>
            {filterView === 'category' && renderCategoryGrid()}
            {filterView === 'vendor' && renderVendorGrid()}
            {filterView === 'all' && renderAllItems()}
          </div>
        </div>
      </div>

    </div>
  )
}

export default Inventory
