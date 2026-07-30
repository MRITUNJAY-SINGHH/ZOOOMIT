import React, { useEffect, useMemo, useState } from 'react';
import { Button, Card, Col, Form, Row, Spinner, Table } from 'react-bootstrap';
import { ArrowLeft, Plus, Save, Trash2 } from 'lucide-react';
import { useNavigate, useParams } from 'react-router';
import api from '@/utils/api';
import PageHeader from '@/components/common/PageHeader';
import ErrorState from '@/components/common/ErrorState';
import LoadingSkeleton from '@/components/common/LoadingSkeleton';
import FormSection from '@/components/common/FormSection';
import { formatCurrency } from '@/utils/format';
import toast from 'react-hot-toast';

const emptyItem = () => ({ id: crypto.randomUUID(), productName: '', sku: '', qty: 1, price: 0 });

export default function CreateInvoice() {
  const navigate = useNavigate();
  const { id } = useParams();
  const isEdit = Boolean(id);
  const [settings, setSettings] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const [showShipping, setShowShipping] = useState(false);
  const [showTaxes, setShowTaxes] = useState(false);
  const [validation, setValidation] = useState({});
  const [form, setForm] = useState({
    invoiceNumber: `INV-${new Date().getFullYear()}-XXXXXX`,
    invoiceDate: new Date().toISOString().slice(0, 10),
    dueDate: '',
    paymentMethod: 'UPI',
    status: 'Draft',
    currency: 'INR',
    customer: { name: '', email: '', phone: '' },
    billingAddress: { address: '' },
    shippingAddress: { name: '', address: '', phone: '' },
    items: [emptyItem()],
    tax: 0,
    discount: 0,
    notes: '',
  });

  const totals = useMemo(() => {
    const subTotal = form.items.reduce((sum, item) => sum + Number(item.qty || 0) * Number(item.price || 0), 0);
    const tax = Number(form.tax || 0);
    const discount = Number(form.discount || 0);
    return { subTotal, tax, discount, amount: Math.max(0, subTotal + tax - discount) };
  }, [form.items, form.tax, form.discount]);

  const loadData = async () => {
    setLoading(true);
    setError(null);
    try {
      const [settingsRes, invoiceRes] = await Promise.all([
        api.get('/settings'),
        isEdit ? api.get(`/invoices/${id}`) : Promise.resolve(null),
      ]);
      setSettings(settingsRes.data);
      if (invoiceRes?.data) {
        const invoice = invoiceRes.data;
        setForm({
          invoiceNumber: invoice.invoiceNumber,
          invoiceDate: invoice.date ? new Date(invoice.date).toISOString().slice(0, 10) : new Date().toISOString().slice(0, 10),
          dueDate: invoice.dueDate ? new Date(invoice.dueDate).toISOString().slice(0, 10) : '',
          paymentMethod: invoice.paymentMethod || 'UPI',
          status: invoice.status || 'Draft',
          currency: invoice.currency || 'INR',
          customer: {
            name: invoice.customerSnapshot?.name || '',
            email: invoice.customerSnapshot?.email || '',
            phone: invoice.customerSnapshot?.phone || '',
          },
          billingAddress: { address: invoice.billingAddressSnapshot?.address || '' },
          shippingAddress: {
            name: invoice.shippingAddressSnapshot?.name || '',
            address: invoice.shippingAddressSnapshot?.address || '',
            phone: invoice.shippingAddressSnapshot?.phone || '',
          },
          items: (invoice.productSnapshot || []).map((item) => ({
            id: crypto.randomUUID(),
            productName: item.productName || '',
            sku: item.sku || '',
            qty: item.qty || 1,
            price: item.price || 0,
          })),
          tax: invoice.totalsSnapshot?.tax || 0,
          discount: invoice.totalsSnapshot?.discount || 0,
          notes: invoice.notes || '',
        });
        if (invoice.shippingAddressSnapshot?.address || invoice.shippingAddressSnapshot?.name) setShowShipping(true);
        if (invoice.totalsSnapshot?.tax || invoice.totalsSnapshot?.discount) setShowTaxes(true);
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadData(); }, [id]);

  const setField = (path, value) => {
    setForm((prev) => {
      const next = structuredClone(prev);
      const keys = path.split('.');
      let ref = next;
      keys.slice(0, -1).forEach((key) => { ref = ref[key]; });
      ref[keys.at(-1)] = value;
      return next;
    });
  };

  const updateItem = (itemId, field, value) => {
    setForm((prev) => ({
      ...prev,
      items: prev.items.map((item) => item.id === itemId ? { ...item, [field]: value } : item),
    }));
  };

  const validate = () => {
    const next = {};
    if (!form.customer.name.trim()) next.customerName = 'Customer name is required.';
    if (!form.customer.phone.trim() && !form.customer.email.trim()) next.customerContact = 'Phone or email is required.';
    form.items.forEach((item, index) => {
      if (!item.productName.trim()) next[`item-${index}`] = 'Item name is required.';
      if (Number(item.qty) <= 0) next[`qty-${index}`] = 'Qty must be greater than 0.';
      if (Number(item.price) <= 0) next[`price-${index}`] = 'Price must be greater than 0.';
    });
    setValidation(next);
    return Object.keys(next).length === 0;
  };

  const handleSubmit = async () => {
    if (!validate()) return;
    setSaving(true);
    try {
      const payload = {
        invoiceDate: form.invoiceDate,
        dueDate: form.dueDate || undefined,
        paymentMethod: form.paymentMethod,
        currency: form.currency,
        status: form.status,
        customerSnapshot: form.customer,
        billingAddressSnapshot: form.billingAddress,
        shippingAddressSnapshot: form.shippingAddress.name || form.shippingAddress.address ? form.shippingAddress : undefined,
        productSnapshot: form.items.map((item) => ({
          productName: item.productName,
          sku: item.sku || 'MANUAL',
          qty: Number(item.qty),
          price: Number(item.price),
          total: Number(item.qty) * Number(item.price),
        })),
        totalsSnapshot: totals,
        notes: form.notes,
      };

      const res = isEdit ? await api.put(`/invoices/${id}`, payload) : await api.post('/invoices', payload);
      toast.success(isEdit ? 'Invoice updated' : 'Invoice created');
      navigate(`/invoices/${isEdit ? id : res.data._id}`);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to save invoice');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div>
        <PageHeader title={isEdit ? 'Edit Invoice' : 'Create Invoice'} description="Prepare a branded invoice using store settings." breadcrumbs={[{ label: 'Dashboard', path: '/dashboard' }, { label: 'Invoices', path: '/invoices' }, { label: isEdit ? 'Edit' : 'Create' }]} />
        <LoadingSkeleton type="cards" cards={4} />
      </div>
    );
  }

  if (error) {
    return (
      <div>
        <PageHeader title={isEdit ? 'Edit Invoice' : 'Create Invoice'} description="Prepare a branded invoice using store settings." breadcrumbs={[{ label: 'Dashboard', path: '/dashboard' }, { label: 'Invoices', path: '/invoices' }, { label: isEdit ? 'Edit' : 'Create' }]} />
        <ErrorState message={error} onRetry={loadData} />
      </div>
    );
  }

  return (
    <div>
      <div className="d-flex justify-content-between align-items-end mb-4">
        <div>
          <h2 className="mb-1 fw-bold">{isEdit ? 'Edit Invoice' : 'Create Invoice'}</h2>
          <div className="text-muted">Logo, signature, terms and bank details are pulled from Settings automatically.</div>
        </div>
        <div className="d-flex align-items-center gap-4">
          <div className="text-muted small fw-semibold d-none d-md-block">
            Dashboard <span className="mx-1">&rsaquo;</span> Invoices <span className="mx-1">&rsaquo;</span> {isEdit ? 'Edit' : 'Create'}
          </div>
          <Button variant="primary" onClick={() => navigate('/invoices')}><ArrowLeft size={18} className="me-1" />Back</Button>
        </div>
      </div>

      <Row className="g-3">
        <Col xl={8}>
          <FormSection title="Invoice Details">
            <Row className="g-3">
              <Col md={4}><Form.Label>Invoice #</Form.Label><Form.Control value={form.invoiceNumber} disabled /></Col>
              <Col md={4}><Form.Label>Invoice Date</Form.Label><Form.Control type="date" value={form.invoiceDate} onChange={(event) => setField('invoiceDate', event.target.value)} /></Col>
              <Col md={4}><Form.Label>Due Date</Form.Label><Form.Control type="date" value={form.dueDate} onChange={(event) => setField('dueDate', event.target.value)} /></Col>
              <Col md={4}><Form.Label>Status</Form.Label><Form.Select value={form.status} onChange={(event) => setField('status', event.target.value)}><option>Draft</option><option>Pending</option><option>Paid</option><option>Overdue</option></Form.Select></Col>
              <Col md={4}><Form.Label>Payment Method</Form.Label><Form.Select value={form.paymentMethod} onChange={(event) => setField('paymentMethod', event.target.value)}><option>Cash</option><option>UPI</option><option>Card</option><option>NetBanking</option><option>Wallet</option></Form.Select></Col>
              <Col md={4}><Form.Label>Currency</Form.Label><Form.Select value={form.currency} onChange={(event) => setField('currency', event.target.value)}><option value="INR">INR</option><option value="USD">USD</option><option value="EUR">EUR</option></Form.Select></Col>
            </Row>
          </FormSection>

          <FormSection title="Customer Details">
            <Row className="g-4">
              <Col md={6}>
                <h6 className="mb-3 text-white fw-bold">Billing Address</h6>
                <Form.Control className="mb-3" isInvalid={Boolean(validation.customerName)} value={form.customer.name} onChange={(event) => setField('customer.name', event.target.value)} placeholder="Name" />
                <Form.Control.Feedback type="invalid">{validation.customerName}</Form.Control.Feedback>
                <Form.Control className="mb-3" as="textarea" rows={3} value={form.billingAddress.address} onChange={(event) => setField('billingAddress.address', event.target.value)} placeholder="Address" />
                <Row className="g-2">
                  <Col md={12}>
                    <Form.Control value={form.customer.phone} onChange={(event) => setField('customer.phone', event.target.value)} placeholder="Phone Number" />
                  </Col>
                </Row>
              </Col>
              <Col md={6}>
                <div className="d-flex justify-content-between align-items-center mb-3">
                  <h6 className="mb-0 text-white fw-bold">Shipping Address</h6>
                  {showShipping && <Button variant="danger" size="sm" onClick={() => { setShowShipping(false); setField('shippingAddress', { name: '', address: '', phone: '' }); }}>Remove</Button>}
                </div>
                {!showShipping ? (
                  <Button variant="secondary" className="w-100 h-100" style={{ minHeight: '160px', borderStyle: 'dashed' }} onClick={() => setShowShipping(true)}>
                    <Plus size={20} className="me-2" /> Add Shipping Address
                  </Button>
                ) : (
                  <>
                    <Form.Control className="mb-3" value={form.shippingAddress.name} onChange={(event) => setField('shippingAddress.name', event.target.value)} placeholder="Name" />
                    <Form.Control className="mb-3" as="textarea" rows={3} value={form.shippingAddress.address} onChange={(event) => setField('shippingAddress.address', event.target.value)} placeholder="Address" />
                    <Row className="g-2">
                      <Col md={12}>
                        <Form.Control value={form.shippingAddress.phone} onChange={(event) => setField('shippingAddress.phone', event.target.value)} placeholder="Phone Number" />
                      </Col>
                    </Row>
                  </>
                )}
              </Col>
            </Row>
          </FormSection>

          <FormSection title="Line Items" actions={<Button variant="primary" onClick={() => setForm((prev) => ({ ...prev, items: [...prev.items, emptyItem()] }))}><Plus size={20} className="me-1" />Add Item</Button>}>
            <Table responsive bordered hover className="align-middle mb-0">
              <thead style={{ backgroundColor: 'rgba(255, 255, 255, 0.03)' }}>
                <tr className="text-uppercase" style={{ fontSize: '12px', letterSpacing: '0.5px' }}>
                  <th className="py-3 px-3" style={{ width: '40px' }}>#</th>
                  <th className="py-3 px-3">Item Description</th>
                  <th className="py-3 px-3" style={{ width: '15%' }}>SKU</th>
                  <th className="text-end py-3 px-3" style={{ width: '90px' }}>Qty</th>
                  <th className="text-end py-3 px-3" style={{ width: '130px' }}>Unit Price</th>
                  <th className="text-end py-3 px-3" style={{ width: '120px' }}>Amount</th>
                  <th className="text-center py-3 px-3" style={{ width: '60px' }}>Action</th>
                </tr>
              </thead>
              <tbody>
                {form.items.map((item, index) => (
                  <tr key={item.id}>
                    <td className="text-center fw-bold text-white-50">{index + 1}</td>
                    <td><Form.Control isInvalid={Boolean(validation[`item-${index}`])} value={item.productName} onChange={(event) => updateItem(item.id, 'productName', event.target.value)} placeholder="Product or service name" /></td>
                    <td><Form.Control value={item.sku} onChange={(event) => updateItem(item.id, 'sku', event.target.value)} placeholder="SKU" /></td>
                    <td><Form.Control className="text-end px-2" type="number" min="1" isInvalid={Boolean(validation[`qty-${index}`])} value={item.qty} onChange={(event) => updateItem(item.id, 'qty', event.target.value)} /></td>
                    <td><Form.Control className="text-end px-2" type="number" min="0" isInvalid={Boolean(validation[`price-${index}`])} value={item.price} onChange={(event) => updateItem(item.id, 'price', event.target.value)} /></td>
                    <td className="text-end fw-semibold">{formatCurrency(Number(item.qty || 0) * Number(item.price || 0))}</td>
                    <td className="text-center"><Button variant="danger" size="sm" className="Zooom-icon-btn" disabled={form.items.length === 1} onClick={() => setForm((prev) => ({ ...prev, items: prev.items.filter((row) => row.id !== item.id) }))}><Trash2 size={16} /></Button></td>
                  </tr>
                ))}
              </tbody>
            </Table>
          </FormSection>

          <FormSection title="Totals & Notes">
            <Row className="g-3">
              {!showTaxes && (
                <Col md={12} className="text-end">
                  <Button variant="secondary" size="sm" onClick={() => setShowTaxes(true)}>
                    + Add Tax / Discount
                  </Button>
                </Col>
              )}
              {showTaxes && (
                <>
                  <Col md={12}><div className="d-flex justify-content-between align-items-center mb-2"><h5 className="mb-0 text-dark fw-bold">Tax & Discount</h5><Button variant="danger" size="sm" onClick={() => { setShowTaxes(false); setField('tax', 0); setField('discount', 0); }}>Remove</Button></div></Col>
                  <Col md={6}>
                    <Form.Label>Tax Amount</Form.Label>
                    <Form.Control type="number" min="0" value={form.tax} onChange={(event) => setField('tax', event.target.value)} />
                  </Col>
                  <Col md={6}><Form.Label>Discount</Form.Label><Form.Control type="number" min="0" value={form.discount} onChange={(event) => setField('discount', event.target.value)} /></Col>
                </>
              )}
              <Col md={12}><Form.Label>Notes</Form.Label><Form.Control as="textarea" rows={3} value={form.notes} onChange={(event) => setField('notes', event.target.value)} placeholder={settings?.invoiceFooter || 'Thank you for your business.'} /></Col>
            </Row>
          </FormSection>
        </Col>

        <Col xl={4}>
          <Card className="Zooom-section-card sticky-xl-top" style={{ top: 96 }}>
            <Card.Body>
              <div className="d-flex align-items-center gap-3 mb-4">
                {settings?.storeLogo ? <img src={settings.storeLogo} alt="Store logo" style={{ width: 56, height: 56, objectFit: 'contain' }} /> : <div className="Zooom-modal-icon bg-primary-subtle text-primary">K</div>}
                <div>
                  <h2 className="Zooom-section-title mb-1">{settings?.storeName || 'Zooom'}</h2>
                  <p className="text-muted mb-0">{settings?.gstNumber || 'GST details from settings'}</p>
                </div>
              </div>
              <div className="border-top border-bottom py-3 mb-3">
                <div className="d-flex justify-content-between mb-2"><span className="text-muted">Subtotal</span><strong>{formatCurrency(totals.subTotal)}</strong></div>
                <div className="d-flex justify-content-between mb-2"><span className="text-muted">Tax</span><strong>{formatCurrency(totals.tax)}</strong></div>
                <div className="d-flex justify-content-between mb-2"><span className="text-muted">Discount</span><strong>- {formatCurrency(totals.discount)}</strong></div>
                <div className="d-flex justify-content-between fs-4"><strong>Total</strong><strong className="text-primary">{formatCurrency(totals.amount)}</strong></div>
              </div>
              <div className="text-end mb-4">
                {settings?.authorizedSignature ? <img src={settings.authorizedSignature} alt="Authorized signature" style={{ maxWidth: 180, maxHeight: 72, objectFit: 'contain' }} /> : <div className="text-muted">Signature from settings</div>}
                <div className="border-top mt-2 pt-2 text-muted">Authorized Signature</div>
              </div>
              <Button className="w-100" variant="primary" disabled={saving} onClick={handleSubmit}>
                {saving ? <Spinner size="sm" /> : <Save size={20} />}
                {isEdit ? 'Update Invoice' : 'Save Invoice'}
              </Button>
            </Card.Body>
          </Card>
        </Col>
      </Row>
    </div>
  );
}
