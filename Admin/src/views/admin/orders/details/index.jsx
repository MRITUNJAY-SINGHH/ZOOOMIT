import React, { useState, useEffect } from 'react';
import { Card, Row, Col, Table, Badge, Button, Modal, Form } from 'react-bootstrap';
import { Icon } from '@/components/common/LucideIcon';
import api from '@/utils/api';
import { toast } from 'react-hot-toast';
import SkeletonCard from '@/components/common/SkeletonCard';

const STATUS_COLORS = {
  Pending: 'warning', Confirmed: 'info', Assigned: 'primary',
  OutForDelivery: 'secondary', Delivered: 'success', Cancelled: 'danger', Returned: 'dark',
};

const TIMELINE_ICONS = {
  Pending: 'lucide:clock', Confirmed: 'lucide:check-circle', Assigned: 'lucide:user-check',
  OutForDelivery: 'lucide:truck', Delivered: 'lucide:package-check',
  Cancelled: 'lucide:x-circle', Returned: 'lucide:rotate-ccw',
};

export default function OrderDetails({ orderId, onBack }) {
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [riders, setRiders] = useState([]);
  const [showRiderModal, setShowRiderModal] = useState(false);
  const [selectedRider, setSelectedRider] = useState('');
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [cancelReason, setCancelReason] = useState('');

  useEffect(() => { loadOrder(); }, [orderId]);

  const loadOrder = async () => {
    setLoading(true);
    try {
      const res = await api.get(`/orders/${orderId}`);
      setOrder(res.data);
    } catch (e) { toast.error(e.message); }
    setLoading(false);
  };

  const loadRiders = async () => {
    try {
      const res = await api.get('/users');
      setRiders((res.data || []).filter(u => u.role === 'DeliveryBoy'));
      setShowRiderModal(true);
    } catch (e) { toast.error(e.message); }
  };

  const updateStatus = async (newStatus) => {
    try {
      await api.put(`/orders/${orderId}`, { status: newStatus, note: `Status updated to ${newStatus}` });
      toast.success(`Order marked as ${newStatus}`);
      loadOrder();
    } catch (e) { toast.error(e.message); }
  };

  const assignRider = async () => {
    if (!selectedRider) return toast.error('Select a rider');
    try {
      await api.put(`/orders/${orderId}/assign`, { riderId: selectedRider });
      setShowRiderModal(false);
      toast.success('Rider assigned');
      loadOrder();
    } catch (e) { toast.error(e.message); }
  };

  const cancelOrder = async () => {
    if (!cancelReason.trim()) return toast.error('Please provide a reason');
    try {
      await api.post(`/orders/${orderId}/cancel`, { reason: cancelReason });
      setShowCancelModal(false);
      setCancelReason('');
      toast.success('Order cancelled');
      loadOrder();
    } catch (e) { toast.error(e.message); }
  };

  if (loading) {
    return (
      <div>
        <div className="d-flex justify-content-between align-items-center mb-3">
          <div className="placeholder-glow"><span className="placeholder col-4" style={{ height: '24px' }}></span></div>
          <Button variant="outline-secondary" size="sm" onClick={onBack}>
            <Icon icon="lucide:arrow-left" className="me-1" width={14} />Back to Orders
          </Button>
        </div>
        <Row className="g-3">
          <Col md={8}><SkeletonCard lines={6} /></Col>
          <Col md={4}><SkeletonCard lines={4} /></Col>
        </Row>
      </div>
    );
  }

  if (!order) {
    return (
      <div className="text-center p-5">
        <Icon icon="lucide:alert-circle" className="text-danger mb-3" width={48} />
        <h5>Order not found</h5>
        <Button variant="outline-secondary" size="sm" onClick={onBack} className="mt-2">Back to Orders</Button>
      </div>
    );
  }

  return (
    <div>
      {/* Header */}
      <div className="d-flex justify-content-between align-items-center mb-4">
        <div>
          <h5 className="mb-1">
            Order #{order.orderNumber}
            <Badge bg={STATUS_COLORS[order.status] || 'secondary'} className="ms-2 fs-12">{order.status}</Badge>
          </h5>
          <small className="text-muted">
            Placed on {new Date(order.createdAt).toLocaleString()} • {order.orderType}
          </small>
        </div>
        <Button variant="outline-secondary" size="sm" onClick={onBack}>
          <Icon icon="lucide:arrow-left" className="me-1" width={14} />Back to Orders
        </Button>
      </div>

      <Row className="g-3">
        {/* Left Column: Items + Actions */}
        <Col lg={8}>
          {/* Order Items */}
          <Card className="mb-3">
            <Card.Header className="bg-transparent">
              <h6 className="mb-0">Order Items</h6>
            </Card.Header>
            <Card.Body className="p-0">
              <Table responsive className="align-middle mb-0">
                <thead className="table-light">
                  <tr>
                    <th className="ps-3">Product</th>
                    <th className="text-end">Price</th>
                    <th className="text-center">Qty</th>
                    <th className="text-end pe-3">Total</th>
                  </tr>
                </thead>
                <tbody>
                  {order.items.map((item, idx) => (
                    <tr key={idx}>
                      <td className="ps-3">
                        <span className="fw-medium">{item.productName}</span>
                        {(item.sku || item.barcode) && (
                          <small className="d-block text-muted">{item.sku || item.barcode}</small>
                        )}
                        {item.returnedQty > 0 && (
                          <Badge bg="danger" className="mt-1">Returned: {item.returnedQty}</Badge>
                        )}
                      </td>
                      <td className="text-end">₹{item.price}</td>
                      <td className="text-center">{item.qty}</td>
                      <td className="text-end pe-3 fw-medium">₹{item.total}</td>
                    </tr>
                  ))}
                </tbody>
                <tfoot className="table-light">
                  <tr>
                    <td colSpan="3" className="text-end ps-3 fw-medium">Subtotal</td>
                    <td className="text-end pe-3 fw-medium">₹{(order.subTotal || 0).toFixed(2)}</td>
                  </tr>
                  {order.discount > 0 && (
                    <tr>
                      <td colSpan="3" className="text-end ps-3 text-success fw-medium">Discount</td>
                      <td className="text-end pe-3 text-success fw-medium">-₹{order.discount.toFixed(2)}</td>
                    </tr>
                  )}
                  <tr className="fw-bold">
                    <td colSpan="3" className="text-end ps-3">Amount Paid</td>
                    <td className="text-end pe-3 text-success">₹{(order.amount || 0).toFixed(2)}</td>
                  </tr>
                </tfoot>
              </Table>
            </Card.Body>
          </Card>

          {/* Actions */}
          <Card>
            <Card.Header className="bg-transparent">
              <h6 className="mb-0">Actions</h6>
            </Card.Header>
            <Card.Body className="d-flex gap-2 flex-wrap">
              {order.status === 'Pending' && <Button variant="success" size="sm" onClick={() => updateStatus('Confirmed')}><Icon icon="lucide:check" className="me-1" width={14} />Confirm</Button>}
              {order.status === 'Confirmed' && <Button variant="warning" size="sm" onClick={loadRiders}><Icon icon="lucide:user-plus" className="me-1" width={14} />Assign Rider</Button>}
              {order.status === 'Assigned' && <Button variant="primary" size="sm" onClick={() => updateStatus('OutForDelivery')}><Icon icon="lucide:truck" className="me-1" width={14} />Out For Delivery</Button>}
              {order.status === 'OutForDelivery' && <Button variant="success" size="sm" onClick={() => updateStatus('Delivered')}><Icon icon="lucide:package-check" className="me-1" width={14} />Mark Delivered</Button>}
              {['Pending', 'Confirmed', 'Assigned'].includes(order.status) && (
                <Button variant="outline-danger" size="sm" onClick={() => setShowCancelModal(true)}>
                  <Icon icon="lucide:x-circle" className="me-1" width={14} />Cancel Order
                </Button>
              )}
              {!['Pending', 'Confirmed', 'Assigned', 'OutForDelivery'].some(s => s === order.status) && (
                <span className="text-muted small align-self-center">No actions available for this status.</span>
              )}
            </Card.Body>
          </Card>
        </Col>

        {/* Right Column: Customer + Payment + Timeline */}
        <Col lg={4}>
          {/* Customer */}
          <Card className="mb-3">
            <Card.Header className="bg-transparent">
              <h6 className="mb-0"><Icon icon="lucide:user" className="me-2" width={16} />Customer</h6>
            </Card.Header>
            <Card.Body>
              {order.customer ? (
                <>
                  <p className="mb-1 fw-medium">{order.customer.name}</p>
                  <p className="mb-1 text-muted small"><Icon icon="lucide:phone" width={12} className="me-1" />{order.customer.phone}</p>
                  {order.customer.email && <p className="mb-0 text-muted small"><Icon icon="lucide:mail" width={12} className="me-1" />{order.customer.email}</p>}
                </>
              ) : (
                <span className="text-muted">Walk-In Customer</span>
              )}
            </Card.Body>
          </Card>

          {/* Payment */}
          <Card className="mb-3">
            <Card.Header className="bg-transparent">
              <h6 className="mb-0"><Icon icon="lucide:credit-card" className="me-2" width={16} />Payment</h6>
            </Card.Header>
            <Card.Body>
              <div className="d-flex justify-content-between mb-2">
                <span className="text-muted small">Method</span>
                <span className="fw-medium">{order.paymentMethod || '-'}</span>
              </div>
              <div className="d-flex justify-content-between mb-2">
                <span className="text-muted small">Payment Status</span>
                <Badge bg={order.paymentStatus === 'Paid' ? 'success' : 'warning'}>{order.paymentStatus || 'Pending'}</Badge>
              </div>
              {order.refundStatus && order.refundStatus !== 'None' && (
                <div className="d-flex justify-content-between">
                  <span className="text-muted small">Refund</span>
                  <Badge bg={order.refundStatus === 'Processed' ? 'info' : 'danger'}>{order.refundStatus}</Badge>
                </div>
              )}
            </Card.Body>
          </Card>

          {/* Rider */}
          {order.rider && (
            <Card className="mb-3">
              <Card.Header className="bg-transparent">
                <h6 className="mb-0"><Icon icon="lucide:truck" className="me-2" width={16} />Delivery</h6>
              </Card.Header>
              <Card.Body>
                <p className="mb-1 fw-medium">{order.rider.name}</p>
                <p className="mb-0 text-muted small"><Icon icon="lucide:phone" width={12} className="me-1" />{order.rider.phone}</p>
              </Card.Body>
            </Card>
          )}

          {/* Timeline */}
          <Card>
            <Card.Header className="bg-transparent">
              <h6 className="mb-0"><Icon icon="lucide:clock" className="me-2" width={16} />Timeline</h6>
            </Card.Header>
            <Card.Body>
              {order.timeline && order.timeline.length > 0 ? (
                <div className="timeline-alt">
                  {order.timeline.map((event, idx) => (
                    <div key={idx} className="d-flex mb-3">
                      <div className="me-3 flex-shrink-0">
                        <div className="rounded-circle d-flex align-items-center justify-content-center" style={{ width: 32, height: 32, backgroundColor: 'var(--bs-light)' }}>
                          <Icon icon={TIMELINE_ICONS[event.status] || 'lucide:circle'} width={14} className={`text-${STATUS_COLORS[event.status] || 'muted'}`} />
                        </div>
                      </div>
                      <div>
                        <p className="mb-0 fw-medium small">{event.status}</p>
                        <small className="text-muted">{event.note}</small>
                        <br />
                        <small className="text-muted">{new Date(event.timestamp).toLocaleString()}</small>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-muted small mb-0">No timeline events yet.</p>
              )}
            </Card.Body>
          </Card>
        </Col>
      </Row>

      {/* Assign Rider Modal */}
      <Modal show={showRiderModal} onHide={() => setShowRiderModal(false)} centered>
        <Modal.Header closeButton><Modal.Title>Assign Rider</Modal.Title></Modal.Header>
        <Modal.Body>
          <Form.Select value={selectedRider} onChange={e => setSelectedRider(e.target.value)}>
            <option value="">Select Rider</option>
            {riders.map(r => <option key={r._id} value={r._id}>{r.name} — {r.phone}</option>)}
          </Form.Select>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" size="sm" onClick={() => setShowRiderModal(false)}>Cancel</Button>
          <Button variant="primary" size="sm" onClick={assignRider}>Assign</Button>
        </Modal.Footer>
      </Modal>

      {/* Cancel Modal */}
      <Modal show={showCancelModal} onHide={() => setShowCancelModal(false)} centered>
        <Modal.Header closeButton><Modal.Title>Cancel Order</Modal.Title></Modal.Header>
        <Modal.Body>
          <Form.Label>Cancellation Reason <span className="text-danger">*</span></Form.Label>
          <Form.Control as="textarea" rows={3} value={cancelReason} onChange={e => setCancelReason(e.target.value)} placeholder="Enter reason for cancellation..." />
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" size="sm" onClick={() => setShowCancelModal(false)}>Close</Button>
          <Button variant="danger" size="sm" onClick={cancelOrder}>Confirm Cancel</Button>
        </Modal.Footer>
      </Modal>
    </div>
  );
}
