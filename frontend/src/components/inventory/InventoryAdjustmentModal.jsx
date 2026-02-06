import React, { useState } from 'react'
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

function InventoryAdjustmentModal({
  item,
  onSubmit,
  onCancel
}) {
  const { themeColor } = useTheme()
  const themeColorRgb = hexToRgb(themeColor || '#8400ff')
  const isDarkMode = document.documentElement.classList.contains('dark-theme')

  const [formData, setFormData] = useState({
    item_id: item.id,
    adjustment_type: 'increase',
    quantity: 0,
    reason: '',
    unit_cost: item.average_cost || 0
  })

  const [errors, setErrors] = useState({})
  const [loading, setLoading] = useState(false)

  const handleChange = (e) => {
    const { name, value } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: name === 'quantity' || name === 'unit_cost' ? parseFloat(value) || 0 : value
    }))

    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }))
    }
  }

  const validate = () => {
    const newErrors = {}

    if (formData.quantity <= 0) {
      newErrors.quantity = 'Quantity must be greater than 0'
    }

    if (formData.adjustment_type === 'decrease' && formData.quantity > item.quantity_on_hand) {
      newErrors.quantity = `Cannot decrease by ${formData.quantity}. Current quantity: ${item.quantity_on_hand}`
    }

    if (!formData.reason.trim()) {
      newErrors.reason = 'Reason is required'
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

  const adjustmentTypeOptions = [
    { value: 'increase', label: 'Increase (Add Stock)' },
    { value: 'decrease', label: 'Decrease (Remove Stock)' }
  ]

  const newQuantity = formData.adjustment_type === 'increase' 
    ? item.quantity_on_hand + formData.quantity
    : item.quantity_on_hand - formData.quantity

  return (
    <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
      <div style={{
        backgroundColor: isDarkMode ? '#1e3a5f' : '#dbeafe',
        padding: '16px',
        borderRadius: '8px'
      }}>
        <h4 style={{
          fontWeight: 600,
          color: isDarkMode ? '#ffffff' : '#111827',
          margin: 0,
          marginBottom: '8px'
        }}>
          {item.item_name}
        </h4>
        <p style={{
          fontSize: '14px',
          color: isDarkMode ? '#d1d5db' : '#374151',
          margin: 0
        }}>
          Current Quantity: <span style={{ fontWeight: 600 }}>{item.quantity_on_hand.toFixed(2)}</span> {item.unit_of_measure}
        </p>
      </div>

      <FormField>
        <FormLabel isDarkMode={isDarkMode} required>Adjustment Type</FormLabel>
        <CustomDropdown
          name="adjustment_type"
          value={formData.adjustment_type}
          onChange={handleChange}
          options={adjustmentTypeOptions}
          placeholder="Select adjustment type"
          isDarkMode={isDarkMode}
          themeColorRgb={themeColorRgb}
        />
      </FormField>

      <FormField>
        <FormLabel isDarkMode={isDarkMode} required>Quantity to Adjust</FormLabel>
        <input
          name="quantity"
          type="number"
          step="0.01"
          value={formData.quantity || ''}
          onChange={handleChange}
          placeholder="0"
          style={inputBaseStyle(isDarkMode, themeColorRgb)}
          {...getInputFocusHandlers(themeColorRgb, isDarkMode)}
        />
        {errors.quantity && <p style={{ marginTop: '4px', fontSize: '12px', color: '#ef4444' }}>{errors.quantity}</p>}
      </FormField>

      {formData.adjustment_type === 'increase' && (
        <FormField>
          <FormLabel isDarkMode={isDarkMode}>Unit Cost (for valuation)</FormLabel>
          <input
            name="unit_cost"
            type="number"
            step="0.01"
            value={formData.unit_cost || 0}
            onChange={handleChange}
            placeholder="0.00"
            style={inputBaseStyle(isDarkMode, themeColorRgb)}
            {...getInputFocusHandlers(themeColorRgb, isDarkMode)}
          />
        </FormField>
      )}

      <FormField>
        <FormLabel isDarkMode={isDarkMode} required>Reason</FormLabel>
        <textarea
          name="reason"
          value={formData.reason}
          onChange={handleChange}
          rows={3}
          placeholder="Physical count, damage, theft, found stock, etc."
          style={{
            ...inputBaseStyle(isDarkMode, themeColorRgb),
            fontFamily: 'inherit',
            resize: 'vertical',
            ...(errors.reason && { border: '1px solid #ef4444' })
          }}
          {...getInputFocusHandlers(themeColorRgb, isDarkMode)}
        />
        {errors.reason && (
          <p style={{ marginTop: '4px', fontSize: '12px', color: '#ef4444' }}>{errors.reason}</p>
        )}
      </FormField>

      <div style={{
        backgroundColor: isDarkMode ? '#2a2a2a' : '#f9fafb',
        padding: '16px',
        borderRadius: '8px'
      }}>
        <p style={{
          fontSize: '14px',
          color: isDarkMode ? '#ffffff' : '#374151',
          margin: 0
        }}>
          New Quantity After Adjustment:{' '}
          <span style={{
            marginLeft: '8px',
            fontWeight: 700,
            fontSize: '18px',
            color: newQuantity < 0 ? '#dc2626' : '#16a34a'
          }}>
            {newQuantity.toFixed(2)}
          </span> {item.unit_of_measure}
        </p>
      </div>

      <FormModalActions
        onCancel={onCancel}
        primaryLabel={loading ? 'Adjusting...' : 'Record Adjustment'}
        primaryDisabled={loading}
        primaryType="submit"
      />
    </form>
  )
}

export default InventoryAdjustmentModal
