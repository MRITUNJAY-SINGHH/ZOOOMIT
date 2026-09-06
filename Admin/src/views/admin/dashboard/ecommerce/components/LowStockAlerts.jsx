import React from 'react';
import { Card, Table, Badge, Button } from 'react-bootstrap';
import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router';
import { AlertTriangle, ArrowUpRight, PackagePlus } from 'lucide-react';
import api from '@/utils/api';
import EmptyState from '@/components/common/EmptyState';
import ErrorState from '@/components/common/ErrorState';
import LoadingSkeleton from '@/components/common/LoadingSkeleton';

export default function LowStockAlerts({ refreshKey = 0 }) {
  const { data: productsData, isLoading: loading, error, refetch: loadData } = useQuery({
    queryKey: ['lowStockAlerts', refreshKey],
    queryFn: async () => {
      const res = await api.get('/inventory/low-stock');
      return (res.data || []).slice(0, 5);
    }
  });

  const products = productsData || [];
  const errorMessage = error?.message;

  return (
    <Card className="h-100 shadow-sm border">
      <Card.Body>
        <div className="d-flex justify-content-between align-items-center mb-3">
          <div>
            <h5 className="fw-bold mb-0 d-flex align-items-center gap-1 text-warning">
              <AlertTriangle size={18} /> Low Stock Alerts
            </h5>
            <small className="text-muted">Items at or below reorder threshold</small>
          </div>
          <Link to="/inventory/low-stock" className="btn btn-warning btn-sm text-dark fw-semibold d-flex align-items-center gap-1 shadow-sm">
            View All <ArrowUpRight size={14} />
          </Link>
        </div>

        {loading ? (
          <LoadingSkeleton rows={5} columns={4} />
        ) : error ? (
          <ErrorState message={errorMessage} onRetry={loadData} />
        ) : products.length === 0 ? (
          <EmptyState icon="lucide:package-check" title="Stock is healthy" message="All tracked inventory products are currently above their reorder threshold." />
        ) : (
          <div className="table-responsive">
            <Table hover className="align-middle mb-0 text-nowrap">
              <thead>
                <tr className="border-bottom" style={{ borderColor: 'var(--bs-border-color)' }}>
                  <th className="text-muted bg-transparent border-0 py-2 small fw-semibold">Product</th>
                  <th className="text-muted bg-transparent border-0 py-2 small fw-semibold text-center">Available Stock</th>
                  <th className="text-muted bg-transparent border-0 py-2 small fw-semibold text-end">Action</th>
                </tr>
              </thead>
              <tbody>
                {products.map((product) => {
                  const isZero = (product.stock || 0) === 0;
                  return (
                    <tr key={product._id}>
                      <td>
                        <div className="fw-semibold">{product.name}</div>
                        <small className="text-muted">
                          Threshold: {product.lowStockThreshold || 5} {product.baseUnit || 'PCS'}
                        </small>
                      </td>
                      <td className="text-center">
                        <Badge bg={isZero ? 'danger' : 'warning-subtle'} className={isZero ? 'text-white' : 'text-warning border border-warning-subtle'}>
                          {product.stock || 0} {product.baseUnit || 'PCS'}
                        </Badge>
                      </td>
                      <td className="text-end">
                        <Button 
                          as={Link} 
                          to={`/inventory/stock-entry?productId=${product._id}&productName=${encodeURIComponent(product.name)}`}
                          variant="primary" 
                          size="sm" 
                          className="d-inline-flex align-items-center gap-1 py-1 px-2 shadow-sm"
                          style={{ fontSize: '0.78rem' }}
                        >
                          <PackagePlus size={12} /> Inward
                        </Button>
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
