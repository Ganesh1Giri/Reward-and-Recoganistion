import React from 'react';
import './Badge.css';

interface BadgeProps {
  status: string;
  label?: string;
  variant?: 'success' | 'warning' | 'danger' | 'info' | 'muted';
}

export const Badge: React.FC<BadgeProps> = ({ status, label, variant }) => {
  const getBadgeClass = (st: string) => {
    if (variant) return `b-${variant}`;
    const map: Record<string, string> = {
      ISSUED: 'b-success',
      FULFILLED: 'b-success',
      APPROVED: 'b-info',
      DONE: 'b-success',
      SENT: 'b-success',
      READY: 'b-success',
      PENDING_APPROVAL: 'b-warning',
      REQUESTED: 'b-warning',
      UNDER_REVIEW: 'b-warning',
      PENDING: 'b-warning',
      QUEUED: 'b-warning',
      REJECTED: 'b-danger',
      REVOKED: 'b-danger',
      FAILED: 'b-danger',
      CANCELLED: 'b-muted',
    };
    return map[st] || 'b-muted';
  };

  const displayText = label || status.replace(/_/g, ' ');

  return (
    <span className={`badge ${getBadgeClass(status)}`}>
      {displayText}
    </span>
  );
};

export default Badge;
