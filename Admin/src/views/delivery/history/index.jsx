import React, { useEffect, useState } from 'react';
import { Card, Table, Spinner, Badge } from 'react-bootstrap';
import { fetchApi } from '@/utils/api';
import PageHeader from '@/components/common/PageHeader';
import { formatDate } from '@/utils/format';
import { toast } from 'react-hot-toast';

export default function DeliveryHistory() {
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

  const completedDeliveries = orders.filter(o => o.status === 'Delivered' || o.status === 'Rejected');

  if (loading) {
    return <div className="text-center p-5"><Spinner animation="border" /></div>;
  }

  return (
    <div>
      <PageHeader title="Delivery History" />

      <Card className="border-0 shadow-sm">
        <Card.Body className="p-0">
          {completedDeliveries.length === 0 ? (
            <div className="text-center p-5 text-muted">
              No delivery history found.
            </div>
          ) : (
            <Table responsive hover className="align-middle mb-0 text-nowrap table-borderless">
              <thead className="bg-body-secondary border-bottom border-light">
                <tr className="text-body text-uppercase font-size-13 fw-semibold tracking-wider">
                  <th className="ps-4">Order #</th>
                  <th>Customer</th>
                  <th>Date</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {completedDeliveries.map(order => (
                  <tr key={order._id} style={{ borderBottom: '1px solid var(--kuiklo-border-color)' }}>
                    <td className="ps-4 fw-bold">{order.orderNumber}</td>
                    <td>
                      <div className="fw-medium">{order.customer?.name}</div>
                      <small className="text-muted">{order.customer?.phone}</small>
                    </td>
                    <td>{formatDate(order.createdAt)}</td>
                    <td>
                      <Badge bg={order.status === 'Delivered' ? 'success' : 'danger'}>
                        {order.status}
                      </Badge>
                    </td>
                  </tr>
                ))}
              </tbody>
            </Table>
          )}
        </Card.Body>
      </Card>
    </div>
  );
}
