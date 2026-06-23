import React, { useEffect, useState } from 'react';
import { Button, Card, OverlayTrigger, Table, Tooltip } from 'react-bootstrap';
import { Edit, Image, Trash2, Upload } from 'lucide-react';
import { fetchApi } from '@/utils/api';
import { toast } from 'react-hot-toast';
import PageHeader from '@/components/common/PageHeader';
import SkeletonTable from '@/components/common/SkeletonTable';
import EmptyState from '@/components/common/EmptyState';
import ActionBar from '@/components/common/ActionBar';
import SearchBar from '@/components/common/SearchBar';
import StatusBadge from '@/components/common/StatusBadge';
import DeleteModal from '@/components/common/DeleteModal';
import PaginationComponent from '@/components/common/PaginationComponent';
import ErrorState from '@/components/common/ErrorState';
import { formatCurrency } from '@/utils/format';
import ProductForm from './ProductForm';
import BulkImport from './BulkImport';

export default function ProductsList() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [search, setSearch] = useState('');
  const [viewState, setViewState] = useState('list');
  const [editId, setEditId] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalRecords, setTotalRecords] = useState(0);
  const [deleteTarget, setDeleteTarget] = useState(null);

  useEffect(() => {
    if (viewState === 'list') loadProducts();
  }, [viewState, currentPage, search]);

  const loadProducts = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetchApi(`/products?page=${currentPage}&limit=20&search=${search}`);
      const payload = res.data ? res : res;
      setProducts(payload.data || []);
      setTotalPages(payload.totalPages || 1);
      setTotalRecords(payload.total || 0);
    } catch (e) {
      setError(e.message);
      toast.error('Failed to load products');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    try {
      await fetchApi(`/products/${deleteTarget._id}`, { method: 'DELETE' });
      toast.success('Product deleted');
      setDeleteTarget(null);
      loadProducts();
    } catch (e) {
      toast.error(e.message);
    }
  };

  if (viewState === 'form') return <ProductForm productId={editId} onBack={() => setViewState('list')} onSave={() => setViewState('list')} />;
  if (viewState === 'import') return <BulkImport onBack={() => setViewState('list')} onComplete={() => setViewState('list')} />;

  return (
    <div>
      <PageHeader
        title="Products"
        description="Manage products, inventory, pricing and barcode mapping."
        breadcrumbs={[{ label: 'Dashboard', path: '/dashboard' }, { label: 'Catalog' }, { label: 'Products' }]}
      />

      <ActionBar
        left={<SearchBar placeholder="Search products..." value={search} onChange={(value) => { setSearch(value); setCurrentPage(1); }} />}
        count={totalRecords}
        onRefresh={loadProducts}
        right={(
          <>
            <Button variant="outline-secondary" onClick={() => setViewState('import')}><Upload size={20} />Import CSV</Button>
            <Button variant="primary" onClick={() => { setEditId(null); setViewState('form'); }}>Add Product</Button>
          </>
        )}
      />

      <Card>
        <Card.Body>
          {loading ? <SkeletonTable rows={8} columns={8} /> : error ? (
            <ErrorState message={error} onRetry={loadProducts} />
          ) : products.length === 0 ? (
            <EmptyState icon="lucide:package" title="No Products Found" message="Start by adding your first product." actionLabel="Add Product" onAction={() => { setEditId(null); setViewState('form'); }} />
          ) : (
            <>
              <Table responsive hover className="align-middle mb-0">
                <thead className="table-light">
                  <tr>
                    <th style={{ width: 64 }}>Image</th>
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
                  {products.map((product) => (
                    <tr key={product._id}>
                      <td>
                        {product.featuredImage ? (
                          <img src={product.featuredImage} alt="" width="40" height="40" className="rounded" style={{ objectFit: 'cover' }} />
                        ) : (
                          <div className="bg-light rounded d-flex align-items-center justify-content-center" style={{ width: 40, height: 40 }}>
                            <Image size={20} className="text-muted" />
                          </div>
                        )}
                      </td>
                      <td className="fw-semibold">{product.name}</td>
                      <td className="text-muted">{product.category?.name || 'Uncategorized'}</td>
                      <td className="text-muted"><code>{product.barcode || '-'}</code></td>
                      <td className="text-end">
                        <OverlayTrigger overlay={<Tooltip>{(product.stock || 0) <= (product.lowStockThreshold || 0) ? 'Low stock' : 'In stock'}</Tooltip>}>
                          <span><StatusBadge status={product.stock || 0} variant={(product.stock || 0) <= (product.lowStockThreshold || 0) ? 'danger' : 'success'} /></span>
                        </OverlayTrigger>
                      </td>
                      <td className="text-end">
                        <del className="text-muted">{formatCurrency(product.mrp)}</del>{' '}
                        <span className="fw-semibold text-success">{formatCurrency(product.sellingPrice)}</span>
                      </td>
                      <td><StatusBadge status={product.isActive ? 'Active' : 'Inactive'} /></td>
                      <td className="text-end">
                        <Button variant="light" className="kuiklo-icon-btn me-1" onClick={() => { setEditId(product._id); setViewState('form'); }} aria-label="Edit product">
                          <Edit size={20} />
                        </Button>
                        <Button variant="light" className="kuiklo-icon-btn text-danger" onClick={() => setDeleteTarget(product)} aria-label="Delete product">
                          <Trash2 size={20} />
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </Table>
              <PaginationComponent currentPage={currentPage} totalPages={totalPages} totalRecords={totalRecords} onPageChange={setCurrentPage} />
            </>
          )}
        </Card.Body>
      </Card>

      <DeleteModal show={Boolean(deleteTarget)} itemName={deleteTarget?.name || 'this product'} onCancel={() => setDeleteTarget(null)} onConfirm={handleDelete} />
    </div>
  );
}
