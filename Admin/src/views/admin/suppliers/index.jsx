import React, { useEffect, useState } from 'react';
import { Button, Card, Col, Form, Modal, Row, Table, Badge, Tabs, Tab } from 'react-bootstrap';
import { Edit, Mail, Phone, Trash2, Building, CreditCard, MapPin, FileText } from 'lucide-react';
import api from '@/utils/api';
import PageHeader from '@/components/common/PageHeader';
import ActionBar from '@/components/common/ActionBar';
import SearchBar from '@/components/common/SearchBar';
import StatusBadge from '@/components/common/StatusBadge';
import SkeletonTable from '@/components/common/SkeletonTable';
import EmptyState from '@/components/common/EmptyState';
import ErrorState from '@/components/common/ErrorState';
import DeleteModal from '@/components/common/DeleteModal';
import PaginationComponent from '@/components/common/PaginationComponent';
import { usePageSize } from '@/hooks/usePageSize';
import { toast } from 'react-hot-toast';

const blankSupplier = { 
  _id: null, 
  name: '', 
  companyName: '', 
  contactPerson: '',
  phone: '', 
  alternatePhone: '',
  email: '', 
  address: '', 
  city: '',
  state: '',
  pincode: '',
  gstNumber: '',
  pan: '',
  supplierCode: '',
  paymentTerms: 'Immediate',
  creditLimit: 0,
  bankDetails: {
    accountName: '',
    accountNumber: '',
    ifscCode: '',
    bankName: '',
    branch: ''
  },
  notes: '',
  status: 'Active' 
};

