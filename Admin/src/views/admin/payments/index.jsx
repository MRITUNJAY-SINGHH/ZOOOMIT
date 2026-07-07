import React, { useEffect, useState } from 'react';
import { Button, Card, Modal, Table } from 'react-bootstrap';
import { Eye } from 'lucide-react';
import { useNavigate } from 'react-router';
import api from '@/utils/api';
import PageHeader from '@/components/common/PageHeader';
import ActionBar from '@/components/common/ActionBar';
import SearchBar from '@/components/common/SearchBar';
import StatusBadge from '@/components/common/StatusBadge';
import SkeletonTable from '@/components/common/SkeletonTable';
import EmptyState from '@/components/common/EmptyState';
import ErrorState from '@/components/common/ErrorState';
import PaginationComponent from '@/components/common/PaginationComponent';
import { formatCurrency, formatDate } from '@/utils/format';
import { toast } from 'react-hot-toast';

export default function Payments() {
  const navigate = useNavigate();
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [search, setSearch] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalRecords, setTotalRecords] = useState(0);
  const [selectedTxn, setSelectedTxn] = useState(null);

  const fetchTransactions = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await api.get(`/payments?page=${currentPage}&limit=20&search=${search}`);
      setTransactions(res.data.data || []);
      setTotalPages(res.data.totalPages || 1);
      setTotalRecords(res.data.total || 0);
    } catch (err) {
      setError(err.message);
      toast.error('Failed to load payments');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchTransactions(); }, [currentPage, search]);

  return (
    <div className="report-page pt-1">
      <div className="report-header">
        <div className="report-header-left">
          <h3 className="report-title">Payments</h3>
        </div>
      </div>
      <ActionBar
        left={<SearchBar placeholder="Search transaction ID..." value={search} onChange={(value) => { setSearch(value); setCurrentPage(1); }} />}
        count={totalRecords}
        onRefresh={fetchTransactions}
      />
      <Card>
        <Card.Body>
          {loading ? <SkeletonTable rows={8} columns={8} /> : error ? <ErrorState message={error} onRetry={fetchTransactions} /> : transactions.length === 0 ? (
            <EmptyState icon="lucide:credit-card" title="No transactions found" message="Payment records will appear after orders are paid." />
          ) : (
            <>
              <Table responsive hover className="align-middle mb-0">
                <thead><tr><th>Transaction</th><th>Order</th><th>Type</th><th>Method</th><th className="text-end">Amount</th><th>Status</th><th>Refund</th><th className="text-end">Actions</th></tr></thead>
                <tbody>
                  {transactions.map((txn) => (
                    <tr key={txn._id}>
                      <td className="fw-semibold text-primary">{txn.transactionId}</td>
                      <td style={{ cursor: 'pointer', color: 'var(--bs-primary)' }} onClick={() => navigate('/orders/all', { state: { viewOrderId: typeof txn.order === 'string' ? txn.order : txn.order?._id } })}>{txn.order?.orderNumber || '-'}</td>
                      <td><StatusBadge status={txn.orderType} /></td>
                      <td>{txn.paymentMethod}</td>
                      <td className="text-end fw-semibold">{formatCurrency(txn.amount)}</td>
                      <td><StatusBadge status={txn.paymentStatus} /></td>
                      <td>{txn.refundStatus && txn.refundStatus !== 'None' ? <StatusBadge status={`${txn.refundStatus} ${formatCurrency(txn.refundAmount)}`} variant={txn.refundStatus === 'Processed' ? 'info' : 'danger'} /> : '-'}</td>
                      <td className="text-end"><Button variant="light" className="kuiklo-icon-btn" onClick={() => setSelectedTxn(txn)}><Eye size={20} /></Button></td>
                    </tr>
                  ))}
                </tbody>
              </Table>
              <PaginationComponent currentPage={currentPage} totalPages={totalPages} totalRecords={totalRecords} onPageChange={setCurrentPage} />
            </>
          )}
        </Card.Body>
      </Card>

      <Modal show={Boolean(selectedTxn)} onHide={() => setSelectedTxn(null)} centered size="lg">
        <Modal.Header closeButton><Modal.Title>Transaction Details</Modal.Title></Modal.Header>
        <Modal.Body>
          {selectedTxn && (
            <Table responsive className="align-middle mb-0">
              <tbody>
                <tr><th>Transaction ID</th><td>{selectedTxn.transactionId}</td></tr>
                <tr><th>Order</th><td>{selectedTxn.order?.orderNumber || selectedTxn.order || '-'}</td></tr>
                <tr><th>Order Type</th><td>{selectedTxn.orderType}</td></tr>
                <tr><th>Amount</th><td className="fw-semibold">{formatCurrency(selectedTxn.amount)}</td></tr>
                <tr><th>Method</th><td>{selectedTxn.paymentMethod}</td></tr>
                <tr><th>Status</th><td><StatusBadge status={selectedTxn.paymentStatus} /></td></tr>
                <tr><th>Date</th><td>{formatDate(selectedTxn.createdAt)}</td></tr>
                <tr><th>Reference</th><td>{selectedTxn.referenceNumber || '-'}</td></tr>
                <tr><th>Razorpay Order ID</th><td>{selectedTxn.razorpayOrderId || '-'}</td></tr>
                <tr><th>Razorpay Payment ID</th><td>{selectedTxn.razorpayPaymentId || '-'}</td></tr>
                <tr><th>Razorpay Refund ID</th><td>{selectedTxn.razorpayRefundId || '-'}</td></tr>
                <tr><th>Refund</th><td>{selectedTxn.refundStatus || 'None'} · {formatCurrency(selectedTxn.refundAmount || 0)}</td></tr>
              </tbody>
            </Table>
          )}
        </Modal.Body>
      </Modal>
    </div>
  );
}
