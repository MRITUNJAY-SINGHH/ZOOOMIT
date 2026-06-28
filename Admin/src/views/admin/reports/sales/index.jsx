import React, { useEffect, useState, useMemo, useCallback } from 'react';
import { Row, Col, Card, Table, Spinner, Dropdown, Button, Modal, Badge } from 'react-bootstrap';
import Icon from '@/components/wrappers/Icon';
import api from '@/utils/api';
import { exportToExcel, exportToPDF } from '@/utils/exportUtils';
import { Line, Bar } from 'react-chartjs-2';
import { useLayoutContext } from '@/context/useLayoutContext';
import {
  Chart as ChartJS, CategoryScale, LinearScale, PointElement,
  LineElement, BarElement, Title, Tooltip, Legend, Filler,
} from 'chart.js';

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, BarElement, Title, Tooltip, Legend, Filler);

export default function SalesReport() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const { theme } = useLayoutContext();

  const isDark = useMemo(() => {
    if (theme === 'dark') return true;
    if (theme === 'system') return window.matchMedia('(prefers-color-scheme: dark)').matches;
    return false;
  }, [theme]);

  useEffect(() => {
    api.get('/reports/sales').then(res => { setData(res.data); setLoading(false); }).catch(() => setLoading(false));
  }, []);

  const filteredProducts = useMemo(() => {
    if (!data?.topProducts) return [];
    if (!search) return data.topProducts;
    return data.topProducts.filter(p => 
      (p.productName || p._id || '').toLowerCase().includes(search.toLowerCase())
    );
  }, [data?.topProducts, search]);

  const handleViewProduct = (product) => {
    setSelectedProduct(product);
    setShowModal(true);
  };

  const gridColor = isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.06)';
  const textColor = isDark ? 'rgba(255,255,255,0.6)' : 'rgba(0,0,0,0.5)';
  const tooltipBg = isDark ? 'rgba(30,41,59,0.95)' : 'rgba(255,255,255,0.98)';
  const tooltipTitle = isDark ? '#e2e8f0' : '#1e293b';
  const tooltipBody = isDark ? '#94a3b8' : '#64748b';
  const tooltipBorder = isDark ? '#334155' : '#e2e8f0';

  const handleExport = useCallback((type) => {
    if (!data) return;
    const rows = [
      { Metric: 'Total Sales', Value: data.summary.totalSales },
      { Metric: 'Today Sales', Value: data.summary.todaySales },
      { Metric: 'Weekly Sales', Value: data.summary.weeklySales },
      { Metric: 'Monthly Sales', Value: data.summary.monthlySales },
      { Metric: 'Online Sales', Value: data.summary.onlineSales },
      { Metric: 'Offline Sales', Value: data.summary.offlineSales },
    ];
    if (type === 'excel') exportToExcel(rows, 'Sales_Report');
    else exportToPDF(['Metric', 'Value'], rows.map(r => [r.Metric, `₹${r.Value}`]), 'Sales Report', 'Sales_Report');
  }, [data]);

  const revenueChartData = {
    labels: data?.revenueGraph?.map(d => d._id) || [],
    datasets: [{
      label: 'Daily Revenue',
      data: data?.revenueGraph?.map(d => d.sales) || [],
      borderColor: 'rgb(59, 130, 246)',
      backgroundColor: isDark ? 'rgba(59,130,246,0.06)' : 'rgba(59,130,246,0.04)',
      fill: true, tension: 0.4,
      pointBackgroundColor: 'rgb(59, 130, 246)', pointBorderColor: isDark ? '#1e293b' : '#fff',
      pointBorderWidth: 2, pointRadius: 3, pointHoverRadius: 6, borderWidth: 2.5,
    }]
  };

  const revenueOptions = {
    responsive: true, maintainAspectRatio: false,
    scales: {
      x: { grid: { color: gridColor, drawBorder: false }, ticks: { color: textColor, font: { size: 13 } } },
      y: { grid: { color: gridColor, drawBorder: false }, ticks: { color: textColor, font: { size: 13 }, callback: (v) => `₹${v.toLocaleString()}` } },
    },
    plugins: {
      legend: { display: false },
      tooltip: { backgroundColor: tooltipBg, titleColor: tooltipTitle, bodyColor: tooltipBody, borderColor: tooltipBorder, borderWidth: 1, padding: 12, bodyFont: { size: 14 }, titleFont: { size: 14 }, callbacks: { label: (ctx) => `Revenue: ₹${ctx.parsed.y.toLocaleString()}` } }
    }
  };

  const barData = {
    labels: ['Online', 'Offline'],
    datasets: [{
      data: [data?.summary?.onlineSales || 0, data?.summary?.offlineSales || 0],
      backgroundColor: ['rgb(59, 130, 246)', 'rgb(245, 158, 11)'],
      borderRadius: 6, barThickness: 40,
    }]
  };

  const barOptions = {
    responsive: true, maintainAspectRatio: false,
    scales: {
      x: { grid: { display: false }, ticks: { color: textColor, font: { size: 14 } } },
      y: { grid: { color: gridColor, drawBorder: false }, ticks: { color: textColor, font: { size: 13 }, callback: (v) => `₹${v.toLocaleString()}` } },
    },
    plugins: { legend: { display: false }, tooltip: { backgroundColor: tooltipBg, titleColor: tooltipTitle, bodyColor: tooltipBody, borderColor: tooltipBorder, borderWidth: 1, padding: 12 } }
  };

  if (loading) return <div className="d-flex justify-content-center align-items-center" style={{ minHeight: 500 }}><Spinner animation="border" /></div>;

  return (
    <div className="report-page">
      <div className="report-header">
        <div className="report-header-left">
          <h3 className="report-title">Sales Reports</h3>
        </div>
        <div className="report-header-right d-flex gap-3 align-items-center">
          <div className="report-search-wrap" style={{ width: '250px', position: 'relative' }}>
            <Icon icon="lucide:search" width={20} className="search-icon" style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--bs-secondary-color)' }} />
            <input 
              type="text" 
              className="form-control report-search-input" 
              placeholder="Search sales..." 
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
          { label: 'Total Revenue', value: `₹${(data?.summary?.totalSales || 0).toLocaleString()}`, change: 15.2, icon: 'lucide:indian-rupee', bg: 'rgba(108, 92, 231, 0.2)', color: '#7c6fe0' },
          { label: "Today's Sales", value: `₹${(data?.summary?.todaySales || 0).toLocaleString()}`, change: 8.5, icon: 'lucide:calendar', bg: 'rgba(16, 185, 129, 0.2)', color: '#10b981' },
          { label: 'Weekly Sales', value: `₹${(data?.summary?.weeklySales || 0).toLocaleString()}`, change: 12.1, icon: 'lucide:trending-up', bg: 'rgba(59, 130, 246, 0.2)', color: '#3b82f6' },
          { label: 'Monthly Sales', value: `₹${(data?.summary?.monthlySales || 0).toLocaleString()}`, change: 22.4, icon: 'lucide:bar-chart-3', bg: 'rgba(245, 158, 11, 0.2)', color: '#f59e0b' },
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
        <Col lg={8}>
          <Card className="report-section-card h-100">
            <Card.Header><h5>Revenue Trend (Last 30 Days)</h5></Card.Header>
            <Card.Body>
              <div style={{ height: 300 }}>
                {data?.revenueGraph?.length > 0 ? <Line data={revenueChartData} options={revenueOptions} />
                  : <div className="d-flex align-items-center justify-content-center h-100" style={{ color: 'var(--bs-secondary-color)' }}>No revenue data</div>}
              </div>
            </Card.Body>
          </Card>
        </Col>
        <Col lg={4}>
          <Card className="report-section-card h-100">
            <Card.Header><h5>Online vs Offline</h5></Card.Header>
            <Card.Body><div style={{ height: 300 }}><Bar data={barData} options={barOptions} /></div></Card.Body>
          </Card>
        </Col>
      </Row>

      <Row className="g-3 mb-4">
        <Col lg={12}>
          <Card className="report-section-card h-100">
            <Card.Header><h5>Order Insights</h5></Card.Header>
            <Card.Body className="p-0">
              <Row className="g-0">
                {[
                  { label: 'Total Orders', value: data?.counts?.totalOrders || 0, color: 'var(--bs-primary)' },
                  { label: 'Cancelled Orders', value: data?.counts?.cancelledOrders || 0, color: 'var(--bs-danger)' },
                  { label: 'Returned Orders', value: data?.counts?.returnedOrders || 0, color: 'var(--bs-warning)' },
                ].map((item, i) => (
                  <Col md={4} key={i} className={`p-4 ${i !== 2 ? 'border-end' : ''}`} style={{ borderColor: 'var(--bs-border-color)' }}>
                    <div className="text-muted mb-1" style={{ fontSize: '1rem' }}>{item.label}</div>
                    <div className="fw-bold" style={{ color: item.color, fontSize: '1.75rem' }}>{item.value}</div>
                  </Col>
                ))}
              </Row>
            </Card.Body>
          </Card>
        </Col>
      </Row>

      <Row className="g-3">
        <Col lg={12}>
          <Card className="report-section-card h-100">
            <Card.Header><h5>Top Selling Products</h5></Card.Header>
            <div style={{ overflowX: 'auto' }}>
              <Table className="report-table mb-0">
                <thead className="custom-table-thead" style={{ 
                  fontSize: '12px', 
                  textTransform: 'uppercase', 
                  letterSpacing: '0.5px',
                  backgroundColor: 'rgba(255, 255, 255, 0.03)'
                }}>
                  <tr>
                    <th className="py-2 text-muted border-dashed">#</th>
                    <th className="py-2 text-muted border-dashed">PRODUCT NAME</th>
                    <th className="py-2 text-end text-muted border-dashed">UNITS SOLD</th>
                    <th className="py-2 text-end text-muted border-dashed">TOTAL REVENUE</th>
                    <th className="py-2 text-center text-muted border-dashed">ACTION</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredProducts.map((p, idx) => (
                    <tr key={idx}>
                      <td className="align-middle border-dashed" style={{ color: 'var(--bs-secondary-color)' }}>{idx + 1}</td>
                      <td className="align-middle border-dashed fw-medium">{p.productName || p._id}</td>
                      <td className="align-middle border-dashed text-end" style={{ fontSize: '14px' }}>{p.totalQty}</td>
                      <td className="align-middle border-dashed text-end fw-semibold" style={{ color: 'var(--bs-body-color)', fontSize: '14px' }}>₹{p.totalRevenue.toLocaleString()}</td>
                      <td className="align-middle border-dashed text-center">
                        <button className="report-action-btn" title="View" onClick={() => handleViewProduct(p)}><Icon icon="lucide:eye" width={17} /></button>
                      </td>
                    </tr>
                  ))}
                  {filteredProducts.length === 0 && (
                    <tr><td colSpan="5" className="text-center py-4 border-dashed" style={{ color: 'var(--bs-secondary-color)' }}>No products found</td></tr>
                  )}
                </tbody>
              </Table>
            </div>
          </Card>
        </Col>
      </Row>

      <Modal show={showModal} onHide={() => setShowModal(false)} size="lg" centered>
        <Modal.Header closeButton>
          <Modal.Title className="fw-bold">{selectedProduct?.productName || selectedProduct?._id}</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {selectedProduct && selectedProduct.productDetails ? (
            <Row>
              <Col md={4} className="text-center mb-4 mb-md-0">
                {selectedProduct.productDetails.images?.length > 0 ? (
                  <img src={selectedProduct.productDetails.images[0].url} alt={selectedProduct.productName} className="img-fluid rounded shadow-sm" style={{ maxHeight: '200px', objectFit: 'contain' }} />
                ) : (
                  <div className="bg-light rounded d-flex align-items-center justify-content-center shadow-sm" style={{ height: '200px', width: '100%' }}>
                    <Icon icon="lucide:image-off" width={48} className="text-muted" />
                  </div>
                )}
              </Col>
              <Col md={8}>
                <h5 className="fw-bold mb-3">Product Details</h5>
                <Table borderless size="sm" className="mb-0">
                  <tbody>
                    <tr><td className="text-muted" style={{ width: '140px' }}>Category:</td><td className="fw-medium">{selectedProduct.productDetails.category?.name || 'N/A'}</td></tr>
                    <tr><td className="text-muted">Brand:</td><td className="fw-medium">{selectedProduct.productDetails.brand || 'N/A'}</td></tr>
                    <tr><td className="text-muted">Base Price:</td><td className="fw-medium text-success">₹{selectedProduct.productDetails.basePrice}</td></tr>
                    <tr><td className="text-muted">Status:</td><td><Badge bg={selectedProduct.productDetails.isActive ? 'success' : 'danger'}>{selectedProduct.productDetails.isActive ? 'Active' : 'Inactive'}</Badge></td></tr>
                  </tbody>
                </Table>
                
                <h5 className="fw-bold mt-4 mb-3">Sales Performance (Last 30 Days)</h5>
                <Table borderless size="sm" className="mb-0">
                  <tbody>
                    <tr><td className="text-muted" style={{ width: '140px' }}>Units Sold:</td><td className="fw-bold text-primary">{selectedProduct.totalQty}</td></tr>
                    <tr><td className="text-muted">Total Revenue:</td><td className="fw-bold text-success">₹{selectedProduct.totalRevenue.toLocaleString()}</td></tr>
                  </tbody>
                </Table>
              </Col>
            </Row>
          ) : (
            <div className="text-center py-5">
              <Icon icon="lucide:box" width={48} className="text-muted mb-3" />
              <h5>Detailed information not available</h5>
              <p className="text-muted">This product might have been deleted or details are unavailable.</p>
              
              <h5 className="fw-bold mt-4 mb-3 text-start">Sales Performance (Last 30 Days)</h5>
              <Table borderless size="sm" className="mb-0 text-start" style={{ maxWidth: '300px', margin: '0 auto' }}>
                <tbody>
                  <tr><td className="text-muted">Units Sold:</td><td className="fw-bold text-primary">{selectedProduct?.totalQty}</td></tr>
                  <tr><td className="text-muted">Total Revenue:</td><td className="fw-bold text-success">₹{selectedProduct?.totalRevenue?.toLocaleString()}</td></tr>
                </tbody>
              </Table>
            </div>
          )}
        </Modal.Body>
        <Modal.Footer className="border-0 pb-4 pe-4">
          <Button variant="primary" onClick={() => setShowModal(false)} className="px-4">Close</Button>
        </Modal.Footer>
      </Modal>
    </div>
  );
}
