import React, { useEffect, useState } from 'react';
import { Button, Card, Col, Form, Modal, Row, Table } from 'react-bootstrap';
import { BarChart3, Edit, Truck } from 'lucide-react';
import api from '@/utils/api';
import PageHeader from '@/components/common/PageHeader';
import ActionBar from '@/components/common/ActionBar';
import SearchBar from '@/components/common/SearchBar';
import StatusBadge from '@/components/common/StatusBadge';
import SkeletonTable from '@/components/common/SkeletonTable';
import EmptyState from '@/components/common/EmptyState';
import ErrorState from '@/components/common/ErrorState';
import StatisticsCard from '@/components/common/StatisticsCard';
import { toast } from 'react-hot-toast';

const blankRider = { _id: null, name: '', email: '', phone: '', password: '', role: 'DeliveryBoy', status: 'Active' };

export default function DeliveryBoys() {
  const [riders, setRiders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [search, setSearch] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [formData, setFormData] = useState(blankRider);
  const [saving, setSaving] = useState(false);
  const [statsModal, setStatsModal] = useState(false);
  const [selectedStats, setSelectedStats] = useState(null);
  const [statsLoading, setStatsLoading] = useState(false);

  const fetchRiders = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await api.get('/users');
      setRiders((res.data || []).filter((user) => user.role === 'DeliveryBoy'));
    } catch (err) {
      setError(err.message);
      toast.error('Failed to load delivery boys');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchRiders(); }, []);

  const openModal = (rider = null) => {
    setFormData(rider ? { ...rider, password: '' } : blankRider);
    setModalOpen(true);
  };

  const saveRider = async () => {
    if (!formData.name || !formData.email || !formData.phone || (!formData._id && !formData.password)) {
      toast.error('Name, email, phone and password are required');
      return;
    }
    setSaving(true);
    try {
      const payload = { ...formData };
      if (payload._id && !payload.password) delete payload.password;
      if (payload._id) await api.put(`/users/${payload._id}`, payload);
      else await api.post('/users', payload);
      toast.success(payload._id ? 'Rider updated' : 'Rider created');
      setModalOpen(false);
      fetchRiders();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to save rider');
    } finally {
      setSaving(false);
    }
  };

  const viewStats = async (id) => {
    setStatsModal(true);
    setStatsLoading(true);
    setSelectedStats(null);
    try {
      const res = await api.get(`/users/${id}/stats`);
      setSelectedStats(res.data);
    } catch (err) {
      toast.error('Failed to load rider stats');
    } finally {
      setStatsLoading(false);
    }
  };

  const filtered = riders.filter((rider) => `${rider.name} ${rider.email} ${rider.phone}`.toLowerCase().includes(search.toLowerCase()));

  return (
    <div>
      <PageHeader title="Delivery Boys" description="Manage delivery partners, assignments and completion performance." breadcrumbs={[{ label: 'Dashboard', path: '/dashboard' }, { label: 'Delivery Boys' }]} />
      <ActionBar
        left={<SearchBar placeholder="Search riders..." value={search} onChange={setSearch} />}
        count={filtered.length}
        onRefresh={fetchRiders}
        onAdd={() => openModal()}
        addLabel="Add Rider"
      />
      <Card>
        <Card.Body>
          {loading ? <SkeletonTable rows={8} columns={5} /> : error ? <ErrorState message={error} onRetry={fetchRiders} /> : filtered.length === 0 ? (
            <EmptyState icon="lucide:truck" title="No delivery boys found" message="Add riders to assign online orders." actionLabel="Add Rider" onAction={() => openModal()} />
          ) : (
            <Table responsive hover className="align-middle mb-0">
              <thead><tr><th>Rider</th><th>Phone</th><th>Email</th><th>Status</th><th className="text-end">Actions</th></tr></thead>
              <tbody>
                {filtered.map((rider) => (
                  <tr key={rider._id}>
                    <td className="fw-semibold">{rider.name}</td>
                    <td className="text-muted">{rider.phone}</td>
                    <td className="text-muted">{rider.email}</td>
                    <td><StatusBadge status={rider.status} /></td>
                    <td className="text-end">
                      <Button variant="light" className="Zooom-icon-btn me-1" onClick={() => viewStats(rider._id)}><BarChart3 size={20} /></Button>
                      <Button variant="light" className="Zooom-icon-btn" onClick={() => openModal(rider)}><Edit size={20} /></Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </Table>
          )}
        </Card.Body>
      </Card>

      <Modal show={modalOpen} onHide={() => setModalOpen(false)} centered>
        <Modal.Header closeButton className="border-0 pb-0">
          <Modal.Title>{formData._id ? 'Edit Rider' : 'Add Rider'}</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Row className="g-3">
            <Col md={12}><Form.Label className="fw-bold">Name <span className="text-danger">*</span></Form.Label><Form.Control value={formData.name} onChange={(event) => setFormData({ ...formData, name: event.target.value })} /></Col>
            <Col md={12}><Form.Label className="fw-bold">Phone <span className="text-danger">*</span></Form.Label><Form.Control value={formData.phone} onChange={(event) => setFormData({ ...formData, phone: event.target.value })} /></Col>
            <Col md={12}><Form.Label className="fw-bold">Email <span className="text-danger">*</span></Form.Label><Form.Control type="email" value={formData.email} onChange={(event) => setFormData({ ...formData, email: event.target.value })} /></Col>
            <Col md={12}><Form.Label className="fw-bold">Password {formData._id && <span className="text-muted">(leave blank to keep)</span>}</Form.Label><Form.Control type="password" value={formData.password} onChange={(event) => setFormData({ ...formData, password: event.target.value })} /></Col>
            <Col md={12}><Form.Label className="fw-bold">Status</Form.Label><Form.Select value={formData.status} onChange={(event) => setFormData({ ...formData, status: event.target.value })}><option>Active</option><option>Inactive</option></Form.Select></Col>
          </Row>
        </Modal.Body>
        <Modal.Footer className="border-0">
          <Button variant="outline-secondary" onClick={() => setModalOpen(false)}>Cancel</Button>
          <Button variant="primary" disabled={saving} onClick={saveRider}><Truck size={20} className="me-2" />{saving ? 'Saving...' : 'Save Rider'}</Button>
        </Modal.Footer>
      </Modal>

      <Modal show={statsModal} onHide={() => setStatsModal(false)} centered>
        <Modal.Header closeButton><Modal.Title>Rider Statistics</Modal.Title></Modal.Header>
        <Modal.Body>
          {statsLoading ? <SkeletonTable rows={3} columns={3} /> : selectedStats ? (
            <Row className="g-3">
              <Col md={4}><StatisticsCard title="Assigned" value={selectedStats.assignedOrders || 0} /></Col>
              <Col md={4}><StatisticsCard title="Delivered" value={selectedStats.completedOrders || 0} variant="success" /></Col>
              <Col md={4}><StatisticsCard title="Cancelled" value={selectedStats.cancelledOrders || 0} variant="danger" /></Col>
            </Row>
          ) : <EmptyState icon="lucide:bar-chart-3" title="No stats available" />}
        </Modal.Body>
      </Modal>
    </div>
  );
}

