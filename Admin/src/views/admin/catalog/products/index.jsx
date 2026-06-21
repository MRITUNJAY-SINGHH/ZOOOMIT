import React, { useState, useEffect } from 'react';
import { Card, Table, Button, Badge, OverlayTrigger, Tooltip } from 'react-bootstrap';
import { fetchApi } from '@/utils/api';
import ProductForm from './ProductForm';
import BulkImport from './BulkImport';

export default function ProductsList() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  
  const [viewState, setViewState] = useState('list'); // 'list', 'form', 'import'
  const [editId, setEditId] = useState(null);

  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalRecords, setTotalRecords] = useState(0);
  const itemsPerPage = 20;

  useEffect(() => {
    if (viewState === 'list') loadProducts();
  }, [viewState, currentPage]);

  const loadProducts = async () => {
    setLoading(true);
    try {
      const res = await fetchApi(`/products?page=${currentPage}&limit=${itemsPerPage}`);
      // Note: fetchApi already returns res.json() which means `res` is the payload body
      // Actually fetchApi might return res.json() data directly.
      // Wait, let's verify if fetchApi returns `res` or `res.json()`.
      // Let's assume fetchApi returns `res.json()` directly.
      const data = res.data ? res.data : res;
      setProducts(data);
      if (res.totalPages) setTotalPages(res.totalPages);
      if (res.total) setTotalRecords(res.total);
    } catch (e) { console.error(e); }
    setLoading(false);
  };

  const handleDelete = async (id) => {
    if (window.confirm('Delete product?')) {
      try {
        await fetchApi(`/products/${id}`, { method: 'DELETE' });
        loadProducts();
      } catch (e) { alert(e.message); }
    }
  };

  const openEdit = (id) => {
    setEditId(id);
    setViewState('form');
  };

  const openAdd = () => {
    setEditId(null);
    setViewState('form');
  };

  if (viewState === 'form') {
    return <ProductForm productId={editId} onBack={() => setViewState('list')} onSave={() => setViewState('list')} />;
  }

  if (viewState === 'import') {
    return <BulkImport onBack={() => setViewState('list')} onComplete={() => setViewState('list')} />;
  }

  return (
    <Card>
      <Card.Header className="d-flex justify-content-between align-items-center">
        <h4 className="mb-0">Products List</h4>
        <div>
          <Button variant="info" className="me-2 text-white" onClick={() => setViewState('import')}>Bulk Import (CSV)</Button>
          <Button variant="primary" onClick={openAdd}>Add Product</Button>
        </div>
      </Card.Header>
      <Card.Body>
        <Table responsive hover>
          <thead>
            <tr>
              <th>Image</th>
              <th>Name</th>
              <th>Category</th>
              <th>Barcode</th>
              <th>Stock</th>
              <th>Prices (MRP/Sell)</th>
              <th>Status</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading ? <tr><td colSpan="8" className="text-center">Loading...</td></tr> : 
              products.map(p => (
                <tr key={p._id}>
                  <td>
                    {p.featuredImage ? <img src={p.featuredImage} alt="thumbnail" width="40" height="40" className="rounded" /> : <div className="bg-light rounded" style={{width: 40, height: 40}}></div>}
                  </td>
                  <td><strong>{p.name}</strong></td>
                  <td>{p.category?.name || 'Uncategorized'}</td>
                  <td>{p.barcode || 'N/A'}</td>
                  <td>
                    {p.stock <= p.lowStockThreshold ? (
                      <OverlayTrigger overlay={<Tooltip>Low Stock Alert</Tooltip>}>
                        <Badge bg="danger">{p.stock}</Badge>
                      </OverlayTrigger>
                    ) : (
                      <Badge bg="success">{p.stock}</Badge>
                    )}
                  </td>
                  <td><del className="text-muted small">${p.mrp}</del> <strong className="text-success">${p.sellingPrice}</strong></td>
                  <td><Badge bg={p.isActive ? 'primary' : 'secondary'}>{p.isActive ? 'Active' : 'Inactive'}</Badge></td>
                  <td>
                    <Button size="sm" variant="outline-primary" className="me-1" onClick={() => openEdit(p._id)}>Edit</Button>
                    <Button size="sm" variant="outline-danger" onClick={() => handleDelete(p._id)}>Del</Button>
                  </td>
                </tr>
              ))
            }
          </tbody>
        </Table>

        {totalPages > 1 && (
          <div className="d-flex justify-content-between align-items-center mt-3">
            <span className="text-muted">Showing page {currentPage} of {totalPages} ({totalRecords} entries)</span>
            <div className="d-flex gap-2">
              <Button variant="outline-secondary" size="sm" disabled={currentPage === 1} onClick={() => setCurrentPage(p => p - 1)}>Prev</Button>
              <Button variant="outline-secondary" size="sm" disabled={currentPage === totalPages} onClick={() => setCurrentPage(p => p + 1)}>Next</Button>
            </div>
          </div>
        )}
      </Card.Body>
    </Card>
  );
}
