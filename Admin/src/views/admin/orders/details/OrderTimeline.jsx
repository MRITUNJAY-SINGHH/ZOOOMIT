import React, { useState, useEffect } from 'react';
import { Card, Badge } from 'react-bootstrap';
import { fetchApi } from '@/utils/api';

export default function OrderTimeline({ orderId }) {
  const [activities, setActivities] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (orderId) loadTimeline();
  }, [orderId]);

  const loadTimeline = async () => {
    try {
      const data = await fetchApi(`/orders/${orderId}/timeline`);
      setActivities(data);
    } catch (e) { console.error(e); }
    setLoading(false);
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'Order Created': return 'primary';
      case 'Confirmed': return 'info';
      case 'Assigned To Rider': return 'warning';
      case 'Out For Delivery': return 'warning';
      case 'Delivered': return 'success';
      case 'Cancelled': return 'danger';
      case 'Returned': return 'danger';
      default: return 'secondary';
    }
  };

  if (loading) return <p>Loading timeline...</p>;

  return (
    <Card>
      <Card.Header><h5>Order Timeline</h5></Card.Header>
      <Card.Body>
        <div className="timeline" style={{ position: 'relative', borderLeft: '2px solid #e9ecef', paddingLeft: '20px' }}>
          {activities.map((act, index) => (
            <div key={act._id} className="timeline-item mb-4" style={{ position: 'relative' }}>
              <div 
                className={`bg-${getStatusColor(act.status)} rounded-circle`} 
                style={{ position: 'absolute', left: '-26px', top: '4px', width: '10px', height: '10px' }}
              ></div>
              <div className="d-flex justify-content-between">
                <strong><Badge bg={getStatusColor(act.status)}>{act.status}</Badge></strong>
                <small className="text-muted">{new Date(act.timestamp).toLocaleString()}</small>
              </div>
              <p className="mb-0 mt-1">
                {act.note && <span>{act.note}</span>}
              </p>
              <small className="text-muted">
                By: {act.system ? 'System' : (act.user?.name || 'Customer')}
              </small>
            </div>
          ))}
          {activities.length === 0 && <p>No activities recorded.</p>}
        </div>
      </Card.Body>
    </Card>
  );
}
