import React from 'react';
import { Card, Table } from 'react-bootstrap';
import { useQuery } from '@tanstack/react-query';
import api from '@/utils/api';
import EmptyState from '@/components/common/EmptyState';
import ErrorState from '@/components/common/ErrorState';
import LoadingSkeleton from '@/components/common/LoadingSkeleton';
import { formatCurrency } from '@/utils/format';

export default function TopSellingProducts() {
  const { data: productsData, isLoading: loading, error, refetch: loadData } = useQuery({
    queryKey: ['topSellingProducts'],
    queryFn: async () => {
      const res = await api.get('/reports/top-selling');
      return res.data || [];
    }
  });

  const products = productsData || [];
  const errorMessage = error?.message;

  return (
    <Card className="h-100">
      <Card.Body>
        <h2 className="kuiklo-section-title mb-3">Top Selling Products</h2>
        {loading ? <LoadingSkeleton rows={5} columns={4} /> : error ? <ErrorState message={errorMessage} onRetry={loadData} /> : products.length === 0 ? (
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
