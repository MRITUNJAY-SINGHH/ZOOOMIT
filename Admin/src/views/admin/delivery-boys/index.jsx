import React, { useState, useEffect } from 'react';
import { Card, Table, Button, Form, Badge, Modal, InputGroup } from 'react-bootstrap';
import { Icon } from '@iconify/react';
import api from '@/utils/api';
import { toast } from 'react-hot-toast';
import PageHeader from '@/components/common/PageHeader';
import SkeletonTable from '@/components/common/SkeletonTable';
import EmptyState from '@/components/common/EmptyState';

export default function DeliveryBoys() {
  const [riders, setRiders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [formData, setFormData] = useState({ _id: null, name: '', email: '', phone: '', password: '', role: 'DeliveryBoy', status: 'Active' });
  const [statsModal, setStatsModal] = useState(false);
  const [selectedStats, setSelectedStats] = useState(null);

  useEffect(() => { fetchRiders(); }, []);

  const fetchRiders = async () => {
    try {
      setLoading(true);
      const res = await api.get('/users');
      setRiders((res.data || []).filter(u => u.role === 'DeliveryBoy'));
    } catch (err) { toast.error('Failed to load delivery boys'); }
    finally { setLoading(false); }
  };

  const handleOpenModal = (rider = null) => {
    if (rider) { setEditMode(true); setFormData({ ...rider, password: '' }); }
    else { setEditMode(false); setFormData({ _id: null, name: '', email: '', phone: '', password: '', role: 'DeliveryBoy', status: 'Active' }); }
    setShowModal(true);
  };

  const handleViewStats = async (id) => {
    try { const res = await api.get(`/users/${id}/stats`); setSelectedStats(res.data); setStatsModal(true); }
    catch (err) { toast.error('Failed to load stats'); }
  };

  const handleSave = async () => {
    try {
      if (editMode) {
        const payload = { ...formData }; if (!payload.password) delete payload.password;
        await api.put(`/users/${formData._id}`, payload); toast.success('Rider updated');
      } else { await api.post('/users', formData); toast.success('Rider created'); }
      setShowModal(false); fetchRiders();
    } catch (err) { toast.error(err.response?.data?.message || 'Failed to save'); }
  };

  const filteredData = riders.filter(s => s.name.toLowerCase().includes(search.toLowerCase()));

  return (
    <div>
      <PageHeader title="Delivery Boys" description="Manage delivery partners, track assignments, and view performance." breadcrumbs={[{ label: 'Dashboard', path: '/dashboard' }, { label: 'Staff & Delivery' }, { label: 'Delivery Boys' }]} />
      <Card>
        <Card.Body>
          <div className="d-flex justify-content-between mb-3 align-items-center">
            <InputGroup size="sm" style={{ maxWidth: '280px' }}>
              <InputGroup.Text><Icon icon="lucide:search" width={14} /></InputGroup.Text>
              <Form.Control placeholder="Search riders..." value={search} onChange={(e) => setSearch(e.target.value)} />
            </InputGroup>
            <div className="d-flex gap-2">
              <Button variant="outline-secondary" size="sm" onClick={fetchRiders}><Icon icon="lucide:refresh-cw" width={14} /></Button>
              <Button variant="primary" size="sm" onClick={() => handleOpenModal()}><Icon icon="lucide:plus" width={14} className="me-1" />Add Rider</Button>
            </div>
          </div>
          {loading ? <SkeletonTable rows={5} columns={5} /> : filteredData.length === 0 ? (
            <EmptyState icon="lucide:truck" title="No Delivery Boys Found" actionLabel="Add Rider" onAction={() => handleOpenModal()} />
          ) : (
            <Table responsive hover className="align-middle mb-0">
              <thead className="table-light"><tr><th>Name</th><th>Phone</th><th>Email</th><th>Status</th><th className="text-end">Actions</th></tr></thead>
              <tbody>
                {filteredData.map(rider => (
                  <tr key={rider._id}>
                    <td className="fw-medium">{rider.name}</td>
                    <td className="text-muted">{rider.phone}</td>
                    <td className="text-muted">{rider.email}</td>
                    <td><Badge bg={rider.status === 'Active' ? 'success' : 'danger'}>{rider.status}</Badge></td>
                    <td className="text-end">
                      <Button variant="outline-info" size="sm" className="me-1" onClick={() => handleViewStats(rider._id)}><Icon icon="lucide:bar-chart-2" width={14} /></Button>
                      <Button variant="light" size="sm" onClick={() => handleOpenModal(rider)}><Icon icon="lucide:edit" width={14} /></Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </Table>
          )}
        </Card.Body>
      </Card>

      <Modal show={showModal} onHide={() => setShowModal(false)} centered>
        <Modal.Header closeButton><Modal.Title>{editMode ? 'Edit Rider' : 'Add Rider'}</Modal.Title></Modal.Header>
        <Modal.Body>
          <Form.Group className="mb-3"><Form.Label>Full Name <span className="text-danger">*</span></Form.Label><Form.Control value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} /></Form.Group>
          <div className="row g-3 mb-3">
            <div className="col-md-6"><Form.Label>Phone <span className="text-danger">*</span></Form.Label><Form.Control value={formData.phone} onChange={(e) => setFormData({ ...formData, phone: e.target.value })} /></div>
            <div className="col-md-6"><Form.Label>Email <span className="text-danger">*</span></Form.Label><Form.Control type="email" value={formData.email} onChange={(e) => setFormData({ ...formData, email: e.target.value })} /></div>
          </div>
          <div className="row g-3 mb-3">
            <div className="col-md-6"><Form.Label>Password {editMode && <span className="text-muted small">(Leave blank to keep)</span>}</Form.Label><Form.Control type="password" value={formData.password} onChange={(e) => setFormData({ ...formData, password: e.target.value })} /></div>
            <div className="col-md-6"><Form.Label>Status</Form.Label><Form.Select value={formData.status} onChange={(e) => setFormData({ ...formData, status: e.target.value })}><option value="Active">Active</option><option value="Inactive">Inactive</option></Form.Select></div>
          </div>
        </Modal.Body>
        <Modal.Footer><Button variant="secondary" size="sm" onClick={() => setShowModal(false)}>Cancel</Button><Button variant="primary" size="sm" onClick={handleSave}>Save</Button></Modal.Footer>
      </Modal>

      <Modal show={statsModal} onHide={() => setStatsModal(false)} centered>
        <Modal.Header closeButton><Modal.Title>Rider Statistics</Modal.Title></Modal.Header>
        <Modal.Body>
          {selectedStats ? (
            <div className="row text-center g-3">
              {[
                { label: 'Assigned', value: selectedStats.assignedOrders, color: 'primary' },
                { label: 'Delivered', value: selectedStats.completedOrders, color: 'success' },
                { label: 'Cancelled', value: selectedStats.cancelledOrders, color: 'danger' },
              ].map((s, i) => (
                <div className="col-4" key={i}><Card className="bg-light border-0"><Card.Body><h3 className={`mb-1 text-${s.color}`}>{s.value}</h3><span className="text-muted small">{s.label}</span></Card.Body></Card></div>
              ))}
            </div>
          ) : <div className="text-center p-3"><div className="spinner-border text-primary"></div></div>}
        </Modal.Body>
      </Modal>
    </div>
  );
}
