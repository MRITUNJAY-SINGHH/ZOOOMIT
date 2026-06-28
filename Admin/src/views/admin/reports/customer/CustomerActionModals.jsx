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
          .customer-modal-backdrop {
            backdrop-filter: blur(20px) saturate(200%);
            -webkit-backdrop-filter: blur(20px) saturate(200%);
            background-color: rgba(0, 0, 0, 0.7) !important;
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
        <Modal show={show} onHide={onHide} size="lg" centered backdropClassName="customer-modal-backdrop">
        <Modal.Header closeButton className="border-bottom-0 pb-0">
          <Modal.Title className="fw-bold fs-4">Customer Profile</Modal.Title>
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
                    <h2 className="mb-1 fw-bolder" style={{ letterSpacing: '-0.5px', fontSize: '1.6rem' }}>{customer.name}</h2>
                    <div className="text-muted d-flex align-items-center flex-wrap gap-3" style={{ fontSize: '15px' }}>
                      <a href={`tel:${customer.phone}`} className="d-flex align-items-center text-muted text-decoration-none">
                        <Icon icon="lucide:phone" width={16} className="me-2 opacity-75" />{customer.phone}
                      </a>
                      {customer.email && (
                        <a href={`mailto:${customer.email}`} className="d-flex align-items-center text-muted text-decoration-none">
                          <Icon icon="lucide:mail" width={16} className="me-2 opacity-75" />{customer.email}
                        </a>
                      )}
                    </div>
                  </div>
                </div>
                <Button variant="primary" size="sm" className="px-3 py-2 fw-semibold d-inline-flex align-items-center gap-1" style={{ fontSize: '13px', pointerEvents: 'none' }}>
                  <Icon icon="lucide:circle-check" width={14} /> {customer.status || 'Active'}
                </Button>
              </div>
              
              <div className="row g-3 mb-4">
                {[
                  { label: 'Total Orders', value: customer.stats?.totalOrders || 0, icon: 'lucide:shopping-bag', bg: 'rgba(108, 92, 231, 0.2)', color: '#7c6fe0' },
                  { label: 'Total Spent', value: `₹${(customer.stats?.totalSpent || 0).toLocaleString()}`, icon: 'lucide:credit-card', bg: 'rgba(16, 185, 129, 0.2)', color: '#10b981' },
                  { label: 'Avg. Order Value', value: `₹${(customer.stats?.totalOrders > 0 ? Math.round((customer.stats?.totalSpent || 0) / customer.stats.totalOrders) : 0).toLocaleString()}`, icon: 'lucide:trending-up', bg: 'rgba(245, 158, 11, 0.2)', color: '#f59e0b' },
                ].map((s, i) => (
                  <div className="col-md-4" key={i}>
                    <Card className="report-stat-card h-100">
                      <Card.Body className="d-flex align-items-center p-3">
                        <div className="stat-icon rounded-circle me-3 flex-shrink-0" style={{ width: 44, height: 44, background: s.bg, color: s.color, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                          <Icon icon={s.icon} width={20} />
                        </div>
                        <div className="d-flex flex-column flex-grow-1 overflow-hidden">
                          <div className="stat-value text-truncate" style={{ fontSize: '1.25rem', fontWeight: '700', lineHeight: 1 }}>
                            {s.value}
                          </div>
                          <div className="stat-label mt-1 text-truncate" style={{ fontSize: '13px', color: 'var(--bs-secondary-color)', fontWeight: '500' }}>{s.label}</div>
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
                            <Badge bg="primary" className="px-2 py-1" style={{ fontSize: '12px' }}>{o.orderType}</Badge>
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
          .customer-modal-backdrop {
            backdrop-filter: blur(20px) saturate(200%);
            -webkit-backdrop-filter: blur(20px) saturate(200%);
            background-color: rgba(0, 0, 0, 0.7) !important;
          }
        `}</style>
        <Modal show={show} onHide={onHide} centered backdropClassName="customer-modal-backdrop">
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
          .customer-modal-backdrop {
            backdrop-filter: blur(20px) saturate(200%);
            -webkit-backdrop-filter: blur(20px) saturate(200%);
            background-color: rgba(0, 0, 0, 0.7) !important;
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
        <Modal show={show} onHide={onHide} centered backdropClassName="customer-modal-backdrop">
        <Modal.Body className="pt-5 pb-4 px-4">
          <button type="button" className="btn-close position-absolute top-0 end-0 m-3" onClick={onHide}></button>
          <div className="text-center">
            <div className="d-inline-flex align-items-center justify-content-center rounded-circle mb-4" style={{ width: '100px', height: '100px', background: 'rgba(239, 68, 68, 0.12)' }}>
              <Icon icon="lucide:trash-2" width={44} className="text-danger" />
            </div>
            <h3 className="mb-2 fw-bold">Delete Customer?</h3>
            <p className="text-muted mb-4 mx-auto" style={{ fontSize: '15px', maxWidth: '320px', lineHeight: '1.6' }}>
              This action cannot be undone. The customer profile will be permanently removed. Order records will be preserved.
            </p>
            <div className="d-flex justify-content-center gap-3">
              <Button 
                variant="dark" 
                onClick={onHide} 
                disabled={loading} 
                className="px-4 py-2 fw-semibold custom-cancel-btn"
                style={{ minWidth: '120px' }}
              >
                Cancel
              </Button>
              <Button 
                variant="danger" 
                onClick={handleDelete} 
                disabled={loading} 
                className="px-4 py-2 fw-semibold d-inline-flex align-items-center justify-content-center"
                style={{ minWidth: '120px' }}
              >
                {loading && <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>}
                {loading ? 'Deleting...' : 'Yes, Delete'}
              </Button>
            </div>
          </div>
        </Modal.Body>
      </Modal>
      </>
    );
  }

  return null;
}

