import React from 'react';
import { useAuth } from '../../hooks/useAuth';
import { useData } from '../../hooks/useData';
import DataTable, { Column } from '../../components/common/DataTable';
import Badge from '../../components/common/Badge';
import './MyPoints.css';

export const MyPoints: React.FC = () => {
  const { user } = useAuth();
  const { data, getUserBalance } = useData();

  if (!user) return null;

  const currentBalance = getUserBalance(user.id);
  const rows = data.point_transactions
    .filter((t) => t.user_id === user.id)
    .sort((a, b) => b.created_at.localeCompare(a.created_at));

  // Compute running balance after each transaction
  let running = currentBalance;
  const transactionsWithBalance = rows.map((r) => {
    const item = { ...r, balanceAfter: running };
    running -= Number(r.points);
    return item;
  });

  const columns: Column<typeof transactionsWithBalance[0]>[] = [
    {
      header: 'Date & Time',
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
      header: 'Transaction Type',
      render: (r) => {
        const variantMap: Record<string, 'success' | 'warning' | 'danger' | 'info'> = {
          AWARD: 'success',
          REDEEM: 'warning',
          REVERSAL: 'danger',
          ADJUSTMENT: 'info',
        };
        return <Badge status={r.type} variant={variantMap[r.type] || 'info'} />;
      },
    },
    {
      header: 'Description',
      render: (r) => r.description,
    },
    {
      header: 'Points',
      numeric: true,
      render: (r) => {
        const pts = Number(r.points);
        const isPos = pts > 0;
        return (
          <strong style={{ color: isPos ? '#047857' : '#b91c1c' }}>
            {isPos ? `+${pts}` : pts}
          </strong>
        );
      },
    },
    {
      header: 'Balance After',
      numeric: true,
      render: (r) => <strong>{r.balanceAfter}</strong>,
    },
  ];

  return (
    <div className="card">
      <div className="row" style={{ justifyContent: 'space-between', alignItems: 'center', marginBottom: '18px' }}>
        <div>
          <h3>Points Transaction Ledger</h3>
          <p className="muted small">Complete historical statement of credits and debits</p>
        </div>
        <div style={{ textAlign: 'right' }}>
          <span className="muted small">Current Balance:</span>
          <div style={{ fontSize: '1.5rem', fontWeight: 700, color: 'var(--primary)' }}>
            {currentBalance.toLocaleString('en-IN')} points
          </div>
        </div>
      </div>

      <DataTable
        columns={columns}
        data={transactionsWithBalance}
        emptyMessage="No point transactions recorded yet."
      />
    </div>
  );
};

export default MyPoints;
