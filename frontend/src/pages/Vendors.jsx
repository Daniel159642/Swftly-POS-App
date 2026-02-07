import React, { useState, useEffect } from 'react'
import vendorService from '../services/vendorService'
import VendorTable from '../components/vendors/VendorTable'
import VendorForm from '../components/vendors/VendorForm'
import VendorFilters from '../components/vendors/VendorFilters'
import VendorDetailModal from '../components/vendors/VendorDetailModal'
import Modal from '../components/common/Modal'
import Button from '../components/common/Button'
import { useToast } from '../contexts/ToastContext'

function Vendors() {
  const isDarkMode = document.documentElement.classList.contains('dark-theme')
  const { show: showToast } = useToast()
  const [vendors, setVendors] = useState([])
  const [loading, setLoading] = useState(true)
  const [filters, setFilters] = useState({ page: 1, limit: 50 })
  const [pagination, setPagination] = useState({ total: 0, page: 1, total_pages: 1 })
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false)
  const [isEditModalOpen, setIsEditModalOpen] = useState(false)
  const [isViewModalOpen, setIsViewModalOpen] = useState(false)
  const [selectedVendor, setSelectedVendor] = useState(null)
  const [vendorBalance, setVendorBalance] = useState(null)

  useEffect(() => {
    fetchVendors()
  }, [filters.page, filters.limit, filters.is_1099_vendor, filters.is_active, filters.search])

  async function fetchVendors() {
    setLoading(true)
    try {
      const result = await vendorService.getAllVendors(filters)
      setVendors(result.vendors || [])
      setPagination(result.pagination || { total: 0, page: 1, total_pages: 1 })
    } catch (err) {
      const msg = err.response?.data?.message || err.message || 'Failed to fetch vendors'
      showToast(msg, 'error')
    } finally {
      setLoading(false)
    }
  }

  async function handleCreateVendor(data) {
    try {
      await vendorService.createVendor(data)
      showToast('Vendor created successfully', 'success')
      setIsCreateModalOpen(false)
      fetchVendors()
    } catch (err) {
      const msg = err.response?.data?.message || err.message || 'Failed to create vendor'
      showToast(msg, 'error')
      throw err
    }
  }

  async function handleUpdateVendor(data) {
    if (!selectedVendor) return
    try {
      await vendorService.updateVendor(selectedVendor.id, data)
      showToast('Vendor updated successfully', 'success')
      setIsEditModalOpen(false)
      setSelectedVendor(null)
      fetchVendors()
    } catch (err) {
      const msg = err.response?.data?.message || err.message || 'Failed to update vendor'
      showToast(msg, 'error')
      throw err
    }
  }

  async function handleDeleteVendor(vendor) {
    if (!window.confirm(`Are you sure you want to delete "${vendor.vendor_name}"?`)) return
    try {
      await vendorService.deleteVendor(vendor.id)
      showToast('Vendor deleted successfully', 'success')
      fetchVendors()
    } catch (err) {
      const msg = err.response?.data?.message || err.message || 'Failed to delete vendor'
      showToast(msg, 'error')
    }
  }

  async function handleToggleStatus(vendor) {
    try {
      await vendorService.toggleVendorStatus(vendor.id)
      showToast(`Vendor ${vendor.is_active ? 'deactivated' : 'activated'} successfully`, 'success')
      fetchVendors()
    } catch (err) {
      const msg = err.response?.data?.message || err.message || 'Failed to toggle vendor status'
      showToast(msg, 'error')
    }
  }

  async function handleViewVendor(vendor) {
    try {
      const balance = await vendorService.getVendorBalance(vendor.id)
      setVendorBalance(balance)
      setSelectedVendor(vendor)
      setIsViewModalOpen(true)
    } catch (err) {
      showToast('Failed to fetch vendor details', 'error')
    }
  }

  function handleClearFilters() {
    setFilters({ page: 1, limit: 50 })
  }

  function handlePageChange(newPage) {
    setFilters((f) => ({ ...f, page: newPage }))
  }

  const page = pagination.page || 1
  const totalPages = pagination.total_pages || 1
  const total = pagination.total || 0

  return (
    <div style={{ maxWidth: '1400px', margin: '0 auto', padding: '32px 16px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '24px', flexWrap: 'wrap', gap: '16px' }}>
        <div>
          <h1 style={{ fontSize: '28px', fontWeight: 700, color: isDarkMode ? '#fff' : '#111', margin: 0 }}>Vendors</h1>
          <p style={{ fontSize: '14px', color: isDarkMode ? '#9ca3af' : '#6b7280', marginTop: '4px' }}>Vendors are suppliers you purchase from. Track vendor contact info and balances here. Bills you receive are linked to vendors.</p>
        </div>
        <Button onClick={() => setIsCreateModalOpen(true)}>+ New Vendor</Button>
      </div>

      <VendorFilters filters={filters} onFilterChange={setFilters} onClearFilters={handleClearFilters} />

      <div
        style={{
          backgroundColor: isDarkMode ? '#2a2a2a' : 'white',
          borderRadius: '8px',
          boxShadow: isDarkMode ? '0 2px 8px rgba(0,0,0,0.3)' : '0 2px 8px rgba(0,0,0,0.08)',
          overflow: 'hidden'
        }}
      >
        <div
          style={{
            padding: '16px 24px',
            borderBottom: '1px solid ' + (isDarkMode ? '#3a3a3a' : '#e5e7eb'),
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            flexWrap: 'wrap',
            gap: '16px'
          }}
        >
          <p style={{ fontSize: '14px', color: isDarkMode ? '#9ca3af' : '#6b7280', margin: 0 }}>
            Showing {vendors.length} of {total} vendors
          </p>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Button type="button" size="sm" variant="secondary" onClick={() => handlePageChange(page - 1)} disabled={page <= 1}>
              Previous
            </Button>
            <span style={{ fontSize: '14px', color: isDarkMode ? '#d1d5db' : '#374151', padding: '0 8px' }}>
              Page {page} of {totalPages}
            </span>
            <Button type="button" size="sm" variant="secondary" onClick={() => handlePageChange(page + 1)} disabled={page >= totalPages}>
              Next
            </Button>
          </div>
        </div>

        <VendorTable
          vendors={vendors}
          loading={loading}
          onView={handleViewVendor}
          onEdit={(v) => {
            setSelectedVendor(v)
            setIsEditModalOpen(true)
          }}
          onDelete={handleDeleteVendor}
          onToggleStatus={handleToggleStatus}
        />
      </div>

      <Modal isOpen={isCreateModalOpen} onClose={() => setIsCreateModalOpen(false)} title="Create New Vendor" size="xl">
        <VendorForm onSubmit={handleCreateVendor} onCancel={() => setIsCreateModalOpen(false)} />
      </Modal>

      <Modal
        isOpen={isEditModalOpen}
        onClose={() => {
          setIsEditModalOpen(false)
          setSelectedVendor(null)
        }}
        title="Edit Vendor"
        size="xl"
      >
        <VendorForm
          vendor={selectedVendor}
          onSubmit={handleUpdateVendor}
          onCancel={() => {
            setIsEditModalOpen(false)
            setSelectedVendor(null)
          }}
        />
      </Modal>

      <Modal
        isOpen={isViewModalOpen}
        onClose={() => {
          setIsViewModalOpen(false)
          setSelectedVendor(null)
          setVendorBalance(null)
        }}
        title="Vendor Details"
        size="lg"
      >
        {selectedVendor && <VendorDetailModal vendor={selectedVendor} balance={vendorBalance} />}
      </Modal>
    </div>
  )
}

export default Vendors
