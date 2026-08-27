import React from 'react';
import { Card, Table, Badge, Button } from 'react-bootstrap';
import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router';
import { AlertCircle, ArrowUpRight, Ban, SlidersHorizontal } from 'lucide-react';
import api from '@/utils/api';
import EmptyState from '@/components/common/EmptyState';
import ErrorState from '@/components/common/ErrorState';
import LoadingSkeleton from '@/components/common/LoadingSkeleton';
import { formatDate } from '@/utils/format';

export default function ExpiringSoon({ refreshKey = 0 }) {
  const { data: batchesData, isLoading: loading, error, refetch: loadData } = useQuery({
    queryKey: ['expiringSoon', refreshKey],
    queryFn: async () => {
      const res = await api.get('/inventory/expiring?days=30');
      return (res.data || []).slice(0, 5);
    }
  });

  const batches = batchesData || [];
  const errorMessage = error?.message;

  const getDaysRemaining = (expiryDate) => {
    if (!expiryDate) return null;
    const diffTime = new Date(expiryDate).getTime() - new Date().getTime();
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  };

  return (
    <Card className="h-100 shadow-sm border">
      <Card.Body>
        <div className="d-flex justify-content-between align-items-center mb-3">
          <div>
            <h5 className="fw-bold mb-0 d-flex align-items-center gap-1 text-danger">
              <AlertCircle size={18} /> Expiring & Perishables
            </h5>
            <small className="text-muted">Batches expiring within the next 30 days</small>
          </div>
          <Link to="/inventory/expiring" className="btn btn-danger btn-sm d-flex align-items-center gap-1 shadow-sm">
            View All <ArrowUpRight size={14} />
          </Link>
        </div>

        {loading ? (
          <LoadingSkeleton rows={5} columns={4} />
        ) : error ? (
          <ErrorState message={errorMessage} onRetry={loadData} />
        ) : batches.length === 0 ? (
          <EmptyState icon="lucide:calendar-check" title="No expiring batches" message="No perishable inventory batches expire in the next 30 days." />
        ) : (
          <div className="table-responsive">
            <Table hover className="align-middle mb-0 text-nowrap">
              <thead>
                <tr className="border-bottom" style={{ borderColor: 'var(--bs-border-color)' }}>
                  <th className="text-muted bg-transparent border-0 py-2 small fw-semibold">Product & Batch</th>
                  <th className="text-muted bg-transparent border-0 py-2 small fw-semibold text-center">Expiry & Days</th>
                  <th className="text-muted bg-transparent border-0 py-2 small fw-semibold text-end">Action</th>
                </tr>
              </thead>
              <tbody>
                {batches.map((batch) => {
                  const daysLeft = getDaysRemaining(batch.expiryDate);
                  const isExpired = daysLeft !== null && daysLeft <= 0;
                  const isCritical = daysLeft !== null && daysLeft <= 7;

                  return (
                    <tr key={batch._id}>
                      <td>
                        <div className="fw-semibold">{batch.product?.name || 'Perishable Item'}</div>
                        <small className="text-muted">
                          Batch: <span className="fw-medium text-secondary">{batch.batchNumber || '-'}</span> ({batch.stock || 0} {batch.unit || batch.product?.baseUnit || 'PCS'})
                        </small>
                      </td>
                      <td className="text-center">
                        <div className="fw-medium small">{formatDate(batch.expiryDate)}</div>
                        <Badge 
                          bg={isExpired ? 'danger' : isCritical ? 'danger-subtle' : 'warning-subtle'} 
                          className={isExpired ? 'text-white' : isCritical ? 'text-danger border border-danger-subtle' : 'text-warning border border-warning-subtle'}
                          style={{ fontSize: '0.72rem' }}
                        >
                          {isExpired ? 'Expired' : `${daysLeft} days left`}
                        </Badge>
                      </td>
                      <td className="text-end">
                        <div className="d-flex justify-content-end gap-1">
                          <Button 
                            as={Link} 
                            to={`/inventory/damage?productId=${batch.product?._id}&batchNumber=${encodeURIComponent(batch.batchNumber || '')}`}
                            variant="danger" 
                            size="sm" 
                            className="d-inline-flex align-items-center gap-1 py-1 px-2 shadow-sm"
                            style={{ fontSize: '0.75rem' }}
                            title="Record Damage / Write-off"
                          >
                            <Ban size={11} /> Write-Off
                          </Button>
                          <Button 
                            as={Link} 
                            to={`/inventory/adjustment?productId=${batch.product?._id}`}
                            variant="secondary" 
                            size="sm" 
                            className="d-inline-flex align-items-center gap-1 py-1 px-2 shadow-sm"
                            style={{ fontSize: '0.75rem' }}
                            title="Adjust Stock"
                          >
                            <SlidersHorizontal size={11} /> Adjust
                          </Button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </Table>
          </div>
        )}
      </Card.Body>
    </Card>
  );
}
