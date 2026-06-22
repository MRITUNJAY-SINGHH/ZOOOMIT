import React, { useState, useEffect } from 'react';
import { Card, Table, Button, Form, Badge, Modal, InputGroup } from 'react-bootstrap';
import { Icon } from '@iconify/react';
import api from '@/utils/api';
import { toast } from 'react-hot-toast';
import PageHeader from '@/components/common/PageHeader';
import SkeletonTable from '@/components/common/SkeletonTable';
import EmptyState from '@/components/common/EmptyState';

export default function Suppliers() {
  const [suppliers, setSuppliers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalRecords, setTotalRecords] = useState(0);
  const [showModal, setShowModal] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [formData, setFormData] = useState({ _id: null, name: '', phone: '', email: '', address: '', status: 'Active' });

  useEffect(() => { fetchSuppliers(); }, [currentPage, search]);

  const fetchSuppliers = async () => {
    try {
      setLoading(true);
      const res = await api.get(`/suppliers?page=${currentPage}&limit=20&search=${search}`);
      setSuppliers(res.data.data || []);
      setTotalPages(res.data.totalPages || 1);
      setTotalRecords(res.data.total || 0);
    } catch (err) { toast.error('Failed to load suppliers'); }
    finally { setLoading(false); }
  };

  const handleOpenModal = (supplier = null) => {
    if (supplier) { setEditMode(true); setFormData(supplier); }
    else { setEditMode(false); setFormData({ _id: null, name: '', phone: '', email: '', address: '', status: 'Active' }); }
    setShowModal(true);
  };

  const handleSave = async () => {
    try {
      if (editMode) { await api.put(`/suppliers/${formData._id}`, formData); toast.success('Supplier updated'); }
      else { await api.post('/suppliers', formData); toast.success('Supplier created'); }
      setShowModal(false); fetchSuppliers();
    } catch (err) { toast.error(err.response?.data?.message || 'Failed to save'); }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this supplier?')) return;
    try { await api.delete(`/suppliers/${id}`); toast.success('Supplier deleted'); fetchSuppliers(); }
    catch (err) { toast.error('Failed to delete'); }
  };

  return (
    <div>
      <PageHeader title="Suppliers" description="Manage your product suppliers and vendor contacts." breadcrumbs={[{ label: 'Dashboard', path: '/dashboard' }, { label: 'Suppliers' }]} />
      <Card>
        <Card.Body>
          <div className="d-flex justify-content-between mb-3 align-items-center">
            <InputGroup size="sm" style={{ maxWidth: '280px' }}>
              <InputGroup.Text><Icon icon="lucide:search" width={14} /></InputGroup.Text>
              <Form.Control placeholder="Search suppliers..." value={search} onChange={(e) => { setSearch(e.target.value); setCurrentPage(1); }} />
            </InputGroup>
            <div className="d-flex gap-2 align-items-center">
              <span className="text-muted small">{totalRecords} records</span>
              <Button variant="outline-secondary" size="sm" onClick={fetchSuppliers}><Icon icon="lucide:refresh-cw" width={14} /></Button>
              <Button variant="primary" size="sm" onClick={() => handleOpenModal()}><Icon icon="lucide:plus" width={14} className="me-1" />Add Supplier</Button>
            </div>
          </div>

          {loading ? <SkeletonTable rows={6} columns={5} /> : suppliers.length === 0 ? (
            <EmptyState icon="lucide:building-2" title="No Suppliers Found" message="Start by adding your first supplier." actionLabel="Add Supplier" onAction={() => handleOpenModal()} />
          ) : (
            <>
              <Table responsive hover className="align-middle mb-0">
                <thead className="table-light"><tr><th>Name</th><th>Contact</th><th>Address</th><th>Status</th><th className="text-end">Actions</th></tr></thead>
                <tbody>
                  {suppliers.map(s => (
                    <tr key={s._id}>
                      <td className="fw-medium">{s.name}</td>
                      <td><div className="text-muted small"><Icon icon="lucide:phone" width={12} className="me-1" />{s.phone || '-'}</div>{s.email && <div className="text-muted small"><Icon icon="lucide:mail" width={12} className="me-1" />{s.email}</div>}</td>
                      <td className="text-muted">{s.address || '-'}</td>
                      <td><Badge bg={s.status === 'Active' ? 'success' : 'danger'}>{s.status}</Badge></td>
                      <td className="text-end">
                        <Button variant="light" size="sm" className="me-1" onClick={() => handleOpenModal(s)}><Icon icon="lucide:edit" width={14} /></Button>
                        <Button variant="light" size="sm" className="text-danger" onClick={() => handleDelete(s._id)}><Icon icon="lucide:trash-2" width={14} /></Button>
                      </td>
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

      <Modal show={showModal} onHide={() => setShowModal(false)} centered>
        <Modal.Header closeButton><Modal.Title>{editMode ? 'Edit Supplier' : 'Add Supplier'}</Modal.Title></Modal.Header>
        <Modal.Body>
          <Form.Group className="mb-3"><Form.Label>Name <span className="text-danger">*</span></Form.Label><Form.Control value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} /></Form.Group>
          <div className="row g-3 mb-3">
            <div className="col-md-6"><Form.Label>Phone</Form.Label><Form.Control value={formData.phone} onChange={(e) => setFormData({ ...formData, phone: e.target.value })} /></div>
            <div className="col-md-6"><Form.Label>Email</Form.Label><Form.Control type="email" value={formData.email} onChange={(e) => setFormData({ ...formData, email: e.target.value })} /></div>
          </div>
          <Form.Group className="mb-3"><Form.Label>Address</Form.Label><Form.Control as="textarea" rows={2} value={formData.address} onChange={(e) => setFormData({ ...formData, address: e.target.value })} /></Form.Group>
          <Form.Group className="mb-3"><Form.Label>Status</Form.Label><Form.Select value={formData.status} onChange={(e) => setFormData({ ...formData, status: e.target.value })}><option value="Active">Active</option><option value="Inactive">Inactive</option></Form.Select></Form.Group>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" size="sm" onClick={() => setShowModal(false)}>Cancel</Button>
          <Button variant="primary" size="sm" onClick={handleSave} disabled={!formData.name}>Save</Button>
        </Modal.Footer>
      </Modal>
    </div>
  );
}
