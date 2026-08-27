import React from 'react';
import { Card, Table, Badge } from 'react-bootstrap';
import { useQuery } from '@tanstack/react-query';
import { Link, useNavigate } from 'react-router';
import { ArrowUpRight, Award, Users } from 'lucide-react';
import api from '@/utils/api';
import EmptyState from '@/components/common/EmptyState';
import ErrorState from '@/components/common/ErrorState';
import LoadingSkeleton from '@/components/common/LoadingSkeleton';
import { formatCurrency } from '@/utils/format';

export default function TopCustomers({ refreshKey = 0 }) {
  const navigate = useNavigate();

  const { data: customerData, isLoading: loading, error, refetch: loadData } = useQuery({
    queryKey: ['topCustomers', refreshKey],
    queryFn: async () => {
      const res = await api.get('/reports/customer?sortBy=spent');
      return res.data?.topCustomers?.slice(0, 5) || [];
    }
  });

  const customers = customerData || [];
  const errorMessage = error?.message;

  return (
    <Card className="h-100 shadow-sm border">
      <Card.Body>
        <div className="d-flex justify-content-between align-items-center mb-3">
          <div>
            <h5 className="fw-bold mb-0 d-flex align-items-center gap-1">
              <Users size={18} className="text-info" /> Top Customers
            </h5>
            <small className="text-muted">Highest spending customers by lifetime value</small>
          </div>
          <Link to="/customers" className="btn btn-primary btn-sm d-flex align-items-center gap-1 shadow-sm">
            View All <ArrowUpRight size={14} />
          </Link>
        </div>

        {loading ? (
          <LoadingSkeleton rows={5} columns={4} />
        ) : error ? (
          <ErrorState message={errorMessage} onRetry={loadData} />
        ) : customers.length === 0 ? (
          <EmptyState icon="lucide:users" title="No customer activity" message="Top spending customers will appear here as orders are placed." />
        ) : (
          <div className="table-responsive">
            <Table hover className="align-middle mb-0 text-nowrap">
              <thead>
                <tr className="border-bottom" style={{ borderColor: 'var(--bs-border-color)' }}>
                  <th className="text-muted bg-transparent border-0 py-2 small fw-semibold">Customer</th>
                  <th className="text-muted bg-transparent border-0 py-2 small fw-semibold text-center">Orders Placed</th>
                  <th className="text-muted bg-transparent border-0 py-2 small fw-semibold text-end">Total Spent</th>
                </tr>
              </thead>
              <tbody>
                {customers.map((c, idx) => (
                  <tr key={c._id || idx} style={{ cursor: 'pointer' }} onClick={() => navigate(`/customers?search=${encodeURIComponent(c.customerPhone || c.customerName)}`)}>
                    <td>
                      <div className="d-flex align-items-center">
                        <span className="badge bg-secondary text-white me-2 fw-bold" style={{ fontSize: '0.75rem' }}>#{idx + 1}</span>
                        <div>
                          <div className="fw-semibold text-primary">{c.customerName || 'Store Customer'}</div>
                          <small className="text-muted">{c.customerPhone || '-'}</small>
                        </div>
                      </div>
                    </td>
                    <td className="text-center">
                      <Badge bg={c.orderCount > 3 ? 'success-subtle' : 'secondary-subtle'} className={c.orderCount > 3 ? 'text-success border border-success-subtle' : 'text-secondary border border-secondary-subtle'}>
                        {c.orderCount} {c.orderCount === 1 ? 'Order' : 'Orders'}
                      </Badge>
                    </td>
                    <td className="text-end fw-bold text-success">
                      {formatCurrency(c.totalSpent || 0)}
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
