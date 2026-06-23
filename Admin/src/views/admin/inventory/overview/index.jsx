import React, { useState, useEffect } from 'react';
import { Card, Table, Badge, Form, InputGroup, Button, Modal, Row, Col, Alert } from 'react-bootstrap';
import { Search, PackageOpen, Plus, CheckCircle } from 'lucide-react';
import { Link } from 'react-router';
import api from '@/utils/api';
import { toast } from 'react-hot-toast';
import PageHeader from '@/components/common/PageHeader';
import SkeletonTable from '@/components/common/SkeletonTable';
import InventoryStatCards from '@/components/inventory/InventoryStatCards';
import { formatCurrency } from '@/utils/format';

function QuickStockModal({ show, onHide, selectedProduct, onSuccess }) {
  const [formData, setFormData] = useState({ quantity: '', costPrice: '', batchNumber: '', note: '' });
  const [loading, setLoading] = useState(false);
  const [suppliers, setSuppliers] = useState([]);
  const [selectedSupplier, setSelectedSupplier] = useState('');
  
  useEffect(() => {
    if (show) {
      api.get('/suppliers').then(res => setSuppliers(res.data?.data || res.data || [])).catch(console.error);
      setFormData({ quantity: '', costPrice: '', batchNumber: '', note: '' });
      setSelectedSupplier('');
    }
  }, [show]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!selectedProduct) return;
    setLoading(true);
    try {
      await api.post('/inventory/stock-entry', {
        productId: selectedProduct._id,
        supplierId: selectedSupplier,
        batchNumber: formData.batchNumber,
        quantity: parseInt(formData.quantity),
        costPrice: parseFloat(formData.costPrice),
        expiryDate: new Date(new Date().setFullYear(new Date().getFullYear() + 1)).toISOString().split('T')[0], // Default 1 year
        note: formData.note
      });
      toast.success(`Stock added to ${selectedProduct.name}`);
      onSuccess();
    } catch (err) {
      toast.error(err.message || 'Failed to add stock');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal show={show} onHide={onHide} centered backdrop="static">
      <Modal.Header closeButton className="border-bottom border-light">
        <Modal.Title className="font-size-16 fw-bold">Quick Add Stock</Modal.Title>
      </Modal.Header>
      <Form onSubmit={handleSubmit}>
        <Modal.Body>
          {selectedProduct && (
            <div className="mb-4 p-3 bg-body-secondary rounded d-flex align-items-center gap-3">
              <div className="bg-white rounded p-2 border">
                <PackageOpen size={24} className="text-primary" />
              </div>
              <div>
                <h6 className="mb-1 fw-bold">{selectedProduct.name}</h6>
                <div className="text-muted font-size-13">Current Stock: <strong className="text-body">{selectedProduct.stock || 0}</strong></div>
              </div>
            </div>
          )}

          <Form.Group className="mb-3">
            <Form.Label className="fw-medium font-size-14">Supplier <span className="text-danger">*</span></Form.Label>
            <Form.Select value={selectedSupplier} onChange={e => setSelectedSupplier(e.target.value)} required>
              <option value="">Select Supplier</option>
              {suppliers.map(s => <option key={s._id} value={s._id}>{s.name}</option>)}
            </Form.Select>
          </Form.Group>

          <Form.Group className="mb-3">
            <Form.Label className="fw-medium font-size-14">Batch Number <span className="text-danger">*</span></Form.Label>
            <Form.Control 
              placeholder="e.g. BATCH-001" 
              value={formData.batchNumber} 
              onChange={e => setFormData({ ...formData, batchNumber: e.target.value })} 
              required 
            />
          </Form.Group>

          <Row className="g-3 mb-3">
            <Col xs={6}>
              <Form.Group>
                <Form.Label className="fw-medium font-size-14">Quantity <span className="text-danger">*</span></Form.Label>
                <Form.Control 
                  type="number" min="1" 
                  value={formData.quantity} 
                  onChange={e => setFormData({ ...formData, quantity: e.target.value })} 
                  required 
                />
              </Form.Group>
            </Col>
            <Col xs={6}>
              <Form.Group>
                <Form.Label className="fw-medium font-size-14">Total Cost <span className="text-danger">*</span></Form.Label>
                <Form.Control 
                  type="number" min="0" step="0.01" 
                  value={formData.costPrice} 
                  onChange={e => setFormData({ ...formData, costPrice: e.target.value })} 
                  required 
                />
              </Form.Group>
            </Col>
          </Row>
        </Modal.Body>
        <Modal.Footer className="border-top border-light">
          <Button variant="light" onClick={onHide} disabled={loading}>Cancel</Button>
          <Button variant="primary" type="submit" disabled={loading} className="d-flex align-items-center gap-2">
            {loading ? <span className="spinner-border spinner-border-sm" /> : <Plus size={16} />} 
            Add Stock
          </Button>
        </Modal.Footer>
      </Form>
    </Modal>
  );
}

