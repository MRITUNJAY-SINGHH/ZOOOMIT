import React, { useState, useEffect } from 'react';
import { Row, Col, Card, Table, Button, Spinner } from 'react-bootstrap';
import { useParams, useNavigate } from 'react-router';
import Icon from '@/components/wrappers/Icon';
import api from '@/utils/api';
import toast from 'react-hot-toast';
import { QRCodeSVG } from 'qrcode.react';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';

export default function ViewInvoice() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [invoice, setInvoice] = useState(null);
  const [settings, setSettings] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [invoiceRes, settingsRes] = await Promise.all([
        api.get(`/invoices/${id}`),
        api.get('/settings')
      ]);
      setInvoice(invoiceRes.data);
      setSettings(settingsRes.data);
    } catch (error) {
      console.error(error);
      toast.error('Failed to load invoice or settings');
      navigate('/invoices');
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (amount, currencyCode = 'INR') => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: currencyCode,
      minimumFractionDigits: 2
    }).format(amount || 0);
  };

  const downloadPDF = () => {
    if (!invoice) return;
    const doc = new jsPDF();
    doc.setFontSize(20);
    doc.text(`Invoice ${invoice.invoiceNumber}`, 14, 22);

    const tableColumn = ["Description", "Qty", "Price", "Total"];
    const tableRows = [];

    invoice.productSnapshot.forEach(item => {
      tableRows.push([
        item.productName,
        item.qty,
        formatCurrency(item.price, invoice.currency),
        formatCurrency(item.total, invoice.currency)
      ]);
    });

    autoTable(doc, {
      startY: 45,
      head: [tableColumn],
      body: tableRows,
      theme: 'grid',
      headStyles: { fillColor: [115, 51, 216] },
    });

    const finalY = doc.lastAutoTable.finalY || 45;
    doc.setFontSize(12);
    doc.setTextColor(0);
    doc.text(`Total Amount: ${formatCurrency(invoice.totalsSnapshot?.amount, invoice.currency)}`, 14, finalY + 15);

    doc.save(`${invoice.invoiceNumber}.pdf`);
  };

  if (loading) {
    return (
      <div className="d-flex justify-content-center align-items-center" style={{ minHeight: '80vh' }}>
        <Spinner animation="border" variant="primary" />
      </div>
    );
  }

  if (!invoice) {
    return (
      <div className="text-center py-5">
        <Icon icon="lucide:file-x" width={48} className="text-muted mb-3" />
        <h4 className="text-white">Invoice not found</h4>
        <Button variant="outline-light" className="mt-3" onClick={() => navigate('/invoices')}>Back to Invoices</Button>
      </div>
    );
  }

  const storeName = settings?.storeName || 'KUIKLO';
  const logo = settings?.logo || null;

  return (
    <div className="py-4">
      <Row>
        {/* Main Invoice Document */}
        <Col xl={9}>
          <Card id="invoice-print-area" className="shadow-none" style={{ backgroundColor: 'var(--bs-tertiary-bg)', border: '1px solid var(--bs-border-color)' }}>
            <Card.Body className="p-5">

              {/* Header */}
              <Row className="justify-content-between align-items-center mb-5">
                <Col xs={12} sm={6} className="mb-4 mb-sm-0">
                  <div className="d-flex align-items-center gap-3">
                    {logo ? (
                      <img src={logo} alt="Logo" style={{ height: 48, objectFit: 'contain' }} />
                    ) : (
                      <div className="bg-primary rounded-circle d-flex align-items-center justify-content-center" style={{ width: 48, height: 48 }}>
                        <Icon icon="lucide:file-text" width={24} color="#fff" />
                      </div>
                    )}
                    <h2 className="mb-0 fw-bold" style={{ letterSpacing: '1px', textTransform: 'uppercase', fontSize: '20px' }}>{storeName}</h2>
                  </div>
                </Col>
                <Col xs={12} sm={6} className="text-sm-end">
                  <div className="d-inline-block text-start p-3 rounded" style={{ backgroundColor: 'rgba(255, 255, 255, 0.03)', border: '1px solid var(--bs-border-color)' }}>
                    <p className="text-muted mb-1 fw-bold" style={{ fontSize: '11px', letterSpacing: '1px' }}>INVOICE NUMBER</p>
                    <p className="mb-0 fw-bold text-primary" style={{ fontSize: '18px' }}>{invoice.invoiceNumber}</p>
                  </div>
                </Col>
              </Row>

              <hr className="border-secondary mb-5" />

              {/* Addresses */}
              <Row className="mb-5">
                <Col sm={6} className="mb-4 mb-sm-0">
                  <p className="text-muted fw-bold mb-3" style={{ fontSize: '11px', letterSpacing: '1px' }}>BILLED TO</p>
                  <h6 className="fw-bold mb-2">{invoice.customerSnapshot?.name || 'Walk-in Customer'}</h6>
                  {invoice.billingAddressSnapshot?.address && <p className="text-muted mb-1" style={{ fontSize: '14px' }}>{invoice.billingAddressSnapshot.address}</p>}
                  {invoice.customerSnapshot?.phone && <p className="text-muted mb-1" style={{ fontSize: '14px' }}>{invoice.customerSnapshot.phone}</p>}
                </Col>
                <Col sm={6} className="text-sm-end">
                  <p className="text-muted fw-bold mb-3" style={{ fontSize: '11px', letterSpacing: '1px' }}>SHIPPED TO</p>
                  {invoice.shippingAddressSnapshot?.name ? (
                    <>
                      <h6 className="fw-bold mb-2">{invoice.shippingAddressSnapshot.name}</h6>
                      <p className="text-muted mb-1" style={{ fontSize: '14px' }}>{invoice.shippingAddressSnapshot.address}</p>
                      <p className="text-muted mb-1" style={{ fontSize: '14px' }}>{invoice.shippingAddressSnapshot.phone}</p>
                    </>
                  ) : (
                    <p className="text-muted" style={{ fontSize: '14px' }}>Same as billing address</p>
                  )}
                </Col>
              </Row>

              {/* Dates & Info */}
              <Row className="mb-5 p-4 rounded" style={{ backgroundColor: 'rgba(255, 255, 255, 0.02)', border: '1px solid var(--bs-border-color)' }}>
                <Col xs={6} sm={4} className="mb-3 mb-sm-0">
                  <p className="text-muted fw-bold mb-1" style={{ fontSize: '11px', letterSpacing: '1px' }}>INVOICE DATE</p>
                  <p className="fw-medium mb-0" style={{ fontSize: '14px' }}>{new Date(invoice.date).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}</p>
                </Col>
                <Col xs={6} sm={4} className="mb-3 mb-sm-0">
                  <p className="text-muted fw-bold mb-1" style={{ fontSize: '11px', letterSpacing: '1px' }}>DUE DATE</p>
                  <p className="fw-medium mb-0" style={{ fontSize: '14px' }}>{invoice.dueDate ? new Date(invoice.dueDate).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }) : '-'}</p>
                </Col>
                {invoice.paymentMethod && (
                  <Col xs={12} sm={4}>
                    <p className="text-muted fw-bold mb-1" style={{ fontSize: '11px', letterSpacing: '1px' }}>PAYMENT METHOD</p>
                    <p className="fw-medium mb-0" style={{ fontSize: '14px' }}>{invoice.paymentMethod}</p>
                  </Col>
                )}
              </Row>

              {/* Items Table */}
              <div className="table-responsive mb-4">
                <Table className="mb-0" style={{ borderCollapse: 'separate', borderSpacing: '0 8px' }}>
                  <thead className="custom-table-thead" style={{
                    fontSize: '12px',
                    textTransform: 'uppercase',
                    letterSpacing: '0.5px',
                    backgroundColor: 'rgba(255, 255, 255, 0.03)'
                  }}>
                    <tr>
                      <th className="py-2 text-muted border-dashed px-3" style={{ width: '40px' }}>#</th>
                      <th className="py-2 text-muted border-dashed px-3">PRODUCT DETAILS</th>
                      <th className="py-2 text-muted border-dashed px-3 text-center" style={{ width: '100px' }}>QTY</th>
                      <th className="py-2 text-muted border-dashed px-3 text-end" style={{ width: '120px' }}>UNIT PRICE</th>
                      <th className="py-2 text-muted border-dashed px-3 text-end" style={{ width: '120px' }}>TOTAL</th>
                    </tr>
                  </thead>
                  <tbody>
                    {invoice.productSnapshot?.map((item, index) => (
                      <tr key={index} style={{ backgroundColor: 'rgba(var(--bs-primary-rgb), 0.05)' }}>
                        <td className="align-middle border-0 rounded-start px-3 text-muted">{String(index + 1).padStart(2, '0')}</td>
                        <td className="align-middle border-0 px-3">
                          <p className="fw-medium mb-0" style={{ fontSize: '14px' }}>{item.productName}</p>
                          {item.sku && item.sku !== 'MANUAL' && <p className="text-muted mb-0" style={{ fontSize: '12px' }}>SKU: {item.sku}</p>}
                        </td>
                        <td className="align-middle border-0 px-3 text-center text-muted" style={{ fontSize: '14px' }}>{item.qty}</td>
                        <td className="align-middle border-0 px-3 text-end text-muted" style={{ fontSize: '14px' }}>{formatCurrency(item.price, invoice.currency)}</td>
                        <td className="align-middle border-0 px-3 text-end fw-medium rounded-end" style={{ fontSize: '14px' }}>{formatCurrency(item.total, invoice.currency)}</td>
                      </tr>
                    ))}
                  </tbody>
                </Table>
              </div>

              {/* Totals */}
              <Row className="justify-content-end mb-5 pt-3">
                <Col md={6} lg={4}>
                  <div className="d-flex justify-content-between align-items-center mb-3">
                    <span className="text-muted fw-medium" style={{ fontSize: '14px' }}>Subtotal</span>
                    <span>{formatCurrency(invoice.totalsSnapshot?.subTotal, invoice.currency)}</span>
                  </div>
                  <div className="d-flex justify-content-between align-items-center mb-3">
                    <span className="text-muted fw-medium" style={{ fontSize: '14px' }}>Shipping</span>
                    <span>Free</span>
                  </div>
                  {invoice.totalsSnapshot?.discount > 0 && (
                    <div className="d-flex justify-content-between align-items-center mb-3">
                      <span className="text-muted fw-medium" style={{ fontSize: '14px' }}>Discount</span>
                      <span className="text-danger">- {formatCurrency(invoice.totalsSnapshot.discount, invoice.currency)}</span>
                    </div>
                  )}
                  {invoice.totalsSnapshot?.tax > 0 && (
                    <div className="d-flex justify-content-between align-items-center mb-3">
                      <span className="text-muted fw-medium" style={{ fontSize: '14px' }}>Tax</span>
                      <span>{formatCurrency(invoice.totalsSnapshot.tax, invoice.currency)}</span>
                    </div>
                  )}
                  <hr className="border-secondary mb-3 mt-2" />
                  <div className="d-flex justify-content-between align-items-center">
                    <span className="fw-bold" style={{ fontSize: '16px' }}>Total</span>
                    <span className="fw-bold text-primary" style={{ fontSize: '24px' }}>{formatCurrency(invoice.totalsSnapshot?.amount, invoice.currency)}</span>
                  </div>
                </Col>
              </Row>

              {/* Notes & Footer */}
              <div className="mb-4 p-3 rounded" style={{ backgroundColor: 'rgba(var(--bs-primary-rgb), 0.05)' }}>
                <p className="text-muted mb-0" style={{ fontSize: '13px' }}>
                  <span className="fw-medium">Note: </span>
                  {invoice.notes || settings.invoiceFooter || 'Please make payment within 10 days. For any billing inquiries, contact us.'}
                </p>
              </div>

              <div>
                <p className="fw-bold mb-4" style={{ fontSize: '14px' }}>Thank you for your business!</p>
                <div style={{ display: 'inline-block', borderBottom: '1px solid var(--bs-secondary-color)', paddingBottom: '4px' }}>
                  <p className="mb-0" style={{ fontFamily: 'cursive', fontSize: '24px', color: 'var(--bs-primary)' }}>{storeName}</p>
                </div>
                <p className="text-muted mt-2 mb-0" style={{ fontSize: '12px', fontStyle: 'italic' }}>Authorized Signature</p>
              </div>

            </Card.Body>
          </Card>
        </Col>

        <Col xl={3} className="d-print-none">
          <Card style={{ position: 'sticky', top: '100px' }}>
            <Card.Body className="p-4 d-flex flex-column gap-2">
              <Button
                variant="dark"
                className="w-100 py-2 d-flex align-items-center justify-content-center gap-2"
                style={{ backgroundColor: 'var(--bs-body-bg)', color: 'var(--bs-body-color)', border: '1px solid var(--bs-border-color)' }}
                onClick={() => navigate(`/invoices/edit/${id}`)}
              >
                <Icon icon="lucide:edit-3" width={18} /> Edit
              </Button>
              <Button
                variant="primary"
                className="w-100 py-2 d-flex align-items-center justify-content-center gap-2 fw-medium text-white"
                style={{ backgroundColor: 'var(--theme-primary)', border: 'none' }}
                onClick={() => window.print()}
              >
                <Icon icon="lucide:printer" width={18} /> Print
              </Button>
              <Button
                variant="info"
                className="w-100 py-2 d-flex align-items-center justify-content-center gap-2 fw-medium text-white"
                style={{ backgroundColor: '#0dcaf0', border: 'none' }}
                onClick={downloadPDF}
              >
                <Icon icon="lucide:download" width={18} /> Download
              </Button>
              <Button
                variant="danger"
                className="w-100 py-2 d-flex align-items-center justify-content-center gap-2 fw-bold text-white"
                style={{ backgroundColor: '#ff4d4f', border: 'none' }}
                onClick={() => toast.success('Invoice Sent!')}
              >
                <Icon icon="lucide:send" width={18} /> Send
              </Button>
            </Card.Body>
          </Card>
        </Col>
      </Row>
      <style>
        {`
          @media print {
            body * {
              visibility: hidden;
            }
            #invoice-print-area, #invoice-print-area * {
              visibility: visible;
            }
            #invoice-print-area {
              position: absolute;
              left: 0;
              top: 0;
              width: 100%;
            }
            .d-print-none {
              display: none !important;
            }
          }
        `}
      </style>
    </div>
  );
}
