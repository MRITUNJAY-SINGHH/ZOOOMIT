import React, { useEffect, useState, useMemo, useCallback } from 'react';
import { Row, Col, Card, Table, Spinner, Pagination, Dropdown, Offcanvas, Form, Button } from 'react-bootstrap';
import Icon from '@/components/wrappers/Icon';
import api from '@/utils/api';
import { exportToExcel, exportToPDF } from '@/utils/exportUtils';
import { Doughnut, Line } from 'react-chartjs-2';
import CountUp from 'react-countup';
import { useLayoutContext } from '@/context/useLayoutContext';
import CustomerActionModals from './CustomerActionModals';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
  Filler,
} from 'chart.js';

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, ArcElement, Title, Tooltip, Legend, Filler);

const AVATAR_COLORS = ['#7c3aed', '#2563eb', '#059669', '#d97706', '#dc2626', '#0891b2', '#7e22ce', '#be185d'];
const getAvatarColor = (name) => {
  let hash = 0;
  for (let i = 0; i < (name || '').length; i++) hash = name.charCodeAt(i) + ((hash << 5) - hash);
  return AVATAR_COLORS[Math.abs(hash) % AVATAR_COLORS.length];
};
const getInitials = (name) => (name || 'U').split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2);

const SORT_OPTIONS = [
  { value: 'totalSpent-desc', label: 'Sort by: Lifetime Value ↓' },
  { value: 'totalSpent-asc', label: 'Sort by: Lifetime Value ↑' },
  { value: 'orderCount-desc', label: 'Sort by: Order Count ↓' },
  { value: 'orderCount-asc', label: 'Sort by: Order Count ↑' },
  { value: 'name-asc', label: 'Sort by: Name A → Z' },
  { value: 'name-desc', label: 'Sort by: Name Z → A' },
];

