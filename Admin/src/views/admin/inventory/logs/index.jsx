import React, { useState, useEffect } from 'react';
import { Filter } from 'lucide-react';
import { Card, Table, Form, Row, Col, Button, Badge } from 'react-bootstrap';
import api from '@/utils/api';
import { toast } from 'react-hot-toast';
import PageHeader from '@/components/common/PageHeader';
import SkeletonTable from '@/components/common/SkeletonTable';
import EmptyState from '@/components/common/EmptyState';

const TYPE_BADGES = { SALE: 'primary', PURCHASE: 'success', RETURN: 'warning', ADJUSTMENT: 'info' };

export default function InventoryLogs() {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(false);
  const [products, setProducts] = useState([]);
  const [suppliers, setSuppliers] = useState([]);
  const [filters, setFilters] = useState({ startDate: '', endDate: '', type: '', product: '', supplier: '' });
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

  return (
    <div>
      <PageHeader title="Inventory Logs" description="Track all stock movements: sales, purchases, returns, and adjustments." breadcrumbs={[{ label: 'Dashboard', path: '/dashboard' }, { label: 'Inventory' }, { label: 'Logs' }]} />
      <Card>
        <Card.Body>
          <div className="bg-light p-3 rounded mb-3">
            <Row className="g-2 align-items-end">
              <Col md={2}><Form.Label className="small mb-1">Start Date</Form.Label><Form.Control size="sm" type="date" value={filters.startDate} onChange={e => setFilters({ ...filters, startDate: e.target.value })} /></Col>
              <Col md={2}><Form.Label className="small mb-1">End Date</Form.Label><Form.Control size="sm" type="date" value={filters.endDate} onChange={e => setFilters({ ...filters, endDate: e.target.value })} /></Col>
              <Col md={2}><Form.Label className="small mb-1">Type</Form.Label><Form.Select size="sm" value={filters.type} onChange={e => setFilters({ ...filters, type: e.target.value })}><option value="">All</option><option value="SALE">Sale</option><option value="PURCHASE">Purchase</option><option value="RETURN">Return</option></Form.Select></Col>
              <Col md={2}><Form.Label className="small mb-1">Product</Form.Label><Form.Select size="sm" value={filters.product} onChange={e => setFilters({ ...filters, product: e.target.value })}><option value="">All</option>{products.map(p => <option key={p._id} value={p._id}>{p.name}</option>)}</Form.Select></Col>
              <Col md={2}><Form.Label className="small mb-1">Supplier</Form.Label><Form.Select size="sm" value={filters.supplier} onChange={e => setFilters({ ...filters, supplier: e.target.value })}><option value="">All</option>{suppliers.map(s => <option key={s._id} value={s._id}>{s.name}</option>)}</Form.Select></Col>
              <Col md={2}><Button variant="primary" size="sm" className="w-100" onClick={() => { setCurrentPage(1); fetchLogs(); }}><Filter size={14} className="me-1" />Apply</Button></Col>
            </Row>
          </div>
          {loading ? <SkeletonTable rows={8} columns={7} /> : logs.length === 0 ? (
            <EmptyState icon="lucide:clipboard-list" title="No Logs Found" message="No inventory movements match the current filters." />
          ) : (
            <>
              <Table responsive hover className="align-middle mb-0">
                <thead><tr><th>Date</th><th>Type</th><th>Product</th><th>Batch / Supplier</th><th className="text-end">Stock Shift</th><th>Reason</th><th>Staff</th></tr></thead>
                <tbody>
                  {logs.map(log => (
                    <tr key={log._id}>
                      <td className="text-muted small">{new Date(log.date).toLocaleString()}</td>
                      <td><Badge bg={TYPE_BADGES[log.type] || 'secondary'}>{log.type}</Badge></td>
                      <td><span className="fw-medium">{log.product?.name}</span>{log.product?.barcode && <small className="d-block text-muted">{log.product.barcode}</small>}</td>
                      <td>{log.batch ? log.batch.batchNumber : 'N/A'}{log.batch?.supplier && <small className="d-block text-muted">{log.batch.supplier.name}</small>}</td>
                      <td className="text-end"><span className={log.quantityChanged > 0 ? 'text-success fw-bold' : 'text-danger fw-bold'}>{log.quantityChanged > 0 ? '+' : ''}{log.quantityChanged}</span><small className="d-block text-muted">→ {log.newStock}</small></td>
                      <td className="text-muted small">{log.reason}</td>
                      <td className="text-muted small">{log.user?.name || 'System'}</td>
                    </tr>
                  ))}
                </tbody>
              </Table>
              {totalPages > 1 && (
                <div className="d-flex justify-content-between align-items-center mt-3 pt-3 border-top">
                  <span className="text-muted small">Page {currentPage} of {totalPages} ({totalRecords} entries)</span>
                  <div className="d-flex gap-2">
                    <Button variant="outline-secondary" size="sm" disabled={currentPage === 1} onClick={() => setCurrentPage(p => p - 1)}>Prev</Button>
                    <Button variant="outline-secondary" size="sm" disabled={currentPage === totalPages} onClick={() => setCurrentPage(p => p + 1)}>Next</Button>
                  </div>
                </div>
              )}
            </>
          )}
        </Card.Body>
      </Card>
    </div>
  );
}

