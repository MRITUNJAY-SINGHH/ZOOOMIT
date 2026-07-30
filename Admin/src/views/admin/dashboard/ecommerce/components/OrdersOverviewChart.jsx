import React, { useMemo } from 'react';
import { Card } from 'react-bootstrap';
import { Bar } from 'react-chartjs-2';
import { Chart as ChartJS, CategoryScale, LinearScale, BarElement, Tooltip, Legend } from 'chart.js';
import api from '@/utils/api';
import EmptyState from '@/components/common/EmptyState';
import ErrorState from '@/components/common/ErrorState';
import LoadingSkeleton from '@/components/common/LoadingSkeleton';

ChartJS.register(CategoryScale, LinearScale, BarElement, Tooltip, Legend);
import { useQuery } from '@tanstack/react-query';

export default function OrdersOverviewChart() {
  const { data: rowsData, isLoading: loading, error, refetch: loadData } = useQuery({
    queryKey: ['ordersChart'],
    queryFn: async () => {
      const res = await api.get('/reports/orders-chart');
      return Array.isArray(res.data) ? res.data : [];
    }
  });

  const chartRows = rowsData || [];
  const errorMessage = error?.message;

  const data = {
    labels: chartRows.map((row) => row._id),
    datasets: [
      { label: 'Online', data: chartRows.map((row) => row.online), backgroundColor: 'rgb(59, 130, 246)', borderRadius: 4 },
      { label: 'Offline', data: chartRows.map((row) => row.offline), backgroundColor: 'rgb(16, 185, 129)', borderRadius: 4 },
    ],
  };

  return (
    <Card className="h-100">
      <Card.Body>
        <h2 className="Zooom-section-title mb-3">Orders Overview</h2>
        {loading ? <LoadingSkeleton rows={5} columns={4} /> : error ? <ErrorState message={errorMessage} onRetry={loadData} /> : chartRows.length === 0 ? (
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