export default function InventoryOverview() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  
  const [showModal, setShowModal] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState(null);

  useEffect(() => { fetchData(); }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const res = await api.get('/products?page=1&limit=20');
      setProducts(res.data?.data || res.data || []);
    } catch (err) { 
      toast.error('Failed to load recent stock'); 
    } finally { 
      setLoading(false); 
    }
  };

  const filteredProducts = products.filter(p => 
    (p.name || '').toLowerCase().includes(search.toLowerCase()) || 
    (p.barcode || '').includes(search)
  );

  const handleOpenModal = (product = null) => {
    if (!product) {
      // If opened via main button, they must select a product in full Stock Entry. Let's redirect to standard page for full form
      window.location.href = '/inventory/stock-entry';
      return;
    }
    setSelectedProduct(product);
    setShowModal(true);
  };

  const handleSuccess = () => {
    setShowModal(false);
    fetchData(); // Refresh list to show new stock
  };

  return (
    <div>
      <PageHeader 
        title="Inventory Overview" 
        description="Summary of your product stock, alerts, and recent inventory movements." 
      />

      <InventoryStatCards />

      {/* Premium Toolbar */}
      <Card className="mb-3 border shadow-sm">
        <Card.Body className="p-3">
          <div className="d-flex flex-column flex-md-row justify-content-between align-items-md-center gap-3">
            <div className="d-flex align-items-center gap-2 flex-wrap flex-md-nowrap">
              <span className="text-muted fw-medium font-size-14 text-uppercase tracking-wider me-2">Recent Stock</span>
              <InputGroup style={{ maxWidth: '280px' }}>
                <InputGroup.Text className="bg-body-secondary border-0 text-muted"><Search size={16} /></InputGroup.Text>
                <Form.Control 
                  placeholder="Search products..." 
                  className="bg-body-secondary border-0 shadow-none" 
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                />
              </InputGroup>
            </div>
            
            <div className="d-flex align-items-center gap-2">
              <Button as={Link} to="/inventory/stock-entry" variant="primary" className="d-flex align-items-center gap-2 shadow-sm fw-medium px-3">
                <PackageOpen size={16} /> Advanced Stock Entry
              </Button>
            </div>
          </div>
        </Card.Body>
      </Card>

      <Card className="border shadow-sm overflow-hidden">
        <Card.Body className="p-0">
          {loading ? (
            <SkeletonTable rows={5} columns={6} />
          ) : (
            <Table responsive hover className="align-middle mb-0 text-nowrap table-borderless table-centered">
              <thead className="bg-body-tertiary border-bottom border-light">
                <tr className="text-body text-uppercase font-size-13 fw-semibold tracking-wider">
                  <th className="ps-4 py-3">Product Name</th>
                  <th className="py-3">Category</th>
                  <th className="py-3">Barcode / SKU</th>
                  <th className="text-end py-3">Current Stock</th>
                  <th className="text-end py-3">Selling Price</th>
                  <th className="text-end pe-4 py-3">Action</th>
                </tr>
              </thead>
              <tbody>
                {filteredProducts.length > 0 ? (
                  filteredProducts.map(p => (
                    <tr key={p._id} className="border-bottom border-light">
                      <td className="ps-4">
                        <h6 className="mb-0 fw-bold text-body font-size-15">{p.name}</h6>
                      </td>
                      <td>
                        <span className="text-muted font-size-14">{p.category?.name || '-'}</span>
                      </td>
                      <td>
                        <code className="text-secondary bg-secondary-subtle px-2 py-1 rounded font-size-13">{p.barcode || p.baseSku || '-'}</code>
                      </td>
                      <td className="text-end">
                        <Badge bg={(p.stock || 0) <= (p.lowStockThreshold || 10) ? 'danger-subtle' : 'success-subtle'} text={(p.stock || 0) <= (p.lowStockThreshold || 10) ? 'danger' : 'success'} className="px-2 py-1 font-size-13 fw-semibold border border-light">
                          {p.stock || 0} units
                        </Badge>
                      </td>
                      <td className="text-end">
                        <span className="fw-bold text-success font-size-15">{formatCurrency(p.sellingPrice)}</span>
                      </td>
                      <td className="text-end pe-4">
                        <Button variant="outline-primary" size="sm" className="d-inline-flex align-items-center gap-1 shadow-sm px-2 fw-medium" onClick={() => handleOpenModal(p)}>
                          <Plus size={14} /> Quick Add
                        </Button>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="6" className="text-center py-5 text-muted">
                      No products found.
                    </td>
                  </tr>
                )}
              </tbody>
            </Table>
          )}
        </Card.Body>
      </Card>
      
      <QuickStockModal show={showModal} onHide={() => setShowModal(false)} selectedProduct={selectedProduct} onSuccess={handleSuccess} />
    </div>
  );
}
