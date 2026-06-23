import React, { useState, useEffect } from 'react';
import { Row, Col, Card } from 'react-bootstrap';
import { Package, AlertTriangle, Clock } from 'lucide-react';
import api from '@/utils/api';
import SkeletonCard from '@/components/common/SkeletonCard';

export default function InventoryStatCards() {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    try {
      setLoading(true);
      const [prodRes, lowRes, expRes] = await Promise.allSettled([
        api.get('/products?limit=1'), // Just need total count
        api.get('/inventory/low-stock'),
        api.get('/inventory/expiring'),
      ]);
      
      // Handle the nested structure of products response vs direct array for inventory endpoints
      const totalProducts = prodRes.status === 'fulfilled' ? (prodRes.value.data?.total || prodRes.value.data?.data?.length || 0) : 0;
      const lowStock = lowRes.status === 'fulfilled' ? (lowRes.value.data?.data || lowRes.value.data || []).length : 0;
      const expiring = expRes.status === 'fulfilled' ? (expRes.value.data?.data || expRes.value.data || []).length : 0;
      
      setStats({ totalProducts, lowStock, expiring });
    } catch (err) {
      console.error('Failed to load inventory stats', err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <Row className="g-3 mb-4">
        {Array.from({ length: 3 }).map((_, i) => (
          <Col md={4} key={i}>
            <SkeletonCard lines={1} />
          </Col>
        ))}
      </Row>
    );
  }

  return (
    <Row className="g-3 mb-3">
      <Col md={4}>
        <Card className="h-100 border shadow-sm">
          <Card.Body className="d-flex align-items-center gap-3 p-4">
            <div className="rounded-circle d-flex align-items-center justify-content-center bg-primary-subtle" style={{ width: 56, height: 56 }}>
              <Package size={26} className="text-primary" />
            </div>
            <div>
              <div className="text-muted small fw-medium text-uppercase tracking-wider mb-1">Total Products</div>
              <h3 className="mb-0 fw-bold">{stats?.totalProducts || 0}</h3>
            </div>
          </Card.Body>
        </Card>
      </Col>
      <Col md={4}>
        <Card className="h-100 border shadow-sm">
          <Card.Body className="d-flex align-items-center gap-3 p-4">
            <div className="rounded-circle d-flex align-items-center justify-content-center bg-danger-subtle" style={{ width: 56, height: 56 }}>
              <AlertTriangle size={26} className="text-danger" />
            </div>
            <div>
              <div className="text-muted small fw-medium text-uppercase tracking-wider mb-1">Low Stock</div>
              <h3 className="mb-0 fw-bold text-danger">{stats?.lowStock || 0}</h3>
            </div>
          </Card.Body>
        </Card>
      </Col>
      <Col md={4}>
        <Card className="h-100 border shadow-sm">
          <Card.Body className="d-flex align-items-center gap-3 p-4">
            <div className="rounded-circle d-flex align-items-center justify-content-center bg-warning-subtle" style={{ width: 56, height: 56 }}>
              <Clock size={26} className="text-warning" />
            </div>
            <div>
              <div className="text-muted small fw-medium text-uppercase tracking-wider mb-1">Expiring Soon</div>
              <h3 className="mb-0 fw-bold text-warning">{stats?.expiring || 0}</h3>
            </div>
          </Card.Body>
        </Card>
      </Col>
    </Row>
  );
}
