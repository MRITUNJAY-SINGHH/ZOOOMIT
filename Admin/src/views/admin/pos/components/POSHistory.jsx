import React, { useState, useEffect } from 'react';
import { Offcanvas, Table, Button, Badge } from 'react-bootstrap';
import { fetchApi } from '@/utils/api';
import { formatCurrency } from '@/utils/format';
import POSReturn from './POSReturn';
import InvoicePrintOut from './InvoicePrintOut';
import { toast } from 'react-hot-toast';

const STATUS_COLORS = {
  Pending: 'warning', Confirmed: 'info', Assigned: 'primary',
  OutForDelivery: 'secondary', Delivered: 'success', Cancelled: 'danger', Returned: 'danger',
};

export default function POSHistory({ onClose, onReprint }) {
  const [invoices, setInvoices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [reprintingId, setReprintingId] = useState(null);
  const [returnInvoice, setReturnInvoice] = useState(null);
  const [invoiceToPrint, setInvoiceToPrint] = useState(null);

  useEffect(() => {
    loadInvoices();
  }, []);

  const loadInvoices = async () => {
    try {
      const data = await fetchApi('/orders?orderType=OFFLINE&page=1&limit=50');
      const offlineOrders = data.data || [];
      setInvoices(offlineOrders);
    } catch (e) {
      console.error(e);
    }
    setLoading(false);
  };

  const handleReprintClick = async (orderId) => {
    setReprintingId(orderId);
    try {
      const res = await fetchApi(`/invoices?order=${orderId}&limit=1`);
      if (res.invoices && res.invoices.length > 0) {
        setInvoiceToPrint(res.invoices[0]);
      } else {
        const orderData = await fetchApi(`/orders/${orderId}`);
        if (orderData) {
          const fallbackInvoice = {
            invoiceNumber: orderData.billNumber || orderData.orderNumber,
            createdAt: orderData.createdAt,
            customerSnapshot: { name: orderData.customer?.name || 'Walk-In', phone: orderData.customer?.phone || '' },
            productSnapshot: orderData.items.map(i => ({ productName: i.productName, sku: i.sku || 'N/A', qty: i.qty, price: i.price, total: i.price * i.qty })),
            totalsSnapshot: { subTotal: orderData.amount, tax: 0, discount: 0, amount: orderData.amount },
            isCancelled: orderData.status === 'Cancelled' || orderData.status === 'Returned'
          };
          setInvoiceToPrint(fallbackInvoice);
        } else {
          toast.error("Order details not found.");
        }
      }
    } catch (e) {
      console.error(e);
      toast.error("Error fetching invoice details.");
    } finally {
      setReprintingId(null);
    }
  };

  if (returnInvoice) {
    return <POSReturn invoice={returnInvoice} onBack={() => setReturnInvoice(null)} onComplete={loadInvoices} />;
  }

  if (invoiceToPrint) {
    return <InvoicePrintOut invoice={invoiceToPrint} onBack={() => setInvoiceToPrint(null)} />;
  }

  return (
    <Offcanvas show={true} onHide={onClose} placement="end" style={{ width: '800px' }}>
      <Offcanvas.Header closeButton className="border-bottom border-dark">
        <Offcanvas.Title className="fw-semibold">POS Billing History</Offcanvas.Title>
      </Offcanvas.Header>
      <Offcanvas.Body className="p-0">
        {loading ? <div className="p-4 text-center text-muted">Loading history...</div> : (
          <Table responsive hover className="align-middle mb-0 border-0">
            <thead className="bg-dark text-light">
              <tr>
                <th className="ps-4 border-0">Bill #</th>
                <th className="border-0">Date</th>
                <th className="border-0">Amount</th>
                <th className="border-0">Status</th>
                <th className="pe-4 border-0 text-end">Actions</th>
              </tr>
            </thead>
            <tbody>
              {invoices.length === 0 && (
                <tr><td colSpan="5" className="text-center py-5 text-muted">No offline orders found.</td></tr>
              )}
              {invoices.map(order => (
                <tr key={order._id}>
                  <td className="ps-4 text-primary fw-medium">{order.billNumber || order.orderNumber}</td>
                  <td>
                    {new Date(order.createdAt).toLocaleDateString()}
                    <div className="text-muted fs-12">{new Date(order.createdAt).toLocaleTimeString()}</div>
                  </td>
                  <td className="fw-semibold">{formatCurrency(order.amount)}</td>
                  <td><Badge bg={STATUS_COLORS[order.status] || 'secondary'}>{order.status}</Badge></td>
                  <td className="pe-4 text-end">
                    <div className="d-flex justify-content-end gap-2 flex-column flex-sm-row">
                      <Button 
                        size="sm" 
                        variant="outline-primary" 
                        onClick={() => handleReprintClick(order._id)}
                        disabled={reprintingId === order._id}
                      >
                        {reprintingId === order._id ? 'Loading...' : 'Reprint'}
                      </Button>
                      <Button size="sm" variant="outline-danger" onClick={() => setReturnInvoice(order)} disabled={order.status === 'Returned'}>Return</Button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </Table>
        )}
      </Offcanvas.Body>
    </Offcanvas>
  );
}
