import React, { useState, useEffect, useRef } from 'react';
import { Card, Row, Col, Table, Button, Form, InputGroup, Modal, Spinner } from 'react-bootstrap';
import { useLocation, useNavigate, useSearchParams } from 'react-router';
import { fetchApi } from '@/utils/api';
import PageHeader from '@/components/common/PageHeader';
import ConfirmModal from '@/components/common/ConfirmModal';
import { formatCurrency } from '@/utils/format';
import InvoicePrintOut from './components/InvoicePrintOut';
import { toast } from 'react-hot-toast';
import { User, Phone, Mail, MapPin } from 'lucide-react';

export default function POSBilling() {
  const [cart, setCart] = useState([]);
  const [barcodeInput, setBarcodeInput] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [isSearching, setIsSearching] = useState(false);
  const [customer, setCustomer] = useState(null);
  const [customerInfo, setCustomerInfo] = useState({ name: '', phone: '', email: '', address: { street: '', city: '', state: '', zipCode: '' } });
  const [customerSuggestions, setCustomerSuggestions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [syncStatus, setSyncStatus] = useState('idle'); // idle, syncing, done
  
  const [holdModal, setHoldModal] = useState(false);
  const [holdName, setHoldName] = useState('');
  const [heldBills, setHeldBills] = useState([]);
  const [clearCartModal, setClearCartModal] = useState(false);
  
  const [invoiceToPrint, setInvoiceToPrint] = useState(null);

  const barcodeRef = useRef(null);
  const navigate = useNavigate();

  useEffect(() => {
    if (barcodeRef.current) barcodeRef.current.focus();
    loadHeldBills();

    const handleOnline = () => {
      syncOfflineOrders();
    };
    window.addEventListener('online', handleOnline);
    return () => window.removeEventListener('online', handleOnline);
  }, []);

  const loadHeldBills = async () => {
    try {
      const data = await fetchApi('/pos/hold');
      const localHolds = JSON.parse(localStorage.getItem('offline_holds') || '[]');
      setHeldBills([...localHolds, ...data]);
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
      // The API supports ?search= which fuzzy matches name, sku, barcode
      const response = await fetchApi(`/products?search=${val.trim()}&limit=5`);
      setSearchResults(response.data || []);
    } catch (err) {
      console.error(err);
    }
    setIsSearching(false);
  };

  const handleSelectProduct = (product) => {
    addToCart(product);
    setBarcodeInput('');
    setSearchResults([]);
    if (barcodeRef.current) barcodeRef.current.focus();
  };


  const handleBarcodeSubmit = async (e) => {
    e.preventDefault();
    if (!barcodeInput.trim()) return;

    // If there's an exact match in the results or we just want to hit the specific barcode endpoint
    setLoading(true);
    try {
      const response = await fetchApi(`/products/barcode/${barcodeInput.trim()}`);
      if (response && response.data) {
        handleSelectProduct(response.data);
      }
    } catch (err) {
      alert(err.message || 'Product not found');
    }
    setLoading(false);
  };

  const addToCart = (product) => {
    setCart(prev => {
      const existing = prev.find(item => item.productId === product._id);
      if (existing) {
        return prev.map(item => item.productId === product._id ? { ...item, qty: item.qty + 1, total: (item.qty + 1) * item.price } : item);
      }
      return [...prev, { 
        productId: product._id, 
        productName: product.name,
        sku: product.baseSku,
        barcode: product.barcode,
        price: product.sellingPrice || product.mrp, 
        qty: 1,
        total: product.sellingPrice || product.mrp 
      }];
    });
  };

  const handleCustomerPhoneChange = async (e) => {
    const phone = e.target.value;
    setCustomerInfo(prev => ({ ...prev, phone }));
    
    // Fetch suggestions if length is 4 or more
    if (phone.length >= 4) {
      try {
        const res = await fetchApi(`/customers?search=${phone}&limit=5`);
        if (res.data) {
          setCustomerSuggestions(res.data);
          
          // Auto-select if exact match is found and user typed 10 digits
          if (phone.length === 10) {
            const found = res.data.find(c => c.phone === phone);
            if (found) {
              selectCustomer(found);
            }
          }
        }
      } catch (err) {
        console.error(err);
      }
    } else {
      setCustomerSuggestions([]);
      if (customer && phone !== customer.phone) {
         setCustomer(null);
      }
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
    toast.success('Customer details auto-filled!');
  };

  const updateQty = (id, delta) => {
    setCart(prev => prev.map(item => {
      if (item.productId === id) {
        const newQty = Math.max(1, item.qty + delta);
        return { ...item, qty: newQty, total: newQty * item.price };
      }
      return item;
    }));
  };

  const removeItem = (id) => setCart(prev => prev.filter(item => item.productId !== id));
  const clearCart = () => {
    setCart([]);
    setClearCartModal(false);
  };

  const total = cart.reduce((acc, item) => acc + item.total, 0);

  // --- HOLD BILL LOGIC ---
  const handleHoldBill = async () => {
    if (cart.length === 0) return alert('Cart empty');
    setLoading(true);

    const payload = {
      referenceName: holdName,
      customer: customer ? customer._id : null,
      items: cart,
      totals: { subTotal: total, tax: 0, discount: 0, amount: total }
    };

    try {
      await fetchApi('/pos/hold', {
        method: 'POST',
        body: JSON.stringify(payload)
      });
      setCart([]);
      setHoldModal(false);
      setHoldName('');
      loadHeldBills();
    } catch (e) { 
      if (!window.navigator.onLine || e.message.includes('Failed to fetch')) {
        const localHolds = JSON.parse(localStorage.getItem('offline_holds') || '[]');
        localHolds.push({ ...payload, _id: `local-hold-${Date.now()}`, isLocal: true });
        localStorage.setItem('offline_holds', JSON.stringify(localHolds));
        
        setCart([]);
        setHoldModal(false);
        setHoldName('');
        loadHeldBills();
        toast.success('Bill held locally (Offline)');
      } else {
        alert(e.message); 
      }
    }
    setLoading(false);
  };

  const handleResumeBill = async (billId) => {
    setLoading(true);
    
    // Check if it's a local hold
    if (billId.toString().startsWith('local-hold-')) {
      const localHolds = JSON.parse(localStorage.getItem('offline_holds') || '[]');
      const bill = localHolds.find(b => b._id === billId);
      if (bill) {
        setCart(bill.items);
        // We might not have the full customer object, but we have the ID. 
        // We'll skip setting full customer details for offline resume for simplicity, or just set it as null
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
      loadHeldBills();
    } catch (e) { alert(e.message); }
    setLoading(false);
  };

  // --- CHECKOUT LOGIC ---
  const checkout = async (paymentMethod) => {
    if (cart.length === 0) return alert('Cart is empty');
    setLoading(true);

    const payload = {
      customer: customer ? customer._id : null,
      customerSnapshot: { 
        name: customerInfo.name || (customer ? customer.name : 'Walk-in'), 
        phone: customerInfo.phone || (customer ? customer.phone : undefined),
        email: customerInfo.email || undefined
      },
      customerAddress: customerInfo.address && (customerInfo.address.street || customerInfo.address.city) ? customerInfo.address : undefined,
      items: cart,
      subTotal: total, tax: 0, discount: 0, amount: total,
      paymentMethod,
      offlineId: `offline-${Date.now()}-${Math.floor(Math.random() * 1000)}`
    };

    try {
      const res = await fetchApi('/pos/checkout', { method: 'POST', body: JSON.stringify(payload) });
      
      setCart([]);
      setCustomer(null);
      setCustomerInfo({ name: '', phone: '', email: '', address: { street: '', city: '', state: '', zipCode: '' } });
      setInvoiceToPrint(res.invoice);
    } catch (error) {
      if (!window.navigator.onLine || error.message.includes('Failed to fetch')) {
        // Save to offline queue
        const offlineOrders = JSON.parse(localStorage.getItem('offline_orders') || '[]');
        const offlineInvoice = {
          _id: `offline-${Date.now()}`,
          invoiceNumber: `OFF-${Date.now()}`,
          createdAt: new Date(),
          customerSnapshot: { name: customerInfo.name || (customer ? customer.name : 'Walk-in') },
          productSnapshot: cart,
          totalsSnapshot: { subTotal: total, tax: 0, discount: 0, amount: total },
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
        alert(error.message);
      }
    }
    setLoading(false);
  };

  const syncOfflineOrders = async () => {
    const offlineOrders = JSON.parse(localStorage.getItem('offline_orders') || '[]');
    if (offlineOrders.length === 0) {
      setSyncStatus('idle');
      return;
    }
    
    setSyncStatus('syncing');
    
    try {
      const res = await fetchApi('/pos/sync', { method: 'POST', body: JSON.stringify({ offlineOrders }) });
      
      localStorage.setItem('offline_orders', JSON.stringify(res.failedOrders));
      
      if (res.failedOrders.length > 0) {
        toast.error(`Synced ${res.successCount} orders, but ${res.failedOrders.length} failed. Check admin setting for Negative Stock.`);
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
    <div>
      <PageHeader 
        title="POS Billing" 
        rightContent={
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
            {syncStatus === 'done' && (
              <Button variant="success" disabled>
                All Synced
              </Button>
            )}
            <Button variant="secondary" onClick={() => navigate('/pos/history')}>History / Returns</Button>
            <Button variant="outline-danger" onClick={() => setClearCartModal(true)} disabled={cart.length === 0}>Clear Cart</Button>
          </div>
        }
      />

      <Row>
        <Col md={8}>
          <Card>
            <Card.Body>
              <div className="position-relative mb-4">
                <Form onSubmit={handleBarcodeSubmit}>
                  <InputGroup>
                    <Form.Control 
                      ref={barcodeRef}
                      placeholder="Search product by name, SKU, or scan barcode..." 
                      value={barcodeInput}
                      onChange={handleSearchChange}
                      disabled={loading}
                      autoComplete="off"
                    />
                    <Button type="submit" variant="primary" disabled={loading}>Add</Button>
                  </InputGroup>
                </Form>
                {searchResults.length > 0 && (
                  <Card className="position-absolute w-100 mt-1 shadow border-secondary" style={{ zIndex: 1050, maxHeight: '250px', overflowY: 'auto', backgroundColor: '#1e1e2d' }}>
                    <div className="list-group list-group-flush">
                      {searchResults.map(prod => (
                        <button 
                          key={prod._id} 
                          className="list-group-item list-group-item-action d-flex justify-content-between align-items-center border-secondary text-light"
                          style={{ backgroundColor: '#1e1e2d' }}
                          onClick={() => handleSelectProduct(prod)}
                        >
                          <div className="text-start">
                            <div className="fw-medium text-white">{prod.name}</div>
                            <small className="text-muted">SKU: {prod.baseSku} | Barcode: {prod.barcode}</small>
                          </div>
                          <div className="fw-bold text-white">{formatCurrency(prod.sellingPrice || prod.mrp)}</div>
                        </button>
                      ))}
                    </div>
                  </Card>
                )}
              </div>

              <Table striped bordered hover>
                <thead>
                  <tr>
                    <th>Product</th>
                    <th>Price</th>
                    <th>Qty</th>
                    <th>Total</th>
                    <th>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {cart.length === 0 ? <tr><td colSpan="5" className="text-center">Cart empty</td></tr> : cart.map(item => (
                    <tr key={item.productId}>
                      <td>{item.productName}</td>
                      <td>{formatCurrency(item.price)}</td>
                      <td>
                        <Button size="sm" variant="outline-secondary" onClick={() => updateQty(item.productId, -1)}>-</Button>
                        <span className="mx-2">{item.qty}</span>
                        <Button size="sm" variant="outline-secondary" onClick={() => updateQty(item.productId, 1)}>+</Button>
                      </td>
                      <td>{formatCurrency(item.total)}</td>
                      <td><Button size="sm" variant="danger" onClick={() => removeItem(item.productId)}>X</Button></td>
                    </tr>
                  ))}
                </tbody>
              </Table>
            </Card.Body>
          </Card>
        </Col>

        <Col md={4}>
          <Card className="mb-3">
            <Card.Body>
              <div className="mb-4 p-3 rounded-3" style={{ background: 'var(--card-bg, rgba(255,255,255,0.02))', border: '1px solid var(--border-color, rgba(255,255,255,0.05))' }}>
                <h6 className="mb-3 text-white fw-bold d-flex align-items-center gap-2">
                  <User size={18} className="text-primary" /> Customer Information
                </h6>
                <div className="mb-3 position-relative">
                  <Form.Control size="sm" placeholder="Phone Number (Auto-fetch)" value={customerInfo.phone} onChange={handleCustomerPhoneChange} autoComplete="off" />
                  
                  {customerSuggestions.length > 0 && (
                    <Card className="position-absolute w-100 mt-1 shadow border-secondary" style={{ zIndex: 1050, maxHeight: '200px', overflowY: 'auto', backgroundColor: '#1e1e2d' }}>
                      <div className="list-group list-group-flush">
                        {customerSuggestions.map(cust => (
                          <button 
                            key={cust._id} 
                            type="button"
                            className="list-group-item list-group-item-action d-flex justify-content-between align-items-center border-secondary text-light p-2"
                            style={{ backgroundColor: '#1e1e2d', fontSize: '0.85rem' }}
                            onClick={() => selectCustomer(cust)}
                          >
                            <div>
                              <div className="fw-bold text-white">{cust.phone}</div>
                              <small className="text-muted">{cust.name || 'Walk-in Customer'}</small>
                            </div>
                            <div className="text-muted" style={{ fontSize: '0.75rem' }}>Select</div>
                          </button>
                        ))}
                      </div>
                    </Card>
                  )}
                </div>
                
                <div className="mb-3">
                  <Form.Control size="sm" placeholder="Customer Name" value={customerInfo.name} onChange={e => setCustomerInfo({...customerInfo, name: e.target.value})} />
                </div>

                <div className="mb-3">
                  <Form.Control size="sm" type="email" placeholder="Email Address (Optional)" value={customerInfo.email} onChange={e => setCustomerInfo({...customerInfo, email: e.target.value})} />
                </div>

                <hr className="border-secondary opacity-25 my-3" />
                
                <h6 className="mb-3 text-white-50 fw-bold d-flex align-items-center gap-2 text-uppercase" style={{ fontSize: '0.75rem', letterSpacing: '1px' }}>
                  <MapPin size={14} /> Billing / Shipping
                </h6>
                <Form.Control size="sm" className="mb-2" placeholder="Street Address" value={customerInfo.address?.street || ''} onChange={e => setCustomerInfo({...customerInfo, address: { ...customerInfo.address, street: e.target.value }})} />
                <Row className="g-2 mb-2">
                  <Col><Form.Control size="sm" placeholder="City" value={customerInfo.address?.city || ''} onChange={e => setCustomerInfo({...customerInfo, address: { ...customerInfo.address, city: e.target.value }})} /></Col>
                  <Col><Form.Control size="sm" placeholder="State" value={customerInfo.address?.state || ''} onChange={e => setCustomerInfo({...customerInfo, address: { ...customerInfo.address, state: e.target.value }})} /></Col>
                  <Col><Form.Control size="sm" placeholder="Zip" value={customerInfo.address?.zipCode || ''} onChange={e => setCustomerInfo({...customerInfo, address: { ...customerInfo.address, zipCode: e.target.value }})} /></Col>
                </Row>
              </div>

              <h4>Order Summary</h4>
              <hr />
              <div className="d-flex justify-content-between mb-2"><span>Subtotal:</span><span>{formatCurrency(total)}</span></div>
              <div className="d-flex justify-content-between mb-4"><strong>Total:</strong><strong>{formatCurrency(total)}</strong></div>

              <h5>Payment</h5>
              <div className="d-grid gap-2">
                <Button variant="success" onClick={() => checkout('Cash')} disabled={loading || cart.length === 0}>Pay with Cash</Button>
                <Button variant="primary" onClick={() => checkout('UPI')} disabled={loading || cart.length === 0}>Pay with UPI</Button>
                <Button variant="info" onClick={() => checkout('Card')} disabled={loading || cart.length === 0}>Pay with Card</Button>
                <Button variant="warning" onClick={() => setHoldModal(true)} disabled={loading || cart.length === 0}>Hold Bill</Button>
              </div>
            </Card.Body>
          </Card>

          {heldBills.length > 0 && (
            <Card>
              <Card.Header>Held Bills</Card.Header>
              <Card.Body>
                {heldBills.map(bill => (
                  <div key={bill._id} className="d-flex justify-content-between align-items-center mb-2 border-bottom pb-2">
                    <div>
                      <strong>{bill.referenceName}</strong><br/>
                      <small>{formatCurrency(bill.totals.amount)} ({bill.items.length} items)</small>
                    </div>
                    <Button size="sm" variant="outline-primary" onClick={() => handleResumeBill(bill._id)}>Resume</Button>
                  </div>
                ))}
              </Card.Body>
            </Card>
          )}
        </Col>
      </Row>

      <Modal show={holdModal} onHide={() => setHoldModal(false)}>
        <Modal.Header closeButton><Modal.Title>Hold Bill</Modal.Title></Modal.Header>
        <Modal.Body>
          <Form.Group>
            <Form.Label>Reference Name</Form.Label>
            <Form.Control type="text" value={holdName} onChange={e => setHoldName(e.target.value)} placeholder="e.g. Table 5, Waiting Customer" />
          </Form.Group>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setHoldModal(false)}>Cancel</Button>
          <Button variant="primary" onClick={handleHoldBill} disabled={!holdName}>Save Hold</Button>
        </Modal.Footer>
      </Modal>
      <ConfirmModal
        show={clearCartModal}
        title="Clear cart"
        message="Remove all products from the current bill?"
        confirmLabel="Clear Cart"
        confirmVariant="danger"
        onCancel={() => setClearCartModal(false)}
        onConfirm={clearCart}
      />
    </div>
  );
}
