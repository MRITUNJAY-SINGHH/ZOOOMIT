import React, { useState, useEffect, useRef } from 'react';
import { Card, Form, Button, Row, Col, Alert, Badge, Modal, InputGroup, Spinner } from 'react-bootstrap';
import { Link, useSearchParams } from 'react-router';
import { 
  Plus, CheckCircle, PackagePlus, ClipboardList, Calculator, Info, 
  Search, Building, Sparkles, Star, History, X, Layers, Tag
} from 'lucide-react';
import api, { fetchApi } from '@/utils/api';
import { toast } from 'react-hot-toast';
import PageHeader from '@/components/common/PageHeader';
import InventoryStatCards from '@/components/inventory/InventoryStatCards';
import { formatCurrency, formatDate } from '@/utils/format';
import { roundTo, multiply, divide } from '@/utils/decimalUtils';

export default function StockEntry() {
  const [searchParams] = useSearchParams();
  const initialProductId = searchParams.get('productId') || '';
  const initialSupplierId = searchParams.get('supplierId') || '';

  // Main Form Data
  const [formData, setFormData] = useState({ 
    productId: initialProductId, 
    variantId: '', 
    supplierId: initialSupplierId, 
    batchNumber: '', 
    quantity: '', 
    unit: '',
    unitCost: '', 
    totalCost: '',
    manufacturingDate: '', 
    expiryDate: '', 
    note: '' 
  });

  // Master Data
  const [products, setProducts] = useState([]);
  const [suppliers, setSuppliers] = useState([]);
  const [categories, setCategories] = useState([]);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [supplierHistory, setSupplierHistory] = useState(null);
  const [variants, setVariants] = useState([]);
  
  // UI & Search states
  const [productSearch, setProductSearch] = useState('');
  const [supplierSearch, setSupplierSearch] = useState('');
  const [showProductDropdown, setShowProductDropdown] = useState(false);
  const [showSupplierDropdown, setShowSupplierDropdown] = useState(false);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [autoFillContext, setAutoFillContext] = useState(null);

  // Quick Create Modals
  const [showQuickProductModal, setShowQuickProductModal] = useState(false);
  const [showQuickSupplierModal, setShowQuickSupplierModal] = useState(false);
  const [showQuickCategoryModal, setShowQuickCategoryModal] = useState(false);
  const [showQuickVariantModal, setShowQuickVariantModal] = useState(false);
  const [quickCategoryParentId, setQuickCategoryParentId] = useState('');

  // Quick Product Form State
  const [quickProductData, setQuickProductData] = useState({
    name: '',
    category: '',
    subcategory: '',
    productType: 'PIECE',
    baseUnit: 'PCS',
    purchaseUnit: 'PCS',
    purchaseToStockFactor: 1,
    sellingUnit: 'PCS',
    costPrice: '',
    sellingPrice: '',
    taxRate: 0,
    hasExpiryTracking: false
  });

  // Quick Supplier Form State
  const [quickSupplierData, setQuickSupplierData] = useState({
    name: '',
    companyName: '',
    contactPerson: '',
    phone: '',
    email: '',
    gstNumber: '',
    paymentTerms: 'Immediate'
  });

  // Quick Category Form State
  const [quickCategoryData, setQuickCategoryData] = useState({
    name: '',
    parentCategory: ''
  });

  // Quick Variant Form State
  const [quickVariantData, setQuickVariantData] = useState({
    name: '',
    sku: '',
    barcode: '',
    sellingPrice: '',
    conversionUnit: 'KG',
    conversionFactor: 1
  });

  const productDropdownRef = useRef(null);
  const supplierDropdownRef = useRef(null);

  useEffect(() => {
    loadInitialData();
  }, []);

  // Handle outside clicks to close autocomplete dropdowns
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (productDropdownRef.current && !productDropdownRef.current.contains(e.target)) {
        setShowProductDropdown(false);
      }
      if (supplierDropdownRef.current && !supplierDropdownRef.current.contains(e.target)) {
        setShowSupplierDropdown(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const loadInitialData = async () => {
    try {
      const [prodRes, suppRes, catRes] = await Promise.allSettled([
        fetchApi('/products?limit=150'),
        fetchApi('/suppliers?limit=150'),
        fetchApi('/categories')
      ]);

      const prods = prodRes.status === 'fulfilled' ? (prodRes.value.data || prodRes.value || []) : [];
      const supps = suppRes.status === 'fulfilled' ? (suppRes.value.data || suppRes.value || []) : [];
      const cats = catRes.status === 'fulfilled' ? (catRes.value || []) : [];

      setProducts(prods);
      setSuppliers(supps);
      setCategories(cats);

      // If URL params exist, auto-select
      if (initialProductId) {
        const foundProd = prods.find(p => p._id === initialProductId);
        if (foundProd) {
          handleSelectProduct(foundProd, supps, initialSupplierId);
        }
      }
    } catch (e) {
      console.error(e);
    }
  };

  // --- SMART PRODUCT SELECTION ---
  const handleSelectProduct = async (product, supplierList = suppliers, explicitSupplierId = null) => {
    setSelectedProduct(product);
    setProductSearch(product.name);
    setShowProductDropdown(false);

    const defaultUnit = product.purchaseUnit || product.baseUnit || 'PCS';
    const defaultCost = product.costPrice || '';

    let selectedSuppId = explicitSupplierId || '';
    let autoContext = null;

    // Fetch Supplier History & Recommendation for this product
    try {
      const historyRes = await fetchApi(`/products/${product._id}/supplier-history`);
      setSupplierHistory(historyRes);

      if (!explicitSupplierId) {
        if (historyRes.recommendedSupplier) {
          selectedSuppId = historyRes.recommendedSupplier._id;
        } else if (product.preferredSupplier) {
          selectedSuppId = product.preferredSupplier._id || product.preferredSupplier;
        }
      }

      if (historyRes.lastPurchaseSummary) {
        const s = historyRes.lastPurchaseSummary;
        autoContext = {
          supplierName: s.supplierName,
          unit: s.unit || defaultUnit,
          unitCost: s.unitCost,
          purchaseDate: s.purchaseDate,
          isPreferred: s.isPreferred
        };
      }
    } catch (err) {
      console.error('Failed to load supplier history', err);
    }

    // Determine Supplier Name for search box
    const matchedSupplier = (supplierList || suppliers).find(s => s._id === selectedSuppId);
    if (matchedSupplier) {
      setSupplierSearch(matchedSupplier.companyName || matchedSupplier.name);
    } else {
      setSupplierSearch('');
    }

    setAutoFillContext(autoContext);

    setFormData(prev => ({
      ...prev,
      productId: product._id,
      variantId: '',
      supplierId: selectedSuppId,
      unit: autoContext?.unit || defaultUnit,
      unitCost: autoContext?.unitCost !== undefined ? autoContext.unitCost : defaultCost,
      batchNumber: `BATCH-${Date.now().toString().slice(-6)}`
    }));

    // Fetch product variants
    try {
      const pDetail = await fetchApi(`/products/${product._id}`);
      setVariants(pDetail.variants || []);
    } catch (e) {
      console.error(e);
    }
  };

  // --- SMART SUPPLIER SELECTION ---
  const handleSelectSupplier = (supplier) => {
    setFormData(prev => ({ ...prev, supplierId: supplier._id }));
    setSupplierSearch(supplier.companyName || supplier.name);
    setShowSupplierDropdown(false);

    // If product has specific past purchase history with this supplier, suggest its last unit cost
    if (supplierHistory?.suppliers) {
      const pastFromThisSupp = supplierHistory.suppliers.find(s => s.supplier._id === supplier._id);
      if (pastFromThisSupp && pastFromThisSupp.lastUnitCost) {
        setFormData(prev => ({
          ...prev,
          unit: pastFromThisSupp.lastPurchaseUnit || prev.unit,
          unitCost: pastFromThisSupp.lastUnitCost
        }));
        setAutoFillContext({
          supplierName: supplier.companyName || supplier.name,
          unit: pastFromThisSupp.lastPurchaseUnit || formData.unit,
          unitCost: pastFromThisSupp.lastUnitCost,
          purchaseDate: pastFromThisSupp.lastPurchaseDate,
          isPreferred: pastFromThisSupp.isPreferred
        });
      }
    }
  };

  // Live Math Calculations
  const qty = Number(formData.quantity) || 0;
  const cost = Number(formData.unitCost) || 0;
  const factor = Number(selectedProduct?.purchaseToStockFactor) || 1;
  const isPurchaseUnit = selectedProduct && formData.unit === selectedProduct.purchaseUnit && factor > 1;

  const totalCalculatedCost = formData.totalCost ? Number(formData.totalCost) : multiply(qty, cost, 2);
  const baseStockAdded = isPurchaseUnit ? multiply(qty, factor, 3) : roundTo(qty, 3);
  const basePerUnitCost = baseStockAdded > 0 ? divide(totalCalculatedCost, baseStockAdded, 2) : cost;

  // --- SUBMIT STOCK ENTRY ---
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.productId) { toast.error('Please select a product'); return; }
    if (!formData.supplierId) { toast.error('Please select a supplier'); return; }
    if (!qty || qty <= 0) { toast.error('Please enter a valid quantity'); return; }
    if (cost < 0) { toast.error('Unit cost cannot be negative'); return; }

    if (selectedProduct?.hasExpiryTracking && !formData.expiryDate) {
      toast.error(`Expiry date is mandatory for perishable product: ${selectedProduct.name}`);
      return;
    }

    setLoading(true);
    setMessage('');
    try {
      const payload = {
        ...formData,
        quantity: parseFloat(formData.quantity),
        unitCost: parseFloat(formData.unitCost) || 0,
        totalCost: totalCalculatedCost
      };
      if (!payload.variantId) delete payload.variantId;
      if (!selectedProduct?.hasExpiryTracking) delete payload.expiryDate;

      await api.post('/inventory/stock-entry', payload);

      setMessage(`Successfully added ${baseStockAdded} ${selectedProduct?.baseUnit || 'units'} to inventory.`);
      toast.success('Stock entry recorded successfully');

      // Reset form while keeping supplier for rapid multi-product entry
      setFormData({
        productId: '',
        variantId: '',
        supplierId: formData.supplierId,
        batchNumber: '',
        quantity: '',
        unit: '',
        unitCost: '',
        totalCost: '',
        manufacturingDate: '',
        expiryDate: '',
        note: ''
      });
      setSelectedProduct(null);
      setProductSearch('');
      setVariants([]);
      setAutoFillContext(null);
      
      // Refresh products list for updated stock
      const prodRes = await fetchApi('/products?limit=150');
      setProducts(prodRes.data || prodRes || []);
    } catch (err) {
      toast.error(err.response?.data?.message || err.message || 'Failed to record stock entry');
    } finally {
      setLoading(false);
    }
  };

  // --- QUICK CREATE HANDLERS ---
  const handleQuickCreateProduct = async (e) => {
    e.preventDefault();
    if (!quickProductData.name.trim()) { toast.error('Product name is required'); return; }
    if (!quickProductData.category) { toast.error('Category is required'); return; }

    try {
      const payload = {
        ...quickProductData,
        costPrice: Number(quickProductData.costPrice) || 0,
        sellingPrice: Number(quickProductData.sellingPrice) || 0,
        purchaseToStockFactor: Number(quickProductData.purchaseToStockFactor) || 1,
        slug: quickProductData.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, '') + `-${Date.now().toString().slice(-4)}`
      };
      const res = await api.post('/products', payload);
      const newProduct = res.data;

      toast.success(`Product "${newProduct.name}" created!`);
      setShowQuickProductModal(false);

      // Refresh product list and auto-select new product
      setProducts(prev => [newProduct, ...prev]);
      handleSelectProduct(newProduct);
    } catch (err) {
      toast.error(err.response?.data?.message || err.message || 'Failed to create product');
    }
  };

  const handleQuickCreateSupplier = async (e) => {
    e.preventDefault();
    if (!quickSupplierData.name.trim()) { toast.error('Supplier name is required'); return; }
    if (!quickSupplierData.phone.trim()) { toast.error('Phone number is required'); return; }

    try {
      const res = await api.post('/suppliers', quickSupplierData);
      const newSupplier = res.data;

      toast.success(`Supplier "${newSupplier.companyName || newSupplier.name}" created!`);
      setShowQuickSupplierModal(false);

      // Refresh supplier list and auto-select new supplier
      setSuppliers(prev => [newSupplier, ...prev]);
      handleSelectSupplier(newSupplier);
    } catch (err) {
      toast.error(err.response?.data?.message || err.message || 'Failed to create supplier');
    }
  };

  const handleQuickCreateCategory = async (e) => {
    e.preventDefault();
    if (!quickCategoryData.name.trim()) { toast.error('Category name is required'); return; }

    try {
      const payload = {
        name: quickCategoryData.name,
        parentCategory: quickCategoryParentId || quickCategoryData.parentCategory || null,
        slug: quickCategoryData.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, '')
      };
      const res = await api.post('/categories', payload);
      const newCategory = res.data;

      toast.success(`Category "${newCategory.name}" created!`);
      setShowQuickCategoryModal(false);

      // Refresh categories
      const catRes = await fetchApi('/categories');
      setCategories(catRes || []);

      // Auto-assign in Quick Product modal
      if (quickCategoryParentId) {
        setQuickProductData(prev => ({ ...prev, subcategory: newCategory._id }));
      } else {
        setQuickProductData(prev => ({ ...prev, category: newCategory._id }));
      }
    } catch (err) {
      toast.error(err.response?.data?.message || err.message || 'Failed to create category');
    }
  };

  const handleQuickCreateVariant = async (e) => {
    e.preventDefault();
    if (!selectedProduct) { toast.error('Select a parent product first'); return; }
    if (!quickVariantData.name.trim()) { toast.error('Variant name is required'); return; }

    try {
      const payload = {
        ...quickVariantData,
        product: selectedProduct._id,
        sellingPrice: Number(quickVariantData.sellingPrice) || selectedProduct.sellingPrice || 0,
        conversionFactor: Number(quickVariantData.conversionFactor) || 1
      };
      const res = await api.post(`/products/${selectedProduct._id}/variants`, payload);
      const newVariant = res.data;

      toast.success(`Variant "${newVariant.name}" added!`);
      setShowQuickVariantModal(false);

      // Refresh variants and auto-select
      setVariants(prev => [...prev, newVariant]);
      setFormData(prev => ({ ...prev, variantId: newVariant._id }));
    } catch (err) {
      toast.error(err.response?.data?.message || err.message || 'Failed to create variant');
    }
  };

  // Filtered Lists for Dropdown Search
  const filteredProducts = products.filter(p => 
    p.name.toLowerCase().includes(productSearch.toLowerCase()) ||
    (p.baseSku && p.baseSku.toLowerCase().includes(productSearch.toLowerCase())) ||
    (p.barcode && p.barcode.toLowerCase().includes(productSearch.toLowerCase()))
  );

  const filteredSuppliers = suppliers.filter(s => 
    (s.name && s.name.toLowerCase().includes(supplierSearch.toLowerCase())) ||
    (s.companyName && s.companyName.toLowerCase().includes(supplierSearch.toLowerCase())) ||
    (s.phone && s.phone.includes(supplierSearch)) ||
    (s.gstNumber && s.gstNumber.toLowerCase().includes(supplierSearch.toLowerCase()))
  );

  const rootCategories = categories.filter(c => !c.parentCategory);
  const subcategoriesForSelectedCat = categories.filter(c => 
    c.parentCategory && (c.parentCategory._id === quickProductData.category || c.parentCategory === quickProductData.category)
  );

  return (
    <div className="report-page">
      <div className="report-header mb-4">
        <div className="report-header-left">
          <h3 className="report-title mb-1">Smart Procurement & Stock Entry</h3>
          <p className="text-muted font-size-14 mb-0">High-velocity ERP stock inwarding with auto-prefill, unit conversion math, and inline entity creation.</p>
        </div>
        <div className="report-header-right d-flex gap-3 align-items-center">
          <Button as={Link} to="/inventory/logs" variant="outline-secondary" className="d-inline-flex align-items-center gap-2">
            <ClipboardList size={16} /> View Inventory Logs
          </Button>
        </div>
      </div>

      <InventoryStatCards />

      {message && (
        <Alert variant="success" className="d-flex align-items-center gap-2 mt-3 shadow-sm">
          <CheckCircle size={18} />
          <span>{message}</span>
        </Alert>
      )}

      {/* Main Stock Entry Form Card */}
      <Card className="report-section-card border-0 mt-3 shadow-sm">
        <Card.Header className="bg-transparent border-bottom border-secondary-subtle pt-4 pb-3 px-4 d-flex justify-content-between align-items-center">
          <div className="d-flex align-items-center gap-2">
            <PackagePlus size={20} className="text-primary" />
            <h5 className="mb-0 fw-bold">Record Stock Inward Batch</h5>
          </div>
          {selectedProduct && (
            <Badge bg="primary-subtle" className="text-primary font-size-12 px-3 py-2 border border-primary-subtle">
              Selected: {selectedProduct.name} ({selectedProduct.baseUnit})
            </Badge>
          )}
        </Card.Header>
        <Card.Body className="p-4">
          <Form onSubmit={handleSubmit}>
            <Row className="g-4">
              
              {/* --- 1. SMART PRODUCT SELECTOR --- */}
              <Col md={6}>
                <Form.Group className="position-relative" ref={productDropdownRef}>
                  <div className="d-flex justify-content-between align-items-center mb-1">
                    <Form.Label className="fw-medium mb-0">Select Product *</Form.Label>
                    <Button 
                      variant="link" 
                      className="p-0 text-decoration-none font-size-12 fw-bold d-flex align-items-center gap-1"
                      onClick={() => {
                        setQuickProductData(prev => ({ ...prev, name: productSearch }));
                        setShowQuickProductModal(true);
                      }}
                    >
                      <Plus size={14} /> New Product
                    </Button>
                  </div>

                  {selectedProduct ? (
                    <div className="smart-selected-pill p-2 px-3 d-flex align-items-center justify-content-between shadow-sm">
                      <div className="d-flex align-items-center gap-2">
                        <div className="bg-primary text-white rounded p-2 d-flex align-items-center justify-content-center">
                          <PackagePlus size={18} />
                        </div>
                        <div>
                          <div className="fw-bold font-size-14 text-body">{selectedProduct.name}</div>
                          <small className="text-muted font-size-11">
                            Base: <Badge bg="secondary" className="font-size-10">{selectedProduct.baseUnit || 'PCS'}</Badge> | SKU: <code>{selectedProduct.baseSku || '-'}</code> | Stock: <strong className="text-body">{selectedProduct.stock || 0}</strong>
                            {selectedProduct.brand && <span> | {selectedProduct.brand}</span>}
                          </small>
                        </div>
                      </div>
                      <Button 
                        variant="outline-secondary" 
                        size="sm" 
                        className="py-1 px-2 font-size-12 d-flex align-items-center gap-1"
                        onClick={() => { 
                          setSelectedProduct(null); 
                          setProductSearch(''); 
                          setFormData(p => ({ ...p, productId: '' })); 
                          setSupplierHistory(null); 
                          setAutoFillContext(null); 
                        }}
                      >
                        <X size={14} /> Change
                      </Button>
                    </div>
                  ) : (
                    <>
                      <InputGroup>
                        <InputGroup.Text className="bg-body-secondary text-muted border-end-0">
                          <Search size={16} />
                        </InputGroup.Text>
                        <Form.Control 
                          placeholder="Type product name, SKU, or barcode..."
                          value={productSearch}
                          onChange={e => {
                            setProductSearch(e.target.value);
                            setShowProductDropdown(true);
                          }}
                          onFocus={() => setShowProductDropdown(true)}
                          className="py-2 border-start-0"
                          autoComplete="off"
                        />
                      </InputGroup>

                      {/* Autocomplete Dropdown */}
                      {showProductDropdown && (
                        <div className="smart-autocomplete-menu">
                          {filteredProducts.length > 0 ? (
                            filteredProducts.map(p => (
                              <button
                                key={p._id}
                                type="button"
                                className="smart-autocomplete-item"
                                onClick={() => handleSelectProduct(p)}
                              >
                                <div>
                                  <div className="fw-bold font-size-13">{p.name}</div>
                                  <small className="text-muted font-size-11">
                                    Base: <Badge bg="secondary" className="font-size-10">{p.baseUnit || 'PCS'}</Badge> | SKU: {p.baseSku || '-'}
                                    {p.brand && <span> | {p.brand}</span>}
                                  </small>
                                </div>
                                <div className="text-end">
                                  <div className="fw-bold text-primary font-size-13">{formatCurrency(p.sellingPrice || p.mrp || 0)}</div>
                                  <small className="text-muted font-size-11">Stock: {p.stock || 0}</small>
                                </div>
                              </button>
                            ))
                          ) : (
                            <div className="p-3 text-center bg-body-tertiary">
                              <p className="text-muted small mb-2">No product matching "<strong>{productSearch}</strong>"</p>
                              <Button 
                                variant="primary" 
                                size="sm" 
                                className="d-inline-flex align-items-center gap-1"
                                onClick={() => {
                                  setQuickProductData(prev => ({ ...prev, name: productSearch }));
                                  setShowProductDropdown(false);
                                  setShowQuickProductModal(true);
                                }}
                              >
                                <Plus size={14} /> Create "{productSearch}"
                              </Button>
                            </div>
                          )}
                        </div>
                      )}
                    </>
                  )}
                </Form.Group>
              </Col>

              {/* --- 2. SMART SUPPLIER SELECTOR --- */}
              <Col md={6}>
                <Form.Group className="position-relative" ref={supplierDropdownRef}>
                  <div className="d-flex justify-content-between align-items-center mb-1">
                    <Form.Label className="fw-medium mb-0">Supplier / Vendor *</Form.Label>
                    <Button 
                      variant="link" 
                      className="p-0 text-decoration-none font-size-12 fw-bold d-flex align-items-center gap-1"
                      onClick={() => {
                        setQuickSupplierData(prev => ({ ...prev, name: supplierSearch, companyName: supplierSearch }));
                        setShowQuickSupplierModal(true);
                      }}
                    >
                      <Plus size={14} /> New Supplier
                    </Button>
                  </div>

                  {formData.supplierId && suppliers.find(s => s._id === formData.supplierId) ? (
                    (() => {
                      const activeSupp = suppliers.find(s => s._id === formData.supplierId);
                      const isPreferred = selectedProduct?.preferredSupplier?._id === activeSupp._id || selectedProduct?.preferredSupplier === activeSupp._id;
                      return (
                        <div className="smart-selected-pill p-2 px-3 d-flex align-items-center justify-content-between shadow-sm">
                          <div className="d-flex align-items-center gap-2">
                            <div className="bg-success text-white rounded p-2 d-flex align-items-center justify-content-center">
                              <Building size={18} />
                            </div>
                            <div>
                              <div className="fw-bold font-size-14 text-body d-flex align-items-center gap-1">
                                {activeSupp.companyName || activeSupp.name}
                                {isPreferred && (
                                  <Badge bg="warning" className="text-dark font-size-10 d-inline-flex align-items-center gap-1">
                                    <Star size={10} fill="currentColor" /> Preferred
                                  </Badge>
                                )}
                              </div>
                              <small className="text-muted font-size-11">
                                Contact: {activeSupp.contactPerson || activeSupp.name} | Phone: {activeSupp.phone}
                                {activeSupp.gstNumber && <span> | GST: <code>{activeSupp.gstNumber}</code></span>}
                              </small>
                            </div>
                          </div>
                          <Button 
                            variant="outline-secondary" 
                            size="sm" 
                            className="py-1 px-2 font-size-12 d-flex align-items-center gap-1"
                            onClick={() => { 
                              setFormData(p => ({ ...p, supplierId: '' })); 
                              setSupplierSearch(''); 
                            }}
                          >
                            <X size={14} /> Change
                          </Button>
                        </div>
                      );
                    })()
                  ) : (
                    <>
                      <InputGroup>
                        <InputGroup.Text className="bg-body-secondary text-muted border-end-0">
                          <Building size={16} />
                        </InputGroup.Text>
                        <Form.Control 
                          placeholder="Type vendor name, GSTIN, or phone..."
                          value={supplierSearch}
                          onChange={e => {
                            setSupplierSearch(e.target.value);
                            setShowSupplierDropdown(true);
                          }}
                          onFocus={() => setShowSupplierDropdown(true)}
                          className="py-2 border-start-0"
                          autoComplete="off"
                        />
                      </InputGroup>

                      {/* Autocomplete Dropdown */}
                      {showSupplierDropdown && (
                        <div className="smart-autocomplete-menu">
                          {filteredSuppliers.length > 0 ? (
                            filteredSuppliers.map(s => {
                              const isPreferred = selectedProduct?.preferredSupplier?._id === s._id || selectedProduct?.preferredSupplier === s._id;
                              return (
                                <button
                                  key={s._id}
                                  type="button"
                                  className="smart-autocomplete-item"
                                  onClick={() => handleSelectSupplier(s)}
                                >
                                  <div>
                                    <div className="fw-bold font-size-13 d-flex align-items-center gap-1">
                                      {s.companyName || s.name}
                                      {isPreferred && (
                                        <Badge bg="warning" className="text-dark font-size-10 d-inline-flex align-items-center gap-1">
                                          <Star size={10} fill="currentColor" /> Preferred
                                        </Badge>
                                      )}
                                    </div>
                                    <small className="text-muted font-size-11">
                                      Contact: {s.contactPerson || s.name} | Phone: {s.phone}
                                      {s.gstNumber && <span> | GST: {s.gstNumber}</span>}
                                    </small>
                                  </div>
                                  <Badge bg="secondary" className="font-size-10">
                                    {s.paymentTerms || 'Immediate'}
                                  </Badge>
                                </button>
                              );
                            })
                          ) : (
                            <div className="p-3 text-center bg-body-tertiary">
                              <p className="text-muted small mb-2">No supplier matching "<strong>{supplierSearch}</strong>"</p>
                              <Button 
                                variant="primary" 
                                size="sm" 
                                className="d-inline-flex align-items-center gap-1"
                                onClick={() => {
                                  setQuickSupplierData(prev => ({ ...prev, name: supplierSearch, companyName: supplierSearch }));
                                  setShowSupplierDropdown(false);
                                  setShowQuickSupplierModal(true);
                                }}
                              >
                                <Plus size={14} /> Create "{supplierSearch}"
                              </Button>
                            </div>
                          )}
                        </div>
                      )}
                    </>
                  )}
                </Form.Group>
              </Col>

              {/* --- AUTO-FILL TRANSPARENCY CONTEXT BANNER --- */}
              {autoFillContext && (
                <Col md={12}>
                  <div className="p-3 bg-primary-subtle text-primary border border-primary-subtle rounded d-flex align-items-center justify-content-between flex-wrap gap-2">
                    <div className="d-flex align-items-center gap-2">
                      <Sparkles size={18} className="text-primary flex-shrink-0" />
                      <span className="font-size-13">
                        <strong>Auto-filled from Purchase Intelligence:</strong> Last supplied by <strong>{autoFillContext.supplierName}</strong> {autoFillContext.isPreferred && '⭐ (Preferred)'} at <strong>{formatCurrency(autoFillContext.unitCost)} / {autoFillContext.unit}</strong> {autoFillContext.purchaseDate && `on ${formatDate(autoFillContext.purchaseDate)}`}.
                      </span>
                    </div>
                    <small className="text-muted fst-italic">All fields remain fully editable</small>
                  </div>
                </Col>
              )}

              {/* --- 3. VARIANT SELECTION (WITH QUICK CREATE) --- */}
              <Col md={6}>
                <Form.Group>
                  <div className="d-flex justify-content-between align-items-center mb-1">
                    <Form.Label className="fw-medium mb-0">Product Variant (Optional)</Form.Label>
                    {selectedProduct && (
                      <Button 
                        variant="link" 
                        className="p-0 text-decoration-none font-size-12 fw-bold d-flex align-items-center gap-1"
                        onClick={() => setShowQuickVariantModal(true)}
                      >
                        <Plus size={14} /> New Variant
                      </Button>
                    )}
                  </div>
                  <Form.Select 
                    value={formData.variantId} 
                    onChange={e => setFormData({ ...formData, variantId: e.target.value })} 
                    className="py-2"
                  >
                    <option value="">{variants.length === 0 ? 'No Variants (Standard Base Product)' : 'Select Variant (or leave blank for Base Bulk)'}</option>
                    {variants.map(v => (
                      <option key={v._id} value={v._id}>
                        {v.name} ({v.sku}) - Conversion: {v.conversionFactor || 1} {v.conversionUnit || selectedProduct?.baseUnit}
                      </option>
                    ))}
                  </Form.Select>
                </Form.Group>
              </Col>

              {/* --- 4. BATCH NUMBER --- */}
              <Col md={6}>
                <Form.Group>
                  <Form.Label className="fw-medium">Batch Number *</Form.Label>
                  <Form.Control 
                    value={formData.batchNumber} 
                    onChange={e => setFormData({ ...formData, batchNumber: e.target.value })} 
                    placeholder="e.g. BATCH-2026-01" 
                    required 
                    className="py-2 font-monospace"
                  />
                </Form.Group>
              </Col>

              {/* --- 5. QUANTITY & PROCUREMENT UNIT --- */}
              <Col md={3}>
                <Form.Group>
                  <Form.Label className="fw-medium">Purchased Quantity *</Form.Label>
                  <Form.Control 
                    type="number" 
                    step="0.001" 
                    value={formData.quantity} 
                    onChange={e => setFormData({ ...formData, quantity: e.target.value })} 
                    placeholder="e.g. 10 or 25.5" 
                    required 
                    className="py-2"
                  />
                </Form.Group>
              </Col>

              <Col md={3}>
                <Form.Group>
                  <Form.Label className="fw-medium">Procurement Unit *</Form.Label>
                  <Form.Select 
                    value={formData.unit} 
                    onChange={e => setFormData({ ...formData, unit: e.target.value })} 
                    required 
                    className="py-2"
                  >
                    {selectedProduct?.purchaseUnit && selectedProduct.purchaseUnit !== selectedProduct.baseUnit && (
                      <option value={selectedProduct.purchaseUnit}>
                        {selectedProduct.purchaseUnit} (Commercial: 1 {selectedProduct.purchaseUnit} = {selectedProduct.purchaseToStockFactor} {selectedProduct.baseUnit})
                      </option>
                    )}
                    <option value={selectedProduct?.baseUnit || 'PCS'}>
                      {selectedProduct?.baseUnit || 'PCS'} (Base Stock Unit)
                    </option>
                    <option value="BAG">BAG</option>
                    <option value="BOX">BOX</option>
                    <option value="CRATE">CRATE</option>
                    <option value="KG">KG</option>
                    <option value="LTR">LTR</option>
                    <option value="PCS">PCS</option>
                    <option value="PACK">PACK</option>
                  </Form.Select>
                </Form.Group>
              </Col>

              {/* --- 6. DUAL COST ENGINE --- */}
              <Col md={3}>
                <Form.Group>
                  <Form.Label className="fw-medium">Unit Cost (₹ / {formData.unit || 'unit'}) *</Form.Label>
                  <Form.Control 
                    type="number" 
                    step="0.01" 
                    value={formData.unitCost} 
                    onChange={e => setFormData({ ...formData, unitCost: e.target.value, totalCost: '' })} 
                    placeholder="0.00" 
                    required 
                    className="py-2"
                  />
                </Form.Group>
              </Col>

              <Col md={3}>
                <Form.Group>
                  <Form.Label className="fw-medium">Total Purchase Cost (₹)</Form.Label>
                  <Form.Control 
                    type="number" 
                    step="0.01" 
                    value={formData.totalCost || (qty && cost ? totalCalculatedCost : '')} 
                    onChange={e => setFormData({ ...formData, totalCost: e.target.value })} 
                    placeholder="Auto: Qty × Unit Cost" 
                    className="py-2"
                  />
                </Form.Group>
              </Col>

              {/* --- 7. REAL-TIME VALUATION & CONVERSION CARD --- */}
              {selectedProduct && qty > 0 && (
                <Col md={12}>
                  <div className="p-3 bg-body-tertiary rounded border d-flex flex-wrap justify-content-between align-items-center gap-3">
                    <div className="d-flex align-items-center gap-2">
                      <Calculator size={20} className="text-primary" />
                      <div>
                        <strong className="d-block font-size-14">Inward Conversion & Retail Stock Impact:</strong>
                        <span className="text-muted font-size-13">
                          Receiving <strong>{qty} {formData.unit}</strong> $\rightarrow$ Adding <strong className="text-success">{baseStockAdded} {selectedProduct.baseUnit}</strong> to retail inventory
                        </span>
                      </div>
                    </div>
                    <div className="d-flex gap-4 text-end">
                      <div>
                        <div className="text-muted font-size-11">Cost per Base Unit</div>
                        <div className="fw-bold">{formatCurrency(basePerUnitCost)} / {selectedProduct.baseUnit}</div>
                      </div>
                      <div className="border-start ps-4">
                        <div className="text-muted font-size-11">Total Purchase Value</div>
                        <div className="fw-bold text-primary fs-6">{formatCurrency(totalCalculatedCost)}</div>
                      </div>
                    </div>
                  </div>
                </Col>
              )}

              {/* --- 8. DATES & EXPIRY --- */}
              <Col md={6}>
                <Form.Group>
                  <Form.Label className="fw-medium">Manufacturing Date</Form.Label>
                  <Form.Control 
                    type="date" 
                    value={formData.manufacturingDate} 
                    onChange={e => setFormData({ ...formData, manufacturingDate: e.target.value })} 
                    className="py-2"
                  />
                </Form.Group>
              </Col>

              <Col md={6}>
                <Form.Group>
                  <div className="d-flex justify-content-between align-items-center mb-1">
                    <Form.Label className="fw-medium mb-0">
                      Expiry Date {selectedProduct?.hasExpiryTracking && <span className="text-danger">*</span>}
                    </Form.Label>
                    {selectedProduct && (
                      <Badge bg={selectedProduct.hasExpiryTracking ? 'warning' : 'secondary'} className={selectedProduct.hasExpiryTracking ? 'text-dark' : ''}>
                        {selectedProduct.hasExpiryTracking ? 'Perishable (FEFO Tracking Required)' : 'Non-Perishable (FIFO Default)'}
                      </Badge>
                    )}
                  </div>
                  <Form.Control 
                    type="date" 
                    value={formData.expiryDate} 
                    onChange={e => setFormData({ ...formData, expiryDate: e.target.value })} 
                    required={selectedProduct?.hasExpiryTracking}
                    disabled={selectedProduct && !selectedProduct.hasExpiryTracking}
                    className="py-2"
                  />
                  {selectedProduct && !selectedProduct.hasExpiryTracking && (
                    <Form.Text className="text-muted font-size-11">
                      Expiry tracking disabled for this item. Expiry date will be saved as null.
                    </Form.Text>
                  )}
                </Form.Group>
              </Col>

              {/* --- 9. NOTES --- */}
              <Col md={12}>
                <Form.Group>
                  <Form.Label className="fw-medium">Inward Challan / Invoice Reference Notes</Form.Label>
                  <Form.Control 
                    as="textarea" 
                    rows={2} 
                    value={formData.note} 
                    onChange={e => setFormData({ ...formData, note: e.target.value })} 
                    placeholder="Supplier invoice number, freight details, vehicle number..." 
                  />
                </Form.Group>
              </Col>
            </Row>

            <div className="d-flex justify-content-end gap-2 mt-4 pt-3 border-top">
              <Button 
                variant="outline-secondary" 
                onClick={() => {
                  setFormData({ productId: '', variantId: '', supplierId: '', batchNumber: '', quantity: '', unit: '', unitCost: '', totalCost: '', manufacturingDate: '', expiryDate: '', note: '' });
                  setSelectedProduct(null);
                  setProductSearch('');
                  setSupplierSearch('');
                  setAutoFillContext(null);
                }}
              >
                Reset
              </Button>
              <Button variant="primary" type="submit" disabled={loading} className="px-4">
                {loading ? 'Recording Inward Batch...' : 'Add Stock Entry'}
              </Button>
            </div>
          </Form>
        </Card.Body>
      </Card>

      {/* ========================================================================= */}
      {/* QUICK CREATE MODALS (ZERO PAGE NAVIGATION)                                */}
      {/* ========================================================================= */}

      {/* QUICK CREATE PRODUCT MODAL */}
      <Modal show={showQuickProductModal} onHide={() => setShowQuickProductModal(false)} size="lg" centered>
        <Modal.Header closeButton>
          <Modal.Title className="fw-bold d-flex align-items-center gap-2">
            <PackagePlus size={20} className="text-primary" /> Quick Create Product
          </Modal.Title>
        </Modal.Header>
        <Form onSubmit={handleQuickCreateProduct}>
          <Modal.Body className="p-4">
            <Row className="g-3">
              <Col md={12}>
                <Form.Group>
                  <Form.Label className="fw-medium">Product Name *</Form.Label>
                  <Form.Control 
                    value={quickProductData.name} 
                    onChange={e => setQuickProductData({ ...quickProductData, name: e.target.value })} 
                    placeholder="e.g. Fortune Basmati Rice, Tata Salt" 
                    required 
                    autoFocus
                  />
                </Form.Group>
              </Col>

              <Col md={6}>
                <Form.Group>
                  <div className="d-flex justify-content-between align-items-center mb-1">
                    <Form.Label className="fw-medium mb-0">Category *</Form.Label>
                    <Button 
                      variant="link" 
                      className="p-0 text-decoration-none font-size-11 fw-bold"
                      onClick={() => {
                        setQuickCategoryParentId('');
                        setShowQuickCategoryModal(true);
                      }}
                    >
                      + New Category
                    </Button>
                  </div>
                  <Form.Select 
                    value={quickProductData.category} 
                    onChange={e => setQuickProductData({ ...quickProductData, category: e.target.value, subcategory: '' })}
                    required
                  >
                    <option value="">Select Category...</option>
                    {rootCategories.map(c => (
                      <option key={c._id} value={c._id}>{c.name}</option>
                    ))}
                  </Form.Select>
                </Form.Group>
              </Col>

              <Col md={6}>
                <Form.Group>
                  <div className="d-flex justify-content-between align-items-center mb-1">
                    <Form.Label className="fw-medium mb-0">Subcategory</Form.Label>
                    {quickProductData.category && (
                      <Button 
                        variant="link" 
                        className="p-0 text-decoration-none font-size-11 fw-bold"
                        onClick={() => {
                          setQuickCategoryParentId(quickProductData.category);
                          setShowQuickCategoryModal(true);
                        }}
                      >
                        + New Subcategory
                      </Button>
                    )}
                  </div>
                  <Form.Select 
                    value={quickProductData.subcategory} 
                    onChange={e => setQuickProductData({ ...quickProductData, subcategory: e.target.value })}
                    disabled={!quickProductData.category || subcategoriesForSelectedCat.length === 0}
                  >
                    <option value="">None (Top-Level)</option>
                    {subcategoriesForSelectedCat.map(s => (
                      <option key={s._id} value={s._id}>{s.name}</option>
                    ))}
                  </Form.Select>
                </Form.Group>
              </Col>

              <Col md={4}>
                <Form.Group>
                  <Form.Label className="fw-medium">Product Type</Form.Label>
                  <Form.Select 
                    value={quickProductData.productType} 
                    onChange={e => setQuickProductData({ ...quickProductData, productType: e.target.value })}
                  >
                    <option value="PIECE">Piece / Count (PCS)</option>
                    <option value="WEIGHT">Weight (KG/GM)</option>
                    <option value="VOLUME">Volume (LTR/ML)</option>
                    <option value="PACK">Pack / Multi-pack</option>
                  </Form.Select>
                </Form.Group>
              </Col>

              <Col md={4}>
                <Form.Group>
                  <Form.Label className="fw-medium">Base Inventory Unit</Form.Label>
                  <Form.Select 
                    value={quickProductData.baseUnit} 
                    onChange={e => setQuickProductData({ ...quickProductData, baseUnit: e.target.value, sellingUnit: e.target.value })}
                  >
                    <option value="PCS">PCS</option>
                    <option value="KG">KG</option>
                    <option value="GM">GM</option>
                    <option value="LTR">LTR</option>
                    <option value="ML">ML</option>
                    <option value="PACK">PACK</option>
                    <option value="BOX">BOX</option>
                  </Form.Select>
                </Form.Group>
              </Col>

              <Col md={4}>
                <Form.Group>
                  <Form.Label className="fw-medium">Purchase Unit</Form.Label>
                  <Form.Select 
                    value={quickProductData.purchaseUnit} 
                    onChange={e => setQuickProductData({ ...quickProductData, purchaseUnit: e.target.value })}
                  >
                    <option value={quickProductData.baseUnit}>{quickProductData.baseUnit} (Same as Base)</option>
                    <option value="BAG">BAG</option>
                    <option value="BOX">BOX</option>
                    <option value="CRATE">CRATE</option>
                    <option value="PACK">PACK</option>
                  </Form.Select>
                </Form.Group>
              </Col>

              {quickProductData.purchaseUnit !== quickProductData.baseUnit && (
                <Col md={12}>
                  <div className="p-3 bg-body-tertiary rounded border">
                    <Form.Label className="fw-medium font-size-13 mb-1">
                      Conversion Factor: 1 {quickProductData.purchaseUnit} = ? {quickProductData.baseUnit}
                    </Form.Label>
                    <Form.Control 
                      type="number" 
                      step="0.001" 
                      value={quickProductData.purchaseToStockFactor} 
                      onChange={e => setQuickProductData({ ...quickProductData, purchaseToStockFactor: e.target.value })}
                      placeholder="e.g. 50 (if 1 BAG = 50 KG)"
                    />
                  </div>
                </Col>
              )}

              <Col md={4}>
                <Form.Group>
                  <Form.Label className="fw-medium">Cost Price (₹)</Form.Label>
                  <Form.Control 
                    type="number" 
                    step="0.01" 
                    value={quickProductData.costPrice} 
                    onChange={e => setQuickProductData({ ...quickProductData, costPrice: e.target.value })}
                    placeholder="0.00" 
                  />
                </Form.Group>
              </Col>

              <Col md={4}>
                <Form.Group>
                  <Form.Label className="fw-medium">Selling Price (₹) *</Form.Label>
                  <Form.Control 
                    type="number" 
                    step="0.01" 
                    value={quickProductData.sellingPrice} 
                    onChange={e => setQuickProductData({ ...quickProductData, sellingPrice: e.target.value })}
                    placeholder="0.00" 
                    required 
                  />
                </Form.Group>
              </Col>

              <Col md={4}>
                <Form.Group>
                  <Form.Label className="fw-medium">GST Rate %</Form.Label>
                  <Form.Select 
                    value={quickProductData.taxRate} 
                    onChange={e => setQuickProductData({ ...quickProductData, taxRate: Number(e.target.value) })}
                  >
                    <option value={0}>0% (Exempt)</option>
                    <option value={5}>5% GST</option>
                    <option value={12}>12% GST</option>
                    <option value={18}>18% GST</option>
                    <option value={28}>28% GST</option>
                  </Form.Select>
                </Form.Group>
              </Col>

              <Col md={12}>
                <Form.Check 
                  type="switch"
                  id="quickExpirySwitch"
                  label="Enable Expiry Date Tracking (Perishable Good / FEFO)"
                  checked={quickProductData.hasExpiryTracking}
                  onChange={e => setQuickProductData({ ...quickProductData, hasExpiryTracking: e.target.checked })}
                  className="fw-medium"
                />
              </Col>
            </Row>
          </Modal.Body>
          <Modal.Footer>
            <Button variant="secondary" onClick={() => setShowQuickProductModal(false)}>Cancel</Button>
            <Button variant="primary" type="submit">Create & Auto-Select</Button>
          </Modal.Footer>
        </Form>
      </Modal>

      {/* QUICK CREATE SUPPLIER MODAL */}
      <Modal show={showQuickSupplierModal} onHide={() => setShowQuickSupplierModal(false)} size="lg" centered>
        <Modal.Header closeButton>
          <Modal.Title className="fw-bold d-flex align-items-center gap-2">
            <Building size={20} className="text-primary" /> Quick Create Supplier Profile
          </Modal.Title>
        </Modal.Header>
        <Form onSubmit={handleQuickCreateSupplier}>
          <Modal.Body className="p-4">
            <Row className="g-3">
              <Col md={6}>
                <Form.Group>
                  <Form.Label className="fw-medium">Supplier / Contact Name *</Form.Label>
                  <Form.Control 
                    value={quickSupplierData.name} 
                    onChange={e => setQuickSupplierData({ ...quickSupplierData, name: e.target.value })} 
                    placeholder="e.g. Reliance Retail / Ramesh Kumar" 
                    required 
                    autoFocus
                  />
                </Form.Group>
              </Col>

              <Col md={6}>
                <Form.Group>
                  <Form.Label className="fw-medium">Company Name</Form.Label>
                  <Form.Control 
                    value={quickSupplierData.companyName} 
                    onChange={e => setQuickSupplierData({ ...quickSupplierData, companyName: e.target.value })} 
                    placeholder="Registered business entity" 
                  />
                </Form.Group>
              </Col>

              <Col md={6}>
                <Form.Group>
                  <Form.Label className="fw-medium">Primary Phone *</Form.Label>
                  <Form.Control 
                    value={quickSupplierData.phone} 
                    onChange={e => setQuickSupplierData({ ...quickSupplierData, phone: e.target.value })} 
                    placeholder="10-digit mobile number" 
                    required 
                  />
                </Form.Group>
              </Col>

              <Col md={6}>
                <Form.Group>
                  <Form.Label className="fw-medium">Email Address</Form.Label>
                  <Form.Control 
                    type="email"
                    value={quickSupplierData.email} 
                    onChange={e => setQuickSupplierData({ ...quickSupplierData, email: e.target.value })} 
                    placeholder="orders@vendor.com" 
                  />
                </Form.Group>
              </Col>

              <Col md={6}>
                <Form.Group>
                  <Form.Label className="fw-medium">GSTIN Number</Form.Label>
                  <Form.Control 
                    value={quickSupplierData.gstNumber} 
                    onChange={e => setQuickSupplierData({ ...quickSupplierData, gstNumber: e.target.value.toUpperCase() })} 
                    placeholder="15-digit GSTIN (Optional)" 
                  />
                </Form.Group>
              </Col>

              <Col md={6}>
                <Form.Group>
                  <Form.Label className="fw-medium">Payment Terms</Form.Label>
                  <Form.Select 
                    value={quickSupplierData.paymentTerms} 
                    onChange={e => setQuickSupplierData({ ...quickSupplierData, paymentTerms: e.target.value })}
                  >
                    <option value="Immediate">Immediate / Advance</option>
                    <option value="Net 15">Net 15 Days</option>
                    <option value="Net 30">Net 30 Days</option>
                    <option value="Net 60">Net 60 Days</option>
                  </Form.Select>
                </Form.Group>
              </Col>
            </Row>
          </Modal.Body>
          <Modal.Footer>
            <Button variant="secondary" onClick={() => setShowQuickSupplierModal(false)}>Cancel</Button>
            <Button variant="primary" type="submit">Save & Auto-Select Supplier</Button>
          </Modal.Footer>
        </Form>
      </Modal>

      {/* QUICK CREATE CATEGORY MODAL */}
      <Modal show={showQuickCategoryModal} onHide={() => setShowQuickCategoryModal(false)} centered>
        <Modal.Header closeButton>
          <Modal.Title className="fw-bold">
            {quickCategoryParentId ? 'Create Subcategory' : 'Create Category'}
          </Modal.Title>
        </Modal.Header>
        <Form onSubmit={handleQuickCreateCategory}>
          <Modal.Body className="p-3">
            <Form.Group className="mb-3">
              <Form.Label className="fw-medium">Category Name *</Form.Label>
              <Form.Control 
                value={quickCategoryData.name} 
                onChange={e => setQuickCategoryData({ ...quickCategoryData, name: e.target.value })} 
                placeholder="e.g. Dairy & Eggs, Staples" 
                required 
                autoFocus
              />
            </Form.Group>
            {quickCategoryParentId && (
              <Form.Text className="text-muted font-size-12">
                This will be created as a subcategory under the active category.
              </Form.Text>
            )}
          </Modal.Body>
          <Modal.Footer>
            <Button variant="secondary" onClick={() => setShowQuickCategoryModal(false)}>Cancel</Button>
            <Button variant="primary" type="submit">Create Category</Button>
          </Modal.Footer>
        </Form>
      </Modal>

      {/* QUICK CREATE VARIANT MODAL */}
      <Modal show={showQuickVariantModal} onHide={() => setShowQuickVariantModal(false)} centered>
        <Modal.Header closeButton>
          <Modal.Title className="fw-bold">
            Add Variant to {selectedProduct?.name}
          </Modal.Title>
        </Modal.Header>
        <Form onSubmit={handleQuickCreateVariant}>
          <Modal.Body className="p-3">
            <Row className="g-3">
              <Col md={12}>
                <Form.Group>
                  <Form.Label className="fw-medium">Variant Title *</Form.Label>
                  <Form.Control 
                    value={quickVariantData.name} 
                    onChange={e => setQuickVariantData({ ...quickVariantData, name: e.target.value })} 
                    placeholder="e.g. 500g Pack, 1 Litre Bottle" 
                    required 
                    autoFocus
                  />
                </Form.Group>
              </Col>
              <Col md={6}>
                <Form.Group>
                  <Form.Label className="fw-medium">SKU</Form.Label>
                  <Form.Control 
                    value={quickVariantData.sku} 
                    onChange={e => setQuickVariantData({ ...quickVariantData, sku: e.target.value })} 
                    placeholder="Auto or custom SKU" 
                  />
                </Form.Group>
              </Col>
              <Col md={6}>
                <Form.Group>
                  <Form.Label className="fw-medium">Selling Price (₹)</Form.Label>
                  <Form.Control 
                    type="number" 
                    step="0.01" 
                    value={quickVariantData.sellingPrice} 
                    onChange={e => setQuickVariantData({ ...quickVariantData, sellingPrice: e.target.value })} 
                    placeholder="0.00" 
                  />
                </Form.Group>
              </Col>
              <Col md={6}>
                <Form.Group>
                  <Form.Label className="fw-medium">Conversion Factor</Form.Label>
                  <Form.Control 
                    type="number" 
                    step="0.001" 
                    value={quickVariantData.conversionFactor} 
                    onChange={e => setQuickVariantData({ ...quickVariantData, conversionFactor: e.target.value })} 
                    placeholder="e.g. 0.5 (for 500g from 1kg)" 
                  />
                </Form.Group>
              </Col>
              <Col md={6}>
                <Form.Group>
                  <Form.Label className="fw-medium">Conversion Unit</Form.Label>
                  <Form.Control 
                    value={quickVariantData.conversionUnit || selectedProduct?.baseUnit || 'KG'} 
                    onChange={e => setQuickVariantData({ ...quickVariantData, conversionUnit: e.target.value })} 
                  />
                </Form.Group>
              </Col>
            </Row>
          </Modal.Body>
          <Modal.Footer>
            <Button variant="secondary" onClick={() => setShowQuickVariantModal(false)}>Cancel</Button>
            <Button variant="primary" type="submit">Create Variant</Button>
          </Modal.Footer>
        </Form>
      </Modal>

    </div>
  );
}
