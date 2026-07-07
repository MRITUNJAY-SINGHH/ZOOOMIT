import React, { useEffect, useState } from 'react';
import { Card, Table } from 'react-bootstrap';
import api from '@/utils/api';
import EmptyState from '@/components/common/EmptyState';
import ErrorState from '@/components/common/ErrorState';
import LoadingSkeleton from '@/components/common/LoadingSkeleton';
import { formatCurrency } from '@/utils/format';

export default function TopSellingProducts() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const loadData = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await api.get('/reports/top-selling');
      setProducts(res.data || []);
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
        <h2 className="kuiklo-section-title mb-3">Top Selling Products</h2>
        {loading ? <LoadingSkeleton rows={5} columns={3} /> : error ? <ErrorState message={error} onRetry={loadData} /> : products.length === 0 ? (
          <EmptyState icon="lucide:package-open" title="No sales data" message="Top selling products will appear here once orders are placed." />
        ) : (
          <Table responsive hover className="align-middle mb-0">
            <thead>
              <tr>
                <th>Product</th>
                <th className="text-center">Sold</th>
                <th className="text-end">Revenue</th>
              </tr>
            </thead>
            <tbody>
              {products.map((product) => (
                <tr key={product._id}>
                  <td className="fw-semibold">{product.productName}</td>
                  <td className="text-center">{product.totalSold}</td>
                  <td className="text-end fw-semibold text-primary">{formatCurrency(product.totalRevenue)}</td>
                </tr>
              ))}
            </tbody>
          </Table>
        )}
      </Card.Body>
    </Card>
  );
}
