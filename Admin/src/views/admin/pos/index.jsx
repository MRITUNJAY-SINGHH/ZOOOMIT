import React, { useState, useEffect, useRef } from 'react';
<<<<<<< HEAD
import { Card, Row, Col, Table, Button, Form, InputGroup, Modal, Badge } from 'react-bootstrap';
import { useLocation, useNavigate } from 'react-router';
=======
import { Card, Row, Col, Table, Button, Form, InputGroup, Modal, Spinner, Badge } from 'react-bootstrap';
import { useLocation, useNavigate, useSearchParams } from 'react-router';
>>>>>>> b0c33b866999113e91051b3065362eadae55829f
import { fetchApi } from '@/utils/api';
import PageHeader from '@/components/common/PageHeader';
import ConfirmModal from '@/components/common/ConfirmModal';
import { formatCurrency } from '@/utils/format';
import InvoicePrintOut from './components/InvoicePrintOut';
import { toast } from 'react-hot-toast';
<<<<<<< HEAD
import { User, Search, Trash2, MapPin, Package, CreditCard, Banknote, Smartphone, PauseCircle, Calculator, Percent } from 'lucide-react';
=======
import { User, Phone, Mail, MapPin, Scale, Trash2, Plus, Minus, Calculator, RefreshCw } from 'lucide-react';
import { roundTo, multiply, calculateTax } from '@/utils/decimalUtils';
>>>>>>> b0c33b866999113e91051b3065362eadae55829f

