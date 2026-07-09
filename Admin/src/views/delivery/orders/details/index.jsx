import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router';
import { Card, Button, Row, Col, Spinner, Table } from 'react-bootstrap';
import { fetchApi } from '@/utils/api';
import PageHeader from '@/components/common/PageHeader';
import StatusBadge from '@/components/common/StatusBadge';
import { ArrowLeft, Phone, Copy, CheckCircle, XCircle, Package, Truck } from 'lucide-react';
import { toast } from 'react-hot-toast';
import { formatCurrency, formatDate } from '@/utils/format';
import OrderTimeline from '@/views/admin/orders/details/OrderTimeline';

export default function DeliveryOrderDetails() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);

  useEffect(() => { loadOrder(); }, [id]);

  const loadOrder = async () => {
    try {
      setLoading(true);
      const res = await fetchApi(`/orders/${id}`);
      setOrder(res.data || res);
    } catch (e) {
      toast.error('Failed to load order details');
    } finally {
      setLoading(false);
    }
  };

  const updateStatus = async (status) => {
    try {
      setUpdating(true);
      await fetchApi(`/orders/delivery/${id}/status`, {
        method: 'PUT',
        body: JSON.stringify({ status })
      });
      toast.success(`Order marked as ${status}`);
      loadOrder();
    } catch (e) {
      toast.error(e.message);
    } finally {
      setUpdating(false);
    }
  };

  const copyAddress = () => {
    if (!order?.deliveryAddress) return;
    const { street, city, state, zipCode } = order.deliveryAddress;
    navigator.clipboard.writeText(`${street}, ${city}, ${state} ${zipCode}`);
    toast.success('Address copied!');
  };

  if (loading) return <div className="text-center p-5"><Spinner animation="border" /></div>;
  if (!order) return <div className="text-center p-5">Order not found</div>;

  const getActionButtons = () => {
    switch (order.status) {
      case 'Assigned':
        return (
          <div className="d-flex flex-column gap-2">
            <Button variant="success" size="lg" onClick={() => updateStatus('Accepted')} disabled={updating}>
              <CheckCircle size={18} className="me-2" /> Accept Delivery
            </Button>
            <Button variant="outline-danger" onClick={() => updateStatus('Rejected')} disabled={updating}>
              <XCircle size={18} className="me-2" /> Reject
            </Button>
          </div>
        );
      case 'Accepted':
        return (
          <Button variant="primary" size="lg" className="w-100" onClick={() => updateStatus('Picked Up')} disabled={updating}>
            <Package size={18} className="me-2" /> Mark Picked Up
          </Button>
        );
      case 'Picked Up':
        return (
          <Button variant="info" size="lg" className="w-100" onClick={() => updateStatus('Out For Delivery')} disabled={updating}>
            <Truck size={18} className="me-2" /> Start Delivery
          </Button>
        );
      case 'Out For Delivery':
        return (
          <Button variant="success" size="lg" className="w-100" onClick={() => updateStatus('Delivered')} disabled={updating}>
            <CheckCircle size={18} className="me-2" /> Mark Delivered
          </Button>
        );
      case 'Delivered':
        return (
          <div className="text-center py-3">
            <CheckCircle size={36} className="text-success mb-2" />
            <h6 className="text-success mb-0">Delivery Completed</h6>
          </div>
        );
      default:
        return null;
    }
  };

  return (
    <div>
      <PageHeader 
        title={`Order ${order.orderNumber}`} 
        description={`Placed on ${formatDate ? formatDate(order.createdAt) : new Date(order.createdAt).toLocaleDateString()}`}
        breadcrumbs={[
          { label: 'My Orders', path: '/delivery/orders' },
          { label: order.orderNumber }
        ]}
      />

      <Row>
        <Col lg={8}>
          {/* Delivery Actions */}
          <Card className="mb-3">
            <Card.Header><h5 className="mb-0">Delivery Actions</h5></Card.Header>
            <Card.Body>
              <div className="d-flex align-items-center justify-content-between mb-3">
                <span className="text-muted">Current Status</span>
                <StatusBadge status={order.status} />
              </div>
              {getActionButtons()}
            </Card.Body>
          </Card>

          {/* Products */}
          <Card className="mb-3">
            <Card.Header><h5 className="mb-0">Ordered Products</h5></Card.Header>
            <Card.Body className="p-0">
              <Table responsive hover className="align-middle mb-0">
                <thead>
                  <tr>
                    <th>Product</th>
                    <th>Variant</th>
                    <th className="text-center">Qty</th>
                    <th className="text-end">Price</th>
                    <th className="text-end">Total</th>
                  </tr>
                </thead>
                <tbody>
                  {order.items?.map((item, idx) => (
                    <tr key={idx}>
                      <td>
                        <div className="d-flex align-items-center gap-2">
                          {item.productImage ? (
                            <img src={item.productImage} alt={item.productName} className="rounded" style={{ width: 36, height: 36, objectFit: 'cover' }} />
                          ) : (
                            <div className="bg-light rounded d-flex justify-content-center align-items-center" style={{ width: 36, height: 36 }}>
                              <Package size={18} className="text-muted" />
                            </div>
                          )}
                          <span>{item.productName}</span>
                        </div>
                      </td>
                      <td className="text-muted">{item.variantName || '—'}</td>
                      <td className="text-center">{item.qty}</td>
                      <td className="text-end">{formatCurrency ? formatCurrency(item.price) : `₹${item.price?.toFixed(2)}`}</td>
                      <td className="text-end"><strong>{formatCurrency ? formatCurrency(item.total) : `₹${item.total?.toFixed(2)}`}</strong></td>
                    </tr>
                  ))}
                </tbody>
              </Table>
            </Card.Body>
          </Card>

          {/* Timeline */}
          <OrderTimeline orderId={order._id} />
        </Col>

        <Col lg={4}>
          {/* Customer Details */}
          <Card className="mb-3">
            <Card.Header><h5 className="mb-0">Customer</h5></Card.Header>
            <Card.Body>
              <h5 className="mb-1">{order.customer?.name || 'Walk-in Customer'}</h5>
              <p className="text-muted mb-3">{order.customer?.phone || '—'}</p>
              
              {order.customer?.phone && (
                <Button variant="outline-primary" size="sm" className="w-100 mb-3" as="a" href={`tel:${order.customer.phone}`}>
                  <Phone size={16} className="me-2" /> Call Customer
                </Button>
              )}
              
              {order.deliveryAddress && (
                <>
                  <hr />
                  <h6 className="text-muted mb-2">Delivery Address</h6>
                  <p className="mb-2">
                    {order.deliveryAddress.street}<br />
                    {order.deliveryAddress.city}, {order.deliveryAddress.state} {order.deliveryAddress.zipCode}
                  </p>
                  <Button variant="outline-secondary" size="sm" className="w-100" onClick={copyAddress}>
                    <Copy size={16} className="me-2" /> Copy Address
                  </Button>
                </>
              )}
            </Card.Body>
          </Card>

          {/* Order Summary */}
          <Card className="mb-3">
            <Card.Header><h5 className="mb-0">Order Summary</h5></Card.Header>
            <Card.Body>
              <div className="d-flex justify-content-between mb-2">
                <span className="text-muted">Order Number</span>
                <strong>{order.orderNumber}</strong>
              </div>
              <div className="d-flex justify-content-between mb-2">
                <span className="text-muted">Invoice</span>
                <span>{order.invoiceNumber || '—'}</span>
              </div>
              <div className="d-flex justify-content-between mb-2">
                <span className="text-muted">Date</span>
                <span>{formatDate ? formatDate(order.createdAt) : new Date(order.createdAt).toLocaleDateString()}</span>
              </div>
              <div className="d-flex justify-content-between mb-2">
                <span className="text-muted">Payment</span>
                <StatusBadge status={order.paymentStatus} />
              </div>
              <div className="d-flex justify-content-between mb-2">
                <span className="text-muted">Method</span>
                <span>{order.paymentMethod || '—'}</span>
              </div>
              <hr />
              <div className="d-flex justify-content-between mb-2">
                <span className="text-muted">Subtotal</span>
                <span>{formatCurrency ? formatCurrency(order.subTotal) : `₹${order.subTotal?.toFixed(2)}`}</span>
              </div>
              {order.tax > 0 && (
                <div className="d-flex justify-content-between mb-2">
                  <span className="text-muted">Tax</span>
                  <span>{formatCurrency ? formatCurrency(order.tax) : `₹${order.tax?.toFixed(2)}`}</span>
                </div>
              )}
              {order.discount > 0 && (
                <div className="d-flex justify-content-between mb-2">
                  <span className="text-muted">Discount</span>
                  <span className="text-success">-{formatCurrency ? formatCurrency(order.discount) : `₹${order.discount?.toFixed(2)}`}</span>
                </div>
              )}
              <hr />
              <div className="d-flex justify-content-between">
                <h5 className="mb-0">Total</h5>
                <h5 className="mb-0 text-primary">{formatCurrency ? formatCurrency(order.amount) : `₹${order.amount?.toFixed(2)}`}</h5>
              </div>
            </Card.Body>
          </Card>
        </Col>
      </Row>
    </div>
  );
}
