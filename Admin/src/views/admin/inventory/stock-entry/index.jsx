import React, { useState, useEffect } from 'react';
import { Card, Form, Button, Row, Col, Alert } from 'react-bootstrap';
import { Icon } from '@iconify/react';
import api from '@/utils/api';
import { toast } from 'react-hot-toast';
import PageHeader from '@/components/common/PageHeader';

export default function StockEntry() {
  const [formData, setFormData] = useState({ productId: '', variantId: '', supplierId: '', batchNumber: '', quantity: '', costPrice: '', manufacturingDate: '', expiryDate: '', note: '' });
  const [products, setProducts] = useState([]);
  const [variants, setVariants] = useState([]);
  const [suppliers, setSuppliers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');

  useEffect(() => {
    const loadData = async () => {
      try {
        const [prodRes, suppRes] = await Promise.allSettled([api.get('/products'), api.get('/suppliers')]);
        if (prodRes.status === 'fulfilled') setProducts(prodRes.value.data.data || prodRes.value.data || []);
        if (suppRes.status === 'fulfilled') setSuppliers(suppRes.value.data.data || suppRes.value.data || []);
      } catch (e) { console.error(e); }
    };
    loadData();
  }, []);

  const handleProductChange = async (e) => {
    const pId = e.target.value;
    setFormData(prev => ({ ...prev, productId: pId, variantId: '' }));
    if (!pId) return setVariants([]);
    try { const res = await api.get(`/products/${pId}`); setVariants(res.data.variants || []); }
    catch (e) { console.error(e); }
  };

  const handleSubmit = async (e) => {
    e.preventDefault(); setLoading(true); setMessage('');
    try {
      const payload = { ...formData, quantity: parseInt(formData.quantity), costPrice: parseFloat(formData.costPrice) };
      if (!payload.variantId) delete payload.variantId;
      await api.post('/inventory/stock-entry', payload);
      setMessage('Stock entry added successfully. Batch rules applied.');
      toast.success('Stock entry created');
      setFormData({ productId: '', variantId: '', supplierId: '', batchNumber: '', quantity: '', costPrice: '', manufacturingDate: '', expiryDate: '', note: '' });
      setVariants([]);
    } catch (err) { toast.error(err.message || 'Failed to add stock entry'); }
    setLoading(false);
  };

  return (
    <div>
      <PageHeader title="Stock Entry" description="Record new stock purchases and batch information." breadcrumbs={[{ label: 'Dashboard', path: '/dashboard' }, { label: 'Inventory' }, { label: 'Stock Entry' }]} />
      <Card>
        <Card.Body>
          {message && <Alert variant="success" dismissible onClose={() => setMessage('')}><Icon icon="lucide:check-circle" width={16} className="me-2" />{message}</Alert>}
          <Form onSubmit={handleSubmit}>
            <Row className="g-3">
              <Col md={6}>
                <Form.Group className="mb-3"><Form.Label>Supplier <span className="text-danger">*</span></Form.Label>
                  <Form.Select value={formData.supplierId} onChange={e => setFormData({ ...formData, supplierId: e.target.value })} required>
                    <option value="">Select Supplier</option>{suppliers.map(s => <option key={s._id} value={s._id}>{s.name}</option>)}
                  </Form.Select>
                </Form.Group>
                <Form.Group className="mb-3"><Form.Label>Product <span className="text-danger">*</span></Form.Label>
                  <Form.Select value={formData.productId} onChange={handleProductChange} required>
                    <option value="">Select Product</option>{products.map(p => <option key={p._id} value={p._id}>{p.name} — {p.barcode || 'No Barcode'}</option>)}
                  </Form.Select>
                </Form.Group>
                {variants.length > 0 && (
                  <Form.Group className="mb-3"><Form.Label>Variant (Optional)</Form.Label>
                    <Form.Select value={formData.variantId} onChange={e => setFormData({ ...formData, variantId: e.target.value })}>
                      <option value="">No Variant (Base Product)</option>{variants.map(v => <option key={v._id} value={v._id}>{v.name} — {v.sku}</option>)}
                    </Form.Select>
                  </Form.Group>
                )}
                <Form.Group className="mb-3"><Form.Label>Batch Number <span className="text-danger">*</span></Form.Label>
                  <Form.Control placeholder="Scan or type batch number" value={formData.batchNumber} onChange={e => setFormData({ ...formData, batchNumber: e.target.value })} required />
                  <Form.Text className="text-muted">If this batch exists, stock will be added to it.</Form.Text>
                </Form.Group>
              </Col>
              <Col md={6}>
                <Row className="g-3">
                  <Col md={6}><Form.Group className="mb-3"><Form.Label>Quantity <span className="text-danger">*</span></Form.Label><Form.Control type="number" min="1" value={formData.quantity} onChange={e => setFormData({ ...formData, quantity: e.target.value })} required /></Form.Group></Col>
                  <Col md={6}><Form.Group className="mb-3"><Form.Label>Total Cost Price <span className="text-danger">*</span></Form.Label><Form.Control type="number" step="0.01" value={formData.costPrice} onChange={e => setFormData({ ...formData, costPrice: e.target.value })} required /></Form.Group></Col>
                  <Col md={6}><Form.Group className="mb-3"><Form.Label>Manufacturing Date</Form.Label><Form.Control type="date" value={formData.manufacturingDate} onChange={e => setFormData({ ...formData, manufacturingDate: e.target.value })} /></Form.Group></Col>
                  <Col md={6}><Form.Group className="mb-3"><Form.Label>Expiry Date <span className="text-danger">*</span></Form.Label><Form.Control type="date" value={formData.expiryDate} onChange={e => setFormData({ ...formData, expiryDate: e.target.value })} required /></Form.Group></Col>
                </Row>
                <Form.Group className="mb-3"><Form.Label>Internal Note / Invoice Ref</Form.Label><Form.Control as="textarea" rows={3} value={formData.note} onChange={e => setFormData({ ...formData, note: e.target.value })} /></Form.Group>
                <Button type="submit" variant="primary" className="w-100" disabled={loading}>
                  {loading ? <><span className="spinner-border spinner-border-sm me-2"></span>Processing...</> : <><Icon icon="lucide:plus" width={16} className="me-2" />Add Stock Record</>}
                </Button>
              </Col>
            </Row>
          </Form>
        </Card.Body>
      </Card>
    </div>
  );
}
