import React, { useEffect, useState } from 'react';
import { Button, Card, Col, Modal, Row, Table, Form } from 'react-bootstrap';
import { Eye, Mail, Phone, Edit, Trash2 } from 'lucide-react';
import api from '@/utils/api';
import PageHeader from '@/components/common/PageHeader';
import ActionBar from '@/components/common/ActionBar';
import SearchBar from '@/components/common/SearchBar';
import StatusBadge from '@/components/common/StatusBadge';
import SkeletonTable from '@/components/common/SkeletonTable';
import EmptyState from '@/components/common/EmptyState';
import ErrorState from '@/components/common/ErrorState';
import PaginationComponent from '@/components/common/PaginationComponent';
import { usePageSize } from '@/hooks/usePageSize';
import StatisticsCard from '@/components/common/StatisticsCard';
import ConfirmModal from '@/components/common/ConfirmModal';
import { formatCurrency, formatDate } from '@/utils/format';
import { toast } from 'react-hot-toast';

export default function Customers() {
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [search, setSearch] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = usePageSize(50);
  const [totalPages, setTotalPages] = useState(1);
  const [totalRecords, setTotalRecords] = useState(0);
  const [selectedCustomer, setSelectedCustomer] = useState(null);
  const [detailsLoading, setDetailsLoading] = useState(false);
  
  const [editModal, setEditModal] = useState(false);
  const [formData, setFormData] = useState({ name: '', phone: '', email: '', customerType: 'WALK_IN', status: 'Active', address: { street: '', city: '', state: '', zipCode: '' } });
  const [saving, setSaving] = useState(false);
  
  const [deleteModal, setDeleteModal] = useState(false);
  const [customerToDelete, setCustomerToDelete] = useState(null);

  const fetchCustomers = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await api.get(`/customers?page=${currentPage}&limit=${pageSize}&search=${search}`);
      setCustomers(res.data.data || []);
      setTotalPages(res.data.totalPages || 1);
      setTotalRecords(res.data.total || 0);
    } catch (err) {
      setError(err.message);
      toast.error('Failed to load customers');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchCustomers();  }, [currentPage, pageSize, search]);

  const viewCustomer = async (id) => {
    setDetailsLoading(true);
    setSelectedCustomer({});
    try {
      const res = await api.get(`/customers/${id}`);
      setSelectedCustomer(res.data);
    } catch (err) {
      toast.error('Failed to load customer');
      setSelectedCustomer(null);
    } finally {
      setDetailsLoading(false);
    }
  };

  const openAddModal = () => {
    setFormData({ name: '', phone: '', email: '', customerType: 'WALK_IN', status: 'Active', address: { street: '', city: '', state: '', zipCode: '' } });
    setEditModal(true);
  };

  const openEditModal = (customer) => {
    const defaultAddress = customer.addresses && customer.addresses.length > 0 ? customer.addresses[0] : { street: '', city: '', state: '', zipCode: '' };
    setFormData({
      _id: customer._id,
      name: customer.name || '',
      phone: customer.phone || '',
      email: customer.email || '',
      customerType: customer.customerType || 'WALK_IN',
      status: customer.status || 'Active',
      address: {
        street: defaultAddress.street || '',
        city: defaultAddress.city || '',
        state: defaultAddress.state || '',
        zipCode: defaultAddress.zipCode || ''
      }
    });
    setEditModal(true);
  };

  const saveCustomer = async () => {
    if (!formData.name || !formData.phone) return toast.error('Name and phone are required');
    setSaving(true);
    try {
      const payload = { ...formData };
      if (payload.address && (payload.address.street || payload.address.city)) {
        payload.addresses = [{ label: 'Billing/Shipping', ...payload.address }];
      }
      delete payload.address;

      if (formData._id) {
        await api.put(`/customers/${formData._id}`, payload);
        toast.success('Customer updated successfully');
      } else {
        await api.post(`/customers`, payload);
        toast.success('Customer added successfully');
      }
      setEditModal(false);
      fetchCustomers();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to save customer');
    } finally {
      setSaving(false);
    }
  };

  const openDeleteModal = (customer) => {
    setCustomerToDelete(customer);
    setDeleteModal(true);
  };

  const deleteCustomer = async () => {
    setSaving(true);
    try {
      await api.delete(`/customers/${customerToDelete._id}`);
      toast.success('Customer deleted successfully');
      setDeleteModal(false);
      fetchCustomers();
    } catch (err) {
      toast.error('Failed to delete customer');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="report-page pt-1">
      <PageHeader title="Customers" />
      <ActionBar
        left={<SearchBar placeholder="Search name, phone or email..." value={search} onChange={(value) => { setSearch(value); setCurrentPage(1); }} />}
        count={totalRecords}
        onRefresh={fetchCustomers}
        onAdd={openAddModal}
        addLabel="Add Customer"
      />
      <Card>
        <Card.Body>
          {loading ? <SkeletonTable rows={8} columns={7} /> : error ? <ErrorState message={error} onRetry={fetchCustomers} /> : customers.length === 0 ? (
            <EmptyState icon="lucide:users" title="No customers found" message="Customer records will appear after orders or customer creation." />
          ) : (
            <>
              <Table responsive hover className="align-middle mb-0">
                <thead><tr><th>Customer</th><th>Contact</th><th>Type</th><th className="text-end">Orders</th><th className="text-end">Spent</th><th>Joined</th><th className="text-end">Actions</th></tr></thead>
                <tbody>
                  {customers.map((customer) => (
                    <tr key={customer._id}>
                      <td><div className="fw-semibold">{customer.name}</div><div className="text-muted">{customer.email || '-'}</div></td>
                      <td><div className="d-flex align-items-center gap-2 text-muted"><Phone size={20} />{customer.phone}</div></td>
                      <td><StatusBadge status={customer.customerType || 'WALK_IN'} variant={customer.customerType === 'APP' ? 'info' : 'secondary'} /></td>
                      <td className="text-end fw-semibold">{customer.totalOrders || 0}</td>
                      <td className="text-end fw-semibold">{formatCurrency(customer.totalSpent || 0)}</td>
                      <td className="text-muted">{formatDate(customer.createdAt)}</td>
                      <td className="text-end">
                        <Button variant="light" className="Zooom-icon-btn me-1" onClick={() => viewCustomer(customer._id)}><Eye size={20} /></Button>
                        <Button variant="light" className="Zooom-icon-btn me-1" onClick={() => openEditModal(customer)}><Edit size={20} /></Button>
                        <Button variant="light" className="Zooom-icon-btn text-danger" onClick={() => openDeleteModal(customer)}><Trash2 size={20} /></Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </Table>
              <PaginationComponent currentPage={currentPage} totalPages={totalPages} totalRecords={totalRecords} onPageChange={setCurrentPage} pageSize={pageSize} onPageSizeChange={setPageSize} />
            </>
          )}
        </Card.Body>
      </Card>

      <Modal show={Boolean(selectedCustomer)} onHide={() => setSelectedCustomer(null)} size="lg" centered>
        <Modal.Header closeButton><Modal.Title>Customer Profile</Modal.Title></Modal.Header>
        <Modal.Body>
          {detailsLoading ? <SkeletonTable rows={4} columns={3} /> : selectedCustomer?._id ? (
            <>
              <Table responsive className="align-middle mb-4">
                <tbody>
                  <tr><th>Name</th><td>{selectedCustomer.name}</td></tr>
                  <tr><th>Phone</th><td>{selectedCustomer.phone}</td></tr>
                  <tr><th>Email</th><td>{selectedCustomer.email || '-'}</td></tr>
                  <tr><th>Status</th><td><StatusBadge status={selectedCustomer.status} /></td></tr>
                  <tr><th>Total Orders</th><td>{selectedCustomer.stats?.totalOrders ?? selectedCustomer.totalOrders ?? 0}</td></tr>
                  <tr><th>Total Spending</th><td className="fw-semibold">{formatCurrency(selectedCustomer.stats?.totalSpent ?? selectedCustomer.totalSpent ?? 0)}</td></tr>
                  <tr><th>Last Order</th><td>{selectedCustomer.stats?.lastOrderDate ? formatDate(selectedCustomer.stats.lastOrderDate) : '-'}</td></tr>
                </tbody>
              </Table>
              <h2 className="Zooom-section-title mb-3">Order History</h2>
              <Table responsive hover className="align-middle mb-0">
                <thead><tr><th>Order</th><th>Date</th><th>Type</th><th>Status</th><th className="text-end">Amount</th></tr></thead>
                <tbody>
                  {(selectedCustomer.orderHistory || []).length === 0 ? <tr><td colSpan="5" className="text-center text-muted py-4">No orders found</td></tr> : selectedCustomer.orderHistory.map((order) => (
                    <tr key={order._id}>
                      <td className="fw-semibold text-primary">{order.orderNumber}</td>
                      <td>{formatDate(order.createdAt)}</td>
                      <td><StatusBadge status={order.orderType} /></td>
                      <td><StatusBadge status={order.status} /></td>
                      <td className="text-end fw-semibold">{formatCurrency(order.amount)}</td>
                    </tr>
                  ))}
                </tbody>
              </Table>
            </>
          ) : null}
        </Modal.Body>
      </Modal>

      {/* Add/Edit Customer Modal */}
      <Modal show={editModal} onHide={() => setEditModal(false)} centered size="md">
        <Modal.Header closeButton className="border-0 pb-0">
          <Modal.Title className="fw-bold fs-4">{formData._id ? 'Edit Customer' : 'Add Customer'}</Modal.Title>
        </Modal.Header>
        <Modal.Body className="p-4">
          <div className="p-4 rounded-3 mb-0" style={{ backgroundColor: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.05)' }}>
            <h6 className="fw-bold mb-4 text-white">Customer Information</h6>
            <Row className="g-3">
              <Col md={12}>
                <Form.Group>
                  <Form.Label className="text-white-50 small text-uppercase fw-bold text-nowrap">Full Name <span className="text-danger">*</span></Form.Label>
                  <Form.Control value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} placeholder="Enter customer name" />
                </Form.Group>
              </Col>
              <Col md={12}>
                <Form.Group>
                  <Form.Label className="text-white-50 small text-uppercase fw-bold text-nowrap">Phone Number <span className="text-danger">*</span></Form.Label>
                  <Form.Control value={formData.phone} onChange={(e) => setFormData({ ...formData, phone: e.target.value })} placeholder="e.g. 9000000000" />
                </Form.Group>
              </Col>
              <Col md={12}>
                <Form.Group>
                  <Form.Label className="text-white-50 small text-uppercase fw-bold text-nowrap">Email Address</Form.Label>
                  <Form.Control type="email" value={formData.email} onChange={(e) => setFormData({ ...formData, email: e.target.value })} placeholder="customer@example.com" />
                </Form.Group>
              </Col>
              <Col md={12}>
                <Form.Group>
                  <Form.Label className="text-white-50 small text-uppercase fw-bold text-nowrap">Customer Type</Form.Label>
                  <Form.Select value={formData.customerType} onChange={(e) => setFormData({ ...formData, customerType: e.target.value })}>
                    <option value="WALK_IN">Walk In</option>
                    <option value="APP">App User</option>
                  </Form.Select>
                </Form.Group>
              </Col>
              <Col md={12}>
                <Form.Group>
                  <Form.Label className="text-white-50 small text-uppercase fw-bold text-nowrap">Status</Form.Label>
                  <Form.Select value={formData.status} onChange={(e) => setFormData({ ...formData, status: e.target.value })}>
                    <option value="Active">Active</option>
                    <option value="Inactive">Inactive</option>
                  </Form.Select>
                </Form.Group>
              </Col>
            </Row>

            <h6 className="fw-bold mb-4 mt-4 text-white">Billing / Shipping Details</h6>
            <Row className="g-3">
              <Col md={12}>
                <Form.Group>
                  <Form.Label className="text-white-50 small text-uppercase fw-bold text-nowrap">Street Address</Form.Label>
                  <Form.Control value={formData.address.street} onChange={(e) => setFormData({ ...formData, address: { ...formData.address, street: e.target.value } })} placeholder="123 Main St" />
                </Form.Group>
              </Col>
              <Col md={6}>
                <Form.Group>
                  <Form.Label className="text-white-50 small text-uppercase fw-bold text-nowrap">City</Form.Label>
                  <Form.Control value={formData.address.city} onChange={(e) => setFormData({ ...formData, address: { ...formData.address, city: e.target.value } })} placeholder="City" />
                </Form.Group>
              </Col>
              <Col md={3}>
                <Form.Group>
                  <Form.Label className="text-white-50 small text-uppercase fw-bold text-nowrap">State</Form.Label>
                  <Form.Control value={formData.address.state} onChange={(e) => setFormData({ ...formData, address: { ...formData.address, state: e.target.value } })} placeholder="State" />
                </Form.Group>
              </Col>
              <Col md={3}>
                <Form.Group>
                  <Form.Label className="text-white-50 small text-uppercase fw-bold text-nowrap">Zip Code</Form.Label>
                  <Form.Control value={formData.address.zipCode} onChange={(e) => setFormData({ ...formData, address: { ...formData.address, zipCode: e.target.value } })} placeholder="Zip Code" />
                </Form.Group>
              </Col>
            </Row>
          </div>
        </Modal.Body>
        <Modal.Footer className="border-0 pt-0 px-4 pb-4">
          <Button variant="secondary" onClick={() => setEditModal(false)}>Cancel</Button>
          <Button variant="primary" disabled={saving} onClick={saveCustomer}>{saving ? 'Saving...' : 'Save Changes'}</Button>
        </Modal.Footer>
      </Modal>

      <ConfirmModal
        show={deleteModal}
        title="Delete Customer"
        message={`Are you sure you want to delete ${customerToDelete?.name}? This action cannot be undone.`}
        confirmText={saving ? 'Deleting...' : 'Delete'}
        confirmVariant="danger"
        onConfirm={deleteCustomer}
        onCancel={() => setDeleteModal(false)}
      />
    </div>
  );
}

