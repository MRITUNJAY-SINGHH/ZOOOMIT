import { Dropdown } from 'react-bootstrap';
import { Bell, AlertTriangle, Clock, ShoppingBag, XCircle, RotateCcw, AlertOctagon } from 'lucide-react';
import React, { useState, useEffect } from 'react';
import api from '@/utils/api';
import clsx from 'clsx';
import { Link } from 'react-router';

const NotificationDropdownPeople = () => {
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);

  const fetchNotifications = async () => {
    try {
      const res = await api.get('/notifications');
      setNotifications(res.data);
      setUnreadCount(res.data.length);
    } catch (error) {
      console.error('Failed to fetch notifications');
    }
  };

  useEffect(() => {
    fetchNotifications();

    const interval = setInterval(() => {
      fetchNotifications();
    }, 60000);

    return () => clearInterval(interval);
  }, []);

  const markAsRead = async (id) => {
    try {
      await api.put(`/notifications/${id}/read`);
      setNotifications(notifications.filter(n => n._id !== id));
      setUnreadCount(prev => prev - 1);
    } catch (error) {
      console.error('Failed to mark read');
    }
  };

  const markAllAsRead = async () => {
    try {
      await api.post('/notifications/mark-all');
      setNotifications([]);
      setUnreadCount(0);
    } catch (error) {
      console.error('Failed to mark all read');
    }
  };

  const getIconForType = (type) => {
    const props = { size: 20, strokeWidth: 2 };
    switch (type) {
      case 'Low Stock': return <AlertTriangle {...props} className="text-warning" />;
      case 'Expiring Product': return <Clock {...props} className="text-danger" />;
      case 'New Order': return <ShoppingBag {...props} className="text-success" />;
      case 'Cancelled Order': return <XCircle {...props} className="text-danger" />;
      case 'Returned Order': return <RotateCcw {...props} className="text-info" />;
      case 'Refund Failure': return <AlertOctagon {...props} className="text-danger" />;
      default: return <Bell {...props} className="text-primary" />;
    }
  };

  return (
    <div className="topbar-item nav-user">
      <Dropdown>
        <Dropdown.Toggle
          as="button"
          className="topbar-link drop-arrow-none"
          role="button"
          data-bs-toggle="dropdown"
          aria-haspopup="true"
          aria-expanded="false"
        >
          <span className="topbar-link-icon position-relative">
            <Bell size={20} strokeWidth={2} />
            {unreadCount > 0 && (
              <span className="position-absolute top-0 start-100 translate-middle badge rounded-pill bg-danger" style={{ fontSize: '10px', padding: '0.25em 0.4em' }}>
                {unreadCount > 99 ? '99+' : unreadCount}
              </span>
            )}
          </span>
        </Dropdown.Toggle>

        <Dropdown.Menu className="dropdown-menu-end dropdown-menu-lg py-0">
          <div className="p-3 border-bottom">
            <div className="d-flex align-items-center justify-content-between">
              <h6 className="m-0 fs-16 fw-semibold">Notifications</h6>
              <button 
                className="btn btn-link p-0 text-dark fw-semibold text-decoration-none fs-16" 
                onClick={markAllAsRead}
                disabled={unreadCount === 0}
              >
                Clear All
              </button>
            </div>
          </div>

          <div className="p-1" style={{ maxHeight: '300px', overflowY: 'auto' }}>
            {notifications.length === 0 ? (
              <div className="text-center p-3 text-muted fs-16">
                No new notifications
              </div>
            ) : (
              notifications.map((item) => (
                <div
                  key={item._id}
                  className={clsx(
                    'dropdown-item d-flex align-items-start py-2 border-bottom',
                    { 'bg-light': !item.isRead }
                  )}
                  style={{ whiteSpace: 'normal', cursor: 'pointer' }}
                  onClick={() => markAsRead(item._id)}
                >
                  <div className="flex-shrink-0 me-3 mt-1">
                    {getIconForType(item.type)}
                  </div>
                  <div className="flex-grow-1">
                    <h6 className="mb-1 fs-16">{item.type}</h6>
                    <p className="mb-1 text-muted fs-16">{item.message}</p>
                    <small className="text-muted fs-14">{new Date(item.createdAt).toLocaleString()}</small>
                  </div>
                </div>
              ))
            )}
          </div>
        </Dropdown.Menu>
      </Dropdown>
    </div>
  );
};

export default NotificationDropdownPeople;
