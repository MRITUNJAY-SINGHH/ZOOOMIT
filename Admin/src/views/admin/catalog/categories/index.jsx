import React, { useState, useEffect } from 'react';
import { Card, Table, Button, Form, Badge, Modal, InputGroup, Spinner } from 'react-bootstrap';
import { Icon } from '@iconify/react';
import api from '@/utils/api';
import { toast } from 'react-hot-toast';

export default function Categories() {
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  
  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  // Modal State
  const [showModal, setShowModal] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [formData, setFormData] = useState({ _id: null, name: '', slug: '', status: 'Active', image: '' });
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    fetchCategories();
  }, []);

  const fetchCategories = async () => {
    try {
      setLoading(true);
      const res = await api.get('/categories');
      setCategories(res.data);
    } catch (error) {
      toast.error('Failed to load categories');
    } finally {
      setLoading(false);
    }
  };

  const handleOpenModal = (category = null) => {
    if (category) {
      setEditMode(true);
      setFormData(category);
    } else {
      setEditMode(false);
      setFormData({ _id: null, name: '', slug: '', status: 'Active', image: '' });
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
      const res = await api.post('/uploads/product-image', data, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      setFormData({ ...formData, image: res.data.url });
      toast.success('Image uploaded successfully');
    } catch (error) {
      toast.error('Image upload failed');
    } finally {
      setUploading(false);
    }
  };

  const handleSave = async () => {
    try {
      if (editMode) {
        await api.put(`/categories/${formData._id}`, formData);
        toast.success('Category updated');
      } else {
        await api.post('/categories', formData);
        toast.success('Category created');
      }
      setShowModal(false);
      fetchCategories();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to save');
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this category?')) return;
    try {
      await api.delete(`/categories/${id}`);
      toast.success('Category deleted');
      fetchCategories();
    } catch (error) {
      toast.error('Failed to delete');
    }
  };

  const handleToggleStatus = async (category) => {
    const newStatus = category.status === 'Active' ? 'Inactive' : 'Active';
    try {
      await api.put(`/categories/${category._id}`, { ...category, status: newStatus });
      toast.success(`Status changed to ${newStatus}`);
      fetchCategories();
    } catch (error) {
      toast.error('Failed to change status');
    }
  };

  // Filter & Paginate
  const filteredData = categories.filter(c => c.name.toLowerCase().includes(search.toLowerCase()) || c.slug.toLowerCase().includes(search.toLowerCase()));
  const totalPages = Math.ceil(filteredData.length / itemsPerPage);
  const currentData = filteredData.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  return (
    <div>
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h4 className="mb-0">Categories</h4>
        <Button variant="primary" onClick={() => handleOpenModal()}>
          <Icon icon="lucide:plus" className="me-1" /> Add Category
        </Button>
      </div>

      <Card>
        <Card.Body>
          <div className="d-flex justify-content-between mb-3">
            <InputGroup style={{ maxWidth: '300px' }}>
              <InputGroup.Text><Icon icon="lucide:search" /></InputGroup.Text>
              <Form.Control 
                placeholder="Search categories..." 
                value={search} 
                onChange={(e) => { setSearch(e.target.value); setCurrentPage(1); }} 
              />
            </InputGroup>
          </div>

          {loading ? (
            <div className="text-center p-5"><Spinner animation="border" /></div>
          ) : (
            <>
              <Table responsive hover className="align-middle">
                <thead>
                  <tr>
                    <th>Image</th>
                    <th>Name</th>
                    <th>Slug</th>
                    <th>Status</th>
                    <th className="text-end">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {currentData.length === 0 ? (
                    <tr><td colSpan="5" className="text-center py-4">No categories found</td></tr>
                  ) : currentData.map((category) => (
                    <tr key={category._id}>
                      <td>
                        {category.image ? (
                          <img src={category.image} alt={category.name} width="40" height="40" className="rounded" style={{ objectFit: 'cover' }} />
                        ) : (
                          <div className="bg-light rounded d-flex align-items-center justify-content-center text-muted" style={{ width: 40, height: 40 }}>
                            <Icon icon="lucide:image" />
                          </div>
                        )}
                      </td>
                      <td className="fw-medium">{category.name}</td>
                      <td><code>{category.slug}</code></td>
                      <td>
                        <Badge bg={category.status === 'Active' ? 'success' : 'danger'} style={{ cursor: 'pointer' }} onClick={() => handleToggleStatus(category)}>
                          {category.status}
                        </Badge>
                      </td>
                      <td className="text-end">
                        <Button variant="light" size="sm" className="me-2" onClick={() => handleOpenModal(category)}>
                          <Icon icon="lucide:edit" />
                        </Button>
                        <Button variant="light" size="sm" className="text-danger" onClick={() => handleDelete(category._id)}>
                          <Icon icon="lucide:trash-2" />
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </Table>

              {totalPages > 1 && (
                <div className="d-flex justify-content-between align-items-center mt-3">
                  <span className="text-muted">Showing {((currentPage - 1) * itemsPerPage) + 1} to {Math.min(currentPage * itemsPerPage, filteredData.length)} of {filteredData.length} entries</span>
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

      {/* Add/Edit Modal */}
      <Modal show={showModal} onHide={() => setShowModal(false)} centered>
        <Modal.Header closeButton>
          <Modal.Title>{editMode ? 'Edit Category' : 'Add Category'}</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Form.Group className="mb-3">
            <Form.Label>Category Name <span className="text-danger">*</span></Form.Label>
            <Form.Control 
              value={formData.name} 
              onChange={(e) => setFormData({ ...formData, name: e.target.value, slug: e.target.value.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, '') })} 
              required
            />
          </Form.Group>

          <Form.Group className="mb-3">
            <Form.Label>Slug <span className="text-danger">*</span></Form.Label>
            <Form.Control 
              value={formData.slug} 
              onChange={(e) => setFormData({ ...formData, slug: e.target.value })} 
              required
            />
          </Form.Group>

          <Form.Group className="mb-3">
            <Form.Label>Status</Form.Label>
            <Form.Select 
              value={formData.status} 
              onChange={(e) => setFormData({ ...formData, status: e.target.value })}
            >
              <option value="Active">Active</option>
              <option value="Inactive">Inactive</option>
            </Form.Select>
          </Form.Group>

          <Form.Group className="mb-3">
            <Form.Label>Category Image</Form.Label>
            <Form.Control type="file" onChange={handleImageUpload} disabled={uploading} accept="image/*" />
            {uploading && <div className="text-muted mt-1 small">Uploading...</div>}
            {formData.image && (
              <div className="mt-2">
                <img src={formData.image} alt="Preview" className="rounded" width="100" />
              </div>
            )}
          </Form.Group>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowModal(false)}>Cancel</Button>
          <Button variant="primary" onClick={handleSave} disabled={uploading || !formData.name || !formData.slug}>
            Save Category
          </Button>
        </Modal.Footer>
      </Modal>
    </div>
  );
}
