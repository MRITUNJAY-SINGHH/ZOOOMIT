import React, { useState, useEffect } from 'react';
import { Card, Table, Badge, Button, InputGroup, Form } from 'react-bootstrap';
import { Link } from 'react-router';
import { Search, Plus, PackageOpen, Image, RefreshCw } from 'lucide-react';
import api from '@/utils/api';
import { toast } from 'react-hot-toast';
import PageHeader from '@/components/common/PageHeader';
import SkeletonTable from '@/components/common/SkeletonTable';
import EmptyState from '@/components/common/EmptyState';
import InventoryStatCards from '@/components/inventory/InventoryStatCards';

export default function LowStock() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  useEffect(() => { loadLowStock(); }, []);

  const loadLowStock = async () => {
    setLoading(true);
    try { 
      const res = await api.get('/inventory/low-stock'); 
      setProducts(res.data?.data || res.data || []); 
    } catch (e) { 
      toast.error('Failed to load low stock data'); 
    } finally {
      setLoading(false);
    }
  };

  const filteredProducts = products.filter(p => 
    (p.name || '').toLowerCase().includes(search.toLowerCase()) || 
    (p.barcode || '').includes(search)
  );

  return (
    <div>
      <PageHeader 
        title="Low Stock" 
        description="Products whose stock has fallen below their individual thresholds." 
      />

      <InventoryStatCards />

      {/* Premium Toolbar */}
      <Card className="mb-3 border-0 shadow-sm">
        <Card.Body className="p-3">
          <div className="d-flex flex-column flex-md-row justify-content-between align-items-md-center gap-3">
            <div className="d-flex align-items-center gap-2 flex-wrap flex-md-nowrap">
              <span className="text-muted fw-medium font-size-14 text-uppercase tracking-wider me-2">Alerts</span>
              <InputGroup style={{ maxWidth: '280px' }}>
                <InputGroup.Text className="bg-body-secondary border-0 text-muted"><Search size={16} /></InputGroup.Text>
                <Form.Control 
                  placeholder="Search low stock..." 
                  className="bg-body-secondary border-0 shadow-none" 
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                />
              </InputGroup>
            </div>
            
            <div className="d-flex align-items-center gap-2">
              <Button variant="light" className="btn-icon bg-body-secondary border-0 text-secondary" onClick={loadLowStock} title="Refresh">
                <RefreshCw size={16} />
              </Button>
            </div>
          </div>
        </Card.Body>
      </Card>

      <Card className="border-0 shadow-sm overflow-hidden">
        <Card.Body className="p-0">
          {loading ? <SkeletonTable rows={5} columns={6} /> : filteredProducts.length === 0 ? (
            <div className="p-5">
              <EmptyState icon={PackageOpen} title="No Low Stock Alerts" message="All products are above their stock thresholds." />
            </div>
          ) : (
            <Table responsive hover className="align-middle mb-0 text-nowrap table-borderless table-centered">
              <thead className="bg-body-tertiary border-bottom border-light">
                <tr className="text-body text-uppercase font-size-13 fw-semibold tracking-wider">
                  <th style={{width:50}} className="ps-4 py-3">Image</th>
                  <th className="py-3">Product Name</th>
                  <th className="py-3">Category</th>
                  <th className="text-end py-3">Current Stock</th>
                  <th className="text-end py-3">Threshold</th>
                  <th className="text-end pe-4 py-3">Action</th>
                </tr>
              </thead>
              <tbody>
                {filteredProducts.map(p => (
                  <tr key={p._id} className="border-bottom border-light">
                    <td className="ps-4">
                      {p.featuredImage ? (
                        <img src={p.featuredImage} alt="" width="40" height="40" className="rounded" style={{ objectFit: 'cover' }} />
                      ) : (
                        <div className="bg-light rounded d-flex align-items-center justify-content-center" style={{ width: 40, height: 40 }}>
                          <Image size={16} className="text-muted" />
                        </div>
                      )}
                    </td>
                    <td>
                      <h6 className="mb-0 fw-bold text-body font-size-15">{p.name}</h6>
                      {p.barcode && <small className="text-muted font-size-13">Code: {p.barcode}</small>}
                    </td>
                    <td className="text-muted font-size-14">{p.category?.name || '-'}</td>
                    <td className="text-end">
                      <Badge bg={p.stock === 0 ? 'danger-subtle' : 'warning-subtle'} text={p.stock === 0 ? 'danger' : 'warning'} className="px-2 py-1 font-size-13 fw-semibold">
                        {p.stock} units
                      </Badge>
                    </td>
                    <td className="text-end text-muted font-size-14">{p.lowStockThreshold} units</td>
                    <td className="text-end pe-4">
                      <Button as={Link} to={`/inventory/stock-entry`} variant="outline-primary" size="sm" className="d-inline-flex align-items-center gap-1 shadow-sm px-3 fw-medium">
                        <Plus size={14} /> Restock
                      </Button>
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
