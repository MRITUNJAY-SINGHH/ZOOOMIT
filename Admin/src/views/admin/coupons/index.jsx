import React, { useEffect, useState } from 'react';
import { Button, Card, Col, Form, Modal, Row, Table } from 'react-bootstrap';
import { Edit, Plus, Trash2 } from 'lucide-react';
import api from '@/utils/api';
import PageHeader from '@/components/common/PageHeader';
import ActionBar from '@/components/common/ActionBar';
import SearchBar from '@/components/common/SearchBar';
import FilterBar from '@/components/common/FilterBar';
import StatusBadge from '@/components/common/StatusBadge';
import SkeletonTable from '@/components/common/SkeletonTable';
import EmptyState from '@/components/common/EmptyState';
import ErrorState from '@/components/common/ErrorState';
import DeleteModal from '@/components/common/DeleteModal';
import PaginationComponent from '@/components/common/PaginationComponent';
import { formatCurrency, formatDate } from '@/utils/format';
import { toast } from 'react-hot-toast';

const blankCoupon = {
  _id: null,
  code: '',
  type: 'Fixed',
  value: '',
  expiryDate: '',
  minimumOrderValue: 0,
  maximumDiscount: '',
  usagePerUser: 1,
  usageLimit: 100,
  status: 'Active',
};

