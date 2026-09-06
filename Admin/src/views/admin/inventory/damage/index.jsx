import React, { useState, useEffect } from 'react';
import { Card, Form, Button, Row, Col, Alert, Table, Badge } from 'react-bootstrap';
import { Link } from 'react-router';
import { Flame, CheckCircle, ClipboardList, AlertTriangle } from 'lucide-react';
import api from '@/utils/api';
import { toast } from 'react-hot-toast';
import PageHeader from '@/components/common/PageHeader';
import InventoryStatCards from '@/components/inventory/InventoryStatCards';

export default function DamageWastage() {
  const [products, setProducts] = useState([]);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [batches, setBatches] = useState([]);
  const [formData, setFormData] = useState({
    productId: '',
    batchId: '',
    quantity: '',
    reason: 'Damaged in transit / handling',
    note: ''
  });
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');

  useEffect(() => {
    loadProducts();
  }, []);

  const loadProducts = async () => {
    try {
      const res = await api.get('/products?limit=150');
      setProducts(res.data?.data || res.data || []);
    } catch (e) {
      console.error(e);
    }
  };

  const handleProductChange = async (e) => {
    const pId = e.target.value;
    const prod = products.find(p => p._id === pId) || null;
    setSelectedProduct(prod);
    setFormData(prev => ({ ...prev, productId: pId, batchId: '', quantity: '' }));

    if (!pId) return setBatches([]);
    try {
      const res = await api.get(`/products/${pId}/batches`);
      setBatches(res.data || []);
      if (res.data?.length > 0) {
        setFormData(prev => ({ ...prev, batchId: res.data[0]._id }));
      }
    } catch (e) {
      console.error(e);
    }
  };

  const selectedBatch = batches.find(b => b._id === formData.batchId) || null;
  const availableStock = selectedBatch ? selectedBatch.stock : (selectedProduct?.stock || 0);

  const handleSubmit = async (e) => {
    e.preventDefault();
    const qty = Number(formData.quantity);
    if (!formData.productId) { toast.error('Select a product'); return; }
    if (!qty || qty <= 0) { toast.error('Enter a valid quantity to write off'); return; }
    if (qty > availableStock) { toast.error(`Cannot write off ${qty} units. Only ${availableStock} available in this batch.`); return; }

    setLoading(true);
    setMessage('');
    try {
      await api.post('/inventory/damage', {
        productId: formData.productId,
        batchId: formData.batchId || undefined,
        quantity: qty,
        reason: formData.reason,
        note: formData.note
      });

      setMessage(`Successfully wrote off ${qty} ${selectedProduct?.baseUnit || 'units'} as ${formData.reason}.`);
      toast.success('Damage write-off recorded');
      
      setFormData({ productId: '', batchId: '', quantity: '', reason: 'Damaged in transit / handling', note: '' });
      setSelectedProduct(null);
      loadProducts();
    } catch (err) {
      toast.error(err.response?.data?.message || err.message || 'Failed to record damage');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="report-page">
      <div className="report-header mb-4">
        <div className="report-header-left">
          <h3 className="report-title mb-1">Damaged Goods & Wastage Write-Off</h3>
          <p className="text-muted font-size-14 mb-0">Record expired goods, transit damage, spillage, and stock write-offs.</p>
        </div>
        <div className="report-header-right d-flex gap-3 align-items-center">
          <Button as={Link} to="/inventory/logs" variant="outline-secondary" className="d-inline-flex align-items-center gap-2">
            <ClipboardList size={16} /> View Logs
          </Button>
        </div>
      </div>

      <InventoryStatCards />

      {message && (
        <Alert variant="success" className="d-flex align-items-center gap-2 mt-3">
          <CheckCircle size={18} />
          <span>{message}</span>
        </Alert>
      )}

      <Card className="report-section-card border-0 mt-3 shadow-sm">
        <Card.Header className="bg-transparent border-bottom border-secondary-subtle pt-4 pb-3 px-4">
          <div className="d-flex align-items-center gap-2">
            <Flame size={20} className="text-danger" />
            <h5 className="mb-0 fw-bold">Record Damage / Wastage</h5>
          </div>
        </Card.Header>
        <Card.Body className="p-4">
          <Form onSubmit={handleSubmit}>
            <Row className="g-4">
              <Col md={6}>
                <Form.Group>
                  <Form.Label className="fw-medium">Select Product *</Form.Label>
                  <Form.Select value={formData.productId} onChange={handleProductChange} required className="py-2">
                    <option value="">Choose product...</option>
                    {products.map(p => (
                      <option key={p._id} value={p._id}>
                        {p.name} (Stock: {p.stock} {p.baseUnit || 'PCS'})
                      </option>
                    ))}
                  </Form.Select>
                </Form.Group>
              </Col>

              <Col md={6}>
                <Form.Group>
                  <Form.Label className="fw-medium">Select Batch</Form.Label>
                  <Form.Select 
                    value={formData.batchId} 
                    onChange={e => setFormData({ ...formData, batchId: e.target.value })} 
                    disabled={batches.length === 0}
                    className="py-2"
                  >
                    <option value="">{batches.length === 0 ? 'All Batches' : 'Select Batch...'}</option>
                    {batches.map(b => (
                      <option key={b._id} value={b._id}>
                        {b.batchNumber} (Stock: {b.stock} {b.unit || selectedProduct?.baseUnit || 'PCS'})
                      </option>
                    ))}
                  </Form.Select>
                </Form.Group>
              </Col>

              <Col md={6}>
                <Form.Group>
                  <Form.Label className="fw-medium">Quantity to Write Off *</Form.Label>
                  <Form.Control 
                    type="number" 
                    step="0.001" 
                    value={formData.quantity} 
                    onChange={e => setFormData({ ...formData, quantity: e.target.value })} 
                    placeholder="e.g. 2 or 0.5" 
                    required 
                    className="py-2"
                  />
                  {selectedProduct && (
                    <Form.Text className="text-muted font-size-11">
                      Available to write off: <strong>{availableStock} {selectedProduct.baseUnit || 'units'}</strong>
                    </Form.Text>
                  )}
                </Form.Group>
              </Col>

              <Col md={6}>
                <Form.Group>
                  <Form.Label className="fw-medium">Damage / Wastage Type *</Form.Label>
                  <Form.Select 
                    value={formData.reason} 
                    onChange={e => setFormData({ ...formData, reason: e.target.value })} 
                    required 
                    className="py-2"
                  >
                    <option value="Damaged in transit / handling">Damaged in transit / handling</option>
                    <option value="Expired in warehouse">Expired in warehouse</option>
                    <option value="Packaging torn or leaking">Packaging torn or leaking</option>
                    <option value="Spoiled / pest infestation">Spoiled / pest infestation</option>
                    <option value="Customer sample / display write-off">Customer sample / display write-off</option>
                    <option value="Other Damage">Other</option>
                  </Form.Select>
                </Form.Group>
              </Col>

              <Col md={12}>
                <Form.Group>
                  <Form.Label className="fw-medium">Notes & Incident Description</Form.Label>
                  <Form.Control 
                    as="textarea" 
                    rows={2} 
                    value={formData.note} 
                    onChange={e => setFormData({ ...formData, note: e.target.value })} 
                    placeholder="Details about the damage, carrier reference, disposal notes..." 
                  />
                </Form.Group>
              </Col>
            </Row>

            <div className="d-flex justify-content-end gap-2 mt-4 pt-3 border-top">
              <Button variant="outline-secondary" onClick={() => { setSelectedProduct(null); setFormData({ productId: '', batchId: '', quantity: '', reason: 'Damaged in transit / handling', note: '' }); }}>
                Reset
              </Button>
              <Button variant="danger" type="submit" disabled={loading} className="px-4">
                {loading ? 'Recording...' : 'Write Off Stock'}
              </Button>
            </div>
          </Form>
        </Card.Body>
      </Card>
    </div>
  );
}
