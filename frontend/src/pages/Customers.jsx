import React, { useState, useEffect, useCallback } from 'react'
import { useToast } from '../contexts/ToastContext'
import { useTheme } from '../contexts/ThemeContext'
import { UserPlus } from 'lucide-react'
import { formLabelStyle, inputBaseStyle, getInputFocusHandlers, FormField, FormLabel } from '../components/FormStyles'

const isDark = () => document.documentElement.classList.contains('dark-theme')

const hexToRgb = (hex) => {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex)
  return result ? `${parseInt(result[1], 16)}, ${parseInt(result[2], 16)}, ${parseInt(result[3], 16)}` : '59, 130, 246'
}

export default function Customers() {
  const { show: showToast } = useToast()
  const { themeColor } = useTheme()
  const themeColorRgb = hexToRgb(themeColor)
  const [customers, setCustomers] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [selected, setSelected] = useState(null)
  const [modal, setModal] = useState(null) // 'view' | 'edit' | 'points'
  const [rewardsDetail, setRewardsDetail] = useState(null)
  const [saving, setSaving] = useState(false)
  const [editForm, setEditForm] = useState({ customer_name: '', email: '', phone: '', address: '' })
  const [pointsForm, setPointsForm] = useState({ points: '', reason: '' })

  const loadCustomers = useCallback(async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/customers')
      const json = await res.json()
      if (json.data && Array.isArray(json.data)) {
        setCustomers(json.data)
      } else if (json.columns && Array.isArray(json.data)) {
        setCustomers(json.data)
      } else {
        setCustomers([])
      }
    } catch (e) {
      console.error(e)
      showToast('Failed to load customers', 'error')
      setCustomers([])
    } finally {
      setLoading(false)
    }
  }, [showToast])

  useEffect(() => {
    loadCustomers()
  }, [loadCustomers])

  const filtered = React.useMemo(() => {
    if (!search.trim()) return customers
    const q = search.toLowerCase().trim()
    return customers.filter(
      (c) =>
        (c.customer_name || '').toLowerCase().includes(q) ||
        (c.email || '').toLowerCase().includes(q) ||
        (c.phone || '').replace(/\D/g, '').includes(q.replace(/\D/g, ''))
    )
  }, [customers, search])

  const openView = async (customer) => {
    setSelected(customer)
    setModal('view')
    setRewardsDetail(null)
    try {
      const res = await fetch(`/api/customers/${customer.customer_id}/rewards`)
      const json = await res.json()
      if (json.success && json.data) setRewardsDetail(json.data)
    } catch (_) {}
  }

  const openEdit = (customer) => {
    setSelected(customer)
    setEditForm({
      customer_name: customer.customer_name || '',
      email: customer.email || '',
      phone: customer.phone || '',
      address: customer.address || ''
    })
    setModal('edit')
  }

  const openPoints = (customer) => {
    setSelected(customer)
    setPointsForm({ points: '', reason: '' })
    setModal('points')
  }

  const closeModal = () => {
    setModal(null)
    setSelected(null)
    setRewardsDetail(null)
  }

  const handleSaveEdit = async () => {
    if (!selected) return
    setSaving(true)
    try {
      const res = await fetch(`/api/customers/${selected.customer_id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(editForm)
      })
      const json = await res.json()
      if (json.success) {
        showToast('Customer updated', 'success')
        closeModal()
        loadCustomers()
      } else {
        showToast(json.message || 'Update failed', 'error')
      }
    } catch (e) {
      showToast('Failed to update customer', 'error')
    } finally {
      setSaving(false)
    }
  }

  const handleAddPoints = async () => {
    if (!selected) return
    const points = parseInt(pointsForm.points, 10)
    if (Number.isNaN(points) || points === 0) {
      showToast('Enter a valid points amount (positive or negative)', 'warning')
      return
    }
    setSaving(true)
    try {
      const res = await fetch(`/api/customers/${selected.customer_id}/points`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ points, reason: pointsForm.reason || undefined })
      })
      const json = await res.json()
      if (json.success) {
        showToast(
          points > 0
            ? `Added ${points} points. New balance: ${json.data?.loyalty_points ?? '—'}`
            : `Adjusted points. New balance: ${json.data?.loyalty_points ?? '—'}`,
          'success'
        )
        closeModal()
        loadCustomers()
      } else {
        showToast(json.message || 'Failed to update points', 'error')
      }
    } catch (e) {
      showToast('Failed to update points', 'error')
    } finally {
      setSaving(false)
    }
  }

  const handleCreate = async () => {
    const name = (editForm.customer_name || '').trim()
    if (!name) {
      showToast('Customer name is required', 'warning')
      return
    }
    setSaving(true)
    try {
      const res = await fetch('/api/customers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          customer_name: editForm.customer_name,
          email: editForm.email || undefined,
          phone: editForm.phone || undefined,
          address: editForm.address || undefined
        })
      })
      const json = await res.json()
      if (json.success) {
        showToast('Customer created', 'success')
        setModal(null)
        setEditForm({ customer_name: '', email: '', phone: '', address: '' })
        loadCustomers()
      } else {
        showToast(json.message || 'Create failed', 'error')
      }
    } catch (e) {
      showToast('Failed to create customer', 'error')
    } finally {
      setSaving(false)
    }
  }

  const dark = isDark()
  const modalOverlay = {
    position: 'fixed',
    inset: 0,
    backgroundColor: 'rgba(0,0,0,0.5)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 1000
  }
  const modalBox = {
    backgroundColor: '#fff',
    borderRadius: '8px',
    padding: '24px',
    maxWidth: '560px',
    width: '90%',
    maxHeight: '90vh',
    overflow: 'auto',
    boxShadow: '0 4px 20px rgba(0,0,0,0.3)'
  }

  return (
    <div style={{ padding: '40px', maxWidth: '1400px', margin: '0 auto', backgroundColor: '#ffffff', minHeight: '100vh' }}>
      <div style={{ marginBottom: '20px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
          <div style={{ position: 'relative', flex: 1, minWidth: '200px', display: 'flex', alignItems: 'center' }}>
            <input
              type="text"
              placeholder="Search by name, email, or phone..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              style={{
                flex: 1,
                padding: '8px 0',
                border: 'none',
                borderBottom: '2px solid #ddd',
                borderRadius: 0,
                backgroundColor: 'transparent',
                outline: 'none',
                fontSize: '14px',
                boxSizing: 'border-box',
                fontFamily: '"Product Sans", sans-serif',
                color: '#333'
              }}
            />
          </div>
          <button
            type="button"
            onClick={() => {
              setEditForm({ customer_name: '', email: '', phone: '', address: '' })
              setSelected(null)
              setModal('edit')
            }}
            title="Add customer"
            style={{
              padding: '4px',
              width: '40px',
              height: '40px',
              backgroundColor: `rgba(${themeColorRgb}, 0.7)`,
              backdropFilter: 'blur(10px)',
              WebkitBackdropFilter: 'blur(10px)',
              color: '#fff',
              border: '1px solid rgba(255, 255, 255, 0.2)',
              borderRadius: '8px',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0,
              boxShadow: `0 4px 15px rgba(${themeColorRgb}, 0.3), inset 0 1px 0 rgba(255, 255, 255, 0.2)`,
              transition: 'all 0.3s ease'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = `rgba(${themeColorRgb}, 0.8)`
              e.currentTarget.style.boxShadow = `0 4px 20px rgba(${themeColorRgb}, 0.4), inset 0 1px 0 rgba(255, 255, 255, 0.2)`
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = `rgba(${themeColorRgb}, 0.7)`
              e.currentTarget.style.boxShadow = `0 4px 15px rgba(${themeColorRgb}, 0.3), inset 0 1px 0 rgba(255, 255, 255, 0.2)`
            }}
          >
            <UserPlus size={18} />
          </button>
        </div>
      </div>

      <div style={{ backgroundColor: '#fff', borderRadius: '4px', overflowX: 'auto', overflowY: 'visible', boxShadow: '0 1px 3px rgba(0,0,0,0.1)', width: '100%' }}>
        {loading ? (
          <div style={{ padding: '48px', textAlign: 'center', color: '#6b7280' }}>
            Loading customers...
          </div>
        ) : filtered.length === 0 ? (
          <div style={{ padding: '48px', textAlign: 'center', color: '#6b7280' }}>
            {customers.length === 0 ? 'No customers yet. Add one to get started.' : 'No customers match your search.'}
          </div>
        ) : (
          <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: 'max-content' }}>
            <thead>
              <tr style={{ backgroundColor: '#f8f9fa' }}>
                <th style={{ padding: '12px', textAlign: 'left', fontWeight: 600, borderBottom: '2px solid #dee2e6', color: '#495057', fontSize: '13px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Name</th>
                <th style={{ padding: '12px', textAlign: 'left', fontWeight: 600, borderBottom: '2px solid #dee2e6', color: '#495057', fontSize: '13px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Email</th>
                <th style={{ padding: '12px', textAlign: 'left', fontWeight: 600, borderBottom: '2px solid #dee2e6', color: '#495057', fontSize: '13px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Phone</th>
                <th style={{ padding: '12px', textAlign: 'right', fontWeight: 600, borderBottom: '2px solid #dee2e6', color: '#495057', fontSize: '13px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Points</th>
                <th style={{ padding: '12px', textAlign: 'right', fontWeight: 600, borderBottom: '2px solid #dee2e6', color: '#495057', fontSize: '13px', textTransform: 'uppercase', letterSpacing: '0.5px', width: '200px' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((c, idx) => (
                <tr
                  key={c.customer_id}
                  style={{ backgroundColor: idx % 2 === 0 ? '#fff' : '#fafafa' }}
                >
                  <td style={{ padding: '8px 12px', borderBottom: '1px solid #eee', fontSize: '14px', color: '#333' }}>{c.customer_name || '—'}</td>
                  <td style={{ padding: '8px 12px', borderBottom: '1px solid #eee', fontSize: '14px', color: '#333' }}>{c.email || '—'}</td>
                  <td style={{ padding: '8px 12px', borderBottom: '1px solid #eee', fontSize: '14px', color: '#333' }}>{c.phone || '—'}</td>
                  <td style={{ padding: '8px 12px', borderBottom: '1px solid #eee', fontSize: '14px', color: '#333', textAlign: 'right', fontWeight: 600 }}>
                    {c.loyalty_points != null ? Number(c.loyalty_points) : 0}
                  </td>
                  <td style={{ padding: '8px 12px', borderBottom: '1px solid #eee', fontSize: '14px', textAlign: 'right' }}>
                    <button
                      type="button"
                      onClick={() => openView(c)}
                      style={{ marginRight: '8px', background: 'none', border: 'none', color: '#6366f1', cursor: 'pointer', fontSize: '13px', fontWeight: 500 }}
                    >
                      View
                    </button>
                    <button
                      type="button"
                      onClick={() => openEdit(c)}
                      style={{ marginRight: '8px', background: 'none', border: 'none', color: '#2563eb', cursor: 'pointer', fontSize: '13px', fontWeight: 500 }}
                    >
                      Edit
                    </button>
                    <button
                      type="button"
                      onClick={() => openPoints(c)}
                      style={{ background: 'none', border: 'none', color: '#059669', cursor: 'pointer', fontSize: '13px', fontWeight: 500 }}
                    >
                      Give points / coupon
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* View modal */}
      {modal === 'view' && selected && (
        <div style={modalOverlay} onClick={closeModal}>
          <div style={modalBox} onClick={(e) => e.stopPropagation()}>
            <div style={{ marginBottom: '20px' }}>
              <h3 style={{ margin: 0, fontSize: '18px', fontFamily: '"Product Sans", sans-serif', color: '#333' }}>
                {selected.customer_name || 'Customer'}
              </h3>
            </div>
            <div style={{ display: 'grid', gap: '12px', marginBottom: '20px' }}>
              <FormField>
                <FormLabel isDarkMode={dark}>Email</FormLabel>
                <div style={{ fontSize: '14px', color: '#333' }}>{selected.email || '—'}</div>
              </FormField>
              <FormField>
                <FormLabel isDarkMode={dark}>Phone</FormLabel>
                <div style={{ fontSize: '14px', color: '#333' }}>{selected.phone || '—'}</div>
              </FormField>
              <FormField>
                <FormLabel isDarkMode={dark}>Loyalty points</FormLabel>
                <div style={{ fontSize: '14px', fontWeight: 700, color: '#333' }}>{selected.loyalty_points != null ? Number(selected.loyalty_points) : 0}</div>
              </FormField>
              {rewardsDetail && (
                <>
                  <FormField>
                    <FormLabel isDarkMode={dark}>Orders</FormLabel>
                    <div style={{ fontSize: '14px', color: '#333' }}>{rewardsDetail.order_count ?? 0}</div>
                  </FormField>
                  <FormField>
                    <FormLabel isDarkMode={dark}>Total spent</FormLabel>
                    <div style={{ fontSize: '14px', color: '#333' }}>${Number(rewardsDetail.total_spent || 0).toFixed(2)}</div>
                  </FormField>
                  {rewardsDetail.popular_items && rewardsDetail.popular_items.length > 0 && (
                    <FormField>
                      <FormLabel isDarkMode={dark}>Popular items</FormLabel>
                      <ul style={{ margin: '4px 0 0', paddingLeft: '20px', fontSize: '14px', color: '#333' }}>
                        {rewardsDetail.popular_items.slice(0, 5).map((item, i) => (
                          <li key={i}>{item.product_name || item.product_id} (×{item.qty})</li>
                        ))}
                      </ul>
                    </FormField>
                  )}
                </>
              )}
              {selected.address && (
                <FormField>
                  <FormLabel isDarkMode={dark}>Address</FormLabel>
                  <div style={{ fontSize: '14px', color: '#333' }}>{selected.address}</div>
                </FormField>
              )}
            </div>
            <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end', marginTop: '24px' }}>
              <button
                type="button"
                onClick={closeModal}
                style={{
                  padding: '4px 16px',
                  height: '28px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  whiteSpace: 'nowrap',
                  backgroundColor: 'var(--bg-tertiary)',
                  border: `1px solid ${dark ? 'var(--border-light, #333)' : '#ddd'}`,
                  borderRadius: '8px',
                  fontSize: '14px',
                  fontWeight: 500,
                  color: 'var(--text-secondary)',
                  cursor: 'pointer',
                  transition: 'all 0.3s ease',
                  boxShadow: 'none'
                }}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Edit modal (create or update) */}
      {modal === 'edit' && (
        <div style={modalOverlay} onClick={() => !saving && closeModal()}>
          <div style={modalBox} onClick={(e) => e.stopPropagation()}>
            <div style={{ marginBottom: '20px' }}>
              <h3 style={{ margin: 0, fontSize: '18px', fontFamily: '"Product Sans", sans-serif', color: '#333' }}>
                {selected ? 'Edit customer' : 'New customer'}
              </h3>
            </div>
            <div style={{ marginBottom: '20px' }}>
              <FormField>
                <FormLabel isDarkMode={dark} required>Name</FormLabel>
                <input
                  type="text"
                  value={editForm.customer_name}
                  onChange={(e) => setEditForm((f) => ({ ...f, customer_name: e.target.value }))}
                  placeholder="Customer name"
                  style={inputBaseStyle(dark, themeColorRgb)}
                  {...getInputFocusHandlers(themeColorRgb, dark)}
                />
              </FormField>
              <FormField>
                <FormLabel isDarkMode={dark}>Email</FormLabel>
                <input
                  type="email"
                  value={editForm.email}
                  onChange={(e) => setEditForm((f) => ({ ...f, email: e.target.value }))}
                  placeholder="email@example.com"
                  style={inputBaseStyle(dark, themeColorRgb)}
                  {...getInputFocusHandlers(themeColorRgb, dark)}
                />
              </FormField>
              <FormField>
                <FormLabel isDarkMode={dark}>Phone</FormLabel>
                <input
                  type="tel"
                  value={editForm.phone}
                  onChange={(e) => setEditForm((f) => ({ ...f, phone: e.target.value }))}
                  placeholder="555-0000"
                  style={inputBaseStyle(dark, themeColorRgb)}
                  {...getInputFocusHandlers(themeColorRgb, dark)}
                />
              </FormField>
              <FormField>
                <FormLabel isDarkMode={dark}>Address</FormLabel>
                <input
                  type="text"
                  value={editForm.address}
                  onChange={(e) => setEditForm((f) => ({ ...f, address: e.target.value }))}
                  placeholder="Street, city, state"
                  style={inputBaseStyle(dark, themeColorRgb)}
                  {...getInputFocusHandlers(themeColorRgb, dark)}
                />
              </FormField>
            </div>
            <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end', marginTop: '24px' }}>
              <button
                type="button"
                onClick={() => !saving && closeModal()}
                disabled={saving}
                style={{
                  padding: '4px 16px',
                  height: '28px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  whiteSpace: 'nowrap',
                  backgroundColor: 'var(--bg-tertiary)',
                  border: `1px solid ${dark ? 'var(--border-light, #333)' : '#ddd'}`,
                  borderRadius: '8px',
                  fontSize: '14px',
                  fontWeight: 500,
                  color: 'var(--text-secondary)',
                  cursor: saving ? 'not-allowed' : 'pointer',
                  transition: 'all 0.3s ease',
                  boxShadow: 'none'
                }}
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={selected ? handleSaveEdit : handleCreate}
                disabled={saving}
                style={{
                  padding: '4px 16px',
                  height: '28px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  whiteSpace: 'nowrap',
                  backgroundColor: `rgba(${themeColorRgb}, 0.7)`,
                  border: `1px solid rgba(${themeColorRgb}, 0.5)`,
                  borderRadius: '8px',
                  fontSize: '14px',
                  fontWeight: 600,
                  color: '#fff',
                  cursor: saving ? 'not-allowed' : 'pointer',
                  transition: 'all 0.3s ease',
                  boxShadow: `0 4px 15px rgba(${themeColorRgb}, 0.3)`
                }}
              >
                {saving ? 'Saving...' : selected ? 'Save' : 'Create'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Add points / coupon modal */}
      {modal === 'points' && selected && (
        <div style={modalOverlay} onClick={() => !saving && closeModal()}>
          <div style={modalBox} onClick={(e) => e.stopPropagation()}>
            <div style={{ marginBottom: '20px' }}>
              <h3 style={{ margin: 0, fontSize: '18px', fontFamily: '"Product Sans", sans-serif', color: '#333' }}>
                Give points / coupon — {selected.customer_name || 'Customer'}
              </h3>
            </div>
            <p style={{ margin: '0 0 16px', fontSize: '14px', color: '#666' }}>
              Current balance: <strong>{selected.loyalty_points != null ? Number(selected.loyalty_points) : 0}</strong> points
            </p>
            <div style={{ marginBottom: '20px' }}>
              <FormField>
                <FormLabel isDarkMode={dark} required>Points to add (or negative to subtract)</FormLabel>
                <input
                  type="number"
                  value={pointsForm.points}
                  onChange={(e) => setPointsForm((f) => ({ ...f, points: e.target.value }))}
                  placeholder="e.g. 100 or -50"
                  style={inputBaseStyle(dark, themeColorRgb)}
                  {...getInputFocusHandlers(themeColorRgb, dark)}
                />
              </FormField>
              <FormField>
                <FormLabel isDarkMode={dark}>Reason (optional)</FormLabel>
                <input
                  type="text"
                  value={pointsForm.reason}
                  onChange={(e) => setPointsForm((f) => ({ ...f, reason: e.target.value }))}
                  placeholder="e.g. Birthday coupon, Manual adjustment"
                  style={inputBaseStyle(dark, themeColorRgb)}
                  {...getInputFocusHandlers(themeColorRgb, dark)}
                />
              </FormField>
            </div>
            <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end', marginTop: '24px' }}>
              <button
                type="button"
                onClick={() => !saving && closeModal()}
                disabled={saving}
                style={{
                  padding: '4px 16px',
                  height: '28px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  whiteSpace: 'nowrap',
                  backgroundColor: 'var(--bg-tertiary)',
                  border: `1px solid ${dark ? 'var(--border-light, #333)' : '#ddd'}`,
                  borderRadius: '8px',
                  fontSize: '14px',
                  fontWeight: 500,
                  color: 'var(--text-secondary)',
                  cursor: saving ? 'not-allowed' : 'pointer',
                  transition: 'all 0.3s ease',
                  boxShadow: 'none'
                }}
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleAddPoints}
                disabled={saving}
                style={{
                  padding: '4px 16px',
                  height: '28px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  whiteSpace: 'nowrap',
                  backgroundColor: `rgba(${themeColorRgb}, 0.7)`,
                  border: `1px solid rgba(${themeColorRgb}, 0.5)`,
                  borderRadius: '8px',
                  fontSize: '14px',
                  fontWeight: 600,
                  color: '#fff',
                  cursor: saving ? 'not-allowed' : 'pointer',
                  transition: 'all 0.3s ease',
                  boxShadow: `0 4px 15px rgba(${themeColorRgb}, 0.3)`
                }}
              >
                {saving ? 'Updating...' : 'Apply'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
