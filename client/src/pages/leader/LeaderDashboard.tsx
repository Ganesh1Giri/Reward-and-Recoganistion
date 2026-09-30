import React from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import { useData } from '../../hooks/useData';
import { Award } from '../../types';
import KpiCard from '../../components/common/KpiCard';
import Badge from '../../components/common/Badge';
import DataTable, { Column } from '../../components/common/DataTable';
import PureBarChart from '../../components/common/PureBarChart';
import { UserPlus, Send, CheckCircle2, TrendingUp, Users } from 'lucide-react';
import vctLogo from '../../assets/vct.png';
import './LeaderDashboard.css';

const TIER_COLORS: Record<string, string> = {
  Beacon: '#8fbc5a',
  Bronze: '#cd7f32',
  Silver: '#8e9aa8',
  Gold: '#d4a017',
  Diamond: '#5fb8d8',
};

export const LeaderDashboard: React.FC = () => {
  const { user } = useAuth();
  const { data, getUserName, getAwardTypeName, getLeaderInventory, getRupeeRate } = useData();

  if (!user) return null;

  const currentYear = new Date().getFullYear();
  const currentMonth = new Date().getMonth();

  // Inventory per active award type
  const activeTypes = data.award_types.filter((t) => t.is_active);
  const inventoryItems = activeTypes.map((t) => {
    const inv = getLeaderInventory(user.id, t.id, currentYear) || {
      allocated: 0,
      used: 0,
      remaining: 0,
    };
    return { type: t, inventory: inv };
  });

  const totalAllocated = inventoryItems.reduce((acc, i) => acc + Number(i.inventory.allocated), 0);
  const totalUsed = inventoryItems.reduce((acc, i) => acc + Number(i.inventory.used), 0);

  const awardsGiven = data.awards.filter((a) => a.given_by === user.id);
  const issuedAwards = awardsGiven.filter((a) => a.status === 'ISSUED');

  const mtdAwards = issuedAwards.filter((a) => {
    if (!a.issued_at) return false;
    const d = new Date(a.issued_at);
    return d.getFullYear() === currentYear && d.getMonth() === currentMonth;
  });

  const ytdAwards = issuedAwards.filter((a) => {
    if (!a.issued_at) return false;
    const d = new Date(a.issued_at);
    return d.getFullYear() === currentYear;
  });

  const uniquePeopleRecognized = new Set(ytdAwards.map((a) => a.recipient_id)).size;
  const totalPointsDistributed = issuedAwards.reduce((acc, a) => acc + Number(a.points), 0);
  const totalRupeeValue = (totalPointsDistributed * getRupeeRate()).toLocaleString('en-IN');

  const pendingApprovalsCount = awardsGiven.filter((a) => a.status === 'PENDING_APPROVAL').length;

  // Monthly counts for bar chart
  const monthlyCounts = new Array(12).fill(0);
  for (const a of issuedAwards) {
    if (a.issued_at) {
      const d = new Date(a.issued_at);
      if (d.getFullYear() === currentYear) {
        monthlyCounts[d.getMonth()]++;
      }
    }
  }

  // Top recipients this year
  const recipientMap: Record<string, { id: string; count: number; points: number }> = {};
  for (const a of ytdAwards) {
    if (!recipientMap[a.recipient_id]) {
      recipientMap[a.recipient_id] = { id: a.recipient_id, count: 0, points: 0 };
    }
    recipientMap[a.recipient_id].count++;
    recipientMap[a.recipient_id].points += Number(a.points);
  }
  const topRecipients = Object.values(recipientMap)
    .sort((a, b) => b.points - a.points || b.count - a.count)
    .slice(0, 5);

  const recentAwards = [...awardsGiven]
    .sort((a, b) => b.created_at.localeCompare(a.created_at))
    .slice(0, 6);

  const columns: Column<Award>[] = [
    {
      header: 'Date',
      render: (r) => (
        <span>
          {r.issued_at
            ? new Date(r.issued_at).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })
            : new Date(r.created_at).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}
        </span>
      ),
    },
    {
      header: 'Recipient',
      render: (r) => <strong>{getUserName(r.recipient_id)}</strong>,
    },
    {
      header: 'Award',
      render: (r) => {
        const name = getAwardTypeName(r.award_type_id);
        const col = TIER_COLORS[name] || 'var(--primary)';
        return (
          <span className="chip">
            <i className="dot" style={{ backgroundColor: col }} />
            {name}
          </span>
        );
      },
    },
    {
      header: 'Points',
      numeric: true,
      render: (r) => <strong>{r.points}</strong>,
    },
    {
      header: 'Reason',
      render: (r) => <span style={{ fontSize: '0.86rem' }}>{r.reason}</span>,
    },
    {
      header: 'Status',
      render: (r) => <Badge status={r.status} />,
    },
  ];

  return (
    <div>
      {/* Dashboard Brand Header */}
      <div className="dashboard-brand-header">
        <div className="dashboard-brand-left">
          <img src={vctLogo} alt="VCreaTek" className="dashboard-brand-logo" />
          <div>
            <h1 className="dashboard-brand-title">Rewards &amp; Recognition</h1>
            <p className="dashboard-brand-sub">Manager Dashboard &bull; Quota Allocation &amp; Team Recognitions</p>
          </div>
        </div>
      </div>

      {/* 5 Category Quota Cards */}
      <div className="grid g5 section">
        {inventoryItems.map(({ type, inventory }) => {
          const col = TIER_COLORS[type.name] || 'var(--primary)';
          const percentUsed = inventory.allocated > 0 ? Math.round((inventory.used / inventory.allocated) * 100) : 0;

          return (
            <div key={type.id} className="card kpi" style={{ borderTop: `4px solid ${col}` }}>
              <div className="row" style={{ justifyContent: 'space-between', alignItems: 'center' }}>
                <strong style={{ fontSize: '1rem', color: 'var(--t1)' }}>{type.name}</strong>
                <span className="small muted">{type.points} pts</span>
              </div>

              <div className="v" style={{ marginTop: '8px' }}>
                {inventory.remaining}
              </div>
              <div className="l">remaining of {inventory.allocated}</div>

              <div className="bar" style={{ marginTop: '10px' }}>
                <i style={{ width: `${percentUsed}%`, backgroundColor: col }} />
              </div>
            </div>
          );
        })}
      </div>

      {/* 4 Performance Metrics */}
      <div className="grid g4 section">
        <KpiCard
          value={mtdAwards.length}
          label="Awards this Month (MTD)"
          subtext="Recognition frequency for current cycle"
          variant="primary"
          icon={<TrendingUp size={22} />}
        />
        <KpiCard
          value={ytdAwards.length}
          label="Awards this Year (YTD)"
          subtext={`${totalAllocated > 0 ? Math.round((totalUsed / totalAllocated) * 100) : 0}% of annual quota utilised`}
          variant="accent"
          icon={<CheckCircle2 size={22} />}
        />
        <KpiCard
          value={uniquePeopleRecognized}
          label="Team Members Recognised"
          subtext="Unique contributors acknowledged"
          variant="success"
          icon={<Users size={22} />}
        />
        <KpiCard
          value={totalPointsDistributed.toLocaleString('en-IN')}
          label="Points Distributed"
          subtext={`Rs ${totalRupeeValue} in business value reward`}
          variant="warn"
        />
      </div>

      {/* Quick Action Navigation */}
      <div className="row section">
        <Link to="/leader/award" className="btn btn-accent">
          <UserPlus size={16} /> Award Employees
        </Link>
        <Link to="/leader/awards" className="btn btn-secondary">
          <Send size={16} /> View Awards Given Ledger
        </Link>
        {pendingApprovalsCount > 0 && (
          <Link to="/approvals" className="btn btn-secondary" style={{ borderColor: 'var(--warning)' }}>
            <span className="badge b-warning">{pendingApprovalsCount} Nominations Pending Approval</span>
          </Link>
        )}
      </div>

      {/* Charts & Top Recipients */}
      <div className="grid g2 section">
        <div className="card">
          <h3>My Awards Issued per Month ({currentYear})</h3>
          <p className="muted small" style={{ marginBottom: '12px' }}>Monthly recognition distribution</p>
          <PureBarChart counts={monthlyCounts} color="var(--primary)" activeColor="var(--accent)" height={210} />
        </div>

        <div className="card">
          <h3>Top Recognised Contributors ({currentYear})</h3>
          <p className="muted small" style={{ marginBottom: '14px' }}>Most acknowledged team members</p>

          <div>
            {topRecipients.length > 0 ? (
              topRecipients.map((recip, index) => {
                const u = data.users.find((x) => x.id === recip.id);
                return (
                  <div key={recip.id} className="rank-item">
                    <div>
                      <span className="muted small" style={{ marginRight: '8px', fontWeight: 700 }}>
                        {index + 1}.
                      </span>
                      <strong>{u?.full_name || 'Employee'}</strong>
                      <span className="muted small" style={{ marginLeft: '8px' }}>
                        {u?.department} &bull; {u?.vcreatek_id}
                      </span>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                      <span className="small">
                        {recip.count} {recip.count === 1 ? 'award' : 'awards'} &bull;{' '}
                      </span>
                      <strong style={{ color: 'var(--primary)' }}>{recip.points} pts</strong>
                    </div>
                  </div>
                );
              })
            ) : (
              <p className="muted">No awards granted yet this year.</p>
            )}
          </div>
        </div>
      </div>

      {/* Recent Awards Ledger */}
      <div className="card">
        <h3>Recent Awards Given</h3>
        <div style={{ marginTop: '14px' }}>
          <DataTable
            columns={columns}
            data={recentAwards}
            emptyMessage="You have not given any awards yet."
          />
        </div>
      </div>
    </div>
  );
};

export default LeaderDashboard;
