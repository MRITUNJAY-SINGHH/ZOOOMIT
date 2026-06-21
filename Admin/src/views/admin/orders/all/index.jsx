import React, { useState, useEffect } from 'react';
import { Card, Table, Badge, Button, Tabs, Tab } from 'react-bootstrap';
import { fetchApi } from '@/utils/api';
import OrderDetails from '../details/index';

export default function OrdersList() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [viewOrderId, setViewOrderId] = useState(null);
  const [activeTab, setActiveTab] = useState('ALL');

  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalRecords, setTotalRecords] = useState(0);

  useEffect(() => {
    if (!viewOrderId) loadOrders();
  }, [viewOrderId, activeTab, currentPage]);

  const loadOrders = async () => {
    setLoading(true);
    try {
      const statusParam = ['Pending', 'Delivered', 'Cancelled'].includes(activeTab) ? activeTab : '';
      const orderTypeParam = ['ONLINE', 'OFFLINE'].includes(activeTab) ? activeTab : '';
      
      const res = await fetchApi(`/orders?page=${currentPage}&limit=20&status=${statusParam}&orderType=${orderTypeParam}`);
      const data = res.data ? res.data : res;
      setOrders(data);
      if (res.totalPages) setTotalPages(res.totalPages);
      if (res.total) setTotalRecords(res.total);
    } catch (e) { console.error(e); }
    setLoading(false);
  };

  if (viewOrderId) {
    return <OrderDetails orderId={viewOrderId} onBack={() => setViewOrderId(null)} />;
  }

  return (
    <Card>
      <Card.Header>
        <h4>All Orders History</h4>
      </Card.Header>
      <Card.Body>
        <Tabs activeKey={activeTab} onSelect={(k) => { setActiveTab(k); setCurrentPage(1); }} className="mb-4">
          <Tab eventKey="ALL" title="All Orders" />
          <Tab eventKey="ONLINE" title="Online Orders" />
          <Tab eventKey="OFFLINE" title="POS (Offline)" />
          <Tab eventKey="Pending" title="Pending" />
          <Tab eventKey="Delivered" title="Delivered" />
          <Tab eventKey="Cancelled" title="Cancelled" />
        </Tabs>

        <Table striped responsive hover>
          <thead>
            <tr>
              <th>Order #</th>
              <th>Date</th>
              <th>Customer</th>
              <th>Type</th>
              <th>Amount</th>
              <th>Status</th>
              <th>Action</th>
            </tr>
          </thead>
          <tbody>
            {loading ? <tr><td colSpan="7" className="text-center">Loading orders...</td></tr> : 
              orders.map(o => (
                <tr key={o._id}>
                  <td><strong>{o.orderNumber}</strong><br/><small className="text-muted">{o.billNumber}</small></td>
                  <td>{new Date(o.createdAt).toLocaleString()}</td>
                  <td>{o.customer ? o.customer.name : 'Walk-In'}</td>
                  <td><Badge bg={o.orderType === 'ONLINE' ? 'info' : 'secondary'}>{o.orderType}</Badge></td>
                  <td>${o.amount.toFixed(2)}</td>
                  <td>
                    <Badge bg={o.status === 'Delivered' ? 'success' : (o.status === 'Cancelled' ? 'danger' : 'primary')}>
                      {o.status}
                    </Badge>
                  </td>
                  <td>
                    <Button variant="outline-primary" size="sm" onClick={() => setViewOrderId(o._id)}>View Details</Button>
                  </td>
                </tr>
              ))
            }
            {!loading && orders.length === 0 && <tr><td colSpan="7" className="text-center">No orders found.</td></tr>}
          </tbody>
        </Table>

        {totalPages > 1 && (
          <div className="d-flex justify-content-between align-items-center mt-3">
            <span className="text-muted">Showing page {currentPage} of {totalPages} ({totalRecords} entries)</span>
            <div className="d-flex gap-2">
              <Button variant="outline-secondary" size="sm" disabled={currentPage === 1} onClick={() => setCurrentPage(p => p - 1)}>Prev</Button>
              <Button variant="outline-secondary" size="sm" disabled={currentPage === totalPages} onClick={() => setCurrentPage(p => p + 1)}>Next</Button>
            </div>
          </div>
        )}
      </Card.Body>
    </Card>
  );
}
