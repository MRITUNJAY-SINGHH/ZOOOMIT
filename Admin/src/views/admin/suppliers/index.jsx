import React, { useEffect, useState } from 'react';
import { Button, Card, Col, Form, Modal, Row, Table } from 'react-bootstrap';
import { Edit, Mail, Phone, Trash2 } from 'lucide-react';
import api from '@/utils/api';
import PageHeader from '@/components/common/PageHeader';
import ActionBar from '@/components/common/ActionBar';
import SearchBar from '@/components/common/SearchBar';
import StatusBadge from '@/components/common/StatusBadge';
import SkeletonTable from '@/components/common/SkeletonTable';
import EmptyState from '@/components/common/EmptyState';
import ErrorState from '@/components/common/ErrorState';
import DeleteModal from '@/components/common/DeleteModal';
import PaginationComponent from '@/components/common/PaginationComponent';
import { toast } from 'react-hot-toast';

const blankSupplier = { _id: null, name: '', phone: '', email: '', address: '', status: 'Active' };

export default function Suppliers() {
  const [suppliers, setSuppliers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [search, setSearch] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalRecords, setTotalRecords] = useState(0);
  const [modalOpen, setModalOpen] = useState(false);
  const [formData, setFormData] = useState(blankSupplier);
  const [saving, setSaving] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState(null);

  const fetchSuppliers = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await api.get(`/suppliers?page=${currentPage}&limit=20&search=${search}`);
      setSuppliers(res.data.data || []);
      setTotalPages(res.data.totalPages || 1);
      setTotalRecords(res.data.total || 0);
    } catch (err) {
      setError(err.message);
      toast.error('Failed to load suppliers');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchSuppliers(); }, [currentPage, search]);

  const openModal = (supplier = null) => {
    setFormData(supplier || blankSupplier);
    setModalOpen(true);
  };

  const saveSupplier = async () => {
    if (!formData.name.trim()) {
      toast.error('Supplier name is required');
      return;
    }
    setSaving(true);
    try {
      if (formData._id) await api.put(`/suppliers/${formData._id}`, formData);
      else await api.post('/suppliers', formData);
      toast.success(formData._id ? 'Supplier updated' : 'Supplier created');
      setModalOpen(false);
      fetchSuppliers();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to save supplier');
    } finally {
      setSaving(false);
    }
  };

  const deleteSupplier = async () => {
    if (!deleteTarget) return;
    try {
      await api.delete(`/suppliers/${deleteTarget._id}`);
      toast.success('Supplier deleted');
      setDeleteTarget(null);
      fetchSuppliers();
    } catch (err) {
      toast.error('Failed to delete supplier');
    }
  };

  return (
    <div>
      <PageHeader title="Suppliers" description="Manage vendor contacts and stock procurement partners." breadcrumbs={[{ label: 'Dashboard', path: '/dashboard' }, { label: 'Suppliers' }]} />
      <ActionBar
        left={<SearchBar placeholder="Search suppliers..." value={search} onChange={(value) => { setSearch(value); setCurrentPage(1); }} />}
        count={totalRecords}
        onRefresh={fetchSuppliers}
        onAdd={() => openModal()}
        addLabel="Add Supplier"
      />
      <Card>
        <Card.Body>
          {loading ? <SkeletonTable rows={8} columns={6} /> : error ? <ErrorState message={error} onRetry={fetchSuppliers} /> : suppliers.length === 0 ? (
            <EmptyState icon="lucide:building-2" title="No suppliers found" message="Create suppliers before adding stock entries." actionLabel="Add Supplier" onAction={() => openModal()} />
          ) : (
            <>
              <Table responsive hover className="align-middle mb-0">
                <thead><tr><th>Supplier</th><th>Contact</th><th>Address</th><th>Status</th><th className="text-end">Actions</th></tr></thead>
                <tbody>
                  {suppliers.map((supplier) => (
                    <tr key={supplier._id}>
                      <td className="fw-semibold">{supplier.name}</td>
                      <td>
                        <div className="text-muted d-flex align-items-center gap-2"><Phone size={20} />{supplier.phone || '-'}</div>
                        {supplier.email && <div className="text-muted d-flex align-items-center gap-2"><Mail size={20} />{supplier.email}</div>}
                      </td>
                      <td className="text-muted">{supplier.address || '-'}</td>
                      <td><StatusBadge status={supplier.status} /></td>
                      <td className="text-end">
                        <Button variant="light" className="Zooom-icon-btn me-1" onClick={() => openModal(supplier)}><Edit size={20} /></Button>
                        <Button variant="light" className="Zooom-icon-btn text-danger" onClick={() => setDeleteTarget(supplier)}><Trash2 size={20} /></Button>
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

      <Modal show={modalOpen} onHide={() => setModalOpen(false)} centered>
        <Modal.Header closeButton><Modal.Title>{formData._id ? 'Edit Supplier' : 'Add Supplier'}</Modal.Title></Modal.Header>
        <Modal.Body>
          <Row className="g-3">
            <Col md={12}><Form.Label>Name <span className="text-danger">*</span></Form.Label><Form.Control value={formData.name} onChange={(event) => setFormData({ ...formData, name: event.target.value })} /></Col>
            <Col md={6}><Form.Label>Phone</Form.Label><Form.Control value={formData.phone || ''} onChange={(event) => setFormData({ ...formData, phone: event.target.value })} /></Col>
            <Col md={6}><Form.Label>Email</Form.Label><Form.Control type="email" value={formData.email || ''} onChange={(event) => setFormData({ ...formData, email: event.target.value })} /></Col>
            <Col md={12}><Form.Label>Address</Form.Label><Form.Control as="textarea" rows={3} value={formData.address || ''} onChange={(event) => setFormData({ ...formData, address: event.target.value })} /></Col>
            <Col md={12}><Form.Label>Status</Form.Label><Form.Select value={formData.status} onChange={(event) => setFormData({ ...formData, status: event.target.value })}><option>Active</option><option>Inactive</option></Form.Select></Col>
          </Row>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="outline-secondary" onClick={() => setModalOpen(false)}>Cancel</Button>
          <Button variant="primary" disabled={saving} onClick={saveSupplier}>{saving ? 'Saving...' : 'Save Supplier'}</Button>
        </Modal.Footer>
      </Modal>

      <DeleteModal show={Boolean(deleteTarget)} itemName={deleteTarget?.name || 'this supplier'} onCancel={() => setDeleteTarget(null)} onConfirm={deleteSupplier} />
    </div>
  );
}

