import React from 'react';
import { Card, Table, Badge } from 'react-bootstrap';
import { useQuery } from '@tanstack/react-query';
import { Link, useNavigate } from 'react-router';
import { ArrowUpRight, Flame } from 'lucide-react';
import api from '@/utils/api';
import EmptyState from '@/components/common/EmptyState';
import ErrorState from '@/components/common/ErrorState';
import LoadingSkeleton from '@/components/common/LoadingSkeleton';
import { formatCurrency } from '@/utils/format';

export default function TopSellingProducts({ period = 'this_month', startDate = '', endDate = '', refreshKey = 0 }) {
  const navigate = useNavigate();

  const { data: productsData, isLoading: loading, error, refetch: loadData } = useQuery({
    queryKey: ['topSellingProducts', period, startDate, endDate, refreshKey],
    queryFn: async () => {
      let url = `/reports/top-selling?period=${period}&limit=5`;
      if (period === 'custom' && startDate && endDate) {
        url += `&startDate=${startDate}&endDate=${endDate}`;
      }
      const res = await api.get(url);
      return Array.isArray(res.data) ? res.data : [];
    }
  });

  const products = productsData || [];
  const errorMessage = error?.message;

  return (
    <Card className="h-100 shadow-sm border">
      <Card.Body>
        <div className="d-flex justify-content-between align-items-center mb-3">
          <div>
            <h5 className="fw-bold mb-0 d-flex align-items-center gap-1">
              <Flame size={18} className="text-danger" /> Top Selling Products
            </h5>
            <small className="text-muted">By sales volume and revenue in selected period</small>
          </div>
          <Link to="/catalog/products" className="btn btn-primary btn-sm d-flex align-items-center gap-1 shadow-sm">
            View Catalog <ArrowUpRight size={14} />
          </Link>
        </div>

        {loading ? (
          <LoadingSkeleton rows={5} columns={4} />
        ) : error ? (
          <ErrorState message={errorMessage} onRetry={loadData} />
        ) : products.length === 0 ? (
          <EmptyState icon="lucide:package-open" title="No sales data" message="Top selling products will appear here once orders are placed in this period." />
        ) : (
          <div className="table-responsive">
            <Table hover className="align-middle mb-0 text-nowrap">
              <thead>
                <tr className="border-bottom" style={{ borderColor: 'var(--bs-border-color)' }}>
                  <th className="text-muted bg-transparent border-0 py-2 small fw-semibold">Product</th>
                  <th className="text-muted bg-transparent border-0 py-2 small fw-semibold text-center">Volume Sold</th>
                  <th className="text-muted bg-transparent border-0 py-2 small fw-semibold text-end">Total Revenue</th>
                </tr>
              </thead>
              <tbody>
                {products.map((product, idx) => (
                  <tr key={product._id} style={{ cursor: 'pointer' }} onClick={() => navigate(`/catalog/products?search=${encodeURIComponent(product.productName)}`)}>
                    <td>
                      <div className="d-flex align-items-center">
                        <span className="badge bg-secondary text-white me-2 fw-bold" style={{ fontSize: '0.75rem' }}>#{idx + 1}</span>
                        <div>
                          <div className="fw-semibold text-primary">{product.productName}</div>
                          <Badge bg="secondary-subtle" className="text-secondary border border-secondary-subtle" style={{ fontSize: '0.72rem' }}>
                            Base Unit: {product.unit}
                          </Badge>
                        </div>
                      </div>
                    </td>
                    <td className="text-center fw-bold">
                      {product.totalSold} <span className="text-muted fw-normal small">{product.unit}</span>
                    </td>
                    <td className="text-end fw-bold text-success">
                      {formatCurrency(product.totalRevenue)}
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
