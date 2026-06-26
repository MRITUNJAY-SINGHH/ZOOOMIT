import React, { useEffect, useState, useMemo, useCallback } from 'react';
import { Row, Col, Card, Table, Spinner, Dropdown } from 'react-bootstrap';
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
  const { theme } = useLayoutContext();

  const isDark = useMemo(() => {
    if (theme === 'dark') return true;
    if (theme === 'system') return window.matchMedia('(prefers-color-scheme: dark)').matches;
    return false;
  }, [theme]);

  useEffect(() => {
    api.get('/reports/sales').then(res => { setData(res.data); setLoading(false); }).catch(() => setLoading(false));
  }, []);

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
          <p className="report-subtitle">Comprehensive view of all sales metrics and revenue trends.</p>
        </div>
        <div className="report-header-right">
          <button className="report-btn"><Icon icon="lucide:calendar" width={16} /> <span>Last 30 Days</span></button>
          <button className="report-btn"><Icon icon="lucide:sliders-horizontal" width={16} /> <span>Filters</span></button>
          <Dropdown>
            <Dropdown.Toggle as="button" className="report-btn report-btn-primary"><Icon icon="lucide:download" width={16} /> <span>Export</span></Dropdown.Toggle>
            <Dropdown.Menu align="end">
              <Dropdown.Item onClick={() => handleExport('excel')}><Icon icon="lucide:file-spreadsheet" width={16} className="me-2" /> Excel</Dropdown.Item>
              <Dropdown.Item onClick={() => handleExport('pdf')}><Icon icon="lucide:file-text" width={16} className="me-2" /> PDF</Dropdown.Item>
            </Dropdown.Menu>
          </Dropdown>
        </div>
      </div>

      <Row className="mb-4 g-3">
        {[
          { label: 'Total Revenue', value: `₹${(data?.summary?.totalSales || 0).toLocaleString()}`, change: 15.2, icon: 'lucide:indian-rupee', accent: 'accent-purple' },
          { label: "Today's Sales", value: `₹${(data?.summary?.todaySales || 0).toLocaleString()}`, change: 8.5, icon: 'lucide:calendar', accent: 'accent-green' },
          { label: 'Weekly Sales', value: `₹${(data?.summary?.weeklySales || 0).toLocaleString()}`, change: 12.1, icon: 'lucide:trending-up', accent: 'accent-blue' },
          { label: 'Monthly Sales', value: `₹${(data?.summary?.monthlySales || 0).toLocaleString()}`, change: 22.4, icon: 'lucide:bar-chart-3', accent: 'accent-orange' },
        ].map((stat, i) => (
          <Col md={6} xl={3} key={i}>
            <Card className="report-stat-card h-100">
              <Card.Body className="d-flex align-items-start gap-3 p-3">
                <div className={`stat-icon ${stat.accent}`}><Icon icon={stat.icon} width={22} /></div>
                <div>
                  <div className="stat-label">{stat.label}</div>
                  <div className="stat-value">{stat.value}</div>
                  <div className="stat-change" style={{ color: 'var(--bs-success)' }}>
                    <Icon icon="lucide:trending-up" width={14} /> {stat.change}% vs last 30 days
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

      <Row className="g-3">
        <Col lg={4}>
          <Card className="report-section-card h-100">
            <Card.Header><h5>Order Insights</h5></Card.Header>
            <Card.Body className="p-0">
              {[
                { label: 'Total Orders', value: data?.counts?.totalOrders || 0, color: 'var(--bs-primary)' },
                { label: 'Cancelled Orders', value: data?.counts?.cancelledOrders || 0, color: 'var(--bs-danger)' },
                { label: 'Returned Orders', value: data?.counts?.returnedOrders || 0, color: 'var(--bs-warning)' },
              ].map((item, i) => (
                <div key={i} className="d-flex justify-content-between align-items-center px-4 py-3" style={{ borderBottom: '1px solid var(--bs-border-color)' }}>
                  <span style={{ fontSize: '1rem' }}>{item.label}</span>
                  <span className="fw-bold" style={{ color: item.color, fontSize: '1.125rem' }}>{item.value}</span>
                </div>
              ))}
            </Card.Body>
          </Card>
        </Col>
        <Col lg={8}>
          <Card className="report-section-card h-100">
            <Card.Header><h5>Top Selling Products</h5></Card.Header>
            <div style={{ overflowX: 'auto' }}>
              <Table className="report-table mb-0">
                <thead><tr><th>#</th><th>Product Name</th><th className="text-end">Units Sold</th><th className="text-end">Total Revenue</th></tr></thead>
                <tbody>
                  {(data?.topProducts || []).map((p, idx) => (
                    <tr key={idx}>
                      <td style={{ color: 'var(--bs-secondary-color)' }}>{idx + 1}</td>
                      <td className="fw-medium">{p._id}</td>
                      <td className="text-end">{p.totalQty}</td>
                      <td className="text-end fw-bold" style={{ color: 'var(--bs-success)' }}>₹{p.totalRevenue.toLocaleString()}</td>
                    </tr>
                  ))}
                  {(!data?.topProducts || data.topProducts.length === 0) && (
                    <tr><td colSpan="4" className="text-center py-4" style={{ color: 'var(--bs-secondary-color)' }}>No data</td></tr>
                  )}
                </tbody>
              </Table>
            </div>
          </Card>
        </Col>
      </Row>
    </div>
  );
}
