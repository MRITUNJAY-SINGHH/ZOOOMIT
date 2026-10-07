import React, { useEffect, useState } from 'react';
import { Button, Card, Col, Row, Table } from 'react-bootstrap';
import { ArrowLeft, Download, Edit, Printer, Send } from 'lucide-react';
import { useNavigate, useParams } from 'react-router';
import api from '@/utils/api';
import { generatePremiumInvoicePDF } from '@/utils/invoicePdfGenerator';
import PageHeader from '@/components/common/PageHeader';
import ErrorState from '@/components/common/ErrorState';
import LoadingSkeleton from '@/components/common/LoadingSkeleton';
import StatusBadge from '@/components/common/StatusBadge';
import { formatCurrency, formatDate } from '@/utils/format';
import toast from 'react-hot-toast';

export default function ViewInvoice() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [invoice, setInvoice] = useState(null);
  const [settings, setSettings] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const loadData = async () => {
    setLoading(true);
    setError(null);
    try {
      const [invoiceRes, settingsRes] = await Promise.all([api.get(`/invoices/${id}`), api.get('/settings')]);
      setInvoice(invoiceRes.data);
      setSettings(settingsRes.data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadData(); }, [id]);

  const downloadPDF = () => {
    generatePremiumInvoicePDF(invoice, settings);
  };

  if (loading) {
    return (
      <div>
        <PageHeader title="Invoice" description="Loading invoice details." breadcrumbs={[{ label: 'Dashboard', path: '/dashboard' }, { label: 'Invoices', path: '/invoices' }, { label: 'View' }]} />
        <LoadingSkeleton type="cards" cards={3} />
      </div>
    );
  }

  if (error || !invoice) {
    return (
      <div>
        <PageHeader title="Invoice" description="View branded invoice document." breadcrumbs={[{ label: 'Dashboard', path: '/dashboard' }, { label: 'Invoices', path: '/invoices' }, { label: 'View' }]} />
        <ErrorState message={error || 'Invoice not found'} onRetry={loadData} />
      </div>
    );
  }

  return (
    <div>
      <div className="d-flex justify-content-between align-items-center mb-4">
        <div>
          <h2 className="mb-1 fw-bold">{invoice.invoiceNumber}</h2>
          <div className="text-white-50">View, print, download or edit this invoice.</div>
        </div>
        <div className="d-flex align-items-center gap-4">
          <div className="text-muted small fw-semibold d-none d-md-block">
            Dashboard <span className="mx-1">&rsaquo;</span> Invoices <span className="mx-1">&rsaquo;</span> {invoice.invoiceNumber}
          </div>
          <Button variant="primary" onClick={() => navigate('/invoices')}><ArrowLeft size={18} className="me-1" />Back</Button>
        </div>
      </div>

      <Row className="g-3">
        <Col xl={9}>
          <Card id="invoice-print-area" className="Zooom-invoice-document">
            <Card.Body>
              <div className="d-flex flex-column flex-md-row justify-content-between gap-4 mb-4">
                <div className="d-flex align-items-center gap-3">
                  {settings?.storeLogo ? <img src={settings.storeLogo} alt="Store logo" className="Zooom-invoice-logo" /> : <div className="Zooom-invoice-logo-fallback">K</div>}
                  <div>
                    <h2 className="mb-1">{settings?.storeName || 'Zooom'}</h2>
                    <div className="text-muted">{settings?.address || 'Store address from settings'}</div>
                    <div className="text-muted">{settings?.storePhone || ''} {settings?.storeEmail ? `· ${settings.storeEmail}` : ''}</div>
                    {settings?.gstNumber && <div className="text-muted">GST: {settings.gstNumber}</div>}
                  </div>
                </div>
                <div className="text-md-end">
                  <h1 className="mb-2">Invoice</h1>
                  <div className="fw-semibold text-primary">{invoice.invoiceNumber}</div>
                  <StatusBadge status={invoice.status || (invoice.isCancelled ? 'Cancelled' : 'Paid')} className="mt-2" />
                </div>
              </div>

              <Row className="g-3 mb-4">
                <Col md={4}><div className="Zooom-invoice-meta"><span>Date</span><strong>{formatDate(invoice.date)}</strong></div></Col>
                <Col md={4}><div className="Zooom-invoice-meta"><span>Due Date</span><strong>{invoice.dueDate ? formatDate(invoice.dueDate) : '-'}</strong></div></Col>
                <Col md={4}><div className="Zooom-invoice-meta"><span>Payment</span><strong>{invoice.paymentMethod || '-'}</strong></div></Col>
              </Row>

              <Row className="g-3 mb-4">
                <Col md={6}>
                  <div className="p-4 rounded-3 h-100" style={{ backgroundColor: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.05)' }}>
                    <div className="text-white-50 fw-bold mb-3">Billed To</div>
                    <h3 className="text-white mb-3 fs-5 fw-bold">{invoice.customerSnapshot?.name || 'Walk-in Customer'}</h3>
                    {invoice.billingAddressSnapshot?.address && <div className="mb-2 text-white-50">{invoice.billingAddressSnapshot.address}</div>}
                    {invoice.customerSnapshot?.email && <div className="mb-2 text-white-50">{invoice.customerSnapshot.email}</div>}
                    {invoice.customerSnapshot?.phone && <div className="mb-0 text-white-50">{invoice.customerSnapshot.phone}</div>}
                  </div>
                </Col>
                <Col md={6}>
                  <div className="p-4 rounded-3 h-100" style={{ backgroundColor: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.05)' }}>
                    <div className="text-white-50 fw-bold mb-3">Shipped To</div>
                    <h3 className="text-white mb-3 fs-5 fw-bold">{invoice.shippingAddressSnapshot?.name || invoice.customerSnapshot?.name || 'Same as billing'}</h3>
                    {(invoice.shippingAddressSnapshot?.address || invoice.billingAddressSnapshot?.address) && <div className="mb-2 text-white-50">{invoice.shippingAddressSnapshot?.address || invoice.billingAddressSnapshot?.address}</div>}
                    {(invoice.shippingAddressSnapshot?.email || invoice.customerSnapshot?.email) && <div className="mb-2 text-white-50">{invoice.shippingAddressSnapshot?.email || invoice.customerSnapshot?.email}</div>}
                    {(invoice.shippingAddressSnapshot?.phone || invoice.customerSnapshot?.phone) && <div className="mb-0 text-white-50">{invoice.shippingAddressSnapshot?.phone || invoice.customerSnapshot?.phone}</div>}
                  </div>
                </Col>
              </Row>

              <Table responsive className="align-middle mb-4">
                <thead className="table-light text-dark">
                  <tr>
                    <th className="py-3 px-3">#</th>
                    <th className="py-3 px-3">Item Description</th>
                    <th className="py-3 px-3 text-center">HSN</th>
                    <th className="text-center py-3 px-3">Qty / Unit</th>
                    <th className="text-end py-3 px-3">Rate</th>
                    <th className="text-end py-3 px-3">Amount</th>
                  </tr>
                </thead>
                <tbody>
                  {(invoice.productSnapshot || []).map((item, index) => (
                    <tr key={`${item.productName}-${index}`}>
                      <td className="px-3 fw-bold">{index + 1}</td>
                      <td className="px-3">
                        <div className="fw-bold">{item.productName}</div>
                        <div className="text-muted small">
                          {item.sku && <span>SKU: {item.sku} • </span>}
                          <span>GST: {item.taxRate || 0}%</span>
                        </div>
                      </td>
                      <td className="px-3 text-center font-monospace text-muted">{item.hsnCode || '-'}</td>
                      <td className="px-3 text-center fw-semibold">{item.qty} {item.unit || 'PCS'}</td>
                      <td className="px-3 text-end">{formatCurrency(item.price)}</td>
                      <td className="px-3 text-end fw-bold">{formatCurrency(item.total)}</td>
                    </tr>
                  ))}
                </tbody>
              </Table>

              <Row className="justify-content-end mb-4">
                <Col md={6}>
                  <div className="Zooom-invoice-total-row"><span>Gross Subtotal</span><strong>{formatCurrency(invoice.totalsSnapshot?.subTotal)}</strong></div>
                  {invoice.totalsSnapshot?.taxableAmount > 0 && (
                    <div className="Zooom-invoice-total-row"><span>Taxable Value</span><strong>{formatCurrency(invoice.totalsSnapshot.taxableAmount)}</strong></div>
                  )}
                  {invoice.totalsSnapshot?.cgst > 0 && (
                    <div className="Zooom-invoice-total-row text-muted small"><span>• CGST</span><strong>{formatCurrency(invoice.totalsSnapshot.cgst)}</strong></div>
                  )}
                  {invoice.totalsSnapshot?.sgst > 0 && (
                    <div className="Zooom-invoice-total-row text-muted small"><span>• SGST</span><strong>{formatCurrency(invoice.totalsSnapshot.sgst)}</strong></div>
                  )}
                  {invoice.totalsSnapshot?.tax > 0 && (
                    <div className="Zooom-invoice-total-row"><span>Total GST</span><strong>{formatCurrency(invoice.totalsSnapshot?.tax)}</strong></div>
                  )}
                  {invoice.totalsSnapshot?.discount > 0 && (
                    <div className="Zooom-invoice-total-row text-success"><span>Discount</span><strong>- {formatCurrency(invoice.totalsSnapshot?.discount)}</strong></div>
                  )}
                  <div className="Zooom-invoice-grand-total text-primary"><span className="text-primary">Total Amount Due</span><strong>{formatCurrency(invoice.totalsSnapshot?.amount)}</strong></div>
                </Col>
              </Row>

              <Row className="g-3">
                <Col md={7}>
                  <div className="Zooom-invoice-box">
                    <span>Terms & Notes</span>
                    <p>{settings?.termsAndConditions || 'Terms are managed from Settings.'}</p>
                    <p>{invoice.notes || settings?.invoiceFooter || 'Thank you for your business.'}</p>
                  </div>
                </Col>
                <Col md={5}>
                  <div className="Zooom-invoice-box">
                    <span>Bank Details</span>
                    <p>{settings?.bankDetails?.bankName || '-'}</p>
                    <p>{settings?.bankDetails?.accountName || ''} {settings?.bankDetails?.accountNumber ? `· ${settings.bankDetails.accountNumber}` : ''}</p>
                    <p>{settings?.bankDetails?.ifscCode || ''}</p>
                  </div>
                </Col>
              </Row>

              <div className="Zooom-invoice-signature">
                {settings?.authorizedSignature ? <img src={settings.authorizedSignature} alt="Authorized signature" /> : <strong>{settings?.storeName || 'ZOOOMIT'}</strong>}
                <span>Authorized Signature</span>
              </div>
            </Card.Body>
          </Card>
        </Col>

        <Col xl={3} className="d-print-none">
          <Card className="Zooom-section-card sticky-xl-top" style={{ top: 96 }}>
            <Card.Body className="d-grid gap-2">
              <Button variant="outline-info" onClick={() => navigate(`/invoices/edit/${id}`)}><Edit size={20} />Edit</Button>
              <Button variant="primary" onClick={() => generatePremiumInvoicePDF(invoice, settings, 'print')}><Printer size={20} />Print</Button>
              <Button variant="outline-primary" onClick={downloadPDF}><Download size={20} />Download</Button>
              <Button variant="outline-info" onClick={() => toast.success('Invoice send action queued')}><Send size={20} />Send</Button>
            </Card.Body>
          </Card>
        </Col>
      </Row>

      <style>{`
        @media print {
          body * { visibility: hidden; }
          #invoice-print-area, #invoice-print-area * { visibility: visible; }
          #invoice-print-area { position: absolute; left: 0; top: 0; width: 100%; }
          .d-print-none, .app-topbar, .app-sidenav { display: none !important; }
        }
      `}</style>
    </div>
  );
}
