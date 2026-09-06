import React from 'react';
import { Card, Table, Badge } from 'react-bootstrap';
import { useQuery } from '@tanstack/react-query';
import { Link, useNavigate } from 'react-router';
import { ArrowUpRight, CreditCard, Wallet, Smartphone, Banknote } from 'lucide-react';
import api from '@/utils/api';
import EmptyState from '@/components/common/EmptyState';
import ErrorState from '@/components/common/ErrorState';
import LoadingSkeleton from '@/components/common/LoadingSkeleton';
import { formatCurrency, formatDateTime } from '@/utils/format';

const methodIcon = (method) => {
  switch (method?.toLowerCase()) {
    case 'cash':
      return <Banknote size={14} className="text-success me-1" />;
    case 'upi':
      return <Smartphone size={14} className="text-primary me-1" />;
    case 'card':
      return <CreditCard size={14} className="text-info me-1" />;
    default:
      return <Wallet size={14} className="text-secondary me-1" />;
  }
};

const statusBadge = (status) => {
  switch (status?.toLowerCase()) {
    case 'success':
    case 'paid':
      return <Badge bg="success-subtle" className="text-success border border-success-subtle">Success</Badge>;
    case 'failed':
      return <Badge bg="danger-subtle" className="text-danger border border-danger-subtle">Failed</Badge>;
    case 'refunded':
      return <Badge bg="warning-subtle" className="text-warning border border-warning-subtle">Refunded</Badge>;
    default:
      return <Badge bg="secondary-subtle" className="text-secondary">{status || 'Pending'}</Badge>;
  }
};

export default function RecentTransactions({ refreshKey = 0 }) {
  const navigate = useNavigate();

  const { data: txsData, isLoading: loading, error, refetch: loadData } = useQuery({
    queryKey: ['recentTransactions', refreshKey],
    queryFn: async () => {
      const res = await api.get('/reports/recent-transactions');
      return Array.isArray(res.data) ? res.data : [];
    }
  });

  const transactions = txsData || [];
  const errorMessage = error?.message;

  return (
    <Card className="h-100 shadow-sm border">
      <Card.Body>
        <div className="d-flex justify-content-between align-items-center mb-3">
          <div>
            <h5 className="fw-bold mb-0">Recent Payments & Transactions</h5>
            <small className="text-muted">Live financial stream across all payment channels</small>
          </div>
          <Link to="/reports/payments" className="btn btn-primary btn-sm d-flex align-items-center gap-1 shadow-sm">
            View All Payments <ArrowUpRight size={14} />
          </Link>
        </div>

        {loading ? (
          <LoadingSkeleton rows={5} columns={5} />
        ) : error ? (
          <ErrorState message={errorMessage} onRetry={loadData} />
        ) : transactions.length === 0 ? (
          <EmptyState icon="lucide:credit-card" title="No transactions recorded" message="Payment transactions will appear here as orders and POS sales occur." />
        ) : (
          <div className="table-responsive">
            <Table hover className="align-middle mb-0 text-nowrap">
              <thead>
                <tr className="border-bottom" style={{ borderColor: 'var(--bs-border-color)' }}>
                  <th className="text-muted bg-transparent border-0 py-2 small fw-semibold">Txn / Order</th>
                  <th className="text-muted bg-transparent border-0 py-2 small fw-semibold">Method</th>
                  <th className="text-muted bg-transparent border-0 py-2 small fw-semibold text-end">Amount</th>
                  <th className="text-muted bg-transparent border-0 py-2 small fw-semibold text-center">Status</th>
                  <th className="text-muted bg-transparent border-0 py-2 small fw-semibold text-end">Date & Time</th>
                </tr>
              </thead>
              <tbody>
                {transactions.slice(0, 6).map((tx) => (
                  <tr key={tx._id} style={{ cursor: 'pointer' }} onClick={() => navigate('/reports/payments')}>
                    <td>
                      <div className="fw-semibold text-primary">
                        {tx.order?.orderNumber || tx.order?.billNumber || tx.transactionId || tx._id.slice(-6).toUpperCase()}
                      </div>
                      <small className="text-muted">{tx.order?.customer?.name || 'Walk-In Customer'}</small>
                    </td>
                    <td>
                      <div className="d-flex align-items-center">
                        {methodIcon(tx.paymentMethod)}
                        <span className="fw-medium">{tx.paymentMethod || 'Cash'}</span>
                      </div>
                    </td>
                    <td className="text-end fw-bold">
                      {formatCurrency(tx.amount || 0)}
                    </td>
                    <td className="text-center">
                      {statusBadge(tx.paymentStatus)}
                    </td>
                    <td className="text-end text-muted small">
                      {formatDateTime(tx.createdAt)}
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
