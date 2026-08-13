import React, { useState, useEffect } from 'react';
import { Card, Form, Button, Tabs, Tab, Row, Col, Table, Spinner, Modal } from 'react-bootstrap';
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import { fetchApi } from '@/utils/api';
import { formatCurrency } from '@/utils/format';
import { ArrowLeft, ArrowRight, Trash2, Edit, Plus, Upload, Image, LayoutGrid } from 'lucide-react';
import { toast } from 'react-hot-toast';
import PageHeader from '@/components/common/PageHeader';

export default function ProductForm({ productId, onBack, onSave }) {
  const isEdit = !!productId;
  
  const [formData, setFormData] = useState({
    name: '', slug: '', category: '', baseSku: '', barcode: '',
    mrp: 0, costPrice: 0, sellingPrice: 0, stock: 0, lowStockThreshold: 10,
    isActive: true, featuredImage: '', galleryImages: []
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
      // Handled during submit via editor.getHTML()
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
        category: res.product.category?._id || res.product.category,
        galleryImages: res.product.galleryImages?.length > 0 ? res.product.galleryImages : (res.product.featuredImage ? [res.product.featuredImage] : [])
      });
      setVariants(res.variants || []);
      if (editor) editor.commands.setContent(res.product.description || '');
      
      const batchRes = await fetchApi(`/products/${productId}/batches`);
      setBatches(batchRes);
    } catch (e) { console.error(e); }
  };

  const updateGalleryStateAndSave = async (newGallery) => {
    const newFeatured = newGallery[0] || '';
    
    setFormData(prev => ({
      ...prev,
      galleryImages: newGallery,
      featuredImage: newFeatured
    }));

    if (isEdit) {
      try {
        await fetchApi(`/products/${productId}`, { 
          method: 'PUT', 
          body: JSON.stringify({ galleryImages: newGallery, featuredImage: newFeatured }) 
        });
      } catch (err) {
        toast.error('Failed to auto-save gallery');
      }
    }
  };

  const handleUpload = async (e) => {
    const files = Array.from(e.target.files);
    if (!files.length) return;
    setUploading(true);
    
    const newUrls = [];
    for (const file of files) {
      try {
        const form = new FormData();
        form.append('image', file);
        const token = localStorage.getItem('token');
        const res = await fetch(`${import.meta.env.VITE_API_URL}/uploads/product-image`, {
          method: 'POST',
          headers: { 'Authorization': `Bearer ${token}` },
          body: form
        });
        const data = await res.json();
        if (res.ok) {
          newUrls.push(data.url);
        } else throw new Error(data.message);
      } catch (err) {
        toast.error('Upload failed for one image');
      }
    }
    
    if (newUrls.length > 0) {
      const updatedGallery = [...(formData.galleryImages || []), ...newUrls];
      await updateGalleryStateAndSave(updatedGallery);
      toast.success(`${newUrls.length} images uploaded & saved`);
    }
    setUploading(false);
  };

  const moveImage = (index, direction) => {
    const newGallery = [...(formData.galleryImages || [])];
    if (direction === 'left' && index > 0) {
      [newGallery[index - 1], newGallery[index]] = [newGallery[index], newGallery[index - 1]];
    } else if (direction === 'right' && index < newGallery.length - 1) {
      [newGallery[index + 1], newGallery[index]] = [newGallery[index], newGallery[index + 1]];
    }
    updateGalleryStateAndSave(newGallery);
  };

  const removeImage = async (index) => {
    const urlToDelete = formData.galleryImages[index];
    const newGallery = (formData.galleryImages || []).filter((_, i) => i !== index);
    
    try {
      const token = localStorage.getItem('token');
      await fetch(`${import.meta.env.VITE_API_URL}/uploads/product-image`, {
        method: 'DELETE',
        headers: { 
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ url: urlToDelete })
      });
    } catch (e) {
      console.error('Failed to delete from Cloudinary:', e);
    }

    updateGalleryStateAndSave(newGallery);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const payload = { ...formData, description: editor ? editor.getHTML() : '' };
      if (isEdit) {
        await fetchApi(`/products/${productId}`, { method: 'PUT', body: JSON.stringify(payload) });
        toast.success('Product updated');
      } else {
        await fetchApi('/products', { method: 'POST', body: JSON.stringify(payload) });
        toast.success('Product created');
      }
      onSave();
    } catch (err) {
      toast.error(err.message);
    }
    setLoading(false);
  };

  const [newVariant, setNewVariant] = useState({ name: '', sku: '', sellingPrice: '' });
  const [editingVariantId, setEditingVariantId] = useState(null);

  const handleAddVariant = async () => {
    if (!newVariant.name) { toast.error("Variant name is required"); return; }
    try {
      if (editingVariantId) {
        await fetchApi(`/products/${productId}/variants/${editingVariantId}`, { method: 'PUT', body: JSON.stringify(newVariant) });
        toast.success("Variant updated");
      } else {
        await fetchApi(`/products/${productId}/variants`, { method: 'POST', body: JSON.stringify(newVariant) });
        toast.success("Variant added");
      }
      setNewVariant({ name: '', sku: '', sellingPrice: '' });
      setEditingVariantId(null);
      loadProduct(); 
    } catch (e) { toast.error(e.message); }
  };

  const handleEditVariant = (v) => {
    setNewVariant({ name: v.name, sku: v.sku || '', sellingPrice: v.sellingPrice || '' });
    setEditingVariantId(v._id);
  };

  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [variantToDelete, setVariantToDelete] = useState(null);

  const confirmDelete = async () => {
    if (!variantToDelete) return;
    try {
      await fetchApi(`/products/${productId}/variants/${variantToDelete}`, { method: 'DELETE' });
      toast.success("Variant deleted");
      loadProduct();
    } catch (e) { toast.error(e.message); }
    setShowDeleteModal(false);
    setVariantToDelete(null);
  };

  const handleDeleteClick = (variantId) => {
    setVariantToDelete(variantId);
    setShowDeleteModal(true);
  };

  return (
    <div>
      <PageHeader 
        title={isEdit ? 'Edit Product' : 'Add Product'} 
        rightContent={
          <div className="d-flex gap-2">
            <Button variant="outline-secondary" className="d-flex align-items-center gap-2 shadow-sm px-3 fw-medium bg-body" onClick={onBack}>
              <ArrowLeft size={16} /> Back
            </Button>
            <Button variant="primary" className="shadow-sm px-4 fw-medium" onClick={handleSubmit} disabled={loading}>
              {loading ? 'Saving...' : 'Save Product'}
            </Button>
          </div>
        } 
      />

      <Tabs defaultActiveKey="basic" className="mb-4">
        <Tab eventKey="basic" title="Basic Info">
          <Form onSubmit={handleSubmit}>
            <Row className="g-4">
              <Col xl={8}>
                {/* Basic Details Card */}
                <Card className="border-0 shadow-sm mb-4">
                  <Card.Body className="p-4">
                    <h6 className="fw-bold mb-4">Basic Information</h6>
                    <Form.Group className="mb-4">
                      <Form.Label className="fw-medium text-muted font-size-13 mb-1">Product Name</Form.Label>
                      <Form.Control value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} required className="py-2" />
                    </Form.Group>
                    <Row className="g-4 mb-4">
                      <Col md={6}>
                        <Form.Group>
                          <Form.Label className="fw-medium text-muted font-size-13 mb-1">Slug (URL)</Form.Label>
                          <Form.Control value={formData.slug} onChange={e => setFormData({...formData, slug: e.target.value})} required className="py-2" />
                        </Form.Group>
                      </Col>
                      <Col md={6}>
                        <Form.Group>
                          <Form.Label className="fw-medium text-muted font-size-13 mb-1">Category</Form.Label>
                          <Form.Select value={formData.category} onChange={e => setFormData({...formData, category: e.target.value})} required className="py-2">
                            <option value="">Select Category</option>
                            {categories.map(c => <option key={c._id} value={c._id}>{c.name}</option>)}
                          </Form.Select>
                        </Form.Group>
                      </Col>
                    </Row>
                    
                    <Form.Group>
                      <Form.Label className="fw-medium text-muted font-size-13 mb-1">Description</Form.Label>
                      <div className="form-control p-3 border-secondary-subtle" style={{ minHeight: '200px' }}>
                        <EditorContent editor={editor} />
                      </div>
                    </Form.Group>
                  </Card.Body>
                </Card>

                {/* Pricing Card */}
                <Card className="border-0 shadow-sm mb-4">
                  <Card.Body className="p-4">
                    <h6 className="fw-bold mb-4">Pricing</h6>
                    <Row className="g-4">
                      <Col md={4}>
                        <Form.Group>
                          <Form.Label className="fw-medium text-muted font-size-13 mb-1">MRP</Form.Label>
                          <Form.Control type="number" value={formData.mrp} onChange={e => setFormData({...formData, mrp: e.target.value})} className="py-2" />
                        </Form.Group>
                      </Col>
                      <Col md={4}>
                        <Form.Group>
                          <Form.Label className="fw-medium text-muted font-size-13 mb-1">Cost Price</Form.Label>
                          <Form.Control type="number" value={formData.costPrice} onChange={e => setFormData({...formData, costPrice: e.target.value})} className="py-2" />
                        </Form.Group>
                      </Col>
                      <Col md={4}>
                        <Form.Group>
                          <Form.Label className="fw-medium text-muted font-size-13 mb-1">Selling Price</Form.Label>
                          <Form.Control type="number" value={formData.sellingPrice} onChange={e => setFormData({...formData, sellingPrice: e.target.value})} required className="py-2" />
                        </Form.Group>
                      </Col>
                    </Row>
                  </Card.Body>
                </Card>
              </Col>

              <Col xl={4}>
                {/* Media Gallery */}
                <Card className="border-0 shadow-sm mb-4">
                  <Card.Body className="p-4">
                    <div className="d-flex justify-content-between align-items-center mb-4">
                       <h6 className="fw-bold mb-0">Media Gallery</h6>
                       <input type="file" id="image-upload" multiple accept="image/*" className="d-none" onChange={handleUpload} disabled={uploading} />
                       <label htmlFor="image-upload" className={`btn btn-sm btn-outline-primary d-flex align-items-center gap-1 shadow-sm px-3 ${uploading ? 'disabled' : ''}`} style={{ cursor: 'pointer', borderWidth: '1.5px' }}>
                         {uploading ? <Spinner size="sm" /> : <Upload size={14} />} {uploading ? 'Uploading...' : 'Upload'}
                       </label>
                    </div>
                    
                    <div className="d-flex flex-wrap gap-2">
                      {(formData.galleryImages || []).map((url, idx) => (
                        <div key={idx} className="position-relative border rounded-3 overflow-hidden bg-body-secondary shadow-sm" style={{ width: 'calc(50% - 0.5rem)', aspectRatio: '1/1' }}>
                          <img src={url} alt="Product" className="w-100 h-100" style={{ objectFit: 'cover' }} />
                          {idx === 0 && <span className="position-absolute top-0 start-0 badge bg-primary m-2 font-size-10 shadow-sm">Cover</span>}
                          
                          <div className="position-absolute top-0 end-0 m-2">
                            <Button variant="light" size="sm" className="p-0 rounded bg-body-tertiary text-danger shadow-sm border border-secondary-subtle d-flex align-items-center justify-content-center" style={{ width: '28px', height: '28px' }} onClick={() => removeImage(idx)}>
                              <Trash2 size={14} />
                            </Button>
                          </div>
                          
                          <div className="position-absolute bottom-0 start-0 w-100 d-flex justify-content-between px-2" style={{ backgroundColor: 'rgba(0,0,0,0.85)', paddingBottom: '4px', paddingTop: '4px' }}>
                            <Button variant="light" size="sm" className="p-0 bg-transparent text-white border-0" disabled={idx === 0} onClick={() => moveImage(idx, 'left')}>
                              <ArrowLeft size={14} />
                            </Button>
                            <Button variant="light" size="sm" className="p-0 bg-transparent text-white border-0" disabled={idx === (formData.galleryImages?.length || 0) - 1} onClick={() => moveImage(idx, 'right')}>
                              <ArrowRight size={14} />
                            </Button>
                          </div>
                        </div>
                      ))}
                      {(!formData.galleryImages || formData.galleryImages.length === 0) && (
                        <div className="w-100 text-muted font-size-13 fw-medium d-flex flex-column align-items-center justify-content-center border rounded-3 border-dashed bg-body-tertiary" style={{ height: '160px' }}>
                           <Image size={28} className="mb-2 opacity-50" />
                           No images uploaded
                        </div>
                      )}
                    </div>
                  </Card.Body>
                </Card>

                {/* Identifiers Card */}
                <Card className="border-0 shadow-sm mb-4">
                  <Card.Body className="p-4">
                    <h6 className="fw-bold mb-4">Inventory & Identifiers</h6>
                    <Form.Group className="mb-4">
                      <Form.Label className="fw-medium text-muted font-size-13 mb-1">Base SKU</Form.Label>
                      <Form.Control value={formData.baseSku} onChange={e => setFormData({...formData, baseSku: e.target.value})} className="py-2" />
                    </Form.Group>
                    <Form.Group className="mb-4">
                      <Form.Label className="fw-medium text-muted font-size-13 mb-1">Barcode</Form.Label>
                      <Form.Control placeholder="Scan or Enter Barcode" value={formData.barcode} onChange={e => setFormData({...formData, barcode: e.target.value})} className="py-2" />
                    </Form.Group>
                    <Form.Group>
                      <Form.Label className="fw-medium text-muted font-size-13 mb-1">Low Stock Alert At</Form.Label>
                      <Form.Control type="number" value={formData.lowStockThreshold} onChange={e => setFormData({...formData, lowStockThreshold: e.target.value})} className="py-2" />
                    </Form.Group>
                  </Card.Body>
                </Card>
              </Col>
            </Row>
          </Form>
        </Tab>

        <Tab eventKey="variants" title="Variants" disabled={!isEdit}>
          <Card className="border-0 shadow-sm">
            <Card.Body className="p-4">
              <div className="d-flex justify-content-between align-items-center mb-4">
                <h6 className="fw-bold mb-0">Product Variants</h6>
              </div>
              
              <div className="mb-5">
                <div className="d-flex flex-wrap gap-3 align-items-end">
                  <Form.Group className="flex-grow-1">
                    <Form.Label className="fw-medium text-muted font-size-13 mb-1">Variant Name</Form.Label>
                    <Form.Control size="sm" className="py-2 font-size-14" placeholder="e.g. Red / Large" value={newVariant.name} onChange={e => setNewVariant({...newVariant, name: e.target.value})} />
                  </Form.Group>
                  <Form.Group style={{ width: '160px' }}>
                    <Form.Label className="fw-medium text-muted font-size-13 mb-1">SKU</Form.Label>
                    <Form.Control size="sm" className="py-2 font-size-14" placeholder="SKU" value={newVariant.sku} onChange={e => setNewVariant({...newVariant, sku: e.target.value})} />
                  </Form.Group>
                  <Form.Group style={{ width: '160px' }}>
                    <Form.Label className="fw-medium text-muted font-size-13 mb-1">Override Price</Form.Label>
                    <Form.Control size="sm" className="py-2 font-size-14" type="number" placeholder="Price" value={newVariant.sellingPrice} onChange={e => setNewVariant({...newVariant, sellingPrice: e.target.value})} />
                  </Form.Group>
                  <Button size="sm" variant="primary" className="d-flex align-items-center gap-2 shadow-sm px-3 fw-medium py-2 font-size-14" onClick={handleAddVariant}>
                    {editingVariantId ? <Edit size={16} /> : <Plus size={16} />} 
                    {editingVariantId ? 'Update Variant' : 'Add Variant'}
                  </Button>
                  {editingVariantId && (
                    <Button size="sm" variant="outline-secondary" className="px-3 fw-medium py-2 font-size-14 bg-body" onClick={() => { setEditingVariantId(null); setNewVariant({ name: '', sku: '', sellingPrice: '' }); }}>
                      Cancel
                    </Button>
                  )}
                </div>
              </div>

              <Table responsive hover className="align-middle border text-nowrap rounded overflow-hidden mb-0">
                <thead className="bg-body-secondary text-muted font-size-13 text-uppercase tracking-wider">
                  <tr>
                    <th className="px-4 border-0 py-3">Variant Name</th>
                    <th className="border-0 py-3">SKU</th>
                    <th className="border-0 py-3">Price</th>
                    <th className="border-0 py-3 text-center">Stock</th>
                    <th className="px-4 border-0 py-3 text-end">Actions</th>
                  </tr>
                </thead>
                <tbody className="border-top-0">
                  {variants.map(v => (
                    <tr key={v._id}>
                      <td className="px-4 fw-medium text-body py-3 font-size-15">{v.name}</td>
                      <td className="text-muted font-size-14">{v.sku || '-'}</td>
                      <td className="fw-bold font-size-14">{formatCurrency(v.sellingPrice || formData.sellingPrice)}</td>
                      <td className="text-center"><span className="badge bg-secondary-subtle text-secondary px-3 py-1 font-size-13">{v.stock || 0}</span></td>
                      <td className="px-4 text-end">
                         <Button variant="light" size="sm" className="btn-icon me-2 text-primary bg-primary-subtle border-0 rounded-circle" title="Edit Variant" style={{ width: '36px', height: '36px' }} onClick={() => handleEditVariant(v)}>
                           <Edit size={16} />
                         </Button>
                         <Button variant="light" size="sm" className="btn-icon text-danger bg-danger-subtle border-0 rounded-circle" title="Delete Variant" style={{ width: '36px', height: '36px' }} onClick={() => handleDeleteClick(v._id)}>
                           <Trash2 size={16} />
                         </Button>
                      </td>
                    </tr>
                  ))}
                  {variants.length === 0 && (
                    <tr>
                      <td colSpan="5" className="text-center py-5 text-muted">
                         <div className="d-flex flex-column align-items-center gap-3">
                           <LayoutGrid size={32} className="opacity-50" />
                           <span className="font-size-15 fw-medium">No variants created yet.</span>
                         </div>
                      </td>
                    </tr>
                  )}
                </tbody>
              </Table>
            </Card.Body>
          </Card>
        </Tab>

        <Tab eventKey="batches" title="Stock Batches" disabled={!isEdit}>
          <Card className="border-0 shadow-sm">
            <Card.Body className="p-4">
              <p className="text-muted mb-4 font-size-14">Batches are created via the Stock Entry module. This is a read-only view.</p>
              <Table responsive className="align-middle border text-nowrap rounded overflow-hidden mb-0">
                <thead className="bg-body-secondary text-muted font-size-12 text-uppercase tracking-wider">
                  <tr>
                    <th className="px-4 border-0 py-3">Batch #</th>
                    <th className="border-0 py-3">Supplier</th>
                    <th className="border-0 py-3">Cost</th>
                    <th className="border-0 py-3">Expiry Date</th>
                    <th className="px-4 border-0 py-3 text-end">Stock</th>
                  </tr>
                </thead>
                <tbody className="border-top-0">
                  {batches.map(b => (
                    <tr key={b._id}>
                      <td className="px-4 fw-medium text-body py-3">{b.batchNumber}</td>
                      <td className="text-muted">{b.supplier?.name}</td>
                      <td className="fw-bold">{formatCurrency(b.costPrice)}</td>
                      <td className="text-muted font-size-13">{b.expiryDate ? new Date(b.expiryDate).toLocaleDateString() : 'N/A'}</td>
                      <td className="px-4 text-end"><span className="badge bg-success-subtle text-success px-3 py-1 font-size-12">{b.stock}</span></td>
                    </tr>
                  ))}
                  {batches.length === 0 && (
                    <tr>
                      <td colSpan="5" className="text-center py-5 text-muted font-size-14 fw-medium">No active batches.</td>
                    </tr>
                  )}
                </tbody>
              </Table>
            </Card.Body>
          </Card>
        </Tab>
      </Tabs>

      <Modal show={showDeleteModal} onHide={() => setShowDeleteModal(false)} centered>
        <Modal.Header closeButton className="border-bottom-0 pb-0">
          <Modal.Title className="font-size-16 fw-bold">Delete Variant</Modal.Title>
        </Modal.Header>
        <Modal.Body className="pt-2">
          Are you sure you want to delete this variant? This action cannot be undone.
        </Modal.Body>
        <Modal.Footer className="border-top-0 pt-0">
          <Button variant="light" className="bg-body-secondary border-0" onClick={() => setShowDeleteModal(false)}>
            Cancel
          </Button>
          <Button variant="danger" onClick={confirmDelete}>
            Delete
          </Button>
        </Modal.Footer>
      </Modal>
    </div>
  );
}
