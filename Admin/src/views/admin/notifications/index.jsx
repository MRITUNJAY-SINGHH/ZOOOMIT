import React, { useState, useEffect } from 'react';
import { Card, Table, Button, Badge } from 'react-bootstrap';
import PageHeader from '@/components/common/PageHeader';
import api from '@/utils/api';
import { Link, useNavigate } from 'react-router';
import { Bell, AlertTriangle, Clock, ShoppingBag, XCircle, RotateCcw, AlertOctagon } from 'lucide-react';
import { toast } from 'react-hot-toast';

export default function NotificationsPage() {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  const fetchNotifications = async () => {
    try {
      const res = await api.get('/notifications');
      setNotifications(res.data);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchNotifications();
  }, []);

  const markAsRead = async (id) => {
    try {
      await api.put(`/notifications/${id}/read`);
      setNotifications(notifications.filter(n => n._id !== id));
      toast.success('Notification marked as read');
    } catch (error) {
      toast.error('Failed to mark read');
    }
  };

  const markAllAsRead = async () => {
    try {
      await api.post('/notifications/mark-all');
      setNotifications([]);
      toast.success('All notifications marked as read');
    } catch (error) {
      toast.error('Failed to mark all read');
    }
  };

  const handleNotificationClick = async (item) => {
    await markAsRead(item._id);
    
    if (['New Order', 'Cancelled Order', 'Returned Order', 'Refund Failure'].includes(item.type)) {
      navigate('/orders/all', { state: { viewOrderId: item.order?._id } });
    } else if (['Low Stock', 'Expiring Product', 'Stock Adjustment'].includes(item.type)) {
      const productId = item.product?._id || item.batch?.product;
      navigate('/catalog/products', { state: { viewProductId: productId } });
    }
  };

  const getIconForType = (type) => {
    const props = { size: 18, strokeWidth: 2, className: 'me-2' };
    switch (type) {
      case 'Low Stock': return <AlertTriangle {...props} className="text-warning me-2" />;
      case 'Expiring Product': return <Clock {...props} className="text-danger me-2" />;
      case 'New Order': return <ShoppingBag {...props} className="text-success me-2" />;
      case 'Cancelled Order': return <XCircle {...props} className="text-danger me-2" />;
      case 'Returned Order': return <RotateCcw {...props} className="text-info me-2" />;
      case 'Refund Failure': return <AlertOctagon {...props} className="text-danger me-2" />;
      default: return <Bell {...props} className="text-primary me-2" />;
    }
  };

  return (
    <div>
      <PageHeader 
        title="Notifications" 
        rightContent={
          <Button variant="outline-primary" onClick={markAllAsRead} disabled={notifications.length === 0}>
            Mark All as Read
          </Button>
        }
      />
      
      <Card>
        <Card.Body>
          {loading ? (
            <div className="text-center py-4">Loading notifications...</div>
          ) : notifications.length === 0 ? (
            <div className="text-center py-5">
              <Bell size={48} className="text-muted mb-3 opacity-50" />
              <h5 className="text-muted">No new notifications</h5>
              <p className="text-muted mb-0">You're all caught up!</p>
            </div>
          ) : (
            <div className="list-group list-group-flush">
              {notifications.map((item) => (
                <div 
                  key={item._id} 
                  className="list-group-item d-flex justify-content-between align-items-center py-3"
                  style={{ cursor: 'pointer' }}
                  onClick={() => handleNotificationClick(item)}
                >
                  <div className="d-flex align-items-center">
                    {getIconForType(item.type)}
                    <div>
                      <h6 className="mb-1">{item.type}</h6>
                      <p className="mb-0 text-muted">{item.message}</p>
                    </div>
                  </div>
                  <div className="text-end ms-3">
                    <small className="text-muted d-block mb-2">{new Date(item.createdAt).toLocaleString()}</small>
                    <Button variant="light" size="sm" onClick={(e) => { e.stopPropagation(); markAsRead(item._id); }}>
                      Dismiss
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </Card.Body>
      </Card>
    </div>
  );
}
