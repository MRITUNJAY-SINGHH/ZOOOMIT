import React, { useState, useEffect, useRef } from 'react';
import { Card, Row, Col, Table, Button, Form, InputGroup, Modal } from 'react-bootstrap';
import { fetchApi } from '@/utils/api';
import PageHeader from '@/components/common/PageHeader';
import ConfirmModal from '@/components/common/ConfirmModal';
import { formatCurrency } from '@/utils/format';
import InvoicePrintOut from './components/InvoicePrintOut';
import POSHistory from './components/POSHistory';

export default function POSBilling() {
  const [cart, setCart] = useState([]);
  const [barcodeInput, setBarcodeInput] = useState('');
  const [customer, setCustomer] = useState(null);
  const [loading, setLoading] = useState(false);
  
  const [holdModal, setHoldModal] = useState(false);
  const [holdName, setHoldName] = useState('');
  const [heldBills, setHeldBills] = useState([]);
  const [showHistory, setShowHistory] = useState(false);
  const [clearCartModal, setClearCartModal] = useState(false);
  
  const [invoiceToPrint, setInvoiceToPrint] = useState(null);

  const barcodeRef = useRef(null);

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

  const handleBarcodeScan = async (e) => {
    e.preventDefault();
    if (!barcodeInput.trim()) return;

    setLoading(true);
    try {
      const response = await fetchApi(`/products/barcode/${barcodeInput.trim()}`);
      if (response && response.data) {
        addToCart(response.data);
      }
    } catch (err) {
      alert(err.message || 'Product not found');
    }
    setLoading(false);
    setBarcodeInput('');
    if (barcodeRef.current) barcodeRef.current.focus();
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
        customerSnapshot: customer ? { name: customer.name, phone: customer.phone } : { name: 'Walk-in' },
        items: cart,
        subTotal: total, tax: 0, discount: 0, amount: total,
        paymentMethod
      };

      const res = await fetchApi('/pos/checkout', { method: 'POST', body: JSON.stringify(payload) });
      
      setCart([]);
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
            <Button variant="secondary" className="me-2" onClick={() => setShowHistory(true)}>History / Returns</Button>
            <Button variant="outline-danger" onClick={() => setClearCartModal(true)} disabled={cart.length === 0}>Clear Cart</Button>
          </>
        }
      />

      {showHistory && <POSHistory onClose={() => setShowHistory(false)} onReprint={(inv) => setInvoiceToPrint(inv)} />}

      <Row>
        <Col md={8}>
          <Card>
            <Card.Body>
              <Form onSubmit={handleBarcodeScan} className="mb-4">
                <InputGroup>
                  <Form.Control 
                    ref={barcodeRef}
                    placeholder="Scan Barcode or Enter SKU..." 
                    value={barcodeInput}
                    onChange={(e) => setBarcodeInput(e.target.value)}
                    disabled={loading}
                  />
                  <Button type="submit" variant="primary" disabled={loading}>Add</Button>
                </InputGroup>
              </Form>

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
