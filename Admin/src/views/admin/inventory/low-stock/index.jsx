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
    <div className="report-page">
      <div className="report-header mb-4">
        <div className="report-header-left">
          <h3 className="report-title mb-1">Low Stock</h3>
          <p className="text-muted font-size-14 mb-0">Products whose stock has fallen below their individual thresholds.</p>
        </div>
      </div>

      <InventoryStatCards />

      <Card className="report-section-card mb-4 h-100">
        <Card.Header className="d-flex justify-content-between align-items-center pb-0 border-0 pt-3">
          <h5 className="mb-0">Low Stock Alerts</h5>
          <div className="d-flex gap-2 align-items-center">
            <div className="report-search-wrap" style={{ width: '250px', position: 'relative' }}>
              <Search size={18} className="search-icon" style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--bs-secondary-color)' }} />
              <input 
                type="text" 
                className="form-control report-search-input" 
                placeholder="Search products..." 
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                style={{ paddingLeft: '38px', backgroundColor: 'rgba(255, 255, 255, 0.03)', border: '1px solid var(--bs-border-color)' }}
              />
            </div>
            <Button variant="light" className="btn-icon bg-body-secondary border-0 text-secondary" onClick={loadLowStock} title="Refresh">
              <RefreshCw size={16} />
            </Button>
          </div>
        </Card.Header>
        <div style={{ overflowX: 'auto' }} className="pt-3 pb-2">
          {loading ? (
            <div className="p-3"><SkeletonTable rows={5} columns={6} /></div>
          ) : filteredProducts.length === 0 ? (
            <div className="p-5">
              <EmptyState icon={PackageOpen} title="No Low Stock Alerts" message="All products are above their stock thresholds." />
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
                  <th style={{width:50}} className="py-2 text-muted border-dashed ps-4">Image</th>
                  <th className="py-2 text-muted border-dashed">Product Name</th>
                  <th className="py-2 text-muted border-dashed">Category</th>
                  <th className="py-2 text-end text-muted border-dashed">Current Stock</th>
                  <th className="py-2 text-end text-muted border-dashed">Threshold</th>
                  <th className="py-2 text-center text-muted border-dashed pe-4">Action</th>
                </tr>
              </thead>
              <tbody>
                {filteredProducts.map(p => (
                  <tr key={p._id}>
                    <td className="align-middle border-dashed ps-4">
                      {p.featuredImage ? (
                        <img src={p.featuredImage} alt="" width="40" height="40" className="rounded" style={{ objectFit: 'cover' }} />
                      ) : (
                        <div className="bg-body-secondary rounded d-flex align-items-center justify-content-center" style={{ width: 40, height: 40 }}>
                          <Image size={16} className="text-muted" />
                        </div>
                      )}
                    </td>
                    <td className="align-middle border-dashed">
                      <h6 className="mb-0 fw-medium text-body font-size-15">{p.name}</h6>
                      {p.barcode && <small className="text-muted font-size-13">Code: {p.barcode}</small>}
                    </td>
                    <td className="align-middle border-dashed text-muted font-size-14">{p.category?.name || '-'}</td>
                    <td className="align-middle border-dashed text-end">
                      <Badge bg={p.stock === 0 ? 'danger-subtle' : 'warning-subtle'} text={p.stock === 0 ? 'danger' : 'warning'} className="px-2 py-1 font-size-13 fw-semibold border-0">
                        {p.stock} units
                      </Badge>
                    </td>
                    <td className="align-middle border-dashed text-end text-muted font-size-14">{p.lowStockThreshold} units</td>
                    <td className="align-middle border-dashed text-center pe-4">
                      <Button as={Link} to={`/inventory/stock-entry`} variant="outline-primary" size="sm" className="d-inline-flex align-items-center gap-1 shadow-sm px-2 fw-medium">
                        <Plus size={14} /> Restock
                      </Button>
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
