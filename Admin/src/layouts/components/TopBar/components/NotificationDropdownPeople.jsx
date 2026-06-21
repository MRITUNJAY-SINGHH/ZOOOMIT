import { Dropdown } from 'react-bootstrap';
import { Icon } from '@iconify/react';
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
    fetchNotifications(); // Fetch on mount

    const interval = setInterval(() => {
      fetchNotifications();
    }, 60000); // 60 seconds polling

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
    switch (type) {
      case 'Low Stock': return <Icon icon="lucide:alert-triangle" className="text-warning" />;
      case 'Expiring Product': return <Icon icon="lucide:clock" className="text-danger" />;
      case 'New Order': return <Icon icon="lucide:shopping-bag" className="text-success" />;
      case 'Cancelled Order': return <Icon icon="lucide:x-circle" className="text-danger" />;
      case 'Returned Order': return <Icon icon="lucide:rotate-ccw" className="text-info" />;
      case 'Refund Failure': return <Icon icon="lucide:alert-octagon" className="text-danger" />;
      default: return <Icon icon="lucide:bell" className="text-primary" />;
    }
  };

  return (
    <Dropdown>
      <Dropdown.Toggle
        as="a"
        className="nav-link dropdown-toggle arrow-none"
        role="button"
        data-bs-toggle="dropdown"
        aria-haspopup="true"
        aria-expanded="false"
      >
        <Icon icon="lucide:bell" />
        {unreadCount > 0 && (
          <span className="position-absolute top-0 start-100 translate-middle badge rounded-pill bg-danger">
            {unreadCount > 99 ? '99+' : unreadCount}
          </span>
        )}
      </Dropdown.Toggle>

      <Dropdown.Menu className="dropdown-menu-end dropdown-menu-lg py-0">
        <div className="p-2 border-top-0 border-start-0 border-end-0 border-dashed border">
          <div className="row align-items-center">
            <div className="col">
              <h6 className="m-0 fs-16 fw-semibold">Notifications</h6>
            </div>
            <div className="col-auto">
              <button 
                className="btn btn-link p-0 text-dark fw-semibold text-decoration-none" 
                onClick={markAllAsRead}
                disabled={unreadCount === 0}
              >
                Clear All
              </button>
            </div>
          </div>
        </div>

        <div className="p-1" style={{ maxHeight: '300px', overflowY: 'auto' }}>
          {notifications.length === 0 ? (
            <div className="text-center p-3 text-muted">
              No new notifications
            </div>
          ) : (
            notifications.map((item) => (
              <div
                key={item._id}
                className={clsx(
                  'dropdown-item d-flex align-items-center py-2 border-bottom',
                  { 'bg-light': !item.isRead }
                )}
                style={{ whiteSpace: 'normal', cursor: 'pointer' }}
                onClick={() => markAsRead(item._id)}
              >
                <div className="flex-shrink-0 me-3">
                  <div className="avatar-sm">
                    <span className="avatar-title bg-soft-primary rounded-circle fs-20">
                      {getIconForType(item.type)}
                    </span>
                  </div>
                </div>
                <div className="flex-grow-1">
                  <h6 className="mb-1">{item.type}</h6>
                  <p className="mb-0 text-muted fs-13">{item.message}</p>
                  <small className="text-muted">{new Date(item.createdAt).toLocaleString()}</small>
                </div>
              </div>
            ))
          )}
        </div>
      </Dropdown.Menu>
    </Dropdown>
  );
};

export default NotificationDropdownPeople;
