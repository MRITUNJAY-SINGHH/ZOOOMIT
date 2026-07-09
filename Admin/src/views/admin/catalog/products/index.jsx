import React, { useEffect, useState } from 'react';
import { Button, Card, Dropdown, Form, InputGroup, OverlayTrigger, Table, Tooltip, Row, Col, Modal, Spinner } from 'react-bootstrap';
import { Edit, Eye, Image, Trash2, Upload, Plus, Search, Filter, Grid as GridIcon, List as ListIcon, Star, PackageOpen, LayoutGrid, List, Download } from 'lucide-react';
import { fetchApi } from '@/utils/api';
import { toast } from 'react-hot-toast';
import { useLocation } from 'react-router';
import PageHeader from '@/components/common/PageHeader';
import SkeletonTable from '@/components/common/SkeletonTable';
import EmptyState from '@/components/common/EmptyState';
import StatusBadge from '@/components/common/StatusBadge';
import PaginationComponent from '@/components/common/PaginationComponent';
import ErrorState from '@/components/common/ErrorState';
import { formatCurrency, formatDate } from '@/utils/format';
import DeleteModal from '@/components/common/DeleteModal';
import ProductForm from './ProductForm';
import BulkImport from './BulkImport';
import QuickViewModal from './QuickViewModal';
import PermissionGuard from '@/components/PermissionGuard';

