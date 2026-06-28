import React, { useEffect, useState, useMemo, useCallback } from 'react';
import { Row, Col, Card, Table, Spinner, Dropdown, Button } from 'react-bootstrap';
import Icon from '@/components/wrappers/Icon';
import api from '@/utils/api';
import { exportToExcel, exportToPDF } from '@/utils/exportUtils';
import { Doughnut } from 'react-chartjs-2';
import { useLayoutContext } from '@/context/useLayoutContext';
import { Chart as ChartJS, ArcElement, Tooltip, Legend } from 'chart.js';

ChartJS.register(ArcElement, Tooltip, Legend);

export default function InventoryReport() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const { theme } = useLayoutContext();

  const isDark = useMemo(() => {
    if (theme === 'dark') return true;
    if (theme === 'system') return window.matchMedia('(prefers-color-scheme: dark)').matches;
    return false;
  }, [theme]);

  useEffect(() => {
    api.get('/reports/inventory').then(res => { setData(res.data); setLoading(false); }).catch(() => setLoading(false));
  }, []);

  const tooltipBg = isDark ? 'rgba(30,41,59,0.95)' : 'rgba(255,255,255,0.98)';
  const tooltipTitle = isDark ? '#e2e8f0' : '#1e293b';
  const tooltipBody = isDark ? '#94a3b8' : '#64748b';
  const tooltipBorder = isDark ? '#334155' : '#e2e8f0';

  const handleExport = useCallback((type) => {
    if (!data) return;
    const rows = (data.recentLogs || []).map(log => ({
      Date: new Date(log.date).toLocaleDateString(), Type: log.type,
      Product: log.product?.name || 'Unknown', QtyChanged: log.quantityChanged,
      Reason: log.reason || '-', User: log.user?.name || 'Unknown'
    }));
    if (type === 'excel') exportToExcel(rows, 'Inventory_Report');
    else exportToPDF(['Date', 'Type', 'Product', 'Qty', 'Reason'], rows.map(r => [r.Date, r.Type, r.Product, String(r.QtyChanged), r.Reason]), 'Inventory Report', 'Inventory_Report');
  }, [data]);

  const currentStock = data?.summary?.currentStock || 0;
  const lowStock = data?.summary?.lowStock || 0;
  const outOfStock = data?.summary?.outOfStock || 0;
  const expiring = data?.summary?.expiring || 0;
  const expired = data?.summary?.expired || 0;
  const inventoryValue = data?.summary?.inventoryValue || 0;
  const healthy = Math.max(currentStock - lowStock - outOfStock, 0);

  const doughnutColors = ['#10b981', '#f59e0b', '#ef4444'];
  const doughnutData = {
    labels: ['Healthy', 'Low Stock', 'Out of Stock'],
    datasets: [{ data: [healthy, lowStock, outOfStock], backgroundColor: doughnutColors, borderWidth: 0, cutout: '72%' }]
  };
  const doughnutOptions = {
    responsive: true, maintainAspectRatio: false,
    plugins: { legend: { display: false }, tooltip: { backgroundColor: tooltipBg, titleColor: tooltipTitle, bodyColor: tooltipBody, borderColor: tooltipBorder, borderWidth: 1, padding: 12, bodyFont: { size: 14 }, titleFont: { size: 14 } } }
  };

  const typeBadge = (type) => {
    const map = { ADD: { bg: 'rgba(16,185,129,0.12)', color: '#10b981' }, SALE: { bg: 'rgba(59,130,246,0.12)', color: '#3b82f6' }, RETURN: { bg: 'rgba(245,158,11,0.12)', color: '#f59e0b' }, ADJUSTMENT: { bg: 'rgba(139,92,246,0.12)', color: '#8b5cf6' } };
    return map[type] || { bg: 'rgba(100,116,139,0.12)', color: '#64748b' };
  };

  if (loading) return <div className="d-flex justify-content-center align-items-center" style={{ minHeight: 500 }}><Spinner animation="border" /></div>;

  return (
    <div className="report-page">
      <div className="report-header">
        <div className="report-header-left">
          <h3 className="report-title">Inventory Reports</h3>
        </div>
        <div className="report-header-right d-flex gap-3 align-items-center">
          <div className="report-search-wrap" style={{ width: '250px', position: 'relative' }}>
            <Icon icon="lucide:search" width={20} className="search-icon" style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--bs-secondary-color)' }} />
            <input 
              type="text" 
              className="form-control report-search-input" 
              placeholder="Search inventory..." 
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              style={{ paddingLeft: '40px' }}
            />
          </div>
          <Dropdown>
            <Dropdown.Toggle variant="primary" className="d-inline-flex align-items-center gap-2">
              <Icon icon="lucide:download" width={16} />
              <span>Export</span>
            </Dropdown.Toggle>
            <Dropdown.Menu align="end">
              <Dropdown.Item onClick={() => handleExport('excel')}>
                <Icon icon="lucide:file-spreadsheet" width={16} className="me-2" /> Excel
              </Dropdown.Item>
              <Dropdown.Item onClick={() => handleExport('pdf')}>
                <Icon icon="lucide:file-text" width={16} className="me-2" /> PDF
              </Dropdown.Item>
            </Dropdown.Menu>
          </Dropdown>
        </div>
      </div>

      <Row className="mb-4 g-3">
        {[
          { label: 'Current Stock (Units)', value: currentStock.toLocaleString(), change: 5.2, icon: 'lucide:box', bg: 'rgba(108, 92, 231, 0.2)', color: '#7c6fe0' },
          { label: 'Inventory Value', value: `₹${inventoryValue.toLocaleString()}`, change: 8.1, icon: 'lucide:indian-rupee', bg: 'rgba(16, 185, 129, 0.2)', color: '#10b981' },
          { label: 'Low Stock Items', value: lowStock.toString(), change: -3.4, icon: 'lucide:alert-triangle', bg: 'rgba(245, 158, 11, 0.2)', color: '#f59e0b' },
          { label: 'Out of Stock Items', value: outOfStock.toString(), change: -1.2, icon: 'lucide:x-circle', bg: 'rgba(239, 68, 68, 0.2)', color: '#ef4444' },
        ].map((stat, i) => (
          <Col md={6} xl={3} key={i}>
            <Card className="report-stat-card h-100">
              <Card.Body className="d-flex align-items-center p-3">
                <div className="stat-icon rounded-circle me-3 flex-shrink-0" style={{ width: 48, height: 48, background: stat.bg, color: stat.color, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Icon icon={stat.icon} width={24} />
                </div>
                <div className="d-flex flex-column flex-grow-1 overflow-hidden">
                  <div className="stat-value text-truncate mb-2" style={{ fontSize: '1.5rem', fontWeight: '700', lineHeight: 1 }}>
                    {stat.value}
                  </div>
                  <div className="stat-label text-truncate mb-2" style={{ fontSize: '14px', color: 'var(--bs-secondary-color)', fontWeight: '500' }}>{stat.label}</div>
                  <div className="stat-change" style={{ fontSize: '13px', color: stat.change >= 0 ? 'var(--bs-success)' : 'var(--bs-danger)' }}>
                    <Icon icon={stat.change >= 0 ? 'lucide:trending-up' : 'lucide:trending-down'} width={14} /> {Math.abs(stat.change)}% vs last 30 days
                  </div>
                </div>
              </Card.Body>
            </Card>
          </Col>
        ))}
      </Row>

      <Row className="mb-4 g-3">
        <Col lg={7}>
          <Row className="g-3 h-100">
            <Col sm={6}>
              <Card className="report-section-card h-100">
                <Card.Body className="d-flex align-items-center gap-3 p-4">
                  <div className="stat-icon accent-orange"><Icon icon="lucide:clock" width={22} /></div>
                  <div>
                    <div style={{ fontSize: '0.9375rem', color: 'var(--bs-secondary-color)' }}>Expiring Soon (30 Days)</div>
                    <div style={{ fontSize: '1.75rem', fontWeight: 700, color: 'var(--bs-warning)' }}>{expiring}</div>
                  </div>
                </Card.Body>
              </Card>
            </Col>
            <Col sm={6}>
              <Card className="report-section-card h-100">
                <Card.Body className="d-flex align-items-center gap-3 p-4">
                  <div className="stat-icon accent-red"><Icon icon="lucide:alert-octagon" width={22} /></div>
                  <div>
                    <div style={{ fontSize: '0.9375rem', color: 'var(--bs-secondary-color)' }}>Already Expired</div>
                    <div style={{ fontSize: '1.75rem', fontWeight: 700, color: 'var(--bs-danger)' }}>{expired}</div>
                  </div>
                </Card.Body>
              </Card>
            </Col>
          </Row>
        </Col>
        <Col lg={5}>
          <Card className="report-section-card h-100">
            <Card.Header><h5>Stock Health</h5></Card.Header>
            <Card.Body className="d-flex align-items-center">
              <Row className="w-100 align-items-center">
                <Col xs={5} className="d-flex justify-content-center">
                  <div style={{ position: 'relative', width: '100%', maxWidth: 180, height: 180 }}>
                    <Doughnut data={doughnutData} options={doughnutOptions} />
                    <div className="donut-center-label"><div className="donut-value">{currentStock}</div><div className="donut-sub">Total</div></div>
                  </div>
                </Col>
                <Col xs={7}>
                  <ul className="report-legend">
                    {[{ label: 'Healthy', count: healthy, color: '#10b981' }, { label: 'Low Stock', count: lowStock, color: '#f59e0b' }, { label: 'Out of Stock', count: outOfStock, color: '#ef4444' }].map((item, i) => (
                      <li key={i}><span className="legend-dot" style={{ background: item.color }}></span><span>{item.label}</span><span className="legend-count">{item.count}</span></li>
                    ))}
                  </ul>
                </Col>
              </Row>
            </Card.Body>
          </Card>
        </Col>
      </Row>

      <Card className="report-section-card">
        <Card.Header><h5>Recent Stock Movements</h5></Card.Header>
        <div style={{ overflowX: 'auto' }}>
          <Table className="report-table mb-0">
            <thead><tr><th>Date</th><th>Type</th><th>Product</th><th className="text-end">Qty Changed</th><th>Reason</th><th>User</th></tr></thead>
            <tbody>
              {(data?.recentLogs || []).map((log, idx) => {
                const badge = typeBadge(log.type);
                return (
                  <tr key={idx}>
                    <td style={{ color: 'var(--bs-secondary-color)' }}>{new Date(log.date).toLocaleString()}</td>
                    <td><span className="report-badge" style={{ background: badge.bg, color: badge.color }}>{log.type}</span></td>
                    <td className="fw-medium">{log.product?.name || 'Unknown'}</td>
                    <td className="text-end fw-bold" style={{ color: log.quantityChanged > 0 ? 'var(--bs-success)' : 'var(--bs-danger)' }}>
                      {log.quantityChanged > 0 ? `+${log.quantityChanged}` : log.quantityChanged}
                    </td>
                    <td style={{ color: 'var(--bs-secondary-color)' }}>{log.reason || '-'}</td>
                    <td>{log.user?.name || '-'}</td>
                  </tr>
                );
              })}
              {(!data?.recentLogs || data.recentLogs.length === 0) && (
                <tr><td colSpan="6" className="text-center py-4" style={{ color: 'var(--bs-secondary-color)' }}>No recent logs</td></tr>
              )}
            </tbody>
          </Table>
        </div>
      </Card>
    </div>
  );
}
