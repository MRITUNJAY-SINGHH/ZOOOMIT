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
    <div>
      <PageHeader 
        title="Upcoming Expiry" 
        description="Track batches nearing their expiration dates and manage accordingly." 
      />

      <InventoryStatCards />

      {/* Premium Toolbar */}
      <Card className="mb-3 border-0 shadow-sm">
        <Card.Body className="p-3">
          <div className="d-flex flex-column flex-md-row justify-content-between align-items-md-center gap-3">
            <div className="d-flex align-items-center gap-2 flex-wrap flex-md-nowrap">
              <span className="text-muted fw-medium font-size-14 text-uppercase tracking-wider me-2">Timeframe</span>
              
              <Form.Select 
                style={{ minWidth: '150px' }} 
                value={activeKey} 
                onChange={(e) => setActiveKey(e.target.value)}
              >
                {TABS.map(tab => (
                  <option key={tab.key} value={tab.key}>{tab.label}</option>
                ))}
              </Form.Select>

              <InputGroup style={{ maxWidth: '280px' }} className="ms-xl-2">
                <InputGroup.Text className="bg-body-secondary border-0 text-muted"><Search size={16} /></InputGroup.Text>
                <Form.Control 
                  placeholder="Search products or batches..." 
                  className="bg-body-secondary border-0 shadow-none" 
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                />
              </InputGroup>
            </div>
            
            <div className="d-flex align-items-center gap-2">
              <Button variant="light" className="btn-icon bg-body-secondary border-0 text-secondary" onClick={() => loadExpiring(activeKey)} title="Refresh">
                <RefreshCw size={16} />
              </Button>
            </div>
          </div>
        </Card.Body>
      </Card>

      <Card className="border-0 shadow-sm overflow-hidden">
        <Card.Body className="p-0">
          {loading ? <SkeletonTable rows={5} columns={5} /> : filteredBatches.length === 0 ? (
            <div className="p-5">
              <EmptyState icon={CalendarDays} title="No Batches Found" message={`No batches ${activeKey === '0' ? 'have expired' : `expiring within ${activeKey} days`}.`} />
            </div>
          ) : (
            <Table responsive hover className="align-middle mb-0 text-nowrap table-borderless table-centered">
              <thead className="bg-body-tertiary border-bottom border-light">
                <tr className="text-body text-uppercase font-size-13 fw-semibold tracking-wider">
                  <th className="ps-4 py-3">Product Name</th>
                  <th className="py-3">Batch Number</th>
                  <th className="text-end py-3">Stock Remaining</th>
                  <th className="py-3">Expiry Date</th>
                  <th className="pe-4 py-3">Supplier</th>
                </tr>
              </thead>
              <tbody>
                {filteredBatches.map(b => (
                  <tr key={b._id} className="border-bottom border-light">
                    <td className="ps-4">
                      <h6 className="mb-0 fw-bold text-body font-size-15">{b.product?.name || 'Unknown Product'}</h6>
                      {b.product?.barcode && <small className="text-muted font-size-13">Code: {b.product.barcode}</small>}
                    </td>
                    <td>
                      <code className="text-secondary bg-secondary-subtle px-2 py-1 rounded font-size-13">{b.batchNumber || '-'}</code>
                    </td>
                    <td className="text-end">
                      <span className="fw-semibold font-size-15">{b.stock} units</span>
                    </td>
                    <td>
                      <span className={`px-2 py-1 rounded font-size-13 fw-semibold ${activeKey === '0' ? 'bg-danger-subtle text-danger' : 'bg-warning-subtle text-warning'}`}>
                        {b.expiryDate ? new Date(b.expiryDate).toLocaleDateString() : 'N/A'}
                      </span>
                    </td>
                    <td className="pe-4 text-muted font-size-14">
                      {b.supplier?.name || '-'}
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
