import React, { useEffect, useState, useMemo, useCallback } from 'react';
import { useNavigate } from 'react-router';
import { Row, Col, Card, Table, Spinner, Dropdown, Button, Modal, Badge } from 'react-bootstrap';
import PaginationComponent from '@/components/common/PaginationComponent';
import { usePageSize } from '@/hooks/usePageSize';
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
  const [pageSize, setPageSize] = usePageSize(50);
  const [selectedTxn, setSelectedTxn] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const { theme } = useLayoutContext();
  const navigate = useNavigate();

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
    const rows = (data.recentTransactions || []).map(txn => ({
      'Transaction ID': txn.transactionId,
      'Order #': txn.order?.orderNumber || '-',
      'Date': new Date(txn.createdAt).toLocaleString(),
      'Method': txn.paymentMethod,
      'Type': txn.orderType || '-',
      'Amount': txn.amount,
      'Status': txn.paymentStatus,
    }));
    if (type === 'excel') exportToExcel(rows, 'Payment_Report');
    else exportToPDF(
      ['Transaction ID', 'Order #', 'Date', 'Method', 'Amount', 'Status'],
      rows.map(r => [r['Transaction ID'], r['Order #'], r.Date, r.Method, 'Rs. ' + Number(r.Amount).toLocaleString('en-IN'), r.Status]),
      'Payment Report', 'Payment_Report'
    );
  }, [data]);

  const handleViewTxn = (txn) => {
    setSelectedTxn(txn);
    setShowModal(true);
  };

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

  const filteredTransactions = useMemo(() => {
    const txns = data?.recentTransactions || [];
    if (!search) return txns;
    const q = search.toLowerCase();
    return txns.filter(txn =>
      (txn.transactionId || '').toLowerCase().includes(q) ||
      (txn.order?.orderNumber || '').toLowerCase().includes(q) ||
      (txn.paymentMethod || '').toLowerCase().includes(q) ||
      (txn.paymentStatus || '').toLowerCase().includes(q) ||
      (txn.orderType || '').toLowerCase().includes(q) ||
      String(txn.amount).includes(q)
    );
  }, [data?.recentTransactions, search]);

  const totalPages = Math.ceil(filteredTransactions.length / pageSize);
  const paginated = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return filteredTransactions.slice(start, start + pageSize);
  }, [filteredTransactions, currentPage, pageSize]);

  const methodIcon = (method) => {
    const map = {
      Cash: 'lucide:banknote',
      UPI: 'lucide:smartphone',
      Card: 'lucide:credit-card',
      NetBanking: 'lucide:landmark',
      Wallet: 'lucide:wallet',
      Razorpay: 'lucide:zap',
    };
    return map[method] || 'lucide:circle';
  };

  if (loading) return <div className="d-flex justify-content-center align-items-center" style={{ minHeight: 500 }}><Spinner animation="border" /></div>;

  return (
    <div className="report-page">
      <div className="report-header">
        <div className="report-header-left">
          <h3 className="report-title">Payment Reports</h3>
        </div>
        <div className="report-header-right d-flex gap-3 align-items-center">
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
          { label: 'Total Payments', value: `₹${total.toLocaleString()}`, icon: 'lucide:wallet', bg: 'rgba(108, 92, 231, 0.2)', color: '#7c6fe0' },
          { label: 'Total Refunded', value: `₹${refunded.toLocaleString()}`, icon: 'lucide:corner-up-left', bg: 'rgba(245, 158, 11, 0.2)', color: '#f59e0b' },
          { label: 'Pending Refunds', value: pendingRefunds.toString(), icon: 'lucide:clock', bg: 'rgba(59, 130, 246, 0.2)', color: '#3b82f6' },
          { label: 'Failed Payments', value: failedPayments.toString(), icon: 'lucide:x-circle', bg: 'rgba(239, 68, 68, 0.2)', color: '#ef4444' },
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
                  <div className="stat-label text-truncate" style={{ fontSize: '14px', color: 'var(--bs-secondary-color)', fontWeight: '500' }}>{stat.label}</div>
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
                  { label: 'Cash', value: cash, icon: 'lucide:banknote', path: '/payments' },
                  { label: 'UPI', value: upi, icon: 'lucide:smartphone', path: '/payments' },
                  { label: 'Card', value: card, icon: 'lucide:credit-card', path: '/payments' },
                  { label: 'Razorpay', value: razorpay, icon: 'lucide:zap', path: '/payments' },
                ].map((m, i) => (
                  <Col sm={6} key={i}>
                    <Card
                      className="report-stat-card h-100 mb-0"
                      onClick={() => navigate(m.path)}
                      style={{ cursor: 'pointer' }}
                    >
                      <Card.Body className="d-flex align-items-center gap-3 p-3">
                        <div className="stat-icon rounded-circle flex-shrink-0" style={{ width: 44, height: 44, background: 'rgba(var(--bs-primary-rgb), 0.12)', color: 'var(--bs-primary)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                          <Icon icon={m.icon} width={20} />
                        </div>
                        <div className="flex-grow-1">
                          <div style={{ fontSize: '0.8125rem', color: 'var(--bs-secondary-color)', fontWeight: '500', textTransform: 'uppercase', letterSpacing: '0.5px' }}>{m.label}</div>
                          <div style={{ fontSize: '1.375rem', fontWeight: 700, color: 'var(--bs-body-color)', lineHeight: 1, marginTop: '4px' }}>₹{m.value.toLocaleString()}</div>
                        </div>
                        <Icon icon="lucide:chevron-right" width={18} style={{ color: 'var(--bs-secondary-color)' }} />
                      </Card.Body>
                    </Card>
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
                    <div className="donut-center-label"><div className="donut-value" style={{ fontSize: '1.125rem' }}>₹{total.toLocaleString()}</div><div className="donut-sub">Total</div></div>
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
        <Card.Header className="d-flex justify-content-between align-items-center pb-0 border-0">
          <h5 className="mb-0">Recent Transactions</h5>
          <div className="d-flex gap-2 align-items-center">
            <div className="report-search-wrap" style={{ width: '250px', position: 'relative' }}>
              <Icon icon="lucide:search" width={18} className="search-icon" style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--bs-secondary-color)' }} />
              <input
                type="text"
                className="form-control report-search-input"
                placeholder="Search transactions..."
                value={search}
                onChange={(e) => { setSearch(e.target.value); setCurrentPage(1); }}
                style={{ paddingLeft: '38px' }}
              />
            </div>
          </div>
        </Card.Header>
        <div style={{ overflowX: 'auto' }} className="pt-3">
          <Table className="report-table mb-0">
            <thead className="custom-table-thead" style={{
              fontSize: '12px',
              textTransform: 'uppercase',
              letterSpacing: '0.5px',
              backgroundColor: 'rgba(255, 255, 255, 0.03)'
            }}>
              <tr>
                <th className="py-2 text-muted border-dashed">TRANSACTION ID</th>
                <th className="py-2 text-muted border-dashed">ORDER #</th>
                <th className="py-2 text-muted border-dashed">DATE</th>
                <th className="py-2 text-muted border-dashed">METHOD</th>
                <th className="py-2 text-muted border-dashed">TYPE</th>
                <th className="py-2 text-end text-muted border-dashed">AMOUNT</th>
                <th className="py-2 text-muted border-dashed">STATUS</th>
                <th className="py-2 text-center text-muted border-dashed">ACTION</th>
              </tr>
            </thead>
            <tbody>
              {paginated.map((txn, idx) => (
                <tr key={idx}>
                  <td className="align-middle border-dashed fw-medium" style={{ fontSize: '14px' }}>{txn.transactionId}</td>
                  <td className="align-middle border-dashed" style={{ fontSize: '14px', color: 'var(--bs-secondary-color)' }}>{txn.order?.orderNumber || '-'}</td>
                  <td className="align-middle border-dashed" style={{ fontSize: '14px', color: 'var(--bs-secondary-color)' }}>{new Date(txn.createdAt).toLocaleDateString()}</td>
                  <td className="align-middle border-dashed">
                    <div className="d-flex align-items-center gap-2">
                      <Icon icon={methodIcon(txn.paymentMethod)} width={16} style={{ color: 'var(--bs-primary)' }} />
                      <span style={{ fontSize: '14px' }}>{txn.paymentMethod}</span>
                    </div>
                  </td>
                  <td className="align-middle border-dashed">
                    <Badge bg="primary" className="px-2 py-1" style={{ borderRadius: '6px', fontSize: '11px', fontWeight: '600' }}>
                      {txn.orderType || '-'}
                    </Badge>
                  </td>
                  <td className="align-middle border-dashed text-end fw-bold" style={{ color: txn.amount < 0 ? 'var(--bs-danger)' : 'var(--bs-body-color)', fontSize: '14px' }}>
                    {txn.amount < 0 ? `-₹${Math.abs(txn.amount).toLocaleString()}` : `₹${txn.amount.toLocaleString()}`}
                  </td>
                  <td className="align-middle border-dashed">
                    <Badge
                      bg={txn.paymentStatus === 'Paid' || txn.paymentStatus === 'Success' ? 'success' : txn.paymentStatus === 'Failed' ? 'danger' : txn.paymentStatus === 'Pending' ? 'warning' : 'secondary'}
                      className="px-2 py-1 d-inline-flex align-items-center gap-1"
                      style={{ borderRadius: '6px', fontSize: '12px', fontWeight: '600' }}
                    >
                      <Icon icon={txn.paymentStatus === 'Paid' || txn.paymentStatus === 'Success' ? 'lucide:check-circle-2' : txn.paymentStatus === 'Failed' ? 'lucide:x-circle' : 'lucide:clock'} width={13} />
                      {txn.paymentStatus}
                    </Badge>
                  </td>
                  <td className="align-middle border-dashed text-center">
                    <button className="report-action-btn" title="View Details" onClick={() => handleViewTxn(txn)}>
                      <Icon icon="lucide:eye" width={17} />
                    </button>
                  </td>
                </tr>
              ))}
              {paginated.length === 0 && (
                <tr><td colSpan="8" className="text-center py-4 border-dashed" style={{ color: 'var(--bs-secondary-color)' }}>No transactions found</td></tr>
              )}
            </tbody>
          </Table>
        </div>

        {filteredTransactions.length > 0 && (
          <div className="d-flex justify-content-between align-items-center mt-3 pt-3 border-top px-3 pb-3">
            <PaginationComponent currentPage={currentPage} totalPages={totalPages} totalRecords={filteredTransactions.length} onPageChange={setCurrentPage} pageSize={pageSize} onPageSizeChange={setPageSize} />
          </div>
        )}
      </Card>

      {/* ──────── Transaction Details Modal ──────── */}
      <Modal show={showModal} onHide={() => setShowModal(false)} centered size="lg" contentClassName="border-0" style={{ backdropFilter: 'blur(8px)' }}>
        <Modal.Header closeButton className="border-0 pb-0">
          <Modal.Title className="fw-bold" style={{ fontSize: '1.25rem' }}>Transaction Details</Modal.Title>
        </Modal.Header>
        <Modal.Body className="px-4 pt-3 pb-4">
          {selectedTxn && (
            <Row>
              <Col md={6}>
                <h6 className="fw-bold mb-3">Payment Information</h6>
                <Table borderless size="sm" className="mb-0">
                  <tbody>
                    <tr><td className="text-muted" style={{ width: '140px' }}>Transaction ID:</td><td className="fw-medium" style={{ color: 'var(--bs-body-color)' }}>{selectedTxn.transactionId}</td></tr>
                    <tr><td className="text-muted">Order Number:</td><td className="fw-medium" style={{ color: 'var(--bs-body-color)' }}>{selectedTxn.order?.orderNumber || '-'}</td></tr>
                    <tr><td className="text-muted">Date & Time:</td><td className="fw-medium" style={{ color: 'var(--bs-body-color)' }}>{new Date(selectedTxn.createdAt).toLocaleString()}</td></tr>
                    <tr>
                      <td className="text-muted">Method:</td>
                      <td>
                        <Badge bg="primary" className="px-3 py-2 d-inline-flex align-items-center gap-2" style={{ borderRadius: '8px', fontSize: '14px', fontWeight: '600' }}>
                          <Icon icon={methodIcon(selectedTxn.paymentMethod)} width={16} /> {selectedTxn.paymentMethod}
                        </Badge>
                      </td>
                    </tr>
                    <tr>
                      <td className="text-muted">Order Type:</td>
                      <td>
                        <Badge bg="primary" className="px-3 py-2 d-inline-flex align-items-center gap-2" style={{ borderRadius: '8px', fontSize: '14px', fontWeight: '600' }}>
                          {selectedTxn.orderType || '-'}
                        </Badge>
                      </td>
                    </tr>
                  </tbody>
                </Table>
              </Col>
              <Col md={6}>
                <h6 className="fw-bold mb-3">Amount & Status</h6>
                <Table borderless size="sm" className="mb-0">
                  <tbody>
                    <tr>
                      <td className="text-muted" style={{ width: '140px' }}>Amount:</td>
                      <td className="fw-bold" style={{ fontSize: '1.25rem', color: selectedTxn.amount < 0 ? 'var(--bs-danger)' : 'var(--bs-body-color)' }}>
                        {selectedTxn.amount < 0 ? `-₹${Math.abs(selectedTxn.amount).toLocaleString()}` : `₹${selectedTxn.amount.toLocaleString()}`}
                      </td>
                    </tr>
                    <tr>
                      <td className="text-muted">Payment Status:</td>
                      <td>
                        <Badge
                          bg={selectedTxn.paymentStatus === 'Paid' || selectedTxn.paymentStatus === 'Success' ? 'success' : selectedTxn.paymentStatus === 'Failed' ? 'danger' : selectedTxn.paymentStatus === 'Pending' ? 'warning' : 'secondary'}
                          className="px-3 py-2 d-inline-flex align-items-center gap-2"
                          style={{ borderRadius: '8px', fontSize: '14px', fontWeight: '600' }}
                        >
                          <Icon icon={selectedTxn.paymentStatus === 'Paid' || selectedTxn.paymentStatus === 'Success' ? 'lucide:check-circle-2' : selectedTxn.paymentStatus === 'Failed' ? 'lucide:x-circle' : 'lucide:clock'} width={16} />
                          {selectedTxn.paymentStatus}
                        </Badge>
                      </td>
                    </tr>
                    {selectedTxn.refundAmount > 0 && (
                      <tr><td className="text-muted">Refund Amount:</td><td className="fw-bold" style={{ color: 'var(--bs-danger)' }}>₹{selectedTxn.refundAmount.toLocaleString()}</td></tr>
                    )}
                    {selectedTxn.refundStatus && selectedTxn.refundStatus !== 'None' && (
                      <tr><td className="text-muted">Refund Status:</td><td className="fw-medium" style={{ color: 'var(--bs-body-color)' }}>{selectedTxn.refundStatus}</td></tr>
                    )}
                    {selectedTxn.referenceNumber && (
                      <tr><td className="text-muted">Reference #:</td><td className="fw-medium" style={{ color: 'var(--bs-body-color)' }}>{selectedTxn.referenceNumber}</td></tr>
                    )}
                    {selectedTxn.paidAt && (
                      <tr><td className="text-muted">Paid At:</td><td className="fw-medium" style={{ color: 'var(--bs-body-color)' }}>{new Date(selectedTxn.paidAt).toLocaleString()}</td></tr>
                    )}
                    {selectedTxn.razorpayPaymentId && (
                      <tr><td className="text-muted">Razorpay ID:</td><td className="fw-medium" style={{ color: 'var(--bs-body-color)' }}>{selectedTxn.razorpayPaymentId}</td></tr>
                    )}
                  </tbody>
                </Table>
              </Col>
            </Row>
          )}
        </Modal.Body>
        <Modal.Footer className="border-0 pb-4 pe-4">
          <Button variant="primary" onClick={() => setShowModal(false)} className="px-4">Close</Button>
        </Modal.Footer>
      </Modal>
    </div>
  );
}
