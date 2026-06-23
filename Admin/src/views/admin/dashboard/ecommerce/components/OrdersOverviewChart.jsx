import React, { useEffect, useMemo, useState } from 'react';
import { Card } from 'react-bootstrap';
import { Bar } from 'react-chartjs-2';
import { Chart as ChartJS, CategoryScale, LinearScale, BarElement, Tooltip, Legend } from 'chart.js';
import api from '@/utils/api';
import EmptyState from '@/components/common/EmptyState';
import ErrorState from '@/components/common/ErrorState';
import LoadingSkeleton from '@/components/common/LoadingSkeleton';

ChartJS.register(CategoryScale, LinearScale, BarElement, Tooltip, Legend);

export default function OrdersOverviewChart() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const loadData = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await api.get('/orders?page=1&limit=100');
      setOrders(res.data?.data || []);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadData(); }, []);

  const chartRows = useMemo(() => {
    const grouped = {};
    orders.forEach((order) => {
      const key = new Date(order.createdAt).toLocaleDateString('en-IN', { day: '2-digit', month: 'short' });
      grouped[key] ||= { online: 0, offline: 0 };
      if (order.orderType === 'ONLINE') grouped[key].online += 1;
      if (order.orderType === 'OFFLINE') grouped[key].offline += 1;
    });
    return Object.entries(grouped).slice(-7);
  }, [orders]);

  const data = {
    labels: chartRows.map(([label]) => label),
    datasets: [
      { label: 'Online', data: chartRows.map(([, value]) => value.online), backgroundColor: 'rgb(59, 130, 246)', borderRadius: 4 },
      { label: 'Offline', data: chartRows.map(([, value]) => value.offline), backgroundColor: 'rgb(16, 185, 129)', borderRadius: 4 },
    ],
  };

  return (
    <Card className="h-100">
      <Card.Body>
        <h2 className="kuiklo-section-title mb-3">Orders Overview</h2>
        {loading ? <LoadingSkeleton rows={5} columns={4} /> : error ? <ErrorState message={error} onRetry={loadData} /> : chartRows.length === 0 ? (
          <EmptyState icon="lucide:shopping-bag" title="No order data" message="Order trends will appear when orders are created." />
        ) : (
          <div style={{ height: 280 }}>
            <Bar data={data} options={{ responsive: true, maintainAspectRatio: false, scales: { y: { beginAtZero: true }, x: { grid: { display: false } } } }} />
          </div>
        )}
      </Card.Body>
    </Card>
  );
}
