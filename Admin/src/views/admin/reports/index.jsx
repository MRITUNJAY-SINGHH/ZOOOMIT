import React, { useState, useEffect } from 'react';
import { Card, Table, Tabs, Tab, Spinner, Badge } from 'react-bootstrap';
import api from '@/utils/api';
import { toast } from 'react-hot-toast';

export default function Reports() {
  const [activeTab, setActiveTab] = useState('sales');
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchReportData(activeTab);
  }, [activeTab]);

  const fetchReportData = async (tab) => {
    try {
      setLoading(true);
      const res = await api.get(`/reports/${tab}`);
      // reportController arrays are returned inside { data: [], ... } for getPaymentsReport but not others
      // Wait, let's check: getSalesReport, getInventoryReport don't have pagination yet.
      // But getPaymentsReport HAS pagination. So we need to handle that gracefully.
      const responseData = res.data.data ? res.data.data : res.data;
      setData(responseData);
    } catch (error) {
      toast.error('Failed to load report data');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <h4 className="mb-4">Reports Center</h4>
      
      <Card>
        <Card.Body>
          <Tabs
            id="reports-tabs"
            activeKey={activeTab}
            onSelect={(k) => setActiveTab(k)}
            className="mb-4"
          >
            <Tab eventKey="sales" title="Sales Report">
              {loading ? <Spinner animation="border" /> : (
                <Table responsive hover>
                  <thead>
                    <tr><th>Order #</th><th>Date</th><th>Type</th><th>Status</th><th>Amount</th></tr>
                  </thead>
                  <tbody>
                    {data.map((item) => (
                      <tr key={item._id}>
                        <td className="fw-medium text-primary">{item.orderNumber}</td>
                        <td>{new Date(item.createdAt).toLocaleDateString()}</td>
                        <td><Badge bg="info">{item.orderType}</Badge></td>
                        <td><Badge bg="success">{item.paymentStatus}</Badge></td>
                        <td className="fw-bold">₹{item.amount?.toLocaleString()}</td>
                      </tr>
                    ))}
                  </tbody>
                </Table>
              )}
            </Tab>
            
            <Tab eventKey="inventory" title="Inventory Report">
              {loading ? <Spinner animation="border" /> : (
                <Table responsive hover>
                  <thead>
                    <tr><th>Product Name</th><th>SKU</th><th>Category</th><th>Current Stock</th><th>Status</th></tr>
                  </thead>
                  <tbody>
                    {data.map((item) => (
                      <tr key={item._id}>
                        <td className="fw-medium">{item.name}</td>
                        <td>{item.sku}</td>
                        <td>{item.category?.name || '-'}</td>
                        <td className={item.totalStock < 10 ? 'text-danger fw-bold' : 'fw-bold'}>{item.totalStock}</td>
                        <td><Badge bg={item.status === 'Active' ? 'success' : 'danger'}>{item.status}</Badge></td>
                      </tr>
                    ))}
                  </tbody>
                </Table>
              )}
            </Tab>

            <Tab eventKey="payments" title="Payment Report">
              {loading ? <Spinner animation="border" /> : (
                <Table responsive hover>
                  <thead>
                    <tr><th>TXN ID</th><th>Order #</th><th>Method</th><th>Status</th><th>Amount</th></tr>
                  </thead>
                  <tbody>
                    {data.map((item) => (
                      <tr key={item._id}>
                        <td className="fw-medium">{item.transactionId}</td>
                        <td>{item.order?.orderNumber || '-'}</td>
                        <td>{item.paymentMethod}</td>
                        <td><Badge bg={item.paymentStatus === 'Paid' ? 'success' : 'warning'}>{item.paymentStatus}</Badge></td>
                        <td className="fw-bold">₹{item.amount?.toLocaleString()}</td>
                      </tr>
                    ))}
                  </tbody>
                </Table>
              )}
            </Tab>
          </Tabs>
        </Card.Body>
      </Card>
    </div>
  );
}
