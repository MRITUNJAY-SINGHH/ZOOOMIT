import React from 'react';
import { Modal, Button, Row, Col, Badge } from 'react-bootstrap';
import { PackageOpen, X } from 'lucide-react';
import { formatCurrency, formatDate } from '@/utils/format';

export default function QuickViewModal({ show, product, onHide }) {
  if (!product) return null;

  return (
    <Modal show={show} onHide={onHide} centered size="lg" className="border-0">
      <Modal.Header closeButton className="border-bottom-0 pb-0">
        <Modal.Title className="fw-bold">Product Quick View</Modal.Title>
      </Modal.Header>
      <Modal.Body className="p-4">
        <Row className="g-4">
          <Col md={5}>
            <div className="bg-body-secondary rounded d-flex align-items-center justify-content-center overflow-hidden" style={{ height: '300px' }}>
              {product.featuredImage ? (
                <img src={product.featuredImage} alt={product.name} className="w-100 h-100" style={{ objectFit: 'cover' }} />
              ) : (
                <PackageOpen size={64} className="text-secondary opacity-50" />
              )}
            </div>
          </Col>
          <Col md={7}>
            <div className="mb-2">
              <Badge bg={product.isActive ? 'success' : 'warning'} className="me-2 px-2 py-1">
                {product.isActive ? 'Published' : 'Pending'}
              </Badge>
              <span className="text-muted font-size-13 fw-medium text-uppercase tracking-wider">
                {product.category?.name || 'Uncategorized'}
              </span>
            </div>
            
            <h3 className="fw-bold mb-1">{product.name}</h3>
            <p className="text-muted mb-3">Brand: {product.brand || 'N/A'} &nbsp;|&nbsp; Code: <code>{product.barcode || product.baseSku || '-'}</code></p>
            
            <div className="d-flex align-items-end gap-3 mb-4 pb-4 border-bottom">
              <div>
                <div className="text-muted font-size-13 fw-medium mb-1">Selling Price</div>
                <h4 className="fw-bold mb-0 text-primary">{formatCurrency(product.sellingPrice)}</h4>
              </div>
              <div>
                <div className="text-muted font-size-13 fw-medium mb-1">Stock</div>
                <h5 className="fw-bold mb-0">{product.stock || 0} units</h5>
              </div>
            </div>
            
            <div className="mb-3">
              <h6 className="fw-bold">Description</h6>
              <p className="text-muted font-size-14">{product.description || 'No description available for this product.'}</p>
            </div>
            
            <div className="text-muted font-size-13 mt-4">
              Added on: {formatDate(product.createdAt)}
            </div>
          </Col>
        </Row>
      </Modal.Body>
    </Modal>
  );
}
