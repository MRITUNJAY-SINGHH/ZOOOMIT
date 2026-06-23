import React, { useState, useEffect } from 'react';
import { Card, Table, Button, Form, Badge, Modal, InputGroup } from 'react-bootstrap';
import { Icon } from '@/components/common/LucideIcon';
import api from '@/utils/api';
import { toast } from 'react-hot-toast';
import PageHeader from '@/components/common/PageHeader';
import SkeletonTable from '@/components/common/SkeletonTable';
import EmptyState from '@/components/common/EmptyState';

export default function Payments() {
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalRecords, setTotalRecords] = useState(0);
  const [showModal, setShowModal] = useState(false);
  const [selectedTxn, setSelectedTxn] = useState(null);

  useEffect(() => { fetchTransactions(); }, [currentPage, search]);

  const fetchTransactions = async () => {
    try {
      setLoading(true);
      const res = await api.get(`/payments?page=${currentPage}&limit=20&search=${search}`);
      setTransactions(res.data.data || []);
      setTotalPages(res.data.totalPages || 1);
      setTotalRecords(res.data.total || 0);
    } catch (err) { toast.error('Failed to load transactions'); }
    finally { setLoading(false); }
  };

  return (
    <div>
      <PageHeader title="Payments" description="Track all payment transactions, refunds, and Razorpay details." breadcrumbs={[{ label: 'Dashboard', path: '/dashboard' }, { label: 'Payments' }]} />
      <Card>
        <Card.Body>
          <div className="d-flex justify-content-between mb-3 align-items-center">
            <InputGroup size="sm" style={{ maxWidth: '280px' }}>
              <InputGroup.Text><Icon icon="lucide:search" width={14} /></InputGroup.Text>
              <Form.Control placeholder="Search TXN ID..." value={search} onChange={(e) => { setSearch(e.target.value); setCurrentPage(1); }} />
            </InputGroup>
            <div className="d-flex gap-2 align-items-center">
              <span className="text-muted small">{totalRecords} records</span>
              <Button variant="outline-secondary" size="sm" onClick={fetchTransactions}><Icon icon="lucide:refresh-cw" width={14} /></Button>
            </div>
          </div>
          {loading ? <SkeletonTable rows={6} columns={7} /> : transactions.length === 0 ? (
            <EmptyState icon="lucide:credit-card" title="No Transactions Found" message="No transactions match the current filter." />
          ) : (
            <>
              <Table responsive hover className="align-middle mb-0">
                <thead className="table-light"><tr><th>Transaction ID</th><th>Order</th><th>Method</th><th className="text-end">Amount</th><th>Status</th><th>Refund</th><th className="text-end">Actions</th></tr></thead>
                <tbody>
                  {transactions.map(txn => (
                    <tr key={txn._id}>
                      <td className="fw-medium text-primary">{txn.transactionId}</td>
                      <td>{txn.order?.orderNumber || '-'} <Badge bg="light" text="dark">{txn.orderType}</Badge></td>
                      <td>{txn.paymentMethod}</td>
                      <td className="text-end fw-bold">₹{(txn.amount || 0).toLocaleString()}</td>
                      <td><Badge bg={txn.paymentStatus === 'Paid' ? 'success' : txn.paymentStatus === 'Pending' ? 'warning' : 'danger'}>{txn.paymentStatus}</Badge></td>
                      <td>{txn.refundStatus && txn.refundStatus !== 'None' ? <Badge bg={txn.refundStatus === 'Processed' ? 'info' : 'danger'}>{txn.refundStatus} (₹{txn.refundAmount})</Badge> : '-'}</td>
                      <td className="text-end"><Button variant="light" size="sm" onClick={() => { setSelectedTxn(txn); setShowModal(true); }}><Icon icon="lucide:eye" width={14} /></Button></td>
                    </tr>
                  ))}
                </tbody>
              </Table>
              {totalPages > 1 && (
                <div className="d-flex justify-content-between align-items-center mt-3 pt-3 border-top">
                  <span className="text-muted small">Page {currentPage} of {totalPages} ({totalRecords} entries)</span>
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
        <Modal.Header closeButton><Modal.Title>Transaction Details</Modal.Title></Modal.Header>
        <Modal.Body>
          {selectedTxn && (
            <Table bordered size="sm">
              <tbody>
                <tr><th className="bg-light" style={{ width: '40%' }}>Transaction ID</th><td>{selectedTxn.transactionId}</td></tr>
                <tr><th className="bg-light">Order</th><td>{selectedTxn.order?.orderNumber || selectedTxn.order}</td></tr>
                <tr><th className="bg-light">Type</th><td>{selectedTxn.orderType}</td></tr>
                <tr><th className="bg-light">Amount</th><td className="fw-bold">₹{(selectedTxn.amount || 0).toLocaleString()}</td></tr>
                <tr><th className="bg-light">Method</th><td>{selectedTxn.paymentMethod}</td></tr>
                <tr><th className="bg-light">Status</th><td>{selectedTxn.paymentStatus}</td></tr>
                <tr><th className="bg-light">Date</th><td>{new Date(selectedTxn.createdAt).toLocaleString()}</td></tr>
                {selectedTxn.referenceNumber && <tr><th className="bg-light">Reference</th><td>{selectedTxn.referenceNumber}</td></tr>}
                <tr><td colSpan="2" className="bg-light fw-medium text-center">Razorpay Details</td></tr>
                <tr><th className="bg-light">Order ID</th><td>{selectedTxn.razorpayOrderId || '-'}</td></tr>
                <tr><th className="bg-light">Payment ID</th><td>{selectedTxn.razorpayPaymentId || '-'}</td></tr>
                <tr><th className="bg-light">Refund ID</th><td>{selectedTxn.razorpayRefundId || '-'}</td></tr>
                <tr><th className="bg-light">Refund Amount</th><td>₹{selectedTxn.refundAmount || 0}</td></tr>
                <tr><th className="bg-light">Refund Status</th><td>{selectedTxn.refundStatus}</td></tr>
              </tbody>
            </Table>
          )}
        </Modal.Body>
      </Modal>
    </div>
  );
}
