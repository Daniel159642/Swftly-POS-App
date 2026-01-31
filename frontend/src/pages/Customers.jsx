import React, { useState, useEffect, useCallback } from 'react'
import { useToast } from '../contexts/ToastContext'

const isDark = () => document.documentElement.classList.contains('dark-theme')

const tableCell = (dark) => ({
  padding: '12px 16px',
  fontSize: '14px',
  borderBottom: `1px solid ${dark ? '#3a3a3a' : '#e5e7eb'}`,
  color: dark ? '#e5e7eb' : '#374151'
})
const tableTh = (dark) => ({
  ...tableCell(dark),
  textAlign: 'left',
  fontWeight: 600,
  color: dark ? '#9ca3af' : '#6b7280',
  fontSize: '12px',
  textTransform: 'uppercase',
  backgroundColor: dark ? '#1f1f1f' : '#f9fafb'
})

export default function Customers() {
  const { show: showToast } = useToast()
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
  const inputStyle = {
    width: '100%',
    padding: '8px 12px',
    border: `1px solid ${dark ? '#3a3a3a' : '#d1d5db'}`,
    borderRadius: '8px',
    backgroundColor: dark ? '#1f1f1f' : '#fff',
    color: dark ? '#fff' : '#111',
    fontSize: '14px'
  }
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
    backgroundColor: dark ? '#1a1a1a' : '#fff',
    borderRadius: '12px',
    boxShadow: '0 20px 60px rgba(0,0,0,0.3)',
    maxWidth: '560px',
    width: '90%',
    maxHeight: '90vh',
    overflow: 'auto',
    padding: '24px'
  }

  return (
    <div style={{ padding: '24px 32px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px', marginBottom: '24px' }}>
        <h1 style={{ margin: 0, fontSize: '24px', fontWeight: 700, color: dark ? '#fff' : '#111' }}>
          Customers
        </h1>
        <div style={{ display: 'flex', gap: '12px', alignItems: 'center', flexWrap: 'wrap' }}>
          <input
            type="text"
            placeholder="Search by name, email, or phone..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            style={{
              ...inputStyle,
              minWidth: '220px',
              maxWidth: '320px'
            }}
          />
          <button
            type="button"
            onClick={() => {
              setEditForm({ customer_name: '', email: '', phone: '', address: '' })
              setSelected(null)
              setModal('edit')
            }}
            style={{
              padding: '10px 20px',
              borderRadius: '8px',
              border: 'none',
              backgroundColor: dark ? '#3b82f6' : '#2563eb',
              color: '#fff',
              fontWeight: 600,
              cursor: 'pointer',
              fontSize: '14px'
            }}
          >
            Add customer
          </button>
        </div>
      </div>

      <div style={{ backgroundColor: dark ? '#1f1f1f' : '#fff', borderRadius: '12px', border: `1px solid ${dark ? '#3a3a3a' : '#e5e7eb'}`, overflow: 'hidden' }}>
        {loading ? (
          <div style={{ padding: '48px', textAlign: 'center', color: dark ? '#9ca3af' : '#6b7280' }}>
            Loading customers...
          </div>
        ) : filtered.length === 0 ? (
          <div style={{ padding: '48px', textAlign: 'center', color: dark ? '#9ca3af' : '#6b7280' }}>
            {customers.length === 0 ? 'No customers yet. Add one to get started.' : 'No customers match your search.'}
          </div>
        ) : (
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr>
                <th style={tableTh(dark)}>Name</th>
                <th style={tableTh(dark)}>Email</th>
                <th style={tableTh(dark)}>Phone</th>
                <th style={{ ...tableTh(dark), textAlign: 'right' }}>Points</th>
                <th style={{ ...tableTh(dark), textAlign: 'right', width: '200px' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((c) => (
                <tr
                  key={c.customer_id}
                  style={{ backgroundColor: dark ? '#252525' : '#fff' }}
                >
                  <td style={tableCell(dark)}>{c.customer_name || '—'}</td>
                  <td style={tableCell(dark)}>{c.email || '—'}</td>
                  <td style={tableCell(dark)}>{c.phone || '—'}</td>
                  <td style={{ ...tableCell(dark), textAlign: 'right', fontWeight: 600 }}>
                    {c.loyalty_points != null ? Number(c.loyalty_points) : 0}
                  </td>
                  <td style={{ ...tableCell(dark), textAlign: 'right' }}>
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
            <h2 style={{ margin: '0 0 16px', fontSize: '18px', color: dark ? '#fff' : '#111' }}>
              {selected.customer_name || 'Customer'}
            </h2>
            <div style={{ display: 'grid', gap: '12px', marginBottom: '20px' }}>
              <div><span style={{ color: dark ? '#9ca3af' : '#6b7280', fontSize: '12px' }}>Email</span><div style={{ color: dark ? '#e5e7eb' : '#111' }}>{selected.email || '—'}</div></div>
              <div><span style={{ color: dark ? '#9ca3af' : '#6b7280', fontSize: '12px' }}>Phone</span><div style={{ color: dark ? '#e5e7eb' : '#111' }}>{selected.phone || '—'}</div></div>
              <div><span style={{ color: dark ? '#9ca3af' : '#6b7280', fontSize: '12px' }}>Loyalty points</span><div style={{ fontWeight: 700, color: dark ? '#e5e7eb' : '#111' }}>{selected.loyalty_points != null ? Number(selected.loyalty_points) : 0}</div></div>
              {rewardsDetail && (
                <>
                  <div><span style={{ color: dark ? '#9ca3af' : '#6b7280', fontSize: '12px' }}>Orders</span><div style={{ color: dark ? '#e5e7eb' : '#111' }}>{rewardsDetail.order_count ?? 0}</div></div>
                  <div><span style={{ color: dark ? '#9ca3af' : '#6b7280', fontSize: '12px' }}>Total spent</span><div style={{ color: dark ? '#e5e7eb' : '#111' }}>${Number(rewardsDetail.total_spent || 0).toFixed(2)}</div></div>
                  {rewardsDetail.popular_items && rewardsDetail.popular_items.length > 0 && (
                    <div>
                      <span style={{ color: dark ? '#9ca3af' : '#6b7280', fontSize: '12px' }}>Popular items</span>
                      <ul style={{ margin: '4px 0 0', paddingLeft: '20px', color: dark ? '#e5e7eb' : '#111' }}>
                        {rewardsDetail.popular_items.slice(0, 5).map((item, i) => (
                          <li key={i}>{item.product_name || item.product_id} (×{item.qty})</li>
                        ))}
                      </ul>
                    </div>
                  )}
                </>
              )}
              {selected.address && <div><span style={{ color: dark ? '#9ca3af' : '#6b7280', fontSize: '12px' }}>Address</span><div style={{ color: dark ? '#e5e7eb' : '#111' }}>{selected.address}</div></div>}
            </div>
            <button type="button" onClick={closeModal} style={{ padding: '8px 16px', borderRadius: '8px', border: `1px solid ${dark ? '#404040' : '#d1d5db'}`, background: 'none', color: dark ? '#e5e7eb' : '#374151', cursor: 'pointer', fontSize: '14px' }}>
              Close
            </button>
          </div>
        </div>
      )}

      {/* Edit modal (create or update) */}
      {modal === 'edit' && (
        <div style={modalOverlay} onClick={() => !saving && closeModal()}>
          <div style={modalBox} onClick={(e) => e.stopPropagation()}>
            <h2 style={{ margin: '0 0 20px', fontSize: '18px', color: dark ? '#fff' : '#111' }}>
              {selected ? 'Edit customer' : 'New customer'}
            </h2>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginBottom: '20px' }}>
              <div>
                <label style={{ display: 'block', marginBottom: '4px', fontSize: '12px', color: dark ? '#9ca3af' : '#6b7280' }}>Name *</label>
                <input
                  type="text"
                  value={editForm.customer_name}
                  onChange={(e) => setEditForm((f) => ({ ...f, customer_name: e.target.value }))}
                  placeholder="Customer name"
                  style={inputStyle}
                />
              </div>
              <div>
                <label style={{ display: 'block', marginBottom: '4px', fontSize: '12px', color: dark ? '#9ca3af' : '#6b7280' }}>Email</label>
                <input
                  type="email"
                  value={editForm.email}
                  onChange={(e) => setEditForm((f) => ({ ...f, email: e.target.value }))}
                  placeholder="email@example.com"
                  style={inputStyle}
                />
              </div>
              <div>
                <label style={{ display: 'block', marginBottom: '4px', fontSize: '12px', color: dark ? '#9ca3af' : '#6b7280' }}>Phone</label>
                <input
                  type="tel"
                  value={editForm.phone}
                  onChange={(e) => setEditForm((f) => ({ ...f, phone: e.target.value }))}
                  placeholder="555-0000"
                  style={inputStyle}
                />
              </div>
              <div>
                <label style={{ display: 'block', marginBottom: '4px', fontSize: '12px', color: dark ? '#9ca3af' : '#6b7280' }}>Address</label>
                <input
                  type="text"
                  value={editForm.address}
                  onChange={(e) => setEditForm((f) => ({ ...f, address: e.target.value }))}
                  placeholder="Street, city, state"
                  style={inputStyle}
                />
              </div>
            </div>
            <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
              <button type="button" onClick={() => !saving && closeModal()} disabled={saving} style={{ padding: '8px 16px', borderRadius: '8px', border: `1px solid ${dark ? '#404040' : '#d1d5db'}`, background: 'none', color: dark ? '#e5e7eb' : '#374151', cursor: saving ? 'not-allowed' : 'pointer', fontSize: '14px' }}>
                Cancel
              </button>
              <button
                type="button"
                onClick={selected ? handleSaveEdit : handleCreate}
                disabled={saving}
                style={{ padding: '8px 20px', borderRadius: '8px', border: 'none', backgroundColor: '#2563eb', color: '#fff', fontWeight: 600, cursor: saving ? 'not-allowed' : 'pointer', fontSize: '14px' }}
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
            <h2 style={{ margin: '0 0 20px', fontSize: '18px', color: dark ? '#fff' : '#111' }}>
              Give points / coupon — {selected.customer_name || 'Customer'}
            </h2>
            <p style={{ margin: '0 0 16px', fontSize: '14px', color: dark ? '#9ca3af' : '#6b7280' }}>
              Current balance: <strong>{selected.loyalty_points != null ? Number(selected.loyalty_points) : 0}</strong> points
            </p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginBottom: '20px' }}>
              <div>
                <label style={{ display: 'block', marginBottom: '4px', fontSize: '12px', color: dark ? '#9ca3af' : '#6b7280' }}>Points to add (or negative to subtract) *</label>
                <input
                  type="number"
                  value={pointsForm.points}
                  onChange={(e) => setPointsForm((f) => ({ ...f, points: e.target.value }))}
                  placeholder="e.g. 100 or -50"
                  style={inputStyle}
                />
              </div>
              <div>
                <label style={{ display: 'block', marginBottom: '4px', fontSize: '12px', color: dark ? '#9ca3af' : '#6b7280' }}>Reason (optional)</label>
                <input
                  type="text"
                  value={pointsForm.reason}
                  onChange={(e) => setPointsForm((f) => ({ ...f, reason: e.target.value }))}
                  placeholder="e.g. Birthday coupon, Manual adjustment"
                  style={inputStyle}
                />
              </div>
            </div>
            <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
              <button type="button" onClick={() => !saving && closeModal()} disabled={saving} style={{ padding: '8px 16px', borderRadius: '8px', border: `1px solid ${dark ? '#404040' : '#d1d5db'}`, background: 'none', color: dark ? '#e5e7eb' : '#374151', cursor: saving ? 'not-allowed' : 'pointer', fontSize: '14px' }}>
                Cancel
              </button>
              <button
                type="button"
                onClick={handleAddPoints}
                disabled={saving}
                style={{ padding: '8px 20px', borderRadius: '8px', border: 'none', backgroundColor: '#059669', color: '#fff', fontWeight: 600, cursor: saving ? 'not-allowed' : 'pointer', fontSize: '14px' }}
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
