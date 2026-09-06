import React, { useState, useEffect } from 'react';
import { Card, Table, Button, Form, InputGroup, Badge, Modal, Row, Col } from 'react-bootstrap';
import { Link } from 'react-router';
import { Search, CalendarDays, RefreshCw, Eye, AlertCircle, Clock, X } from 'lucide-react';
import api from '@/utils/api';
import { toast } from 'react-hot-toast';
import PageHeader from '@/components/common/PageHeader';
import SkeletonTable from '@/components/common/SkeletonTable';
import EmptyState from '@/components/common/EmptyState';
import InventoryStatCards from '@/components/inventory/InventoryStatCards';

const TABS = [
  { key: '30', label: '30 Days' },
  { key: '15', label: '15 Days' },
  { key: '10', label: '10 Days' },
  { key: '5', label: '5 Days', danger: true },
  { key: '0', label: 'Expired', danger: true },
];

export default function UpcomingExpiry() {
  const [batches, setBatches] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeKey, setActiveKey] = useState('30');
  const [search, setSearch] = useState('');
  const [selectedBatch, setSelectedBatch] = useState(null);

  useEffect(() => { loadExpiring(activeKey); }, [activeKey]);

  const loadExpiring = async (days) => {
    setLoading(true);
    try { 
      const res = await api.get(`/inventory/expiring?days=${days}`); 
      setBatches(res.data?.data || res.data || []); 
    } catch (e) { 
      toast.error('Failed to load expiry data'); 
    } finally {
      setLoading(false);
    }
  };

  const filteredBatches = batches.filter(b => 
    (b.product?.name || '').toLowerCase().includes(search.toLowerCase()) || 
    (b.batchNumber || '').toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="report-page">
      <style>
        {`
          @keyframes spin {
            from { transform: rotate(0deg); }
            to { transform: rotate(360deg); }
          }
        `}
      </style>
      <div className="report-header mb-4">
        <div className="report-header-left">
          <h3 className="report-title mb-1">Upcoming Expiry</h3>
          <p className="text-muted font-size-14 mb-0">Track batches nearing their expiration dates and manage accordingly.</p>
        </div>
      </div>

      <InventoryStatCards />

      <Card className="report-section-card mb-4 h-100">
        <Card.Header className="d-flex justify-content-between align-items-center pb-0 border-0 pt-3">
          <div className="d-flex align-items-center gap-4">
            <h5 className="mb-0">Expiring Batches</h5>
            <div className="report-search-wrap" style={{ width: '320px', position: 'relative' }}>
              <Search size={16} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--bs-secondary-color)' }} />
              <input 
                type="text" 
                className="form-control report-search-input" 
                placeholder="Search products or batches..." 
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                style={{ paddingLeft: '38px' }}
              />
            </div>
          </div>
          <div className="d-flex gap-2 align-items-center">
            <Form.Select 
              className="report-search-input"
              style={{ minWidth: '150px' }} 
              value={activeKey} 
              onChange={(e) => setActiveKey(e.target.value)}
            >
              {TABS.map(tab => (
                <option key={tab.key} value={tab.key}>{tab.label}</option>
              ))}
            </Form.Select>
            <Button variant="outline-secondary" size="sm" className="d-flex align-items-center gap-2" onClick={() => loadExpiring(activeKey)} title="Refresh" style={{ height: '35px' }}>
              <RefreshCw size={16} style={{ animation: loading ? 'spin 1s linear infinite' : 'none' }} />
            </Button>
          </div>
        </Card.Header>
        <div style={{ overflowX: 'auto' }} className="pt-3 pb-2">
          {loading ? (
            <div className="p-3"><SkeletonTable rows={5} columns={5} /></div>
          ) : filteredBatches.length === 0 ? (
            <div className="p-5">
              <EmptyState icon={CalendarDays} title="No Batches Found" message={`No batches ${activeKey === '0' ? 'have expired' : `expiring within ${activeKey} days`}.`} />
            </div>
          ) : (
            <Table className="report-table mb-0">
              <thead className="custom-table-thead" style={{ 
                fontSize: '12px', 
                textTransform: 'uppercase', 
                letterSpacing: '0.5px',
                backgroundColor: 'rgba(255, 255, 255, 0.03)'
              }}>
                <tr>
                  <th className="py-2 text-muted border-dashed">PRODUCT</th>
                  <th className="py-2 text-muted border-dashed">BATCH</th>
                  <th className="py-2 text-end text-muted border-dashed">STOCK</th>
                  <th className="py-2 text-muted border-dashed">SUPPLIER</th>
                  <th className="py-2 text-muted border-dashed">EXPIRY DATE</th>
                  <th className="py-2 text-muted border-dashed">STATUS</th>
                  <th className="py-2 text-center text-muted border-dashed">ACTION</th>
                </tr>
              </thead>
              <tbody>
                {filteredBatches.map(b => (
                  <tr key={b._id}>
                    <td className="align-middle border-dashed fw-medium" style={{ fontSize: '14px', color: 'var(--bs-secondary-color)' }}>
                      <div style={{ maxWidth: '200px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{b.product?.name || 'Unknown Product'}</div>
                    </td>
                    <td className="align-middle border-dashed">
                      <div style={{ fontSize: '14px', color: 'var(--bs-body-color)' }}>{b.batchNumber || '-'}</div>
                    </td>
                    <td className="align-middle border-dashed text-end">
                      <div style={{ fontSize: '14px', color: 'var(--bs-body-color)', fontWeight: '500' }}>{b.stock}</div>
                    </td>
                    <td className="align-middle border-dashed">
                      <div style={{ fontSize: '14px', color: 'var(--bs-secondary-color)' }}>{b.supplier?.name || '-'}</div>
                    </td>
                    <td className="align-middle border-dashed" style={{ fontSize: '14px', color: 'var(--bs-body-color)' }}>
                      {b.expiryDate ? new Date(b.expiryDate).toLocaleDateString() : '-'}
                    </td>
                    <td className="align-middle border-dashed">
                      <Badge bg={activeKey === '0' ? 'danger' : 'warning'} className="px-2 py-1 d-inline-flex align-items-center gap-1" style={{ borderRadius: '6px', fontSize: '12px', fontWeight: '600' }}>
                         {activeKey === '0' ? <AlertCircle size={13} /> : <Clock size={13} />} 
                         {activeKey === '0' ? 'Expired' : 'Expiring Soon'}
                      </Badge>
                    </td>
                    <td className="align-middle border-dashed text-center">
                      <button className="report-action-btn" title="View Details" onClick={() => setSelectedBatch(b)}>
                        <Eye size={17} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </Table>
          )}
        </div>
      </Card>

      {/* Batch Details Modal */}
      <Modal show={!!selectedBatch} onHide={() => setSelectedBatch(null)} centered>
        <Modal.Header closeButton className="border-bottom border-secondary-subtle">
          <Modal.Title className="fw-bold fs-5">Batch Details</Modal.Title>
        </Modal.Header>
        <Modal.Body className="p-4">
          {selectedBatch && (
            <div className="d-flex flex-column gap-3">
              <Row>
                <Col xs={5} className="text-muted small text-uppercase">Product</Col>
                <Col xs={7} className="fw-medium text-end">
                  <div>{selectedBatch.product?.name}</div>
                  {selectedBatch.product?.barcode && <div className="text-muted small">{selectedBatch.product.barcode}</div>}
                </Col>
              </Row>
              <Row>
                <Col xs={5} className="text-muted small text-uppercase">Batch Number</Col>
                <Col xs={7} className="fw-medium text-end">{selectedBatch.batchNumber || '-'}</Col>
              </Row>
              <Row>
                <Col xs={5} className="text-muted small text-uppercase">Supplier</Col>
                <Col xs={7} className="fw-medium text-end">{selectedBatch.supplier?.name || '-'}</Col>
              </Row>
              <Row>
                <Col xs={5} className="text-muted small text-uppercase">Manufacturing Date</Col>
                <Col xs={7} className="fw-medium text-end">{selectedBatch.manufacturingDate ? new Date(selectedBatch.manufacturingDate).toLocaleDateString() : '-'}</Col>
              </Row>
              <Row>
                <Col xs={5} className="text-muted small text-uppercase">Expiry Date</Col>
                <Col xs={7} className="fw-medium text-end">{selectedBatch.expiryDate ? new Date(selectedBatch.expiryDate).toLocaleDateString() : '-'}</Col>
              </Row>
              
              <Row className="border-top border-secondary-subtle pt-3 mt-1">
                <Col xs={12} className="text-center">
                  <div className="text-muted small text-uppercase mb-1">Current Stock</div>
                  <div className="fw-bold fs-3" style={{ color: 'var(--bs-body-color)' }}>{selectedBatch.stock}</div>
                </Col>
              </Row>
            </div>
          )}
        </Modal.Body>
      </Modal>
    </div>
  );
}
