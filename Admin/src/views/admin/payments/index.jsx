import React, { useState, useEffect } from 'react';
import { Card, Table, Button, Badge, Modal, InputGroup, Form, Spinner } from 'react-bootstrap';
import { Icon } from '@iconify/react';
import api from '@/utils/api';
import { toast } from 'react-hot-toast';

export default function Payments() {
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalRecords, setTotalRecords] = useState(0);

  const [showModal, setShowModal] = useState(false);
  const [selectedTxn, setSelectedTxn] = useState(null);

  useEffect(() => {
    fetchTransactions();
  }, [currentPage, search]);

  const fetchTransactions = async () => {
    try {
      setLoading(true);
      const res = await api.get(`/payments?page=${currentPage}&limit=20&search=${search}`);
      setTransactions(res.data.data);
      setTotalPages(res.data.totalPages);
      setTotalRecords(res.data.total);
    } catch (error) {
      toast.error('Failed to load transactions');
    } finally {
      setLoading(false);
    }
  };

  const handleViewDetails = (txn) => {
    setSelectedTxn(txn);
    setShowModal(true);
  };

  return (
    <div>
      <h4 className="mb-4">Payments & Transactions</h4>

      <Card>
        <Card.Body>
          <div className="mb-3">
            <InputGroup style={{ maxWidth: '300px' }}>
              <InputGroup.Text><Icon icon="lucide:search" /></InputGroup.Text>
              <Form.Control placeholder="Search TXN ID..." value={search} onChange={(e) => { setSearch(e.target.value); setCurrentPage(1); }} />
            </InputGroup>
          </div>

          {loading ? (
            <div className="text-center p-5"><Spinner animation="border" /></div>
          ) : (
            <>
              <Table responsive hover className="align-middle">
                <thead>
                  <tr>
                    <th>Transaction ID</th>
                    <th>Order</th>
                    <th>Method</th>
                    <th>Amount</th>
                    <th>Status</th>
                    <th>Refund</th>
                    <th className="text-end">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {transactions.map((txn) => (
                    <tr key={txn._id}>
                      <td className="fw-medium text-primary">{txn.transactionId}</td>
                      <td>{txn.order?.orderNumber || '-'} <Badge bg="light" text="dark">{txn.orderType}</Badge></td>
                      <td>{txn.paymentMethod}</td>
                      <td className="fw-bold">₹{txn.amount.toLocaleString()}</td>
                      <td>
                        <Badge bg={
                          txn.paymentStatus === 'Paid' ? 'success' : 
                          txn.paymentStatus === 'Pending' ? 'warning' : 'danger'
                        }>{txn.paymentStatus}</Badge>
                      </td>
                      <td>
                        {txn.refundStatus !== 'None' ? (
                          <Badge bg={txn.refundStatus === 'Processed' ? 'info' : 'danger'}>
                            {txn.refundStatus} (₹{txn.refundAmount})
                          </Badge>
                        ) : '-'}
                      </td>
                      <td className="text-end">
                        <Button variant="light" size="sm" onClick={() => handleViewDetails(txn)}>
                          <Icon icon="lucide:eye" />
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

      <Modal show={showModal} onHide={() => setShowModal(false)} centered>
        <Modal.Header closeButton>
          <Modal.Title>Transaction Details</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {selectedTxn && (
            <div>
              <Table bordered size="sm">
                <tbody>
                  <tr><th>Transaction ID</th><td>{selectedTxn.transactionId}</td></tr>
                  <tr><th>Order ID</th><td>{selectedTxn.order?.orderNumber || selectedTxn.order}</td></tr>
                  <tr><th>Type</th><td>{selectedTxn.orderType}</td></tr>
                  <tr><th>Amount</th><td>₹{selectedTxn.amount.toLocaleString()}</td></tr>
                  <tr><th>Method</th><td>{selectedTxn.paymentMethod}</td></tr>
                  <tr><th>Payment Status</th><td>{selectedTxn.paymentStatus}</td></tr>
                  <tr><th>Date</th><td>{new Date(selectedTxn.createdAt).toLocaleString()}</td></tr>
                  
                  {selectedTxn.referenceNumber && (
                    <tr><th>Reference</th><td>{selectedTxn.referenceNumber}</td></tr>
                  )}
                  
                  <tr className="table-light"><th colSpan="2">Razorpay Details</th></tr>
                  <tr><th>RPAY Order ID</th><td>{selectedTxn.razorpayOrderId || '-'}</td></tr>
                  <tr><th>RPAY Payment ID</th><td>{selectedTxn.razorpayPaymentId || '-'}</td></tr>
                  <tr><th>RPAY Refund ID</th><td>{selectedTxn.razorpayRefundId || '-'}</td></tr>
                  <tr><th>Refund Amount</th><td>₹{selectedTxn.refundAmount || 0}</td></tr>
                  <tr><th>Refund Status</th><td>{selectedTxn.refundStatus}</td></tr>
                </tbody>
              </Table>
            </div>
          )}
        </Modal.Body>
      </Modal>
    </div>
  );
}
