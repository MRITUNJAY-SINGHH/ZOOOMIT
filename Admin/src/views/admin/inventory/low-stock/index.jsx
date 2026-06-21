import React, { useState, useEffect } from 'react';
import { Card, Table, Badge, Button } from 'react-bootstrap';
import { fetchApi } from '@/utils/api';

export default function LowStock() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadLowStock();
  }, []);

  const loadLowStock = async () => {
    setLoading(true);
    try {
      const data = await fetchApi('/inventory/low-stock');
      setProducts(data);
    } catch (e) { console.error(e); }
    setLoading(false);
  };

  return (
    <Card>
      <Card.Header>
        <h4>Low Stock Alerts</h4>
        <p className="text-muted mb-0">Products whose total stock has fallen below their individual thresholds.</p>
      </Card.Header>
      <Card.Body>
        <Table striped responsive hover>
          <thead>
            <tr>
              <th>Image</th>
              <th>Product</th>
              <th>Category</th>
              <th>Current Stock</th>
              <th>Threshold</th>
              <th>Action</th>
            </tr>
          </thead>
          <tbody>
            {loading ? <tr><td colSpan="6" className="text-center">Loading...</td></tr> : 
              products.map(p => (
                <tr key={p._id}>
                  <td>
                    {p.featuredImage ? <img src={p.featuredImage} alt="thumbnail" width="40" height="40" className="rounded" /> : <div className="bg-light rounded" style={{width: 40, height: 40}}></div>}
                  </td>
                  <td><strong>{p.name}</strong> <small className="text-muted d-block">{p.barcode}</small></td>
                  <td>{p.category?.name || 'N/A'}</td>
                  <td>
                    <Badge bg={p.stock === 0 ? 'danger' : 'warning'} className="fs-6">
                      {p.stock}
                    </Badge>
                  </td>
                  <td>{p.lowStockThreshold}</td>
                  <td>
                    <Button variant="primary" size="sm" href="/admin/inventory/stock-entry">Restock</Button>
                  </td>
                </tr>
              ))
            }
            {!loading && products.length === 0 && <tr><td colSpan="6" className="text-center">No low stock alerts.</td></tr>}
          </tbody>
        </Table>
      </Card.Body>
    </Card>
  );
}
