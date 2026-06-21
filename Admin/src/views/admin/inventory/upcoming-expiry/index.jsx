import React, { useState, useEffect } from 'react';
import { Card, Table, Tabs, Tab, Badge } from 'react-bootstrap';
import { fetchApi } from '@/utils/api';

export default function UpcomingExpiry() {
  const [batches, setBatches] = useState([]);
  const [loading, setLoading] = useState(true);
  const [key, setKey] = useState('30'); // 30, 15, 10, 5, 0 (expired)

  useEffect(() => {
    loadExpiring(key);
  }, [key]);

  const loadExpiring = async (days) => {
    setLoading(true);
    try {
      const data = await fetchApi(`/inventory/expiring?days=${days}`);
      setBatches(data);
    } catch (e) { console.error(e); }
    setLoading(false);
  };

  const renderTable = () => (
    <Table striped responsive hover className="mt-3">
      <thead>
        <tr>
          <th>Product</th>
          <th>Batch #</th>
          <th>Stock</th>
          <th>Expiry Date</th>
          <th>Supplier</th>
        </tr>
      </thead>
      <tbody>
        {loading ? <tr><td colSpan="5" className="text-center">Loading...</td></tr> : 
          batches.map(b => (
            <tr key={b._id}>
              <td><strong>{b.product?.name}</strong> <small className="text-muted d-block">{b.product?.barcode}</small></td>
              <td>{b.batchNumber}</td>
              <td>{b.stock}</td>
              <td>
                <span className={key === '0' ? 'text-danger fw-bold' : 'text-warning fw-bold'}>
                  {new Date(b.expiryDate).toLocaleDateString()}
                </span>
              </td>
              <td>{b.supplier?.name || 'N/A'}</td>
            </tr>
          ))
        }
        {!loading && batches.length === 0 && <tr><td colSpan="5" className="text-center">No batches found for this timeframe.</td></tr>}
      </tbody>
    </Table>
  );

  return (
    <Card>
      <Card.Header>
        <h4>Upcoming Expiry Alerts</h4>
        <p className="text-muted mb-0">Track batches nearing their expiration dates.</p>
      </Card.Header>
      <Card.Body>
        <Tabs activeKey={key} onSelect={(k) => setKey(k)} className="mb-3">
          <Tab eventKey="30" title="Next 30 Days">{renderTable()}</Tab>
          <Tab eventKey="15" title="Next 15 Days">{renderTable()}</Tab>
          <Tab eventKey="10" title="Next 10 Days">{renderTable()}</Tab>
          <Tab eventKey="5" title={<span className="text-danger">Next 5 Days</span>}>{renderTable()}</Tab>
          <Tab eventKey="0" title={<Badge bg="danger">Expired</Badge>}>{renderTable()}</Tab>
        </Tabs>
      </Card.Body>
    </Card>
  );
}
