import React, { useEffect, useState } from 'react';
import { Card, Button, Spinner, Badge } from 'react-bootstrap';
import { fetchApi } from '@/utils/api';
import PageHeader from '@/components/common/PageHeader';
import { Truck, CheckCircle, Package } from 'lucide-react';
import { toast } from 'react-hot-toast';

export default function DeliveryDashboard() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadMyDeliveries();
  }, []);

  const loadMyDeliveries = async () => {
    try {
      const res = await fetchApi('/orders/delivery/my-orders');
      setOrders(res.data || res);
    } catch (e) {
      toast.error('Failed to load deliveries');
    } finally {
      setLoading(false);
    }
  };

  const activeDeliveries = orders.filter(o => o.status !== 'Delivered' && o.status !== 'Rejected');
  const completedDeliveries = orders.filter(o => o.status === 'Delivered');

  const updateStatus = async (id, status) => {
    try {
      await fetchApi(`/orders/delivery/${id}/status`, {
        method: 'PUT',
        body: JSON.stringify({ status })
      });
      toast.success(`Order marked as ${status}`);
      loadMyDeliveries();
    } catch (e) {
      toast.error(e.message);
    }
  };

  if (loading) {
    return <div className="text-center p-5"><Spinner animation="border" /></div>;
  }

  return (
    <div>
      <PageHeader title="My Deliveries" />

      <div className="row mb-4">
        <div className="col-md-6 col-xl-4">
          <Card className="border-0 shadow-sm mb-3">
            <Card.Body className="d-flex align-items-center gap-3">
              <div className="bg-primary-subtle text-primary p-3 rounded-circle">
                <Truck size={24} />
              </div>
              <div>
                <h6 className="text-muted mb-1">Active Deliveries</h6>
                <h3 className="mb-0 fw-bold">{activeDeliveries.length}</h3>
              </div>
            </Card.Body>
          </Card>
        </div>
        <div className="col-md-6 col-xl-4">
          <Card className="border-0 shadow-sm mb-3">
            <Card.Body className="d-flex align-items-center gap-3">
              <div className="bg-success-subtle text-success p-3 rounded-circle">
                <CheckCircle size={24} />
              </div>
              <div>
                <h6 className="text-muted mb-1">Completed Today</h6>
                <h3 className="mb-0 fw-bold">{completedDeliveries.length}</h3>
              </div>
            </Card.Body>
          </Card>
        </div>
      </div>

      <h5 className="mb-3 fw-bold">Current Assignments</h5>
      {activeDeliveries.length === 0 ? (
        <Card className="border-0 shadow-sm text-center p-5">
          <Package size={48} className="text-muted mb-3 mx-auto" />
          <h5 className="text-muted">No active deliveries</h5>
        </Card>
      ) : (
        <div className="row">
          {activeDeliveries.map(order => (
            <div className="col-md-6 mb-3" key={order._id}>
              <Card className="border-0 shadow-sm h-100">
                <Card.Body>
                  <div className="d-flex justify-content-between mb-3">
                    <h6 className="mb-0 fw-bold">{order.orderNumber}</h6>
                    <Badge bg="primary">{order.status}</Badge>
                  </div>
                  <p className="mb-1"><strong>Customer:</strong> {order.customer?.name}</p>
                  <p className="mb-3"><strong>Phone:</strong> {order.customer?.phone}</p>
                  
                  <div className="d-flex gap-2">
                    {order.status === 'Pending' || order.status === 'Assigned' ? (
                      <>
                        <Button variant="success" size="sm" onClick={() => updateStatus(order._id, 'Accepted')}>Accept</Button>
                        <Button variant="outline-danger" size="sm" onClick={() => updateStatus(order._id, 'Rejected')}>Reject</Button>
                      </>
                    ) : order.status === 'Accepted' ? (
                      <Button variant="primary" size="sm" onClick={() => updateStatus(order._id, 'Picked Up')}>Pick Up</Button>
                    ) : order.status === 'Picked Up' ? (
                      <Button variant="info" size="sm" onClick={() => updateStatus(order._id, 'Out For Delivery')}>Start Delivery</Button>
                    ) : order.status === 'Out For Delivery' ? (
                      <Button variant="success" size="sm" onClick={() => updateStatus(order._id, 'Delivered')}>Mark Delivered</Button>
                    ) : null}
                  </div>
                </Card.Body>
              </Card>
            </div>
          ))}
        </div>
      )}

      <h5 className="mb-3 mt-5 fw-bold">Delivery History</h5>
      {completedDeliveries.length === 0 ? (
        <Card className="border-0 shadow-sm text-center p-5">
          <h6 className="text-muted mb-0">No completed deliveries yet</h6>
        </Card>
      ) : (
        <Card className="border-0 shadow-sm">
          <div className="table-responsive">
            <table className="table table-hover mb-0 align-middle">
              <thead className="bg-light">
                <tr>
                  <th className="border-0">Order #</th>
                  <th className="border-0">Customer</th>
                  <th className="border-0">Amount</th>
                  <th className="border-0">Date</th>
                  <th className="border-0">Status</th>
                </tr>
              </thead>
              <tbody>
                {completedDeliveries.map(order => (
                  <tr key={order._id}>
                    <td><span className="fw-medium">{order.orderNumber}</span></td>
                    <td>
                      <div className="fw-medium">{order.customer?.name}</div>
                      <div className="text-muted small">{order.customer?.phone}</div>
                    </td>
                    <td>₹{order.amount?.toFixed(2)}</td>
                    <td>{new Date(order.createdAt).toLocaleDateString()}</td>
                    <td><Badge bg="success">Delivered</Badge></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}
    </div>
  );
}
