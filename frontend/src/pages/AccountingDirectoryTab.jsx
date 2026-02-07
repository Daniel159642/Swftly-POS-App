/**
 * Lightweight Directory tab for Accounting page.
 * Loads only saved reports and shipment document rows (metadata) – no heavy dependencies like react-pdf.
 * Uses native iframe for PDF viewing when user opens a document.
 */
import { useState, useEffect, useRef } from 'react'
import { X } from 'lucide-react'
import { useToast } from '../contexts/ToastContext'
import Modal from '../components/common/Modal'
import Button from '../components/common/Button'
import Input from '../components/common/Input'

export default function AccountingDirectoryTab({
  dateRange,
  formatCurrency,
  getAuthHeaders,
  onDirectoryRefresh,
  themeColorRgb = '59, 130, 246',
  isDarkMode: isDarkModeProp
}) {
  const { show: showToast } = useToast()
  const [data, setData] = useState({ saved_reports: [], shipment_documents: [] })
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [openMenuKey, setOpenMenuKey] = useState(null)
  const [confirmDeleteKey, setConfirmDeleteKey] = useState(null)
  const [renameReport, setRenameReport] = useState(null)
  const menuRef = useRef(null)
  const [viewingFile, setViewingFile] = useState(null)

  const isDarkMode = isDarkModeProp ?? document.documentElement.classList.contains('dark-theme')
  const textColor = isDarkMode ? '#ffffff' : '#1a1a1a'
  const textSecondary = isDarkMode ? 'var(--text-secondary, #ccc)' : '#666'
  const borderColorLight = isDarkMode ? '#555' : '#ccc'
  const bgPrimary = isDarkMode ? 'var(--bg-primary, #1a1a1a)' : '#fff'
  const bgSecondary = isDarkMode ? 'var(--bg-secondary, #2d2d2d)' : '#f5f5f5'

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target)) {
        setOpenMenuKey(null)
        setConfirmDeleteKey(null)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const loadDirectory = async () => {
    try {
      setLoading(true)
      const res = await fetch('/api/accounting/directory', { headers: getAuthHeaders() })
      const json = await res.json()
      if (json.success && json.data) {
        setData({
          saved_reports: json.data.saved_reports || [],
          shipment_documents: json.data.shipment_documents || []
        })
      }
    } catch (err) {
      console.error('Error loading directory:', err)
      showToast('Failed to load directory', 'error')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadDirectory()
  }, [])
  useEffect(() => {
    if (onDirectoryRefresh) onDirectoryRefresh.current = loadDirectory
  }, [onDirectoryRefresh, loadDirectory])

  const baseUrl = window.location.origin

  const closeViewer = () => {
    if (viewingFile?.url && viewingFile.url.startsWith('blob:')) {
      try { URL.revokeObjectURL(viewingFile.url) } catch (_) {}
    }
    setViewingFile(null)
  }

  const viewReport = async (name) => {
    try {
      const res = await fetch(`${baseUrl}/api/accounting/directory/report/${encodeURIComponent(name)}`, { headers: getAuthHeaders() })
      if (!res.ok) throw new Error(res.statusText)
      const contentType = (res.headers.get('content-type') || '').toLowerCase()
      const isPdf = name.toLowerCase().endsWith('.pdf') || contentType.includes('application/pdf')
      if (isPdf) {
        const blob = await res.blob()
        const url = URL.createObjectURL(blob)
        setViewingFile({ type: 'report', name, url, isPdf: true })
      } else {
        const csvText = await res.text()
        setViewingFile({ type: 'report', name, isPdf: false, csvText })
      }
    } catch (err) {
      console.error(err)
      showToast('Failed to load report', 'error')
    }
  }

  const viewShipment = async (id) => {
    try {
      const item = data.shipment_documents.find(d => d.id === id)
      const name = item?.name || `Shipment ${id}`
      const res = await fetch(`${baseUrl}/api/accounting/directory/shipment/${id}`, { headers: getAuthHeaders() })
      if (!res.ok) throw new Error(res.statusText)
      const blob = await res.blob()
      const ext = (name.split('.').pop() || '').toLowerCase()
      if (ext === 'pdf') {
        const url = URL.createObjectURL(blob)
        setViewingFile({ type: 'shipment', name, url, isPdf: true })
        return
      }
      if (['xlsx', 'xls'].includes(ext)) {
        const arrayBuffer = await blob.arrayBuffer()
        const XLSX = await import('xlsx')
        const d = new Uint8Array(arrayBuffer)
        const workbook = XLSX.read(d, { type: 'array' })
        const firstSheetName = workbook.SheetNames[0]
        const worksheet = workbook.Sheets[firstSheetName]
        const excelHtml = XLSX.utils.sheet_to_html(worksheet)
        setViewingFile({ type: 'shipment', name, isPdf: false, isExcel: true, excelHtml })
        return
      }
      if (ext === 'csv') {
        const csvText = await blob.text()
        setViewingFile({ type: 'shipment', name, isPdf: false, csvText })
        return
      }
      const contentType = (res.headers.get('content-type') || '').toLowerCase()
      if (contentType.includes('application/pdf')) {
        const url = URL.createObjectURL(blob)
        setViewingFile({ type: 'shipment', name, url, isPdf: true })
      } else {
        const csvText = await blob.text()
        setViewingFile({ type: 'shipment', name, isPdf: false, csvText })
      }
    } catch (err) {
      console.error(err)
      showToast('Failed to load document', 'error')
    }
  }

  const formatDate = (iso) => {
    if (!iso) return '—'
    try {
      const d = new Date(iso)
      return isNaN(d.getTime()) ? iso : d.toLocaleString()
    } catch {
      return iso
    }
  }

  const searchLower = (searchQuery || '').toLowerCase().trim()
  const filteredReports = searchLower
    ? data.saved_reports.filter((r) => (r.name || '').toLowerCase().includes(searchLower) || (formatDate(r.saved_at) || '').toLowerCase().includes(searchLower))
    : data.saved_reports
  const filteredShipments = searchLower
    ? data.shipment_documents.filter((s) => (s.name || '').toLowerCase().includes(searchLower) || (formatDate(s.saved_at) || '').toLowerCase().includes(searchLower))
    : data.shipment_documents

  const deleteReport = async (name) => {
    try {
      const res = await fetch(`${baseUrl}/api/accounting/directory/report/${encodeURIComponent(name)}`, { method: 'DELETE', headers: getAuthHeaders() })
      const json = await res.json()
      if (!res.ok || !json.success) throw new Error(json.message || 'Failed to delete')
      showToast('Report deleted', 'success')
      setOpenMenuKey(null)
      setConfirmDeleteKey(null)
      loadDirectory()
    } catch (err) {
      showToast(err.message || 'Failed to delete report', 'error')
    }
  }

  const renameReportSubmit = async () => {
    if (!renameReport || !renameReport.newName?.trim()) return
    const newName = renameReport.newName.trim()
    if (newName === renameReport.currentName) {
      setRenameReport(null)
      return
    }
    try {
      const res = await fetch(`${baseUrl}/api/accounting/directory/report/${encodeURIComponent(renameReport.currentName)}`, {
        method: 'PATCH',
        headers: { ...getAuthHeaders(), 'Content-Type': 'application/json' },
        body: JSON.stringify({ new_name: newName })
      })
      const json = await res.json()
      if (!res.ok || !json.success) throw new Error(json.message || 'Failed to rename')
      showToast('Report renamed', 'success')
      setRenameReport(null)
      loadDirectory()
    } catch (err) {
      showToast(err.message || 'Failed to rename report', 'error')
    }
  }

  const deleteShipment = async (id, name) => {
    try {
      const res = await fetch(`${baseUrl}/api/accounting/directory/shipment/${id}`, { method: 'DELETE', headers: getAuthHeaders() })
      const json = await res.json()
      if (!res.ok || !json.success) throw new Error(json.message || 'Failed to delete')
      showToast('Document removed', 'success')
      setOpenMenuKey(null)
      setConfirmDeleteKey(null)
      loadDirectory()
    } catch (err) {
      showToast(err.message || 'Failed to remove document', 'error')
    }
  }

  const menuStyle = {
    position: 'absolute',
    top: '100%',
    right: 0,
    marginTop: '4px',
    minWidth: '120px',
    backgroundColor: isDarkMode ? '#2d2d2d' : '#fff',
    border: isDarkMode ? '1px solid #333' : '1px solid #e5e7eb',
    borderRadius: '6px',
    boxShadow: isDarkMode ? '0 4px 12px rgba(0,0,0,0.4)' : '0 4px 12px rgba(0,0,0,0.15)',
    zIndex: 9999,
    overflow: 'hidden'
  }
  const menuItemStyle = {
    display: 'block',
    width: '100%',
    padding: '10px 14px',
    textAlign: 'left',
    border: 'none',
    background: 'none',
    color: isDarkMode ? '#fff' : '#333',
    fontSize: '14px',
    cursor: 'pointer',
    transition: 'background-color 0.15s'
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', minHeight: 0, overflow: 'hidden' }}>
      {renameReport && (
        <Modal isOpen={!!renameReport} onClose={() => setRenameReport(null)} title="Rename report">
          <div style={{ padding: '8px 0' }}>
            <label style={{ display: 'block', fontSize: '14px', color: textSecondary, marginBottom: '8px' }}>File name</label>
            <Input
              value={renameReport.newName}
              onChange={(e) => setRenameReport((r) => r ? { ...r, newName: e.target.value } : null)}
              placeholder="Report name with extension"
              style={{ width: '100%', marginBottom: '16px' }}
            />
            <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
              <Button variant="secondary" onClick={() => setRenameReport(null)}>Cancel</Button>
              <Button onClick={renameReportSubmit} disabled={!renameReport.newName?.trim() || renameReport.newName.trim() === renameReport.currentName}>
                Save
              </Button>
            </div>
          </div>
        </Modal>
      )}
      <div style={{ marginBottom: '24px', flexShrink: 0 }}>
        <h1 style={{ fontSize: '16px', fontWeight: 500, color: isDarkMode ? '#9ca3af' : '#6b7280', margin: 0 }}>Directory</h1>
        <p style={{ fontSize: '14px', color: isDarkMode ? '#9ca3af' : '#6b7280', marginTop: '4px' }}>Saved reports and shipment documents. Use <strong>Save</strong> on each report to add it here.</p>
      </div>

      <div style={{ marginBottom: '20px', flexShrink: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
          <div style={{ position: 'relative', flex: 1, minWidth: '200px', display: 'flex', alignItems: 'center' }}>
            <input
              type="text"
              placeholder="Search reports and documents..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              style={{
                flex: 1,
                padding: '8px 0',
                border: 'none',
                borderBottom: isDarkMode ? '2px solid #404040' : '2px solid #ddd',
                borderRadius: 0,
                backgroundColor: 'transparent',
                outline: 'none',
                fontSize: '14px',
                boxSizing: 'border-box',
                color: isDarkMode ? '#fff' : '#333',
                transition: 'border-color 0.2s ease'
              }}
              onFocus={(e) => { e.target.style.borderBottomColor = `rgba(${themeColorRgb}, 0.7)` }}
              onBlur={(e) => { e.target.style.borderBottomColor = isDarkMode ? '#404040' : '#ddd' }}
            />
          </div>
        </div>
      </div>

      <div style={{ flex: '1 1 0', minHeight: 0, display: 'flex', flexDirection: 'column', marginBottom: '16px' }}>
        <h4 style={{ color: textColor, marginBottom: '12px', fontSize: '16px', fontWeight: 600, flexShrink: 0 }}>Saved Reports</h4>
        <div style={{ flex: 1, minHeight: 0, display: 'flex', flexDirection: 'column', backgroundColor: isDarkMode ? '#2a2a2a' : 'white', borderRadius: '8px', boxShadow: isDarkMode ? '0 2px 8px rgba(0,0,0,0.3)' : '0 2px 8px rgba(0,0,0,0.08)', border: isDarkMode ? '1px solid rgba(255,255,255,0.06)' : '1px solid rgba(0,0,0,0.06)', overflow: 'hidden' }}>
          <div style={{ padding: '16px 24px', borderBottom: `1px solid ${isDarkMode ? '#3a3a3a' : '#e5e7eb'}`, display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px', flexShrink: 0 }}>
            <p style={{ fontSize: '14px', color: textSecondary, margin: 0 }}>{loading ? 'Loading…' : `Showing ${filteredReports.length} of ${data.saved_reports.length} reports`}</p>
          </div>
          <div style={{ flex: 1, minHeight: 0, overflowY: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '14px' }}>
            <thead style={{ position: 'sticky', top: 0, zIndex: 1, backgroundColor: isDarkMode ? '#1f1f1f' : '#f9fafb', boxShadow: isDarkMode ? '0 1px 0 #3a3a3a' : '0 1px 0 #e5e7eb' }}>
              <tr>
                <th style={{ textAlign: 'left', padding: '12px 24px', fontSize: '12px', fontWeight: 500, color: textSecondary, textTransform: 'uppercase' }}>Name</th>
                <th style={{ textAlign: 'left', padding: '12px 24px', fontSize: '12px', fontWeight: 500, color: textSecondary, textTransform: 'uppercase' }}>Saved</th>
                <th style={{ textAlign: 'right', padding: '12px 24px', fontSize: '12px', fontWeight: 500, color: textSecondary, textTransform: 'uppercase' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                [1, 2, 3].map((i) => (
                  <tr key={`skeleton-r-${i}`} style={{ borderBottom: `1px solid ${isDarkMode ? '#3a3a3a' : '#e5e7eb'}` }}>
                    <td style={{ padding: '12px 24px' }}><span style={{ display: 'inline-block', width: '120px', height: '14px', backgroundColor: isDarkMode ? '#333' : '#e5e7eb', borderRadius: '4px', opacity: 0.6 }} /></td>
                    <td style={{ padding: '12px 24px' }}><span style={{ display: 'inline-block', width: '80px', height: '14px', backgroundColor: isDarkMode ? '#333' : '#e5e7eb', borderRadius: '4px', opacity: 0.6 }} /></td>
                    <td style={{ padding: '12px 24px', textAlign: 'right' }} />
                  </tr>
                ))
              ) : filteredReports.length === 0 ? (
                <tr>
                  <td colSpan={3} style={{ padding: '24px', color: textColor, opacity: 0.7 }}>No saved reports yet. Generate a report (Trial Balance, P&amp;L, Balance Sheet, Cash Flow) and click <strong>Save</strong> to add it here.</td>
                </tr>
              ) : filteredReports.map((item) => (
                  <tr key={item.name} style={{ borderBottom: `1px solid ${isDarkMode ? '#3a3a3a' : '#e5e7eb'}` }}>
                    <td style={{ padding: '12px 24px', color: isDarkMode ? '#e5e7eb' : '#111', fontWeight: 500 }}>{item.name}</td>
                    <td style={{ padding: '12px 24px', color: textSecondary }}>{formatDate(item.saved_at)}</td>
                    <td style={{ padding: '12px 24px', textAlign: 'right' }}>
                      <div ref={(openMenuKey === ('report:' + item.name) || confirmDeleteKey === ('report:' + item.name)) ? menuRef : null} style={{ position: 'relative', display: 'inline-block' }}>
                        <button
                          type="button"
                          onClick={() => { setOpenMenuKey((k) => (k === 'report:' + item.name ? null : 'report:' + item.name)); setConfirmDeleteKey(null) }}
                          aria-label="Actions"
                          style={{ padding: '4px 8px', backgroundColor: openMenuKey === 'report:' + item.name ? (isDarkMode ? '#3a3a3a' : '#eee') : 'transparent', color: textSecondary, border: 'none', borderRadius: '4px', cursor: 'pointer', fontSize: '18px', lineHeight: 1 }}
                          onMouseEnter={(e) => { if (openMenuKey !== 'report:' + item.name) { e.target.style.color = textColor; e.target.style.backgroundColor = isDarkMode ? '#3a3a3a' : '#eee' } }}
                          onMouseLeave={(e) => { if (openMenuKey !== 'report:' + item.name) { e.target.style.color = textSecondary; e.target.style.backgroundColor = 'transparent' } }}
                        >
                          ⋮
                        </button>
                        {openMenuKey === 'report:' + item.name && !confirmDeleteKey && (
                          <div role="menu" style={menuStyle}>
                            <button role="menuitem" type="button" style={menuItemStyle} onMouseEnter={(e) => { e.target.style.backgroundColor = isDarkMode ? '#3a3a3a' : '#f0f0f0' }} onMouseLeave={(e) => { e.target.style.backgroundColor = 'transparent' }} onClick={() => { viewReport(item.name); setOpenMenuKey(null) }}>View</button>
                            <button role="menuitem" type="button" style={menuItemStyle} onMouseEnter={(e) => { e.target.style.backgroundColor = isDarkMode ? '#3a3a3a' : '#f0f0f0' }} onMouseLeave={(e) => { e.target.style.backgroundColor = 'transparent' }} onClick={() => { setOpenMenuKey(null); setRenameReport({ currentName: item.name, newName: item.name }) }}>Rename</button>
                            <button role="menuitem" type="button" style={menuItemStyle} onMouseEnter={(e) => { e.target.style.backgroundColor = isDarkMode ? '#3a3a3a' : '#f0f0f0' }} onMouseLeave={(e) => { e.target.style.backgroundColor = 'transparent' }} onClick={() => { setOpenMenuKey(null); setConfirmDeleteKey('report:' + item.name) }}>Delete</button>
                          </div>
                        )}
                        {confirmDeleteKey === 'report:' + item.name && (
                          <div role="dialog" aria-label="Confirm delete" style={{ ...menuStyle, minWidth: '200px', padding: '12px 14px' }}>
                            <p style={{ margin: '0 0 12px 0', fontSize: '13px', color: textColor }}>Delete &quot;{item.name}&quot;?</p>
                            <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
                              <button type="button" onClick={() => setConfirmDeleteKey(null)} style={{ padding: '6px 12px', fontSize: '13px', borderRadius: '6px', border: `1px solid ${borderColorLight}`, background: bgPrimary, color: textColor, cursor: 'pointer' }}>Cancel</button>
                              <button type="button" onClick={() => deleteReport(item.name)} style={{ padding: '6px 12px', fontSize: '13px', borderRadius: '6px', border: 'none', background: isDarkMode ? '#dc2626' : '#ef4444', color: '#fff', cursor: 'pointer' }}>Delete</button>
                            </div>
                          </div>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
            </tbody>
          </table>
          </div>
        </div>
      </div>

      <div style={{ flex: '1 1 0', minHeight: 0, display: 'flex', flexDirection: 'column' }}>
        <h4 style={{ color: textColor, marginBottom: '12px', fontSize: '16px', fontWeight: 600, flexShrink: 0 }}>Shipment Documents (uploaded)</h4>
        <div style={{ flex: 1, minHeight: 0, display: 'flex', flexDirection: 'column', backgroundColor: isDarkMode ? '#2a2a2a' : 'white', borderRadius: '8px', boxShadow: isDarkMode ? '0 2px 8px rgba(0,0,0,0.3)' : '0 2px 8px rgba(0,0,0,0.08)', border: isDarkMode ? '1px solid rgba(255,255,255,0.06)' : '1px solid rgba(0,0,0,0.06)', overflow: 'hidden' }}>
          <div style={{ padding: '16px 24px', borderBottom: `1px solid ${isDarkMode ? '#3a3a3a' : '#e5e7eb'}`, display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px', flexShrink: 0 }}>
            <p style={{ fontSize: '14px', color: textSecondary, margin: 0 }}>{loading ? 'Loading…' : `Showing ${filteredShipments.length} of ${data.shipment_documents.length} documents`}</p>
          </div>
          <div style={{ flex: 1, minHeight: 0, overflowY: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '14px' }}>
            <thead style={{ position: 'sticky', top: 0, zIndex: 1, backgroundColor: isDarkMode ? '#1f1f1f' : '#f9fafb', boxShadow: isDarkMode ? '0 1px 0 #3a3a3a' : '0 1px 0 #e5e7eb' }}>
              <tr>
                <th style={{ textAlign: 'left', padding: '12px 24px', fontSize: '12px', fontWeight: 500, color: textSecondary, textTransform: 'uppercase' }}>Name</th>
                <th style={{ textAlign: 'left', padding: '12px 24px', fontSize: '12px', fontWeight: 500, color: textSecondary, textTransform: 'uppercase' }}>Uploaded</th>
                <th style={{ textAlign: 'right', padding: '12px 24px', fontSize: '12px', fontWeight: 500, color: textSecondary, textTransform: 'uppercase' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                [1, 2, 3].map((i) => (
                  <tr key={`skeleton-s-${i}`} style={{ borderBottom: `1px solid ${isDarkMode ? '#3a3a3a' : '#e5e7eb'}` }}>
                    <td style={{ padding: '12px 24px' }}><span style={{ display: 'inline-block', width: '120px', height: '14px', backgroundColor: isDarkMode ? '#333' : '#e5e7eb', borderRadius: '4px', opacity: 0.6 }} /></td>
                    <td style={{ padding: '12px 24px' }}><span style={{ display: 'inline-block', width: '80px', height: '14px', backgroundColor: isDarkMode ? '#333' : '#e5e7eb', borderRadius: '4px', opacity: 0.6 }} /></td>
                    <td style={{ padding: '12px 24px', textAlign: 'right' }} />
                  </tr>
                ))
              ) : filteredShipments.length === 0 ? (
                <tr>
                  <td colSpan={3} style={{ padding: '24px', color: textColor, opacity: 0.7 }}>No shipment documents yet. Documents uploaded when creating or previewing a shipment will appear here.</td>
                </tr>
              ) : filteredShipments.map((item) => (
                  <tr key={'s-' + item.id} style={{ borderBottom: `1px solid ${isDarkMode ? '#3a3a3a' : '#e5e7eb'}` }}>
                    <td style={{ padding: '12px 24px', color: isDarkMode ? '#e5e7eb' : '#111', fontWeight: 500 }}>{item.name}</td>
                    <td style={{ padding: '12px 24px', color: textSecondary }}>{formatDate(item.saved_at)}</td>
                    <td style={{ padding: '12px 24px', textAlign: 'right' }}>
                      <div ref={(openMenuKey === ('shipment:' + item.id) || confirmDeleteKey === ('shipment:' + item.id)) ? menuRef : null} style={{ position: 'relative', display: 'inline-block' }}>
                        <button
                          type="button"
                          onClick={() => { setOpenMenuKey((k) => (k === 'shipment:' + item.id ? null : 'shipment:' + item.id)); setConfirmDeleteKey(null) }}
                          aria-label="Actions"
                          style={{ padding: '4px 8px', backgroundColor: openMenuKey === 'shipment:' + item.id ? (isDarkMode ? '#3a3a3a' : '#eee') : 'transparent', color: textSecondary, border: 'none', borderRadius: '4px', cursor: 'pointer', fontSize: '18px', lineHeight: 1 }}
                          onMouseEnter={(e) => { if (openMenuKey !== 'shipment:' + item.id) { e.target.style.color = textColor; e.target.style.backgroundColor = isDarkMode ? '#3a3a3a' : '#eee' } }}
                          onMouseLeave={(e) => { if (openMenuKey !== 'shipment:' + item.id) { e.target.style.color = textSecondary; e.target.style.backgroundColor = 'transparent' } }}
                        >
                          ⋮
                        </button>
                        {openMenuKey === 'shipment:' + item.id && !confirmDeleteKey && (
                          <div role="menu" style={menuStyle}>
                            <button role="menuitem" type="button" style={menuItemStyle} onMouseEnter={(e) => { e.target.style.backgroundColor = isDarkMode ? '#3a3a3a' : '#f0f0f0' }} onMouseLeave={(e) => { e.target.style.backgroundColor = 'transparent' }} onClick={() => { viewShipment(item.id); setOpenMenuKey(null) }}>View</button>
                            <button role="menuitem" type="button" style={menuItemStyle} onMouseEnter={(e) => { e.target.style.backgroundColor = isDarkMode ? '#3a3a3a' : '#f0f0f0' }} onMouseLeave={(e) => { e.target.style.backgroundColor = 'transparent' }} onClick={() => { setOpenMenuKey(null); setConfirmDeleteKey('shipment:' + item.id) }}>Delete</button>
                          </div>
                        )}
                        {confirmDeleteKey === 'shipment:' + item.id && (
                          <div role="dialog" aria-label="Confirm delete" style={{ ...menuStyle, minWidth: '200px', padding: '12px 14px' }}>
                            <p style={{ margin: '0 0 12px 0', fontSize: '13px', color: textColor }}>Delete &quot;{item.name}&quot;?</p>
                            <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
                              <button type="button" onClick={() => setConfirmDeleteKey(null)} style={{ padding: '6px 12px', fontSize: '13px', borderRadius: '6px', border: `1px solid ${borderColorLight}`, background: bgPrimary, color: textColor, cursor: 'pointer' }}>Cancel</button>
                              <button type="button" onClick={() => deleteShipment(item.id, item.name)} style={{ padding: '6px 12px', fontSize: '13px', borderRadius: '6px', border: 'none', background: isDarkMode ? '#dc2626' : '#ef4444', color: '#fff', cursor: 'pointer' }}>Delete</button>
                            </div>
                          </div>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
            </tbody>
          </table>
          </div>
        </div>
      </div>

      {/* Viewer modal – native iframe for PDFs, no react-pdf */}
      {viewingFile && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 9999, backgroundColor: isDarkMode ? 'rgba(0,0,0,0.9)' : 'rgba(0,0,0,0.85)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '24px' }}>
          {(viewingFile.isExcel && viewingFile.excelHtml) && (
            <style>{`
              .file-preview-container .excel-preview table { width: 100%; border-collapse: collapse; font-size: 13px; }
              .file-preview-container .excel-preview td, .file-preview-container .excel-preview th { border: 1px solid ${isDarkMode ? 'var(--border-color, #404040)' : '#ddd'}; padding: 8px; text-align: left; }
              .file-preview-container .excel-preview th { background-color: ${isDarkMode ? 'var(--bg-secondary, #2d2d2d)' : '#f5f5f5'}; font-weight: 600; }
              .file-preview-container .excel-preview tr:nth-child(even) { background-color: ${isDarkMode ? 'rgba(255, 255, 255, 0.02)' : '#f9f9f9'}; }
            `}</style>
          )}
          <div className="file-preview-container" style={{ width: '100%', maxWidth: '900px', maxHeight: '90vh', display: 'flex', flexDirection: 'column', border: `1px solid ${isDarkMode ? 'var(--border-color, #404040)' : '#ddd'}`, borderRadius: '8px', overflow: 'hidden', backgroundColor: isDarkMode ? 'var(--bg-secondary, #2d2d2d)' : '#f9f9f9' }}>
            <div style={{ padding: '12px 16px', borderBottom: `1px solid ${isDarkMode ? 'var(--border-color, #404040)' : '#ddd'}`, backgroundColor: bgPrimary, fontWeight: 600, fontSize: '14px', color: isDarkMode ? 'var(--text-primary, #fff)' : '#333', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '12px' }}>
              <span>{viewingFile.name}</span>
              <button type="button" onClick={closeViewer} style={{ padding: '6px 10px', border: `1px solid ${borderColorLight}`, borderRadius: '6px', background: bgPrimary, color: isDarkMode ? '#fff' : '#333', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px', fontSize: '13px' }}>
                <X size={16} /> Close
              </button>
            </div>
            <div style={{ flex: 1, overflow: 'auto', padding: viewingFile.isPdf ? 0 : '16px' }}>
              {viewingFile.isPdf ? (
                <>
                  <div style={{ padding: '8px 16px', borderBottom: `1px solid ${isDarkMode ? 'var(--border-color, #404040)' : '#eee'}`, backgroundColor: bgSecondary, display: 'flex', alignItems: 'center', justifyContent: 'flex-end' }}>
                    <a href={viewingFile.url} target="_blank" rel="noopener noreferrer" style={{ fontSize: '13px', color: `rgba(${themeColorRgb}, 1)`, textDecoration: 'none', fontWeight: 500 }}>Open in new tab</a>
                  </div>
                  <iframe src={viewingFile.url} title={viewingFile.name} style={{ width: '100%', height: 'calc(90vh - 120px)', minHeight: '400px', border: 'none' }} />
                </>
              ) : viewingFile.isExcel && viewingFile.excelHtml ? (
                <div dangerouslySetInnerHTML={{ __html: viewingFile.excelHtml }} style={{ backgroundColor: isDarkMode ? 'var(--bg-primary, #1a1a1a)' : '#fff', color: isDarkMode ? 'var(--text-primary, #fff)' : '#333' }} className="excel-preview" />
              ) : (
                <pre style={{ margin: 0, fontSize: '13px', fontFamily: 'ui-monospace, monospace', color: isDarkMode ? 'var(--text-primary, #fff)' : '#333', whiteSpace: 'pre-wrap', wordBreak: 'break-all' }}>
                  {viewingFile.csvText || ''}
                </pre>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
