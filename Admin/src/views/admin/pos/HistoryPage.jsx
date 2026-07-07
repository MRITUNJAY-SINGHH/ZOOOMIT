import React, { useState, useEffect } from 'react';
import { Card, Table, Button, Badge } from 'react-bootstrap';
import { useNavigate } from 'react-router';
import { fetchApi } from '@/utils/api';
import { formatCurrency } from '@/utils/format';
import PageHeader from '@/components/common/PageHeader';
import ActionBar from '@/components/common/ActionBar';
import SearchBar from '@/components/common/SearchBar';
import EmptyState from '@/components/common/EmptyState';

const STATUS_COLORS = {
  Pending: 'warning', Confirmed: 'info', Assigned: 'primary',
  OutForDelivery: 'secondary', Delivered: 'success', Cancelled: 'danger', Returned: 'danger',
};

export default function HistoryPage() {
  const [invoices, setInvoices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const navigate = useNavigate();

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

  return (
    <div>
      <PageHeader 
        title="POS Billing History" 
        rightContent={
          <Button variant="primary" onClick={() => navigate('/pos')}>
            New POS Billing
          </Button>
        }
      />

      <ActionBar
        left={
          <SearchBar 
            placeholder="Search Bill #..." 
            value={search} 
            onChange={setSearch} 
          />
        }
        onRefresh={loadInvoices}
      />

      <Card>
        <Card.Body>
          {loading ? <div className="p-4 text-center text-muted">Loading history...</div> : (
            <Table responsive hover className="align-middle mb-0">
              <thead>
                <tr>
                  <th>Bill #</th>
                  <th>Date</th>
                  <th>Amount</th>
                  <th>Status</th>
                  <th className="text-end">Actions</th>
                </tr>
              </thead>
              <tbody>
                {invoices.length === 0 && (
                  <tr>
                    <td colSpan="5" className="text-center py-5">
                      <EmptyState title="No Bills Found" message="Try adjusting your search filter." />
                    </td>
                  </tr>
                )}
                {invoices.filter(i => (i.billNumber || i.orderNumber || '').toLowerCase().includes(search.toLowerCase())).map(order => (
                  <tr key={order._id}>
                    <td className="ps-4 text-primary fw-medium">{order.billNumber || order.orderNumber}</td>
                    <td>
                      {new Date(order.createdAt).toLocaleDateString()}
                      <div className="text-muted fs-12">{new Date(order.createdAt).toLocaleTimeString()}</div>
                    </td>
                    <td className="fw-semibold">{formatCurrency(order.amount)}</td>
                    <td><Badge bg={STATUS_COLORS[order.status] || 'secondary'}>{order.status}</Badge></td>
                    <td className="text-end">
                      <div className="d-flex justify-content-end gap-2 flex-column flex-sm-row">
                        <Button size="sm" variant="primary" onClick={() => handleReprintClick(order._id)}>Reprint</Button>
                        <Button 
                          size="sm" 
                          variant="danger" 
                          onClick={() => navigate(`/pos/returns`, { state: { invoice: order } })} 
                          disabled={order.status === 'Returned'}
                        >
                          Return
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </Table>
          )}
        </Card.Body>
      </Card>
    </div>
  );
}
