import React, { useState, useEffect } from 'react';
import { Card, Form, Button, Row, Col, Alert } from 'react-bootstrap';
import { Link } from 'react-router';
import { Plus, CheckCircle, PackagePlus, ClipboardList } from 'lucide-react';
import api from '@/utils/api';
import { toast } from 'react-hot-toast';
import PageHeader from '@/components/common/PageHeader';
import InventoryStatCards from '@/components/inventory/InventoryStatCards';

export default function StockEntry() {
  const [formData, setFormData] = useState({ 
    productId: '', variantId: '', supplierId: '', batchNumber: '', 
    quantity: '', costPrice: '', manufacturingDate: '', expiryDate: '', note: '' 
  });
  const [products, setProducts] = useState([]);
  const [variants, setVariants] = useState([]);
  const [suppliers, setSuppliers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');

  useEffect(() => {
    const loadData = async () => {
      try {
        const [prodRes, suppRes] = await Promise.allSettled([api.get('/products'), api.get('/suppliers')]);
        if (prodRes.status === 'fulfilled') setProducts(prodRes.value.data?.data || prodRes.value.data || []);
        if (suppRes.status === 'fulfilled') setSuppliers(suppRes.value.data?.data || suppRes.value.data || []);
      } catch (e) { 
        console.error(e); 
      }
    };
    loadData();
  }, []);

  const handleProductChange = async (e) => {
    const pId = e.target.value;
    setFormData(prev => ({ ...prev, productId: pId, variantId: '' }));
    if (!pId) return setVariants([]);
    try { 
      const res = await api.get(`/products/${pId}`); 
      setVariants(res.data?.variants || []); 
    } catch (e) { 
      console.error(e); 
    }
  };

  useEffect(() => {
    const fetchBatches = async () => {
      if (!formData.productId || !formData.supplierId) return;
      try {
        const res = await api.get(`/products/${formData.productId}/batches`);
        const batches = res.data;
        const matchingBatch = batches.find(b => (b.supplier?._id || b.supplier) === formData.supplierId);
        
        if (matchingBatch) {
          let updated = false;
          setFormData(prev => {
            const next = { ...prev };
            if (!next.batchNumber && matchingBatch.batchNumber) { next.batchNumber = matchingBatch.batchNumber; updated = true; }
            if (!next.manufacturingDate && matchingBatch.manufacturingDate) { next.manufacturingDate = matchingBatch.manufacturingDate.substring(0, 10); updated = true; }
            if (!next.expiryDate && matchingBatch.expiryDate) { next.expiryDate = matchingBatch.expiryDate.substring(0, 10); updated = true; }
            return next;
          });
          if (updated) {
            toast.success('Batch info autofilled from existing stock');
          }
        }
      } catch (e) {
        console.error('Failed to fetch batches for autofill', e);
      }
    };
    fetchBatches();
  }, [formData.productId, formData.supplierId]);

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
      if (!payload.variantId) delete payload.variantId;
      
      await api.post('/inventory/stock-entry', payload);
      
      setMessage('Stock entry added successfully. Batch rules applied.');
      toast.success('Stock entry created');
      
      setFormData({ 
        productId: '', variantId: '', supplierId: '', batchNumber: '', 
        quantity: '', costPrice: '', manufacturingDate: '', expiryDate: '', note: '' 
      });
      setVariants([]);
    } catch (err) { 
      toast.error(err.message || 'Failed to add stock entry'); 
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="report-page">
      <div className="report-header mb-4">
        <div className="report-header-left">
          <h3 className="report-title mb-1">Stock Entry</h3>
          <p className="text-muted font-size-14 mb-0">Manually add stock to products and assign batch information.</p>
        </div>
        <div className="report-header-right d-flex gap-3 align-items-center">
          <Button as={Link} to="/inventory/logs" variant="outline-secondary" className="d-inline-flex align-items-center gap-2">
            <ClipboardList size={16} /> View Logs
          </Button>
        </div>
      </div>
      
      <InventoryStatCards />

      <Card className="report-section-card border-0 mt-2">
        <Card.Header className="bg-transparent border-bottom border-secondary-subtle pt-4 pb-3 px-4">
          <h5 className="mb-0 fw-bold d-flex align-items-center gap-2">
            <PackagePlus size={20} className="text-primary" /> New Stock Batch
          </h5>
        </Card.Header>
        <Card.Body className="p-4">
          {message && (
            <Alert variant="success" className="border-0 bg-success-subtle text-success d-flex align-items-center gap-2" dismissible onClose={() => setMessage('')}>
              <CheckCircle size={18} /> {message}
            </Alert>
          )}
          
          <Form onSubmit={handleSubmit}>
            <Row className="g-4">
              <Col md={6}>
                <div className="rounded-3 p-4 h-100 border" style={{ backgroundColor: 'rgba(255, 255, 255, 0.02)', borderColor: 'var(--bs-border-color)' }}>
                  <h6 className="fw-bold mb-4 text-uppercase tracking-wider font-size-13 text-muted">Product Details</h6>
                  
                  <Form.Group className="mb-4">
                    <Form.Label className="fw-medium">Supplier <span className="text-danger">*</span></Form.Label>
                    <Form.Select 
                      className="form-control-lg font-size-15"
                      value={formData.supplierId} 
                      onChange={e => setFormData({ ...formData, supplierId: e.target.value })} 
                      required
                    >
                      <option value="">Select Supplier</option>
                      {suppliers.map(s => <option key={s._id} value={s._id}>{s.name}</option>)}
                    </Form.Select>
                  </Form.Group>
                  
                  <Form.Group className="mb-4">
                    <Form.Label className="fw-medium">Product <span className="text-danger">*</span></Form.Label>
                    <Form.Select 
                      className="form-control-lg font-size-15"
                      value={formData.productId} 
                      onChange={handleProductChange} 
                      required
                    >
                      <option value="">Select Product</option>
                      {products.map(p => <option key={p._id} value={p._id}>{p.name} {p.barcode ? `— Code: ${p.barcode}` : ''}</option>)}
                    </Form.Select>
                  </Form.Group>
                  
                  {variants.length > 0 && (
                    <Form.Group className="mb-4">
                      <Form.Label className="fw-medium">Variant (Optional)</Form.Label>
                      <Form.Select 
                        className="form-control-lg font-size-15"
                        value={formData.variantId} 
                        onChange={e => setFormData({ ...formData, variantId: e.target.value })}
                      >
                        <option value="">No Variant (Base Product)</option>
                        {variants.map(v => <option key={v._id} value={v._id}>{v.name} — {v.sku}</option>)}
                      </Form.Select>
                    </Form.Group>
                  )}
                  
                  <Form.Group className="mb-0">
                    <Form.Label className="fw-medium">Batch Number <span className="text-danger">*</span></Form.Label>
                    <Form.Control 
                      className="form-control-lg font-size-15 font-monospace text-primary fw-medium"
                      placeholder="Scan or type batch number" 
                      value={formData.batchNumber} 
                      onChange={e => setFormData({ ...formData, batchNumber: e.target.value })} 
                      required 
                    />
                    <Form.Text className="text-muted mt-2 d-block">If this batch exists, stock will be added to it automatically.</Form.Text>
                  </Form.Group>
                </div>
              </Col>
              
              <Col md={6}>
                <div className="rounded-3 p-4 h-100 border" style={{ backgroundColor: 'rgba(255, 255, 255, 0.02)', borderColor: 'var(--bs-border-color)' }}>
                  <h6 className="fw-bold mb-4 text-uppercase tracking-wider font-size-13 text-muted">Stock Information</h6>
                  
                  <Row className="g-3 mb-4">
                    <Col md={6}>
                      <Form.Group>
                        <Form.Label className="fw-medium">Quantity Added <span className="text-danger">*</span></Form.Label>
                        <Form.Control 
                          type="number" min="1" 
                          className="form-control-lg font-size-15"
                          value={formData.quantity} 
                          onChange={e => setFormData({ ...formData, quantity: e.target.value })} 
                          required 
                        />
                      </Form.Group>
                    </Col>
                    <Col md={6}>
                      <Form.Group>
                        <Form.Label className="fw-medium">Total Cost Price <span className="text-danger">*</span></Form.Label>
                        <Form.Control 
                          type="number" step="0.01" min="0"
                          className="form-control-lg font-size-15"
                          value={formData.costPrice} 
                          onChange={e => setFormData({ ...formData, costPrice: e.target.value })} 
                          required 
                        />
                      </Form.Group>
                    </Col>
                  </Row>
                  
                  <Row className="g-3 mb-4">
                    <Col md={6}>
                      <Form.Group>
                        <Form.Label className="fw-medium">Manufacturing Date</Form.Label>
                        <Form.Control 
                          type="date" 
                          className="form-control-lg font-size-15 text-body"
                          value={formData.manufacturingDate} 
                          onChange={e => setFormData({ ...formData, manufacturingDate: e.target.value })} 
                        />
                      </Form.Group>
                    </Col>
                    <Col md={6}>
                      <Form.Group>
                        <Form.Label className="fw-medium">Expiry Date <span className="text-danger">*</span></Form.Label>
                        <Form.Control 
                          type="date" 
                          className="form-control-lg font-size-15 text-body"
                          value={formData.expiryDate} 
                          onChange={e => setFormData({ ...formData, expiryDate: e.target.value })} 
                          required 
                        />
                      </Form.Group>
                    </Col>
                  </Row>
                  
                  <Form.Group className="mb-4">
                    <Form.Label className="fw-medium">Internal Note / Invoice Ref</Form.Label>
                    <Form.Control 
                      as="textarea" rows={3} 
                      className="font-size-15"
                      placeholder="Enter any reference numbers or details..."
                      value={formData.note} 
                      onChange={e => setFormData({ ...formData, note: e.target.value })} 
                    />
                  </Form.Group>
                  
                  <Button type="submit" variant="primary" size="lg" className="w-100 fw-bold d-flex align-items-center justify-content-center gap-2 shadow-sm" disabled={loading}>
                    {loading ? (
                      <><span className="spinner-border spinner-border-sm"></span> Processing Entry...</>
                    ) : (
                      <><Plus size={20} /> Record Stock Entry</>
                    )}
                  </Button>
                </div>
              </Col>
            </Row>
          </Form>
        </Card.Body>
      </Card>
    </div>
  );
}
