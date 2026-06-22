import React, { useState, useEffect } from 'react';
import { Card, Table, Badge, Row, Col } from 'react-bootstrap';
import { Icon } from '@iconify/react';
import { Link } from 'react-router';
import api from '@/utils/api';
import { toast } from 'react-hot-toast';
import PageHeader from '@/components/common/PageHeader';
import SkeletonCard from '@/components/common/SkeletonCard';
import SkeletonTable from '@/components/common/SkeletonTable';

export default function InventoryOverview() {
  const [stats, setStats] = useState(null);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => { fetchData(); }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [prodRes, lowRes, expRes] = await Promise.allSettled([
        api.get('/products?page=1&limit=10'),
        api.get('/inventory/low-stock'),
        api.get('/inventory/expiring'),
      ]);
      const prods = prodRes.status === 'fulfilled' ? (prodRes.value.data.data || prodRes.value.data || []) : [];
      const low = lowRes.status === 'fulfilled' ? (lowRes.value.data || []) : [];
      const exp = expRes.status === 'fulfilled' ? (expRes.value.data || []) : [];
      setProducts(prods);
      setStats({ totalProducts: prods.length, lowStock: low.length, expiring: exp.length });
    } catch (err) { toast.error('Failed to load inventory data'); }
    finally { setLoading(false); }
  };

  if (loading) return (
    <div>
      <PageHeader title="Inventory Overview" description="Summary of your product stock, alerts, and trends." breadcrumbs={[{ label: 'Dashboard', path: '/dashboard' }, { label: 'Inventory' }, { label: 'Overview' }]} />
      <Row className="g-3 mb-4">{Array.from({ length: 3 }).map((_, i) => <Col md={4} key={i}><SkeletonCard lines={1} /></Col>)}</Row>
      <SkeletonTable rows={5} columns={5} />
    </div>
  );

  return (
    <div>
      <PageHeader title="Inventory Overview" description="Summary of your product stock, alerts, and trends." breadcrumbs={[{ label: 'Dashboard', path: '/dashboard' }, { label: 'Inventory' }, { label: 'Overview' }]} />

      <Row className="g-3 mb-4">
        <Col md={4}>
          <Card className="h-100"><Card.Body className="d-flex align-items-center gap-3">
            <div className="rounded d-flex align-items-center justify-content-center bg-primary-subtle" style={{ width: 48, height: 48 }}><Icon icon="lucide:package" width={22} className="text-primary" /></div>
            <div><div className="text-muted small">Total Products</div><h5 className="mb-0 fw-bold">{stats?.totalProducts || 0}</h5></div>
          </Card.Body></Card>
        </Col>
        <Col md={4}>
          <Card className="h-100"><Card.Body className="d-flex align-items-center gap-3">
            <div className="rounded d-flex align-items-center justify-content-center bg-danger-subtle" style={{ width: 48, height: 48 }}><Icon icon="lucide:alert-triangle" width={22} className="text-danger" /></div>
            <div><div className="text-muted small">Low Stock</div><h5 className="mb-0 fw-bold text-danger">{stats?.lowStock || 0}</h5></div>
          </Card.Body></Card>
        </Col>
        <Col md={4}>
          <Card className="h-100"><Card.Body className="d-flex align-items-center gap-3">
            <div className="rounded d-flex align-items-center justify-content-center bg-warning-subtle" style={{ width: 48, height: 48 }}><Icon icon="lucide:clock" width={22} className="text-warning" /></div>
            <div><div className="text-muted small">Expiring Soon</div><h5 className="mb-0 fw-bold text-warning">{stats?.expiring || 0}</h5></div>
          </Card.Body></Card>
        </Col>
      </Row>

      <Card>
        <Card.Header className="bg-transparent d-flex justify-content-between align-items-center">
          <h6 className="mb-0">Product Stock Snapshot</h6>
          <Link to="/catalog/products" className="small text-decoration-none">View All Products →</Link>
        </Card.Header>
        <Card.Body className="p-0">
          <Table responsive hover className="align-middle mb-0">
            <thead className="table-light"><tr><th className="ps-3">Product</th><th>Category</th><th>Barcode</th><th className="text-end">Stock</th><th className="text-end pe-3">MRP / Sell</th></tr></thead>
            <tbody>
              {products.slice(0, 10).map(p => (
                <tr key={p._id}>
                  <td className="ps-3 fw-medium">{p.name}</td>
                  <td className="text-muted">{p.category?.name || '-'}</td>
                  <td className="text-muted">{p.barcode || '-'}</td>
                  <td className="text-end"><Badge bg={(p.stock || 0) <= (p.lowStockThreshold || 10) ? 'danger' : 'success'}>{p.stock || 0}</Badge></td>
                  <td className="text-end pe-3"><del className="text-muted small">₹{p.mrp}</del> <span className="fw-medium text-success">₹{p.sellingPrice}</span></td>
                </tr>
              ))}
            </tbody>
          </Table>
        </Card.Body>
      </Card>
    </div>
  );
}