export default function Coupons() {
  const [coupons, setCoupons] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalRecords, setTotalRecords] = useState(0);
  const [modalOpen, setModalOpen] = useState(false);
  const [formData, setFormData] = useState(blankCoupon);
  const [saving, setSaving] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState(null);

  const fetchCoupons = async () => {
    setLoading(true);
    setError(null);
    try {
      const query = new URLSearchParams({ page: currentPage, limit: 20, search, ...(status ? { status } : {}) }).toString();
      const res = await api.get(`/coupons?${query}`);
      setCoupons(res.data.data || []);
      setTotalPages(res.data.totalPages || 1);
      setTotalRecords(res.data.total || 0);
    } catch (err) {
      setError(err.message);
      toast.error('Failed to load coupons');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchCoupons(); }, [currentPage, search, status]);

  const openModal = (coupon = null) => {
    setFormData(coupon ? { ...coupon, expiryDate: coupon.expiryDate ? new Date(coupon.expiryDate).toISOString().slice(0, 10) : '' } : blankCoupon);
    setModalOpen(true);
  };

  const saveCoupon = async () => {
    if (!formData.code.trim() || !formData.value || !formData.expiryDate) {
      toast.error('Coupon code, value and expiry date are required');
      return;
    }
    setSaving(true);
    try {
      const payload = {
        ...formData,
        code: formData.code.toUpperCase().trim(),
        value: Number(formData.value),
        minimumOrderValue: Number(formData.minimumOrderValue || 0),
        maximumDiscount: formData.maximumDiscount === '' ? undefined : Number(formData.maximumDiscount),
        usagePerUser: Number(formData.usagePerUser || 1),
        usageLimit: Number(formData.usageLimit || 1),
      };
      if (payload._id) await api.put(`/coupons/${payload._id}`, payload);
      else await api.post('/coupons', payload);
      toast.success(payload._id ? 'Coupon updated' : 'Coupon created');
      setModalOpen(false);
      fetchCoupons();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to save coupon');
    } finally {
      setSaving(false);
    }
  };

  const deleteCoupon = async () => {
    if (!deleteTarget) return;
    try {
      await api.delete(`/coupons/${deleteTarget._id}`);
      toast.success('Coupon deleted');
      setDeleteTarget(null);
      fetchCoupons();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to delete coupon');
    }
  };

  return (
    <div className="report-page pt-1">
      <div className="report-header">
        <div className="report-header-left">
          <h3 className="report-title">Coupons</h3>
        </div>
      </div>
      <ActionBar
        left={(
          <>
            <SearchBar placeholder="Search coupon code..." value={search} onChange={(value) => { setSearch(value); setCurrentPage(1); }} />
            <FilterBar
              filters={[{ name: 'status', label: 'Status', value: status, onChange: (value) => { setStatus(value); setCurrentPage(1); }, options: [{ value: '', label: 'All Statuses' }, { value: 'Active', label: 'Active' }, { value: 'Inactive', label: 'Inactive' }] }]}
              onClear={() => { setSearch(''); setStatus(''); setCurrentPage(1); }}
            />
          </>
        )}
        count={totalRecords}
        onRefresh={fetchCoupons}
        onAdd={() => openModal()}
        addLabel="Add Coupon"
      />
      <Card>
        <Card.Body>
          {loading ? <SkeletonTable rows={8} columns={8} /> : error ? <ErrorState message={error} onRetry={fetchCoupons} /> : coupons.length === 0 ? (
            <EmptyState icon="lucide:ticket-percent" title="No coupons found" message="Create a coupon to start offering discounts." actionLabel="Add Coupon" onAction={() => openModal()} />
          ) : (
            <>
              <Table responsive hover className="align-middle mb-0">
                <thead><tr><th>Code</th><th>Type</th><th className="text-end">Value</th><th>Minimum Order</th><th>Usage</th><th>Expiry</th><th>Status</th><th className="text-end">Actions</th></tr></thead>
                <tbody>
                  {coupons.map((coupon) => (
                    <tr key={coupon._id}>
                      <td className="fw-semibold text-primary">{coupon.code}</td>
                      <td>{coupon.type}</td>
                      <td className="text-end fw-semibold">{coupon.type === 'Percentage' ? `${coupon.value}%` : formatCurrency(coupon.value)}</td>
                      <td>{formatCurrency(coupon.minimumOrderValue)}</td>
                      <td>{coupon.usedCount || 0} / {coupon.usageLimit}</td>
                      <td>{formatDate(coupon.expiryDate)}</td>
                      <td><StatusBadge status={coupon.status} /></td>
                      <td className="text-end">
                        <Button variant="light" className="kuiklo-icon-btn me-1" onClick={() => openModal(coupon)}><Edit size={20} /></Button>
                        <Button variant="light" className="kuiklo-icon-btn text-danger" onClick={() => setDeleteTarget(coupon)}><Trash2 size={20} /></Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </Table>
              <PaginationComponent currentPage={currentPage} totalPages={totalPages} totalRecords={totalRecords} onPageChange={setCurrentPage} />
            </>
          )}
        </Card.Body>
      </Card>

      <Modal show={modalOpen} onHide={() => setModalOpen(false)} centered size="lg">
        <Modal.Header closeButton><Modal.Title>{formData._id ? 'Edit Coupon' : 'Add Coupon'}</Modal.Title></Modal.Header>
        <Modal.Body>
          <Row className="g-3">
            <Col md={4}><Form.Label>Code <span className="text-danger">*</span></Form.Label><Form.Control value={formData.code} onChange={(event) => setFormData({ ...formData, code: event.target.value.toUpperCase() })} /></Col>
            <Col md={4}><Form.Label>Type</Form.Label><Form.Select value={formData.type} onChange={(event) => setFormData({ ...formData, type: event.target.value })}><option>Fixed</option><option>Percentage</option></Form.Select></Col>
            <Col md={4}><Form.Label>Value <span className="text-danger">*</span></Form.Label><Form.Control type="number" value={formData.value} onChange={(event) => setFormData({ ...formData, value: event.target.value })} /></Col>
            <Col md={4}><Form.Label>Minimum Order</Form.Label><Form.Control type="number" value={formData.minimumOrderValue} onChange={(event) => setFormData({ ...formData, minimumOrderValue: event.target.value })} /></Col>
            <Col md={4}><Form.Label>Maximum Discount</Form.Label><Form.Control type="number" value={formData.maximumDiscount || ''} disabled={formData.type !== 'Percentage'} onChange={(event) => setFormData({ ...formData, maximumDiscount: event.target.value })} /></Col>
            <Col md={4}><Form.Label>Expiry Date <span className="text-danger">*</span></Form.Label><Form.Control type="date" value={formData.expiryDate} onChange={(event) => setFormData({ ...formData, expiryDate: event.target.value })} /></Col>
            <Col md={4}><Form.Label>Usage Per User</Form.Label><Form.Control type="number" value={formData.usagePerUser} onChange={(event) => setFormData({ ...formData, usagePerUser: event.target.value })} /></Col>
            <Col md={4}><Form.Label>Usage Limit</Form.Label><Form.Control type="number" value={formData.usageLimit} onChange={(event) => setFormData({ ...formData, usageLimit: event.target.value })} /></Col>
            <Col md={4}><Form.Label>Status</Form.Label><Form.Select value={formData.status} onChange={(event) => setFormData({ ...formData, status: event.target.value })}><option>Active</option><option>Inactive</option></Form.Select></Col>
          </Row>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="outline-secondary" onClick={() => setModalOpen(false)}>Cancel</Button>
          <Button variant="primary" disabled={saving} onClick={saveCoupon}>{saving ? 'Saving...' : 'Save Coupon'}</Button>
        </Modal.Footer>
      </Modal>

      <DeleteModal show={Boolean(deleteTarget)} itemName={deleteTarget?.code || 'this coupon'} onCancel={() => setDeleteTarget(null)} onConfirm={deleteCoupon} />
    </div>
  );
}
