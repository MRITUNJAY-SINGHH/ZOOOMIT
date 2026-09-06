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

export default function InventoryReport() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [tableLoading, setTableLoading] = useState(false);
  const [selectedLog, setSelectedLog] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const { theme } = useLayoutContext();
  const navigate = useNavigate();

  const isDark = useMemo(() => {
    if (theme === 'dark') return true;
    if (theme === 'system') return window.matchMedia('(prefers-color-scheme: dark)').matches;
    return false;
  }, [theme]);

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = usePageSize(50);

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

  const handleViewLog = (log) => {
    setSelectedLog(log);
    setShowModal(true);
  };

  const currentStock = data?.summary?.currentStock || 0;
  const lowStock = data?.summary?.lowStock || 0;
  const outOfStock = data?.summary?.outOfStock || 0;
  const expiring = data?.summary?.expiring || 0;
  const expired = data?.summary?.expired || 0;
  const inventoryValue = data?.summary?.inventoryValue || 0;
  const healthy = Math.max(currentStock - lowStock - outOfStock, 0);

  const doughnutData = {
    labels: ['Healthy', 'Low Stock', 'Out of Stock'],
    datasets: [{ data: [healthy, lowStock, outOfStock], backgroundColor: ['#10b981', '#f59e0b', '#ef4444'], borderWidth: 0, cutout: '72%' }]
  };
  const doughnutOptions = {
    responsive: true, maintainAspectRatio: false,
    plugins: { legend: { display: false }, tooltip: { backgroundColor: tooltipBg, titleColor: tooltipTitle, bodyColor: tooltipBody, borderColor: tooltipBorder, borderWidth: 1, padding: 12 } }
  };

  const typeBadge = (type) => {
    const map = {
      ADD: { icon: 'lucide:plus-circle' },
      SALE: { icon: 'lucide:shopping-cart' },
      RETURN: { icon: 'lucide:undo-2' },
      ADJUSTMENT: { icon: 'lucide:settings-2' }
    };
    return map[type] || { icon: 'lucide:circle' };
  };

  // Search filter (client-side on logs)
  const filteredLogs = useMemo(() => {
    if (!data?.recentLogs) return [];
    if (!search) return data.recentLogs;
    const q = search.toLowerCase();
    return data.recentLogs.filter(log =>
      (log.product?.name || '').toLowerCase().includes(q) ||
      (log.type || '').toLowerCase().includes(q) ||
      (log.reason || '').toLowerCase().includes(q) ||
      (log.user?.name || '').toLowerCase().includes(q)
    );
  }, [data?.recentLogs, search]);

  const totalPages = Math.ceil(filteredLogs.length / pageSize);
  const paginated = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return filteredLogs.slice(start, start + pageSize);
  }, [filteredLogs, currentPage, pageSize]);

  const handleSearch = () => {
    setCurrentPage(1);
    // Search is already reactive via the useMemo, this just resets pagination
  };

  if (loading) return <div className="d-flex justify-content-center align-items-center" style={{ minHeight: 500 }}><Spinner animation="border" /></div>;

  return (
    <div className="report-page">
      {/* ──────── Header ──────── */}
      <div className="report-header">
        <div className="report-header-left">
          <h3 className="report-title">Inventory Reports</h3>
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

      {/* ──────── KPI Stat Cards ──────── */}
      <Row className="mb-4 g-3">
        {[
          { label: 'Current Stock', value: currentStock.toLocaleString(), suffix: ' Units', icon: 'lucide:box', bg: 'rgba(108, 92, 231, 0.2)', color: '#7c6fe0' },
          { label: 'Inventory Value', value: `₹${inventoryValue.toLocaleString()}`, suffix: '', icon: 'lucide:indian-rupee', bg: 'rgba(16, 185, 129, 0.2)', color: '#10b981' },
          { label: 'Low Stock Items', value: lowStock.toString(), suffix: '', icon: 'lucide:alert-triangle', bg: 'rgba(245, 158, 11, 0.2)', color: '#f59e0b' },
          { label: 'Out of Stock', value: outOfStock.toString(), suffix: '', icon: 'lucide:x-circle', bg: 'rgba(239, 68, 68, 0.2)', color: '#ef4444' },
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

      {/* ──────── Clickable Navigation Cards + Doughnut ──────── */}
      <Row className="mb-4 g-3">
        <Col lg={7}>
          <Row className="g-3 h-100">
            {[
              { label: 'Low Stock Items', value: lowStock, icon: 'lucide:alert-triangle', bg: 'rgba(245, 158, 11, 0.15)', color: '#f59e0b', path: '/inventory/low-stock' },
              { label: 'Expiring Soon (30d)', value: expiring, icon: 'lucide:clock', bg: 'rgba(245, 158, 11, 0.15)', color: '#f59e0b', path: '/inventory/upcoming-expiry' },
              { label: 'Already Expired', value: expired, icon: 'lucide:alert-octagon', bg: 'rgba(239, 68, 68, 0.15)', color: '#ef4444', path: '/inventory/upcoming-expiry' },
            ].map((card, i) => (
              <Col sm={i === 2 ? 12 : 6} key={i}>
                <Card
                  className="report-stat-card h-100"
                  onClick={() => navigate(card.path)}
                  style={{ cursor: 'pointer' }}
                >
                  <Card.Body className="d-flex align-items-center gap-3 p-4">
                    <div className="stat-icon rounded-circle flex-shrink-0" style={{ width: 48, height: 48, background: card.bg, color: card.color, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <Icon icon={card.icon} width={22} />
                    </div>
                    <div>
                      <div style={{ fontSize: '0.875rem', color: 'var(--bs-secondary-color)', fontWeight: '500', marginBottom: '4px' }}>{card.label}</div>
                      <div style={{ fontSize: '1.75rem', fontWeight: 700, color: 'var(--bs-body-color)', lineHeight: 1 }}>{card.value}</div>
                    </div>
                    <div className="ms-auto">
                      <Icon icon="lucide:chevron-right" width={20} style={{ color: 'var(--bs-secondary-color)' }} />
                    </div>
                  </Card.Body>
                </Card>
              </Col>
            ))}
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

      {/* ──────── Recent Stock Movements Table ──────── */}
      <Card className="report-section-card">
        <Card.Header className="d-flex justify-content-between align-items-center pb-0 border-0">
          <h5 className="mb-0">Recent Stock Movements</h5>
          <div className="d-flex gap-2 align-items-center">
            <div className="report-search-wrap" style={{ width: '250px', position: 'relative' }}>
              <Icon icon="lucide:search" width={18} className="search-icon" style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--bs-secondary-color)' }} />
              <input
                type="text"
                className="form-control report-search-input"
                placeholder="Search movements..."
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
                <th className="py-2 text-muted border-dashed">DATE</th>
                <th className="py-2 text-muted border-dashed">TYPE</th>
                <th className="py-2 text-muted border-dashed">PRODUCT</th>
                <th className="py-2 text-end text-muted border-dashed">QTY CHANGED</th>
                <th className="py-2 text-muted border-dashed">REASON</th>
                <th className="py-2 text-muted border-dashed">USER</th>
                <th className="py-2 text-center text-muted border-dashed">ACTION</th>
              </tr>
            </thead>
            <tbody>
              {paginated.map((log, idx) => {
                const badge = typeBadge(log.type);
                return (
                  <tr key={idx}>
                    <td className="align-middle border-dashed" style={{ color: 'var(--bs-secondary-color)', fontSize: '14px' }}>{new Date(log.date).toLocaleDateString()}</td>
                    <td className="align-middle border-dashed">
                      <Badge bg="primary" className="px-2 py-1 d-inline-flex align-items-center gap-1" style={{ borderRadius: '6px', fontSize: '12px', fontWeight: '600' }}>
                        <Icon icon={badge.icon} width={13} /> {log.type}
                      </Badge>
                    </td>
                    <td className="align-middle border-dashed fw-medium">{log.product?.name || 'Unknown'}</td>
                    <td className="align-middle border-dashed text-end fw-bold" style={{ color: log.quantityChanged > 0 ? 'var(--bs-success)' : 'var(--bs-danger)', fontSize: '14px' }}>
                      {log.quantityChanged > 0 ? `+${log.quantityChanged}` : log.quantityChanged}
                    </td>
                    <td className="align-middle border-dashed" style={{ color: 'var(--bs-secondary-color)', fontSize: '14px' }}>{log.reason || '-'}</td>
                    <td className="align-middle border-dashed" style={{ fontSize: '14px' }}>{log.user?.name || '-'}</td>
                    <td className="align-middle border-dashed text-center">
                      <button className="report-action-btn" title="View Details" onClick={() => handleViewLog(log)}>
                        <Icon icon="lucide:eye" width={17} />
                      </button>
                    </td>
                  </tr>
                );
              })}
              {paginated.length === 0 && (
                <tr><td colSpan="7" className="text-center py-4 border-dashed" style={{ color: 'var(--bs-secondary-color)' }}>No stock movements found</td></tr>
              )}
            </tbody>
          </Table>
        </div>

        {/* Pagination */}
        {filteredLogs.length > 0 && (
          <div className="d-flex justify-content-between align-items-center mt-3 pt-3 border-top px-3">
            <PaginationComponent currentPage={currentPage} totalPages={totalPages} totalRecords={filteredLogs.length} onPageChange={setCurrentPage} pageSize={pageSize} onPageSizeChange={setPageSize} />
          </div>
        )}
      </Card>

      {/* ──────── View Log Details Modal ──────── */}
      <Modal show={showModal} onHide={() => setShowModal(false)} centered size="lg" contentClassName="border-0" style={{ backdropFilter: 'blur(8px)' }}>
        <Modal.Header closeButton className="border-0 pb-0">
          <Modal.Title className="fw-bold" style={{ fontSize: '1.25rem' }}>Stock Movement Details</Modal.Title>
        </Modal.Header>
        <Modal.Body className="px-4 pt-3 pb-4">
          {selectedLog && (
            <Row>
              <Col md={6}>
                <h6 className="fw-bold mb-3">Movement Information</h6>
                <Table borderless size="sm" className="mb-0">
                  <tbody>
                    <tr><td className="text-muted" style={{ width: '140px' }}>Date & Time:</td><td className="fw-medium" style={{ color: 'var(--bs-body-color)' }}>{new Date(selectedLog.date).toLocaleString()}</td></tr>
                    <tr>
                      <td className="text-muted">Type:</td>
                      <td>
                        <Badge bg="primary" className="px-3 py-2 d-inline-flex align-items-center gap-2" style={{ borderRadius: '8px', fontSize: '14px', fontWeight: '600' }}>
                          <Icon icon={typeBadge(selectedLog.type).icon} width={16} /> {selectedLog.type}
                        </Badge>
                      </td>
                    </tr>
                    <tr><td className="text-muted">Quantity:</td><td className="fw-bold" style={{ color: selectedLog.quantityChanged > 0 ? 'var(--bs-success)' : 'var(--bs-danger)' }}>{selectedLog.quantityChanged > 0 ? `+${selectedLog.quantityChanged}` : selectedLog.quantityChanged}</td></tr>
                    <tr><td className="text-muted">Reason:</td><td className="fw-medium" style={{ color: 'var(--bs-body-color)' }}>{selectedLog.reason || 'N/A'}</td></tr>
                  </tbody>
                </Table>
              </Col>
              <Col md={6}>
                <h6 className="fw-bold mb-3">Product & User</h6>
                <Table borderless size="sm" className="mb-0">
                  <tbody>
                    <tr><td className="text-muted" style={{ width: '140px' }}>Product:</td><td className="fw-medium" style={{ color: 'var(--bs-body-color)' }}>{selectedLog.product?.name || 'Unknown'}</td></tr>
                    <tr><td className="text-muted">Performed By:</td><td className="fw-medium" style={{ color: 'var(--bs-body-color)' }}>{selectedLog.user?.name || 'Unknown'}</td></tr>
                    {selectedLog.batchNumber && (
                      <tr><td className="text-muted">Batch:</td><td className="fw-medium" style={{ color: 'var(--bs-body-color)' }}>{selectedLog.batchNumber}</td></tr>
                    )}
                    {selectedLog.notes && (
                      <tr><td className="text-muted">Notes:</td><td className="fw-medium" style={{ color: 'var(--bs-body-color)' }}>{selectedLog.notes}</td></tr>
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
