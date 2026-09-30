import React, { ReactNode } from 'react';
import './KpiCard.css';

interface KpiCardProps {
  value: string | number;
  label: string;
  subtext?: string;
  variant?: 'primary' | 'accent' | 'success' | 'warn' | 'danger';
  icon?: ReactNode;
  trend?: string;
}

export const KpiCard: React.FC<KpiCardProps> = ({ value, label, subtext, variant = 'primary', icon }) => {
  return (
    <div className={`card kpi ${variant}`}>
      <div className="row" style={{ justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '8px' }}>
        <div className="l">{label}</div>
        {icon && <div style={{ color: `var(--${variant === 'warn' ? 'warning' : variant})`, opacity: 0.85 }}>{icon}</div>}
      </div>
      <div className="v">{value}</div>
      {subtext && <div className="s">{subtext}</div>}
    </div>
  );
};

export default KpiCard;