export default function CustomerReport() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  
  // API Query State
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  
  const [dateRange, setDateRange] = useState('last-30');
  const [customStartDate, setCustomStartDate] = useState('');
  const [customEndDate, setCustomEndDate] = useState('');
  
  // Offcanvas Filters State
  const [showFilters, setShowFilters] = useState(false);
  const [customerType, setCustomerType] = useState('All');
  const [status, setStatus] = useState('All');
  const [orderCount, setOrderCount] = useState('All');
  const [spent, setSpent] = useState('All');
  const [sortBy, setSortBy] = useState('totalSpent-desc');
  
  const [modalState, setModalState] = useState({ show: false, type: '', customerId: null });
  const [exportingExcel, setExportingExcel] = useState(false);
  const [exportingPdf, setExportingPdf] = useState(false);
  
  const [currentPage, setCurrentPage] = useState(1);
  const { theme } = useLayoutContext();
  const perPage = 5;

  const isDark = useMemo(() => {
    if (theme === 'dark') return true;
    if (theme === 'system') return window.matchMedia('(prefers-color-scheme: dark)').matches;
    return false;
  }, [theme]);

  // Debounce search input
  useEffect(() => {
    const handler = setTimeout(() => setDebouncedSearch(search), 500);
    return () => clearTimeout(handler);
  }, [search]);

  // Fetch Data based on filters
  const fetchData = useCallback(() => {
    setLoading(true);
    let startDate = '';
    let endDate = '';
    
    const today = new Date();
    if (dateRange === 'today') {
      startDate = new Date(today.setHours(0,0,0,0)).toISOString();
      endDate = new Date(today.setHours(23,59,59,999)).toISOString();
    } else if (dateRange === 'last-7') {
      const last7 = new Date();
      last7.setDate(today.getDate() - 7);
      startDate = last7.toISOString();
      endDate = new Date().toISOString();
    } else if (dateRange === 'this-month') {
      startDate = new Date(today.getFullYear(), today.getMonth(), 1).toISOString();
      endDate = new Date(today.getFullYear(), today.getMonth() + 1, 0, 23, 59, 59).toISOString();
    } else if (dateRange === 'last-30') {
      const last30 = new Date();
      last30.setDate(today.getDate() - 30);
      startDate = last30.toISOString();
      endDate = new Date().toISOString();
    } else if (dateRange === 'custom') {
      startDate = customStartDate ? new Date(customStartDate).toISOString() : '';
      endDate = customEndDate ? new Date(customEndDate).toISOString() : '';
    }

    const params = new URLSearchParams();
    if (startDate) params.append('startDate', startDate);
    if (endDate) params.append('endDate', endDate);
    if (debouncedSearch) params.append('search', debouncedSearch);
    if (customerType !== 'All') params.append('customerType', customerType);
    if (status !== 'All') params.append('status', status);
    if (orderCount !== 'All') params.append('orderCount', orderCount);
    if (spent !== 'All') params.append('spent', spent);
    if (sortBy) params.append('sortBy', sortBy);

    api.get(`/reports/customer?${params.toString()}`).then(res => {
      setData(res.data);
      setLoading(false);
      setCurrentPage(1); // Reset page on new data
    }).catch(() => setLoading(false));
  }, [dateRange, customStartDate, customEndDate, debouncedSearch, customerType, status, orderCount, spent, sortBy]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Computed stats from API response
  const totalCustomers = data?.summary?.totalCustomers || 0;
  const newCustomers = data?.summary?.newCustomers || 0;
  const returningCustomers = data?.summary?.returningCustomers || 0;
  const allCustomers = data?.topCustomers || [];

  const avgLifetimeValue = allCustomers.length > 0
    ? Math.round(allCustomers.reduce((sum, c) => sum + c.totalSpent, 0) / allCustomers.length)
    : 0;

  // Pagination for table
  const totalPages = Math.ceil(allCustomers.length / perPage);
  const paginated = allCustomers.slice((currentPage - 1) * perPage, currentPage * perPage);

  // Theme-aware chart config
  const gridColor = isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.06)';
  const textColor = isDark ? 'rgba(255,255,255,0.6)' : 'rgba(0,0,0,0.5)';
  const tooltipBg = isDark ? 'rgba(30,41,59,0.95)' : 'rgba(255,255,255,0.98)';
  const tooltipTitle = isDark ? '#e2e8f0' : '#1e293b';
  const tooltipBody = isDark ? '#94a3b8' : '#64748b';
  const tooltipBorder = isDark ? '#334155' : '#e2e8f0';

  // Export functionality
  const handleExport = useCallback((type) => {
    if (!data) return;
    const rows = allCustomers.map(c => ({
      Name: c.customerName, Phone: c.customerPhone, Email: c.customerEmail,
      'Total Orders': c.orderCount, 'Total Spent': c.totalSpent,
      'Avg Order Value': c.orderCount > 0 ? Math.round(c.totalSpent / c.orderCount) : 0,
      'Created At': new Date(c.createdAt).toLocaleDateString(),
    }));
    
    if (type === 'excel') {
      setExportingExcel(true);
      setTimeout(() => {
        exportToExcel(rows, 'Customer_Report');
        setExportingExcel(false);
      }, 50);
    } else {
      setExportingPdf(true);
      setTimeout(() => {
        exportToPDF(
          ['Name', 'Phone', 'Orders', 'Total Spent', 'Avg Value', 'Joined'],
          rows.map(r => [r.Name, r.Phone, String(r['Total Orders']), `₹${r['Total Spent']}`, `₹${r['Avg Order Value']}`, r['Created At']]),
          'Customer Report', 'Customer_Report'
        );
        setExportingPdf(false);
      }, 50);
    }
  }, [data, allCustomers]);

  // Segment logic based on totalSpent/orderCount for the table badge
  const getSegmentBadge = (c) => {
    if (c.totalSpent >= 20000) return { label: 'VIP', bg: 'rgba(239,68,68,0.12)', color: '#ef4444' };
    if (c.orderCount > 1) return { label: 'Returning', bg: 'rgba(59,130,246,0.12)', color: '#3b82f6' };
    if (c.orderCount === 1) return { label: 'First Order', bg: 'rgba(245,158,11,0.12)', color: '#f59e0b' };
    return { label: 'Regular', bg: 'rgba(16,185,129,0.12)', color: '#10b981' };
  };

  return (
    <div className="report-page">

      {/* ──────── Header ──────── */}
      <div className="report-header">
        <div className="report-header-left">
          <h3 className="report-title mb-0">Customer Reports</h3>
        </div>
        <div className="report-header-right">
          <div className="report-search-wrap" style={{ width: '250px' }}>
            <Icon icon="lucide:search" width={20} className="search-icon" />
            <input 
              type="text" 
              className="form-control report-search-input" 
              placeholder="Search customer..." 
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          
          <Dropdown>
            <Dropdown.Toggle variant="primary" className="d-inline-flex align-items-center gap-2">
              <Icon icon="lucide:calendar" width={20} />
              <span>
                {dateRange === 'today' && 'Today'}
                {dateRange === 'last-7' && 'Last 7 Days'}
                {dateRange === 'last-30' && 'Last 30 Days'}
                {dateRange === 'this-month' && 'This Month'}
                {dateRange === 'custom' && 'Custom Range'}
              </span>
            </Dropdown.Toggle>
            <Dropdown.Menu align="end">
              <Dropdown.Item onClick={() => setDateRange('today')}>Today</Dropdown.Item>
              <Dropdown.Item onClick={() => setDateRange('last-7')}>Last 7 Days</Dropdown.Item>
              <Dropdown.Item onClick={() => setDateRange('last-30')}>Last 30 Days</Dropdown.Item>
              <Dropdown.Item onClick={() => setDateRange('this-month')}>This Month</Dropdown.Item>
              <Dropdown.Divider />
              <div className="px-3 py-2">
                <Form.Group className="mb-2">
                  <Form.Label className="small mb-1">Start Date</Form.Label>
                  <Form.Control type="date" size="sm" value={customStartDate} onChange={e => { setCustomStartDate(e.target.value); setDateRange('custom'); }} />
                </Form.Group>
                <Form.Group>
                  <Form.Label className="small mb-1">End Date</Form.Label>
                  <Form.Control type="date" size="sm" value={customEndDate} onChange={e => { setCustomEndDate(e.target.value); setDateRange('custom'); }} />
                </Form.Group>
              </div>
            </Dropdown.Menu>
          </Dropdown>

          <Button variant="primary" className="d-inline-flex align-items-center gap-2" onClick={() => setShowFilters(true)}>
            <Icon icon="lucide:sliders-horizontal" width={16} />
            <span>Filters</span>
          </Button>
          
          <Dropdown>
            <Dropdown.Toggle variant="primary" className="d-inline-flex align-items-center gap-2">
              <Icon icon="lucide:download" width={16} />
              <span>Export</span>
            </Dropdown.Toggle>
            <Dropdown.Menu align="end">
              <Dropdown.Item onClick={() => handleExport('excel')} disabled={exportingExcel || exportingPdf}>
                {exportingExcel ? <Spinner size="sm" className="me-2" /> : <Icon icon="lucide:file-spreadsheet" width={16} className="me-2" />} Export as Excel
              </Dropdown.Item>
              <Dropdown.Item onClick={() => handleExport('pdf')} disabled={exportingExcel || exportingPdf}>
                {exportingPdf ? <Spinner size="sm" className="me-2" /> : <Icon icon="lucide:file-text" width={16} className="me-2" />} Export as PDF
              </Dropdown.Item>
            </Dropdown.Menu>
          </Dropdown>
        </div>
      </div>

      {/* ──────── Filters Offcanvas ──────── */}
      <Offcanvas show={showFilters} onHide={() => setShowFilters(false)} placement="end">
        <Offcanvas.Header closeButton>
          <Offcanvas.Title>Advanced Filters</Offcanvas.Title>
        </Offcanvas.Header>
        <Offcanvas.Body>
          <Form>
            <Form.Group className="mb-4">
              <Form.Label>Customer Type</Form.Label>
              <Form.Select value={customerType} onChange={e => setCustomerType(e.target.value)}>
                <option value="All">All</option>
                <option value="APP">App Customer</option>
                <option value="WALK_IN">Walk-in Customer</option>
              </Form.Select>
            </Form.Group>

            <Form.Group className="mb-4">
              <Form.Label>Status</Form.Label>
              <Form.Select value={status} onChange={e => setStatus(e.target.value)}>
                <option value="All">All</option>
                <option value="Active">Active</option>
                <option value="Inactive">Inactive</option>
              </Form.Select>
            </Form.Group>

            <Form.Group className="mb-4">
              <Form.Label>Order Count</Form.Label>
              <Form.Select value={orderCount} onChange={e => setOrderCount(e.target.value)}>
                <option value="All">All</option>
                <option value="First Order">First Order (1)</option>
                <option value="Returning">Returning (&gt;1)</option>
                <option value="VIP Customers">VIP Customers (5+)</option>
              </Form.Select>
            </Form.Group>

            <Form.Group className="mb-4">
              <Form.Label>Spent Amount</Form.Label>
              <Form.Select value={spent} onChange={e => setSpent(e.target.value)}>
                <option value="All">All</option>
                <option value="₹0–₹5,000">₹0 – ₹5,000</option>
                <option value="₹5,000–₹20,000">₹5,000 – ₹20,000</option>
                <option value="₹20,000+">₹20,000+</option>
              </Form.Select>
            </Form.Group>

            <Form.Group className="mb-4">
              <Form.Label>Sort By</Form.Label>
              <Form.Select value={sortBy} onChange={e => setSortBy(e.target.value)}>
                {SORT_OPTIONS.map(opt => (
                  <option key={opt.value} value={opt.value}>{opt.label.replace('↓', '').replace('↑', '').replace('→', 'to')}</option>
                ))}
              </Form.Select>
            </Form.Group>

            <div className="d-flex gap-2">
              <Button variant="primary" className="w-50" onClick={() => {
                setCustomerType('All');
                setStatus('All');
                setOrderCount('All');
                setSpent('All');
                setSortBy('totalSpent-desc');
                setSearch('');
                setDateRange('last-30');
              }}>
                Reset
              </Button>
              <Button variant="primary" className="w-50" onClick={() => setShowFilters(false)}>
                Apply Filters
              </Button>
            </div>
          </Form>
        </Offcanvas.Body>
      </Offcanvas>

      {/* ──────── KPI Stat Cards ──────── */}
      {loading && !data ? (
        <div className="d-flex justify-content-center align-items-center" style={{ minHeight: 200 }}><Spinner animation="border" /></div>
      ) : (
        <>
          <Row className="mb-4 g-3">
            {[
              { label: 'Total Customers', value: totalCustomers, prefix: '', icon: 'lucide:users', accent: 'accent-purple' },
              { label: 'New Customers', value: newCustomers, prefix: '', icon: 'lucide:user-plus', accent: 'accent-green' },
              { label: 'Returning Customers', value: returningCustomers, prefix: '', icon: 'lucide:repeat-2', accent: 'accent-blue' },
              { label: 'Avg. Lifetime Value', value: avgLifetimeValue, prefix: '₹', icon: 'lucide:indian-rupee', accent: 'accent-orange' },
            ].map((stat, i) => (
              <Col md={6} xl={3} key={i}>
                <Card className="report-stat-card h-100">
                  <Card.Body className="d-flex align-items-center p-3">
                    <div className={`stat-icon rounded-circle ${stat.accent} me-3`} style={{ width: 48, height: 48 }}>
                      <Icon icon={stat.icon} width={24} />
                    </div>
                    <div className="d-flex flex-column flex-grow-1">
                      <div className="d-flex justify-content-between align-items-center">
                        <div className="stat-value" style={{ fontSize: '1.5rem', fontWeight: '700', lineHeight: 1 }}>
                          {stat.prefix}<CountUp end={stat.value} duration={2} separator="," />
                        </div>
                      </div>
                      <div className="stat-label mt-1" style={{ fontSize: '13px', color: 'var(--bs-secondary-color)', fontWeight: '500' }}>{stat.label}</div>
                    </div>
                  </Card.Body>
                </Card>
              </Col>
            ))}
          </Row>

          {/* ──────── Table Section ──────── */}
          <Card className="report-section-card">
            <div className="report-table-header">
              <h5>Customer Details</h5>
              <div className="report-table-controls">
                <select className="report-select" value={sortBy} onChange={e => setSortBy(e.target.value)}>
                  {SORT_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
                </select>
              </div>
            </div>
            
            {loading ? (
               <div className="text-center py-5"><Spinner animation="border" size="sm" className="me-2"/> Loading data...</div>
            ) : (
              <div style={{ overflowX: 'auto' }}>
                <Table className="report-table mb-0">
                  <thead className="custom-table-thead" style={{ 
                    fontSize: '12px', 
                    textTransform: 'uppercase', 
                    letterSpacing: '0.5px',
                    backgroundColor: 'rgba(255, 255, 255, 0.03)'
                  }}>
                    <tr>
                      <th className="py-2 text-muted border-dashed">CLIENT NAME</th>
                      <th className="py-2 text-muted border-dashed">EMAIL</th>
                      <th className="py-2 text-muted border-dashed">PHONE</th>
                      <th className="py-2 text-center text-muted border-dashed">ORDERS</th>
                      <th className="py-2 text-end text-muted border-dashed">TOTAL SPENDS</th>
                      <th className="py-2 text-end text-muted border-dashed">AVG. VALUE</th>
                      <th className="py-2 text-center text-muted border-dashed">ACTIONS</th>
                    </tr>
                  </thead>
                  <tbody>
                    {paginated.map((cust, idx) => {
                      const avgOrder = cust.orderCount > 0 ? Math.round(cust.totalSpent / cust.orderCount) : 0;
                      const badge = getSegmentBadge(cust);
                      return (
                        <tr key={idx}>
                          <td className="align-middle border-dashed">
                            <div className="d-flex align-items-center gap-3">
                              <div className="avatar-initials" style={{ background: getAvatarColor(cust.customerName) }}>
                                {getInitials(cust.customerName)}
                              </div>
                              <span className="fw-medium">{cust.customerName}</span>
                            </div>
                          </td>
                          <td className="align-middle border-dashed">
                            <div style={{ fontSize: '14px', color: 'var(--bs-body-color)' }}>{cust.customerEmail || '-'}</div>
                          </td>
                          <td className="align-middle border-dashed">
                            <div style={{ color: 'var(--bs-secondary-color)', fontSize: '14px' }}>{cust.customerPhone || '-'}</div>
                          </td>
                          <td className="text-center fw-semibold align-middle border-dashed" style={{ fontSize: '14px' }}>{cust.orderCount}</td>
                          <td className="text-end align-middle border-dashed">
                            <div className="fw-semibold" style={{ color: 'var(--bs-body-color)', fontSize: '14px' }}>₹{cust.totalSpent.toLocaleString()}</div>
                          </td>
                          <td className="text-end align-middle border-dashed" style={{ fontSize: '14px' }}>₹{avgOrder.toLocaleString()}</td>
                          <td className="text-center border-dashed">
                            <div className="d-flex justify-content-center" style={{ gap: '8px' }}>
                              <button className="report-action-btn" title="View" onClick={() => setModalState({ show: true, type: 'view', customerId: cust._id })}><Icon icon="lucide:eye" width={17} /></button>
                              <button className="report-action-btn" title="Edit" onClick={() => setModalState({ show: true, type: 'edit', customerId: cust._id })}><Icon icon="lucide:pencil" width={17} /></button>
                              <button className="report-action-btn danger" title="Delete" onClick={() => setModalState({ show: true, type: 'delete', customerId: cust._id })}><Icon icon="lucide:trash-2" width={17} /></button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                    {paginated.length === 0 && (
                      <tr><td colSpan="9" className="text-center py-5" style={{ color: 'var(--bs-secondary-color)' }}>No customer data found for the applied filters</td></tr>
                    )}
                  </tbody>
                </Table>
              </div>
            )}
            
            {allCustomers.length > 0 && !loading && (
              <div className="d-flex flex-wrap justify-content-between align-items-center px-4 py-3" style={{ borderTop: '1px solid var(--bs-border-color)' }}>
                <span style={{ color: 'var(--bs-secondary-color)', fontSize: '0.9375rem' }}>
                  Showing {Math.min((currentPage - 1) * perPage + 1, allCustomers.length)} to {Math.min(currentPage * perPage, allCustomers.length)} of {allCustomers.length} results
                </span>
                <Pagination className="report-pagination mb-0">
                  <Pagination.Prev onClick={() => setCurrentPage(p => Math.max(1, p - 1))} disabled={currentPage === 1}>
                    <Icon icon="lucide:chevron-left" width={16} />
                  </Pagination.Prev>
                  {Array.from({ length: Math.min(totalPages, 5) }, (_, i) => i + 1).map(p => (
                    <Pagination.Item key={p} active={p === currentPage} onClick={() => setCurrentPage(p)}>{p}</Pagination.Item>
                  ))}
                  {totalPages > 5 && <Pagination.Ellipsis />}
                  {totalPages > 5 && (
                    <Pagination.Item onClick={() => setCurrentPage(totalPages)}>{totalPages}</Pagination.Item>
                  )}
                  <Pagination.Next onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))} disabled={currentPage === totalPages}>
                    <Icon icon="lucide:chevron-right" width={16} />
                  </Pagination.Next>
                </Pagination>
              </div>
            )}
          </Card>
        </>
      )}

      <CustomerActionModals 
        show={modalState.show}
        modalType={modalState.type}
        customerId={modalState.customerId}
        onHide={() => setModalState({ show: false, type: '', customerId: null })}
        onSuccess={fetchData}
      />
    </div>
  );
}
