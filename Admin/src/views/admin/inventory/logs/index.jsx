import React, { useState, useEffect, useMemo } from 'react';
import { Filter, Search, ArrowDownCircle, ArrowUpCircle, CornerUpLeft, RefreshCw, X } from 'lucide-react';
import { Card, Table, Form, Row, Col, Button, Badge, Offcanvas } from 'react-bootstrap';
import api from '@/utils/api';
import { toast } from 'react-hot-toast';
import PageHeader from '@/components/common/PageHeader';
import SkeletonTable from '@/components/common/SkeletonTable';
import EmptyState from '@/components/common/EmptyState';
import InventoryStatCards from '@/components/inventory/InventoryStatCards';

const TYPE_BADGES = { SALE: 'primary', PURCHASE: 'success', RETURN: 'warning', ADJUSTMENT: 'info' };

export default function InventoryLogs() {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(false);
  const [products, setProducts] = useState([]);
  const [suppliers, setSuppliers] = useState([]);
  const [filters, setFilters] = useState({ startDate: '', endDate: '', type: '', product: '', supplier: '' });
  const [showFilters, setShowFilters] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalRecords, setTotalRecords] = useState(0);

  useEffect(() => {
    const init = async () => {
      try {
        const [p, s] = await Promise.allSettled([api.get('/products'), api.get('/suppliers')]);
        if (p.status === 'fulfilled') setProducts(p.value.data.data || p.value.data || []);
        if (s.status === 'fulfilled') setSuppliers(s.value.data.data || s.value.data || []);
      } catch (e) { console.error(e); }
    };
    init();
  }, []);

  useEffect(() => { fetchLogs(); }, [currentPage]);

  const fetchLogs = async () => {
    setLoading(true);
    try {
      const q = new URLSearchParams({ page: currentPage, limit: 20 });
      if (filters.startDate) q.append('startDate', filters.startDate);
      if (filters.endDate) q.append('endDate', filters.endDate);
      if (filters.type) q.append('type', filters.type);
      if (filters.product) q.append('product', filters.product);
      if (filters.supplier) q.append('supplier', filters.supplier);
      const res = await api.get(`/inventory/logs?${q.toString()}`);
      const payload = res.data;
      setLogs(payload.data || payload || []);
      setTotalPages(payload.totalPages || 1);
      setTotalRecords(payload.total || 0);
    } catch (e) { toast.error('Failed to load logs'); }
    setLoading(false);
  };

  const getBadgeStyle = (type) => {
    switch(type) {
      case 'SALE': return { bg: 'primary', icon: <ArrowUpCircle size={13} />, text: 'Sale' };
      case 'PURCHASE': return { bg: 'success', icon: <ArrowDownCircle size={13} />, text: 'Purchase' };
      case 'RETURN': return { bg: 'warning', icon: <CornerUpLeft size={13} />, text: 'Return' };
      case 'ADJUSTMENT': return { bg: 'info', icon: <RefreshCw size={13} />, text: 'Adjust' };
      default: return { bg: 'secondary', icon: null, text: type };
    }
  };

  const filteredLogs = useMemo(() => {
    if (!searchTerm) return logs;
    const q = searchTerm.toLowerCase();
    return logs.filter(log => 
      (log.product?.name || '').toLowerCase().includes(q) ||
      (log.batch?.batchNumber || '').toLowerCase().includes(q) ||
      (log.reason || '').toLowerCase().includes(q) ||
      (log.user?.name || '').toLowerCase().includes(q)
    );
  }, [logs, searchTerm]);

  return (
    <div className="report-page">
      <div className="report-header mb-4">
        <div className="report-header-left">
          <h3 className="report-title mb-1">Inventory Logs</h3>
          <p className="text-muted font-size-14 mb-0">Track all stock movements: sales, purchases, returns, and adjustments.</p>
        </div>
      </div>

      <InventoryStatCards />

      <Card className="report-section-card overflow-hidden">
        <Card.Header className="d-flex justify-content-between align-items-center pb-0 border-0 pt-4 px-4 mb-3">
          <h5 className="mb-0">Recent Movements</h5>
          <div className="d-flex gap-2 align-items-center">
            <div className="report-search-wrap" style={{ width: '250px', position: 'relative' }}>
              <Search size={16} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--bs-secondary-color)' }} />
              <input
                type="text"
                className="form-control report-search-input"
                placeholder="Search logs..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                style={{ paddingLeft: '38px' }}
              />
            </div>
            <Button variant="outline-secondary" size="sm" className="d-flex align-items-center gap-2" onClick={() => setShowFilters(true)} style={{ height: '35px' }}>
              <Filter size={16} /> Filters
            </Button>
          </div>
        </Card.Header>
        <div style={{ overflowX: 'auto' }} className="pt-1 pb-2">
          {loading ? <SkeletonTable rows={8} columns={7} /> : filteredLogs.length === 0 ? (
            <EmptyState icon="lucide:clipboard-list" title="No Logs Found" message="No inventory movements match the current filters." />
          ) : (
            <>
              <Table className="report-table mb-0">
                <thead className="custom-table-thead" style={{ 
                  fontSize: '12px', 
                  textTransform: 'uppercase', 
                  letterSpacing: '0.5px',
                  backgroundColor: 'rgba(255, 255, 255, 0.03)'
                }}>
                  <tr>
                    <th className="py-2 text-muted border-dashed ps-4">Date</th>
                    <th className="py-2 text-muted border-dashed">Type</th>
                    <th className="py-2 text-muted border-dashed">Product</th>
                    <th className="py-2 text-muted border-dashed">Batch / Supplier</th>
                    <th className="py-2 text-end text-muted border-dashed">Stock Shift</th>
                    <th className="py-2 text-muted border-dashed">Reason</th>
                    <th className="py-2 text-muted border-dashed pe-4">Staff</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredLogs.map(log => {
                    const badge = getBadgeStyle(log.type);
                    return (
                    <tr key={log._id}>
                      <td className="align-middle border-dashed" style={{ fontSize: '14px', color: 'var(--bs-secondary-color)' }}>{new Date(log.date).toLocaleString()}</td>
                      <td className="align-middle border-dashed">
                        <Badge bg={badge.bg} className="px-2 py-1 d-inline-flex align-items-center gap-1" style={{ borderRadius: '6px', fontSize: '11px', fontWeight: '600' }}>
                          {badge.icon} {badge.text}
                        </Badge>
                      </td>
                      <td className="align-middle border-dashed">
                        <div style={{ fontSize: '14px', color: 'var(--bs-body-color)', fontWeight: '500' }}>{log.product?.name}</div>
                        {log.product?.barcode && <div style={{ fontSize: '12px', color: 'var(--bs-secondary-color)' }}>{log.product.barcode}</div>}
                      </td>
                      <td className="align-middle border-dashed">
                        <div style={{ fontSize: '14px', color: 'var(--bs-body-color)' }}>{log.batch ? log.batch.batchNumber : '-'}</div>
                        {log.batch?.supplier && <div style={{ fontSize: '12px', color: 'var(--bs-secondary-color)' }}>{log.batch.supplier.name}</div>}
                      </td>
                      <td className="align-middle border-dashed text-end">
                        <div className={log.quantityChanged > 0 ? 'text-success fw-bold' : 'text-danger fw-bold'} style={{ fontSize: '14px' }}>
                          {log.quantityChanged > 0 ? '+' : ''}{log.quantityChanged}
                        </div>
                        <div style={{ fontSize: '12px', color: 'var(--bs-secondary-color)' }}>→ {log.newStock}</div>
                      </td>
                      <td className="align-middle border-dashed" style={{ fontSize: '14px', color: 'var(--bs-secondary-color)' }}>{log.reason || '-'}</td>
                      <td className="align-middle border-dashed pe-4" style={{ fontSize: '14px', color: 'var(--bs-body-color)' }}>{log.user?.name || 'System'}</td>
                    </tr>
                    );
                  })}
                </tbody>
              </Table>
              {totalPages > 1 && (
                <div className="d-flex justify-content-between align-items-center px-4 py-3 border-top" style={{ borderColor: 'var(--bs-border-color)' }}>
                  <span className="text-muted font-size-14">Page {currentPage} of {totalPages} ({totalRecords} entries)</span>
                  <div className="d-flex gap-2">
                    <Button variant="outline-secondary" size="sm" disabled={currentPage === 1} onClick={() => setCurrentPage(p => p - 1)}>Prev</Button>
                    <Button variant="outline-secondary" size="sm" disabled={currentPage === totalPages} onClick={() => setCurrentPage(p => p + 1)}>Next</Button>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </Card>

      {/* Advanced Filters Offcanvas */}
      <Offcanvas 
        show={showFilters} 
        onHide={() => setShowFilters(false)} 
        placement="end" 
        style={{ width: '350px', backgroundColor: '#0f172a', borderLeft: '1px solid #1e293b', color: '#f8fafc', boxShadow: '-5px 0 25px rgba(0,0,0,0.5)' }}
      >
        <Offcanvas.Header className="border-bottom d-flex justify-content-between align-items-center" style={{ borderColor: '#1e293b' }}>
          <Offcanvas.Title className="fw-bold d-flex align-items-center gap-2 m-0" style={{ fontSize: '1rem' }}>
            <Filter size={18} /> Advanced Filters
          </Offcanvas.Title>
          <button onClick={() => setShowFilters(false)} className="btn btn-sm btn-link text-muted p-0 m-0"><X size={20} /></button>
        </Offcanvas.Header>
        <Offcanvas.Body className="p-4">
          <Form.Group className="mb-4">
            <Form.Label className="small text-muted mb-2 text-uppercase tracking-wider">Date Range</Form.Label>
            <div className="d-flex flex-column gap-3">
              <Form.Control type="date" className="report-search-input" value={filters.startDate} onChange={e => setFilters({ ...filters, startDate: e.target.value })} />
              <Form.Control type="date" className="report-search-input" value={filters.endDate} onChange={e => setFilters({ ...filters, endDate: e.target.value })} />
            </div>
          </Form.Group>

          <Form.Group className="mb-4">
            <Form.Label className="small text-muted mb-1 text-uppercase tracking-wider">Log Type</Form.Label>
            <Form.Select className="report-search-input" value={filters.type} onChange={e => setFilters({ ...filters, type: e.target.value })}>
              <option value="">All Types</option>
              <option value="SALE">Sale</option>
              <option value="PURCHASE">Purchase</option>
              <option value="RETURN">Return</option>
              <option value="ADJUSTMENT">Adjustment</option>
            </Form.Select>
          </Form.Group>

          <Form.Group className="mb-4">
            <Form.Label className="small text-muted mb-1 text-uppercase tracking-wider">Specific Product</Form.Label>
            <Form.Select className="report-search-input" value={filters.product} onChange={e => setFilters({ ...filters, product: e.target.value })}>
              <option value="">All Products</option>
              {products.map(p => <option key={p._id} value={p._id}>{p.name}</option>)}
            </Form.Select>
          </Form.Group>

          <Form.Group className="mb-4">
            <Form.Label className="small text-muted mb-1 text-uppercase tracking-wider">Specific Supplier</Form.Label>
            <Form.Select className="report-search-input" value={filters.supplier} onChange={e => setFilters({ ...filters, supplier: e.target.value })}>
              <option value="">All Suppliers</option>
              {suppliers.map(s => <option key={s._id} value={s._id}>{s.name}</option>)}
            </Form.Select>
          </Form.Group>

          <Button 
            variant="primary" 
            className="w-100 mt-2 py-2 fw-medium"
            onClick={() => { 
              setCurrentPage(1); 
              fetchLogs(); 
              setShowFilters(false); 
            }}
          >
            Apply Filters
          </Button>
          <Button 
            variant="outline-secondary" 
            className="w-100 mt-2 py-2"
            onClick={() => { 
              setFilters({ startDate: '', endDate: '', type: '', product: '', supplier: '' });
              setCurrentPage(1);
              setTimeout(fetchLogs, 100);
            }}
          >
            Clear Filters
          </Button>
        </Offcanvas.Body>
      </Offcanvas>
    </div>
  );
}

