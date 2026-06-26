import React, { useState, useEffect } from 'react';
import { Modal, Button, Form, Badge, Table, Card } from 'react-bootstrap';
import { Icon } from '@/components/common/LucideIcon';
import api from '@/utils/api';
import { toast } from 'react-hot-toast';
import SkeletonTable from '@/components/common/SkeletonTable';

export default function CustomerActionModals({ 
  show, 
  onHide, 
  modalType, 
  customerId, 
  onSuccess 
}) {
  const [loading, setLoading] = useState(false);
  const [customer, setCustomer] = useState(null);
  
  // Edit Form State
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    customerType: 'Walk-In',
    status: 'Active'
  });

  useEffect(() => {
    if (show && customerId && modalType !== 'delete') {
      fetchCustomerDetails();
    }
  }, [show, customerId, modalType]);

  const fetchCustomerDetails = async () => {
    try {
      setLoading(true);
      const res = await api.get(`/customers/${customerId}`);
      const data = res.data;
      setCustomer(data);
      if (modalType === 'edit') {
        setFormData({
          name: data.name || '',
          email: data.email || '',
          phone: data.phone || '',
          customerType: data.customerType || 'Walk-In',
          status: data.status || 'Active'
        });
      }
    } catch (error) {
      toast.error('Failed to load customer details');
      onHide();
    } finally {
      setLoading(false);
    }
  };

  const handleEditSubmit = async (e) => {
    e.preventDefault();
    try {
      setLoading(true);
      await api.put(`/customers/${customerId}`, formData);
      toast.success('Customer updated successfully');
      if (onSuccess) onSuccess();
      onHide();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to update customer');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    try {
      setLoading(true);
      await api.delete(`/customers/${customerId}`);
      toast.success('Customer deleted successfully');
      if (onSuccess) onSuccess();
      onHide();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to delete customer');
    } finally {
      setLoading(false);
    }
  };

  if (modalType === 'view') {
    return (
      <>
        <style>{`
          .backdrop-blur {
            backdrop-filter: blur(4px);
            -webkit-backdrop-filter: blur(4px);
            background-color: rgba(0, 0, 0, 0.4) !important;
          }
          .custom-cancel-btn {
            background-color: #303641 !important;
            border-color: #303641 !important;
            color: #fff !important;
          }
          .custom-cancel-btn:hover {
            background-color: #3d4452 !important;
            border-color: #3d4452 !important;
          }
        `}</style>
        <Modal show={show} onHide={onHide} size="lg" centered backdropClassName="backdrop-blur">
        <Modal.Header closeButton className="border-bottom-0 pb-0">
          <Modal.Title className="fw-bold fs-5">Customer Profile</Modal.Title>
        </Modal.Header>
        <Modal.Body className="pt-2 px-4 pb-4">
          {loading ? (
            <SkeletonTable rows={3} columns={3} />
          ) : customer ? (
            <div>
              <div className="d-flex justify-content-between align-items-center mb-4 pb-4 border-bottom border-dashed" style={{ borderColor: 'var(--bs-border-color) !important' }}>
                <div className="d-flex align-items-center">
                  <div className="avatar-md me-3 flex-shrink-0">
                    <span className="avatar-title rounded bg-primary-subtle text-primary fs-3">
                      {customer.name.substring(0, 2).toUpperCase()}
                    </span>
                  </div>
                  <div>
                    <h3 className="mb-1 fw-bolder" style={{ letterSpacing: '-0.5px' }}>{customer.name}</h3>
                    <div className="text-muted d-flex align-items-center" style={{ fontSize: '14px' }}>
                      <div className="d-flex align-items-center me-3">
                        <Icon icon="lucide:phone" width={14} className="me-1 opacity-75" />
                        <a href={`tel:${customer.phone}`} className="text-muted text-decoration-none hover-primary">{customer.phone}</a>
                      </div>
                      {customer.email && (
                        <div className="d-flex align-items-center">
                          <Icon icon="lucide:mail" width={14} className="me-1 opacity-75" />
                          <a href={`mailto:${customer.email}`} className="text-muted text-decoration-none hover-primary">{customer.email}</a>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
                <Badge bg={customer.status === 'Active' ? 'success' : 'danger'} className="px-3 py-2 fs-6">
                  {customer.status || 'Active'}
                </Badge>
              </div>
              
              <div className="row g-3 mb-4 pb-4 border-bottom border-dashed" style={{ borderColor: 'var(--bs-border-color) !important' }}>
                {[
                  { label: 'Total Orders', value: customer.stats?.totalOrders || 0, icon: 'lucide:shopping-bag', color: '#6b5eae' },
                  { label: 'Total Spent', value: `₹${(customer.stats?.totalSpent || 0).toLocaleString()}`, icon: 'lucide:credit-card', color: '#10b981' },
                  { label: 'Last Order', value: customer.stats?.lastOrderDate ? new Date(customer.stats.lastOrderDate).toLocaleDateString() : 'Never', icon: 'lucide:calendar', color: '#f59e0b' },
                ].map((s, i) => (
                  <div className="col-md-4" key={i}>
                    <Card style={{ backgroundColor: 'var(--theme-table-bg)', border: `var(--theme-border-width) dashed var(--theme-border-color)`, borderRadius: '12px' }}>
                      <Card.Body className="p-3">
                        <div className="d-flex align-items-center">
                          <div className="rounded-circle d-flex justify-content-center align-items-center me-3" style={{ width: '40px', height: '40px', backgroundColor: `${s.color}15`, color: s.color }}>
                            <Icon icon={s.icon} width={20} />
                          </div>
                          <div>
                            <h5 className="mb-0 fw-bold" style={{ color: 'var(--bs-body-color)' }}>{s.value}</h5>
                            <span className="text-muted" style={{ fontSize: '12px' }}>{s.label}</span>
                          </div>
                        </div>
                      </Card.Body>
                    </Card>
                  </div>
                ))}
              </div>

              <h6 className="mb-3 fw-bold text-muted text-uppercase" style={{ fontSize: '12px', letterSpacing: '0.5px' }}>Recent Order History</h6>
              <div className="table-responsive rounded-3" style={{ border: `var(--theme-border-width) solid var(--theme-border-color)` }}>
                <Table className="align-middle mb-0" hover style={{ backgroundColor: 'transparent' }}>
                  <thead className="custom-table-thead">
                    <tr>
                      <th className="py-2 px-3 border-bottom text-muted fw-medium" style={{ fontSize: '12px' }}>ORDER #</th>
                      <th className="py-2 px-3 border-bottom text-muted fw-medium" style={{ fontSize: '12px' }}>DATE</th>
                      <th className="py-2 px-3 border-bottom text-muted fw-medium" style={{ fontSize: '12px' }}>TYPE</th>
                      <th className="py-2 px-3 border-bottom text-muted fw-medium" style={{ fontSize: '12px' }}>STATUS</th>
                      <th className="py-2 px-3 border-bottom text-muted fw-medium text-end" style={{ fontSize: '12px' }}>AMOUNT</th>
                    </tr>
                  </thead>
                  <tbody>
                    {(customer.orderHistory || []).length === 0 ? (
                      <tr>
                        <td colSpan="5" className="text-center py-5 border-0">
                          <div className="text-muted opacity-50 mb-2"><Icon icon="lucide:inbox" width={32} /></div>
                          <div className="text-muted" style={{ fontSize: '14px' }}>No orders found</div>
                        </td>
                      </tr>
                    ) : (
                      customer.orderHistory.map(o => (
                        <tr key={o._id}>
                          <td className="fw-semibold px-3 py-3 border-dashed" style={{ color: 'var(--bs-primary)', fontSize: '14px', whiteSpace: 'nowrap' }}>{o.orderNumber}</td>
                          <td className="text-muted px-3 py-3 border-dashed" style={{ fontSize: '14px', whiteSpace: 'nowrap' }}>{new Date(o.createdAt).toLocaleDateString()}</td>
                          <td className="px-3 py-3 border-dashed">
                            <Badge bg="info-subtle" text="info" className="px-2 py-1">{o.orderType}</Badge>
                          </td>
                          <td className="text-muted px-3 py-3 border-dashed" style={{ fontSize: '14px' }}>{o.status}</td>
                          <td className="text-end fw-bold px-3 py-3 border-dashed" style={{ fontSize: '14px' }}>₹{(o.amount || 0).toLocaleString()}</td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </Table>
              </div>
            </div>
          ) : (
            <div className="text-center py-5 text-danger">Error loading customer data</div>
          )}
        </Modal.Body>
      </Modal>
      </>
    );
  }

  if (modalType === 'edit') {
    return (
      <>
        <style>{`
          .backdrop-blur {
            backdrop-filter: blur(4px);
            -webkit-backdrop-filter: blur(4px);
            background-color: rgba(0, 0, 0, 0.4) !important;
          }
        `}</style>
        <Modal show={show} onHide={onHide} centered>
        <Modal.Header closeButton>
          <Modal.Title>Edit Customer</Modal.Title>
        </Modal.Header>
        <Form onSubmit={handleEditSubmit}>
          <Modal.Body>
            {loading && !customer ? (
              <div className="text-center py-4"><div className="spinner-border text-primary" /></div>
            ) : (
              <div className="row g-3">
                <Form.Group className="col-12">
                  <Form.Label>Full Name <span className="text-danger">*</span></Form.Label>
                  <Form.Control required type="text" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} placeholder="Enter customer name" />
                </Form.Group>
                <Form.Group className="col-12">
                  <Form.Label>Email Address</Form.Label>
                  <Form.Control type="email" value={formData.email} onChange={e => setFormData({...formData, email: e.target.value})} placeholder="Enter email address" />
                </Form.Group>
                <Form.Group className="col-12">
                  <Form.Label>Phone Number <span className="text-danger">*</span></Form.Label>
                  <Form.Control required type="text" value={formData.phone} onChange={e => setFormData({...formData, phone: e.target.value})} placeholder="Enter phone number" />
                </Form.Group>
                <Form.Group className="col-md-6">
                  <Form.Label>Customer Type</Form.Label>
                  <Form.Select value={formData.customerType} onChange={e => setFormData({...formData, customerType: e.target.value})}>
                    <option value="Walk-In">Walk-In</option>
                    <option value="Online">Online</option>
                    <option value="Corporate">Corporate</option>
                    <option value="VIP">VIP</option>
                  </Form.Select>
                </Form.Group>
                <Form.Group className="col-md-6">
                  <Form.Label>Status</Form.Label>
                  <Form.Select value={formData.status} onChange={e => setFormData({...formData, status: e.target.value})}>
                    <option value="Active">Active</option>
                    <option value="Inactive">Inactive</option>
                  </Form.Select>
                </Form.Group>
              </div>
            )}
          </Modal.Body>
          <Modal.Footer>
            <Button variant="light" onClick={onHide} disabled={loading}>Cancel</Button>
            <Button variant="primary" type="submit" disabled={loading}>
              {loading ? 'Saving...' : 'Save Changes'}
            </Button>
          </Modal.Footer>
        </Form>
      </Modal>
      </>
    );
  }

  if (modalType === 'delete') {
    return (
      <>
        <style>{`
          .backdrop-blur {
            backdrop-filter: blur(4px);
            -webkit-backdrop-filter: blur(4px);
            background-color: rgba(0, 0, 0, 0.4) !important;
          }
        `}</style>
        <Modal show={show} onHide={onHide} centered backdropClassName="backdrop-blur">
        <Modal.Header closeButton className="border-0 pb-0">
          <Modal.Title className="text-danger"></Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <div className="text-center pb-4 px-3">
            <Icon icon="lucide:alert-triangle" width={72} className="text-danger mb-4" />
            <h4 className="mb-3 fw-bold">Are you sure?</h4>
            <p className="text-muted mb-0" style={{ fontSize: '15px' }}>
              This action cannot be undone. This will permanently delete the customer's profile from the database. Order records will be preserved but delinked.
            </p>
          </div>
        </Modal.Body>
        <Modal.Footer className="justify-content-center border-0 pt-0 pb-4">
          <Button 
            variant="dark" 
            onClick={onHide} 
            disabled={loading} 
            className="px-4 py-2 fw-semibold custom-cancel-btn" 
          >
            Cancel
          </Button>
          <Button 
            variant="danger" 
            onClick={handleDelete} 
            disabled={loading} 
            className="px-4 py-2 fw-semibold d-inline-flex align-items-center"
          >
            {loading && <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>}
            {loading ? 'Deleting...' : 'Yes, Delete'}
          </Button>
        </Modal.Footer>
      </Modal>
      </>
    );
  }

  return null;
}

