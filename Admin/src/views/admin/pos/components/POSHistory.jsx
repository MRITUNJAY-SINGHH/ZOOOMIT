import React, { useState, useEffect } from 'react';
import { Offcanvas, Table, Button, Badge } from 'react-bootstrap';
import { fetchApi } from '@/utils/api';
import { formatCurrency } from '@/utils/format';
import POSReturn from './POSReturn';

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
      <Offcanvas.Header closeButton>
        <Offcanvas.Title>POS Billing History</Offcanvas.Title>
      </Offcanvas.Header>
      <Offcanvas.Body>
        {loading ? <p>Loading history...</p> : (
          <Table striped hover responsive>
            <thead>
              <tr>
                <th>Bill #</th>
                <th>Date</th>
                <th>Amount</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {invoices.map(order => (
                <tr key={order._id}>
                  <td>{order.billNumber || order.orderNumber}</td>
                  <td>{new Date(order.createdAt).toLocaleString()}</td>
                  <td>{formatCurrency(order.amount)}</td>
                  <td><Badge bg={order.status === 'Returned' ? 'danger' : 'success'}>{order.status}</Badge></td>
                  <td>
                    <Button size="sm" variant="outline-primary" className="me-2" onClick={() => handleReprintClick(order._id)}>Reprint</Button>
                    <Button size="sm" variant="outline-danger" onClick={() => setReturnInvoice(order)} disabled={order.status === 'Returned'}>Return</Button>
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
