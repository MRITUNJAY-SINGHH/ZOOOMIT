import React from 'react';
import { Card, Table } from 'react-bootstrap';
import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router';
import api from '@/utils/api';
import EmptyState from '@/components/common/EmptyState';
import ErrorState from '@/components/common/ErrorState';
import LoadingSkeleton from '@/components/common/LoadingSkeleton';
import { formatDate } from '@/utils/format';

export default function ExpiringSoon() {
  const { data: batchesData, isLoading: loading, error, refetch: loadData } = useQuery({
    queryKey: ['expiringSoon'],
    queryFn: async () => {
      const res = await api.get('/inventory/expiring?days=30');
      return (res.data || []).slice(0, 5);
    }
  });

  const batches = batchesData || [];
  const errorMessage = error?.message;

  return (
    <Card className="h-100">
      <Card.Body>
        <div className="d-flex justify-content-between align-items-center mb-3">
          <h2 className="Zooom-section-title mb-0">Expiring Soon</h2>
          <Link to="/inventory/expiring" className="btn btn-danger btn-sm">View All</Link>
        </div>
        {loading ? <LoadingSkeleton rows={5} columns={4} /> : error ? <ErrorState message={errorMessage} onRetry={loadData} /> : batches.length === 0 ? (
          <EmptyState icon="lucide:calendar-check" title="No expiring batches" message="No batches expire in the next 30 days." />
        ) : (
          <Table responsive hover className="align-middle mb-0">
            <tbody>
              {batches.map((batch) => (
                <tr key={batch._id}>
                  <td className="fw-semibold">{batch.product?.name || '-'}</td>
                  <td className="text-muted">{batch.batchNumber || '-'}</td>
                  <td className="text-end text-danger fw-semibold">{formatDate(batch.expiryDate)}</td>
                </tr>
              ))}
            </tbody>
          </Table>
        )}
      </Card.Body>
    </Card>
  );
}
