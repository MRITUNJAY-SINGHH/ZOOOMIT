import React, { useEffect, useState } from 'react';
import { Button, Card, Form, Table, Dropdown, Modal, ListGroup, Badge, Row, Col } from 'react-bootstrap';
import { Edit, Eye, Plus, Trash2, MoreVertical, Download } from 'lucide-react';
import { useNavigate } from 'react-router';
import api from '@/utils/api';
import { generatePremiumInvoicePDF } from '@/utils/invoicePdfGenerator';
import PageHeader from '@/components/common/PageHeader';
import ActionBar from '@/components/common/ActionBar';
import SearchBar from '@/components/common/SearchBar';
import FilterBar from '@/components/common/FilterBar';
import StatusBadge from '@/components/common/StatusBadge';
import EmptyState from '@/components/common/EmptyState';
import ErrorState from '@/components/common/ErrorState';
import SkeletonTable from '@/components/common/SkeletonTable';
import DeleteModal from '@/components/common/DeleteModal';
import PaginationComponent from '@/components/common/PaginationComponent';
import { formatCurrency, formatDate } from '@/utils/format';
import { toast } from 'react-hot-toast';

export default function InvoicesList() {
  const navigate = useNavigate();
  const [invoices, setInvoices] = useState([]);
  const [settings, setSettings] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(15);
  const [totalPages, setTotalPages] = useState(1);
  const [totalRecords, setTotalRecords] = useState(0);
  const [selectedIds, setSelectedIds] = useState([]);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [quickViewInvoice, setQuickViewInvoice] = useState(null);

  const fetchInvoices = async () => {
    setLoading(true);
    setError(null);
    try {
      const query = new URLSearchParams({ page: currentPage, limit: pageSize, search, status }).toString();
      const res = await api.get(`/invoices?${query}`);
      setInvoices(res.data.invoices || []);
      setTotalPages(res.data.pages || 1);
      setTotalRecords(res.data.total || 0);
    } catch (err) {
      setError(err.message);
      toast.error('Failed to load invoices');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchInvoices(); }, [currentPage, pageSize, search, status]);

  useEffect(() => {
    api.get('/settings').then(res => setSettings(res.data)).catch(() => {});
  }, []);

  const handleDelete = async () => {
    if (selectedIds.length === 0) return;
    setDeleting(true);
    try {
      await api.post('/invoices/bulk-delete', { ids: selectedIds });
      toast.success('Invoice updated');
      setSelectedIds([]);
      setDeleteOpen(false);
      fetchInvoices();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to delete invoice');
    } finally {
      setDeleting(false);
    }
  };

  const toggleAll = (checked) => setSelectedIds(checked ? invoices.map((invoice) => invoice._id) : []);
  const toggleOne = (id) => setSelectedIds((prev) => prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]);

  const downloadInvoicePDF = (invoice) => {
    generatePremiumInvoicePDF(invoice, settings);
  };

  return (
    <div className="report-page pt-1">
      <div className="report-header">
        <div className="report-header-left">
          <h3 className="report-title">Invoices</h3>
        </div>
      </div>

      <ActionBar
        left={(
          <>
            <SearchBar placeholder="Search invoices..." value={search} onChange={(value) => { setSearch(value); setCurrentPage(1); }} />
            <FilterBar
              filters={[{
                name: 'status',
                label: 'Status',
                value: status,
                onChange: (value) => { setStatus(value); setCurrentPage(1); },
                options: [
                  { value: 'all', label: 'All Statuses' },
                  { value: 'Draft', label: 'Draft' },
                  { value: 'Pending', label: 'Pending' },
                  { value: 'Paid', label: 'Paid' },
                  { value: 'Overdue', label: 'Overdue' },
                  { value: 'Cancelled', label: 'Cancelled' },
                ],
              }]}
              onClear={() => { setStatus('all'); setSearch(''); setCurrentPage(1); }}
            />
            <Form.Select
              value={pageSize}
              onChange={(e) => { setPageSize(Number(e.target.value)); setCurrentPage(1); }}
              size="sm"
              style={{ width: 'auto', minWidth: '110px' }}
            >
              <option value={10}>10 / page</option>
              <option value={15}>15 / page</option>
              <option value={20}>20 / page</option>
              <option value={50}>50 / page</option>
            </Form.Select>
          </>
        )}
        count={totalRecords}
        onRefresh={fetchInvoices}
        right={(
          <>
            {selectedIds.length > 0 && <Button variant="outline-danger" onClick={() => setDeleteOpen(true)}><Trash2 size={20} />Cancel Selected</Button>}
            <Button variant="primary" onClick={() => navigate('/invoices/create')}><Plus size={20} />Create Invoice</Button>
          </>
        )}
      />

      <Card>
        <Card.Body>
          {loading ? <SkeletonTable rows={8} columns={8} /> : error ? (
            <ErrorState message={error} onRetry={fetchInvoices} />
          ) : invoices.length === 0 ? (
            <EmptyState icon="lucide:file-text" title="No invoices found" message="Create your first invoice or adjust current filters." actionLabel="Create Invoice" onAction={() => navigate('/invoices/create')} />
          ) : (
            <>
              <Table responsive hover className="align-middle mb-0">
                <thead>
                  <tr>
                    <th style={{ width: 48 }}>
                      <Form.Check checked={selectedIds.length === invoices.length && invoices.length > 0} onChange={(event) => toggleAll(event.target.checked)} />
                    </th>
                    <th className="text-nowrap">Invoice</th>
                    <th className="text-nowrap">Date</th>
                    <th className="text-nowrap">Customer</th>
                    <th>Items</th>
                    <th className="text-end text-nowrap">Amount</th>
                    <th className="text-nowrap">Status</th>
                    <th className="text-end text-nowrap">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {invoices.map((invoice) => (
                    <tr key={invoice._id}>
                      <td><Form.Check checked={selectedIds.includes(invoice._id)} onChange={() => toggleOne(invoice._id)} /></td>
                      <td className="fw-semibold text-primary text-nowrap">{invoice.invoiceNumber}</td>
                      <td className="text-muted text-nowrap">{formatDate(invoice.date)}</td>
                      <td>
                        <div className="fw-semibold text-nowrap">{invoice.customerSnapshot?.name || 'Walk-in Customer'}</div>
                        <div className="text-muted text-nowrap" style={{ fontSize: '0.875rem' }}>{invoice.customerSnapshot?.email || invoice.customerSnapshot?.phone || '-'}</div>
                      </td>
                      <td className="text-muted">
                        <span className="text-truncate d-inline-block" style={{ maxWidth: '200px' }}>
                          {invoice.productSnapshot?.[0]?.productName || '-'}
                        </span>
                      </td>
                      <td className="text-end fw-semibold text-nowrap">{formatCurrency(invoice.totalsSnapshot?.amount)}</td>
                      <td className="text-nowrap"><StatusBadge status={invoice.status || (invoice.isCancelled ? 'Cancelled' : 'Paid')} /></td>
                      <td className="text-end">
                        <Dropdown align="end">
                          <Dropdown.Toggle variant="link" className="text-muted p-0 border-0 hide-caret" style={{ background: 'transparent' }}>
                            <MoreVertical size={20} />
                          </Dropdown.Toggle>
                          <Dropdown.Menu className="shadow-sm border-0" style={{ minWidth: '160px', zIndex: 1050 }}>
                            <Dropdown.Item onClick={() => setQuickViewInvoice(invoice)} className="d-flex align-items-center gap-2 py-2">
                              <Eye size={16} className="text-muted" /> Quick View
                            </Dropdown.Item>
                            <Dropdown.Item onClick={() => navigate(`/invoices/edit/${invoice._id}`)} className="d-flex align-items-center gap-2 py-2">
                              <Edit size={16} className="text-muted" /> Edit
                            </Dropdown.Item>
                            <Dropdown.Item onClick={() => downloadInvoicePDF(invoice)} className="d-flex align-items-center gap-2 py-2">
                              <Download size={16} className="text-muted" /> Download
                            </Dropdown.Item>
                            <Dropdown.Divider />
                            <Dropdown.Item onClick={() => { setSelectedIds([invoice._id]); setDeleteOpen(true); }} className="d-flex align-items-center gap-2 py-2 text-danger">
                              <Trash2 size={16} /> Delete
                            </Dropdown.Item>
                          </Dropdown.Menu>
                        </Dropdown>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </Table>
              <PaginationComponent
                currentPage={currentPage}
                totalPages={totalPages}
                totalRecords={totalRecords}
                pageSize={pageSize}
                onPageChange={setCurrentPage}
                onPageSizeChange={(value) => { setPageSize(value); setCurrentPage(1); }}
              />
            </>
          )}
        </Card.Body>
      </Card>

      <Modal show={!!quickViewInvoice} onHide={() => setQuickViewInvoice(null)} centered size="lg">
        <Modal.Header closeButton><Modal.Title>Invoice Details</Modal.Title></Modal.Header>
        <Modal.Body>
          {quickViewInvoice && (
            <Table responsive className="align-middle mb-0">
              <tbody>
                <tr><th>Invoice Number</th><td className="fw-semibold text-primary">{quickViewInvoice.invoiceNumber}</td></tr>
                <tr><th>Customer</th><td>{quickViewInvoice.customerSnapshot?.name || 'Walk-in Customer'}</td></tr>
                <tr><th>Amount</th><td className="fw-semibold">{formatCurrency(quickViewInvoice.totalsSnapshot?.amount)}</td></tr>
                <tr><th>Payment Method</th><td>{quickViewInvoice.paymentMethod || '-'}</td></tr>
                <tr><th>Status</th><td><StatusBadge status={quickViewInvoice.status || (quickViewInvoice.isCancelled ? 'Cancelled' : 'Paid')} /></td></tr>
                <tr><th>Date</th><td>{formatDate(quickViewInvoice.date)}</td></tr>
                <tr><th>Due Date</th><td>{quickViewInvoice.dueDate ? formatDate(quickViewInvoice.dueDate) : '-'}</td></tr>
                <tr><th>Items Count</th><td>{quickViewInvoice.productSnapshot?.length || 0} items</td></tr>
                <tr><th>Notes</th><td>{quickViewInvoice.notes || '-'}</td></tr>
              </tbody>
            </Table>
          )}
        </Modal.Body>
      </Modal>

      <DeleteModal
        show={deleteOpen}
        itemName={selectedIds.length > 1 ? `${selectedIds.length} invoices` : 'this invoice'}
        busy={deleting}
        onCancel={() => setDeleteOpen(false)}
        onConfirm={handleDelete}
      />
    </div>
  );
}