export default function Suppliers() {
  const [suppliers, setSuppliers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [search, setSearch] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = usePageSize(50);
  const [totalPages, setTotalPages] = useState(1);
  const [totalRecords, setTotalRecords] = useState(0);
  const [modalOpen, setModalOpen] = useState(false);
  const [formData, setFormData] = useState(blankSupplier);
  const [saving, setSaving] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState(null);

  const fetchSuppliers = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await api.get(`/suppliers?page=${currentPage}&limit=${pageSize}&search=${search}`);
      setSuppliers(res.data.data || []);
      setTotalPages(res.data.totalPages || 1);
      setTotalRecords(res.data.total || 0);
    } catch (err) {
      setError(err.message);
      toast.error('Failed to load suppliers');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchSuppliers(); }, [currentPage, pageSize, search]);

  const openModal = (supplier = null) => {
    if (supplier) {
      setFormData({
        ...blankSupplier,
        ...supplier,
        bankDetails: {
          ...blankSupplier.bankDetails,
          ...(supplier.bankDetails || {})
        }
      });
    } else {
      setFormData(blankSupplier);
    }
    setModalOpen(true);
  };

  const saveSupplier = async () => {
    if (!formData.name.trim()) {
      toast.error('Supplier / Contact name is required');
      return;
    }
    if (!formData.phone.trim()) {
      toast.error('Phone number is required');
      return;
    }
    setSaving(true);
    try {
      if (formData._id) await api.put(`/suppliers/${formData._id}`, formData);
      else await api.post('/suppliers', formData);
      toast.success(formData._id ? 'Supplier updated' : 'Supplier created');
      setModalOpen(false);
      fetchSuppliers();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to save supplier');
    } finally {
      setSaving(false);
    }
  };

  const deleteSupplier = async () => {
    if (!deleteTarget) return;
    try {
      await api.delete(`/suppliers/${deleteTarget._id}`);
      toast.success('Supplier deleted');
      setDeleteTarget(null);
      fetchSuppliers();
    } catch (err) {
      toast.error('Failed to delete supplier');
    }
  };

  return (
    <div>
      <PageHeader 
        title="Suppliers & B2B Vendors" 
        description="Manage procurement partners, GSTIN profiles, payment terms and bank details." 
        breadcrumbs={[{ label: 'Dashboard', path: '/dashboard' }, { label: 'Suppliers' }]} 
      />
      <ActionBar
        left={<SearchBar placeholder="Search suppliers by name, company, GST, phone..." value={search} onChange={(value) => { setSearch(value); setCurrentPage(1); }} />}
        count={totalRecords}
        onRefresh={fetchSuppliers}
        onAdd={() => openModal()}
        addLabel="Add Supplier"
      />
      <Card className="border-0 shadow-sm">
        <Card.Body>
          {loading ? <SkeletonTable rows={8} columns={6} /> : error ? <ErrorState message={error} onRetry={fetchSuppliers} /> : suppliers.length === 0 ? (
            <EmptyState icon="lucide:building-2" title="No suppliers found" message="Create suppliers before adding stock entries." actionLabel="Add Supplier" onAction={() => openModal()} />
          ) : (
            <>
              <Table responsive hover className="align-middle mb-0">
                <thead className="bg-light">
                  <tr>
                    <th>Vendor / Company</th>
                    <th>Contact Person</th>
                    <th>Phone & Email</th>
                    <th>GSTIN</th>
                    <th>Payment Terms</th>
                    <th>Status</th>
                    <th className="text-end">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {suppliers.map(s => (
                    <tr key={s._id}>
                      <td>
                        <div className="fw-bold text-body">{s.companyName || s.name}</div>
                        {s.companyName && s.name !== s.companyName && (
                          <small className="text-muted">{s.name}</small>
                        )}
                      </td>
                      <td className="text-muted font-size-13">{s.contactPerson || s.name || '-'}</td>
                      <td>
                        <div className="font-size-13 fw-medium">{s.phone}</div>
                        {s.email && <div className="text-muted font-size-11">{s.email}</div>}
                      </td>
                      <td>
                        {s.gstNumber ? (
                          <code className="fw-bold text-dark font-size-12">{s.gstNumber}</code>
                        ) : (
                          <span className="text-muted font-size-12">Unregistered</span>
                        )}
                      </td>
                      <td>
                        <Badge bg="light" className="text-dark border font-size-11">
                          {s.paymentTerms || 'Immediate'}
                        </Badge>
                      </td>
                      <td><StatusBadge status={s.status} /></td>
                      <td className="text-end">
                        <Button variant="light" size="sm" className="me-1" onClick={() => openModal(s)}><Edit size={14} /></Button>
                        <Button variant="light" size="sm" className="text-danger" onClick={() => setDeleteTarget(s)}><Trash2 size={14} /></Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </Table>
              <div className="pt-3 border-top">
                <PaginationComponent currentPage={currentPage} totalPages={totalPages} totalRecords={totalRecords} onPageChange={setCurrentPage} pageSize={pageSize} onPageSizeChange={setPageSize} />
              </div>
            </>
          )}
        </Card.Body>
      </Card>

      {/* Complete B2B Vendor Modal */}
      <Modal show={modalOpen} onHide={() => setModalOpen(false)} size="lg" centered>
        <Modal.Header closeButton>
          <Modal.Title>{formData._id ? 'Edit Supplier Profile' : 'Add New Supplier Profile'}</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Tabs defaultActiveKey="profile" className="mb-3">
            <Tab eventKey="profile" title="Company & Contact">
              <Row className="g-3">
                <Col md={6}>
                  <Form.Group>
                    <Form.Label className="fw-medium">Supplier / Vendor Name *</Form.Label>
                    <Form.Control value={formData.name} onChange={e => setFormData({ ...formData, name: e.target.value })} placeholder="e.g. Reliance Retail Ventures" required />
                  </Form.Group>
                </Col>
                <Col md={6}>
                  <Form.Group>
                    <Form.Label className="fw-medium">Company Name</Form.Label>
                    <Form.Control value={formData.companyName} onChange={e => setFormData({ ...formData, companyName: e.target.value })} placeholder="Registered company entity" />
                  </Form.Group>
                </Col>
                <Col md={4}>
                  <Form.Group>
                    <Form.Label className="fw-medium">Contact Person</Form.Label>
                    <Form.Control value={formData.contactPerson} onChange={e => setFormData({ ...formData, contactPerson: e.target.value })} placeholder="Representative name" />
                  </Form.Group>
                </Col>
                <Col md={4}>
                  <Form.Group>
                    <Form.Label className="fw-medium">Primary Phone *</Form.Label>
                    <Form.Control value={formData.phone} onChange={e => setFormData({ ...formData, phone: e.target.value })} placeholder="10-digit mobile" required />
                  </Form.Group>
                </Col>
                <Col md={4}>
                  <Form.Group>
                    <Form.Label className="fw-medium">Alternate Phone</Form.Label>
                    <Form.Control value={formData.alternatePhone} onChange={e => setFormData({ ...formData, alternatePhone: e.target.value })} placeholder="Office / landline" />
                  </Form.Group>
                </Col>
                <Col md={6}>
                  <Form.Group>
                    <Form.Label className="fw-medium">Email Address</Form.Label>
                    <Form.Control type="email" value={formData.email} onChange={e => setFormData({ ...formData, email: e.target.value })} placeholder="orders@vendor.example" />
                  </Form.Group>
                </Col>
                <Col md={6}>
                  <Form.Group>
                    <Form.Label className="fw-medium">Supplier Code</Form.Label>
                    <Form.Control value={formData.supplierCode} onChange={e => setFormData({ ...formData, supplierCode: e.target.value })} placeholder="e.g. SUP-001" />
                  </Form.Group>
                </Col>
              </Row>
            </Tab>

            <Tab eventKey="commercial" title="GST & Terms">
              <Row className="g-3">
                <Col md={6}>
                  <Form.Group>
                    <Form.Label className="fw-medium">GSTIN Number</Form.Label>
                    <Form.Control value={formData.gstNumber} onChange={e => setFormData({ ...formData, gstNumber: e.target.value.toUpperCase() })} placeholder="15-digit GSTIN (e.g. 27AAAAA0000A1Z5)" />
                  </Form.Group>
                </Col>
                <Col md={6}>
                  <Form.Group>
                    <Form.Label className="fw-medium">PAN Number</Form.Label>
                    <Form.Control value={formData.pan} onChange={e => setFormData({ ...formData, pan: e.target.value.toUpperCase() })} placeholder="10-character PAN" />
                  </Form.Group>
                </Col>
                <Col md={6}>
                  <Form.Group>
                    <Form.Label className="fw-medium">Payment Terms</Form.Label>
                    <Form.Select value={formData.paymentTerms} onChange={e => setFormData({ ...formData, paymentTerms: e.target.value })}>
                      <option value="Immediate">Immediate / Advance</option>
                      <option value="Net 15">Net 15 Days</option>
                      <option value="Net 30">Net 30 Days</option>
                      <option value="Net 60">Net 60 Days</option>
                    </Form.Select>
                  </Form.Group>
                </Col>
                <Col md={6}>
                  <Form.Group>
                    <Form.Label className="fw-medium">Credit Limit (₹)</Form.Label>
                    <Form.Control type="number" value={formData.creditLimit} onChange={e => setFormData({ ...formData, creditLimit: Number(e.target.value) })} />
                  </Form.Group>
                </Col>
                <Col md={12}>
                  <Form.Group>
                    <Form.Label className="fw-medium">Address & City</Form.Label>
                    <Form.Control as="textarea" rows={2} value={formData.address} onChange={e => setFormData({ ...formData, address: e.target.value })} placeholder="Warehouse or billing address..." />
                  </Form.Group>
                </Col>
              </Row>
            </Tab>

            <Tab eventKey="banking" title="Bank Details & Notes">
              <Row className="g-3">
                <Col md={6}>
                  <Form.Group>
                    <Form.Label className="fw-medium">Account Name</Form.Label>
                    <Form.Control value={formData.bankDetails?.accountName || ''} onChange={e => setFormData({ ...formData, bankDetails: { ...formData.bankDetails, accountName: e.target.value } })} />
                  </Form.Group>
                </Col>
                <Col md={6}>
                  <Form.Group>
                    <Form.Label className="fw-medium">Account Number</Form.Label>
                    <Form.Control value={formData.bankDetails?.accountNumber || ''} onChange={e => setFormData({ ...formData, bankDetails: { ...formData.bankDetails, accountNumber: e.target.value } })} />
                  </Form.Group>
                </Col>
                <Col md={4}>
                  <Form.Group>
                    <Form.Label className="fw-medium">IFSC Code</Form.Label>
                    <Form.Control value={formData.bankDetails?.ifscCode || ''} onChange={e => setFormData({ ...formData, bankDetails: { ...formData.bankDetails, ifscCode: e.target.value.toUpperCase() } })} />
                  </Form.Group>
                </Col>
                <Col md={4}>
                  <Form.Group>
                    <Form.Label className="fw-medium">Bank Name</Form.Label>
                    <Form.Control value={formData.bankDetails?.bankName || ''} onChange={e => setFormData({ ...formData, bankDetails: { ...formData.bankDetails, bankName: e.target.value } })} />
                  </Form.Group>
                </Col>
                <Col md={4}>
                  <Form.Group>
                    <Form.Label className="fw-medium">Branch</Form.Label>
                    <Form.Control value={formData.bankDetails?.branch || ''} onChange={e => setFormData({ ...formData, bankDetails: { ...formData.bankDetails, branch: e.target.value } })} />
                  </Form.Group>
                </Col>
                <Col md={12}>
                  <Form.Group>
                    <Form.Label className="fw-medium">Internal Notes</Form.Label>
                    <Form.Control as="textarea" rows={2} value={formData.notes} onChange={e => setFormData({ ...formData, notes: e.target.value })} placeholder="Vendor notes, special discount terms, delivery lead times..." />
                  </Form.Group>
                </Col>
              </Row>
            </Tab>
          </Tabs>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setModalOpen(false)}>Cancel</Button>
          <Button variant="primary" onClick={saveSupplier} disabled={saving}>{saving ? 'Saving...' : 'Save Supplier'}</Button>
        </Modal.Footer>
      </Modal>

      <DeleteModal show={Boolean(deleteTarget)} itemName={deleteTarget?.name} onCancel={() => setDeleteTarget(null)} onConfirm={deleteSupplier} />
    </div>
  );
}
