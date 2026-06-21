import React, { useState, useEffect } from 'react';
import { Card, Row, Col, Table, Badge, Button, Modal, Form } from 'react-bootstrap';
import { fetchApi } from '@/utils/api';
import OrderTimeline from './OrderTimeline';

export default function OrderDetails({ orderId, onBack }) {
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  
  const [riders, setRiders] = useState([]);
  const [showRiderModal, setShowRiderModal] = useState(false);
  const [selectedRider, setSelectedRider] = useState('');

  useEffect(() => {
    loadOrder();
  }, [orderId]);

  const loadOrder = async () => {
    setLoading(true);
    try {
      const data = await fetchApi(`/orders/${orderId}`);
      setOrder(data);
    } catch (e) { alert(e.message); }
    setLoading(false);
  };

  const loadRiders = async () => {
    try {
      const data = await fetchApi('/users');
      setRiders(data.filter(u => u.role === 'DeliveryBoy'));
      setShowRiderModal(true);
    } catch (e) { alert(e.message); }
  };

  const updateStatus = async (newStatus) => {
    try {
      await fetchApi(`/orders/${orderId}`, { method: 'PUT', body: JSON.stringify({ status: newStatus, note: `Status updated to ${newStatus}` }) });
      loadOrder();
    } catch (e) { alert(e.message); }
  };

  const assignRider = async () => {
    if (!selectedRider) return alert('Select a rider');
    try {
      await fetchApi(`/orders/${orderId}/assign`, { method: 'PUT', body: JSON.stringify({ riderId: selectedRider }) });
      setShowRiderModal(false);
      loadOrder();
    } catch (e) { alert(e.message); }
  };

  const cancelOrder = async () => {
    const reason = prompt("Enter cancellation reason:");
    if (!reason) return;
    try {
      await fetchApi(`/orders/${orderId}/cancel`, { method: 'POST', body: JSON.stringify({ reason }) });
      loadOrder();
    } catch (e) { alert(e.message); }
  };

  if (loading) return <p>Loading order details...</p>;
  if (!order) return <p>Order not found</p>;

  return (
    <div>
      <div className="d-flex justify-content-between mb-3">
        <h2>Order: {order.orderNumber}</h2>
        <Button variant="secondary" onClick={onBack}>Back to Orders</Button>
      </div>

      <Row>
        <Col md={8}>
          <Card className="mb-3">
            <Card.Header className="d-flex justify-content-between align-items-center">
              <h5>Order Items</h5>
              <Badge bg={order.status === 'Delivered' ? 'success' : (order.status === 'Cancelled' ? 'danger' : 'primary')} className="fs-6">
                {order.status}
              </Badge>
            </Card.Header>
            <Card.Body>
              <Table striped bordered>
                <thead>
                  <tr><th>Product</th><th>Price</th><th>Qty</th><th>Total</th></tr>
                </thead>
                <tbody>
                  {order.items.map((i, idx) => (
                    <tr key={idx}>
                      <td>{i.productName} <small className="text-muted d-block">{i.sku || i.barcode}</small></td>
                      <td>${i.price}</td>
                      <td>{i.qty} {i.returnedQty > 0 && <Badge bg="danger">Returned {i.returnedQty}</Badge>}</td>
                      <td>${i.total}</td>
                    </tr>
                  ))}
                  <tr><td colSpan="3" className="text-end fw-bold">Subtotal</td><td>${order.subTotal.toFixed(2)}</td></tr>
                  <tr><td colSpan="3" className="text-end fw-bold">Amount Paid</td><td className="text-success fw-bold">${order.amount.toFixed(2)}</td></tr>
                </tbody>
              </Table>
            </Card.Body>
          </Card>

          <Card>
            <Card.Header><h5>State Machine Actions</h5></Card.Header>
            <Card.Body className="d-flex gap-2 flex-wrap">
              {order.status === 'Pending' && <Button variant="success" onClick={() => updateStatus('Confirmed')}>Confirm Order</Button>}
              {order.status === 'Confirmed' && <Button variant="warning" onClick={loadRiders}>Assign Rider</Button>}
              {order.status === 'Assigned' && <Button variant="primary" onClick={() => updateStatus('OutForDelivery')}>Mark Out For Delivery</Button>}
              {order.status === 'OutForDelivery' && <Button variant="success" onClick={() => updateStatus('Delivered')}>Mark Delivered</Button>}
              
              {['Pending', 'Confirmed', 'Assigned'].includes(order.status) && (
                <Button variant="danger" onClick={cancelOrder}>Cancel Order</Button>
              )}
            </Card.Body>
          </Card>
        </Col>
        <Col md={4}>
          <Card className="mb-3">
            <Card.Header><h5>Customer Info</h5></Card.Header>
            <Card.Body>
              {order.customer ? (
                <>
                  <p><strong>Name:</strong> {order.customer.name}</p>
                  <p><strong>Phone:</strong> {order.customer.phone}</p>
                  <p><strong>Email:</strong> {order.customer.email}</p>
                </>
              ) : <p>Guest / Walk-In Customer</p>}
            </Card.Body>
          </Card>
          
          <OrderTimeline orderId={orderId} />
        </Col>
      </Row>

      <Modal show={showRiderModal} onHide={() => setShowRiderModal(false)}>
        <Modal.Header closeButton><Modal.Title>Assign Rider</Modal.Title></Modal.Header>
        <Modal.Body>
          <Form.Select value={selectedRider} onChange={e => setSelectedRider(e.target.value)}>
            <option value="">Select Rider</option>
            {riders.map(r => <option key={r._id} value={r._id}>{r.name} - {r.phone}</option>)}
          </Form.Select>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="primary" onClick={assignRider}>Assign</Button>
        </Modal.Footer>
      </Modal>
    </div>
  );
}
