import React, { useState, useEffect } from 'react'
import { useTheme } from '../../contexts/ThemeContext'
import CustomDropdown from '../common/CustomDropdown'
import {
  FormLabel,
  FormField,
  inputBaseStyle,
  getInputFocusHandlers,
  FormModalActions
} from '../FormStyles'

function hexToRgb(hex) {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex)
  return result ? `${parseInt(result[1], 16)}, ${parseInt(result[2], 16)}, ${parseInt(result[3], 16)}` : '132, 0, 255'
}

function ItemForm({
  item,
  revenueAccounts = [],
  expenseAccounts = [],
  assetAccounts = [],
  taxRates = [],
  onSubmit,
  onCancel
}) {
  const { themeColor } = useTheme()
  const themeColorRgb = hexToRgb(themeColor || '#8400ff')
  const isDarkMode = document.documentElement.classList.contains('dark-theme')

  const [formData, setFormData] = useState({
    item_name: '',
    item_type: 'inventory',
    description: '',
    barcode: '',
    unit_of_measure: 'ea',
    income_account_id: 0,
    expense_account_id: 0,
    asset_account_id: undefined,
    quantity_on_hand: 0,
    reorder_point: 0,
    reorder_quantity: 0,
    purchase_cost: 0,
    sales_price: 0,
    is_taxable: true,
    tax_rate_id: undefined,
    cost_method: 'Average'
  })

  const [errors, setErrors] = useState({})
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (item) {
      setFormData({
        item_name: item.item_name || '',
        item_type: item.item_type || 'inventory',
        description: item.description || '',
        barcode: item.barcode || '',
        unit_of_measure: item.unit_of_measure || 'ea',
        income_account_id: item.income_account_id || 0,
        expense_account_id: item.expense_account_id || 0,
        asset_account_id: item.asset_account_id,
        quantity_on_hand: item.quantity_on_hand || 0,
        reorder_point: item.reorder_point || 0,
        reorder_quantity: item.reorder_quantity || 0,
        purchase_cost: item.purchase_cost || 0,
        sales_price: item.sales_price || 0,
        is_taxable: item.is_taxable !== undefined ? item.is_taxable : true,
        tax_rate_id: item.tax_rate_id,
        cost_method: item.cost_method || 'Average'
      })
    }
  }, [item])

  const handleChange = (e) => {
    const { name, value, type } = e.target
    const checked = e.target.checked

    let v = value
    if (type === 'checkbox') {
      v = checked
    } else if (name.includes('account_id') || name === 'tax_rate_id' || name === 'category_id') {
      v = value ? parseInt(value, 10) : undefined
    } else if (name === 'quantity_on_hand' || name === 'reorder_point' || name === 'reorder_quantity' || 
               name === 'purchase_cost' || name === 'sales_price') {
      v = parseFloat(value) || 0
    }

    setFormData(prev => ({ ...prev, [name]: v }))
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }))
    }
  }

  const validate = () => {
    const newErrors = {}

    if (!formData.item_name.trim()) {
      newErrors.item_name = 'Item name is required'
    }

    if (!formData.income_account_id) {
      newErrors.income_account_id = 'Revenue account is required'
    }

    if (!formData.expense_account_id) {
      newErrors.expense_account_id = 'Expense/COGS account is required'
    }

    if (formData.item_type === 'inventory' && !formData.asset_account_id) {
      newErrors.asset_account_id = 'Inventory asset account is required for inventory items'
    }

    if (formData.sales_price < 0) {
      newErrors.sales_price = 'Sales price cannot be negative'
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!validate()) return

    setLoading(true)
    try {
      await onSubmit(formData)
    } catch (error) {
      console.error('Form submission error:', error)
    } finally {
      setLoading(false)
    }
  }

  const itemTypeOptions = [
    { value: 'inventory', label: 'Inventory (tracked in stock)' },
    { value: 'non_inventory', label: 'Non-Inventory (not tracked)' },
    { value: 'service', label: 'Service' },
    { value: 'bundle', label: 'Bundle/Kit' }
  ]

  const costMethodOptions = [
    { value: 'Average', label: 'Average Cost' },
    { value: 'FIFO', label: 'FIFO (First In, First Out)' },
    { value: 'LIFO', label: 'LIFO (Last In, First Out)' }
  ]

  const unitOptions = [
    { value: 'ea', label: 'Each (ea)' },
    { value: 'box', label: 'Box' },
    { value: 'case', label: 'Case' },
    { value: 'lb', label: 'Pound (lb)' },
    { value: 'oz', label: 'Ounce (oz)' },
    { value: 'ft', label: 'Foot (ft)' },
    { value: 'hr', label: 'Hour (hr)' }
  ]

  const isInventoryType = formData.item_type === 'inventory'
  const profitMargin = formData.sales_price > 0 && formData.purchase_cost > 0
    ? ((formData.sales_price - formData.purchase_cost) / formData.sales_price * 100).toFixed(1)
    : 0
  const profitAmount = formData.sales_price - formData.purchase_cost

  return (
    <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      {/* Item Type Selection */}
      <div style={{
        backgroundColor: isDarkMode ? '#2a2a2a' : '#f9fafb',
        padding: '16px',
        borderRadius: '8px'
      }}>
        <FormField>
          <FormLabel isDarkMode={isDarkMode} required>Item Type</FormLabel>
          <CustomDropdown
            name="item_type"
            value={formData.item_type}
            onChange={handleChange}
            options={itemTypeOptions}
            placeholder="Select item type"
            isDarkMode={isDarkMode}
            themeColorRgb={themeColorRgb}
            compactTrigger
          />
        </FormField>
      </div>

      {/* Basic Information */}
      <div style={{
        backgroundColor: isDarkMode ? '#1f1f1f' : 'white',
        padding: '16px',
        borderRadius: '8px',
        border: `1px solid ${isDarkMode ? '#3a3a3a' : '#e5e7eb'}`
      }}>
        <h3 style={{
          fontSize: '18px',
          fontWeight: 600,
          color: isDarkMode ? '#ffffff' : '#111827',
          marginBottom: '16px'
        }}>
          Item Information
        </h3>
        
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '16px' }}>
          <FormField>
            <FormLabel isDarkMode={isDarkMode} required>Item Name</FormLabel>
            <input
              name="item_name"
              value={formData.item_name}
              onChange={handleChange}
              placeholder="Product Name"
              style={inputBaseStyle(isDarkMode, themeColorRgb)}
              {...getInputFocusHandlers(themeColorRgb, isDarkMode)}
            />
            {errors.item_name && <p style={{ marginTop: '4px', fontSize: '12px', color: '#ef4444' }}>{errors.item_name}</p>}
          </FormField>

          <FormField>
            <FormLabel isDarkMode={isDarkMode}>Barcode/UPC</FormLabel>
            <input
              name="barcode"
              value={formData.barcode || ''}
              onChange={handleChange}
              placeholder="Scan or enter barcode"
              style={inputBaseStyle(isDarkMode, themeColorRgb)}
              {...getInputFocusHandlers(themeColorRgb, isDarkMode)}
            />
          </FormField>

          <FormField>
            <FormLabel isDarkMode={isDarkMode}>Unit of Measure</FormLabel>
            <CustomDropdown
              name="unit_of_measure"
              value={formData.unit_of_measure}
              onChange={handleChange}
              options={unitOptions}
              placeholder="Select unit"
              isDarkMode={isDarkMode}
              themeColorRgb={themeColorRgb}
              compactTrigger
            />
          </FormField>

          <FormField style={{ gridColumn: '1 / -1' }}>
            <FormLabel isDarkMode={isDarkMode}>Description</FormLabel>
            <textarea
              name="description"
              value={formData.description || ''}
              onChange={handleChange}
              rows={3}
              placeholder="Item description..."
              style={{
                ...inputBaseStyle(isDarkMode, themeColorRgb),
                fontFamily: 'inherit',
                resize: 'vertical'
              }}
              {...getInputFocusHandlers(themeColorRgb, isDarkMode)}
            />
          </FormField>
        </div>
      </div>

      {/* Pricing */}
      <div style={{
        backgroundColor: isDarkMode ? '#1f1f1f' : 'white',
        padding: '16px',
        borderRadius: '8px',
        border: `1px solid ${isDarkMode ? '#3a3a3a' : '#e5e7eb'}`
      }}>
        <h3 style={{
          fontSize: '18px',
          fontWeight: 600,
          color: isDarkMode ? '#ffffff' : '#111827',
          marginBottom: '16px'
        }}>
          Pricing
        </h3>
        
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '16px' }}>
          {isInventoryType && (
            <FormField>
              <FormLabel isDarkMode={isDarkMode}>Purchase Cost</FormLabel>
              <input
                name="purchase_cost"
                type="number"
                step="0.01"
                value={formData.purchase_cost || 0}
                onChange={handleChange}
                placeholder="0.00"
                style={{ ...inputBaseStyle(isDarkMode, themeColorRgb), textAlign: 'right' }}
                {...getInputFocusHandlers(themeColorRgb, isDarkMode)}
              />
            </FormField>
          )}

          <FormField>
            <FormLabel isDarkMode={isDarkMode} required>Sales Price</FormLabel>
            <input
              name="sales_price"
              type="number"
              step="0.01"
              value={formData.sales_price || 0}
              onChange={handleChange}
              placeholder="0.00"
              style={{ ...inputBaseStyle(isDarkMode, themeColorRgb), textAlign: 'right' }}
              {...getInputFocusHandlers(themeColorRgb, isDarkMode)}
            />
            {errors.sales_price && <p style={{ marginTop: '4px', fontSize: '12px', color: '#ef4444' }}>{errors.sales_price}</p>}
          </FormField>
        </div>

        {isInventoryType && formData.purchase_cost > 0 && formData.sales_price > 0 && (
          <div style={{
            marginTop: '12px',
            padding: '12px',
            backgroundColor: isDarkMode ? '#1e3a5f' : '#dbeafe',
            borderRadius: '6px'
          }}>
            <p style={{ fontSize: '14px', color: isDarkMode ? '#ffffff' : '#374151', margin: 0 }}>
              Profit Margin: <span style={{ fontWeight: 600 }}>
                ${profitAmount.toFixed(2)}
              </span> ({profitMargin}%)
            </p>
          </div>
        )}
      </div>

      {/* Inventory Tracking (only for inventory items) */}
      {isInventoryType && (
        <div style={{
          backgroundColor: isDarkMode ? '#1f1f1f' : 'white',
          padding: '16px',
          borderRadius: '8px',
          border: `1px solid ${isDarkMode ? '#3a3a3a' : '#e5e7eb'}`
        }}>
          <h3 style={{
            fontSize: '18px',
            fontWeight: 600,
            color: isDarkMode ? '#ffffff' : '#111827',
            marginBottom: '16px'
          }}>
            Inventory Tracking
          </h3>
          
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px' }}>
            <FormField>
              <FormLabel isDarkMode={isDarkMode}>Quantity on Hand</FormLabel>
              <input
                name="quantity_on_hand"
                type="number"
                step="0.01"
                value={formData.quantity_on_hand || 0}
                onChange={handleChange}
                placeholder="0"
                style={{ ...inputBaseStyle(isDarkMode, themeColorRgb), textAlign: 'right' }}
                {...getInputFocusHandlers(themeColorRgb, isDarkMode)}
              />
            </FormField>

            <FormField>
              <FormLabel isDarkMode={isDarkMode}>Reorder Point</FormLabel>
              <input
                name="reorder_point"
                type="number"
                step="0.01"
                value={formData.reorder_point || 0}
                onChange={handleChange}
                placeholder="0"
                style={{ ...inputBaseStyle(isDarkMode, themeColorRgb), textAlign: 'right' }}
                {...getInputFocusHandlers(themeColorRgb, isDarkMode)}
              />
            </FormField>

            <FormField>
              <FormLabel isDarkMode={isDarkMode}>Reorder Quantity</FormLabel>
              <input
                name="reorder_quantity"
                type="number"
                step="0.01"
                value={formData.reorder_quantity || 0}
                onChange={handleChange}
                placeholder="0"
                style={{ ...inputBaseStyle(isDarkMode, themeColorRgb), textAlign: 'right' }}
                {...getInputFocusHandlers(themeColorRgb, isDarkMode)}
              />
            </FormField>
          </div>

          <div style={{ marginTop: '16px' }}>
            <FormField>
              <FormLabel isDarkMode={isDarkMode}>Cost Method</FormLabel>
              <CustomDropdown
                name="cost_method"
                value={formData.cost_method || 'Average'}
                onChange={handleChange}
                options={costMethodOptions}
                placeholder="Select cost method"
                isDarkMode={isDarkMode}
                themeColorRgb={themeColorRgb}
                compactTrigger
              />
            </FormField>
            <p style={{
              fontSize: '12px',
              color: isDarkMode ? '#9ca3af' : '#6b7280',
              marginTop: '4px'
            }}>
              {formData.cost_method === 'Average' && 'Uses weighted average of all purchases'}
              {formData.cost_method === 'FIFO' && 'First In, First Out - uses oldest costs first'}
              {formData.cost_method === 'LIFO' && 'Last In, First Out - uses newest costs first'}
            </p>
          </div>

          {formData.quantity_on_hand !== undefined && formData.reorder_point !== undefined && 
           formData.quantity_on_hand <= formData.reorder_point && formData.reorder_point > 0 && (
            <div style={{
              marginTop: '12px',
              backgroundColor: isDarkMode ? '#4a1f1f' : '#fef9c3',
              border: `1px solid ${isDarkMode ? '#7f1d1d' : '#fde047'}`,
              borderRadius: '6px',
              padding: '12px'
            }}>
              <p style={{
                fontSize: '14px',
                color: isDarkMode ? '#fca5a5' : '#a16207',
                fontWeight: 600,
                margin: 0
              }}>
                ⚠️ Low Stock Alert: Current quantity is at or below reorder point
              </p>
            </div>
          )}
        </div>
      )}

      {/* Account Assignment */}
      <div style={{
        backgroundColor: isDarkMode ? '#1f1f1f' : 'white',
        padding: '16px',
        borderRadius: '8px',
        border: `1px solid ${isDarkMode ? '#3a3a3a' : '#e5e7eb'}`
      }}>
        <h3 style={{
          fontSize: '18px',
          fontWeight: 600,
          color: isDarkMode ? '#ffffff' : '#111827',
          marginBottom: '16px'
        }}>
          Account Assignment
        </h3>
        
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '16px' }}>
          <FormField>
            <FormLabel isDarkMode={isDarkMode} required>Revenue Account</FormLabel>
            <CustomDropdown
              name="income_account_id"
              value={formData.income_account_id || ''}
              onChange={handleChange}
              options={revenueAccounts.map(acc => ({
                value: acc.id,
                label: `${acc.account_number ? acc.account_number + ' - ' : ''}${acc.account_name}`
              }))}
              placeholder="Select revenue account"
              compactTrigger
              isDarkMode={isDarkMode}
              themeColorRgb={themeColorRgb}
              error={errors.income_account_id}
            />
            {errors.income_account_id && <p style={{ marginTop: '4px', fontSize: '12px', color: '#ef4444' }}>{errors.income_account_id}</p>}
          </FormField>

          <FormField>
            <FormLabel isDarkMode={isDarkMode} required>Expense/COGS Account</FormLabel>
            <CustomDropdown
              name="expense_account_id"
              value={formData.expense_account_id || ''}
              onChange={handleChange}
              options={expenseAccounts.map(acc => ({
                value: acc.id,
                label: `${acc.account_number ? acc.account_number + ' - ' : ''}${acc.account_name}`
              }))}
              placeholder="Select expense account"
              compactTrigger
              isDarkMode={isDarkMode}
              themeColorRgb={themeColorRgb}
              error={errors.expense_account_id}
            />
            {errors.expense_account_id && <p style={{ marginTop: '4px', fontSize: '12px', color: '#ef4444' }}>{errors.expense_account_id}</p>}
          </FormField>

          {isInventoryType && (
            <FormField style={{ gridColumn: '1 / -1' }}>
              <FormLabel isDarkMode={isDarkMode} required>Inventory Asset Account</FormLabel>
              <CustomDropdown
                name="asset_account_id"
                value={formData.asset_account_id || ''}
                onChange={handleChange}
                options={assetAccounts.map(acc => ({
                  value: acc.id,
                  label: `${acc.account_number ? acc.account_number + ' - ' : ''}${acc.account_name}`
                }))}
                placeholder="Select inventory asset account"
                compactTrigger
                isDarkMode={isDarkMode}
                themeColorRgb={themeColorRgb}
                error={errors.asset_account_id}
              />
              {errors.asset_account_id && <p style={{ marginTop: '4px', fontSize: '12px', color: '#ef4444' }}>{errors.asset_account_id}</p>}
            </FormField>
          )}
        </div>
      </div>

      {/* Tax Settings */}
      <div style={{
        backgroundColor: isDarkMode ? '#1f1f1f' : 'white',
        padding: '16px',
        borderRadius: '8px',
        border: `1px solid ${isDarkMode ? '#3a3a3a' : '#e5e7eb'}`
      }}>
        <h3 style={{
          fontSize: '18px',
          fontWeight: 600,
          color: isDarkMode ? '#ffffff' : '#111827',
          marginBottom: '16px'
        }}>
          Tax Settings
        </h3>
        
        <div style={{ marginBottom: '16px' }}>
          <label style={{ display: 'flex', alignItems: 'center', cursor: 'pointer' }}>
            <input
              type="checkbox"
              name="is_taxable"
              checked={formData.is_taxable || false}
              onChange={handleChange}
              style={{
                marginRight: '8px',
                width: '16px',
                height: '16px',
                cursor: 'pointer'
              }}
            />
            <span style={{
              fontSize: '14px',
              fontWeight: 500,
              color: isDarkMode ? '#ffffff' : '#374151'
            }}>
              This item is taxable
            </span>
          </label>
        </div>

        {formData.is_taxable && taxRates.length > 0 && (
          <FormField>
            <FormLabel isDarkMode={isDarkMode}>Default Tax Rate</FormLabel>
            <CustomDropdown
              name="tax_rate_id"
              value={formData.tax_rate_id || ''}
              onChange={handleChange}
              compactTrigger
              options={[
                { value: '', label: 'No default tax rate' },
                ...taxRates.map(rate => ({
                  value: rate.id,
                  label: `${rate.tax_name || 'Tax'} (${rate.tax_rate || 0}%)`
                }))
              ]}
              placeholder="Select tax rate"
              isDarkMode={isDarkMode}
              themeColorRgb={themeColorRgb}
            />
          </FormField>
        )}
      </div>

      {/* Actions */}
      <FormModalActions
        onCancel={onCancel}
        primaryLabel={loading ? 'Saving...' : (item ? 'Update Item' : 'Create Item')}
        primaryDisabled={loading}
        primaryType="submit"
      />
    </form>
  )
}

export default ItemForm