export default function POSBilling() {
  const [cart, setCart] = useState([]);
  const [barcodeInput, setBarcodeInput] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [isSearching, setIsSearching] = useState(false);
  const [customer, setCustomer] = useState(null);
  const [customerInfo, setCustomerInfo] = useState({ name: '', phone: '', email: '', address: { street: '', city: '', state: '', zipCode: '' } });
  const [customerSuggestions, setCustomerSuggestions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [syncStatus, setSyncStatus] = useState('idle');
  const [storeSettings, setStoreSettings] = useState({ taxMode: 'INCLUSIVE' });
  
  const [holdModal, setHoldModal] = useState(false);
  const [holdName, setHoldName] = useState('');
  const [heldBills, setHeldBills] = useState([]);
  const [clearCartModal, setClearCartModal] = useState(false);
  
  const [billDiscount, setBillDiscount] = useState(0);
  const [billTaxRate, setBillTaxRate] = useState(0);
  
  const [invoiceToPrint, setInvoiceToPrint] = useState(null);

  const barcodeRef = useRef(null);
  const navigate = useNavigate();

  useEffect(() => {
    if (barcodeRef.current) barcodeRef.current.focus();
    loadHeldBills();
    loadStoreSettings();

    const handleOnline = () => {
      syncOfflineOrders();
    };
    window.addEventListener('online', handleOnline);
    return () => window.removeEventListener('online', handleOnline);
  }, []);

  const loadStoreSettings = async () => {
    try {
      const res = await fetchApi('/settings');
      if (res) setStoreSettings(res);
    } catch (e) {
      console.error(e);
    }
  };

  const loadHeldBills = async () => {
    try {
      const data = await fetchApi('/pos/hold');
      const localHolds = JSON.parse(localStorage.getItem('offline_holds') || '[]');
      setHeldBills([...localHolds, ...(data || [])]);
    } catch (e) { 
      const localHolds = JSON.parse(localStorage.getItem('offline_holds') || '[]');
      setHeldBills(localHolds);
    }
  };

  const handleSearchChange = async (e) => {
    const val = e.target.value;
    setBarcodeInput(val);
    if (!val.trim()) {
      setSearchResults([]);
      return;
    }
    
    setIsSearching(true);
    try {
<<<<<<< HEAD
      const response = await fetchApi(`/products?search=${val.trim()}&limit=8`);
=======
      const response = await fetchApi(`/products?search=${val.trim()}&limit=6`);
>>>>>>> b0c33b866999113e91051b3065362eadae55829f
      setSearchResults(response.data || []);
    } catch (err) {
      console.error(err);
    }
    setIsSearching(false);
  };

  const handleSelectProduct = (product) => {
    if (product.stock <= 0) {
      toast.error('Product is out of stock!');
      return;
    }
    addToCart(product);
    setBarcodeInput('');
    setSearchResults([]);
    if (barcodeRef.current) barcodeRef.current.focus();
  };

  const handleBarcodeSubmit = async (e) => {
    e.preventDefault();
    if (!barcodeInput.trim()) return;

    setLoading(true);
    try {
      const response = await fetchApi(`/products/barcode/${barcodeInput.trim()}`);
      if (response && response.data) {
<<<<<<< HEAD
        if (response.data.stock <= 0) {
          toast.error('Product is out of stock!');
        } else {
          handleSelectProduct(response.data);
        }
=======
        if (response.type === 'Variant' && response.variantData) {
          addToCart(response.data, response.variantData);
        } else {
          addToCart(response.data);
        }
        setBarcodeInput('');
        setSearchResults([]);
>>>>>>> b0c33b866999113e91051b3065362eadae55829f
      }
    } catch (err) {
      toast.error(err.message || 'Product not found');
    }
    setLoading(false);
  };

  const addToCart = (product, variant = null) => {
    const pId = product._id;
    const vId = variant?._id || null;
    const key = vId ? `${pId}-${vId}` : pId;

    const unit = variant ? variant.conversionUnit || product.sellingUnit || product.baseUnit || 'PCS' : product.sellingUnit || product.baseUnit || 'PCS';
    const price = variant?.sellingPrice || product.sellingPrice || product.mrp || 0;
    const step = product.qtyStep || 1;
    const initialQty = product.minSaleQty || 1;

    setCart(prev => {
<<<<<<< HEAD
      const existing = prev.find(item => item.productId === product._id);
      if (existing) {
        if (existing.qty + 1 > product.stock) {
          toast.error('Cannot exceed available stock');
          return prev;
        }
        return prev.map(item => item.productId === product._id ? { 
          ...item, 
          qty: item.qty + 1, 
          total: (item.qty + 1) * item.price 
        } : item);
=======
      const existingIndex = prev.findIndex(item => item.cartKey === key);
      if (existingIndex > -1) {
        const item = prev[existingIndex];
        const newQty = roundTo(item.qty + step, 3);
        const updated = [...prev];
        updated[existingIndex] = {
          ...item,
          qty: newQty,
          total: multiply(newQty, item.price, 2)
        };
        return updated;
>>>>>>> b0c33b866999113e91051b3065362eadae55829f
      }

      return [...prev, { 
<<<<<<< HEAD
        productId: product._id, 
        productName: product.name,
        sku: product.baseSku,
        barcode: product.barcode,
        price: product.sellingPrice || product.mrp, 
        qty: 1,
        maxStock: product.stock,
        itemDiscount: 0,
        total: product.sellingPrice || product.mrp 
=======
        cartKey: key,
        productId: pId, 
        variantId: vId,
        productName: variant ? `${product.name} (${variant.name})` : product.name,
        sku: variant?.sku || product.baseSku || '',
        barcode: variant?.barcode || product.barcode || '',
        unit,
        productType: product.productType || 'PIECE',
        qtyStep: step,
        taxRate: product.taxRate || 0,
        hsnCode: product.hsnCode || '',
        price, 
        qty: initialQty,
        total: multiply(initialQty, price, 2)
>>>>>>> b0c33b866999113e91051b3065362eadae55829f
      }];
    });
  };

<<<<<<< HEAD
  const updateQty = (id, delta, manualVal = null) => {
    setCart(prev => prev.map(item => {
      if (item.productId === id) {
        let newQty = manualVal !== null ? manualVal : item.qty + delta;
        if (isNaN(newQty) || newQty < 1) newQty = 1;
        if (newQty > item.maxStock) {
          toast.error(`Only ${item.maxStock} units available`);
          newQty = item.maxStock;
        }
        const netPrice = Math.max(0, item.price - item.itemDiscount);
        return { ...item, qty: newQty, total: newQty * netPrice };
=======
  const handleQtyChange = (cartKey, newQtyVal) => {
    const parsed = parseFloat(newQtyVal);
    setCart(prev => prev.map(item => {
      if (item.cartKey === cartKey) {
        const validQty = isNaN(parsed) || parsed <= 0 ? 0.001 : roundTo(parsed, 3);
        return {
          ...item,
          qty: isNaN(parsed) ? '' : validQty,
          total: multiply(validQty, item.price, 2)
        };
>>>>>>> b0c33b866999113e91051b3065362eadae55829f
      }
      return item;
    }));
  };

<<<<<<< HEAD
  const updateItemDiscount = (id, discountVal) => {
    setCart(prev => prev.map(item => {
      if (item.productId === id) {
        let disc = parseFloat(discountVal) || 0;
        if (disc < 0) disc = 0;
        if (disc > item.price) disc = item.price;
        const netPrice = item.price - disc;
        return { ...item, itemDiscount: disc, total: item.qty * netPrice };
=======
  const updateQtyStep = (cartKey, direction) => {
    setCart(prev => prev.map(item => {
      if (item.cartKey === cartKey) {
        const step = item.qtyStep || 1;
        const current = Number(item.qty) || 0;
        const target = direction > 0 ? current + step : current - step;
        const finalQty = Math.max(step, roundTo(target, 3));
        return {
          ...item,
          qty: finalQty,
          total: multiply(finalQty, item.price, 2)
        };
>>>>>>> b0c33b866999113e91051b3065362eadae55829f
      }
      return item;
    }));
  };

<<<<<<< HEAD
=======
  const removeItem = (cartKey) => setCart(prev => prev.filter(item => item.cartKey !== cartKey));
  const clearCart = () => {
    setCart([]);
    setClearCartModal(false);
  };

>>>>>>> b0c33b866999113e91051b3065362eadae55829f
  const handleCustomerPhoneChange = async (e) => {
    const phone = e.target.value;
    setCustomerInfo(prev => ({ ...prev, phone }));
    
    if (phone.length >= 4) {
      try {
        const res = await fetchApi(`/customers?search=${phone}&limit=5`);
        if (res.data) {
          setCustomerSuggestions(res.data);
          if (phone.length === 10) {
            const found = res.data.find(c => c.phone === phone);
            if (found) selectCustomer(found);
          }
        }
      } catch (err) {}
    } else {
      setCustomerSuggestions([]);
      if (customer && phone !== customer.phone) setCustomer(null);
    }
  };

  const selectCustomer = (found) => {
    setCustomer(found);
    setCustomerInfo(prev => ({
      ...prev,
      phone: found.phone || prev.phone,
      name: found.name || '',
      email: found.email || '',
      address: {
        street: found.addresses?.[0]?.street || '',
        city: found.addresses?.[0]?.city || '',
        state: found.addresses?.[0]?.state || '',
        zipCode: found.addresses?.[0]?.zipCode || ''
      }
    }));
    setCustomerSuggestions([]);
<<<<<<< HEAD
    toast.success('Customer selected');
  };

  const removeItem = (id) => setCart(prev => prev.filter(item => item.productId !== id));
  
  const clearCart = () => {
    setCart([]);
    setBillDiscount(0);
    setBillTaxRate(0);
    setClearCartModal(false);
  };

  const calculateTotals = () => {
    const subTotal = cart.reduce((acc, item) => acc + item.total, 0);
    const discountAmount = parseFloat(billDiscount) || 0;
    let netSubTotal = Math.max(0, subTotal - discountAmount);
    const taxAmount = (netSubTotal * (parseFloat(billTaxRate) || 0)) / 100;
    const grandTotal = netSubTotal + taxAmount;
    
    return { subTotal, discountAmount, taxAmount, grandTotal };
  };

  const totals = calculateTotals();
=======
    toast.success('Customer details auto-filled');
  };

  // Calculations for Order Totals and GST
  const taxMode = storeSettings.taxMode || 'INCLUSIVE';
  let totalGross = 0;
  let totalTaxable = 0;
  let totalTax = 0;
  let totalCgst = 0;
  let totalSgst = 0;

  cart.forEach(item => {
    const q = Number(item.qty) || 0;
    const taxBreakdown = calculateTax(item.price, q, item.taxRate || 0, taxMode);
    totalGross = roundTo(totalGross + (item.price * q), 2);
    totalTaxable = roundTo(totalTaxable + taxBreakdown.taxableAmount, 2);
    totalTax = roundTo(totalTax + taxBreakdown.taxAmount, 2);
    totalCgst = roundTo(totalCgst + taxBreakdown.cgst, 2);
    totalSgst = roundTo(totalSgst + taxBreakdown.sgst, 2);
  });

  const finalPayable = taxMode === 'EXCLUSIVE' ? roundTo(totalTaxable + totalTax, 2) : totalGross;
>>>>>>> b0c33b866999113e91051b3065362eadae55829f

  // --- HOLD BILL LOGIC ---
  const handleHoldBill = async () => {
    if (cart.length === 0) return toast.error('Cart is empty');
    setLoading(true);

    const payload = {
      referenceName: holdName,
      customer: customer ? customer._id : null,
      items: cart,
      totals: { subTotal: totalGross, tax: totalTax, discount: 0, amount: finalPayable }
    };

    try {
<<<<<<< HEAD
      await fetchApi('/pos/hold', {
        method: 'POST',
        body: JSON.stringify({
          referenceName: holdName,
          customer: customer ? customer._id : null,
          items: cart,
          totals: { subTotal: totals.subTotal, tax: totals.taxAmount, discount: totals.discountAmount, amount: totals.grandTotal }
        })
      });
      clearCart();
=======
      await fetchApi('/pos/hold', { method: 'POST', body: JSON.stringify(payload) });
      setCart([]);
>>>>>>> b0c33b866999113e91051b3065362eadae55829f
      setHoldModal(false);
      setHoldName('');
      toast.success('Bill placed on hold');
      loadHeldBills();
<<<<<<< HEAD
    } catch (e) { toast.error(e.message); }
=======
      toast.success('Bill placed on hold');
    } catch (e) { 
      const localHolds = JSON.parse(localStorage.getItem('offline_holds') || '[]');
      localHolds.push({ ...payload, _id: `local-hold-${Date.now()}`, isLocal: true });
      localStorage.setItem('offline_holds', JSON.stringify(localHolds));
      
      setCart([]);
      setHoldModal(false);
      setHoldName('');
      loadHeldBills();
      toast.success('Bill held locally (Offline)');
    }
>>>>>>> b0c33b866999113e91051b3065362eadae55829f
    setLoading(false);
  };

  const handleResumeBill = async (billId) => {
    setLoading(true);
    if (billId.toString().startsWith('local-hold-')) {
      const localHolds = JSON.parse(localStorage.getItem('offline_holds') || '[]');
      const bill = localHolds.find(b => b._id === billId);
      if (bill) {
        setCart(bill.items);
        setCustomer(null); 
        const newHolds = localHolds.filter(b => b._id !== billId);
        localStorage.setItem('offline_holds', JSON.stringify(newHolds));
        loadHeldBills();
        setLoading(false);
        return;
      }
    }

    try {
      const bill = await fetchApi(`/pos/hold/${billId}`);
      setCart(bill.items);
      setCustomer(bill.customer);
      await fetchApi(`/pos/hold/${billId}`, { method: 'DELETE' });
      toast.success('Bill resumed');
      loadHeldBills();
    } catch (e) { toast.error(e.message); }
    setLoading(false);
  };
  
  const handleDeleteHeldBill = async (billId) => {
    try {
      await fetchApi(`/pos/hold/${billId}`, { method: 'DELETE' });
      toast.success('Held bill deleted');
      loadHeldBills();
    } catch (e) { toast.error(e.message); }
  }

  // --- CHECKOUT LOGIC ---
  const checkout = async (paymentMethod) => {
    if (cart.length === 0) return toast.error('Cart is empty');
    setLoading(true);
<<<<<<< HEAD
    try {
      const payload = {
        customer: customer ? customer._id : null,
        customerSnapshot: { 
          name: customerInfo.name || (customer ? customer.name : 'Walk-in'), 
          phone: customerInfo.phone || (customer ? customer.phone : undefined),
          email: customerInfo.email || undefined
        },
        customerAddress: customerInfo.address && (customerInfo.address.street || customerInfo.address.city) ? customerInfo.address : undefined,
        items: cart.map(i => ({
          productId: i.productId,
          productName: i.productName,
          sku: i.sku,
          barcode: i.barcode,
          price: i.price - i.itemDiscount, // Store net price after item discount
          qty: i.qty,
          total: i.total
        })),
        subTotal: totals.subTotal, 
        tax: totals.taxAmount, 
        discount: totals.discountAmount, 
        amount: totals.grandTotal,
        paymentMethod
      };
=======
>>>>>>> b0c33b866999113e91051b3065362eadae55829f

    const payload = {
      customer: customer ? customer._id : null,
      customerSnapshot: { 
        name: customerInfo.name || (customer ? customer.name : 'Walk-in'), 
        phone: customerInfo.phone || (customer ? customer.phone : undefined),
        email: customerInfo.email || undefined
      },
      customerAddress: customerInfo.address?.street ? customerInfo.address : undefined,
      items: cart.map(i => ({
        productId: i.productId,
        variantId: i.variantId,
        productName: i.productName,
        sku: i.sku,
        barcode: i.barcode,
        unit: i.unit,
        price: i.price,
        qty: Number(i.qty) || 1,
        taxRate: i.taxRate,
        hsnCode: i.hsnCode,
        total: i.total
      })),
      subTotal: totalGross,
      taxableAmount: totalTaxable,
      tax: totalTax,
      cgst: totalCgst,
      sgst: totalSgst,
      amount: finalPayable,
      paymentMethod,
      offlineId: `offline-${Date.now()}-${Math.floor(Math.random() * 1000)}`
    };

    try {
      const res = await fetchApi('/pos/checkout', { method: 'POST', body: JSON.stringify(payload) });
      
      toast.success('Payment successful!');
      clearCart();
      setCustomer(null);
      setCustomerInfo({ name: '', phone: '', email: '', address: { street: '', city: '', state: '', zipCode: '' } });
      setInvoiceToPrint(res.invoice);
    } catch (error) {
<<<<<<< HEAD
      toast.error(error.message || 'Checkout failed');
=======
      if (!window.navigator.onLine || error.message.includes('Failed to fetch')) {
        const offlineOrders = JSON.parse(localStorage.getItem('offline_orders') || '[]');
        const offlineInvoice = {
          _id: `offline-${Date.now()}`,
          invoiceNumber: `OFF-${Date.now()}`,
          createdAt: new Date(),
          customerSnapshot: { name: customerInfo.name || (customer ? customer.name : 'Walk-in') },
          productSnapshot: cart,
          totalsSnapshot: { subTotal: totalGross, taxableAmount: totalTaxable, tax: totalTax, cgst: totalCgst, sgst: totalSgst, amount: finalPayable },
          paymentMethod
        };
        offlineOrders.push({ payload, offlineInvoice });
        localStorage.setItem('offline_orders', JSON.stringify(offlineOrders));
        
        setCart([]);
        setCustomer(null);
        setCustomerInfo({ name: '', phone: '', email: '', address: { street: '', city: '', state: '', zipCode: '' } });
        setInvoiceToPrint(offlineInvoice);
        toast.success('Saved Offline! Will sync when connection is restored.');
      } else {
        toast.error(error.message);
      }
>>>>>>> b0c33b866999113e91051b3065362eadae55829f
    }
    setLoading(false);
  };

  const syncOfflineOrders = async () => {
    const offlineOrders = JSON.parse(localStorage.getItem('offline_orders') || '[]');
    if (offlineOrders.length === 0) return;
    
    setSyncStatus('syncing');
    try {
      const res = await fetchApi('/pos/sync', { method: 'POST', body: JSON.stringify({ offlineOrders }) });
      localStorage.setItem('offline_orders', JSON.stringify(res.failedOrders));
      
      if (res.failedOrders.length > 0) {
        toast.error(`Synced ${res.successCount} orders, ${res.failedOrders.length} failed.`);
        setSyncStatus('idle');
      } else {
        toast.success(`Successfully synced all ${res.successCount} offline orders!`);
        setSyncStatus('done');
        setTimeout(() => setSyncStatus('idle'), 3000);
      }
    } catch (e) {
      toast.error('Sync failed: ' + e.message);
      setSyncStatus('idle');
    }
  };

  if (invoiceToPrint) {
    return <InvoicePrintOut invoice={invoiceToPrint} onBack={() => setInvoiceToPrint(null)} />;
  }

  return (
    <div className="pos-billing-container">
      <PageHeader 
        title="POS Billing Terminal" 
        rightContent={
<<<<<<< HEAD
          <div className="d-flex gap-2">
            <Button variant="outline-primary" onClick={() => navigate('/pos/history')}>History / Returns</Button>
            <Button variant="danger" onClick={() => setClearCartModal(true)} disabled={cart.length === 0}>
              <Trash2 size={16} className="me-1" /> Clear
            </Button>
=======
          <div className="d-flex align-items-center gap-2">
            {JSON.parse(localStorage.getItem('offline_orders') || '[]').length > 0 && syncStatus === 'idle' && (
              <Button variant="warning" className="text-dark" onClick={syncOfflineOrders}>
                Pending Sync ({JSON.parse(localStorage.getItem('offline_orders') || '[]').length})
              </Button>
            )}
            {syncStatus === 'syncing' && (
              <Button variant="info" disabled>
                <Spinner size="sm" className="me-2" /> Syncing...
              </Button>
            )}
            <Button variant="secondary" onClick={() => navigate('/pos/history')}>History / Returns</Button>
            <Button variant="outline-danger" onClick={() => setClearCartModal(true)} disabled={cart.length === 0}>Clear Cart</Button>
>>>>>>> b0c33b866999113e91051b3065362eadae55829f
          </div>
        }
      />

      <Row className="g-3">
<<<<<<< HEAD
        {/* LEFT COLUMN - PRODUCTS & CART */}
        <Col lg={8}>
          <Card className="h-100 border-0 shadow-sm" style={{ backgroundColor: 'var(--bs-body-bg)' }}>
            <Card.Body className="p-0 d-flex flex-column">
              {/* Search Bar */}
              <div className="p-3 border-bottom position-relative bg-light rounded-top" style={{ zIndex: 10 }}>
=======
        {/* Left Side: Product Scanner & Cart */}
        <Col lg={8}>
          <Card className="border-0 shadow-sm mb-3">
            <Card.Body className="p-3">
              <div className="position-relative mb-3">
>>>>>>> b0c33b866999113e91051b3065362eadae55829f
                <Form onSubmit={handleBarcodeSubmit}>
                  <InputGroup size="lg" className="shadow-sm">
                    <InputGroup.Text className="bg-white border-end-0 text-muted">
                      <Search size={20} />
                    </InputGroup.Text>
                    <Form.Control 
                      ref={barcodeRef}
<<<<<<< HEAD
                      placeholder="Scan barcode or search by name, SKU..." 
=======
                      placeholder="Search product by name, SKU, or scan barcode (e.g. Sugar, Milk, 8901000000001)..." 
>>>>>>> b0c33b866999113e91051b3065362eadae55829f
                      value={barcodeInput}
                      onChange={handleSearchChange}
                      disabled={loading}
                      autoComplete="off"
<<<<<<< HEAD
                      className="border-start-0 ps-0"
                      style={{ boxShadow: 'none' }}
                    />
                    <Button type="submit" variant="primary" disabled={loading} className="px-4 fw-semibold">Add</Button>
=======
                      className="py-2"
                    />
                    <Button type="submit" variant="primary" disabled={loading} className="px-4">Add</Button>
>>>>>>> b0c33b866999113e91051b3065362eadae55829f
                  </InputGroup>
                </Form>
                
                {searchResults.length > 0 && (
<<<<<<< HEAD
                  <Card className="position-absolute w-100 mt-2 shadow-lg border-0" style={{ zIndex: 1050, maxHeight: '350px', overflowY: 'auto', left: 0 }}>
                    <div className="list-group list-group-flush">
                      {searchResults.map(prod => (
                        <button 
                          key={prod._id} 
                          className="list-group-item list-group-item-action d-flex justify-content-between align-items-center py-3"
                          onClick={() => handleSelectProduct(prod)}
                        >
                          <div className="d-flex align-items-center gap-3">
                            <div className="bg-light rounded p-2 d-flex align-items-center justify-content-center" style={{ width: 48, height: 48 }}>
                              <Package size={24} className="text-secondary" />
                            </div>
                            <div className="text-start">
                              <div className="fw-semibold fs-6">{prod.name}</div>
                              <small className="text-muted">SKU: {prod.baseSku} | Stock: {prod.stock}</small>
                            </div>
                          </div>
                          <div className="text-end">
                            <div className="fw-bold fs-6 text-primary">{formatCurrency(prod.sellingPrice || prod.mrp)}</div>
                            {prod.stock <= 0 && <Badge bg="danger">Out of Stock</Badge>}
                          </div>
                        </button>
                      ))}
                    </div>
                  </Card>
=======
                  <div className="smart-autocomplete-menu">
                    {searchResults.map(prod => (
                      <button 
                        key={prod._id} 
                        type="button"
                        className="smart-autocomplete-item"
                        onClick={() => handleSelectProduct(prod)}
                      >
                        <div className="text-start">
                          <div className="fw-bold font-size-13">{prod.name}</div>
                          <div className="text-muted font-size-11">
                            Unit: <Badge bg="secondary" className="font-size-10">{prod.baseUnit || 'PCS'}</Badge> | SKU: {prod.baseSku || '-'} | Barcode: {prod.barcode || '-'}
                          </div>
                        </div>
                        <div className="text-end">
                          <div className="fw-bold text-primary font-size-13">{formatCurrency(prod.sellingPrice || prod.mrp)}</div>
                          <small className="text-muted font-size-11">Stock: {prod.stock} {prod.baseUnit}</small>
                        </div>
                      </button>
                    ))}
                  </div>
>>>>>>> b0c33b866999113e91051b3065362eadae55829f
                )}
              </div>

              {/* Cart Table */}
<<<<<<< HEAD
              <div className="flex-grow-1 overflow-auto bg-white p-0">
                <Table hover responsive className="mb-0 align-middle">
                  <thead className="table-light sticky-top" style={{ zIndex: 1 }}>
                    <tr>
                      <th className="ps-4">Product</th>
                      <th className="text-center" style={{ width: '120px' }}>Price</th>
                      <th className="text-center" style={{ width: '100px' }}>Discount</th>
                      <th className="text-center" style={{ width: '140px' }}>Quantity</th>
                      <th className="text-end" style={{ width: '120px' }}>Total</th>
                      <th className="text-center pe-4" style={{ width: '60px' }}></th>
                    </tr>
                  </thead>
                  <tbody>
                    {cart.length === 0 ? (
                      <tr>
                        <td colSpan="6" className="text-center py-5">
                          <div className="d-flex flex-column align-items-center justify-content-center text-muted">
                            <Package size={48} className="mb-3 opacity-50" />
                            <h5 className="fw-normal">Cart is empty</h5>
                            <p className="small mb-0">Scan a barcode or search for a product to add it.</p>
                          </div>
                        </td>
                      </tr>
                    ) : cart.map(item => (
                      <tr key={item.productId}>
                        <td className="ps-4">
                          <div className="fw-semibold text-truncate" style={{ maxWidth: '200px' }} title={item.productName}>{item.productName}</div>
                          <div className="small text-muted">{item.sku}</div>
                        </td>
                        <td className="text-center">{formatCurrency(item.price)}</td>
                        <td className="text-center">
                          <InputGroup size="sm">
                            <InputGroup.Text className="px-1 text-muted">₹</InputGroup.Text>
                            <Form.Control 
                              type="number" 
                              min="0" 
                              max={item.price}
                              value={item.itemDiscount || ''} 
                              onChange={(e) => updateItemDiscount(item.productId, e.target.value)}
                              className="text-center px-1"
                            />
                          </InputGroup>
                        </td>
                        <td>
                          <InputGroup size="sm">
                            <Button variant="outline-secondary" onClick={() => updateQty(item.productId, -1)} className="px-2">-</Button>
                            <Form.Control 
                              type="number" 
                              min="1" 
                              value={item.qty} 
                              onChange={(e) => updateQty(item.productId, 0, parseInt(e.target.value) || 1)}
                              className="text-center px-1 fw-semibold"
                            />
                            <Button variant="outline-secondary" onClick={() => updateQty(item.productId, 1)} className="px-2">+</Button>
                          </InputGroup>
                        </td>
                        <td className="text-end fw-semibold">{formatCurrency(item.total)}</td>
                        <td className="text-center pe-4">
                          <Button variant="light" size="sm" className="text-danger border-0 p-1" onClick={() => removeItem(item.productId)}>
                            <Trash2 size={18} />
                          </Button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </Table>
              </div>
=======
              <Table responsive hover className="align-middle mb-0">
                <thead className="table-light">
                  <tr>
                    <th>Item & SKU</th>
                    <th>Price / Unit</th>
                    <th style={{ width: '180px' }}>Quantity</th>
                    <th className="text-end">Total (₹)</th>
                    <th style={{ width: '50px' }}></th>
                  </tr>
                </thead>
                <tbody>
                  {cart.length === 0 ? (
                    <tr>
                      <td colSpan="5" className="text-center py-5 text-muted">
                        Scan or search items to begin billing. Supports piece, weight (e.g. 1.20 KG), and pack items.
                      </td>
                    </tr>
                  ) : (
                    cart.map(item => (
                      <tr key={item.cartKey}>
                        <td>
                          <div className="fw-bold">{item.productName}</div>
                          <div className="text-muted font-size-11">
                            {item.sku && <span>SKU: {item.sku} • </span>}
                            <span>Tax: {item.taxRate}% GST</span>
                            {item.hsnCode && <span> • HSN: {item.hsnCode}</span>}
                          </div>
                        </td>
                        <td>
                          <div className="fw-medium">{formatCurrency(item.price)}</div>
                          <small className="text-muted font-size-11">per {item.unit}</small>
                        </td>
                        <td>
                          <div className="d-flex align-items-center gap-1">
                            <Button 
                              size="sm" 
                              variant="outline-secondary" 
                              className="px-2 py-1"
                              onClick={() => updateQtyStep(item.cartKey, -1)}
                            >
                              -
                            </Button>
                            <Form.Control 
                              type="number"
                              step="0.001"
                              value={item.qty}
                              onChange={e => handleQtyChange(item.cartKey, e.target.value)}
                              className="text-center px-1 py-1 fw-bold font-size-13"
                              style={{ width: '70px' }}
                            />
                            <Button 
                              size="sm" 
                              variant="outline-secondary" 
                              className="px-2 py-1"
                              onClick={() => updateQtyStep(item.cartKey, 1)}
                            >
                              +
                            </Button>
                            <Badge bg="light" className="text-dark border ms-1 font-size-11">
                              {item.unit}
                            </Badge>
                          </div>
                        </td>
                        <td className="text-end fw-bold fs-6">
                          {formatCurrency(item.total)}
                        </td>
                        <td className="text-center">
                          <Button size="sm" variant="link" className="text-danger p-0" onClick={() => removeItem(item.cartKey)}>
                            <Trash2 size={16} />
                          </Button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </Table>
>>>>>>> b0c33b866999113e91051b3065362eadae55829f
            </Card.Body>
          </Card>
        </Col>

<<<<<<< HEAD
        {/* RIGHT COLUMN - CUSTOMER, TOTALS, PAYMENT */}
        <Col lg={4}>
          <div className="d-flex flex-column gap-3 h-100">
            {/* Customer Section */}
            <Card className="border-0 shadow-sm flex-shrink-0">
              <Card.Body>
                <h6 className="mb-3 fw-bold d-flex align-items-center gap-2 text-uppercase text-muted" style={{ fontSize: '0.8rem', letterSpacing: '1px' }}>
                  <User size={16} /> Customer Details
                </h6>
                <div className="mb-3 position-relative">
                  <InputGroup size="sm">
                    <InputGroup.Text className="bg-light"><Phone size={14} /></InputGroup.Text>
                    <Form.Control placeholder="Phone Number" value={customerInfo.phone} onChange={handleCustomerPhoneChange} autoComplete="off" />
                  </InputGroup>
                  
                  {customerSuggestions.length > 0 && (
                    <Card className="position-absolute w-100 mt-1 shadow-lg border-0" style={{ zIndex: 1050, maxHeight: '200px', overflowY: 'auto' }}>
=======
        {/* Right Side: Customer Info & Live GST Checkout */}
        <Col lg={4}>
          <Card className="border-0 shadow-sm mb-3">
            <Card.Body className="p-3">
              {/* Customer Box */}
              <div className="p-3 rounded-3 bg-body-tertiary border mb-3">
                <h6 className="fw-bold mb-3 d-flex align-items-center gap-2">
                  <User size={16} className="text-primary" /> Customer Info
                </h6>
                <div className="mb-2 position-relative">
                  <Form.Control 
                    size="sm" 
                    placeholder="Phone Number (Auto-fetch)" 
                    value={customerInfo.phone} 
                    onChange={handleCustomerPhoneChange} 
                    autoComplete="off" 
                  />
                  {customerSuggestions.length > 0 && (
                    <Card className="position-absolute w-100 mt-1 shadow-lg border" style={{ zIndex: 1050, maxHeight: '180px', overflowY: 'auto' }}>
>>>>>>> b0c33b866999113e91051b3065362eadae55829f
                      <div className="list-group list-group-flush">
                        {customerSuggestions.map(cust => (
                          <button 
                            key={cust._id} 
                            type="button"
<<<<<<< HEAD
                            className="list-group-item list-group-item-action py-2"
                            onClick={() => selectCustomer(cust)}
                          >
                            <div className="fw-semibold">{cust.phone}</div>
                            <small className="text-muted">{cust.name || 'Walk-in'}</small>
=======
                            className="list-group-item list-group-item-action d-flex justify-content-between align-items-center p-2"
                            onClick={() => selectCustomer(cust)}
                          >
                            <div>
                              <div className="fw-bold">{cust.phone}</div>
                              <small className="text-muted">{cust.name || 'Walk-in'}</small>
                            </div>
                            <small className="text-primary">Select</small>
>>>>>>> b0c33b866999113e91051b3065362eadae55829f
                          </button>
                        ))}
                      </div>
                    </Card>
                  )}
                </div>
<<<<<<< HEAD
                
                <Row className="g-2 mb-2">
                  <Col>
                    <Form.Control size="sm" placeholder="Full Name" value={customerInfo.name} onChange={e => setCustomerInfo({...customerInfo, name: e.target.value})} />
                  </Col>
                </Row>
                <Row className="g-2">
                  <Col>
                    <InputGroup size="sm">
                      <InputGroup.Text className="bg-light"><MapPin size={14} /></InputGroup.Text>
                      <Form.Control placeholder="City / Address" value={customerInfo.address?.city || ''} onChange={e => setCustomerInfo({...customerInfo, address: { ...customerInfo.address, city: e.target.value }})} />
                    </InputGroup>
                  </Col>
                </Row>
=======
                <Form.Control 
                  size="sm" 
                  className="mb-2"
                  placeholder="Customer Name" 
                  value={customerInfo.name} 
                  onChange={e => setCustomerInfo({...customerInfo, name: e.target.value})} 
                />
              </div>

              {/* Live Totals & GST Summary */}
              <h6 className="fw-bold mb-3 d-flex align-items-center justify-content-between">
                <span>Bill Summary</span>
                <Badge bg="light" className="text-muted border font-size-11">
                  Tax Mode: {taxMode}
                </Badge>
              </h6>

              <div className="d-flex justify-content-between mb-2 font-size-13 text-muted">
                <span>Gross Subtotal:</span>
                <span>{formatCurrency(totalGross)}</span>
              </div>
              <div className="d-flex justify-content-between mb-2 font-size-13 text-muted">
                <span>Taxable Amount:</span>
                <span>{formatCurrency(totalTaxable)}</span>
              </div>
              {totalTax > 0 && (
                <>
                  <div className="d-flex justify-content-between mb-1 font-size-12 text-muted ps-2">
                    <span>• CGST:</span>
                    <span>{formatCurrency(totalCgst)}</span>
                  </div>
                  <div className="d-flex justify-content-between mb-2 font-size-12 text-muted ps-2">
                    <span>• SGST:</span>
                    <span>{formatCurrency(totalSgst)}</span>
                  </div>
                </>
              )}

              <hr className="my-2" />
              <div className="d-flex justify-content-between mb-3 fs-5">
                <strong className="text-body">Total Payable:</strong>
                <strong className="text-primary">{formatCurrency(finalPayable)}</strong>
              </div>

              {/* Payment Action Buttons */}
              <div className="d-grid gap-2">
                <Button variant="success" size="lg" className="fw-bold" onClick={() => checkout('Cash')} disabled={loading || cart.length === 0}>
                  Pay with Cash
                </Button>
                <div className="d-flex gap-2">
                  <Button variant="primary" className="flex-grow-1" onClick={() => checkout('UPI')} disabled={loading || cart.length === 0}>
                    UPI
                  </Button>
                  <Button variant="info" className="flex-grow-1 text-white" onClick={() => checkout('Card')} disabled={loading || cart.length === 0}>
                    Card
                  </Button>
                  <Button variant="outline-warning" onClick={() => setHoldModal(true)} disabled={loading || cart.length === 0}>
                    Hold
                  </Button>
                </div>
              </div>
            </Card.Body>
          </Card>

          {/* Held Bills Box */}
          {heldBills.length > 0 && (
            <Card className="border-0 shadow-sm">
              <Card.Header className="bg-transparent py-2">
                <strong className="font-size-13">Held Bills ({heldBills.length})</strong>
              </Card.Header>
              <Card.Body className="p-2">
                {heldBills.map(bill => (
                  <div key={bill._id} className="d-flex justify-content-between align-items-center p-2 rounded bg-body-tertiary mb-1">
                    <div>
                      <div className="fw-bold font-size-13">{bill.referenceName || 'Held Bill'}</div>
                      <small className="text-muted font-size-11">{formatCurrency(bill.totals?.amount || 0)} ({bill.items?.length || 0} items)</small>
                    </div>
                    <Button size="sm" variant="outline-primary" onClick={() => handleResumeBill(bill._id)}>Resume</Button>
                  </div>
                ))}
>>>>>>> b0c33b866999113e91051b3065362eadae55829f
              </Card.Body>
            </Card>

            {/* Calculations & Totals */}
            <Card className="border-0 shadow-sm flex-grow-1">
              <Card.Body className="d-flex flex-column p-0">
                <div className="p-4 flex-grow-1">
                  <Row className="g-3 mb-4">
                    <Col xs={6}>
                      <Form.Label className="text-muted small mb-1">Discount (₹)</Form.Label>
                      <InputGroup size="sm">
                        <InputGroup.Text><Percent size={14} /></InputGroup.Text>
                        <Form.Control type="number" min="0" placeholder="0" value={billDiscount || ''} onChange={(e) => setBillDiscount(e.target.value)} />
                      </InputGroup>
                    </Col>
                    <Col xs={6}>
                      <Form.Label className="text-muted small mb-1">GST Tax (%)</Form.Label>
                      <InputGroup size="sm">
                        <Form.Control type="number" min="0" max="100" placeholder="0" value={billTaxRate || ''} onChange={(e) => setBillTaxRate(e.target.value)} />
                        <InputGroup.Text>%</InputGroup.Text>
                      </InputGroup>
                    </Col>
                  </Row>

                  <div className="d-flex flex-column gap-2 mb-4">
                    <div className="d-flex justify-content-between text-muted">
                      <span>Subtotal</span>
                      <span className="fw-medium text-dark">{formatCurrency(totals.subTotal)}</span>
                    </div>
                    {totals.discountAmount > 0 && (
                      <div className="d-flex justify-content-between text-success">
                        <span>Discount</span>
                        <span>-{formatCurrency(totals.discountAmount)}</span>
                      </div>
                    )}
                    {totals.taxAmount > 0 && (
                      <div className="d-flex justify-content-between text-muted">
                        <span>Tax ({billTaxRate}%)</span>
                        <span className="fw-medium text-dark">+{formatCurrency(totals.taxAmount)}</span>
                      </div>
                    )}
                  </div>
                </div>

                <div className="bg-primary text-white p-4 rounded-bottom">
                  <div className="d-flex justify-content-between align-items-center mb-3">
                    <span className="fs-5 opacity-75">Grand Total</span>
                    <span className="fs-2 fw-bold">{formatCurrency(totals.grandTotal)}</span>
                  </div>
                  
                  <Row className="g-2">
                    <Col xs={6}>
                      <Button variant="light" className="w-100 fw-bold py-2 text-success d-flex align-items-center justify-content-center gap-2" onClick={() => checkout('Cash')} disabled={loading || cart.length === 0}>
                        <Banknote size={18} /> Cash
                      </Button>
                    </Col>
                    <Col xs={6}>
                      <Button variant="light" className="w-100 fw-bold py-2 text-primary d-flex align-items-center justify-content-center gap-2" onClick={() => checkout('UPI')} disabled={loading || cart.length === 0}>
                        <Smartphone size={18} /> UPI
                      </Button>
                    </Col>
                    <Col xs={6}>
                      <Button variant="light" className="w-100 fw-bold py-2 text-info d-flex align-items-center justify-content-center gap-2" onClick={() => checkout('Card')} disabled={loading || cart.length === 0}>
                        <CreditCard size={18} /> Card
                      </Button>
                    </Col>
                    <Col xs={6}>
                      <Button variant="light" className="w-100 fw-bold py-2 text-dark d-flex align-items-center justify-content-center gap-2" onClick={() => checkout('Online')} disabled={loading || cart.length === 0}>
                        <CreditCard size={18} /> Online
                      </Button>
                    </Col>
                  </Row>
                  
                  <Button variant="outline-light" className="w-100 mt-3 d-flex align-items-center justify-content-center gap-2" onClick={() => setHoldModal(true)} disabled={loading || cart.length === 0}>
                    <PauseCircle size={18} /> Hold Bill
                  </Button>
                </div>
              </Card.Body>
            </Card>
          </div>
        </Col>
      </Row>

<<<<<<< HEAD
      {/* HELD BILLS DRAWER / SECTION */}
      {heldBills.length > 0 && (
        <Card className="mt-4 border-0 shadow-sm">
          <Card.Header className="bg-white border-bottom-0 pt-4 pb-2">
            <h6 className="mb-0 fw-bold d-flex align-items-center gap-2"><PauseCircle size={18} className="text-warning"/> Held Bills</h6>
          </Card.Header>
          <Card.Body>
            <div className="d-flex flex-wrap gap-3">
              {heldBills.map(bill => (
                <Card key={bill._id} className="border shadow-none" style={{ width: '250px' }}>
                  <Card.Body className="p-3">
                    <div className="d-flex justify-content-between align-items-start mb-2">
                      <div className="fw-bold text-truncate">{bill.referenceName}</div>
                      <Badge bg="secondary">{bill.items.length} items</Badge>
                    </div>
                    <div className="text-muted small mb-3">{bill.customer?.name || 'Walk-in'} • {formatCurrency(bill.totals?.amount || 0)}</div>
                    <div className="d-flex gap-2">
                      <Button size="sm" variant="primary" className="flex-grow-1" onClick={() => handleResumeBill(bill._id)}>Resume</Button>
                      <Button size="sm" variant="outline-danger" onClick={() => handleDeleteHeldBill(bill._id)}><Trash2 size={14}/></Button>
                    </div>
                  </Card.Body>
                </Card>
              ))}
            </div>
          </Card.Body>
        </Card>
      )}

      {/* HOLD MODAL */}
      <Modal show={holdModal} onHide={() => setHoldModal(false)} centered>
        <Modal.Header closeButton className="border-0 pb-0">
          <Modal.Title className="fs-5 fw-bold">Hold Current Bill</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Form.Group>
            <Form.Label className="text-muted small">Reference Name</Form.Label>
            <Form.Control autoFocus type="text" value={holdName} onChange={e => setHoldName(e.target.value)} placeholder="e.g. Table 5, Waiting Customer" />
          </Form.Group>
        </Modal.Body>
        <Modal.Footer className="border-0 pt-0">
          <Button variant="light" onClick={() => setHoldModal(false)}>Cancel</Button>
          <Button variant="warning" className="px-4" onClick={handleHoldBill} disabled={!holdName || loading}>Save Hold</Button>
=======
      {/* Hold Bill Modal */}
      <Modal show={holdModal} onHide={() => setHoldModal(false)} centered>
        <Modal.Header closeButton><Modal.Title>Hold Current Bill</Modal.Title></Modal.Header>
        <Modal.Body>
          <Form.Group>
            <Form.Label>Reference Label / Customer Name</Form.Label>
            <Form.Control 
              type="text" 
              value={holdName} 
              onChange={e => setHoldName(e.target.value)} 
              placeholder="e.g. Counter 2, Customer Waiting" 
              autoFocus 
            />
          </Form.Group>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setHoldModal(false)}>Cancel</Button>
          <Button variant="primary" onClick={handleHoldBill} disabled={!holdName}>Confirm Hold</Button>
>>>>>>> b0c33b866999113e91051b3065362eadae55829f
        </Modal.Footer>
      </Modal>

      <ConfirmModal
        show={clearCartModal}
<<<<<<< HEAD
        title="Clear Cart"
        message="Are you sure you want to remove all products from the current bill?"
=======
        title="Clear cart"
        message="Remove all products from the current POS cart?"
>>>>>>> b0c33b866999113e91051b3065362eadae55829f
        confirmLabel="Clear Cart"
        confirmVariant="danger"
        onCancel={() => setClearCartModal(false)}
        onConfirm={clearCart}
      />
    </div>
  );
}
