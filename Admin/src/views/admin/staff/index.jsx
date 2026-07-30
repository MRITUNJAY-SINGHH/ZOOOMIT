import React, { useEffect, useState } from 'react';
import { Button, Card, Col, Form, Modal, Row, Table } from 'react-bootstrap';
import { Edit, Shield, UserPlus } from 'lucide-react';
import api from '@/utils/api';
import PageHeader from '@/components/common/PageHeader';
import ActionBar from '@/components/common/ActionBar';
import SearchBar from '@/components/common/SearchBar';
import StatusBadge from '@/components/common/StatusBadge';
import SkeletonTable from '@/components/common/SkeletonTable';
import EmptyState from '@/components/common/EmptyState';
import ErrorState from '@/components/common/ErrorState';
import { toast } from 'react-hot-toast';

const permissions = { products: false, inventory: false, orders: false, coupons: false, pos: false, reports: false, payments: false };
const blankStaff = { _id: null, name: '', email: '', phone: '', password: '', role: 'Staff', status: 'Active', permissions };

export default function Staff() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [search, setSearch] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [formData, setFormData] = useState(blankStaff);
  const [saving, setSaving] = useState(false);

  const fetchUsers = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await api.get('/users');
      setUsers((res.data || []).filter((user) => ['Staff', 'Admin'].includes(user.role)));
    } catch (err) {
      setError(err.message);
      toast.error('Failed to load staff');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchUsers(); }, []);

  const openModal = (user = null) => {
    setFormData(user ? { ...user, password: '', permissions: { ...permissions, ...(user.permissions || {}) } } : { ...blankStaff, permissions: { ...permissions } });
    setModalOpen(true);
  };

  const saveStaff = async () => {
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
      toast.success(payload._id ? 'Staff updated' : 'Staff created');
      setModalOpen(false);
      fetchUsers();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to save staff');
    } finally {
      setSaving(false);
    }
  };

  const filtered = users.filter((user) => `${user.name} ${user.email} ${user.phone}`.toLowerCase().includes(search.toLowerCase()));

  return (
    <div>
      <PageHeader title="Staff Management" description="Manage admin users, staff accounts, roles and module permissions." breadcrumbs={[{ label: 'Dashboard', path: '/dashboard' }, { label: 'Staff' }]} />
      <ActionBar
        left={<SearchBar placeholder="Search staff..." value={search} onChange={setSearch} />}
        count={filtered.length}
        onRefresh={fetchUsers}
        onAdd={() => openModal()}
        addLabel="Add Staff"
      />
      <Card>
        <Card.Body>
          {loading ? <SkeletonTable rows={8} columns={6} /> : error ? <ErrorState message={error} onRetry={fetchUsers} /> : filtered.length === 0 ? (
            <EmptyState icon="lucide:user-x" title="No staff found" message="Add staff members and assign permissions." actionLabel="Add Staff" onAction={() => openModal()} />
          ) : (
            <Table responsive hover className="align-middle mb-0">
              <thead><tr><th>Name</th><th>Email</th><th>Phone</th><th>Role</th><th>Status</th><th>Permissions</th><th className="text-end">Actions</th></tr></thead>
              <tbody>
                {filtered.map((staff) => (
                  <tr key={staff._id}>
                    <td className="fw-semibold">{staff.name}</td>
                    <td className="text-muted">{staff.email}</td>
                    <td className="text-muted">{staff.phone || '-'}</td>
                    <td><StatusBadge status={staff.role} variant={staff.role === 'Admin' ? 'warning' : 'info'} /></td>
                    <td><StatusBadge status={staff.status} /></td>
                    <td className="text-muted">{staff.role === 'Admin' ? 'All modules' : Object.entries(staff.permissions || {}).filter(([, value]) => value).map(([key]) => key).join(', ') || '-'}</td>
                    <td className="text-end"><Button variant="light" className="Zooom-icon-btn" onClick={() => openModal(staff)}><Edit size={20} /></Button></td>
                  </tr>
                ))}
              </tbody>
            </Table>
          )}
        </Card.Body>
      </Card>

      <Modal show={modalOpen} onHide={() => setModalOpen(false)} size="lg" centered>
        <Modal.Header closeButton><Modal.Title>{formData._id ? 'Edit Staff' : 'Add Staff'}</Modal.Title></Modal.Header>
        <Modal.Body>
          <Row className="g-3">
            <Col md={6}><Form.Label>Name <span className="text-danger">*</span></Form.Label><Form.Control value={formData.name} onChange={(event) => setFormData({ ...formData, name: event.target.value })} /></Col>
            <Col md={6}><Form.Label>Email <span className="text-danger">*</span></Form.Label><Form.Control type="email" value={formData.email} onChange={(event) => setFormData({ ...formData, email: event.target.value })} /></Col>
            <Col md={4}><Form.Label>Phone <span className="text-danger">*</span></Form.Label><Form.Control value={formData.phone} onChange={(event) => setFormData({ ...formData, phone: event.target.value })} /></Col>
            <Col md={4}><Form.Label>Role</Form.Label><Form.Select value={formData.role} onChange={(event) => setFormData({ ...formData, role: event.target.value })}><option>Staff</option><option>Admin</option></Form.Select></Col>
            <Col md={4}><Form.Label>Status</Form.Label><Form.Select value={formData.status} onChange={(event) => setFormData({ ...formData, status: event.target.value })}><option>Active</option><option>Inactive</option></Form.Select></Col>
            <Col md={12}><Form.Label>Password {formData._id && <span className="text-muted">(leave blank to keep)</span>}</Form.Label><Form.Control type="password" value={formData.password} onChange={(event) => setFormData({ ...formData, password: event.target.value })} /></Col>
          </Row>
          {formData.role !== 'Admin' && (
            <div className="mt-4">
              <h2 className="Zooom-section-title mb-3"><Shield size={20} /> Module Permissions</h2>
              <Row className="g-2">
                {Object.keys(permissions).map((key) => (
                  <Col md={4} key={key}>
                    <Form.Check type="switch" id={`perm-${key}`} label={<span className="text-capitalize">{key}</span>} checked={Boolean(formData.permissions?.[key])} onChange={() => setFormData((prev) => ({ ...prev, permissions: { ...prev.permissions, [key]: !prev.permissions?.[key] } }))} />
                  </Col>
                ))}
              </Row>
            </div>
          )}
        </Modal.Body>
        <Modal.Footer>
          <Button variant="outline-secondary" onClick={() => setModalOpen(false)}>Cancel</Button>
          <Button variant="primary" disabled={saving} onClick={saveStaff}><UserPlus size={20} />{saving ? 'Saving...' : 'Save Staff'}</Button>
        </Modal.Footer>
      </Modal>
    </div>
  );
}