export default function ProductsList() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  // States for view toggle & routing
  const [viewState, setViewState] = useState('list'); // 'list', 'form', 'import'
  const [viewMode, setViewMode] = useState('list'); // 'list', 'grid'
  const [editId, setEditId] = useState(null);
  
  // Filtering & Pagination
  const [search, setSearch] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [limit, setLimit] = useState(8);
  const [categoryFilter, setCategoryFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  
  const [totalPages, setTotalPages] = useState(1);
  const [totalRecords, setTotalRecords] = useState(0);
  
  // Selection & Bulk Actions
  const location = useLocation();
  const [selectedItems, setSelectedItems] = useState([]);
  const [deleteTarget, setDeleteTarget] = useState(null); // specific product obj OR 'bulk'
  const [isDeleting, setIsDeleting] = useState(false);
  const [viewTarget, setViewTarget] = useState(location.state?.viewProductId ? { _id: location.state.viewProductId } : null);

  useEffect(() => {
    if (viewState === 'list') loadProducts();
  }, [viewState, currentPage, limit, search, categoryFilter, statusFilter]);

  const loadProducts = async () => {
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams({ page: currentPage, limit, search, category: categoryFilter, status: statusFilter });
      const res = await fetchApi(`/products?${params.toString()}`);
      const payload = res.data ? res : res;
      setProducts(payload.data || []);
      setTotalPages(payload.totalPages || 1);
      setTotalRecords(payload.total || 0);
      setSelectedItems([]); // reset selection on load
    } catch (e) {
      setError(e.message);
      toast.error('Failed to load products');
    } finally {
      setLoading(false);
    }
  };

  const handleSelectAll = (e) => {
    if (e.target.checked) {
      setSelectedItems(products.map(p => p._id));
    } else {
      setSelectedItems([]);
    }
  };

  const handleSelectItem = (id) => {
    setSelectedItems(prev => 
      prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
    );
  };

  const executeDelete = async () => {
    if (!deleteTarget) return;
    setIsDeleting(true);
    try {
      if (deleteTarget === 'bulk') {
        await fetchApi('/products/bulk', { 
          method: 'DELETE', 
          body: JSON.stringify({ productIds: selectedItems }) 
        });
        toast.success(`${selectedItems.length} products deleted`);
        setSelectedItems([]);
      } else {
        await fetchApi(`/products/${deleteTarget._id}`, { method: 'DELETE' });
        toast.success('Product deleted');
        setSelectedItems(selectedItems.filter(id => id !== deleteTarget._id));
      }
      setDeleteTarget(null);
      loadProducts();
    } catch (e) {
      toast.error(e.message);
    } finally {
      setIsDeleting(false);
    }
  };

  // Mock functions for missing data in screenshot
  const getMockRating = (id) => (parseInt(id.substring(id.length - 2), 16) % 5) + 1;
  const getMockOrders = (id) => parseInt(id.substring(id.length - 3), 16);

  if (viewState === 'form') return <ProductForm productId={editId} onBack={() => setViewState('list')} onSave={() => setViewState('list')} />;
  if (viewState === 'import') return <BulkImport onBack={() => setViewState('list')} onComplete={() => setViewState('list')} />;

  return (
    <div>
      <PageHeader title="Products" />

      {/* Premium Toolbar */}
      <Card className="mb-3 border-0 shadow-sm">
        <Card.Body className="p-3">
          <div className="d-flex flex-wrap align-items-center justify-content-between gap-3">
            
            {/* Search */}
            <div className="d-flex align-items-center gap-2 flex-grow-1" style={{ maxWidth: '400px' }}>
              <InputGroup>
                <InputGroup.Text className="bg-transparent text-muted">
                  <Search size={18} />
                </InputGroup.Text>
                <Form.Control
                  placeholder="Search product name..."
                  value={search}
                  onChange={(e) => { setSearch(e.target.value); setCurrentPage(1); }}
                />
              </InputGroup>
            </div>

            {/* Filters and Controls */}
            <div className="d-flex align-items-center gap-2 flex-wrap flex-md-nowrap overflow-auto hide-scrollbar pb-1 pb-md-0">
              <span className="text-muted fw-medium font-size-13 text-nowrap d-none d-xl-inline">Filter By:</span>
              
              <Form.Select style={{ minWidth: '130px' }} value={categoryFilter} onChange={(e) => setCategoryFilter(e.target.value)}>
                <option value="">Category</option>
                <option value="electronics">Electronics</option>
                <option value="fashion">Fashion</option>
              </Form.Select>
              
              <Form.Select style={{ minWidth: '110px' }} value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
                <option value="">Status</option>
                <option value="active">Published</option>
                <option value="inactive">Pending</option>
              </Form.Select>

              <Form.Select style={{ minWidth: '70px' }} className="ms-xl-2" value={limit} onChange={(e) => setLimit(Number(e.target.value))}>
                <option value="8">8</option>
                <option value="16">16</option>
                <option value="32">32</option>
              </Form.Select>

              {/* View Toggles */}
              <div className="btn-group d-none d-sm-flex ms-2">
                <Button 
                  variant={viewMode === 'grid' ? 'primary' : 'outline-secondary'} 
                  className="px-2"
                  onClick={() => setViewMode('grid')}
                >
                  <LayoutGrid size={16} />
                </Button>
                <Button 
                  variant={viewMode === 'list' ? 'primary' : 'outline-secondary'} 
                  className="px-2"
                  onClick={() => setViewMode('list')}
                >
                  <List size={16} />
                </Button>
              </div>

              {/* Dynamic Action Button: Add or Delete */}
              <div className="ms-sm-2">
                {selectedItems.length > 0 ? (
                  <PermissionGuard permission="products.delete">
                    <Button variant="danger" className="d-flex align-items-center gap-2 px-3 shadow-sm text-nowrap" onClick={() => setDeleteTarget('bulk')}>
                      <Trash2 size={16} /> Delete All ({selectedItems.length})
                    </Button>
                  </PermissionGuard>
                ) : (
                  <PermissionGuard permission="products.create">
                    <Button variant="primary" className="d-flex align-items-center gap-2 px-3 shadow-sm text-nowrap" onClick={() => { setEditId(null); setViewState('form'); }}>
                      <Plus size={16} /> Add Product
                    </Button>
                  </PermissionGuard>
                )}
              </div>

            </div>
          </div>
        </Card.Body>
      </Card>

      <Card className="border-0 shadow-sm">
        <Card.Body className={viewMode === 'grid' ? 'bg-body-tertiary p-4 rounded' : 'p-0'}>
          {loading ? (
            <div className="p-4"><SkeletonTable rows={limit} columns={10} /></div>
          ) : error ? (
            <div className="p-4"><ErrorState message={error} onRetry={loadProducts} /></div>
          ) : products.length === 0 ? (
            <div className="p-5"><EmptyState icon="lucide:package" title="No Products Found" message="Try adjusting your filters or search query." actionLabel="Add Product" onAction={() => { setEditId(null); setViewState('form'); }} /></div>
          ) : viewMode === 'list' ? (
            // LIST VIEW
            <>
              <Table responsive hover className="align-middle mb-0 text-nowrap table-borderless">
                <thead className="bg-body-secondary border-bottom border-light">
                  <tr className="text-body text-uppercase font-size-13 fw-semibold tracking-wider">
                    <th style={{ width: 40 }} className="text-center px-4 rounded-start">
                      <Form.Check type="checkbox" checked={selectedItems.length === products.length && products.length > 0} onChange={handleSelectAll} className="fs-5" />
                    </th>
                    <th>Product</th>
                    <th>Category</th>
                    <th className="text-end">Stock</th>
                    <th className="text-end">Price</th>
                    <th className="text-end">Orders</th>
                    <th>Status</th>
                    <th>Published</th>
                    <th className="text-center rounded-end">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {products.map((product) => (
                    <tr key={product._id} className={selectedItems.includes(product._id) ? 'bg-primary-subtle' : ''} style={{ borderBottom: '1px solid var(--kuiklo-border-color)' }}>
                      <td className="text-center px-4">
                        <Form.Check type="checkbox" checked={selectedItems.includes(product._id)} onChange={() => handleSelectItem(product._id)} className="fs-5" />
                      </td>
                      <td className="py-3">
                        <div className="d-flex align-items-center gap-3">
                          {product.featuredImage ? (
                            <img src={product.featuredImage} alt="" width="44" height="44" className="rounded" style={{ objectFit: 'cover' }} />
                          ) : (
                            <div className="bg-body-tertiary rounded d-flex align-items-center justify-content-center text-secondary" style={{ width: 44, height: 44 }}>
                              <Image size={20} />
                            </div>
                          )}
                          <div>
                            <h6 className="mb-0 fw-bold text-body font-size-16">{product.name}</h6>
                          </div>
                        </div>
                      </td>
                      <td className="text-muted font-size-13">{product.category?.name || 'Uncategorized'}</td>
                      <td className="text-end fw-bold text-body font-size-13">
                        {product.stock || 0}
                      </td>
                      <td className="text-end fw-bold text-body font-size-13">
                        {formatCurrency(product.sellingPrice)}
                      </td>
                      <td className="text-end text-muted font-size-13">
                        {getMockOrders(product._id)}
                      </td>
                      <td>
                         <span className={`badge ${product.isActive ? 'bg-success-subtle text-success' : 'bg-warning-subtle text-warning'} px-2 py-1`}>
                           {product.isActive ? 'Published' : 'Pending'}
                         </span>
                      </td>
                      <td className="text-muted font-size-12 fw-medium">
                        {formatDate(product.createdAt)}
                      </td>
                      <td className="text-center">
                        <Button variant="light" size="sm" className="btn-icon me-1 text-secondary rounded-circle bg-body-secondary border-0" onClick={() => setViewTarget(product)} title="View">
                          <Eye size={15} />
                        </Button>
                        <PermissionGuard permission="products.edit">
                          <Button variant="light" size="sm" className="btn-icon me-1 text-primary rounded-circle bg-body-secondary border-0" onClick={() => { setEditId(product._id); setViewState('form'); }} title="Edit">
                            <Edit size={15} />
                          </Button>
                        </PermissionGuard>
                        <PermissionGuard permission="products.delete">
                          <Button variant="light" size="sm" className="btn-icon text-danger rounded-circle bg-body-secondary border-0" onClick={() => setDeleteTarget(product)} title="Delete">
                            <Trash2 size={15} />
                          </Button>
                        </PermissionGuard>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </Table>
            </>
          ) : (
            // GRID VIEW
            <Row className="g-3">
              {products.map((product) => (
                <Col xl={3} lg={4} sm={6} key={product._id}>
                  <Card className={`h-100 border-0 shadow-sm overflow-hidden ${selectedItems.includes(product._id) ? 'ring-2 ring-primary border border-primary' : ''}`}>
                    <div className="position-absolute top-0 start-0 p-3 z-1">
                      <Form.Check type="checkbox" className="shadow-sm fs-5" checked={selectedItems.includes(product._id)} onChange={() => handleSelectItem(product._id)} />
                    </div>
                    <div className="position-absolute top-0 end-0 p-3 z-1">
                      <span className={`badge ${product.isActive ? 'bg-success' : 'bg-warning'} px-2 py-1 shadow-sm`}>
                         {product.isActive ? 'Published' : 'Pending'}
                      </span>
                    </div>
                    <div className="bg-body-secondary d-flex align-items-center justify-content-center position-relative" style={{ height: '200px' }}>
                      {product.featuredImage ? (
                        <img src={product.featuredImage} alt={product.name} className="w-100 h-100" style={{ objectFit: 'cover' }} />
                      ) : (
                        <PackageOpen size={48} className="text-secondary opacity-50" />
                      )}
                    </div>
                    <Card.Body className="d-flex flex-column">
                      <div className="mb-2 text-muted font-size-11 fw-bold text-uppercase tracking-wider">{product.category?.name || 'Uncategorized'}</div>
                      <h5 className="mb-1 text-truncate fw-bold font-size-16" title={product.name}>{product.name}</h5>
                      <div className="d-flex align-items-center gap-1 text-warning mb-3">
                        {[...Array(5)].map((_, i) => (
                           <Star key={i} size={14} fill={i < getMockRating(product._id) ? "currentColor" : "none"} stroke={i < getMockRating(product._id) ? "currentColor" : "#ccc"} />
                        ))}
                        <small className="text-muted ms-1 font-size-12">({getMockOrders(product._id)})</small>
                      </div>
                      
                      <div className="mt-auto d-flex align-items-end justify-content-between">
                        <div>
                          <div className="text-muted font-size-12 fw-medium mb-1">Price</div>
                          <h5 className="mb-0 fw-bold">{formatCurrency(product.sellingPrice)}</h5>
                        </div>
                        <div className="text-end">
                          <div className="text-muted font-size-12 fw-medium mb-1">Stock</div>
                          <h6 className="mb-0 fw-bold">{product.stock || 0}</h6>
                        </div>
                      </div>
                    </Card.Body>
                    <Card.Footer className="bg-transparent border-top-0 pt-0 pb-3 px-3">
                       <div className="d-flex gap-2">
                          <PermissionGuard permission="products.edit">
                            <Button variant="light" className="flex-grow-1 text-primary d-flex align-items-center justify-content-center gap-2 bg-primary-subtle border-0 fw-medium" onClick={() => { setEditId(product._id); setViewState('form'); }}>
                              <Edit size={16} /> Edit
                            </Button>
                          </PermissionGuard>
                          <PermissionGuard permission="products.delete">
                            <Button variant="light" className="text-danger bg-danger-subtle border-0" onClick={() => setDeleteTarget(product)}>
                              <Trash2 size={16} />
                            </Button>
                          </PermissionGuard>
                       </div>
                    </Card.Footer>
                  </Card>
                </Col>
              ))}
            </Row>
          )}
          
          {/* Pagination shared between List and Grid */}
          {!loading && !error && products.length > 0 && (
            <div className={viewMode === 'list' ? 'p-3 border-top' : 'mt-4'}>
              <PaginationComponent currentPage={currentPage} totalPages={totalPages} totalRecords={totalRecords} onPageChange={setCurrentPage} />
            </div>
          )}
        </Card.Body>
      </Card>

      <DeleteModal 
        show={Boolean(deleteTarget)} 
        itemName={deleteTarget === 'bulk' ? `the selected ${selectedItems.length} products` : deleteTarget?.name}
        onCancel={() => !isDeleting && setDeleteTarget(null)} 
        onConfirm={executeDelete} 
        busy={isDeleting}
      />

      <QuickViewModal 
        show={Boolean(viewTarget)} 
        product={viewTarget} 
        onHide={() => setViewTarget(null)} 
      />
    </div>
  );
}
