import React, { useState, useEffect } from 'react';
import { Card, Table, Button, Form, InputGroup } from 'react-bootstrap';
import { Link } from 'react-router';
import { Search, CalendarDays, RefreshCw } from 'lucide-react';
import api from '@/utils/api';
import { toast } from 'react-hot-toast';
import PageHeader from '@/components/common/PageHeader';
import SkeletonTable from '@/components/common/SkeletonTable';
import EmptyState from '@/components/common/EmptyState';
import InventoryStatCards from '@/components/inventory/InventoryStatCards';

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
  const [search, setSearch] = useState('');

  useEffect(() => { loadExpiring(activeKey); }, [activeKey]);

  const loadExpiring = async (days) => {
    setLoading(true);
    try { 
      const res = await api.get(`/inventory/expiring?days=${days}`); 
      setBatches(res.data?.data || res.data || []); 
    } catch (e) { 
      toast.error('Failed to load expiry data'); 
    } finally {
      setLoading(false);
    }
  };

  const filteredBatches = batches.filter(b => 
    (b.product?.name || '').toLowerCase().includes(search.toLowerCase()) || 
    (b.batchNumber || '').toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="report-page">
      <div className="report-header mb-4">
        <div className="report-header-left">
          <h3 className="report-title mb-1">Upcoming Expiry</h3>
          <p className="text-muted font-size-14 mb-0">Track batches nearing their expiration dates and manage accordingly.</p>
        </div>
      </div>

      <InventoryStatCards />

      <Card className="report-section-card mb-4 h-100">
        <Card.Header className="d-flex justify-content-between align-items-center pb-0 border-0 pt-3">
          <h5 className="mb-0">Expiring Batches</h5>
          <div className="d-flex gap-2 align-items-center">
            <Form.Select 
              style={{ minWidth: '150px' }} 
              value={activeKey} 
              onChange={(e) => setActiveKey(e.target.value)}
            >
              {TABS.map(tab => (
                <option key={tab.key} value={tab.key}>{tab.label}</option>
              ))}
            </Form.Select>
            <div className="report-search-wrap" style={{ width: '250px', position: 'relative' }}>
              <Search size={18} className="search-icon" style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--bs-secondary-color)' }} />
              <input 
                type="text" 
                className="form-control report-search-input" 
                placeholder="Search products or batches..." 
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                style={{ paddingLeft: '38px', backgroundColor: 'rgba(255, 255, 255, 0.03)', border: '1px solid var(--bs-border-color)' }}
              />
            </div>
            <Button variant="light" className="btn-icon bg-body-secondary border-0 text-secondary" onClick={() => loadExpiring(activeKey)} title="Refresh">
              <RefreshCw size={16} />
            </Button>
          </div>
        </Card.Header>
        <div style={{ overflowX: 'auto' }} className="pt-3 pb-2">
          {loading ? (
            <div className="p-3"><SkeletonTable rows={5} columns={5} /></div>
          ) : filteredBatches.length === 0 ? (
            <div className="p-5">
              <EmptyState icon={CalendarDays} title="No Batches Found" message={`No batches ${activeKey === '0' ? 'have expired' : `expiring within ${activeKey} days`}.`} />
            </div>
          ) : (
            <Table className="report-table mb-0">
              <thead className="custom-table-thead" style={{ 
                fontSize: '12px', 
                textTransform: 'uppercase', 
                letterSpacing: '0.5px',
                backgroundColor: 'rgba(255, 255, 255, 0.03)'
              }}>
                <tr>
                  <th className="py-2 text-muted border-dashed ps-4">Product Name</th>
                  <th className="py-2 text-muted border-dashed">Batch Number</th>
                  <th className="py-2 text-end text-muted border-dashed">Stock Remaining</th>
                  <th className="py-2 text-muted border-dashed">Expiry Date</th>
                  <th className="py-2 text-muted border-dashed pe-4">Supplier</th>
                </tr>
              </thead>
              <tbody>
                {filteredBatches.map(b => (
                  <tr key={b._id}>
                    <td className="align-middle border-dashed ps-4">
                      <h6 className="mb-0 fw-medium text-body font-size-15">{b.product?.name || 'Unknown Product'}</h6>
                      {b.product?.barcode && <small className="text-muted font-size-13">Code: {b.product.barcode}</small>}
                    </td>
                    <td className="align-middle border-dashed">
                      <code className="text-secondary bg-secondary-subtle px-2 py-1 rounded font-size-13">{b.batchNumber || '-'}</code>
                    </td>
                    <td className="align-middle border-dashed text-end">
                      <span className="fw-semibold font-size-15">{b.stock} units</span>
                    </td>
                    <td className="align-middle border-dashed">
                      <span className={`px-2 py-1 rounded font-size-13 fw-semibold ${activeKey === '0' ? 'bg-danger-subtle text-danger' : 'bg-warning-subtle text-warning'}`}>
                        {b.expiryDate ? new Date(b.expiryDate).toLocaleDateString() : 'N/A'}
                      </span>
                    </td>
                    <td className="align-middle border-dashed pe-4 text-muted font-size-14">
                      {b.supplier?.name || '-'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </Table>
          )}
        </div>
      </Card>
    </div>
  );
}
