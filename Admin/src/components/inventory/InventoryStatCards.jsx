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
    <Row className="g-3 mb-4">
      <Col md={4}>
        <Card 
          className="report-stat-card h-100 p-3" 
          style={{ transition: 'transform 0.2s ease, box-shadow 0.2s ease' }}
          onMouseEnter={(e) => e.currentTarget.style.transform = 'translateY(-2px)'}
          onMouseLeave={(e) => e.currentTarget.style.transform = 'translateY(0)'}
        >
          <Card.Body className="d-flex align-items-center p-0">
            <div className="stat-icon rounded-circle me-3 flex-shrink-0" style={{ width: 48, height: 48, background: 'rgba(59, 130, 246, 0.2)', color: '#3b82f6', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Package size={24} />
            </div>
            <div className="d-flex flex-column flex-grow-1 overflow-hidden">
              <div className="stat-value text-truncate mb-2" style={{ fontSize: '1.75rem', fontWeight: '700', lineHeight: 1 }}>
                {stats?.totalProducts || 0}
              </div>
              <div className="stat-label text-truncate" style={{ fontSize: '14px', color: 'var(--bs-secondary-color)', fontWeight: '500', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                Total Products
              </div>
            </div>
          </Card.Body>
        </Card>
      </Col>
      <Col md={4}>
        <Card 
          className="report-stat-card h-100 p-3" 
          style={{ transition: 'transform 0.2s ease, box-shadow 0.2s ease' }}
          onMouseEnter={(e) => e.currentTarget.style.transform = 'translateY(-2px)'}
          onMouseLeave={(e) => e.currentTarget.style.transform = 'translateY(0)'}
        >
          <Card.Body className="d-flex align-items-center p-0">
            <div className="stat-icon rounded-circle me-3 flex-shrink-0" style={{ width: 48, height: 48, background: 'rgba(239, 68, 68, 0.2)', color: '#ef4444', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <AlertTriangle size={24} />
            </div>
            <div className="d-flex flex-column flex-grow-1 overflow-hidden">
              <div className="stat-value text-truncate mb-2" style={{ fontSize: '1.75rem', fontWeight: '700', lineHeight: 1 }}>
                {stats?.lowStock || 0}
              </div>
              <div className="stat-label text-truncate" style={{ fontSize: '14px', color: 'var(--bs-secondary-color)', fontWeight: '500', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                Low Stock
              </div>
            </div>
          </Card.Body>
        </Card>
      </Col>
      <Col md={4}>
        <Card 
          className="report-stat-card h-100 p-3" 
          style={{ transition: 'transform 0.2s ease, box-shadow 0.2s ease' }}
          onMouseEnter={(e) => e.currentTarget.style.transform = 'translateY(-2px)'}
          onMouseLeave={(e) => e.currentTarget.style.transform = 'translateY(0)'}
        >
          <Card.Body className="d-flex align-items-center p-0">
            <div className="stat-icon rounded-circle me-3 flex-shrink-0" style={{ width: 48, height: 48, background: 'rgba(245, 158, 11, 0.2)', color: '#f59e0b', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Clock size={24} />
            </div>
            <div className="d-flex flex-column flex-grow-1 overflow-hidden">
              <div className="stat-value text-truncate mb-2" style={{ fontSize: '1.75rem', fontWeight: '700', lineHeight: 1 }}>
                {stats?.expiring || 0}
              </div>
              <div className="stat-label text-truncate" style={{ fontSize: '14px', color: 'var(--bs-secondary-color)', fontWeight: '500', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                Expiring Soon
              </div>
            </div>
          </Card.Body>
        </Card>
      </Col>
    </Row>
  );
}
