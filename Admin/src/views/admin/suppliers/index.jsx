import React, { useState, useEffect } from 'react';
import { Card, Table, Button, Form, Badge, Modal, InputGroup, Spinner } from 'react-bootstrap';
import { Icon } from '@iconify/react';
import api from '@/utils/api';
import { toast } from 'react-hot-toast';

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

  useEffect(() => {
    fetchSuppliers();
  }, [currentPage, search]);

  const fetchSuppliers = async () => {
    try {
      setLoading(true);
      const res = await api.get(`/suppliers?page=${currentPage}&limit=20&search=${search}`);
      setSuppliers(res.data.data);
      setTotalPages(res.data.totalPages);
      setTotalRecords(res.data.total);
    } catch (error) {
      toast.error('Failed to load suppliers');
    } finally {
      setLoading(false);
    }
  };

  const handleOpenModal = (supplier = null) => {
    if (supplier) {
      setEditMode(true);
      setFormData(supplier);
    } else {
      setEditMode(false);
      setFormData({ _id: null, name: '', phone: '', email: '', address: '', status: 'Active' });
    }
    setShowModal(true);
  };

  const handleSave = async () => {
    try {
      if (editMode) {
        await api.put(`/suppliers/${formData._id}`, formData);
        toast.success('Supplier updated');
      } else {
        await api.post('/suppliers', formData);
        toast.success('Supplier created');
      }
      setShowModal(false);
      fetchSuppliers();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to save');
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this supplier?')) return;
    try {
      await api.delete(`/suppliers/${id}`);
      toast.success('Supplier deleted');
      fetchSuppliers();
    } catch (error) {
      toast.error('Failed to delete');
    }
  };

  return (
    <div>
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h4 className="mb-0">Suppliers</h4>
        <Button variant="primary" onClick={() => handleOpenModal()}>
          <Icon icon="lucide:plus" className="me-1" /> Add Supplier
        </Button>
      </div>

      <Card>
        <Card.Body>
          <div className="mb-3">
            <InputGroup style={{ maxWidth: '300px' }}>
              <InputGroup.Text><Icon icon="lucide:search" /></InputGroup.Text>
              <Form.Control placeholder="Search suppliers..." value={search} onChange={(e) => { setSearch(e.target.value); setCurrentPage(1); }} />
            </InputGroup>
          </div>

          {loading ? (
            <div className="text-center p-5"><Spinner animation="border" /></div>
          ) : (
            <>
              <Table responsive hover className="align-middle">
                <thead>
                  <tr>
                    <th>Name</th>
                    <th>Contact Info</th>
                    <th>Address</th>
                    <th>Status</th>
                    <th className="text-end">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {suppliers.length === 0 ? (
                    <tr><td colSpan="5" className="text-center py-4">No suppliers found</td></tr>
                  ) : suppliers.map((supplier) => (
                    <tr key={supplier._id}>
                      <td className="fw-medium">{supplier.name}</td>
                      <td>
                        <div><Icon icon="lucide:phone" className="text-muted me-1" size={14} /> {supplier.phone || '-'}</div>
                        {supplier.email && <div><Icon icon="lucide:mail" className="text-muted me-1" size={14} /> {supplier.email}</div>}
                      </td>
                      <td>{supplier.address || '-'}</td>
                      <td><Badge bg={supplier.status === 'Active' ? 'success' : 'danger'}>{supplier.status}</Badge></td>
                      <td className="text-end">
                        <Button variant="light" size="sm" className="me-2" onClick={() => handleOpenModal(supplier)}>
                          <Icon icon="lucide:edit" />
                        </Button>
                        <Button variant="light" size="sm" className="text-danger" onClick={() => handleDelete(supplier._id)}>
                          <Icon icon="lucide:trash-2" />
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </Table>
              {totalPages > 1 && (
                <div className="d-flex justify-content-between align-items-center mt-3">
                  <span className="text-muted">Showing page {currentPage} of {totalPages} ({totalRecords} entries)</span>
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
        <Modal.Header closeButton>
          <Modal.Title>{editMode ? 'Edit Supplier' : 'Add Supplier'}</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Form.Group className="mb-3">
            <Form.Label>Supplier Name <span className="text-danger">*</span></Form.Label>
            <Form.Control value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} required />
          </Form.Group>
          <div className="row g-3 mb-3">
            <div className="col-md-6">
              <Form.Label>Phone</Form.Label>
              <Form.Control value={formData.phone} onChange={(e) => setFormData({ ...formData, phone: e.target.value })} />
            </div>
            <div className="col-md-6">
              <Form.Label>Email</Form.Label>
              <Form.Control type="email" value={formData.email} onChange={(e) => setFormData({ ...formData, email: e.target.value })} />
            </div>
          </div>
          <Form.Group className="mb-3">
            <Form.Label>Address</Form.Label>
            <Form.Control as="textarea" rows={2} value={formData.address} onChange={(e) => setFormData({ ...formData, address: e.target.value })} />
          </Form.Group>
          <Form.Group className="mb-3">
            <Form.Label>Status</Form.Label>
            <Form.Select value={formData.status} onChange={(e) => setFormData({ ...formData, status: e.target.value })}>
              <option value="Active">Active</option>
              <option value="Inactive">Inactive</option>
            </Form.Select>
          </Form.Group>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowModal(false)}>Cancel</Button>
          <Button variant="primary" onClick={handleSave} disabled={!formData.name}>Save</Button>
        </Modal.Footer>
      </Modal>
    </div>
  );
}
