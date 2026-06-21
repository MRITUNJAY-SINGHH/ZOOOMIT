import React, { useState, useEffect } from 'react';
import { Card, Table, Button, Form, Badge, Modal, InputGroup, Spinner } from 'react-bootstrap';
import { Icon } from '@iconify/react';
import api from '@/utils/api';
import { toast } from 'react-hot-toast';

export default function Staff() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  
  const [showModal, setShowModal] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [formData, setFormData] = useState({
    _id: null, name: '', email: '', phone: '', password: '', role: 'Staff', status: 'Active',
    permissions: { products: false, inventory: false, orders: false, coupons: false, pos: false, reports: false, payments: false }
  });

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const res = await api.get('/users');
      setUsers(res.data.filter(u => u.role === 'Staff' || u.role === 'Admin'));
    } catch (error) {
      toast.error('Failed to load staff');
    } finally {
      setLoading(false);
    }
  };

  const handleOpenModal = (user = null) => {
    if (user) {
      setEditMode(true);
      setFormData({ ...user, password: '' }); // Don't populate hash
    } else {
      setEditMode(false);
      setFormData({
        _id: null, name: '', email: '', phone: '', password: '', role: 'Staff', status: 'Active',
        permissions: { products: false, inventory: false, orders: false, coupons: false, pos: false, reports: false, payments: false }
      });
    }
    setShowModal(true);
  };

  const handleTogglePermission = (key) => {
    setFormData(prev => ({
      ...prev,
      permissions: { ...prev.permissions, [key]: !prev.permissions[key] }
    }));
  };

  const handleSave = async () => {
    try {
      if (editMode) {
        const payload = { ...formData };
        if (!payload.password) delete payload.password; // Don't update if blank
        await api.put(`/users/${formData._id}`, payload);
        toast.success('Staff updated');
      } else {
        await api.post('/users', formData);
        toast.success('Staff created');
      }
      setShowModal(false);
      fetchUsers();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to save');
    }
  };

  const filteredData = users.filter(s => s.name.toLowerCase().includes(search.toLowerCase()));

  return (
    <div>
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h4 className="mb-0">Staff Management</h4>
        <Button variant="primary" onClick={() => handleOpenModal()}>
          <Icon icon="lucide:user-plus" className="me-1" /> Add Staff
        </Button>
      </div>

      <Card>
        <Card.Body>
          <div className="mb-3">
            <InputGroup style={{ maxWidth: '300px' }}>
              <InputGroup.Text><Icon icon="lucide:search" /></InputGroup.Text>
              <Form.Control placeholder="Search staff..." value={search} onChange={(e) => setSearch(e.target.value)} />
            </InputGroup>
          </div>

          {loading ? (
            <div className="text-center p-5"><Spinner animation="border" /></div>
          ) : (
            <Table responsive hover className="align-middle">
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Email</th>
                  <th>Role</th>
                  <th>Status</th>
                  <th className="text-end">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredData.map((staff) => (
                  <tr key={staff._id}>
                    <td className="fw-medium">{staff.name}</td>
                    <td>{staff.email}</td>
                    <td><Badge bg={staff.role === 'Admin' ? 'dark' : 'primary'}>{staff.role}</Badge></td>
                    <td><Badge bg={staff.status === 'Active' ? 'success' : 'danger'}>{staff.status}</Badge></td>
                    <td className="text-end">
                      <Button variant="light" size="sm" onClick={() => handleOpenModal(staff)}>
                        <Icon icon="lucide:edit" />
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </Table>
          )}
        </Card.Body>
      </Card>

      <Modal show={showModal} onHide={() => setShowModal(false)} size="lg" centered>
        <Modal.Header closeButton>
          <Modal.Title>{editMode ? 'Edit Staff' : 'Add Staff'}</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <div className="row g-3 mb-3">
            <div className="col-md-6">
              <Form.Label>Full Name <span className="text-danger">*</span></Form.Label>
              <Form.Control value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} required />
            </div>
            <div className="col-md-6">
              <Form.Label>Email <span className="text-danger">*</span></Form.Label>
              <Form.Control type="email" value={formData.email} onChange={(e) => setFormData({ ...formData, email: e.target.value })} required />
            </div>
            <div className="col-md-4">
              <Form.Label>Phone <span className="text-danger">*</span></Form.Label>
              <Form.Control value={formData.phone} onChange={(e) => setFormData({ ...formData, phone: e.target.value })} required />
            </div>
            <div className="col-md-4">
              <Form.Label>Role</Form.Label>
              <Form.Select value={formData.role} onChange={(e) => setFormData({ ...formData, role: e.target.value })}>
                <option value="Staff">Staff</option>
                <option value="Admin">Admin</option>
              </Form.Select>
            </div>
            <div className="col-md-4">
              <Form.Label>Status</Form.Label>
              <Form.Select value={formData.status} onChange={(e) => setFormData({ ...formData, status: e.target.value })}>
                <option value="Active">Active</option>
                <option value="Inactive">Inactive</option>
              </Form.Select>
            </div>
          </div>
          
          <Form.Group className="mb-4">
            <Form.Label>Password {editMode && <span className="text-muted small">(Leave blank to keep unchanged)</span>}</Form.Label>
            <Form.Control type="password" value={formData.password} onChange={(e) => setFormData({ ...formData, password: e.target.value })} required={!editMode} />
          </Form.Group>

          {formData.role !== 'Admin' && (
            <div>
              <h6 className="mb-3 border-bottom pb-2">Module Permissions</h6>
              <div className="row g-2">
                {Object.keys(formData.permissions).map((key) => (
                  <div className="col-md-4" key={key}>
                    <Form.Check 
                      type="switch"
                      id={`perm-${key}`}
                      label={<span className="text-capitalize">{key}</span>}
                      checked={formData.permissions[key]}
                      onChange={() => handleTogglePermission(key)}
                    />
                  </div>
                ))}
              </div>
            </div>
          )}
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowModal(false)}>Cancel</Button>
          <Button variant="primary" onClick={handleSave} disabled={!formData.name || !formData.email || (!editMode && !formData.password)}>Save Staff</Button>
        </Modal.Footer>
      </Modal>
    </div>
  );
}
