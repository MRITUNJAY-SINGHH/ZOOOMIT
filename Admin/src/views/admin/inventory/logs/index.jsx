import React, { useState, useEffect, useMemo } from 'react';
import { Filter, Search, ArrowDownCircle, ArrowUpCircle, CornerUpLeft, RefreshCw, X, Eye } from 'lucide-react';
import { Card, Table, Form, Row, Col, Button, Badge, Offcanvas, Modal } from 'react-bootstrap';
import api from '@/utils/api';
import { toast } from 'react-hot-toast';
import PageHeader from '@/components/common/PageHeader';
import PaginationComponent from '@/components/common/PaginationComponent';
import { usePageSize } from '@/hooks/usePageSize';
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
  const [pageSize, setPageSize] = usePageSize(50);
  const [totalPages, setTotalPages] = useState(1);
  const [totalRecords, setTotalRecords] = useState(0);
  const [selectedLog, setSelectedLog] = useState(null);

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

  useEffect(() => { fetchLogs(); }, [currentPage, pageSize, filters.type]);

  const fetchLogs = async () => {
    setLoading(true);
    try {
      const q = new URLSearchParams({ page: currentPage, limit: pageSize });
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
                    <th className="py-2 text-muted border-dashed">DATE</th>
                    <th className="py-2 text-muted border-dashed">PRODUCT</th>
                    <th className="py-2 text-muted border-dashed">BATCH</th>
                    <th className="py-2 text-end text-muted border-dashed">SHIFT</th>
                    <th className="py-2 text-end text-muted border-dashed">STOCK</th>
                    <th className="py-2 text-muted border-dashed">TYPE</th>
                    <th className="py-2 text-center text-muted border-dashed">ACTION</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredLogs.map(log => {
                    const badge = getBadgeStyle(log.type);
                    return (
                    <tr key={log._id}>
                      <td className="align-middle border-dashed fw-medium" style={{ fontSize: '14px', color: 'var(--bs-secondary-color)' }}>{new Date(log.date).toLocaleDateString()}</td>
                      <td className="align-middle border-dashed">
                        <div style={{ fontSize: '14px', color: 'var(--bs-body-color)', fontWeight: '500', maxWidth: '200px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{log.product?.name}</div>
                      </td>
                      <td className="align-middle border-dashed">
                        <div style={{ fontSize: '14px', color: 'var(--bs-body-color)' }}>{log.batch ? log.batch.batchNumber : '-'}</div>
                      </td>
                      <td className="align-middle border-dashed text-end">
                        <div className={log.quantityChanged > 0 ? 'text-success fw-bold' : 'text-danger fw-bold'} style={{ fontSize: '14px' }}>
                          {log.quantityChanged > 0 ? '+' : ''}{log.quantityChanged}
                        </div>
                      </td>
                      <td className="align-middle border-dashed text-end">
                        <div style={{ fontSize: '14px', color: 'var(--bs-secondary-color)', fontWeight: '500' }}>{log.newStock}</div>
                      </td>
                      <td className="align-middle border-dashed">
                        <Badge bg={badge.bg} className="px-2 py-1 d-inline-flex align-items-center gap-1" style={{ borderRadius: '6px', fontSize: '12px', fontWeight: '600' }}>
                          {badge.icon} {badge.text}
                        </Badge>
                      </td>
                      <td className="align-middle border-dashed text-center">
                        <button className="report-action-btn" title="View Details" onClick={() => setSelectedLog(log)}>
                          <Eye size={17} />
                        </button>
                      </td>
                    </tr>
                    );
                  })}
                </tbody>
              </Table>
              {totalPages > 1 && (
                <div className="px-4 pb-3">
                  <PaginationComponent currentPage={currentPage} totalPages={totalPages} totalRecords={totalRecords} onPageChange={setCurrentPage} pageSize={pageSize} onPageSizeChange={setPageSize} />
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
        style={{ width: '450px', backgroundColor: '#0f172a', borderLeft: '1px solid #1e293b', color: '#f8fafc', boxShadow: '-5px 0 25px rgba(0,0,0,0.5)' }}
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

      {/* Log Details Modal */}
      <Modal show={!!selectedLog} onHide={() => setSelectedLog(null)} centered>
        <Modal.Header closeButton className="border-bottom border-secondary-subtle">
          <Modal.Title className="fw-bold fs-5">Log Details</Modal.Title>
        </Modal.Header>
        <Modal.Body className="p-4">
          {selectedLog && (
            <div className="d-flex flex-column gap-3">
              <Row>
                <Col xs={4} className="text-muted small text-uppercase">Time</Col>
                <Col xs={8} className="fw-medium text-end">{new Date(selectedLog.date).toLocaleString()}</Col>
              </Row>
              <Row>
                <Col xs={4} className="text-muted small text-uppercase">Type</Col>
                <Col xs={8} className="fw-medium text-end">{selectedLog.type}</Col>
              </Row>
              <Row>
                <Col xs={4} className="text-muted small text-uppercase">Product</Col>
                <Col xs={8} className="fw-medium text-end">
                  <div>{selectedLog.product?.name}</div>
                  {selectedLog.product?.barcode && <div className="text-muted small">{selectedLog.product.barcode}</div>}
                </Col>
              </Row>
              <Row>
                <Col xs={4} className="text-muted small text-uppercase">Batch</Col>
                <Col xs={8} className="fw-medium text-end">
                  <div>{selectedLog.batch ? selectedLog.batch.batchNumber : '-'}</div>
                  {selectedLog.batch?.supplier && <div className="text-muted small">{selectedLog.batch.supplier.name}</div>}
                </Col>
              </Row>
              <Row>
                <Col xs={4} className="text-muted small text-uppercase">Reason</Col>
                <Col xs={8} className="fw-medium text-end">{selectedLog.reason || '-'}</Col>
              </Row>
              <Row>
                <Col xs={4} className="text-muted small text-uppercase">Staff</Col>
                <Col xs={8} className="fw-medium text-end">{selectedLog.user?.name || 'System'}</Col>
              </Row>
              <Row className="border-top border-secondary-subtle pt-3 mt-1">
                <Col xs={6} className="text-center border-end border-secondary-subtle">
                  <div className="text-muted small text-uppercase mb-1">Stock Shift</div>
                  <div className={selectedLog.quantityChanged > 0 ? 'text-success fw-bold fs-5' : 'text-danger fw-bold fs-5'}>
                    {selectedLog.quantityChanged > 0 ? '+' : ''}{selectedLog.quantityChanged}
                  </div>
                </Col>
                <Col xs={6} className="text-center">
                  <div className="text-muted small text-uppercase mb-1">Final Stock</div>
                  <div className="fw-bold fs-5">{selectedLog.newStock}</div>
                </Col>
              </Row>
            </div>
          )}
        </Modal.Body>
      </Modal>
    </div>
  );
}

