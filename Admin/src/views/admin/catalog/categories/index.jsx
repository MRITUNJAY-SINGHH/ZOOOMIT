import React, { useState, useEffect } from 'react';
import { Card, Table, Button, Form, Badge, Modal, InputGroup, Pagination, Row, Col } from 'react-bootstrap';
import { Icon } from '@/components/common/LucideIcon';
import api from '@/utils/api';
import { toast } from 'react-hot-toast';
import { usePageSize } from '@/hooks/usePageSize';
import PageHeader from '@/components/common/PageHeader';
import SkeletonTable from '@/components/common/SkeletonTable';
import EmptyState from '@/components/common/EmptyState';
import DeleteModal from '@/components/common/DeleteModal';

export default function Categories() {
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = usePageSize(50);
  const [showModal, setShowModal] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [editMode, setEditMode] = useState(false);
  const [formData, setFormData] = useState({ 
    _id: null, 
    name: '', 
    slug: '', 
    description: '',
    parentCategory: '', 
    status: 'Active', 
    image: '' 
  });
  const [uploading, setUploading] = useState(false);

  useEffect(() => { fetchCategories(); }, []);

  const fetchCategories = async () => {
    try { 
      setLoading(true); 
      const res = await api.get('/categories'); 
      setCategories(res.data || []); 
    }
    catch (err) { toast.error('Failed to load categories'); }
    finally { setLoading(false); }
  };

  const handleOpenModal = (category = null, defaultParent = '') => {
    if (category) { 
      setEditMode(true); 
      setFormData({
        _id: category._id,
        name: category.name,
        slug: category.slug,
        description: category.description || '',
        parentCategory: category.parentCategory?._id || category.parentCategory || '',
        status: category.status || 'Active',
        image: category.image || ''
      }); 
    } else { 
      setEditMode(false); 
      setFormData({ 
        _id: null, 
        name: '', 
        slug: '', 
        description: '',
        parentCategory: defaultParent || '', 
        status: 'Active', 
        image: '' 
      }); 
    }
    setShowModal(true);
  };

  const handleImageUpload = async (e) => {
    const file = e.target.files[0]; 
    if (!file) return;
    const data = new FormData(); 
    data.append('image', file);
    try { 
      setUploading(true); 
      const res = await api.post('/uploads/product-image', data, { headers: { 'Content-Type': 'multipart/form-data' } }); 
      setFormData(prev => ({ ...prev, image: res.data.url })); 
      toast.success('Image uploaded'); 
    }
    catch (err) { toast.error('Upload failed'); }
    finally { setUploading(false); }
  };

  const handleSave = async () => {
    if (!formData.name) { toast.error('Name is required'); return; }
    try {
      const payload = {
        ...formData,
        parentCategory: formData.parentCategory || null,
        slug: formData.slug || formData.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, '')
      };
      if (editMode) { 
        await api.put(`/categories/${formData._id}`, payload); 
        toast.success('Category updated'); 
      } else { 
        await api.post('/categories', payload); 
        toast.success('Category created'); 
      }
      setShowModal(false); 
      fetchCategories();
    } catch (err) { toast.error(err.response?.data?.message || 'Failed to save'); }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    try { 
      await api.delete(`/categories/${deleteTarget._id}`); 
      toast.success('Category deleted'); 
      setDeleteTarget(null); 
      fetchCategories(); 
    }
    catch (err) { toast.error('Failed to delete'); }
  };

  // Group into Hierarchy
  const rootCategories = categories.filter(c => !c.parentCategory);
  
  // Flatten tree for display with child rows below parents
  let displayList = [];
  rootCategories.forEach(root => {
    displayList.push({ ...root, isSub: false });
    const subcats = categories.filter(c => c.parentCategory && (c.parentCategory._id === root._id || c.parentCategory === root._id));
    subcats.forEach(sub => {
      displayList.push({ ...sub, isSub: true, parentName: root.name });
    });
  });

  // Catch any orphaned subcategories
  const categorizedIds = new Set(displayList.map(c => c._id));
  categories.forEach(c => {
    if (!categorizedIds.has(c._id)) {
      displayList.push({ ...c, isSub: !!c.parentCategory });
    }
  });

  const filteredData = displayList.filter(c => 
    c.name.toLowerCase().includes(search.toLowerCase()) || 
    (c.parentName && c.parentName.toLowerCase().includes(search.toLowerCase()))
  );
  const totalPages = Math.ceil(filteredData.length / pageSize);
  const currentData = filteredData.slice((currentPage - 1) * pageSize, currentPage * pageSize);

  return (
    <div>
      <PageHeader 
        title="Categories & Subcategories" 
        description="Organize your retail grocery catalog into parent categories and subcategories." 
        breadcrumbs={[{ label: 'Dashboard', path: '/dashboard' }, { label: 'Catalog' }, { label: 'Categories' }]} 
      />
      <Card className="border-0 shadow-sm">
        <Card.Body>
          <div className="d-flex justify-content-between mb-3 align-items-center flex-wrap gap-2">
            <InputGroup size="sm" style={{ maxWidth: '280px' }}>
              <InputGroup.Text className="bg-transparent text-muted"><Icon icon="lucide:search" width={14} /></InputGroup.Text>
              <Form.Control placeholder="Search categories..." value={search} onChange={(e) => { setSearch(e.target.value); setCurrentPage(1); }} />
            </InputGroup>
            <div className="d-flex gap-2 align-items-center">
              <span className="text-muted small">{categories.length} total categories</span>
              <Button variant="outline-secondary" size="sm" onClick={fetchCategories}><Icon icon="lucide:refresh-cw" width={14} /></Button>
              <Button variant="primary" size="sm" onClick={() => handleOpenModal()}><Icon icon="lucide:plus" width={14} className="me-1" />Add Category</Button>
            </div>
          </div>
          {loading ? <SkeletonTable rows={5} columns={6} /> : currentData.length === 0 ? (
            <EmptyState icon="lucide:folder" title="No Categories Found" actionLabel="Add Category" onAction={() => handleOpenModal()} />
          ) : (
            <>
              <Table responsive hover className="align-middle mb-0">
                <thead className="bg-light">
                  <tr>
                    <th style={{ width: 60 }}>Image</th>
                    <th>Category Name</th>
                    <th>Type</th>
                    <th>Slug</th>
                    <th>Status</th>
                    <th className="text-end">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {currentData.map(c => (
                    <tr key={c._id} className={c.isSub ? 'bg-body-tertiary' : ''}>
                      <td>
                        {c.image ? (
                          <img src={c.image} alt={c.name} width="36" height="36" className="rounded" style={{ objectFit: 'cover' }} />
                        ) : (
                          <div className="bg-light rounded d-flex align-items-center justify-content-center text-muted" style={{ width: 36, height: 36 }}>
                            <Icon icon="lucide:image" width={16} />
                          </div>
                        )}
                      </td>
                      <td>
                        <div className={`d-flex align-items-center gap-2 ${c.isSub ? 'ps-4' : ''}`}>
                          {c.isSub && <span className="text-muted">↳</span>}
                          <span className={c.isSub ? 'fw-normal text-body' : 'fw-bold text-primary'}>{c.name}</span>
                        </div>
                      </td>
                      <td>
                        {c.isSub ? (
                          <Badge bg="secondary" className="font-size-11">Subcategory of {c.parentName || 'Parent'}</Badge>
                        ) : (
                          <Badge bg="primary-subtle" className="text-primary font-size-11">Parent Category</Badge>
                        )}
                      </td>
                      <td className="text-muted"><code className="small">{c.slug}</code></td>
                      <td><Badge bg={c.status === 'Active' ? 'success' : 'danger'}>{c.status}</Badge></td>
                      <td className="text-end">
                        {!c.isSub && (
                          <Button 
                            variant="outline-primary" 
                            size="sm" 
                            className="me-2 py-0 px-2 font-size-11" 
                            onClick={() => handleOpenModal(null, c._id)}
                            title="Add Subcategory"
                          >
                            + Subcategory
                          </Button>
                        )}
                        <Button variant="light" size="sm" className="me-1" onClick={() => handleOpenModal(c)}><Icon icon="lucide:edit" width={14} /></Button>
                        <Button variant="light" size="sm" className="text-danger" onClick={() => setDeleteTarget(c)}><Icon icon="lucide:trash-2" width={14} /></Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </Table>
              {totalPages > 1 && (
                <div className="d-flex justify-content-between align-items-center pt-3 border-top">
                  <span className="text-muted small">Page {currentPage} of {totalPages}</span>
                  <Pagination size="sm" className="mb-0">
                    <Pagination.Prev disabled={currentPage === 1} onClick={() => setCurrentPage(p => p - 1)} />
                    {Array.from({ length: totalPages }, (_, i) => (
                      <Pagination.Item key={i + 1} active={i + 1 === currentPage} onClick={() => setCurrentPage(i + 1)}>
                        {i + 1}
                      </Pagination.Item>
                    ))}
                    <Pagination.Next disabled={currentPage === totalPages} onClick={() => setCurrentPage(p => p + 1)} />
                  </Pagination>
                </div>
              )}
            </>
          )}
        </Card.Body>
      </Card>

      {/* Add / Edit Category Modal */}
      <Modal show={showModal} onHide={() => setShowModal(false)} centered>
        <Modal.Header closeButton>
          <Modal.Title>{editMode ? 'Edit Category' : 'Create Category / Subcategory'}</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Form>
            <Form.Group className="mb-3">
              <Form.Label className="fw-medium">Category Name *</Form.Label>
              <Form.Control 
                value={formData.name} 
                onChange={e => setFormData({
                  ...formData, 
                  name: e.target.value,
                  slug: editMode ? formData.slug : e.target.value.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, '')
                })} 
                placeholder="e.g. Fresh Grocery, Staples & Grains" 
                required 
              />
            </Form.Group>

            <Form.Group className="mb-3">
              <Form.Label className="fw-medium">Parent Category (Optional)</Form.Label>
              <Form.Select 
                value={formData.parentCategory} 
                onChange={e => setFormData({ ...formData, parentCategory: e.target.value })}
              >
                <option value="">None (Top-Level Parent Category)</option>
                {rootCategories.filter(r => r._id !== formData._id).map(r => (
                  <option key={r._id} value={r._id}>{r.name}</option>
                ))}
              </Form.Select>
              <Form.Text className="text-muted font-size-11">
                Select a parent if this is a subcategory.
              </Form.Text>
            </Form.Group>

            <Form.Group className="mb-3">
              <Form.Label className="fw-medium">Slug (URL identifier)</Form.Label>
              <Form.Control 
                value={formData.slug} 
                onChange={e => setFormData({ ...formData, slug: e.target.value })} 
                placeholder="auto-generated" 
              />
            </Form.Group>

            <Form.Group className="mb-3">
              <Form.Label className="fw-medium">Description</Form.Label>
              <Form.Control 
                as="textarea" 
                rows={2} 
                value={formData.description} 
                onChange={e => setFormData({ ...formData, description: e.target.value })} 
                placeholder="Brief category description..." 
              />
            </Form.Group>

            <Form.Group className="mb-3">
              <Form.Label className="fw-medium">Category Image</Form.Label>
              <div className="d-flex gap-2 align-items-center">
                <Form.Control type="file" accept="image/*" onChange={handleImageUpload} disabled={uploading} />
                {uploading && <span className="small text-primary">Uploading...</span>}
              </div>
              {formData.image && (
                <div className="mt-2">
                  <img src={formData.image} alt="Preview" width="60" height="60" className="rounded object-fit-cover border" />
                </div>
              )}
            </Form.Group>

            <Form.Group className="mb-3">
              <Form.Label className="fw-medium">Status</Form.Label>
              <Form.Select value={formData.status} onChange={e => setFormData({ ...formData, status: e.target.value })}>
                <option value="Active">Active</option>
                <option value="Inactive">Inactive</option>
              </Form.Select>
            </Form.Group>
          </Form>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowModal(false)}>Cancel</Button>
          <Button variant="primary" onClick={handleSave}>{editMode ? 'Save Changes' : 'Create'}</Button>
        </Modal.Footer>
      </Modal>

      <DeleteModal 
        show={Boolean(deleteTarget)} 
        itemName={deleteTarget?.name} 
        onCancel={() => setDeleteTarget(null)} 
        onConfirm={handleDelete} 
      />
    </div>
  );
}
