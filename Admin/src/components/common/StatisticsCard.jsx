import React from 'react';
import { Card } from 'react-bootstrap';
import { TrendingDown, TrendingUp } from 'lucide-react';

export default function StatisticsCard({ 
  icon: Icon, 
  title, 
  value, 
  helper, 
  subtitle, 
  trend, 
  variant = 'primary', 
  onClick 
}) {
  const hasTrend = typeof trend === 'number';
  const bottomText = subtitle || helper;

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
        {(bottomText || hasTrend) && (
          <div className="Zooom-stat-footer mt-3">
            {hasTrend && (
              <span className={trend >= 0 ? 'text-success me-2' : 'text-danger me-2'}>
                {trend >= 0 ? <TrendingUp size={16} className="me-1" /> : <TrendingDown size={16} className="me-1" />}
                {Math.abs(trend)}%
              </span>
            )}
            {bottomText && <span className="text-muted">{bottomText}</span>}
          </div>
        )}
      </Card.Body>
    </Card>
  );
}
