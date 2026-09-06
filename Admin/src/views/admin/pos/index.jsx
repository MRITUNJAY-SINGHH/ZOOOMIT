import React, { useState, useEffect, useRef } from 'react';
import { Card, Row, Col, Table, Button, Form, InputGroup, Modal, Badge } from 'react-bootstrap';
import { useLocation, useNavigate } from 'react-router';
import { fetchApi } from '@/utils/api';
import PageHeader from '@/components/common/PageHeader';
import ConfirmModal from '@/components/common/ConfirmModal';
import { formatCurrency } from '@/utils/format';
import InvoicePrintOut from './components/InvoicePrintOut';
import { toast } from 'react-hot-toast';
import { User, Search, Trash2, MapPin, Package, CreditCard, Banknote, Smartphone, PauseCircle, Calculator, Percent } from 'lucide-react';

export default function POSBilling() {
  const [cart, setCart] = useState([]);
  const [barcodeInput, setBarcodeInput] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [isSearching, setIsSearching] = useState(false);
  const [customer, setCustomer] = useState(null);
  const [customerInfo, setCustomerInfo] = useState({ name: '', phone: '', email: '', address: { street: '', city: '', state: '', zipCode: '' } });
  const [customerSuggestions, setCustomerSuggestions] = useState([]);
  const [loading, setLoading] = useState(false);
  
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
  }, []);

  const loadHeldBills = async () => {
    try {
      const data = await fetchApi('/pos/hold');
      setHeldBills(data);
    } catch (e) { console.error(e); }
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
      const response = await fetchApi(`/products?search=${val.trim()}&limit=8`);
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
        if (response.data.stock <= 0) {
          toast.error('Product is out of stock!');
        } else {
          handleSelectProduct(response.data);
        }
      }
    } catch (err) {
      toast.error(err.message || 'Product not found');
    }
    setLoading(false);
  };

  const addToCart = (product) => {
    setCart(prev => {
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
      }
      return [...prev, { 
        productId: product._id, 
        productName: product.name,
        sku: product.baseSku,
        barcode: product.barcode,
        price: product.sellingPrice || product.mrp, 
        qty: 1,
        maxStock: product.stock,
        itemDiscount: 0,
        total: product.sellingPrice || product.mrp 
      }];
    });
  };

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
      }
      return item;
    }));
  };

  const updateItemDiscount = (id, discountVal) => {
    setCart(prev => prev.map(item => {
      if (item.productId === id) {
        let disc = parseFloat(discountVal) || 0;
        if (disc < 0) disc = 0;
        if (disc > item.price) disc = item.price;
        const netPrice = item.price - disc;
        return { ...item, itemDiscount: disc, total: item.qty * netPrice };
      }
      return item;
    }));
  };

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

  // --- HOLD BILL LOGIC ---
  const handleHoldBill = async () => {
    if (cart.length === 0) return toast.error('Cart is empty');
    setLoading(true);
    try {
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
      setHoldModal(false);
      setHoldName('');
      toast.success('Bill placed on hold');
      loadHeldBills();
    } catch (e) { toast.error(e.message); }
    setLoading(false);
  };

  const handleResumeBill = async (billId) => {
    setLoading(true);
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

      const res = await fetchApi('/pos/checkout', { method: 'POST', body: JSON.stringify(payload) });
      
      toast.success('Payment successful!');
      clearCart();
      setCustomer(null);
      setCustomerInfo({ name: '', phone: '', email: '', address: { street: '', city: '', state: '', zipCode: '' } });
      setInvoiceToPrint(res.invoice);
    } catch (error) {
      toast.error(error.message || 'Checkout failed');
    }
    setLoading(false);
  };

  if (invoiceToPrint) {
    return <InvoicePrintOut invoice={invoiceToPrint} onBack={() => setInvoiceToPrint(null)} />;
  }

  return (
    <div className="pos-billing-container">
      <PageHeader 
        title="POS Billing" 
        rightContent={
          <div className="d-flex gap-2">
            <Button variant="outline-primary" onClick={() => navigate('/pos/history')}>History / Returns</Button>
            <Button variant="danger" onClick={() => setClearCartModal(true)} disabled={cart.length === 0}>
              <Trash2 size={16} className="me-1" /> Clear
            </Button>
          </div>
        }
      />

      <Row className="g-3">
        {/* LEFT COLUMN - PRODUCTS & CART */}
        <Col lg={8}>
          <Card className="h-100 border-0 shadow-sm" style={{ backgroundColor: 'var(--bs-body-bg)' }}>
            <Card.Body className="p-0 d-flex flex-column">
              {/* Search Bar */}
              <div className="p-3 border-bottom position-relative bg-light rounded-top" style={{ zIndex: 10 }}>
                <Form onSubmit={handleBarcodeSubmit}>
                  <InputGroup size="lg" className="shadow-sm">
                    <InputGroup.Text className="bg-white border-end-0 text-muted">
                      <Search size={20} />
                    </InputGroup.Text>
                    <Form.Control 
                      ref={barcodeRef}
                      placeholder="Scan barcode or search by name, SKU..." 
                      value={barcodeInput}
                      onChange={handleSearchChange}
                      disabled={loading}
                      autoComplete="off"
                      className="border-start-0 ps-0"
                      style={{ boxShadow: 'none' }}
                    />
                    <Button type="submit" variant="primary" disabled={loading} className="px-4 fw-semibold">Add</Button>
                  </InputGroup>
                </Form>
                
                {searchResults.length > 0 && (
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
                )}
              </div>

              {/* Cart Table */}
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
            </Card.Body>
          </Card>
        </Col>

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
                      <div className="list-group list-group-flush">
                        {customerSuggestions.map(cust => (
                          <button 
                            key={cust._id} 
                            type="button"
                            className="list-group-item list-group-item-action py-2"
                            onClick={() => selectCustomer(cust)}
                          >
                            <div className="fw-semibold">{cust.phone}</div>
                            <small className="text-muted">{cust.name || 'Walk-in'}</small>
                          </button>
                        ))}
                      </div>
                    </Card>
                  )}
                </div>
                
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
        </Modal.Footer>
      </Modal>

      <ConfirmModal
        show={clearCartModal}
        title="Clear Cart"
        message="Are you sure you want to remove all products from the current bill?"
        confirmLabel="Clear Cart"
        confirmVariant="danger"
        onCancel={() => setClearCartModal(false)}
        onConfirm={clearCart}
      />
    </div>
  );
}
