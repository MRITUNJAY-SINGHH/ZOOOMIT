import React, { useEffect, useState, useMemo } from 'react';
import { useNavigate } from 'react-router';
import { Card, Table, Spinner, Dropdown, Button, Modal, Badge, Pagination, Form } from 'react-bootstrap';
import Icon from '@/components/wrappers/Icon';
import api from '@/utils/api';

export default function InvoicesList() {
  const [invoices, setInvoices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [perPage, setPerPage] = useState(15);
  const [totalPages, setTotalPages] = useState(1);
  const [totalInvoices, setTotalInvoices] = useState(0);

  const [selectedIds, setSelectedIds] = useState([]);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const navigate = useNavigate();

  const fetchInvoices = async () => {
    setLoading(true);
    try {
      const res = await api.get('/invoices', {
        params: { search, status: statusFilter, page: currentPage, limit: perPage }
      });
      setInvoices(res.data.invoices);
      setTotalPages(res.data.pages);
      setTotalInvoices(res.data.total);
    } catch (error) {
      console.error('Failed to fetch invoices', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchInvoices();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [search, statusFilter, currentPage, perPage]);

  const handleSelectAll = (e) => {
    if (e.target.checked) {
      setSelectedIds(invoices.map(inv => inv._id));
    } else {
      setSelectedIds([]);
    }
  };

  const handleSelectOne = (id) => {
    setSelectedIds(prev => 
      prev.includes(id) ? prev.filter(item => item !== id) : [...prev, id]
    );
  };

  const handleDelete = async () => {
    setDeleting(true);
    try {
      await api.post('/invoices/bulk-delete', { ids: selectedIds });
      setShowDeleteModal(false);
      setSelectedIds([]);
      fetchInvoices();
    } catch (error) {
      console.error('Delete failed', error);
    } finally {
      setDeleting(false);
    }
  };

  const statusBadge = (s) => {
    const map = { 
      Paid: { bg: 'rgba(16,185,129,0.12)', color: '#10b981' }, 
      Pending: { bg: 'rgba(245,158,11,0.12)', color: '#f59e0b' }, 
      Overdue: { bg: 'rgba(239,68,68,0.12)', color: '#ef4444' }, 
      Draft: { bg: 'rgba(59,130,246,0.12)', color: '#3b82f6' },
      Cancelled: { bg: 'rgba(100,116,139,0.12)', color: '#64748b' }
    };
    return map[s] || map.Draft;
  };

  return (
    <div className="report-page">
      <div className="report-header align-items-center mb-4 pb-2" style={{ borderBottom: '1px solid var(--bs-border-color)' }}>
        <div className="report-header-left d-flex align-items-center gap-3">
          <h3 className="report-title mb-0 me-4">Invoices</h3>
          
          <div className="report-search-wrap" style={{ width: '280px', position: 'relative' }}>
            <Icon icon="lucide:search" width={18} className="search-icon" style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--bs-secondary-color)' }} />
            <input 
              type="text" 
              className="form-control report-search-input" 
              placeholder="Search invoices..." 
              value={search}
              onChange={(e) => { setSearch(e.target.value); setCurrentPage(1); }}
              style={{ paddingLeft: '38px', backgroundColor: 'rgba(255, 255, 255, 0.03)' }}
            />
          </div>

          {selectedIds.length > 0 && (
            <Button variant="danger" className="px-4" style={{ borderRadius: '0.5rem', fontWeight: 600 }} onClick={() => setShowDeleteModal(true)}>
              Delete
            </Button>
          )}

          <Button variant="primary" className="d-inline-flex align-items-center justify-content-center p-0" style={{ width: 40, height: 40, borderRadius: '50%' }} onClick={() => navigate('/invoices/create')}>
            <Icon icon="lucide:plus" width={22} />
          </Button>
        </div>
        
        <div className="report-header-right d-flex gap-3 align-items-center">
          <span style={{ color: 'var(--bs-secondary-color)', fontWeight: 500 }}>Filter By:</span>
          
          <Form.Select 
            className="report-select" 
            style={{ width: '140px', backgroundColor: 'rgba(255, 255, 255, 0.03)' }}
            value={statusFilter}
            onChange={(e) => { setStatusFilter(e.target.value); setCurrentPage(1); }}
          >
            <option value="all">Status</option>
            <option value="Paid">Paid</option>
            <option value="Pending">Pending</option>
            <option value="Overdue">Overdue</option>
            <option value="Draft">Draft</option>
          </Form.Select>
          
          <Form.Select 
            className="report-select" 
            style={{ width: '80px', backgroundColor: 'rgba(255, 255, 255, 0.03)' }}
            value={perPage}
            onChange={(e) => { setPerPage(Number(e.target.value)); setCurrentPage(1); }}
          >
            <option value="8">8</option>
            <option value="15">15</option>
            <option value="30">30</option>
            <option value="50">50</option>
          </Form.Select>
        </div>
      </div>

      <Card className="report-section-card border-0" style={{ backgroundColor: 'transparent' }}>
        {loading ? (
          <div className="d-flex justify-content-center align-items-center" style={{ minHeight: 400 }}><Spinner animation="border" /></div>
        ) : (
          <>
            <div style={{ overflowX: 'auto' }}>
              <Table className="report-table mb-0" style={{ borderCollapse: 'separate', borderSpacing: '0 8px' }}>
                <thead className="custom-table-thead" style={{
                  fontSize: '11px',
                  textTransform: 'uppercase',
                  letterSpacing: '0.5px',
                  backgroundColor: 'transparent'
                }}>
                  <tr>
                    <th className="py-2 border-0" style={{ width: 40 }}>
                      <Form.Check 
                        type="checkbox" 
                        checked={invoices.length > 0 && selectedIds.length === invoices.length}
                        onChange={handleSelectAll}
                        style={{ cursor: 'pointer' }}
                      />
                    </th>
                    <th className="py-2 text-muted border-0">ID</th>
                    <th className="py-2 text-muted border-0">CREATE & END DATE</th>
                    <th className="py-2 text-muted border-0">CLIENTS NAME</th>
                    <th className="py-2 text-muted border-0">PURCHASE</th>
                    <th className="py-2 text-muted border-0">AMOUNT</th>
                    <th className="py-2 text-muted border-0">STATUS</th>
                    <th className="py-2 text-center text-muted border-0">ACTIONS</th>
                  </tr>
                </thead>
                <tbody>
                  {invoices.map((inv) => {
                    const badge = statusBadge(inv.status);
                    const purchaseDesc = inv.productSnapshot && inv.productSnapshot.length > 0 ? inv.productSnapshot[0].productName : '-';
                    const isChecked = selectedIds.includes(inv._id);
                    
                    return (
                      <tr key={inv._id} style={{ 
                        backgroundColor: isChecked ? 'rgba(var(--bs-primary-rgb), 0.08)' : 'var(--bs-tertiary-bg)',
                        boxShadow: '0 1px 3px rgba(0,0,0,0.05)'
                      }}>
                        <td className="align-middle border-0 rounded-start">
                          <Form.Check 
                            type="checkbox" 
                            checked={isChecked}
                            onChange={() => handleSelectOne(inv._id)}
                            style={{ cursor: 'pointer' }}
                          />
                        </td>
                        <td className="align-middle border-0 fw-bold" style={{ fontSize: '14px' }}>
                          <div className="d-flex align-items-center gap-2" style={{ color: 'var(--bs-body-color)' }}>
                            <Icon icon="lucide:file-text" width={16} style={{ color: 'var(--bs-primary)' }} />
                            {inv.invoiceNumber}
                          </div>
                        </td>
                        <td className="align-middle border-0" style={{ fontSize: '13px', color: 'var(--bs-secondary-color)' }}>
                          {new Date(inv.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} - {inv.dueDate ? new Date(inv.dueDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : '-'}
                        </td>
                        <td className="align-middle border-0">
                          <div className="d-flex align-items-center gap-2">
                            <div className="avatar-initials bg-primary text-white" style={{ width: 32, height: 32, fontSize: '12px' }}>
                              {inv.customerSnapshot?.name?.charAt(0) || 'U'}
                            </div>
                            <div>
                              <div style={{ fontSize: '14px', fontWeight: 600, color: 'var(--bs-body-color)' }}>{inv.customerSnapshot?.name || '-'}</div>
                              <div style={{ fontSize: '12px', color: 'var(--bs-secondary-color)' }}>{inv.customerSnapshot?.email || '-'}</div>
                            </div>
                          </div>
                        </td>
                        <td className="align-middle border-0" style={{ fontSize: '14px', color: 'var(--bs-body-color)' }}>
                          {purchaseDesc} {inv.productSnapshot?.length > 1 ? `(+${inv.productSnapshot.length - 1} items)` : ''}
                        </td>
                        <td className="align-middle border-0 fw-bold" style={{ fontSize: '14px', color: 'var(--bs-body-color)' }}>
                          ${inv.totalsSnapshot?.amount?.toLocaleString()} USD
                        </td>
                        <td className="align-middle border-0">
                          <span className="report-badge px-2 py-1" style={{ background: badge.bg, color: badge.color, fontSize: '11px' }}>
                            {inv.status}
                          </span>
                        </td>
                        <td className="align-middle border-0 text-center rounded-end">
                          <div className="d-flex justify-content-center gap-2">
                            <button className="report-action-btn" title="View" onClick={() => navigate(`/invoices/${inv._id}`)}>
                              <Icon icon="lucide:eye" width={15} />
                            </button>
                            <button className="report-action-btn" title="Edit" onClick={() => navigate(`/invoices/edit/${inv._id}`)}>
                              <Icon icon="lucide:edit-3" width={15} />
                            </button>
                            <button className="report-action-btn danger" title="Delete" onClick={() => { setSelectedIds([inv._id]); setShowDeleteModal(true); }}>
                              <Icon icon="lucide:trash-2" width={15} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                  {invoices.length === 0 && (
                    <tr><td colSpan="8" className="text-center py-5 border-0" style={{ color: 'var(--bs-secondary-color)' }}>No invoices found matching your criteria.</td></tr>
                  )}
                </tbody>
              </Table>
            </div>

            {/* Pagination */}
            {totalInvoices > 0 && (
              <div className="d-flex flex-wrap justify-content-between align-items-center px-2 py-3 mt-2">
                <span style={{ color: 'var(--bs-secondary-color)', fontSize: '0.9375rem' }}>
                  Showing {Math.min((currentPage - 1) * perPage + 1, totalInvoices)} to {Math.min(currentPage * perPage, totalInvoices)} of {totalInvoices} results
                </span>
                <Pagination className="report-pagination mb-0">
                  <Pagination.Prev onClick={() => setCurrentPage(p => Math.max(1, p - 1))} disabled={currentPage === 1}>
                    <Icon icon="lucide:chevron-left" width={16} />
                  </Pagination.Prev>
                  {Array.from({ length: Math.min(totalPages, 5) }, (_, i) => i + 1).map(p => (
                    <Pagination.Item key={p} active={p === currentPage} onClick={() => setCurrentPage(p)}>{p}</Pagination.Item>
                  ))}
                  {totalPages > 5 && <Pagination.Ellipsis />}
                  {totalPages > 5 && (
                    <Pagination.Item onClick={() => setCurrentPage(totalPages)}>{totalPages}</Pagination.Item>
                  )}
                  <Pagination.Next onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))} disabled={currentPage === totalPages}>
                    <Icon icon="lucide:chevron-right" width={16} />
                  </Pagination.Next>
                </Pagination>
              </div>
            )}
          </>
        )}
      </Card>

      <Modal show={showDeleteModal} onHide={() => setShowDeleteModal(false)} centered backdrop="static" contentClassName="border-0">
        <Modal.Body className="text-center p-5" style={{ backgroundColor: 'var(--bs-body-bg)', color: 'var(--bs-body-color)', borderRadius: '0.5rem' }}>
          <div className="mb-4 d-inline-flex align-items-center justify-content-center rounded-circle" style={{ width: 80, height: 80, backgroundColor: 'rgba(239, 68, 68, 0.15)', color: '#ef4444' }}>
            <Icon icon="lucide:alert-triangle" width={40} />
          </div>
          <h4 className="fw-bold mb-3">Are you sure?</h4>
          <p className="text-muted mb-4" style={{ fontSize: '15px' }}>
            You are about to delete {selectedIds.length > 1 ? `${selectedIds.length} invoices` : 'this invoice'}. This action cannot be undone completely (it will be marked as cancelled in historical records).
          </p>
          <div className="d-flex justify-content-center gap-3">
            <Button variant="secondary" className="px-4 py-2 fw-medium" onClick={() => setShowDeleteModal(false)} disabled={deleting}>
              Cancel
            </Button>
            <Button variant="danger" className="px-4 py-2 fw-medium" onClick={handleDelete} disabled={deleting}>
              {deleting ? <Spinner size="sm" /> : 'Yes, Delete!'}
            </Button>
          </div>
        </Modal.Body>
      </Modal>

    </div>
  );
}
