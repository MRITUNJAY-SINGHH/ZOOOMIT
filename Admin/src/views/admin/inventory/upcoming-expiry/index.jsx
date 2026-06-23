import React, { useState, useEffect } from 'react';
import { Card, Table, Badge, Button } from 'react-bootstrap';
import { Icon } from '@/components/common/LucideIcon';
import api from '@/utils/api';
import { toast } from 'react-hot-toast';
import PageHeader from '@/components/common/PageHeader';
import SkeletonTable from '@/components/common/SkeletonTable';
import EmptyState from '@/components/common/EmptyState';

const TABS = [
  { key: '30', label: '30 Days' },
  { key: '15', label: '15 Days' },
  { key: '10', label: '10 Days' },
  { key: '5', label: '5 Days', danger: true },
  { key: '0', label: 'Expired', danger: true },
];

export default function UpcomingExpiry() {
  const [batches, setBatches] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeKey, setActiveKey] = useState('30');

  useEffect(() => { loadExpiring(activeKey); }, [activeKey]);

  const loadExpiring = async (days) => {
    setLoading(true);
    try { const res = await api.get(`/inventory/expiring?days=${days}`); setBatches(res.data || []); }
    catch (e) { toast.error('Failed to load expiry data'); }
    setLoading(false);
  };

  return (
    <div>
      <PageHeader title="Upcoming Expiry" description="Track batches nearing their expiration dates and manage accordingly." breadcrumbs={[{ label: 'Dashboard', path: '/dashboard' }, { label: 'Inventory' }, { label: 'Upcoming Expiry' }]} />
      <Card>
        <Card.Body>
          <div className="d-flex flex-wrap gap-1 mb-3">
            {TABS.map(tab => (
              <Button key={tab.key} variant={activeKey === tab.key ? (tab.danger ? 'danger' : 'primary') : 'outline-secondary'} size="sm" onClick={() => setActiveKey(tab.key)}>
                {tab.label}
              </Button>
            ))}
            <Button variant="outline-secondary" size="sm" className="ms-auto" onClick={() => loadExpiring(activeKey)}><Icon icon="lucide:refresh-cw" width={14} /></Button>
          </div>
          {loading ? <SkeletonTable rows={5} columns={5} /> : batches.length === 0 ? (
            <EmptyState icon="lucide:calendar-check" title="No Batches Found" message={`No batches ${activeKey === '0' ? 'have expired' : `expiring within ${activeKey} days`}.`} />
          ) : (
            <Table responsive hover className="align-middle mb-0">
              <thead className="table-light"><tr><th>Product</th><th>Batch #</th><th className="text-end">Stock</th><th>Expiry Date</th><th>Supplier</th></tr></thead>
              <tbody>
                {batches.map(b => (
                  <tr key={b._id}>
                    <td><span className="fw-medium">{b.product?.name}</span>{b.product?.barcode && <small className="d-block text-muted">{b.product.barcode}</small>}</td>
                    <td className="text-muted">{b.batchNumber}</td>
                    <td className="text-end">{b.stock}</td>
                    <td><span className={activeKey === '0' ? 'text-danger fw-bold' : 'text-warning fw-bold'}>{new Date(b.expiryDate).toLocaleDateString()}</span></td>
                    <td className="text-muted">{b.supplier?.name || '-'}</td>
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
