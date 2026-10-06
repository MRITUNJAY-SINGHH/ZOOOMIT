import React, { useState, useEffect } from 'react';
import { Card, Form, Button, Tabs, Tab, Row, Col, Table, Spinner, Modal, Badge } from 'react-bootstrap';
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import { fetchApi } from '@/utils/api';
import { formatCurrency } from '@/utils/format';
import { ArrowLeft, ArrowRight, Trash2, Edit, Plus, Upload, Image, LayoutGrid, AlertCircle, ShieldCheck, Scale } from 'lucide-react';
import { toast } from 'react-hot-toast';
import PageHeader from '@/components/common/PageHeader';

export default function ProductForm({ productId, onBack, onSave }) {
  const isEdit = !!productId;
  
  const [formData, setFormData] = useState({
    name: '', 
    slug: '', 
    brand: '',
    category: '', 
    subcategory: '',
    baseSku: '', 
    barcode: '',
    mrp: '', 
    costPrice: '', 
    sellingPrice: '', 
    stock: 0, 
    lowStockThreshold: 10,
    
    productType: 'PIECE',
    baseUnit: 'PCS',
    purchaseUnit: 'PCS',
    purchaseToStockFactor: 1,
    sellingUnit: 'PCS',
    preferredSupplier: '',
    
    minSaleQty: 1,
    maxSaleQty: 100,
    qtyStep: 1,
    
    taxRate: 0,
    hsnCode: '',
    
    hasExpiryTracking: false,
    isFeatured: false,
    isActive: true, 
    needsReview: false,
    featuredImage: '', 
    galleryImages: [],
    
    // Professional Product Management Fields
    shortDescription: '',
    tags: '',
    seoTitle: '',
    seoDescription: '',
    isBestseller: false,
    dietaryPreference: '',
    shelfLife: '',
    storageInstructions: '',
    nutritionInfo: '',
    countryOfOrigin: '',
    relatedProducts: ''
  });
  
  const [categories, setCategories] = useState([]);
  const [subcategories, setSubcategories] = useState([]);
  const [suppliers, setSuppliers] = useState([]);
  const [variants, setVariants] = useState([]);
  const [batches, setBatches] = useState([]);
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);

  const editor = useEditor({
    extensions: [StarterKit],
    content: '',
    onUpdate: ({ editor }) => {}
  });

  useEffect(() => {
    loadCategories();
    loadSuppliers();
    if (isEdit) loadProduct();
  }, [productId]);

  const loadCategories = async () => {
    try {
      const data = await fetchApi('/categories');
      setCategories(data || []);
    } catch (e) { console.error(e); }
  };

  const loadSuppliers = async () => {
    try {
      const res = await fetchApi('/suppliers?limit=150');
      setSuppliers(res.data || res || []);
    } catch (e) { console.error(e); }
  };

  // Update subcategories when category changes
  useEffect(() => {
    if (formData.category && categories.length > 0) {
      const subs = categories.filter(c => c.parentCategory && (c.parentCategory._id === formData.category || c.parentCategory === formData.category));
      setSubcategories(subs);
    } else {
      setSubcategories([]);
    }
  }, [formData.category, categories]);

  const loadProduct = async () => {
    try {
      const res = await fetchApi(`/products/${productId}`);
      const prod = res.product;
      setFormData({
        ...prod,
        category: prod.category?._id || prod.category || '',
        subcategory: prod.subcategory?._id || prod.subcategory || '',
        preferredSupplier: prod.preferredSupplier?._id || prod.preferredSupplier || '',
        mrp: prod.mrp ?? '',
        costPrice: prod.costPrice ?? '',
        sellingPrice: prod.sellingPrice ?? '',
        productType: prod.productType || 'PIECE',
        baseUnit: prod.baseUnit || 'PCS',
        purchaseUnit: prod.purchaseUnit || prod.baseUnit || 'PCS',
        purchaseToStockFactor: prod.purchaseToStockFactor || 1,
        sellingUnit: prod.sellingUnit || prod.baseUnit || 'PCS',
        minSaleQty: prod.minSaleQty || 1,
        maxSaleQty: prod.maxSaleQty || 100,
        qtyStep: prod.qtyStep || 1,
        taxRate: prod.taxRate ?? 0,
        hsnCode: prod.hsnCode || '',
        hasExpiryTracking: prod.hasExpiryTracking || false,
        galleryImages: prod.galleryImages?.length > 0 ? prod.galleryImages : (prod.featuredImage ? [prod.featuredImage] : []),
        shortDescription: prod.shortDescription || '',
        tags: Array.isArray(prod.tags) ? prod.tags.join(', ') : (prod.tags || ''),
        seoTitle: prod.seoTitle || '',
        seoDescription: prod.seoDescription || '',
        isBestseller: prod.isBestseller || false,
        dietaryPreference: prod.dietaryPreference || '',
        shelfLife: prod.shelfLife || '',
        storageInstructions: prod.storageInstructions || '',
        nutritionInfo: prod.nutritionInfo || '',
        countryOfOrigin: prod.countryOfOrigin || '',
        relatedProducts: Array.isArray(prod.relatedProducts) ? prod.relatedProducts.join(', ') : (prod.relatedProducts || '')
      });
      setVariants(res.variants || []);
      if (editor) editor.commands.setContent(prod.description || '');
      
      const batchRes = await fetchApi(`/products/${productId}/batches`);
      setBatches(batchRes || []);
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
    if (e && e.preventDefault) e.preventDefault();
    setLoading(true);
    try {
      const payload = { 
        ...formData, 
        needsReview: false, // Clearing needsReview on manual save
        description: editor ? editor.getHTML() : '' 
      };
      if (isEdit) {
        await fetchApi(`/products/${productId}`, { method: 'PUT', body: JSON.stringify(payload) });
        toast.success('Product updated successfully');
      } else {
        await fetchApi('/products', { method: 'POST', body: JSON.stringify(payload) });
        toast.success('Product created successfully');
      }
      onSave();
    } catch (err) {
      toast.error(err.message);
    }
    setLoading(false);
  };

  // --- VARIANT HANDLING ---
  const [newVariant, setNewVariant] = useState({ 
    name: '', 
    sku: '', 
    barcode: '',
    mrp: '',
    sellingPrice: '',
    stock: 0,
    featuredImage: '',
    conversionFactor: 1, 
    conversionUnit: 'PCS' 
  });
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
      setNewVariant({ name: '', sku: '', barcode: '', mrp: '', sellingPrice: '', stock: 0, featuredImage: '', conversionFactor: 1, conversionUnit: formData.baseUnit || 'PCS' });
      setEditingVariantId(null);
      loadProduct(); 
    } catch (e) { toast.error(e.message); }
  };

  const handleEditVariant = (v) => {
    setNewVariant({ 
      name: v.name, 
      sku: v.sku || '', 
      barcode: v.barcode || '',
      mrp: v.mrp || '',
      sellingPrice: v.sellingPrice || '', 
      stock: v.stock || 0,
      featuredImage: v.featuredImage || '',
      conversionFactor: v.conversionFactor || 1, 
      conversionUnit: v.conversionUnit || formData.baseUnit || 'PCS' 
    });
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

  const parentCategories = categories.filter(c => !c.parentCategory);

  return (
    <div>
      <PageHeader 
        title={isEdit ? 'Edit Product' : 'Add New Product'} 
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

      {formData.needsReview && (
        <div className="alert alert-warning d-flex align-items-center gap-3 mb-4 shadow-sm">
          <AlertCircle size={20} className="text-warning flex-shrink-0" />
          <div>
            <strong>Migrated Product:</strong> Please verify the <strong>Unit of Measure</strong>, <strong>Product Type</strong>, and <strong>GST Rate</strong> before saving.
          </div>
        </div>
      )}

      <Tabs defaultActiveKey="basic" className="mb-4">
        {/* TAB 1: BASIC & PRICING */}
        <Tab eventKey="basic" title="General & Pricing">
          <Form onSubmit={handleSubmit}>
            <Row className="g-4">
              <Col xl={8}>
                {/* Basic Details Card */}
                <Card className="border-0 shadow-sm mb-4">
                  <Card.Body className="p-4">
                    <h6 className="fw-bold mb-4">Basic Information</h6>
                    
                    <Row className="g-3 mb-3">
                      <Col md={8}>
                        <Form.Group>
                          <Form.Label className="fw-medium text-muted font-size-13 mb-1">Product Name *</Form.Label>
                          <Form.Control 
                            value={formData.name} 
                            onChange={e => {
                              const nameVal = e.target.value;
                              setFormData({
                                ...formData, 
                                name: nameVal,
                                slug: isEdit ? formData.slug : nameVal.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, '')
                              });
                            }} 
                            required 
                            className="py-2" 
                          />
                        </Form.Group>
                      </Col>
                      <Col md={4}>
                        <Form.Group>
                          <Form.Label className="fw-medium text-muted font-size-13 mb-1">Brand</Form.Label>
                          <Form.Control value={formData.brand || ''} onChange={e => setFormData({...formData, brand: e.target.value})} placeholder="e.g. Amul, Tata, Madhur" className="py-2" />
                        </Form.Group>
                      </Col>
                    </Row>

                    <Row className="g-3 mb-3">
                      <Col md={4}>
                        <Form.Group>
                          <Form.Label className="fw-medium text-muted font-size-13 mb-1">Slug (URL)</Form.Label>
                          <Form.Control value={formData.slug} onChange={e => setFormData({...formData, slug: e.target.value})} required className="py-2" />
                        </Form.Group>
                      </Col>
                      <Col md={4}>
                        <Form.Group>
                          <Form.Label className="fw-medium text-muted font-size-13 mb-1">Category *</Form.Label>
                          <Form.Select value={formData.category} onChange={e => setFormData({...formData, category: e.target.value, subcategory: ''})} required className="py-2">
                            <option value="">Select Category</option>
                            {parentCategories.map(c => <option key={c._id} value={c._id}>{c.name}</option>)}
                          </Form.Select>
                        </Form.Group>
                      </Col>
                      <Col md={4}>
                        <Form.Group>
                          <Form.Label className="fw-medium text-muted font-size-13 mb-1">Subcategory</Form.Label>
                          <Form.Select value={formData.subcategory} onChange={e => setFormData({...formData, subcategory: e.target.value})} className="py-2" disabled={subcategories.length === 0}>
                            <option value="">Select Subcategory</option>
                            {subcategories.map(c => <option key={c._id} value={c._id}>{c.name}</option>)}
                          </Form.Select>
                        </Form.Group>
                      </Col>
                    </Row>
                    
                    <Row className="g-3 mb-3">
                      <Col md={12}>
                        <Form.Group>
                          <Form.Label className="fw-medium text-muted font-size-13 mb-1">Short Description</Form.Label>
                          <Form.Control value={formData.shortDescription} onChange={e => setFormData({...formData, shortDescription: e.target.value})} placeholder="A quick summary (1-2 sentences)" className="py-2" />
                        </Form.Group>
                      </Col>
                    </Row>
                    
                    <Form.Group>
                      <Form.Label className="fw-medium text-muted font-size-13 mb-1">Detailed Description</Form.Label>
                      <div className="form-control p-3 border-secondary-subtle" style={{ minHeight: '180px' }}>
                        <EditorContent editor={editor} />
                      </div>
                    </Form.Group>
                  </Card.Body>
                </Card>

                {/* Pricing & GST Card */}
                <Card className="border-0 shadow-sm mb-4">
                  <Card.Body className="p-4">
                    <h6 className="fw-bold mb-4">Pricing, Stock & Taxation</h6>
                    <Row className="g-3 mb-3">
                      <Col md={3}>
                        <Form.Group>
                          <Form.Label className="fw-medium text-muted font-size-13 mb-1">MRP (₹)</Form.Label>
                          <Form.Control type="number" step="0.01" value={formData.mrp} onChange={e => setFormData({...formData, mrp: e.target.value})} className="py-2" />
                        </Form.Group>
                      </Col>
                      <Col md={3}>
                        <Form.Group>
                          <Form.Label className="fw-medium text-muted font-size-13 mb-1">Cost Price (₹)</Form.Label>
                          <Form.Control type="number" step="0.01" value={formData.costPrice} onChange={e => setFormData({...formData, costPrice: e.target.value})} className="py-2" />
                        </Form.Group>
                      </Col>
                      <Col md={3}>
                        <Form.Group>
                          <Form.Label className="fw-medium text-muted font-size-13 mb-1">Selling Price (₹) *</Form.Label>
                          <div className="d-flex align-items-center gap-2">
                            <Form.Control type="number" step="0.01" value={formData.sellingPrice} onChange={e => setFormData({...formData, sellingPrice: e.target.value})} required className="py-2" />
                            {formData.mrp && formData.sellingPrice && Number(formData.mrp) > Number(formData.sellingPrice) && (
                              <Badge bg="success" className="p-2">
                                {Math.round(((Number(formData.mrp) - Number(formData.sellingPrice)) / Number(formData.mrp)) * 100)}% OFF
                              </Badge>
                            )}
                          </div>
                        </Form.Group>
                      </Col>
                      <Col md={3}>
                        <Form.Group>
                          <Form.Label className="fw-medium text-muted font-size-13 mb-1">GST Tax Rate</Form.Label>
                          <Form.Select value={formData.taxRate} onChange={e => setFormData({...formData, taxRate: Number(e.target.value)})} className="py-2">
                            <option value="0">0% (Nil / Exempted)</option>
                            <option value="5">5% GST</option>
                            <option value="12">12% GST</option>
                            <option value="18">18% GST</option>
                            <option value="28">28% GST</option>
                          </Form.Select>
                        </Form.Group>
                      </Col>
                    </Row>
                    <Row className="g-3">
                      <Col md={6}>
                        <Form.Group>
                          <Form.Label className="fw-medium text-muted font-size-13 mb-1">Current Stock Quantity</Form.Label>
                          <Form.Control type="number" value={formData.stock} onChange={e => setFormData({...formData, stock: Number(e.target.value)})} className="py-2" />
                        </Form.Group>
                      </Col>
                      <Col md={6}>
                        <Form.Group>
                          <Form.Label className="fw-medium text-muted font-size-13 mb-1">Low Stock Alert Threshold</Form.Label>
                          <Form.Control type="number" value={formData.lowStockThreshold} onChange={e => setFormData({...formData, lowStockThreshold: Number(e.target.value)})} className="py-2" />
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
                          <Upload size={14} /> {uploading ? 'Uploading...' : 'Upload'}
                       </label>
                    </div>

                    {formData.galleryImages?.length > 0 ? (
                      <div className="d-flex flex-column gap-3">
                        <div className="position-relative border rounded p-2 bg-light text-center">
                          <img src={formData.galleryImages[0]} alt="Featured" style={{ maxHeight: '200px', objectFit: 'contain' }} className="w-100 rounded" />
                          <Badge bg="primary" className="position-absolute top-0 start-0 m-2">Featured / Primary</Badge>
                        </div>
                        <div className="d-flex flex-wrap gap-2">
                          {formData.galleryImages.map((img, idx) => (
                            <div key={idx} className="position-relative border rounded p-1" style={{ width: '80px', height: '100px', backgroundColor: '#f8f9fa' }}>
                              <img src={img} alt="" className="w-100 h-100 object-fit-cover rounded mb-1" style={{ height: '70px' }} />
                              <div className="d-flex justify-content-between align-items-center mt-1">
                                <button type="button" className="btn btn-light btn-sm p-0 d-flex align-items-center justify-content-center" style={{ width: '20px', height: '20px' }} onClick={() => moveImage(idx, 'left')} disabled={idx === 0}>
                                  <ArrowLeft size={12} />
                                </button>
                                <button type="button" className="btn btn-danger btn-sm p-0 d-flex align-items-center justify-content-center" style={{ width: '20px', height: '20px' }} onClick={() => removeImage(idx)}>
                                  <Trash2 size={12} />
                                </button>
                                <button type="button" className="btn btn-light btn-sm p-0 d-flex align-items-center justify-content-center" style={{ width: '20px', height: '20px' }} onClick={() => moveImage(idx, 'right')} disabled={idx === formData.galleryImages.length - 1}>
                                  <ArrowRight size={12} />
                                </button>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    ) : (
                      <div className="text-center py-4 text-muted border border-dashed rounded">
                        <Image size={32} className="mb-2 opacity-50" />
                        <div>No images uploaded</div>
                      </div>
                    )}
                  </Card.Body>
                </Card>

                {/* Status & Compliance Settings */}
                <Card className="border-0 shadow-sm mb-4">
                  <Card.Body className="p-4">
                    <h6 className="fw-bold mb-3">Status & Tracking</h6>
                    
                    <Form.Group className="mb-3">
                      <Form.Label className="fw-medium text-muted font-size-13 mb-1">HSN Code</Form.Label>
                      <Form.Control value={formData.hsnCode || ''} onChange={e => setFormData({...formData, hsnCode: e.target.value})} placeholder="e.g. 1701, 1006" className="py-2" />
                    </Form.Group>

                    <Form.Group className="mb-3">
                      <Form.Label className="fw-medium text-muted font-size-13 mb-1">Barcode</Form.Label>
                      <Form.Control value={formData.barcode || ''} onChange={e => setFormData({...formData, barcode: e.target.value})} placeholder="Scan or enter barcode" className="py-2" />
                    </Form.Group>

                    <Form.Group className="mb-3">
                      <Form.Label className="fw-medium text-muted font-size-13 mb-1">SKU</Form.Label>
                      <Form.Control value={formData.baseSku || ''} onChange={e => setFormData({...formData, baseSku: e.target.value})} placeholder="Leave blank to auto-generate" className="py-2" />
                    </Form.Group>

                    <div className="d-flex flex-column gap-3 pt-2 border-top">
                      <Form.Check 
                        type="switch" 
                        id="expiry-switch"
                        label={
                          <div>
                            <span className="fw-bold">Expiry Date Tracking</span>
                            <div className="text-muted font-size-12">Mandatory expiry dates & FEFO for perishables (Milk, Bread, Curd). Disable for Sugar, Rice, Soaps.</div>
                          </div>
                        }
                        checked={formData.hasExpiryTracking}
                        onChange={e => setFormData({...formData, hasExpiryTracking: e.target.checked})}
                      />

                      <Form.Check 
                        type="switch" 
                        id="bestseller-switch"
                        label="Bestseller Badge"
                        checked={formData.isBestseller}
                        onChange={e => setFormData({...formData, isBestseller: e.target.checked})}
                      />

                      <Form.Check 
                        type="switch" 
                        id="featured-switch"
                        label="Featured Product (Show on homepage)"
                        checked={formData.isFeatured}
                        onChange={e => setFormData({...formData, isFeatured: e.target.checked})}
                      />

                      <Form.Check 
                        type="switch" 
                        id="active-switch"
                        label="Publish / Active in POS & Online Store"
                        checked={formData.isActive}
                        onChange={e => setFormData({...formData, isActive: e.target.checked})}
                      />
                    </div>
                  </Card.Body>
                </Card>
              </Col>
            </Row>
          </Form>
        </Tab>

        {/* TAB 2: UNITS OF MEASURE & PACKAGING */}
        <Tab eventKey="uom" title="Units & Quantity Rules">
          <Card className="border-0 shadow-sm mb-4">
            <Card.Body className="p-4">
              <div className="d-flex align-items-center gap-2 mb-4">
                <Scale size={20} className="text-primary" />
                <h6 className="fw-bold mb-0">Units of Measure & Commercial Procurement</h6>
              </div>

              <Row className="g-4 mb-4">
                <Col md={3}>
                  <Form.Group>
                    <Form.Label className="fw-medium text-muted font-size-13 mb-1">Product Type</Form.Label>
                    <Form.Select value={formData.productType} onChange={e => setFormData({...formData, productType: e.target.value})} className="py-2">
                      <option value="PIECE">PIECE (Unit count)</option>
                      <option value="WEIGHT">WEIGHT (Loose/Bulk Grams/KG)</option>
                      <option value="VOLUME">VOLUME (Loose/Bulk ML/LTR)</option>
                      <option value="PACK">PACK (Packaged snacks/boxes)</option>
                    </Form.Select>
                  </Form.Group>
                </Col>

                <Col md={3}>
                  <Form.Group>
                    <Form.Label className="fw-medium text-muted font-size-13 mb-1">Base Inventory Unit *</Form.Label>
                    <Form.Select value={formData.baseUnit} onChange={e => setFormData({...formData, baseUnit: e.target.value, sellingUnit: e.target.value})} className="py-2">
                      <option value="KG">KG (Kilograms)</option>
                      <option value="GM">GM (Grams)</option>
                      <option value="LTR">LTR (Liters)</option>
                      <option value="ML">ML (Milliliters)</option>
                      <option value="PCS">PCS (Pieces)</option>
                      <option value="PACK">PACK (Packets)</option>
                      <option value="BOX">BOX (Boxes)</option>
                      <option value="BAG">BAG (Bags/Sacks)</option>
                    </Form.Select>
                  </Form.Group>
                </Col>

                <Col md={3}>
                  <Form.Group>
                    <Form.Label className="fw-medium text-muted font-size-13 mb-1">Purchase Unit (Supplier)</Form.Label>
                    <Form.Select value={formData.purchaseUnit} onChange={e => setFormData({...formData, purchaseUnit: e.target.value})} className="py-2">
                      <option value="BAG">BAG (Sack)</option>
                      <option value="BOX">BOX (Carton)</option>
                      <option value="CRATE">CRATE</option>
                      <option value="TIN">TIN</option>
                      <option value="KG">KG</option>
                      <option value="LTR">LTR</option>
                      <option value="PCS">PCS</option>
                      <option value="PACK">PACK</option>
                    </Form.Select>
                  </Form.Group>
                </Col>

                <Col md={3}>
                  <Form.Group>
                    <Form.Label className="fw-medium text-muted font-size-13 mb-1">
                      Purchase $\rightarrow$ Stock Factor
                    </Form.Label>
                    <Form.Control 
                      type="number" 
                      step="0.01" 
                      value={formData.purchaseToStockFactor} 
                      onChange={e => setFormData({...formData, purchaseToStockFactor: Number(e.target.value)})} 
                      className="py-2" 
                    />
                    <Form.Text className="text-muted font-size-11">
                      e.g. 1 {formData.purchaseUnit} = {formData.purchaseToStockFactor} {formData.baseUnit}
                    </Form.Text>
                  </Form.Group>
                </Col>

                <Col md={6}>
                  <Form.Group>
                    <Form.Label className="fw-medium text-muted font-size-13 mb-1">Preferred Supplier (Primary Procurement Partner)</Form.Label>
                    <Form.Select 
                      value={formData.preferredSupplier} 
                      onChange={e => setFormData({...formData, preferredSupplier: e.target.value || null})} 
                      className="py-2"
                    >
                      <option value="">None (Auto-select from most recent inward batch)</option>
                      {suppliers.map(s => (
                        <option key={s._id} value={s._id}>
                          {s.companyName || s.name} ({s.gstNumber || s.phone})
                        </option>
                      ))}
                    </Form.Select>
                    <Form.Text className="text-muted font-size-11">
                      Stock Entry will automatically prioritize this supplier for inward batches.
                    </Form.Text>
                  </Form.Group>
                </Col>
              </Row>

              <h6 className="fw-bold mb-3 pt-3 border-top">Online Store Quantity Rules</h6>
              <Row className="g-4">
                <Col md={4}>
                  <Form.Group>
                    <Form.Label className="fw-medium text-muted font-size-13 mb-1">Minimum Order Qty</Form.Label>
                    <Form.Control 
                      type="number" 
                      step="0.01" 
                      value={formData.minSaleQty} 
                      onChange={e => setFormData({...formData, minSaleQty: Number(e.target.value)})} 
                      className="py-2" 
                    />
                    <Form.Text className="text-muted font-size-11">Min quantity a customer can order ({formData.baseUnit})</Form.Text>
                  </Form.Group>
                </Col>

                <Col md={4}>
                  <Form.Group>
                    <Form.Label className="fw-medium text-muted font-size-13 mb-1">Maximum Order Qty</Form.Label>
                    <Form.Control 
                      type="number" 
                      step="0.01" 
                      value={formData.maxSaleQty} 
                      onChange={e => setFormData({...formData, maxSaleQty: Number(e.target.value)})} 
                      className="py-2" 
                    />
                    <Form.Text className="text-muted font-size-11">Max quantity limit per order ({formData.baseUnit})</Form.Text>
                  </Form.Group>
                </Col>

                <Col md={4}>
                  <Form.Group>
                    <Form.Label className="fw-medium text-muted font-size-13 mb-1">Quantity Step Increment</Form.Label>
                    <Form.Control 
                      type="number" 
                      step="0.01" 
                      value={formData.qtyStep} 
                      onChange={e => setFormData({...formData, qtyStep: Number(e.target.value)})} 
                      className="py-2" 
                    />
                    <Form.Text className="text-muted font-size-11">e.g. 0.5 allows 0.5, 1.0, 1.5, 2.0 {formData.baseUnit}</Form.Text>
                  </Form.Group>
                </Col>
              </Row>
            </Card.Body>
          </Card>
        </Tab>

        {/* TAB 3: ATTRIBUTES & SEO */}
        <Tab eventKey="attributes" title="Attributes & SEO">
          <Card className="border-0 shadow-sm mb-4">
            <Card.Body className="p-4">
              <h6 className="fw-bold mb-4">Product Attributes</h6>
              <Row className="g-3 mb-4">
                <Col md={3}>
                  <Form.Group>
                    <Form.Label className="fw-medium text-muted font-size-13 mb-1">Dietary Preference</Form.Label>
                    <Form.Select value={formData.dietaryPreference} onChange={e => setFormData({...formData, dietaryPreference: e.target.value})} className="py-2">
                      <option value="">None</option>
                      <option value="VEG">Vegetarian (Green)</option>
                      <option value="NON_VEG">Non-Vegetarian (Red)</option>
                      <option value="EGG">Contains Egg (Brown)</option>
                      <option value="VEGAN">Vegan</option>
                    </Form.Select>
                  </Form.Group>
                </Col>
                <Col md={3}>
                  <Form.Group>
                    <Form.Label className="fw-medium text-muted font-size-13 mb-1">Shelf Life</Form.Label>
                    <Form.Control value={formData.shelfLife} onChange={e => setFormData({...formData, shelfLife: e.target.value})} placeholder="e.g. 6 Months" className="py-2" />
                  </Form.Group>
                </Col>
                <Col md={3}>
                  <Form.Group>
                    <Form.Label className="fw-medium text-muted font-size-13 mb-1">Country of Origin</Form.Label>
                    <Form.Control value={formData.countryOfOrigin} onChange={e => setFormData({...formData, countryOfOrigin: e.target.value})} placeholder="e.g. India" className="py-2" />
                  </Form.Group>
                </Col>
                <Col md={12}>
                  <Form.Group>
                    <Form.Label className="fw-medium text-muted font-size-13 mb-1">Storage Instructions</Form.Label>
                    <Form.Control value={formData.storageInstructions} onChange={e => setFormData({...formData, storageInstructions: e.target.value})} placeholder="e.g. Store in a cool, dry place" className="py-2" />
                  </Form.Group>
                </Col>
                <Col md={12}>
                  <Form.Group>
                    <Form.Label className="fw-medium text-muted font-size-13 mb-1">Nutrition Information</Form.Label>
                    <Form.Control as="textarea" rows={3} value={formData.nutritionInfo} onChange={e => setFormData({...formData, nutritionInfo: e.target.value})} placeholder="e.g. Calories: 200, Protein: 5g..." className="py-2" />
                  </Form.Group>
                </Col>
              </Row>

              <h6 className="fw-bold mb-3 pt-3 border-top">Search Engine Optimization (SEO) & Discovery</h6>
              <Row className="g-3">
                <Col md={12}>
                  <Form.Group>
                    <Form.Label className="fw-medium text-muted font-size-13 mb-1">Tags / Keywords (Comma separated)</Form.Label>
                    <Form.Control value={formData.tags} onChange={e => setFormData({...formData, tags: e.target.value})} placeholder="e.g. snack, spicy, chips" className="py-2" />
                  </Form.Group>
                </Col>
                <Col md={12}>
                  <Form.Group>
                    <Form.Label className="fw-medium text-muted font-size-13 mb-1">Related/Upsell Products (Comma separated Slugs or IDs)</Form.Label>
                    <Form.Control value={formData.relatedProducts} onChange={e => setFormData({...formData, relatedProducts: e.target.value})} placeholder="e.g. chips-lays-blue, chips-kurkure" className="py-2" />
                  </Form.Group>
                </Col>
                <Col md={12}>
                  <Form.Group>
                    <Form.Label className="fw-medium text-muted font-size-13 mb-1">SEO Title</Form.Label>
                    <Form.Control value={formData.seoTitle} onChange={e => setFormData({...formData, seoTitle: e.target.value})} placeholder="e.g. Buy Premium Chips Online" className="py-2" />
                  </Form.Group>
                </Col>
                <Col md={12}>
                  <Form.Group>
                    <Form.Label className="fw-medium text-muted font-size-13 mb-1">SEO Meta Description</Form.Label>
                    <Form.Control as="textarea" rows={2} value={formData.seoDescription} onChange={e => setFormData({...formData, seoDescription: e.target.value})} placeholder="Short description for search engines..." className="py-2" />
                  </Form.Group>
                </Col>
              </Row>
            </Card.Body>
          </Card>
        </Tab>

        {/* TAB 4: VARIANTS */}
        <Tab eventKey="variants" title={`Variants (${variants.length})`}>
          <Card className="border-0 shadow-sm mb-4">
            <Card.Body className="p-4">
              <h6 className="fw-bold mb-3">{editingVariantId ? 'Edit Variant' : 'Add Pack / Size Variant'}</h6>
              
              <Row className="g-3 align-items-end mb-4">
                <Col md={3}>
                  <Form.Label className="fw-medium text-muted font-size-13 mb-1">Variant Name *</Form.Label>
                  <Form.Control 
                    value={newVariant.name} 
                    onChange={e => setNewVariant({...newVariant, name: e.target.value})} 
                    placeholder="e.g. 500 GM Pack" 
                    className="py-2" 
                  />
                </Col>
                <Col md={2}>
                  <Form.Label className="fw-medium text-muted font-size-13 mb-1">SKU</Form.Label>
                  <Form.Control 
                    value={newVariant.sku} 
                    onChange={e => setNewVariant({...newVariant, sku: e.target.value})} 
                    placeholder="Auto" 
                    className="py-2" 
                  />
                </Col>
                <Col md={2}>
                  <Form.Label className="fw-medium text-muted font-size-13 mb-1">Barcode</Form.Label>
                  <Form.Control 
                    value={newVariant.barcode} 
                    onChange={e => setNewVariant({...newVariant, barcode: e.target.value})} 
                    placeholder="Scan" 
                    className="py-2" 
                  />
                </Col>
                <Col md={1}>
                  <Form.Label className="fw-medium text-muted font-size-13 mb-1">Stock</Form.Label>
                  <Form.Control 
                    type="number"
                    value={newVariant.stock} 
                    onChange={e => setNewVariant({...newVariant, stock: Number(e.target.value)})} 
                    placeholder="0" 
                    className="py-2" 
                  />
                </Col>
                <Col md={2}>
                  <Form.Label className="fw-medium text-muted font-size-13 mb-1">MRP (₹)</Form.Label>
                  <Form.Control 
                    type="number" 
                    step="0.01"
                    value={newVariant.mrp} 
                    onChange={e => setNewVariant({...newVariant, mrp: e.target.value})} 
                    placeholder="0.00" 
                    className="py-2" 
                  />
                </Col>
                <Col md={2}>
                  <Form.Label className="fw-medium text-muted font-size-13 mb-1">Selling Price (₹)</Form.Label>
                  <Form.Control 
                    type="number" 
                    step="0.01"
                    value={newVariant.sellingPrice} 
                    onChange={e => setNewVariant({...newVariant, sellingPrice: e.target.value})} 
                    placeholder="0.00" 
                    className="py-2" 
                  />
                </Col>
              </Row>
              <Row className="g-3 align-items-end mb-4">
                <Col md={2}>
                  <Form.Label className="fw-medium text-muted font-size-13 mb-1">
                    Conversion Factor
                  </Form.Label>
                  <Form.Control 
                    type="number" 
                    step="0.001"
                    value={newVariant.conversionFactor} 
                    onChange={e => setNewVariant({...newVariant, conversionFactor: Number(e.target.value)})} 
                    placeholder="e.g. 0.5" 
                    className="py-2" 
                  />
                  <Form.Text className="text-muted font-size-11">
                    Deduction per unit: {newVariant.conversionFactor} {formData.baseUnit}
                  </Form.Text>
                </Col>
                <Col md={3} className="d-flex gap-2">
                  <Button variant="primary" className="py-2 flex-grow-1" onClick={handleAddVariant}>
                    {editingVariantId ? 'Update Variant' : 'Add Variant'}
                  </Button>
                  {editingVariantId && (
                    <Button variant="outline-secondary" className="py-2" onClick={() => {
                      setEditingVariantId(null);
                      setNewVariant({ name: '', sku: '', barcode: '', mrp: '', sellingPrice: '', stock: 0, featuredImage: '', conversionFactor: 1, conversionUnit: formData.baseUnit || 'PCS' });
                    }}>
                      Cancel
                    </Button>
                  )}
                </Col>
              </Row>

              <Table responsive hover className="align-middle">
                <thead className="table-light">
                  <tr>
                    <th>Variant Name</th>
                    <th>SKU / Barcode</th>
                    <th>Stock</th>
                    <th>MRP / Selling Price</th>
                    <th>Inventory Deduction Factor</th>
                    <th className="text-end">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {variants.map(v => (
                    <tr key={v._id}>
                      <td className="fw-bold">{v.name}</td>
                      <td className="text-muted">
                        <div>SKU: {v.sku || '-'}</div>
                        <div className="font-size-11">UPC: {v.barcode || '-'}</div>
                      </td>
                      <td>{v.stock || 0}</td>
                      <td>
                        {v.mrp && <div className="text-decoration-line-through text-muted font-size-11">{formatCurrency(v.mrp)}</div>}
                        <div className="fw-medium text-success">{formatCurrency(v.sellingPrice || 0)}</div>
                      </td>
                      <td>
                        <Badge bg="info" className="text-dark">
                          1 variant = {v.conversionFactor || 1} {formData.baseUnit}
                        </Badge>
                      </td>
                      <td className="text-end">
                        <Button variant="link" size="sm" className="p-1 text-primary me-2" onClick={() => handleEditVariant(v)}>
                          <Edit size={16} />
                        </Button>
                        <Button variant="link" size="sm" className="p-1 text-danger" onClick={() => handleDeleteClick(v._id)}>
                          <Trash2 size={16} />
                        </Button>
                      </td>
                    </tr>
                  ))}
                  {variants.length === 0 && (
                    <tr>
                      <td colSpan="5" className="text-center py-4 text-muted">No variants created. Product sells in base unit ({formData.baseUnit}).</td>
                    </tr>
                  )}
                </tbody>
              </Table>
            </Card.Body>
          </Card>
        </Tab>

        {/* TAB 4: BATCHES & INVENTORY LOG */}
        <Tab eventKey="batches" title={`Batches (${batches.length})`}>
          <Card className="border-0 shadow-sm mb-4">
            <Card.Body className="p-4">
              <div className="d-flex justify-content-between align-items-center mb-3">
                <h6 className="fw-bold mb-0">Active Inventory Batches</h6>
                <Badge bg="secondary" className="px-3 py-2 fs-6">
                  Total Aggregate Stock: {formData.stock} {formData.baseUnit}
                </Badge>
              </div>

              <Table responsive hover className="align-middle">
                <thead className="table-light">
                  <tr>
                    <th>Batch Number</th>
                    <th>Supplier</th>
                    <th>Stock Remaining</th>
                    <th>Base Unit Cost</th>
                    <th>Total Batch Cost</th>
                    <th>Expiry Date</th>
                    <th>Received Date</th>
                  </tr>
                </thead>
                <tbody>
                  {batches.map(b => (
                    <tr key={b._id}>
                      <td className="fw-bold font-monospace">{b.batchNumber}</td>
                      <td>{b.supplier?.companyName || b.supplier?.name || '-'}</td>
                      <td>
                        <span className="fw-bold text-success">{b.stock}</span> {b.unit || formData.baseUnit}
                      </td>
                      <td>{formatCurrency(b.unitCost || b.costPrice || 0)} / {b.unit || formData.baseUnit}</td>
                      <td>{formatCurrency(b.totalCost || 0)}</td>
                      <td>
                        {b.expiryDate ? (
                          new Date(b.expiryDate) < new Date() ? (
                            <Badge bg="danger">Expired ({new Date(b.expiryDate).toLocaleDateString()})</Badge>
                          ) : (
                            <Badge bg="warning" className="text-dark">{new Date(b.expiryDate).toLocaleDateString()}</Badge>
                          )
                        ) : (
                          <Badge bg="secondary">Non-Perishable</Badge>
                        )}
                      </td>
                      <td className="text-muted font-size-12">{new Date(b.createdAt).toLocaleDateString()}</td>
                    </tr>
                  ))}
                  {batches.length === 0 && (
                    <tr>
                      <td colSpan="7" className="text-center py-4 text-muted">No inventory batches recorded yet. Inward stock from the Stock Entry module.</td>
                    </tr>
                  )}
                </tbody>
              </Table>
            </Card.Body>
          </Card>
        </Tab>
      </Tabs>

      {/* Delete Confirmation Modal */}
      <Modal show={showDeleteModal} onHide={() => setShowDeleteModal(false)} centered>
        <Modal.Header closeButton>
          <Modal.Title>Delete Variant</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          Are you sure you want to delete this variant? This action cannot be undone.
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowDeleteModal(false)}>Cancel</Button>
          <Button variant="danger" onClick={confirmDelete}>Delete</Button>
        </Modal.Footer>
      </Modal>
    </div>
  );
}
