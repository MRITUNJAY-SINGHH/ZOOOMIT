import React, { useEffect, useState } from 'react';
import { Card, Table } from 'react-bootstrap';
import { Link } from 'react-router';
import api from '@/utils/api';
import EmptyState from '@/components/common/EmptyState';
import ErrorState from '@/components/common/ErrorState';
import LoadingSkeleton from '@/components/common/LoadingSkeleton';
import { formatDate } from '@/utils/format';

export default function ExpiringSoon() {
  const [batches, setBatches] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const loadData = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await api.get('/inventory/expiring?days=30');
      setBatches((res.data || []).slice(0, 5));
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadData(); }, []);

  return (
    <Card className="h-100">
      <Card.Body>
        <div className="d-flex justify-content-between align-items-center mb-3">
          <h2 className="kuiklo-section-title mb-0">Expiring Products</h2>
          <Link to="/inventory/upcoming-expiry" className="btn btn-primary btn-sm">View All</Link>
        </div>
        {loading ? <LoadingSkeleton rows={5} columns={3} /> : error ? <ErrorState message={error} onRetry={loadData} /> : batches.length === 0 ? (
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
