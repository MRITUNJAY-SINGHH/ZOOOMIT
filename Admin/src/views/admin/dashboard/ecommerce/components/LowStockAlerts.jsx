import React, { useEffect, useState } from 'react';
import { Card, Table } from 'react-bootstrap';
import { Link } from 'react-router';
import api from '@/utils/api';
import EmptyState from '@/components/common/EmptyState';
import ErrorState from '@/components/common/ErrorState';
import LoadingSkeleton from '@/components/common/LoadingSkeleton';
import StatusBadge from '@/components/common/StatusBadge';

export default function LowStockAlerts() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const loadData = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await api.get('/inventory/low-stock');
      setProducts((res.data || []).slice(0, 5));
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
          <h2 className="kuiklo-section-title mb-0">Low Stock Alerts</h2>
          <Link to="/inventory/low-stock" className="btn btn-light">View All</Link>
        </div>
        {loading ? <LoadingSkeleton rows={5} columns={3} /> : error ? <ErrorState message={error} onRetry={loadData} /> : products.length === 0 ? (
          <EmptyState icon="lucide:package-check" title="No low stock" message="All tracked products are above threshold." />
        ) : (
          <Table responsive hover className="align-middle mb-0">
            <tbody>
              {products.map((product) => (
                <tr key={product._id}>
                  <td className="fw-semibold">{product.name}</td>
                  <td className="text-muted">{product.category?.name || '-'}</td>
                  <td className="text-end"><StatusBadge status={product.stock || 0} variant={(product.stock || 0) === 0 ? 'danger' : 'warning'} /></td>
                </tr>
              ))}
            </tbody>
          </Table>
        )}
      </Card.Body>
    </Card>
  );
}
