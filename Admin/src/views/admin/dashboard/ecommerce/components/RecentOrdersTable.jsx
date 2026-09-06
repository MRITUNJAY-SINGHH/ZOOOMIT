import React from 'react';
import { Card, Table, Badge } from 'react-bootstrap';
import { useQuery } from '@tanstack/react-query';
import { Link, useNavigate } from 'react-router';
import { ArrowUpRight, ShoppingCart } from 'lucide-react';
import api from '@/utils/api';
import EmptyState from '@/components/common/EmptyState';
import ErrorState from '@/components/common/ErrorState';
import LoadingSkeleton from '@/components/common/LoadingSkeleton';
import StatusBadge from '@/components/common/StatusBadge';
import { formatCurrency, formatDateTime } from '@/utils/format';

export default function RecentOrdersTable({ refreshKey = 0 }) {
  const navigate = useNavigate();

  const { data: ordersData, isLoading: loading, error, refetch: loadData } = useQuery({
    queryKey: ['recentOrders', refreshKey],
    queryFn: async () => {
      const res = await api.get('/orders?page=1&limit=6');
      return res.data?.data || [];
    }
  });

  const orders = ordersData || [];
  const errorMessage = error?.message;

  return (
    <Card className="h-100 shadow-sm border">
      <Card.Body>
        <div className="d-flex justify-content-between align-items-center mb-3">
          <div>
            <h5 className="fw-bold mb-0 d-flex align-items-center gap-1">
              <ShoppingCart size={18} className="text-primary" /> Recent Orders
            </h5>
            <small className="text-muted">Live queue of online & POS orders</small>
          </div>
          <Link to="/orders/all" className="btn btn-primary btn-sm d-flex align-items-center gap-1 shadow-sm">
            View All Orders <ArrowUpRight size={14} />
          </Link>
        </div>

        {loading ? (
          <LoadingSkeleton rows={5} columns={5} />
        ) : error ? (
          <ErrorState message={errorMessage} onRetry={loadData} />
        ) : orders.length === 0 ? (
          <EmptyState icon="lucide:shopping-cart" title="No orders found" message="Recent orders will appear here as they are placed." />
        ) : (
          <div className="table-responsive">
            <Table hover className="align-middle mb-0 text-nowrap">
              <thead>
                <tr className="border-bottom" style={{ borderColor: 'var(--bs-border-color)' }}>
                  <th className="text-muted bg-transparent border-0 py-2 small fw-semibold">Order #</th>
                  <th className="text-muted bg-transparent border-0 py-2 small fw-semibold">Customer</th>
                  <th className="text-muted bg-transparent border-0 py-2 small fw-semibold">Channel</th>
                  <th className="text-muted bg-transparent border-0 py-2 small fw-semibold text-end">Amount</th>
                  <th className="text-muted bg-transparent border-0 py-2 small fw-semibold text-center">Status</th>
                  <th className="text-muted bg-transparent border-0 py-2 small fw-semibold text-end">Placed At</th>
                </tr>
              </thead>
              <tbody>
                {orders.map((order) => (
                  <tr key={order._id} style={{ cursor: 'pointer' }} onClick={() => navigate('/orders/all')}>
                    <td>
                      <span className="fw-semibold text-primary">{order.orderNumber}</span>
                    </td>
                    <td>
                      <div className="fw-medium">{order.customer?.name || 'Walk-In Customer'}</div>
                      <small className="text-muted">{order.customer?.phone || '-'}</small>
                    </td>
                    <td>
                      <Badge bg={order.orderType === 'ONLINE' ? 'info-subtle' : 'success-subtle'} className={order.orderType === 'ONLINE' ? 'text-info border border-info-subtle' : 'text-success border border-success-subtle'}>
                        {order.orderType === 'ONLINE' ? 'Online' : 'POS Counter'}
                      </Badge>
                    </td>
                    <td className="text-end fw-bold">
                      {formatCurrency(order.amount)}
                    </td>
                    <td className="text-center">
                      <StatusBadge status={order.status} />
                    </td>
                    <td className="text-end text-muted small">
                      {formatDateTime(order.createdAt)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </Table>
          </div>
        )}
      </Card.Body>
    </Card>
  );
}
