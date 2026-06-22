import React, { useState, useEffect } from 'react';
import { Card, Table, Badge, Button } from 'react-bootstrap';
import { Icon } from '@iconify/react';
import { Link } from 'react-router';
import api from '@/utils/api';
import { toast } from 'react-hot-toast';
import PageHeader from '@/components/common/PageHeader';
import SkeletonTable from '@/components/common/SkeletonTable';
import EmptyState from '@/components/common/EmptyState';

export default function LowStock() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => { loadLowStock(); }, []);

  const loadLowStock = async () => {
    setLoading(true);
    try { const res = await api.get('/inventory/low-stock'); setProducts(res.data || []); }
    catch (e) { toast.error('Failed to load low stock data'); }
    setLoading(false);
  };

  return (
    <div>
      <PageHeader title="Low Stock" description="Products whose stock has fallen below their individual thresholds." breadcrumbs={[{ label: 'Dashboard', path: '/dashboard' }, { label: 'Inventory' }, { label: 'Low Stock' }]} />
      <Card>
        <Card.Body>
          <div className="d-flex justify-content-end mb-3">
            <Button variant="outline-secondary" size="sm" onClick={loadLowStock}><Icon icon="lucide:refresh-cw" width={14} className="me-1" />Refresh</Button>
          </div>
          {loading ? <SkeletonTable rows={5} columns={6} /> : products.length === 0 ? (
            <EmptyState icon="lucide:package-check" title="No Low Stock Alerts" message="All products are above their stock thresholds." />
          ) : (
            <Table responsive hover className="align-middle mb-0">
              <thead className="table-light"><tr><th style={{width:50}}>Image</th><th>Product</th><th>Category</th><th className="text-end">Current Stock</th><th className="text-end">Threshold</th><th className="text-end">Action</th></tr></thead>
              <tbody>
                {products.map(p => (
                  <tr key={p._id}>
                    <td>{p.featuredImage ? <img src={p.featuredImage} alt="" width="36" height="36" className="rounded" style={{ objectFit: 'cover' }} /> : <div className="bg-light rounded d-flex align-items-center justify-content-center" style={{ width: 36, height: 36 }}><Icon icon="lucide:image" width={14} className="text-muted" /></div>}</td>
                    <td><span className="fw-medium">{p.name}</span>{p.barcode && <small className="d-block text-muted">{p.barcode}</small>}</td>
                    <td className="text-muted">{p.category?.name || '-'}</td>
                    <td className="text-end"><Badge bg={p.stock === 0 ? 'danger' : 'warning'}>{p.stock}</Badge></td>
                    <td className="text-end text-muted">{p.lowStockThreshold}</td>
                    <td className="text-end"><Link to="/inventory/stock-entry"><Button variant="outline-primary" size="sm"><Icon icon="lucide:plus" width={14} className="me-1" />Restock</Button></Link></td>
                  </tr>
                ))}
              </tbody>
            </Table>
          )}
        </Card.Body>
      </Card>
    </div>
  );
}
