import React, { useState, useEffect } from 'react';
import { Card, Form, Button, Tabs, Tab, Row, Col, Table } from 'react-bootstrap';
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import { fetchApi } from '@/utils/api';
import { formatCurrency } from '@/utils/format';
import { ArrowLeft } from 'lucide-react';
import PageHeader from '@/components/common/PageHeader';

export default function ProductForm({ productId, onBack, onSave }) {
  const isEdit = !!productId;
  
  const [formData, setFormData] = useState({
    name: '', slug: '', category: '', baseSku: '', barcode: '',
    mrp: 0, costPrice: 0, sellingPrice: 0, stock: 0, lowStockThreshold: 10,
    isActive: true, featuredImage: ''
  });
  
  const [categories, setCategories] = useState([]);
  const [variants, setVariants] = useState([]);
  const [batches, setBatches] = useState([]);
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);

  const editor = useEditor({
    extensions: [StarterKit],
    content: '',
    onUpdate: ({ editor }) => {
      // In a real scenario we save this to a description state
    }
  });

  useEffect(() => {
    loadCategories();
    if (isEdit) loadProduct();
  }, [productId]);

  const loadCategories = async () => {
    try {
      const data = await fetchApi('/categories');
      setCategories(data);
    } catch (e) { console.error(e); }
  };

  const loadProduct = async () => {
    try {
      const res = await fetchApi(`/products/${productId}`);
      setFormData({
        ...res.product,
        category: res.product.category?._id || res.product.category
      });
      setVariants(res.variants || []);
      if (editor) editor.commands.setContent(res.product.description || '');
      
      const batchRes = await fetchApi(`/products/${productId}/batches`);
      setBatches(batchRes);
    } catch (e) { console.error(e); }
  };

  const handleUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setUploading(true);
    try {
      const form = new FormData();
      form.append('image', file);
      
      const token = localStorage.getItem('token');
      const res = await fetch('http://localhost:5000/api/uploads/product-image', {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` },
        body: form
      });
      const data = await res.json();
      if (res.ok) {
        setFormData(prev => ({ ...prev, featuredImage: data.url }));
      } else throw new Error(data.message);
    } catch (err) {
      alert('Upload failed: ' + err.message);
    }
    setUploading(false);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const payload = { ...formData, description: editor ? editor.getHTML() : '' };
      if (isEdit) {
        await fetchApi(`/products/${productId}`, { method: 'PUT', body: JSON.stringify(payload) });
      } else {
        await fetchApi('/products', { method: 'POST', body: JSON.stringify(payload) });
      }
      onSave();
    } catch (err) {
      alert(err.message);
    }
    setLoading(false);
  };

  // Very basic variant creation for demo
  const [newVariant, setNewVariant] = useState({ name: '', sku: '', sellingPrice: '' });
  const handleAddVariant = async () => {
    if (!newVariant.name) return;
    try {
      await fetchApi(`/products/${productId}/variants`, { method: 'POST', body: JSON.stringify(newVariant) });
      setNewVariant({ name: '', sku: '', sellingPrice: '' });
      loadProduct(); // reload variants
    } catch (e) { alert(e.message); }
  };

  return (
    <div>
      <PageHeader 
        title={isEdit ? 'Edit Product' : 'Add Product'} 
        rightContent={
          <Button variant="outline-primary" className="d-flex align-items-center gap-2 shadow-sm px-3 fw-medium" onClick={onBack}>
            <ArrowLeft size={16} /> Back to List
          </Button>
        } 
      />

      <Tabs defaultActiveKey="basic" className="mb-3">
        <Tab eventKey="basic" title="Basic Info">
          <Card>
            <Card.Body>
              <Form onSubmit={handleSubmit}>
                <Row>
                  <Col md={8}>
                    <Form.Group className="mb-3"><Form.Label>Name</Form.Label><Form.Control value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} required /></Form.Group>
                    <Row>
                      <Col md={6}><Form.Group className="mb-3"><Form.Label>Slug</Form.Label><Form.Control value={formData.slug} onChange={e => setFormData({...formData, slug: e.target.value})} required /></Form.Group></Col>
                      <Col md={6}>
                        <Form.Group className="mb-3">
                          <Form.Label>Category</Form.Label>
                          <Form.Select value={formData.category} onChange={e => setFormData({...formData, category: e.target.value})} required>
                            <option value="">Select Category</option>
                            {categories.map(c => <option key={c._id} value={c._id}>{c.name}</option>)}
                          </Form.Select>
                        </Form.Group>
                      </Col>
                    </Row>
                    
                    <Form.Group className="mb-3">
                      <Form.Label>Description</Form.Label>
                      <div className="border p-2" style={{ minHeight: '150px' }}>
                        <EditorContent editor={editor} />
                      </div>
                    </Form.Group>

                    <Row>
                      <Col md={4}><Form.Group className="mb-3"><Form.Label>MRP</Form.Label><Form.Control type="number" value={formData.mrp} onChange={e => setFormData({...formData, mrp: e.target.value})} /></Form.Group></Col>
                      <Col md={4}><Form.Group className="mb-3"><Form.Label>Cost Price</Form.Label><Form.Control type="number" value={formData.costPrice} onChange={e => setFormData({...formData, costPrice: e.target.value})} /></Form.Group></Col>
                      <Col md={4}><Form.Group className="mb-3"><Form.Label>Selling Price</Form.Label><Form.Control type="number" value={formData.sellingPrice} onChange={e => setFormData({...formData, sellingPrice: e.target.value})} required /></Form.Group></Col>
                    </Row>
                  </Col>

                  <Col md={4}>
                    <Card className="mb-3">
                      <Card.Header>Identifiers</Card.Header>
                      <Card.Body>
                        <Form.Group className="mb-3"><Form.Label>Base SKU</Form.Label><Form.Control value={formData.baseSku} onChange={e => setFormData({...formData, baseSku: e.target.value})} /></Form.Group>
                        <Form.Group className="mb-3">
                          <Form.Label>Barcode</Form.Label>
                          <Form.Control placeholder="Scan or Enter Barcode" value={formData.barcode} onChange={e => setFormData({...formData, barcode: e.target.value})} />
                        </Form.Group>
                        <Form.Group className="mb-3"><Form.Label>Low Stock Alert At</Form.Label><Form.Control type="number" value={formData.lowStockThreshold} onChange={e => setFormData({...formData, lowStockThreshold: e.target.value})} /></Form.Group>
                      </Card.Body>
                    </Card>

                    <Card>
                      <Card.Header>Image</Card.Header>
                      <Card.Body>
                        {formData.featuredImage && <img src={formData.featuredImage} alt="Product" className="img-fluid mb-2 rounded" />}
                        <Form.Control type="file" accept="image/*" onChange={handleUpload} disabled={uploading} />
                        {uploading && <small className="text-muted">Uploading to Cloudinary...</small>}
                      </Card.Body>
                    </Card>
                  </Col>
                </Row>
                <div className="mt-3">
                  <Button type="submit" variant="primary" disabled={loading}>{loading ? 'Saving...' : 'Save Product'}</Button>
                </div>
              </Form>
            </Card.Body>
          </Card>
        </Tab>

        <Tab eventKey="variants" title="Variants" disabled={!isEdit}>
          <Card>
            <Card.Body>
              <h5>Add Variant</h5>
              <div className="d-flex gap-2 mb-4">
                <Form.Control placeholder="Variant Name (e.g. Red / Large)" value={newVariant.name} onChange={e => setNewVariant({...newVariant, name: e.target.value})} />
                <Form.Control placeholder="SKU" value={newVariant.sku} onChange={e => setNewVariant({...newVariant, sku: e.target.value})} />
                <Form.Control type="number" placeholder="Override Price" value={newVariant.sellingPrice} onChange={e => setNewVariant({...newVariant, sellingPrice: e.target.value})} />
                <Button onClick={handleAddVariant}>Add</Button>
              </div>
              <Table striped>
                <thead><tr><th>Name</th><th>SKU</th><th>Price</th><th>Stock</th><th>Action</th></tr></thead>
                <tbody>
                  {variants.map(v => (
                    <tr key={v._id}><td>{v.name}</td><td>{v.sku}</td><td>{formatCurrency(v.sellingPrice || formData.sellingPrice)}</td><td>{v.stock}</td><td><Button size="sm" variant="danger">Del</Button></td></tr>
                  ))}
                  {variants.length === 0 && <tr><td colSpan="5" className="text-center">No variants.</td></tr>}
                </tbody>
              </Table>
            </Card.Body>
          </Card>
        </Tab>

        <Tab eventKey="batches" title="Stock Batches" disabled={!isEdit}>
          <Card>
            <Card.Body>
              <p className="text-muted">Batches are created via the Stock Entry module. This is a read-only view.</p>
              <Table striped>
                <thead><tr><th>Batch #</th><th>Supplier</th><th>Stock</th><th>Cost</th><th>Expiry Date</th></tr></thead>
                <tbody>
                  {batches.map(b => (
                    <tr key={b._id}><td>{b.batchNumber}</td><td>{b.supplier?.name}</td><td>{b.stock}</td><td>{formatCurrency(b.costPrice)}</td><td>{b.expiryDate ? new Date(b.expiryDate).toLocaleDateString() : 'N/A'}</td></tr>
                  ))}
                  {batches.length === 0 && <tr><td colSpan="5" className="text-center">No active batches.</td></tr>}
                </tbody>
              </Table>
            </Card.Body>
          </Card>
        </Tab>
      </Tabs>
    </div>
  );
}
