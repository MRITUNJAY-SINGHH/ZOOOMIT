import React from 'react';
import { Card } from 'react-bootstrap';
import { TrendingDown, TrendingUp } from 'lucide-react';

export default function StatisticsCard({ icon: Icon, title, value, helper, trend, variant = 'primary', onClick }) {
  const hasTrend = typeof trend === 'number';

  return (
    <Card 
      className={`Zooom-stat-card h-100 ${onClick ? 'cursor-pointer' : ''}`} 
      onClick={onClick}
      style={onClick ? { cursor: 'pointer' } : {}}
    >
      <Card.Body>
        <div className="d-flex justify-content-between align-items-start gap-3">
          <div>
            <p className="text-muted mb-1">{title}</p>
            <h2 className="mb-0">{value ?? '-'}</h2>
          </div>
          {Icon && (
            <div className={`Zooom-stat-icon text-${variant} bg-${variant}-subtle`}>
              <Icon size={20} />
            </div>
          )}
        </div>
        {(helper || hasTrend) && (
          <div className="Zooom-stat-footer mt-3">
            {hasTrend && (
              <span className={trend >= 0 ? 'text-success' : 'text-danger'}>
                {trend >= 0 ? <TrendingUp size={20} /> : <TrendingDown size={20} />}
                {Math.abs(trend)}%
              </span>
            )}
            {helper && <span className="text-muted">{helper}</span>}
          </div>
        )}
      </Card.Body>
    </Card>
  );
}
