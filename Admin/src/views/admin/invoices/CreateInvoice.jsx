import React, { useState, useEffect } from 'react';
import { Row, Col, Card, Form, Button, Table, Spinner, InputGroup } from 'react-bootstrap';
import { useNavigate, useParams } from 'react-router';
import Icon from '@/components/wrappers/Icon';
import api from '@/utils/api';
import toast from 'react-hot-toast';

export default function CreateInvoice() {
  const navigate = useNavigate();
  const { id } = useParams();
  const isEdit = !!id;
  
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(isEdit);
  const [invoiceNumber, setInvoiceNumber] = useState('INV-YYYY-XXXXXX');
  const [currency, setCurrency] = useState('INR');

  // Form State
  const [invoiceDate, setInvoiceDate] = useState(new Date().toISOString().split('T')[0]);
  const [dueDate, setDueDate] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('');
  const [status, setStatus] = useState('Draft');
  
  const [billing, setBilling] = useState({ name: '', address: '', phonePrefix: '+1', phone: '' });
  const [shipping, setShipping] = useState({ name: '', address: '', phonePrefix: '+1', phone: '' });
  
  const [items, setItems] = useState([{ id: 1, description: '', qty: 1, price: 0 }]);
  const [taxPercent, setTaxPercent] = useState(0);
  const [discountVal, setDiscountVal] = useState(0);
  const [notes, setNotes] = useState('');

  useEffect(() => {
    if (isEdit) {
      fetchInvoice();
    } else {
      setInvoiceNumber(`INV-${new Date().getFullYear()}-XXXXXX`);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  const fetchInvoice = async () => {
    try {
      const res = await api.get(`/invoices/${id}`);
      const inv = res.data;
      
      setInvoiceNumber(inv.invoiceNumber);
      setCurrency(inv.currency || 'INR');
      setInvoiceDate(new Date(inv.date).toISOString().split('T')[0]);
      if (inv.dueDate) setDueDate(new Date(inv.dueDate).toISOString().split('T')[0]);
      if (inv.paymentMethod) setPaymentMethod(inv.paymentMethod);
      setStatus(inv.status);
      setNotes(inv.notes || '');

      if (inv.customerSnapshot) {
        const phoneParts = (inv.customerSnapshot.phone || '').split(' ');
        setBilling({
          name: inv.customerSnapshot.name || '',
          address: inv.billingAddressSnapshot?.address || '',
          phonePrefix: phoneParts.length > 1 ? phoneParts[0] : '+1',
          phone: phoneParts.length > 1 ? phoneParts[1] : phoneParts[0] || ''
        });
      }
      
      if (inv.shippingAddressSnapshot) {
        const phoneParts = (inv.shippingAddressSnapshot.phone || '').split(' ');
        setShipping({
          name: inv.shippingAddressSnapshot.name || '',
          address: inv.shippingAddressSnapshot.address || '',
          phonePrefix: phoneParts.length > 1 ? phoneParts[0] : '+1',
          phone: phoneParts.length > 1 ? phoneParts[1] : phoneParts[0] || ''
        });
      }

      if (inv.productSnapshot && inv.productSnapshot.length > 0) {
        setItems(inv.productSnapshot.map((p, i) => ({
          id: i,
          description: p.productName,
          qty: p.qty,
          price: p.price
        })));
      }

      // Reverse engineer tax percent if possible, otherwise keep 0
      if (inv.totalsSnapshot) {
        setDiscountVal(inv.totalsSnapshot.discount || 0);
        const sub = inv.totalsSnapshot.subTotal || 1;
        const tax = inv.totalsSnapshot.tax || 0;
        setTaxPercent(Math.round((tax / sub) * 100));
      }

    } catch (err) {
      toast.error('Failed to load invoice');
      navigate('/invoices');
    } finally {
      setFetching(false);
    }
  };

  const handleItemChange = (id, field, value) => {
    setItems(items.map(item => item.id === id ? { ...item, [field]: value } : item));
  };

  const addItem = () => {
    setItems([...items, { id: Date.now(), description: '', qty: 1, price: 0 }]);
  };

  const removeItem = (id) => {
    if (items.length > 1) {
      setItems(items.filter(item => item.id !== id));
    }
  };

  // Calculations
  const subtotal = items.reduce((sum, item) => sum + (Number(item.qty) * Number(item.price)), 0);
  const taxAmount = (subtotal * Number(taxPercent)) / 100;
  const total = subtotal + taxAmount - Number(discountVal);

  const handleSubmit = async () => {
    if (!billing.name || items.some(i => !i.description || i.price <= 0)) {
      toast.error('Please fill in required fields (Billing Name, Item Descriptions, and positive Prices)');
      return;
    }

    setLoading(true);
    try {
      const payload = {
        currency,
        invoiceDate,
        dueDate,
        paymentMethod,
        customerSnapshot: { 
          name: billing.name, 
          email: '', 
          phone: `${billing.phonePrefix} ${billing.phone}`
        },
        billingAddressSnapshot: { ...billing },
        shippingAddressSnapshot: { ...shipping, phone: `${shipping.phonePrefix} ${shipping.phone}` },
        productSnapshot: items.map(i => ({ 
          productName: i.description, 
          sku: 'MANUAL', 
          qty: Number(i.qty), 
          price: Number(i.price), 
          total: Number(i.qty) * Number(i.price) 
        })),
        totalsSnapshot: {
          subTotal: subtotal,
          tax: taxAmount,
          discount: Number(discountVal),
          amount: total
        },
        notes,
        status: status // Keep existing or Draft
      };

      if (isEdit) {
        await api.put(`/invoices/${id}`, payload);
        toast.success('Invoice updated successfully!');
        navigate(`/invoices/${id}`);
      } else {
        const res = await api.post('/invoices', payload);
        toast.success('Invoice created successfully!');
        navigate(`/invoices/${res.data._id}`);
      }
    } catch (error) {
      console.error(error);
      toast.error(error.response?.data?.message || 'Failed to save invoice');
    } finally {
      setLoading(false);
    }
  };

  const inputStyle = {
    backgroundColor: 'rgba(255, 255, 255, 0.03)',
    border: '1px solid var(--bs-border-color)',
    color: 'var(--bs-body-color)',
    fontSize: '14px'
  };

  if (fetching) return <div className="d-flex justify-content-center align-items-center" style={{ minHeight: 400 }}><Spinner animation="border" /></div>;

  return (
    <div className="report-page pb-5">
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h3 className="report-title fw-bold mb-0">{isEdit ? `Edit Invoice` : `Create Invoice`}</h3>
      </div>

      <Row className="g-4">
        <Col xl={9}>
          <Card className="report-section-card border-0" style={{ backgroundColor: 'rgba(255,255,255,0.02)', border: '1px dashed var(--bs-border-color)' }}>
            <Card.Body className="p-4 p-md-5">
              
              {/* Header Row */}
              <div className="d-flex flex-wrap justify-content-between align-items-center mb-5">
                <div className="d-flex align-items-center gap-3">
                  <div className="bg-primary rounded-circle d-flex align-items-center justify-content-center" style={{ width: 48, height: 48 }}>
                    <Icon icon="lucide:file-text" width={24} color="#fff" />
                  </div>
                  <h4 className="fw-bold mb-0 text-white" style={{ letterSpacing: '1px' }}>KUIKLO</h4>
                </div>
                
                <div className="d-flex gap-3 align-items-center mt-3 mt-md-0">
                  <div>
                    <Form.Label className="text-muted mb-1" style={{ fontSize: '12px' }}>Invoice #</Form.Label>
                    <Form.Control value={invoiceNumber} disabled style={{ ...inputStyle, width: '180px', backgroundColor: 'transparent', borderStyle: 'dashed' }} />
                  </div>
                  <div>
                    <Form.Label className="text-muted mb-1" style={{ fontSize: '12px' }}>Currency</Form.Label>
                    <Form.Select value={currency} onChange={(e) => setCurrency(e.target.value)} style={{ ...inputStyle, width: '120px' }}>
                      <option value="USD">USD ($)</option>
                      <option value="INR">INR (₹)</option>
                      <option value="EUR">EUR (€)</option>
                    </Form.Select>
                  </div>
                </div>
              </div>

              {/* Dates & Payment */}
              <Row className="g-4 mb-5">
                <Col md={4}>
                  <Form.Label className="text-muted mb-1" style={{ fontSize: '13px' }}>Invoice Date</Form.Label>
                  <Form.Control type="date" value={invoiceDate} onChange={(e) => setInvoiceDate(e.target.value)} style={inputStyle} />
                </Col>
                <Col md={4}>
                  <Form.Label className="text-muted mb-1" style={{ fontSize: '13px' }}>Due Date</Form.Label>
                  <Form.Control type="date" value={dueDate} onChange={(e) => setDueDate(e.target.value)} style={inputStyle} />
                </Col>
                <Col md={4}>
                  <Form.Label className="text-muted mb-1" style={{ fontSize: '13px' }}>Payment Method</Form.Label>
                  <Form.Select value={paymentMethod} onChange={(e) => setPaymentMethod(e.target.value)} style={inputStyle}>
                    <option value="">Select</option>
                    <option value="Card">Credit/Debit Card</option>
                    <option value="UPI">UPI / NetBanking</option>
                    <option value="Cash">Cash</option>
                  </Form.Select>
                </Col>
              </Row>

              {/* Addresses */}
              <Row className="g-4 mb-5">
                <Col md={6}>
                  <h6 className="fw-bold mb-3" style={{ fontSize: '14px' }}>Billing Address</h6>
                  <Form.Control placeholder="Name" value={billing.name} onChange={(e) => setBilling({...billing, name: e.target.value})} className="mb-3" style={inputStyle} />
                  <Form.Control as="textarea" rows={3} placeholder="Address" value={billing.address} onChange={(e) => setBilling({...billing, address: e.target.value})} className="mb-3" style={inputStyle} />
                  <InputGroup>
                    <Form.Select value={billing.phonePrefix} onChange={(e) => setBilling({...billing, phonePrefix: e.target.value})} style={{ ...inputStyle, maxWidth: '100px' }}>
                      <option value="+1">+1 (US)</option>
                      <option value="+91">+91 (IN)</option>
                      <option value="+44">+44 (UK)</option>
                    </Form.Select>
                    <Form.Control placeholder="Phone Number" value={billing.phone} onChange={(e) => setBilling({...billing, phone: e.target.value})} style={inputStyle} />
                  </InputGroup>
                </Col>
                <Col md={6}>
                  <h6 className="fw-bold mb-3" style={{ fontSize: '14px' }}>Shipping Address</h6>
                  <Form.Control placeholder="Name" value={shipping.name} onChange={(e) => setShipping({...shipping, name: e.target.value})} className="mb-3" style={inputStyle} />
                  <Form.Control as="textarea" rows={3} placeholder="Address" value={shipping.address} onChange={(e) => setShipping({...shipping, address: e.target.value})} className="mb-3" style={inputStyle} />
                  <InputGroup>
                    <Form.Select value={shipping.phonePrefix} onChange={(e) => setShipping({...shipping, phonePrefix: e.target.value})} style={{ ...inputStyle, maxWidth: '100px' }}>
                      <option value="+1">+1 (US)</option>
                      <option value="+91">+91 (IN)</option>
                      <option value="+44">+44 (UK)</option>
                    </Form.Select>
                    <Form.Control placeholder="Phone Number" value={shipping.phone} onChange={(e) => setShipping({...shipping, phone: e.target.value})} style={inputStyle} />
                  </InputGroup>
                </Col>
              </Row>

              {/* Items Table */}
              <div className="table-responsive mb-4">
                <Table className="mb-0" style={{ borderCollapse: 'separate', borderSpacing: '0 8px' }}>
                  <thead>
                    <tr style={{ fontSize: '11px', color: 'var(--bs-secondary-color)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                      <th className="border-0" style={{ width: '40px' }}>#</th>
                      <th className="border-0">ITEM DESCRIPTION</th>
                      <th className="border-0" style={{ width: '120px' }}>QTY</th>
                      <th className="border-0" style={{ width: '160px' }}>UNIT PRICE</th>
                      <th className="border-0" style={{ width: '160px' }}>AMOUNT</th>
                      <th className="border-0 text-center" style={{ width: '80px' }}>ACTION</th>
                    </tr>
                  </thead>
                  <tbody>
                    {items.map((item, index) => (
                      <tr key={item.id} style={{ backgroundColor: 'rgba(255,255,255,0.02)' }}>
                        <td className="align-middle border-0 rounded-start text-muted text-center">{index + 1}</td>
                        <td className="align-middle border-0 p-2">
                          <Form.Control 
                            placeholder="Description" 
                            value={item.description} 
                            onChange={(e) => handleItemChange(item.id, 'description', e.target.value)} 
                            style={{ ...inputStyle, border: 'none', backgroundColor: 'transparent' }} 
                          />
                        </td>
                        <td className="align-middle border-0 p-2">
                          <Form.Control 
                            type="number" min="1" 
                            value={item.qty} 
                            onChange={(e) => handleItemChange(item.id, 'qty', e.target.value)} 
                            style={inputStyle} 
                          />
                        </td>
                        <td className="align-middle border-0 p-2">
                          <Form.Control 
                            type="number" min="0" step="0.01" 
                            value={item.price} 
                            onChange={(e) => handleItemChange(item.id, 'price', e.target.value)} 
                            style={inputStyle} 
                          />
                        </td>
                        <td className="align-middle border-0 p-2">
                          <Form.Control 
                            value={(Number(item.qty) * Number(item.price)).toFixed(2)} 
                            disabled 
                            style={{ ...inputStyle, border: 'none', backgroundColor: 'transparent' }} 
                          />
                        </td>
                        <td className="align-middle border-0 text-center p-2 rounded-end">
                          <Button variant="danger" className="p-0 d-inline-flex align-items-center justify-content-center" style={{ width: 32, height: 32, borderRadius: '6px' }} onClick={() => removeItem(item.id)}>
                            <Icon icon="lucide:x" width={16} />
                          </Button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </Table>
              </div>

              <Button variant="primary" className="mb-5 px-3 py-2" style={{ fontSize: '13px', fontWeight: 600, borderRadius: '6px', backgroundColor: 'rgba(var(--bs-primary-rgb), 0.15)', color: 'var(--bs-primary)', border: 'none' }} onClick={addItem}>
                <Icon icon="lucide:plus" width={16} className="me-2" /> Add Item
              </Button>

              {/* Totals Section */}
              <Row className="justify-content-end mb-5">
                <Col md={5} lg={4}>
                  <div className="d-flex flex-column gap-3">
                    <div className="d-flex justify-content-between align-items-center">
                      <span className="text-muted fw-medium" style={{ fontSize: '14px' }}>Subtotal</span>
                      <span className="fw-bold">{subtotal.toFixed(2)}</span>
                    </div>
                    <div className="d-flex justify-content-between align-items-center">
                      <span className="text-muted fw-medium" style={{ fontSize: '14px' }}>Tax (%)</span>
                      <Form.Control type="number" min="0" value={taxPercent} onChange={(e) => setTaxPercent(e.target.value)} style={{ ...inputStyle, width: '100px', textAlign: 'right' }} />
                    </div>
                    <div className="d-flex justify-content-between align-items-center">
                      <span className="text-muted fw-medium" style={{ fontSize: '14px' }}>Discount</span>
                      <Form.Control type="number" min="0" value={discountVal} onChange={(e) => setDiscountVal(e.target.value)} style={{ ...inputStyle, width: '100px', textAlign: 'right' }} />
                    </div>
                    <hr className="my-1 border-secondary" />
                    <div className="d-flex justify-content-between align-items-center">
                      <span className="text-white fw-bold" style={{ fontSize: '16px' }}>Total</span>
                      <span className="text-white fw-bold" style={{ fontSize: '18px' }}>{total.toFixed(2)}</span>
                    </div>
                  </div>
                </Col>
              </Row>

              {/* Notes */}
              <div>
                <Form.Label className="text-white fw-bold mb-2" style={{ fontSize: '14px' }}>Additional Notes</Form.Label>
                <Form.Control 
                  as="textarea" 
                  rows={4} 
                  placeholder="e.g. Thank you for your business!" 
                  value={notes} 
                  onChange={(e) => setNotes(e.target.value)} 
                  style={{ ...inputStyle, backgroundColor: 'rgba(255,255,255,0.02)' }} 
                />
              </div>

            </Card.Body>
          </Card>
        </Col>

        {/* Right Sidebar Actions */}
        <Col xl={3}>
          <Card className="report-section-card border-0" style={{ position: 'sticky', top: '20px', backgroundColor: 'rgba(255,255,255,0.02)' }}>
            <Card.Body className="p-4 d-flex flex-column gap-3">
              <Button 
                variant="dark" 
                className="w-100 py-2 d-flex align-items-center justify-content-center gap-2" 
                style={{ backgroundColor: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)' }}
                onClick={() => toast.info('Preview mode coming soon')}
              >
                <Icon icon="lucide:eye" width={18} /> Preview
              </Button>
              <Button 
                variant="dark" 
                className="w-100 py-2 d-flex align-items-center justify-content-center gap-2" 
                style={{ backgroundColor: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)' }}
                onClick={() => toast.info('Save invoice first to download')}
              >
                <Icon icon="lucide:download" width={18} /> Download
              </Button>
              <Button 
                variant="danger" 
                className="w-100 py-2 mt-2 d-flex align-items-center justify-content-center gap-2 fw-bold text-white" 
                style={{ backgroundColor: '#ff4d4f', border: 'none' }}
                onClick={handleSubmit}
                disabled={loading}
              >
                {loading ? <Spinner size="sm" /> : <><Icon icon="lucide:send" width={18} /> {isEdit ? `Update Invoice` : `Save Invoice`}</>}
              </Button>
            </Card.Body>
          </Card>
        </Col>
      </Row>
    </div>
  );
}
