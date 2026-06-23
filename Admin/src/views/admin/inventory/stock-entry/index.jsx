import React, { useState, useEffect } from 'react';
import { Card, Form, Button, Row, Col, Alert } from 'react-bootstrap';
import { Plus, CheckCircle, PackagePlus } from 'lucide-react';
import api from '@/utils/api';
import { toast } from 'react-hot-toast';
import PageHeader from '@/components/common/PageHeader';

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
    <div>
      <PageHeader 
        title="Stock Entry" 
        description="Record new stock purchases and manage batch information securely." 
      />
      
      <Card className="border-0 shadow-sm mt-2">
        <Card.Header className="bg-transparent border-bottom border-light pt-4 pb-3 px-4">
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
                <div className="bg-light rounded-3 p-4 h-100 border border-light">
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
                <div className="bg-light rounded-3 p-4 h-100 border border-light">
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
                          className="form-control-lg font-size-15 text-muted"
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
                          className="form-control-lg font-size-15 text-muted"
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
