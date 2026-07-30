import React from 'react';
import { Card } from 'react-bootstrap';
import { Line } from 'react-chartjs-2';
import { Chart as ChartJS, CategoryScale, LinearScale, PointElement, LineElement, Tooltip, Legend } from 'chart.js';
import api from '@/utils/api';
import EmptyState from '@/components/common/EmptyState';
import ErrorState from '@/components/common/ErrorState';
import LoadingSkeleton from '@/components/common/LoadingSkeleton';

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Tooltip, Legend);
import { useQuery } from '@tanstack/react-query';

export default function SalesOverviewChart() {
  const { data: rowsData, isLoading: loading, error, refetch: loadData } = useQuery({
    queryKey: ['salesChart'],
    queryFn: async () => {
      const res = await api.get('/reports/sales-chart');
      return Array.isArray(res.data) ? res.data : [];
    }
  });

  const rows = rowsData || [];
  const errorMessage = error?.message;

  const data = {
    labels: rows.map((item) => item._id),
    datasets: [{
      label: 'Revenue',
      data: rows.map((item) => item.sales || 0),
      borderColor: 'rgb(59, 130, 246)',
      backgroundColor: 'rgba(59, 130, 246, .08)',
      borderWidth: 2,
      tension: .35,
      pointRadius: 3,
    }],
  };

  return (
    <Card className="h-100">
      <Card.Body>
        <h2 className="Zooom-section-title mb-3">Revenue Trend</h2>
        {loading ? <LoadingSkeleton rows={5} columns={4} /> : error ? <ErrorState message={errorMessage} onRetry={loadData} /> : rows.length === 0 ? (
          <EmptyState icon="lucide:line-chart" title="No revenue data" message="Revenue trend will appear after paid orders are available." />
        ) : (
          <div style={{ height: 280 }}>
            <Line data={data} options={{ responsive: true, maintainAspectRatio: false, plugins: { legend: { display: false } }, scales: { y: { beginAtZero: true }, x: { grid: { display: false } } } }} />
          </div>
        )}
      </Card.Body>
    </Card>
  );
}
