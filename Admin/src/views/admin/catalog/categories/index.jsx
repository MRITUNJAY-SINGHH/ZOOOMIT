import React, { useState, useEffect } from 'react';
import { Card, Table, Button, Form, Badge, Modal, InputGroup } from 'react-bootstrap';
import { Icon } from '@/components/common/LucideIcon';
import api from '@/utils/api';
import { toast } from 'react-hot-toast';
import PageHeader from '@/components/common/PageHeader';
import SkeletonTable from '@/components/common/SkeletonTable';
import EmptyState from '@/components/common/EmptyState';
import DeleteModal from '@/components/common/DeleteModal';

export default function Categories() {
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;
  const [showModal, setShowModal] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [editMode, setEditMode] = useState(false);
  const [formData, setFormData] = useState({ _id: null, name: '', slug: '', status: 'Active', image: '' });
  const [uploading, setUploading] = useState(false);

  useEffect(() => { fetchCategories(); }, []);

  const fetchCategories = async () => {
    try { setLoading(true); const res = await api.get('/categories'); setCategories(res.data || []); }
    catch (err) { toast.error('Failed to load categories'); }
    finally { setLoading(false); }
  };

  const handleOpenModal = (category = null) => {
    if (category) { setEditMode(true); setFormData(category); }
    else { setEditMode(false); setFormData({ _id: null, name: '', slug: '', status: 'Active', image: '' }); }
    setShowModal(true);
  };

  const handleImageUpload = async (e) => {
    const file = e.target.files[0]; if (!file) return;
    const data = new FormData(); data.append('image', file);
    try { setUploading(true); const res = await api.post('/uploads/product-image', data, { headers: { 'Content-Type': 'multipart/form-data' } }); setFormData(prev => ({ ...prev, image: res.data.url })); toast.success('Image uploaded'); }
    catch (err) { toast.error('Upload failed'); }
    finally { setUploading(false); }
  };

  const handleSave = async () => {
    try {
      if (editMode) { await api.put(`/categories/${formData._id}`, formData); toast.success('Category updated'); }
      else { await api.post('/categories', formData); toast.success('Category created'); }
      setShowModal(false); fetchCategories();
    } catch (err) { toast.error(err.response?.data?.message || 'Failed to save'); }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    try { await api.delete(`/categories/${deleteTarget._id}`); toast.success('Category deleted'); setDeleteTarget(null); fetchCategories(); }
    catch (err) { toast.error('Failed to delete'); }
  };

  const filteredData = categories.filter(c => c.name.toLowerCase().includes(search.toLowerCase()));
  const totalPages = Math.ceil(filteredData.length / itemsPerPage);
  const currentData = filteredData.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  return (
    <div>
      <PageHeader title="Categories" description="Manage product categories and organize your catalog." breadcrumbs={[{ label: 'Dashboard', path: '/dashboard' }, { label: 'Catalog' }, { label: 'Categories' }]} />
      <Card>
        <Card.Body>
          <div className="d-flex justify-content-between mb-3 align-items-center">
            <InputGroup size="sm" style={{ maxWidth: '280px' }}>
              <InputGroup.Text><Icon icon="lucide:search" width={14} /></InputGroup.Text>
              <Form.Control placeholder="Search categories..." value={search} onChange={(e) => { setSearch(e.target.value); setCurrentPage(1); }} />
            </InputGroup>
            <div className="d-flex gap-2 align-items-center">
              <span className="text-muted small">{filteredData.length} records</span>
              <Button variant="outline-secondary" size="sm" onClick={fetchCategories}><Icon icon="lucide:refresh-cw" width={14} /></Button>
              <Button variant="primary" size="sm" onClick={() => handleOpenModal()}><Icon icon="lucide:plus" width={14} className="me-1" />Add Category</Button>
            </div>
          </div>
          {loading ? <SkeletonTable rows={5} columns={5} /> : currentData.length === 0 ? (
            <EmptyState icon="lucide:folder" title="No Categories Found" actionLabel="Add Category" onAction={() => handleOpenModal()} />
          ) : (
            <>
              <Table responsive hover className="align-middle mb-0">
                <thead className="table-light"><tr><th style={{width:60}}>Image</th><th>Name</th><th>Slug</th><th>Status</th><th className="text-end">Actions</th></tr></thead>
                <tbody>
                  {currentData.map(c => (
                    <tr key={c._id}>
                      <td>{c.image ? <img src={c.image} alt={c.name} width="36" height="36" className="rounded" style={{ objectFit: 'cover' }} /> : <div className="bg-light rounded d-flex align-items-center justify-content-center text-muted" style={{ width: 36, height: 36 }}><Icon icon="lucide:image" width={16} /></div>}</td>
                      <td className="fw-medium">{c.name}</td>
                      <td className="text-muted"><code className="small">{c.slug}</code></td>
                      <td><Badge bg={c.status === 'Active' ? 'success' : 'danger'} style={{ cursor: 'pointer' }}>{c.status}</Badge></td>
                      <td className="text-end">
                        <Button variant="light" size="sm" className="me-1" onClick={() => handleOpenModal(c)}><Icon icon="lucide:edit" width={14} /></Button>
                        <Button variant="light" size="sm" className="text-danger" onClick={() => setDeleteTarget(c)}><Icon icon="lucide:trash-2" width={14} /></Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </Table>
              {totalPages > 1 && (
                <div className="d-flex justify-content-between align-items-center mt-3 pt-3 border-top">
                  <span className="text-muted small">Showing {((currentPage - 1) * itemsPerPage) + 1}–{Math.min(currentPage * itemsPerPage, filteredData.length)} of {filteredData.length}</span>
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
        <Modal.Header closeButton><Modal.Title>{editMode ? 'Edit Category' : 'Add Category'}</Modal.Title></Modal.Header>
        <Modal.Body>
          <Form.Group className="mb-3"><Form.Label>Name <span className="text-danger">*</span></Form.Label><Form.Control value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value, slug: e.target.value.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, '') })} /></Form.Group>
          <Form.Group className="mb-3"><Form.Label>Slug <span className="text-danger">*</span></Form.Label><Form.Control value={formData.slug} onChange={(e) => setFormData({ ...formData, slug: e.target.value })} /></Form.Group>
          <Form.Group className="mb-3"><Form.Label>Status</Form.Label><Form.Select value={formData.status} onChange={(e) => setFormData({ ...formData, status: e.target.value })}><option value="Active">Active</option><option value="Inactive">Inactive</option></Form.Select></Form.Group>
          <Form.Group className="mb-3">
            <Form.Label>Image</Form.Label>
            <Form.Control type="file" onChange={handleImageUpload} disabled={uploading} accept="image/*" />
            {uploading && <div className="text-muted mt-1 small">Uploading...</div>}
            {formData.image && <div className="mt-2"><img src={formData.image} alt="Preview" className="rounded" width="80" /></div>}
          </Form.Group>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" size="sm" onClick={() => setShowModal(false)}>Cancel</Button>
          <Button variant="primary" size="sm" onClick={handleSave} disabled={uploading || !formData.name || !formData.slug}>Save</Button>
        </Modal.Footer>
      </Modal>
      <DeleteModal show={Boolean(deleteTarget)} itemName={deleteTarget?.name || 'this category'} onCancel={() => setDeleteTarget(null)} onConfirm={handleDelete} />
    </div>
  );
}
