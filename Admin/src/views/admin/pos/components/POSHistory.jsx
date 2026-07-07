import React, { useState, useEffect } from 'react';
import { Offcanvas, Table, Button, Badge } from 'react-bootstrap';
import { fetchApi } from '@/utils/api';
import { formatCurrency } from '@/utils/format';
import POSReturn from './POSReturn';

const STATUS_COLORS = {
  Pending: 'warning', Confirmed: 'info', Assigned: 'primary',
  OutForDelivery: 'secondary', Delivered: 'success', Cancelled: 'danger', Returned: 'danger',
};

export default function POSHistory({ onClose, onReprint }) {
  const [invoices, setInvoices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [returnInvoice, setReturnInvoice] = useState(null);

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
    console.warn(`Invoice lookup endpoint is required before reprinting order ${orderId}.`);
  };

  if (returnInvoice) {
    return <POSReturn invoice={returnInvoice} onBack={() => setReturnInvoice(null)} onComplete={loadInvoices} />;
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
                      <Button size="sm" variant="outline-primary" onClick={() => handleReprintClick(order._id)}>Reprint</Button>
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
