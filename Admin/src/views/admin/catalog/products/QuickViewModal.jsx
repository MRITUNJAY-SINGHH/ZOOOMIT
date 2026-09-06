import React, { useState, useEffect } from 'react';
import { Modal, Button, Row, Col, Badge, Table, Spinner } from 'react-bootstrap';
import { PackageOpen, X, Star, History, PackagePlus, Building, Layers } from 'lucide-react';
import { useNavigate } from 'react-router';
import { fetchApi } from '@/utils/api';
import { formatCurrency, formatDate } from '@/utils/format';

export default function QuickViewModal({ show, product, onHide }) {
  const navigate = useNavigate();
  const [historyData, setHistoryData] = useState(null);
  const [loadingHistory, setLoadingHistory] = useState(false);

  useEffect(() => {
    if (show && product?._id) {
      loadSupplierHistory();
    } else {
      setHistoryData(null);
    }
  }, [show, product?._id]);

  const loadSupplierHistory = async () => {
    setLoadingHistory(true);
    try {
      const data = await fetchApi(`/products/${product._id}/supplier-history`);
      setHistoryData(data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoadingHistory(false);
    }
  };

  if (!product) return null;

  const handleRecordStock = (supplierId = '') => {
    onHide();
    const query = supplierId ? `?productId=${product._id}&supplierId=${supplierId}` : `?productId=${product._id}`;
    navigate(`/inventory/stock-entry${query}`);
  };

  return (
    <Modal show={show} onHide={onHide} centered size="xl" className="border-0">
      <Modal.Header closeButton className="border-bottom-0 pb-0">
        <Modal.Title className="fw-bold d-flex align-items-center gap-2">
          <Layers size={20} className="text-primary" /> Product Overview & Procurement History
        </Modal.Title>
      </Modal.Header>
      <Modal.Body className="p-4">
        <Row className="g-4 mb-4">
          <Col md={4}>
            <div className="bg-body-secondary rounded d-flex align-items-center justify-content-center overflow-hidden mb-3" style={{ height: '240px' }}>
              {product.featuredImage ? (
                <img src={product.featuredImage} alt={product.name} className="w-100 h-100" style={{ objectFit: 'cover' }} />
              ) : (
                <PackageOpen size={64} className="text-secondary opacity-50" />
              )}
            </div>
            <div className="d-grid gap-2">
              <Button 
                variant="primary" 
                className="d-flex align-items-center justify-content-center gap-2"
                onClick={() => handleRecordStock(historyData?.recommendedSupplier?._id)}
              >
                <PackagePlus size={16} /> Record Stock Entry
              </Button>
            </div>
          </Col>
          <Col md={8}>
            <div className="d-flex align-items-center gap-2 mb-2">
              <Badge bg={product.isActive ? 'success' : 'warning'} className="px-2 py-1">
                {product.isActive ? 'Published' : 'Pending'}
              </Badge>
              <Badge bg="primary-subtle" className="text-primary font-size-12">
                {product.category?.name || 'Uncategorized'}
              </Badge>
              {product.subcategory && (
                <span className="text-muted font-size-12">↳ {product.subcategory.name}</span>
              )}
              {product.hasExpiryTracking && (
                <Badge bg="warning-subtle" className="text-warning border border-warning-subtle font-size-11">
                  Perishable
                </Badge>
              )}
            </div>
            
            <h3 className="fw-bold mb-1">{product.name}</h3>
            <p className="text-muted mb-3">
              Brand: <strong>{product.brand || 'Unbranded'}</strong> &nbsp;|&nbsp; 
              SKU: <code className="font-monospace">{product.baseSku || '-'}</code> &nbsp;|&nbsp; 
              Barcode: <code className="font-monospace">{product.barcode || '-'}</code>
            </p>
            
            <div className="p-3 bg-body-tertiary rounded border d-flex flex-wrap align-items-center justify-content-between gap-3 mb-3">
              <div>
                <div className="text-muted font-size-11 mb-1">Selling Price</div>
                <h4 className="fw-bold mb-0 text-primary">{formatCurrency(product.sellingPrice)} <span className="font-size-13 fw-normal text-muted">/ {product.baseUnit || 'PCS'}</span></h4>
              </div>
              <div>
                <div className="text-muted font-size-11 mb-1">Cost Price</div>
                <h5 className="fw-bold mb-0 text-body">{formatCurrency(product.costPrice || 0)}</h5>
              </div>
              <div>
                <div className="text-muted font-size-11 mb-1">Current Stock</div>
                <h5 className={`fw-bold mb-0 ${product.stock <= (product.lowStockThreshold || 10) ? 'text-danger' : 'text-success'}`}>
                  {product.stock || 0} {product.baseUnit || 'PCS'}
                </h5>
              </div>
              <div>
                <div className="text-muted font-size-11 mb-1">GST Tax Rate</div>
                <Badge bg="light" className="text-dark border font-size-12">{product.taxRate || 0}%</Badge>
              </div>
            </div>
            
            <div>
              <h6 className="fw-bold font-size-13 mb-1">Description</h6>
              <p className="text-muted font-size-13 mb-0">{product.description || 'No description available.'}</p>
            </div>
          </Col>
        </Row>

        {/* --- SUPPLIERS & PURCHASE HISTORY SECTION --- */}
        <div className="border-top pt-4">
          <div className="d-flex justify-content-between align-items-center mb-3">
            <h5 className="fw-bold mb-0 d-flex align-items-center gap-2">
              <Building size={18} className="text-primary" /> Suppliers & Purchase History
            </h5>
            <small className="text-muted">Dynamic supplier intelligence aggregated from batches</small>
          </div>

          {loadingHistory ? (
            <div className="text-center py-4">
              <Spinner animation="border" size="sm" className="text-primary me-2" />
              <span className="text-muted font-size-13">Loading supplier purchase intelligence...</span>
            </div>
          ) : historyData?.suppliers?.length > 0 ? (
            <Table responsive hover className="align-middle mb-0 font-size-13">
              <thead className="table-light">
                <tr>
                  <th>Supplier / Company</th>
                  <th>Contact & GST</th>
                  <th>Last Purchase Unit</th>
                  <th>Last Unit Cost</th>
                  <th>Last Inward Date</th>
                  <th className="text-end">Action</th>
                </tr>
              </thead>
              <tbody>
                {historyData.suppliers.map((item, idx) => (
                  <tr key={item.supplier._id || idx}>
                    <td>
                      <div className="fw-bold d-flex align-items-center gap-1">
                        {item.supplier.companyName || item.supplier.name}
                        {item.isPreferred && (
                          <Badge bg="warning" className="text-dark font-size-10 d-inline-flex align-items-center gap-1">
                            <Star size={10} fill="currentColor" /> Preferred
                          </Badge>
                        )}
                      </div>
                      <small className="text-muted">{item.supplier.name}</small>
                    </td>
                    <td>
                      <div>{item.supplier.phone || '-'}</div>
                      {item.supplier.gstNumber && (
                        <small className="text-muted font-monospace">{item.supplier.gstNumber}</small>
                      )}
                    </td>
                    <td>
                      <span className="fw-semibold">{item.lastPurchaseQty || '-'}</span>{' '}
                      <span className="text-muted font-size-11">{item.lastPurchaseUnit || product.baseUnit}</span>
                    </td>
                    <td className="fw-bold text-primary">
                      {item.lastUnitCost ? formatCurrency(item.lastUnitCost) : '-'}
                      <span className="text-muted font-size-11 fw-normal"> / {item.lastPurchaseUnit || product.baseUnit}</span>
                    </td>
                    <td className="text-muted">
                      {item.lastPurchaseDate ? formatDate(item.lastPurchaseDate) : 'No recorded batch'}
                    </td>
                    <td className="text-end">
                      <Button 
                        variant="outline-primary" 
                        size="sm" 
                        className="py-1 px-2 font-size-12 d-inline-flex align-items-center gap-1"
                        onClick={() => handleRecordStock(item.supplier._id)}
                      >
                        <PackagePlus size={13} /> Record Stock
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </Table>
          ) : (
            <div className="text-center py-4 bg-body-tertiary rounded border">
              <p className="text-muted small mb-2">No historical suppliers recorded for this product yet.</p>
              <Button 
                variant="primary" 
                size="sm" 
                className="d-inline-flex align-items-center gap-1"
                onClick={() => handleRecordStock()}
              >
                <PackagePlus size={14} /> Add First Stock Inwarding
              </Button>
            </div>
          )}
        </div>
      </Modal.Body>
    </Modal>
  );
}
