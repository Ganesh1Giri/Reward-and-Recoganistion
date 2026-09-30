import React from 'react';
import { useAuth } from '../../hooks/useAuth';
import { useData } from '../../hooks/useData';
import { RedemptionRequest } from '../../types';
import DataTable, { Column } from '../../components/common/DataTable';
import Badge from '../../components/common/Badge';
import './RedemptionHistory.css';

export const RedemptionHistory: React.FC = () => {
  const { user } = useAuth();
  const { data } = useData();

  if (!user) return null;

  const myRequests = data.redemption_requests
    .filter((r) => r.user_id === user.id)
    .sort((a, b) => b.created_at.localeCompare(a.created_at));

  const columns: Column<RedemptionRequest>[] = [
    {
      header: 'Requested Date',
      render: (r) => (
        <span>
          {new Date(r.created_at).toLocaleString('en-IN', {
            day: '2-digit',
            month: 'short',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
          })}
        </span>
      ),
    },
    {
      header: 'Points',
      numeric: true,
      render: (r) => <strong>{r.points}</strong>,
    },
    {
      header: 'Value (Rs)',
      numeric: true,
      render: (r) => <strong>Rs {Number(r.value_rs).toLocaleString('en-IN')}</strong>,
    },
    {
      header: 'Status',
      render: (r) => <Badge status={r.status} />,
    },
    {
      header: 'Voucher Details',
      render: (r) => {
        if (r.voucher_reference) {
          return (
            <div>
              <span style={{ fontWeight: 600, color: 'var(--primary)' }}>
                {r.voucher_provider || 'E-Voucher'}: {r.voucher_reference}
              </span>
              {r.voucher_amount && (
                <div className="small muted">Amount: Rs {r.voucher_amount.toLocaleString('en-IN')}</div>
              )}
            </div>
          );
        }
        return <span className="muted small">Pending fulfillment</span>;
      },
    },
    {
      header: 'HR Remarks',
      render: (r) => <span style={{ fontSize: '0.86rem' }}>{r.remarks || '—'}</span>,
    },
  ];

  return (
    <div className="card">
      <div className="row" style={{ justifyContent: 'space-between', alignItems: 'center', marginBottom: '18px' }}>
        <div>
          <h3>Redemption Requests &amp; Voucher Status</h3>
          <p className="muted small">Track processing stages and retrieve issued voucher codes</p>
        </div>
      </div>

      <DataTable
        columns={columns}
        data={myRequests}
        emptyMessage="You have not submitted any redemption requests yet."
      />
    </div>
  );
};

export default RedemptionHistory;
