import React from 'react';
import { Card, Table } from 'react-bootstrap';
import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router';
import api from '@/utils/api';
import EmptyState from '@/components/common/EmptyState';
import ErrorState from '@/components/common/ErrorState';
import LoadingSkeleton from '@/components/common/LoadingSkeleton';
import StatusBadge from '@/components/common/StatusBadge';
import { formatCurrency } from '@/utils/format';

export default function RecentOrdersTable() {
  const { data: ordersData, isLoading: loading, error, refetch: loadData } = useQuery({
    queryKey: ['recentOrders'],
    queryFn: async () => {
      const res = await api.get('/orders?page=1&limit=5');
      return res.data?.data || [];
    }
  });

  const orders = ordersData || [];
  const errorMessage = error?.message;

  return (
    <Card className="h-100">
      <Card.Body>
        <div className="d-flex justify-content-between align-items-center mb-3">
          <h2 className="kuiklo-section-title mb-0">Recent Orders</h2>
          <Link to="/orders/all" className="btn btn-primary btn-sm">View All</Link>
        </div>
        {loading ? <LoadingSkeleton rows={5} columns={5} /> : error ? <ErrorState message={errorMessage} onRetry={loadData} /> : orders.length === 0 ? (
          <EmptyState icon="lucide:shopping-cart" title="No orders" message="Recent orders will appear here." />
        ) : (
          <Table responsive hover className="align-middle mb-0">
            <tbody>
              {orders.map((order) => (
                <tr key={order._id}>
                  <td className="fw-semibold text-primary">{order.orderNumber}</td>
                  <td>{order.customer?.name || 'Walk-In'}</td>
                  <td><StatusBadge status={order.orderType} /></td>
                  <td className="text-end fw-semibold">{formatCurrency(order.amount)}</td>
                  <td className="text-end"><StatusBadge status={order.status} /></td>
                </tr>
              ))}
            </tbody>
          </Table>
        )}
      </Card.Body>
    </Card>
  );
}
