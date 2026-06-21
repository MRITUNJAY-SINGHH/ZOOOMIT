import React, { useState, useEffect } from 'react';
import { Card, Form, Button, Row, Col, Alert } from 'react-bootstrap';
import { fetchApi } from '@/utils/api';

export default function StockEntry() {
  const [formData, setFormData] = useState({
    productId: '',
    variantId: '',
    supplierId: '',
    batchNumber: '',
    quantity: '',
    costPrice: '',
    manufacturingDate: '',
    expiryDate: '',
    note: ''
  });

  const [products, setProducts] = useState([]);
  const [variants, setVariants] = useState([]);
  const [suppliers, setSuppliers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');

  useEffect(() => {
    loadProducts();
    loadSuppliers();
  }, []);

  const loadProducts = async () => {
    try {
      const data = await fetchApi('/products');
      setProducts(data);
    } catch (e) { console.error(e); }
  };

  const loadSuppliers = async () => {
    try {
      const data = await fetchApi('/suppliers');
      setSuppliers(data);
    } catch (e) { console.error(e); }
  };

  const handleProductChange = async (e) => {
    const pId = e.target.value;
    setFormData(prev => ({ ...prev, productId: pId, variantId: '' }));
    if (!pId) return setVariants([]);
    try {
      const data = await fetchApi(`/products/${pId}`);
      setVariants(data.variants || []);
    } catch (e) { console.error(e); }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage('');
    try {
      const payload = {
        ...formData,
        quantity: parseInt(formData.quantity),
        costPrice: parseFloat(formData.costPrice)
      };
      // Explicitly allow empty variants by deleting empty string
      if (!payload.variantId) delete payload.variantId;
      
      await fetchApi('/inventory/stock-entry', { method: 'POST', body: JSON.stringify(payload) });
      setMessage('Stock entry added successfully. Batch rules applied.');
      setFormData({
        productId: '', variantId: '', supplierId: '', batchNumber: '', quantity: '', costPrice: '', manufacturingDate: '', expiryDate: '', note: ''
      });
      setVariants([]);
    } catch (err) {
      alert(err.message);
    }
    setLoading(false);
  };

  return (
    <Card>
      <Card.Header><h4>New Stock Entry (Purchase)</h4></Card.Header>
      <Card.Body>
        {message && <Alert variant="success">{message}</Alert>}
        
        <Form onSubmit={handleSubmit}>
          <Row>
            <Col md={6}>
              <Form.Group className="mb-3">
                <Form.Label>Supplier</Form.Label>
                <Form.Select value={formData.supplierId} onChange={e => setFormData({...formData, supplierId: e.target.value})} required>
                  <option value="">Select Supplier</option>
                  {suppliers.map(s => <option key={s._id} value={s._id}>{s.name}</option>)}
                </Form.Select>
              </Form.Group>

              <Form.Group className="mb-3">
                <Form.Label>Product</Form.Label>
                <Form.Select value={formData.productId} onChange={handleProductChange} required>
                  <option value="">Select Product</option>
                  {products.map(p => <option key={p._id} value={p._id}>{p.name} - {p.barcode}</option>)}
                </Form.Select>
              </Form.Group>

              {variants.length > 0 && (
                <Form.Group className="mb-3">
                  <Form.Label>Variant (Optional)</Form.Label>
                  <Form.Select value={formData.variantId} onChange={e => setFormData({...formData, variantId: e.target.value})}>
                    <option value="">No Variant (Base Product)</option>
                    {variants.map(v => <option key={v._id} value={v._id}>{v.name} - {v.sku}</option>)}
                  </Form.Select>
                </Form.Group>
              )}

              <Form.Group className="mb-3">
                <Form.Label>Batch Number</Form.Label>
                <Form.Control type="text" placeholder="Scan or Type Manufacturer Batch" value={formData.batchNumber} onChange={e => setFormData({...formData, batchNumber: e.target.value})} required />
                <Form.Text className="text-muted">If this batch number exists for this product, stock will simply be added to it.</Form.Text>
              </Form.Group>
            </Col>

            <Col md={6}>
              <Row>
                <Col md={6}>
                  <Form.Group className="mb-3">
                    <Form.Label>Quantity</Form.Label>
                    <Form.Control type="number" min="1" value={formData.quantity} onChange={e => setFormData({...formData, quantity: e.target.value})} required />
                  </Form.Group>
                </Col>
                <Col md={6}>
                  <Form.Group className="mb-3">
                    <Form.Label>Total Cost Price</Form.Label>
                    <Form.Control type="number" step="0.01" value={formData.costPrice} onChange={e => setFormData({...formData, costPrice: e.target.value})} required />
                  </Form.Group>
                </Col>
              </Row>

              <Row>
                <Col md={6}>
                  <Form.Group className="mb-3">
                    <Form.Label>Manufacturing Date</Form.Label>
                    <Form.Control type="date" value={formData.manufacturingDate} onChange={e => setFormData({...formData, manufacturingDate: e.target.value})} />
                  </Form.Group>
                </Col>
                <Col md={6}>
                  <Form.Group className="mb-3">
                    <Form.Label>Expiry Date (Required for FIFO)</Form.Label>
                    <Form.Control type="date" value={formData.expiryDate} onChange={e => setFormData({...formData, expiryDate: e.target.value})} required />
                  </Form.Group>
                </Col>
              </Row>

              <Form.Group className="mb-3">
                <Form.Label>Internal Note / Invoice Ref</Form.Label>
                <Form.Control as="textarea" rows={3} value={formData.note} onChange={e => setFormData({...formData, note: e.target.value})} />
              </Form.Group>

              <Button type="submit" variant="primary" size="lg" className="w-100 mt-3" disabled={loading}>
                {loading ? 'Processing...' : 'Add Stock Record'}
              </Button>
            </Col>
          </Row>
        </Form>
      </Card.Body>
    </Card>
  );
}
