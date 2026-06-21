import React, { useState, useEffect } from 'react';
import { Card, Table, Button, Form, Badge, Modal, InputGroup, Spinner } from 'react-bootstrap';
import { Icon } from '@iconify/react';
import api from '@/utils/api';
import { toast } from 'react-hot-toast';

export default function DeliveryBoys() {
  const [riders, setRiders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  
  const [showModal, setShowModal] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [formData, setFormData] = useState({ _id: null, name: '', email: '', phone: '', password: '', role: 'DeliveryBoy', status: 'Active' });

  const [statsModal, setStatsModal] = useState(false);
  const [selectedStats, setSelectedStats] = useState(null);

  useEffect(() => {
    fetchRiders();
  }, []);

  const fetchRiders = async () => {
    try {
      setLoading(true);
      const res = await api.get('/users');
      setRiders(res.data.filter(u => u.role === 'DeliveryBoy'));
    } catch (error) {
      toast.error('Failed to load delivery boys');
    } finally {
      setLoading(false);
    }
  };

  const handleOpenModal = (rider = null) => {
    if (rider) {
      setEditMode(true);
      setFormData({ ...rider, password: '' });
    } else {
      setEditMode(false);
      setFormData({ _id: null, name: '', email: '', phone: '', password: '', role: 'DeliveryBoy', status: 'Active' });
    }
    setShowModal(true);
  };

  const handleViewStats = async (id) => {
    try {
      const res = await api.get(`/users/${id}/stats`);
      setSelectedStats(res.data);
      setStatsModal(true);
    } catch (error) {
      toast.error('Failed to load stats');
    }
  };

  const handleSave = async () => {
    try {
      if (editMode) {
        const payload = { ...formData };
        if (!payload.password) delete payload.password;
        await api.put(`/users/${formData._id}`, payload);
        toast.success('Rider updated');
      } else {
        await api.post('/users', formData);
        toast.success('Rider created');
      }
      setShowModal(false);
      fetchRiders();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to save');
    }
  };

  const filteredData = riders.filter(s => s.name.toLowerCase().includes(search.toLowerCase()));

  return (
    <div>
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h4 className="mb-0">Delivery Boys</h4>
        <Button variant="primary" onClick={() => handleOpenModal()}>
          <Icon icon="lucide:bike" className="me-1" /> Add Delivery Boy
        </Button>
      </div>

      <Card>
        <Card.Body>
          <div className="mb-3">
            <InputGroup style={{ maxWidth: '300px' }}>
              <InputGroup.Text><Icon icon="lucide:search" /></InputGroup.Text>
              <Form.Control placeholder="Search riders..." value={search} onChange={(e) => setSearch(e.target.value)} />
            </InputGroup>
          </div>

          {loading ? (
            <div className="text-center p-5"><Spinner animation="border" /></div>
          ) : (
            <Table responsive hover className="align-middle">
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Phone</th>
                  <th>Email</th>
                  <th>Status</th>
                  <th className="text-end">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredData.length === 0 ? (
                  <tr><td colSpan="5" className="text-center py-4">No delivery boys found</td></tr>
                ) : filteredData.map((rider) => (
                  <tr key={rider._id}>
                    <td className="fw-medium">{rider.name}</td>
                    <td>{rider.phone}</td>
                    <td>{rider.email}</td>
                    <td><Badge bg={rider.status === 'Active' ? 'success' : 'danger'}>{rider.status}</Badge></td>
                    <td className="text-end">
                      <Button variant="info" size="sm" className="me-2 text-white" onClick={() => handleViewStats(rider._id)}>
                        <Icon icon="lucide:bar-chart-2" className="me-1" /> Stats
                      </Button>
                      <Button variant="light" size="sm" onClick={() => handleOpenModal(rider)}>
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

      {/* Add/Edit Modal */}
      <Modal show={showModal} onHide={() => setShowModal(false)} centered>
        <Modal.Header closeButton>
          <Modal.Title>{editMode ? 'Edit Rider' : 'Add Rider'}</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Form.Group className="mb-3">
            <Form.Label>Full Name</Form.Label>
            <Form.Control value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} required />
          </Form.Group>
          <div className="row g-3 mb-3">
            <div className="col-md-6">
              <Form.Label>Phone</Form.Label>
              <Form.Control value={formData.phone} onChange={(e) => setFormData({ ...formData, phone: e.target.value })} required />
            </div>
            <div className="col-md-6">
              <Form.Label>Email</Form.Label>
              <Form.Control type="email" value={formData.email} onChange={(e) => setFormData({ ...formData, email: e.target.value })} required />
            </div>
          </div>
          <div className="row g-3 mb-3">
            <div className="col-md-6">
              <Form.Label>Password {editMode && <span className="text-muted small">(Leave blank to keep)</span>}</Form.Label>
              <Form.Control type="password" value={formData.password} onChange={(e) => setFormData({ ...formData, password: e.target.value })} required={!editMode} />
            </div>
            <div className="col-md-6">
              <Form.Label>Status</Form.Label>
              <Form.Select value={formData.status} onChange={(e) => setFormData({ ...formData, status: e.target.value })}>
                <option value="Active">Active</option>
                <option value="Inactive">Inactive</option>
              </Form.Select>
            </div>
          </div>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowModal(false)}>Cancel</Button>
          <Button variant="primary" onClick={handleSave}>Save</Button>
        </Modal.Footer>
      </Modal>

      {/* Stats Modal */}
      <Modal show={statsModal} onHide={() => setStatsModal(false)} centered>
        <Modal.Header closeButton>
          <Modal.Title>Rider Statistics</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {selectedStats ? (
            <div className="row text-center g-3">
              <div className="col-4">
                <Card className="bg-light border-0">
                  <Card.Body>
                    <h2 className="mb-1 text-primary">{selectedStats.assignedOrders}</h2>
                    <span className="text-muted small">Assigned</span>
                  </Card.Body>
                </Card>
              </div>
              <div className="col-4">
                <Card className="bg-light border-0">
                  <Card.Body>
                    <h2 className="mb-1 text-success">{selectedStats.completedOrders}</h2>
                    <span className="text-muted small">Delivered</span>
                  </Card.Body>
                </Card>
              </div>
              <div className="col-4">
                <Card className="bg-light border-0">
                  <Card.Body>
                    <h2 className="mb-1 text-danger">{selectedStats.cancelledOrders}</h2>
                    <span className="text-muted small">Cancelled</span>
                  </Card.Body>
                </Card>
              </div>
            </div>
          ) : (
            <div className="text-center"><Spinner animation="border" /></div>
          )}
        </Modal.Body>
      </Modal>
    </div>
  );
}
