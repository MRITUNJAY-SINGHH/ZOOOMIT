import React from 'react';
import { Card, Badge } from 'react-bootstrap';
import { Bar } from 'react-chartjs-2';
import { Chart as ChartJS, CategoryScale, LinearScale, BarElement, Tooltip, Legend } from 'chart.js';
import { useQuery } from '@tanstack/react-query';
import api from '@/utils/api';
import EmptyState from '@/components/common/EmptyState';
import ErrorState from '@/components/common/ErrorState';
import LoadingSkeleton from '@/components/common/LoadingSkeleton';

ChartJS.register(CategoryScale, LinearScale, BarElement, Tooltip, Legend);

export default function OrdersOverviewChart({ period = 'this_month', startDate = '', endDate = '', refreshKey = 0 }) {
  const { data: rowsData, isLoading: loading, error, refetch: loadData } = useQuery({
    queryKey: ['ordersChart', period, startDate, endDate, refreshKey],
    queryFn: async () => {
      let url = `/reports/orders-chart?period=${period}`;
      if (period === 'custom' && startDate && endDate) {
        url += `&startDate=${startDate}&endDate=${endDate}`;
      }
      const res = await api.get(url);
      return Array.isArray(res.data) ? res.data : [];
    }
  });

  const chartRows = rowsData || [];
  const errorMessage = error?.message;

  const totalOnline = chartRows.reduce((sum, r) => sum + (r.online || 0), 0);
  const totalOffline = chartRows.reduce((sum, r) => sum + (r.offline || 0), 0);
  const totalOrders = totalOnline + totalOffline;

  const data = {
    labels: chartRows.map((row) => row._id),
    datasets: [
      {
        label: 'Online App/Web',
        data: chartRows.map((row) => row.online || 0),
        backgroundColor: '#3b82f6',
        borderRadius: 4,
        barPercentage: 0.6,
      },
      {
        label: 'In-Store POS',
        data: chartRows.map((row) => row.offline || 0),
        backgroundColor: '#10b981',
        borderRadius: 4,
        barPercentage: 0.6,
      },
    ],
  };

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'top',
        align: 'end',
        labels: {
          boxWidth: 12,
          usePointStyle: true,
          pointStyle: 'circle',
          font: { size: 12, weight: '500' }
        }
      },
      tooltip: {
        callbacks: {
          afterBody: (items) => {
            const index = items[0]?.dataIndex;
            const total = chartRows[index]?.total || 0;
            return `Total Daily Orders: ${total}`;
          }
        }
      }
    },
    scales: {
      y: {
        beginAtZero: true,
        ticks: { stepSize: 1, precision: 0 },
        grid: { color: 'rgba(150, 150, 150, 0.1)' }
      },
      x: {
        grid: { display: false }
      }
    }
  };

  return (
    <Card className="h-100 shadow-sm border">
      <Card.Body>
        <div className="d-flex justify-content-between align-items-center mb-3">
          <div>
            <h5 className="fw-bold mb-0">Orders Channel Breakdown</h5>
            <small className="text-muted">Online orders vs In-store POS billing volume</small>
          </div>
          <div className="d-flex align-items-center gap-2">
            <Badge bg="info-subtle" className="text-info border border-info-subtle px-2 py-1">
              Online: {totalOnline}
            </Badge>
            <Badge bg="success-subtle" className="text-success border border-success-subtle px-2 py-1">
              POS: {totalOffline}
            </Badge>
            <Badge bg="secondary-subtle" className="text-secondary border border-secondary-subtle px-2 py-1">
              Total: {totalOrders}
            </Badge>
          </div>
        </div>

        {loading ? (
          <LoadingSkeleton rows={5} columns={4} />
        ) : error ? (
          <ErrorState message={errorMessage} onRetry={loadData} />
        ) : chartRows.length === 0 ? (
          <EmptyState icon="lucide:shopping-bag" title="No order data" message="Order trends will appear when orders are created in this period." />
        ) : (
          <div style={{ height: 280 }}>
            <Bar data={data} options={options} />
          </div>
        )}
      </Card.Body>
    </Card>
  );
}
