import React from 'react';
import { Card, Badge } from 'react-bootstrap';
import { Line } from 'react-chartjs-2';
import { Chart as ChartJS, CategoryScale, LinearScale, PointElement, LineElement, Tooltip, Legend, Filler } from 'chart.js';
import { useQuery } from '@tanstack/react-query';
import api from '@/utils/api';
import EmptyState from '@/components/common/EmptyState';
import ErrorState from '@/components/common/ErrorState';
import LoadingSkeleton from '@/components/common/LoadingSkeleton';
import { formatCurrency } from '@/utils/format';

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Tooltip, Legend, Filler);

export default function SalesOverviewChart({ period = 'this_month', startDate = '', endDate = '', refreshKey = 0 }) {
  const { data: rowsData, isLoading: loading, error, refetch: loadData } = useQuery({
    queryKey: ['salesChart', period, startDate, endDate, refreshKey],
    queryFn: async () => {
      let url = `/reports/sales-chart?period=${period}`;
      if (period === 'custom' && startDate && endDate) {
        url += `&startDate=${startDate}&endDate=${endDate}`;
      }
      const res = await api.get(url);
      return Array.isArray(res.data) ? res.data : [];
    }
  });

  const rows = rowsData || [];
  const errorMessage = error?.message;

  const totalNet = rows.reduce((sum, item) => sum + (item.netSales || 0), 0);
  const totalRefunds = rows.reduce((sum, item) => sum + (item.refundAmount || 0), 0);

  const data = {
    labels: rows.map((item) => item._id),
    datasets: [
      {
        label: 'Net Sales',
        data: rows.map((item) => item.netSales || 0),
        borderColor: '#3b82f6',
        backgroundColor: 'rgba(59, 130, 246, 0.08)',
        borderWidth: 2.5,
        tension: 0.3,
        pointRadius: rows.length > 30 ? 0 : 3,
        pointHoverRadius: 5,
        fill: true,
      },
      {
        label: 'Refunds',
        data: rows.map((item) => item.refundAmount || 0),
        borderColor: '#ef4444',
        backgroundColor: 'transparent',
        borderWidth: 1.5,
        borderDash: [4, 4],
        tension: 0.3,
        pointRadius: 0,
        pointHoverRadius: 4,
      }
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
          label: (context) => ` ${context.dataset.label}: ${formatCurrency(context.raw || 0)}`
        }
      }
    },
    scales: {
      y: {
        beginAtZero: true,
        ticks: {
          callback: (value) => `₹${value >= 1000 ? (value / 1000).toFixed(0) + 'k' : value}`
        },
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
            <h5 className="fw-bold mb-0">Sales & Revenue Trend</h5>
            <small className="text-muted">Net sales performance deducting refunds</small>
          </div>
          <div className="d-flex align-items-center gap-2">
            <Badge bg="primary-subtle" className="text-primary border border-primary-subtle px-2 py-1">
              Net: {formatCurrency(totalNet)}
            </Badge>
            {totalRefunds > 0 && (
              <Badge bg="danger-subtle" className="text-danger border border-danger-subtle px-2 py-1">
                Refunds: {formatCurrency(totalRefunds)}
              </Badge>
            )}
          </div>
        </div>

        {loading ? (
          <LoadingSkeleton rows={5} columns={4} />
        ) : error ? (
          <ErrorState message={errorMessage} onRetry={loadData} />
        ) : rows.length === 0 ? (
          <EmptyState icon="lucide:line-chart" title="No revenue recorded" message="Revenue trend will appear once paid orders are completed in this period." />
        ) : (
          <div style={{ height: 280 }}>
            <Line data={data} options={options} />
          </div>
        )}
      </Card.Body>
    </Card>
  );
}
