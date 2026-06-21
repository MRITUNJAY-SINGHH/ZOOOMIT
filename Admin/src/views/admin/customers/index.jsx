import React, { useState, useEffect } from 'react';
import { Card, Table, Button, Form, InputGroup, Spinner, Modal, Badge } from 'react-bootstrap';
import { Icon } from '@iconify/react';
import api from '@/utils/api';
import { toast } from 'react-hot-toast';

export default function Customers() {
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  
  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalRecords, setTotalRecords] = useState(0);
  const itemsPerPage = 20;

  // Details Modal
  const [showDetails, setShowDetails] = useState(false);
  const [selectedCustomer, setSelectedCustomer] = useState(null);
  const [detailsLoading, setDetailsLoading] = useState(false);

  useEffect(() => {
    fetchCustomers();
  }, [currentPage, search]);

  const fetchCustomers = async () => {
    try {
      setLoading(true);
      const res = await api.get(`/customers?page=${currentPage}&limit=${itemsPerPage}&search=${search}`);
      setCustomers(res.data.data);
      setTotalPages(res.data.totalPages);
      setTotalRecords(res.data.total);
    } catch (error) {
      toast.error('Failed to load customers');
    } finally {
      setLoading(false);
    }
  };

  const handleViewDetails = async (id) => {
    try {
      setDetailsLoading(true);
      setShowDetails(true);
      const res = await api.get(`/customers/${id}`);
      setSelectedCustomer(res.data);
    } catch (error) {
      toast.error('Failed to load customer details');
      setShowDetails(false);
    } finally {
      setDetailsLoading(false);
    }
  };

  return (
    <div>
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h4 className="mb-0">Customers</h4>
      </div>

      <Card>
        <Card.Body>
          <div className="d-flex justify-content-between mb-3">
            <InputGroup style={{ maxWidth: '300px' }}>
              <InputGroup.Text><Icon icon="lucide:search" /></InputGroup.Text>
              <Form.Control 
                placeholder="Search name, phone, email..." 
                value={search} 
                onChange={(e) => { setSearch(e.target.value); setCurrentPage(1); }} 
              />
            </InputGroup>
          </div>

          {loading ? (
            <div className="text-center p-5"><Spinner animation="border" /></div>
          ) : (
            <>
              <Table responsive hover className="align-middle">
                <thead>
                  <tr>
                    <th>Name</th>
                    <th>Phone</th>
                    <th>Email</th>
                    <th>Joined</th>
                    <th className="text-end">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {customers.length === 0 ? (
                    <tr><td colSpan="5" className="text-center py-4">No customers found</td></tr>
                  ) : customers.map((customer) => (
                    <tr key={customer._id}>
                      <td className="fw-medium">{customer.name}</td>
                      <td>{customer.phone}</td>
                      <td>{customer.email || '-'}</td>
                      <td>{new Date(customer.createdAt).toLocaleDateString()}</td>
                      <td className="text-end">
                        <Button variant="light" size="sm" onClick={() => handleViewDetails(customer._id)}>
                          <Icon icon="lucide:eye" className="me-1" /> View Details
                        </Button>
                      </td>
                    </tr>
                  ))}
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
            </>
          )}
        </Card.Body>
      </Card>

      {/* Customer Details Modal */}
      <Modal show={showDetails} onHide={() => setShowDetails(false)} size="lg" centered>
        <Modal.Header closeButton>
          <Modal.Title>Customer Profile</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {detailsLoading ? (
            <div className="text-center py-5"><Spinner animation="border" /></div>
          ) : selectedCustomer ? (
            <div>
              <div className="d-flex justify-content-between align-items-start mb-4">
                <div>
                  <h4 className="mb-1">{selectedCustomer.name}</h4>
                  <div className="text-muted">
                    <Icon icon="lucide:phone" className="me-1" /> {selectedCustomer.phone}
                    {selectedCustomer.email && <span className="ms-3"><Icon icon="lucide:mail" className="me-1" /> {selectedCustomer.email}</span>}
                  </div>
                </div>
                <Badge bg="primary" className="p-2">
                  Member since {new Date(selectedCustomer.createdAt).getFullYear()}
                </Badge>
              </div>

              {/* Statistics Cards */}
              <div className="row g-3 mb-4">
                <div className="col-md-4">
                  <Card className="bg-light border-0">
                    <Card.Body className="text-center">
                      <div className="text-muted mb-1">Total Orders</div>
                      <h3 className="mb-0">{selectedCustomer.stats?.totalOrders || 0}</h3>
                    </Card.Body>
                  </Card>
                </div>
                <div className="col-md-4">
                  <Card className="bg-light border-0">
                    <Card.Body className="text-center">
                      <div className="text-muted mb-1">Total Spent</div>
                      <h3 className="mb-0">₹{selectedCustomer.stats?.totalSpent?.toLocaleString() || 0}</h3>
                    </Card.Body>
                  </Card>
                </div>
                <div className="col-md-4">
                  <Card className="bg-light border-0">
                    <Card.Body className="text-center">
                      <div className="text-muted mb-1">Last Order</div>
                      <h5 className="mb-0 mt-2">
                        {selectedCustomer.stats?.lastOrderDate 
                          ? new Date(selectedCustomer.stats.lastOrderDate).toLocaleDateString() 
                          : '-'}
                      </h5>
                    </Card.Body>
                  </Card>
                </div>
              </div>

              <h6 className="mb-3">Order History</h6>
              <Table size="sm" responsive hover bordered>
                <thead className="table-light">
                  <tr>
                    <th>Order #</th>
                    <th>Date</th>
                    <th>Type</th>
                    <th>Status</th>
                    <th className="text-end">Amount</th>
                  </tr>
                </thead>
                <tbody>
                  {selectedCustomer.orderHistory?.length === 0 ? (
                    <tr><td colSpan="5" className="text-center py-3">No orders found</td></tr>
                  ) : selectedCustomer.orderHistory?.map((order) => (
                    <tr key={order._id}>
                      <td><span className="fw-medium text-primary">{order.orderNumber}</span></td>
                      <td>{new Date(order.createdAt).toLocaleDateString()}</td>
                      <td><Badge bg={order.orderType === 'ONLINE' ? 'info' : 'secondary'}>{order.orderType}</Badge></td>
                      <td>{order.status}</td>
                      <td className="text-end fw-bold">₹{order.amount.toLocaleString()}</td>
                    </tr>
                  ))}
                </tbody>
              </Table>
            </div>
          ) : (
            <div className="text-center py-5 text-danger">Error loading customer data</div>
          )}
        </Modal.Body>
      </Modal>
    </div>
  );
}
