import React, { useState, useEffect } from 'react';
import { Card, Table, Button, Form, InputGroup, Modal, Badge } from 'react-bootstrap';
import { Icon } from '@/components/common/LucideIcon';
import api from '@/utils/api';
import { toast } from 'react-hot-toast';
import PageHeader from '@/components/common/PageHeader';
import SkeletonTable from '@/components/common/SkeletonTable';
import EmptyState from '@/components/common/EmptyState';

export default function Customers() {
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [search, setSearch] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalRecords, setTotalRecords] = useState(0);
  const [showDetails, setShowDetails] = useState(false);
  const [selectedCustomer, setSelectedCustomer] = useState(null);
  const [detailsLoading, setDetailsLoading] = useState(false);

  useEffect(() => { fetchCustomers(); }, [currentPage, search]);

  const fetchCustomers = async () => {
    try {
      setLoading(true); setError(null);
      const res = await api.get(`/customers?page=${currentPage}&limit=20&search=${search}`);
      setCustomers(res.data.data || []);
      setTotalPages(res.data.totalPages || 1);
      setTotalRecords(res.data.total || 0);
    } catch (err) { setError(err.message); toast.error('Failed to load customers'); }
    finally { setLoading(false); }
  };

  const handleViewDetails = async (id) => {
    try {
      setDetailsLoading(true); setShowDetails(true);
      const res = await api.get(`/customers/${id}`);
      setSelectedCustomer(res.data);
    } catch (err) { toast.error('Failed to load details'); setShowDetails(false); }
    finally { setDetailsLoading(false); }
  };

  return (
    <div>
      <PageHeader title="Customers" description="View customer profiles, order history, and spending insights." breadcrumbs={[{ label: 'Dashboard', path: '/dashboard' }, { label: 'Customers' }]} />
      <Card>
        <Card.Body>
          <div className="d-flex justify-content-between mb-3 align-items-center">
            <InputGroup size="sm" style={{ maxWidth: '280px' }}>
              <InputGroup.Text><Icon icon="lucide:search" width={14} /></InputGroup.Text>
              <Form.Control placeholder="Search name, phone, email..." value={search} onChange={(e) => { setSearch(e.target.value); setCurrentPage(1); }} />
            </InputGroup>
            <div className="d-flex gap-2 align-items-center">
              <span className="text-muted small">{totalRecords} records</span>
              <Button variant="outline-secondary" size="sm" onClick={fetchCustomers}><Icon icon="lucide:refresh-cw" width={14} /></Button>
            </div>
          </div>
          {loading ? <SkeletonTable rows={6} columns={5} /> : error ? (
            <div className="text-center p-5"><Icon icon="lucide:alert-triangle" className="text-danger" width={40} /><p className="text-muted mt-2">{error}</p><Button variant="outline-danger" size="sm" onClick={fetchCustomers}>Retry</Button></div>
          ) : customers.length === 0 ? (
            <EmptyState icon="lucide:users" title="No Customers Found" message="No customers match your search." />
          ) : (
            <>
              <Table responsive hover className="align-middle mb-0">
                <thead className="table-light"><tr><th>Name</th><th>Phone</th><th>Email</th><th>Joined</th><th className="text-end">Actions</th></tr></thead>
                <tbody>
                  {customers.map(c => (
                    <tr key={c._id}>
                      <td className="fw-medium">{c.name}</td>
                      <td className="text-muted">{c.phone}</td>
                      <td className="text-muted">{c.email || '-'}</td>
                      <td className="text-muted">{new Date(c.createdAt).toLocaleDateString()}</td>
                      <td className="text-end"><Button variant="light" size="sm" onClick={() => handleViewDetails(c._id)}><Icon icon="lucide:eye" width={16} /></Button></td>
                    </tr>
                  ))}
                </tbody>
              </Table>
              {totalPages > 1 && (
                <div className="d-flex justify-content-between align-items-center mt-3 pt-3 border-top">
                  <span className="text-muted small">Page {currentPage} of {totalPages}</span>
                  <div className="d-flex gap-2">
                    <Button variant="outline-secondary" size="sm" disabled={currentPage === 1} onClick={() => setCurrentPage(p => p - 1)}>Prev</Button>
                    <Button variant="outline-secondary" size="sm" disabled={currentPage === totalPages} onClick={() => setCurrentPage(p => p + 1)}>Next</Button>
                  </div>
                </div>
              )}
            </>
          )}
        </Card.Body>
      </Card>

      <Modal show={showDetails} onHide={() => setShowDetails(false)} size="lg" centered>
        <Modal.Header closeButton><Modal.Title>Customer Profile</Modal.Title></Modal.Header>
        <Modal.Body>
          {detailsLoading ? <SkeletonTable rows={3} columns={3} /> : selectedCustomer ? (
            <div>
              <div className="d-flex justify-content-between align-items-start mb-4">
                <div>
                  <h5 className="mb-1">{selectedCustomer.name}</h5>
                  <div className="text-muted small">
                    <Icon icon="lucide:phone" width={12} className="me-1" />{selectedCustomer.phone}
                    {selectedCustomer.email && <span className="ms-3"><Icon icon="lucide:mail" width={12} className="me-1" />{selectedCustomer.email}</span>}
                  </div>
                </div>
                <Badge bg="primary" className="p-2">Member since {new Date(selectedCustomer.createdAt).getFullYear()}</Badge>
              </div>
              <div className="row g-3 mb-4">
                {[
                  { label: 'Total Orders', value: selectedCustomer.stats?.totalOrders || 0 },
                  { label: 'Total Spent', value: `₹${(selectedCustomer.stats?.totalSpent || 0).toLocaleString()}` },
                  { label: 'Last Order', value: selectedCustomer.stats?.lastOrderDate ? new Date(selectedCustomer.stats.lastOrderDate).toLocaleDateString() : '-' },
                ].map((s, i) => (
                  <div className="col-md-4" key={i}><Card className="bg-light border-0"><Card.Body className="text-center"><div className="text-muted small mb-1">{s.label}</div><h5 className="mb-0">{s.value}</h5></Card.Body></Card></div>
                ))}
              </div>
              <h6 className="mb-3">Order History</h6>
              <Table size="sm" responsive hover className="align-middle">
                <thead className="table-light"><tr><th>Order #</th><th>Date</th><th>Type</th><th>Status</th><th className="text-end">Amount</th></tr></thead>
                <tbody>
                  {(selectedCustomer.orderHistory || []).length === 0 ? (
                    <tr><td colSpan="5" className="text-center py-3 text-muted">No orders found</td></tr>
                  ) : selectedCustomer.orderHistory.map(o => (
                    <tr key={o._id}>
                      <td className="fw-medium text-primary">{o.orderNumber}</td>
                      <td className="text-muted">{new Date(o.createdAt).toLocaleDateString()}</td>
                      <td><Badge bg={o.orderType === 'ONLINE' ? 'info' : 'secondary'}>{o.orderType}</Badge></td>
                      <td>{o.status}</td>
                      <td className="text-end fw-bold">₹{(o.amount || 0).toLocaleString()}</td>
                    </tr>
                  ))}
                </tbody>
              </Table>
            </div>
          ) : <div className="text-center py-5 text-danger">Error loading customer data</div>}
        </Modal.Body>
      </Modal>
    </div>
  );
}
