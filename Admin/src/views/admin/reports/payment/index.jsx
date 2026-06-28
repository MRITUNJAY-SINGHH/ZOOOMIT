import React, { useEffect, useState, useMemo, useCallback } from 'react';
import { Row, Col, Card, Table, Spinner, Pagination, Dropdown, Button } from 'react-bootstrap';
import Icon from '@/components/wrappers/Icon';
import api from '@/utils/api';
import { exportToExcel, exportToPDF } from '@/utils/exportUtils';
import { Doughnut } from 'react-chartjs-2';
import { useLayoutContext } from '@/context/useLayoutContext';
import { Chart as ChartJS, ArcElement, Tooltip, Legend } from 'chart.js';

ChartJS.register(ArcElement, Tooltip, Legend);

export default function PaymentReport() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const { theme } = useLayoutContext();
  const perPage = 10;

  const isDark = useMemo(() => {
    if (theme === 'dark') return true;
    if (theme === 'system') return window.matchMedia('(prefers-color-scheme: dark)').matches;
    return false;
  }, [theme]);

  useEffect(() => {
    api.get('/reports/payments').then(res => { setData(res.data); setLoading(false); }).catch(() => setLoading(false));
  }, []);

  const tooltipBg = isDark ? 'rgba(30,41,59,0.95)' : 'rgba(255,255,255,0.98)';
  const tooltipTitle = isDark ? '#e2e8f0' : '#1e293b';
  const tooltipBody = isDark ? '#94a3b8' : '#64748b';
  const tooltipBorder = isDark ? '#334155' : '#e2e8f0';

  const handleExport = useCallback((type) => {
    if (!data) return;
    const rows = [
      { Metric: 'Total Payments', Value: data.summary.totalPayments },
      { Metric: 'Cash', Value: data.summary.cashPayments },
      { Metric: 'UPI', Value: data.summary.upiPayments },
      { Metric: 'Card', Value: data.summary.cardPayments },
      { Metric: 'Razorpay', Value: data.summary.razorpayPayments },
      { Metric: 'Refunded', Value: data.summary.refundedAmount },
      { Metric: 'Pending Refunds', Value: data.summary.pendingRefunds },
      { Metric: 'Failed', Value: data.summary.failedPayments },
    ];
    if (type === 'excel') exportToExcel(rows, 'Payment_Report');
    else exportToPDF(['Metric', 'Value'], rows.map(r => [r.Metric, typeof r.Value === 'number' ? `₹${r.Value.toLocaleString()}` : String(r.Value)]), 'Payment Report', 'Payment_Report');
  }, [data]);

  const total = data?.summary?.totalPayments || 0;
  const cash = data?.summary?.cashPayments || 0;
  const upi = data?.summary?.upiPayments || 0;
  const card = data?.summary?.cardPayments || 0;
  const razorpay = data?.summary?.razorpayPayments || 0;
  const refunded = data?.summary?.refundedAmount || 0;
  const pendingRefunds = data?.summary?.pendingRefunds || 0;
  const failedPayments = data?.summary?.failedPayments || 0;

  const doughnutColors = ['#10b981', '#3b82f6', '#8b5cf6', '#f59e0b'];
  const doughnutData = {
    labels: ['Cash', 'UPI', 'Card', 'Razorpay'],
    datasets: [{ data: [cash, upi, card, razorpay], backgroundColor: doughnutColors, borderWidth: 0, cutout: '72%' }]
  };
  const doughnutOptions = {
    responsive: true, maintainAspectRatio: false,
    plugins: { legend: { display: false }, tooltip: { backgroundColor: tooltipBg, titleColor: tooltipTitle, bodyColor: tooltipBody, borderColor: tooltipBorder, borderWidth: 1, padding: 12, bodyFont: { size: 14 }, titleFont: { size: 14 }, callbacks: { label: (ctx) => `${ctx.label}: ₹${ctx.parsed.toLocaleString()}` } } }
  };

  const transactions = data?.recentTransactions || [];
  const totalPages = Math.ceil(transactions.length / perPage);
  const paginated = transactions.slice((currentPage - 1) * perPage, currentPage * perPage);

  const statusBadge = (s) => {
    const map = { Success: { bg: 'rgba(16,185,129,0.12)', color: '#10b981' }, Paid: { bg: 'rgba(16,185,129,0.12)', color: '#10b981' }, Failed: { bg: 'rgba(239,68,68,0.12)', color: '#ef4444' }, Refunded: { bg: 'rgba(100,116,139,0.12)', color: '#64748b' } };
    return map[s] || { bg: 'rgba(245,158,11,0.12)', color: '#f59e0b' };
  };

  if (loading) return <div className="d-flex justify-content-center align-items-center" style={{ minHeight: 500 }}><Spinner animation="border" /></div>;

  return (
    <div className="report-page">
      <div className="report-header">
        <div className="report-header-left">
          <h3 className="report-title">Payment Reports</h3>
        </div>
        <div className="report-header-right d-flex gap-3 align-items-center">
          <div className="report-search-wrap" style={{ width: '250px', position: 'relative' }}>
            <Icon icon="lucide:search" width={20} className="search-icon" style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--bs-secondary-color)' }} />
            <input 
              type="text" 
              className="form-control report-search-input" 
              placeholder="Search payments..." 
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
          { label: 'Total Payments', value: `₹${total.toLocaleString()}`, change: 11.5, icon: 'lucide:wallet', bg: 'rgba(108, 92, 231, 0.2)', color: '#7c6fe0' },
          { label: 'Total Refunded', value: `₹${refunded.toLocaleString()}`, change: -2.3, icon: 'lucide:corner-up-left', bg: 'rgba(245, 158, 11, 0.2)', color: '#f59e0b' },
          { label: 'Pending Refunds', value: pendingRefunds.toString(), change: -5.1, icon: 'lucide:clock', bg: 'rgba(59, 130, 246, 0.2)', color: '#3b82f6' },
          { label: 'Failed Payments', value: failedPayments.toString(), change: -8.7, icon: 'lucide:x-circle', bg: 'rgba(239, 68, 68, 0.2)', color: '#ef4444' },
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
          <Card className="report-section-card h-100">
            <Card.Header><h5>Payment Method Breakdown</h5></Card.Header>
            <Card.Body>
              <Row className="g-3">
                {[
                  { label: 'Cash', value: cash, icon: 'lucide:banknote', color: '#10b981' },
                  { label: 'UPI', value: upi, icon: 'lucide:smartphone', color: '#3b82f6' },
                  { label: 'Card', value: card, icon: 'lucide:credit-card', color: '#8b5cf6' },
                  { label: 'Razorpay', value: razorpay, icon: 'lucide:zap', color: '#f59e0b' },
                ].map((m, i) => (
                  <Col sm={6} key={i}>
                    <div className="d-flex align-items-center gap-3 p-3 rounded-3" style={{ border: '1px solid var(--bs-border-color)' }}>
                      <div className="stat-icon" style={{ background: `${m.color}18`, color: m.color }}><Icon icon={m.icon} width={22} /></div>
                      <div>
                        <div style={{ fontSize: '0.9375rem', color: 'var(--bs-secondary-color)' }}>{m.label}</div>
                        <div style={{ fontSize: '1.375rem', fontWeight: 700, color: 'var(--bs-body-color)' }}>₹{m.value.toLocaleString()}</div>
                      </div>
                    </div>
                  </Col>
                ))}
              </Row>
            </Card.Body>
          </Card>
        </Col>
        <Col lg={5}>
          <Card className="report-section-card h-100">
            <Card.Header><h5>Payment Distribution</h5></Card.Header>
            <Card.Body className="d-flex align-items-center">
              <Row className="w-100 align-items-center">
                <Col xs={5} className="d-flex justify-content-center">
                  <div style={{ position: 'relative', width: '100%', maxWidth: 180, height: 180 }}>
                    <Doughnut data={doughnutData} options={doughnutOptions} />
                    <div className="donut-center-label"><div className="donut-value">₹{total.toLocaleString()}</div><div className="donut-sub">Total</div></div>
                  </div>
                </Col>
                <Col xs={7}>
                  <ul className="report-legend">
                    {[{ label: 'Cash', count: `₹${cash.toLocaleString()}`, color: '#10b981' }, { label: 'UPI', count: `₹${upi.toLocaleString()}`, color: '#3b82f6' }, { label: 'Card', count: `₹${card.toLocaleString()}`, color: '#8b5cf6' }, { label: 'Razorpay', count: `₹${razorpay.toLocaleString()}`, color: '#f59e0b' }].map((item, i) => (
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
        <Card.Header><h5>Recent Transactions</h5></Card.Header>
        <div style={{ overflowX: 'auto' }}>
          <Table className="report-table mb-0">
            <thead><tr><th>Transaction ID</th><th>Order #</th><th>Date</th><th>Method</th><th className="text-end">Amount</th><th>Status</th></tr></thead>
            <tbody>
              {paginated.map((txn, idx) => {
                const badge = statusBadge(txn.paymentStatus);
                return (
                  <tr key={idx}>
                    <td className="fw-medium" style={{ color: 'var(--bs-primary)' }}>{txn.transactionId}</td>
                    <td>{txn.order?.orderNumber || '-'}</td>
                    <td style={{ color: 'var(--bs-secondary-color)' }}>{new Date(txn.createdAt).toLocaleString()}</td>
                    <td>{txn.paymentMethod}</td>
                    <td className="text-end fw-bold" style={{ color: txn.amount < 0 ? 'var(--bs-danger)' : 'var(--bs-success)' }}>
                      {txn.amount < 0 ? `-₹${Math.abs(txn.amount).toLocaleString()}` : `₹${txn.amount.toLocaleString()}`}
                    </td>
                    <td><span className="report-badge" style={{ background: badge.bg, color: badge.color }}>{txn.paymentStatus}</span></td>
                  </tr>
                );
              })}
              {paginated.length === 0 && <tr><td colSpan="6" className="text-center py-4" style={{ color: 'var(--bs-secondary-color)' }}>No transactions</td></tr>}
            </tbody>
          </Table>
        </div>
        {totalPages > 1 && (
          <div className="d-flex flex-wrap justify-content-between align-items-center px-4 py-3" style={{ borderTop: '1px solid var(--bs-border-color)' }}>
            <span style={{ color: 'var(--bs-secondary-color)', fontSize: '0.9375rem' }}>
              Showing {(currentPage - 1) * perPage + 1} to {Math.min(currentPage * perPage, transactions.length)} of {transactions.length} results
            </span>
            <Pagination className="report-pagination mb-0">
              <Pagination.Prev onClick={() => setCurrentPage(p => Math.max(1, p - 1))} disabled={currentPage === 1}><Icon icon="lucide:chevron-left" width={16} /></Pagination.Prev>
              {Array.from({ length: Math.min(totalPages, 5) }, (_, i) => i + 1).map(p => (
                <Pagination.Item key={p} active={p === currentPage} onClick={() => setCurrentPage(p)}>{p}</Pagination.Item>
              ))}
              {totalPages > 5 && <Pagination.Ellipsis />}
              <Pagination.Next onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))} disabled={currentPage === totalPages}><Icon icon="lucide:chevron-right" width={16} /></Pagination.Next>
            </Pagination>
          </div>
        )}
      </Card>
    </div>
  );
}
