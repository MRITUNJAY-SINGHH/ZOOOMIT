import React, { useState, useEffect } from 'react';
import { Card, Form, Button, Row, Col, Alert, Table, Badge } from 'react-bootstrap';
import { Link } from 'react-router';
import { SlidersHorizontal, CheckCircle, ClipboardList, RefreshCw, AlertCircle } from 'lucide-react';
import api from '@/utils/api';
import { toast } from 'react-hot-toast';
import PageHeader from '@/components/common/PageHeader';
import InventoryStatCards from '@/components/inventory/InventoryStatCards';

export default function StockAdjustment() {
  const [products, setProducts] = useState([]);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [batches, setBatches] = useState([]);
  const [formData, setFormData] = useState({
    productId: '',
    batchId: '',
    newPhysicalStock: '',
    reason: 'Periodic Physical Audit'
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
    setFormData(prev => ({ ...prev, productId: pId, batchId: '', newPhysicalStock: '' }));

    if (!pId) return setBatches([]);
    try {
      const res = await api.get(`/products/${pId}/batches`);
      setBatches(res.data || []);
      if (res.data?.length > 0) {
        setFormData(prev => ({ 
          ...prev, 
          batchId: res.data[0]._id, 
          newPhysicalStock: res.data[0].stock 
        }));
      }
    } catch (e) {
      console.error(e);
    }
  };

  const selectedBatch = batches.find(b => b._id === formData.batchId) || null;
  const currentStock = selectedBatch ? selectedBatch.stock : (selectedProduct?.stock || 0);
  const targetStock = formData.newPhysicalStock !== '' ? Number(formData.newPhysicalStock) : currentStock;
  const variance = targetStock - currentStock;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.productId) { toast.error('Select a product'); return; }
    if (isNaN(targetStock) || targetStock < 0) { toast.error('Enter a valid physical stock'); return; }

    setLoading(true);
    setMessage('');
    try {
      const res = await api.post('/inventory/adjustment', {
        productId: formData.productId,
        batchId: formData.batchId || undefined,
        newPhysicalStock: targetStock,
        reason: formData.reason
      });

      setMessage(`Stock adjusted. Discrepancy logged: ${variance >= 0 ? `+${variance}` : variance} ${selectedProduct?.baseUnit || 'units'}.`);
      toast.success('Physical stock adjustment recorded');
      
      // Refresh
      handleProductChange({ target: { value: formData.productId } });
      loadProducts();
    } catch (err) {
      toast.error(err.response?.data?.message || err.message || 'Failed to adjust stock');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="report-page">
      <div className="report-header mb-4">
        <div className="report-header-left">
          <h3 className="report-title mb-1">Stock Adjustment & Audit</h3>
          <p className="text-muted font-size-14 mb-0">Reconcile physical warehouse stock counts with system records.</p>
        </div>
        <div className="report-header-right d-flex gap-3 align-items-center">
          <Button as={Link} to="/inventory/logs" variant="outline-secondary" className="d-inline-flex align-items-center gap-2">
            <ClipboardList size={16} /> View Audit Logs
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
            <SlidersHorizontal size={20} className="text-primary" />
            <h5 className="mb-0 fw-bold">Stock Reconciliation Form</h5>
          </div>
        </Card.Header>
        <Card.Body className="p-4">
          <Form onSubmit={handleSubmit}>
            <Row className="g-4">
              <Col md={6}>
                <Form.Group>
                  <Form.Label className="fw-medium">Select Product *</Form.Label>
                  <Form.Select value={formData.productId} onChange={handleProductChange} required className="py-2">
                    <option value="">Choose product to reconcile...</option>
                    {products.map(p => (
                      <option key={p._id} value={p._id}>
                        {p.name} ({p.baseSku || p.barcode || 'No SKU'}) - Current: {p.stock} {p.baseUnit || 'PCS'}
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
                    onChange={e => {
                      const bId = e.target.value;
                      const b = batches.find(x => x._id === bId);
                      setFormData(prev => ({ 
                        ...prev, 
                        batchId: bId, 
                        newPhysicalStock: b ? b.stock : prev.newPhysicalStock 
                      }));
                    }} 
                    disabled={batches.length === 0}
                    className="py-2"
                  >
                    <option value="">{batches.length === 0 ? 'All / Single Batch' : 'Select Batch...'}</option>
                    {batches.map(b => (
                      <option key={b._id} value={b._id}>
                        {b.batchNumber} (Stock: {b.stock} {b.unit || selectedProduct?.baseUnit || 'PCS'})
                      </option>
                    ))}
                  </Form.Select>
                </Form.Group>
              </Col>

              {selectedProduct && (
                <Col md={12}>
                  <div className="p-3 bg-body-tertiary rounded border d-flex flex-wrap justify-content-between align-items-center gap-3">
                    <div>
                      <div className="text-muted font-size-12">Current System Stock</div>
                      <div className="fw-bold fs-5 text-body">{currentStock} {selectedProduct.baseUnit || 'PCS'}</div>
                    </div>
                    <div>
                      <div className="text-muted font-size-12">New Counted Stock</div>
                      <div className="fw-bold fs-5 text-primary">{targetStock} {selectedProduct.baseUnit || 'PCS'}</div>
                    </div>
                    <div className="border-start ps-4">
                      <div className="text-muted font-size-12">Calculated Variance</div>
                      <div className={`fw-bold fs-5 ${variance > 0 ? 'text-success' : variance < 0 ? 'text-danger' : 'text-muted'}`}>
                        {variance > 0 ? `+${variance}` : variance} {selectedProduct.baseUnit || 'PCS'}
                      </div>
                    </div>
                  </div>
                </Col>
              )}

              <Col md={6}>
                <Form.Group>
                  <Form.Label className="fw-medium">Actual Counted Physical Stock *</Form.Label>
                  <Form.Control 
                    type="number" 
                    step="0.001" 
                    value={formData.newPhysicalStock} 
                    onChange={e => setFormData({ ...formData, newPhysicalStock: e.target.value })} 
                    placeholder="Enter physical count" 
                    required 
                    className="py-2"
                  />
                  <Form.Text className="text-muted font-size-11">
                    Enter the exact verified physical count in {selectedProduct?.baseUnit || 'units'}.
                  </Form.Text>
                </Form.Group>
              </Col>

              <Col md={6}>
                <Form.Group>
                  <Form.Label className="fw-medium">Adjustment Reason *</Form.Label>
                  <Form.Select 
                    value={formData.reason} 
                    onChange={e => setFormData({ ...formData, reason: e.target.value })} 
                    required 
                    className="py-2"
                  >
                    <option value="Periodic Physical Audit">Periodic Physical Audit</option>
                    <option value="Stock Discrepancy Found">Stock Discrepancy Found</option>
                    <option value="Spillage / Weight Loss in Storage">Spillage / Weight Loss in Storage</option>
                    <option value="Supplier Over-delivery Inward Correction">Supplier Over-delivery Correction</option>
                    <option value="Opening Stock Correction">Opening Stock Correction</option>
                    <option value="Other Audit Adjustment">Other</option>
                  </Form.Select>
                </Form.Group>
              </Col>
            </Row>

            <div className="d-flex justify-content-end gap-2 mt-4 pt-3 border-top">
              <Button variant="outline-secondary" onClick={() => { setSelectedProduct(null); setFormData({ productId: '', batchId: '', newPhysicalStock: '', reason: 'Periodic Physical Audit' }); }}>
                Reset
              </Button>
              <Button variant="primary" type="submit" disabled={loading} className="px-4">
                {loading ? 'Reconciling...' : 'Apply Physical Stock Adjustment'}
              </Button>
            </div>
          </Form>
        </Card.Body>
      </Card>
    </div>
  );
}
