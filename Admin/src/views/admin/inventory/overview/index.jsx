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
              <div className="bg-body rounded p-2 border border-secondary-subtle">
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
    <div className="report-page">
      <div className="report-header mb-4">
        <div className="report-header-left">
          <h3 className="report-title mb-1">Inventory Overview</h3>
          <p className="text-muted font-size-14 mb-0">Summary of your product stock, alerts, and recent inventory movements.</p>
        </div>
        <div className="report-header-right d-flex gap-3 align-items-center">
          <Button as={Link} to="/inventory/stock-entry" variant="primary" className="d-inline-flex align-items-center gap-2">
            <PackageOpen size={16} /> Advanced Stock Entry
          </Button>
        </div>
      </div>


      <InventoryStatCards />

      <Card className="report-section-card h-100 mb-4">
        <Card.Header className="d-flex justify-content-between align-items-center pb-0 border-0 pt-3">
          <h5 className="mb-0">Recent Stock</h5>
          <div className="d-flex gap-2 align-items-center">
            <div className="report-search-wrap" style={{ width: '250px', position: 'relative' }}>
              <Search size={18} className="search-icon" style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--bs-secondary-color)' }} />
              <input 
                type="text" 
                className="form-control report-search-input" 
                placeholder="Search products..." 
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                style={{ paddingLeft: '38px', backgroundColor: 'rgba(255, 255, 255, 0.03)', border: '1px solid var(--bs-border-color)' }}
              />
            </div>
          </div>
        </Card.Header>
        <div style={{ overflowX: 'auto' }} className="pt-3 pb-2">
          {loading ? (
            <div className="p-3"><SkeletonTable rows={5} columns={6} /></div>
          ) : (
            <Table className="report-table mb-0">
              <thead className="custom-table-thead" style={{ 
                fontSize: '12px', 
                textTransform: 'uppercase', 
                letterSpacing: '0.5px',
                backgroundColor: 'rgba(255, 255, 255, 0.03)'
              }}>
                <tr>
                  <th className="py-2 text-muted border-dashed ps-4">Product Name</th>
                  <th className="py-2 text-muted border-dashed">Category</th>
                  <th className="py-2 text-muted border-dashed">Barcode / SKU</th>
                  <th className="py-2 text-end text-muted border-dashed">Current Stock</th>
                  <th className="py-2 text-end text-muted border-dashed">Selling Price</th>
                  <th className="py-2 text-center text-muted border-dashed pe-4">Action</th>
                </tr>
              </thead>
              <tbody>
                {filteredProducts.length > 0 ? (
                  filteredProducts.map(p => (
                    <tr key={p._id}>
                      <td className="align-middle border-dashed ps-4">
                        <h6 className="mb-0 fw-medium text-body font-size-15">{p.name}</h6>
                      </td>
                      <td className="align-middle border-dashed">
                        <span className="text-muted font-size-14">{p.category?.name || '-'}</span>
                      </td>
                      <td className="align-middle border-dashed">
                        <code className="text-secondary bg-secondary-subtle px-2 py-1 rounded font-size-13">{p.barcode || p.baseSku || '-'}</code>
                      </td>
                      <td className="align-middle border-dashed text-end">
                        <Badge bg={(p.stock || 0) <= (p.lowStockThreshold || 10) ? 'danger-subtle' : 'success-subtle'} text={(p.stock || 0) <= (p.lowStockThreshold || 10) ? 'danger' : 'success'} className="px-2 py-1 font-size-13 fw-semibold border-0">
                          {p.stock || 0} units
                        </Badge>
                      </td>
                      <td className="align-middle border-dashed text-end">
                        <span className="fw-semibold text-body font-size-14">{formatCurrency(p.sellingPrice)}</span>
                      </td>
                      <td className="align-middle border-dashed text-center pe-4">
                        <Button variant="outline-primary" size="sm" className="d-inline-flex align-items-center gap-1 shadow-sm px-2 fw-medium" onClick={() => handleOpenModal(p)}>
                          <Plus size={14} /> Quick Add
                        </Button>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="6" className="text-center py-5 text-muted border-dashed">
                      No products found.
                    </td>
                  </tr>
                )}
              </tbody>
            </Table>
          )}
        </div>
      </Card>
      
      <QuickStockModal show={showModal} onHide={() => setShowModal(false)} selectedProduct={selectedProduct} onSuccess={handleSuccess} />
    </div>
  );
}
