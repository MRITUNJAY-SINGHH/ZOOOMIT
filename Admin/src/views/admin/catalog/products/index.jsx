import React, { useState, useEffect } from 'react';
import { Card, Table, Button, Badge, OverlayTrigger, Tooltip, InputGroup, Form } from 'react-bootstrap';
import { Icon } from '@iconify/react';
import api, { fetchApi } from '@/utils/api';
import { toast } from 'react-hot-toast';
import PageHeader from '@/components/common/PageHeader';
import SkeletonTable from '@/components/common/SkeletonTable';
import EmptyState from '@/components/common/EmptyState';
import ProductForm from './ProductForm';
import BulkImport from './BulkImport';

export default function ProductsList() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [viewState, setViewState] = useState('list');
  const [editId, setEditId] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalRecords, setTotalRecords] = useState(0);

  useEffect(() => { if (viewState === 'list') loadProducts(); }, [viewState, currentPage, search]);

  const loadProducts = async () => {
    setLoading(true);
    try {
      const res = await fetchApi(`/products?page=${currentPage}&limit=20&search=${search}`);
      const payload = res.data ? res : res;
      setProducts(payload.data || []);
      setTotalPages(payload.totalPages || 1);
      setTotalRecords(payload.total || 0);
    } catch (e) { toast.error('Failed to load products'); }
    setLoading(false);
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this product?')) return;
    try { await fetchApi(`/products/${id}`, { method: 'DELETE' }); toast.success('Product deleted'); loadProducts(); }
    catch (e) { toast.error(e.message); }
  };

  if (viewState === 'form') return <ProductForm productId={editId} onBack={() => setViewState('list')} onSave={() => setViewState('list')} />;
  if (viewState === 'import') return <BulkImport onBack={() => setViewState('list')} onComplete={() => setViewState('list')} />;

  return (
    <div>
      <PageHeader title="Products" description="Manage products, inventory, pricing and barcode mapping." breadcrumbs={[{ label: 'Dashboard', path: '/dashboard' }, { label: 'Catalog' }, { label: 'Products' }]} />
      <Card>
        <Card.Body>
          <div className="d-flex flex-wrap justify-content-between mb-3 align-items-center gap-2">
            <InputGroup size="sm" style={{ maxWidth: '280px' }}>
              <InputGroup.Text><Icon icon="lucide:search" width={14} /></InputGroup.Text>
              <Form.Control placeholder="Search products..." value={search} onChange={(e) => { setSearch(e.target.value); setCurrentPage(1); }} />
            </InputGroup>
            <div className="d-flex gap-2 align-items-center">
              <span className="text-muted small">{totalRecords} records</span>
              <Button variant="outline-secondary" size="sm" onClick={loadProducts}><Icon icon="lucide:refresh-cw" width={14} /></Button>
              <Button variant="outline-info" size="sm" onClick={() => setViewState('import')}><Icon icon="lucide:upload" width={14} className="me-1" />Import CSV</Button>
              <Button variant="primary" size="sm" onClick={() => { setEditId(null); setViewState('form'); }}><Icon icon="lucide:plus" width={14} className="me-1" />Add Product</Button>
            </div>
          </div>
          {loading ? <SkeletonTable rows={8} columns={8} /> : products.length === 0 ? (
            <EmptyState icon="lucide:package" title="No Products Found" message="Start by adding your first product." actionLabel="Add Product" onAction={() => { setEditId(null); setViewState('form'); }} />
          ) : (
            <>
              <Table responsive hover className="align-middle mb-0">
                <thead className="table-light">
                  <tr>
                    <th style={{width:50}}>Image</th>
                    <th>Name</th>
                    <th>Category</th>
                    <th>Barcode</th>
                    <th className="text-end">Stock</th>
                    <th className="text-end">MRP / Sell</th>
                    <th>Status</th>
                    <th className="text-end">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {products.map(p => (
                    <tr key={p._id}>
                      <td>{p.featuredImage ? <img src={p.featuredImage} alt="" width="36" height="36" className="rounded" style={{ objectFit: 'cover' }} /> : <div className="bg-light rounded d-flex align-items-center justify-content-center" style={{ width: 36, height: 36 }}><Icon icon="lucide:image" width={14} className="text-muted" /></div>}</td>
                      <td className="fw-medium">{p.name}</td>
                      <td className="text-muted">{p.category?.name || 'Uncategorized'}</td>
                      <td className="text-muted"><code className="small">{p.barcode || '-'}</code></td>
                      <td className="text-end">
                        <OverlayTrigger overlay={<Tooltip>{(p.stock || 0) <= (p.lowStockThreshold || 0) ? 'Low Stock!' : 'In Stock'}</Tooltip>}>
                          <Badge bg={(p.stock || 0) <= (p.lowStockThreshold || 0) ? 'danger' : 'success'}>{p.stock || 0}</Badge>
                        </OverlayTrigger>
                      </td>
                      <td className="text-end"><del className="text-muted small">₹{p.mrp}</del> <span className="fw-medium text-success">₹{p.sellingPrice}</span></td>
                      <td><Badge bg={p.isActive ? 'success' : 'secondary'}>{p.isActive ? 'Active' : 'Inactive'}</Badge></td>
                      <td className="text-end">
                        <Button variant="light" size="sm" className="me-1" onClick={() => { setEditId(p._id); setViewState('form'); }}><Icon icon="lucide:edit" width={14} /></Button>
                        <Button variant="light" size="sm" className="text-danger" onClick={() => handleDelete(p._id)}><Icon icon="lucide:trash-2" width={14} /></Button>
                      </td>
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
    </div>
  );
}
