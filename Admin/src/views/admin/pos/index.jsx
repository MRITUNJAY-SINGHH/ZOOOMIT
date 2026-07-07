import React, { useState, useEffect, useRef } from 'react';
import { Card, Row, Col, Table, Button, Form, InputGroup, Modal } from 'react-bootstrap';
import { useLocation, useNavigate, useSearchParams } from 'react-router';
import { fetchApi } from '@/utils/api';
import PageHeader from '@/components/common/PageHeader';
import ConfirmModal from '@/components/common/ConfirmModal';
import { formatCurrency } from '@/utils/format';
import InvoicePrintOut from './components/InvoicePrintOut';

export default function POSBilling() {
  const [cart, setCart] = useState([]);
  const [barcodeInput, setBarcodeInput] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [isSearching, setIsSearching] = useState(false);
  const [customer, setCustomer] = useState(null);
  const [customerInfo, setCustomerInfo] = useState({ name: '', phone: '', email: '' });
  const [loading, setLoading] = useState(false);
  
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

  const handleCustomerPhoneChange = async (e) => {
    const phone = e.target.value;
    setCustomerInfo(prev => ({ ...prev, phone }));
    if (phone.length >= 10) {
      try {
        const res = await fetchApi(`/customers?search=${phone}`);
        if (res.data && res.data.length > 0) {
          const match = res.data.find(c => c.phone === phone) || res.data[0];
          setCustomer(match);
          setCustomerInfo({ name: match.name, phone: match.phone, email: match.email || '' });
        }
      } catch (err) {}
    } else {
      setCustomer(null);
    }
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
    try {
      await fetchApi('/pos/hold', {
        method: 'POST',
        body: JSON.stringify({
          referenceName: holdName,
          customer: customer ? customer._id : null,
          items: cart,
          totals: { subTotal: total, tax: 0, discount: 0, amount: total }
        })
      });
      setCart([]);
      setHoldModal(false);
      setHoldName('');
      loadHeldBills();
    } catch (e) { alert(e.message); }
    setLoading(false);
  };

  const handleResumeBill = async (billId) => {
    setLoading(true);
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
    try {
      const payload = {
        customer: customer ? customer._id : null,
        customerSnapshot: { 
          name: customerInfo.name || (customer ? customer.name : 'Walk-in'), 
          phone: customerInfo.phone || (customer ? customer.phone : undefined),
          email: customerInfo.email || undefined
        },
        items: cart,
        subTotal: total, tax: 0, discount: 0, amount: total,
        paymentMethod
      };

      const res = await fetchApi('/pos/checkout', { method: 'POST', body: JSON.stringify(payload) });
      
      setCart([]);
      setCustomer(null);
      setCustomerInfo({ name: '', phone: '', email: '' });
      setInvoiceToPrint(res.invoice);
    } catch (error) {
      alert(error.message);
    }
    setLoading(false);
  };

  if (invoiceToPrint) {
    return <InvoicePrintOut invoice={invoiceToPrint} onBack={() => setInvoiceToPrint(null)} />;
  }

  return (
    <div>
      <PageHeader 
        title="POS Billing" 
        rightContent={
          <>
            <Button variant="secondary" className="me-2" onClick={() => navigate('/pos/history')}>History / Returns</Button>
            <Button variant="outline-danger" onClick={() => setClearCartModal(true)} disabled={cart.length === 0}>Clear Cart</Button>
          </>
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
              <h5 className="mb-3">Customer Details</h5>
              <div className="mb-4">
                <Form.Control size="sm" className="mb-2 bg-dark text-light border-secondary" placeholder="Phone Number" value={customerInfo.phone} onChange={handleCustomerPhoneChange} />
                <Form.Control size="sm" className="mb-2 bg-dark text-light border-secondary" placeholder="Customer Name" value={customerInfo.name} onChange={e => setCustomerInfo({...customerInfo, name: e.target.value})} />
                <Form.Control size="sm" className="mb-2 bg-dark text-light border-secondary" placeholder="Email Address (Optional)" value={customerInfo.email} onChange={e => setCustomerInfo({...customerInfo, email: e.target.value})} />
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
