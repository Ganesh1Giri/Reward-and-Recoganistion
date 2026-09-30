import React from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import { useData } from '../../hooks/useData';
import { User } from '../../types';
import KpiCard from '../../components/common/KpiCard';
import Badge from '../../components/common/Badge';
import DataTable, { Column } from '../../components/common/DataTable';
import PureBarChart from '../../components/common/PureBarChart';
import {
  TrendingUp,
  Award,
  Wallet,
  Users,
  Clock,
  Gift,
  AlertTriangle,
} from 'lucide-react';
import vctLogo from '../../assets/vct.png';
import './HrDashboard.css';

const TIER_COLORS: Record<string, string> = {
  Beacon: '#8fbc5a',
  Bronze: '#cd7f32',
  Silver: '#8e9aa8',
  Gold: '#d4a017',
  Diamond: '#5fb8d8',
};

export const HrDashboard: React.FC = () => {
  const { user } = useAuth();
  const { data, getUserName, getAwardTypeName, checkEligibility } = useData();

  if (!user) return null;

  const currentYear = new Date().getFullYear();
  const currentMonth = new Date().getMonth();

  const leaders = data.users.filter((u) => u.role === 'LEADER' && u.is_active);
  const invs = data.leader_inventory.filter((i) => Number(i.year) === currentYear);

  const totalAllocated = invs.reduce((acc, i) => acc + Number(i.allocated), 0);
  const totalUsed = invs.reduce((acc, i) => acc + Number(i.used), 0);

  const allIssuedAwards = data.awards.filter((a) => a.status === 'ISSUED');
  const ytdAwards = allIssuedAwards.filter((a) => a.issued_at && new Date(a.issued_at).getFullYear() === currentYear);
  const mtdAwards = allIssuedAwards.filter((a) => {
    if (!a.issued_at) return false;
    const d = new Date(a.issued_at);
    return d.getFullYear() === currentYear && d.getMonth() === currentMonth;
  });

  const totalPointsIssued = ytdAwards.reduce((acc, a) => acc + Number(a.points), 0);
  const totalPointsAllocated = invs.reduce((acc, i) => {
    const at = data.award_types.find((t) => t.id === i.award_type_id);
    return acc + Number(i.allocated) * (at ? Number(at.points) : 0);
  }, 0);

  const pendingAwards = data.awards.filter((a) => a.status === 'PENDING_APPROVAL');
  const pendingRedemptions = data.redemption_requests.filter((r) =>
    ['REQUESTED', 'UNDER_REVIEW', 'APPROVED'].includes(r.status)
  );
  const pendingRedemptionValue = pendingRedemptions.reduce((acc, r) => acc + Number(r.value_rs), 0);

  // Breakdown by award category
  const activeTypes = data.award_types.filter((t) => t.is_active);
  const categoryStats = activeTypes.map((t) => {
    const tInvs = invs.filter((i) => i.award_type_id === t.id);
    const allocated = tInvs.reduce((acc, i) => acc + Number(i.allocated), 0);
    const used = tInvs.reduce((acc, i) => acc + Number(i.used), 0);
    const issuedCount = ytdAwards.filter((a) => a.award_type_id === t.id).length;
    const budget = allocated * Number(t.value_rs);
    const spent = used * Number(t.value_rs);

    return {
      type: t,
      allocated,
      used,
      remaining: allocated - used,
      issuedCount,
      budget,
      spent,
    };
  });

  const totalBudget = categoryStats.reduce((acc, c) => acc + c.budget, 0);
  const totalSpent = categoryStats.reduce((acc, c) => acc + c.spent, 0);

  // Eligibility population
  const activeUsers = data.users.filter((u) => u.is_active);
  const eligibleUsers = activeUsers.filter((u) => checkEligibility(u).ok);

  // Managers with zero awards this year
  const inactiveLeaders = leaders.filter(
    (l) => !ytdAwards.some((a) => a.given_by === l.id)
  );

  // Monthly counts
  const monthlyCounts = new Array(12).fill(0);
  for (const a of ytdAwards) {
    if (a.issued_at) {
      const d = new Date(a.issued_at);
      monthlyCounts[d.getMonth()]++;
    }
  }

  // Top company-wide recipients
  const recipMap: Record<string, { id: string; count: number; points: number }> = {};
  for (const a of ytdAwards) {
    if (!recipMap[a.recipient_id]) {
      recipMap[a.recipient_id] = { id: a.recipient_id, count: 0, points: 0 };
    }
    recipMap[a.recipient_id].count++;
    recipMap[a.recipient_id].points += Number(a.points);
  }
  const topRecipients = Object.values(recipMap)
    .sort((a, b) => b.points - a.points || b.count - a.count)
    .slice(0, 5);

  const categoryTableColumns: Column<typeof categoryStats[0]>[] = [
    {
      header: 'Award Tier',
      render: (r) => {
        const col = TIER_COLORS[r.type.name] || 'var(--primary)';
        return (
          <span className="chip">
            <i className="dot" style={{ backgroundColor: col }} />
            <strong>{r.type.name}</strong>
          </span>
        );
      },
    },
    {
      header: 'Allocated',
      numeric: true,
      render: (r) => r.allocated,
    },
    {
      header: 'Used',
      numeric: true,
      render: (r) => r.used,
    },
    {
      header: 'Remaining',
      numeric: true,
      render: (r) => <strong>{r.remaining}</strong>,
    },
    {
      header: 'Utilisation',
      render: (r) => {
        const pct = r.allocated > 0 ? Math.round((r.used / r.allocated) * 100) : 0;
        return (
          <div style={{ width: '100px' }}>
            <div className="bar">
              <i style={{ width: `${pct}%`, backgroundColor: TIER_COLORS[r.type.name] || 'var(--primary)' }} />
            </div>
            <span className="small muted">{pct}%</span>
          </div>
        );
      },
    },
    {
      header: 'Budget Utilisation',
      numeric: true,
      render: (r) => (
        <div>
          <strong>Rs {r.spent.toLocaleString('en-IN')}</strong>
          <div className="small muted">of Rs {r.budget.toLocaleString('en-IN')}</div>
        </div>
      ),
    },
  ];

  const managerColumns: Column<User>[] = [
    {
      header: 'Manager / Department',
      render: (l) => (
        <div>
          <strong>{l.full_name}</strong>
          {Boolean(l.is_leadership) && <span className="badge b-muted" style={{ marginLeft: '6px' }}>Leadership</span>}
          <div className="small muted">{l.department} &bull; {l.vcreatek_id}</div>
        </div>
      ),
    },
    {
      header: 'Allocated',
      numeric: true,
      render: (l) => invs.filter((i) => i.leader_id === l.id).reduce((sum, i) => sum + Number(i.allocated), 0),
    },
    {
      header: 'Used',
      numeric: true,
      render: (l) => invs.filter((i) => i.leader_id === l.id).reduce((sum, i) => sum + Number(i.used), 0),
    },
    {
      header: 'Remaining',
      numeric: true,
      render: (l) => {
        const rem = invs.filter((i) => i.leader_id === l.id).reduce((sum, i) => sum + Number(i.remaining), 0);
        return <strong>{rem}</strong>;
      },
    },
    {
      header: 'Utilisation',
      render: (l) => {
        const a = invs.filter((i) => i.leader_id === l.id).reduce((sum, i) => sum + Number(i.allocated), 0);
        const u = invs.filter((i) => i.leader_id === l.id).reduce((sum, i) => sum + Number(i.used), 0);
        const pct = a > 0 ? Math.round((u / a) * 100) : 0;
        return (
          <div style={{ width: '90px' }}>
            <div className="bar">
              <i style={{ width: `${pct}%` }} />
            </div>
            <span className="small muted">{pct}%</span>
          </div>
        );
      },
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
            <p className="dashboard-brand-sub">HR &amp; Executive Portal &bull; Organization Quotas, Budget &amp; Audits</p>
          </div>
        </div>
      </div>

      {/* 4 Primary Top Level Metrics */}
      <div className="grid g4 section">
        <KpiCard
          value={`${totalUsed} / ${totalAllocated}`}
          label="Award Units Utilisation"
          subtext={`${totalAllocated > 0 ? Math.round((totalUsed / totalAllocated) * 100) : 0}% of organizational quota distributed`}
          variant="primary"
          icon={<Award size={22} />}
        />
        <KpiCard
          value={totalPointsIssued.toLocaleString('en-IN')}
          label="Points Issued (YTD)"
          subtext={`of ${totalPointsAllocated.toLocaleString('en-IN')} total points budgeted`}
          variant="primary"
          icon={<TrendingUp size={22} />}
        />
        <KpiCard
          value={`Rs ${totalSpent.toLocaleString('en-IN')}`}
          label="Budget Spent (YTD)"
          subtext={`of Rs ${totalBudget.toLocaleString('en-IN')} allocated pool`}
          variant="accent"
          icon={<Wallet size={22} />}
        />
        <KpiCard
          value={`${eligibleUsers.length} / ${activeUsers.length}`}
          label="Eligible Employees"
          subtext={`${Math.round((eligibleUsers.length / activeUsers.length) * 100)}% active workforce meets policy tenure`}
          variant="success"
          icon={<Users size={22} />}
        />
      </div>

      {/* 4 Secondary Operations Metrics */}
      <div className="grid g4 section">
        <KpiCard
          value={mtdAwards.length}
          label="Awards this Month (MTD)"
          subtext="Current cycle awards issued"
          variant="primary"
        />
        <KpiCard
          value={ytdAwards.length}
          label="Awards this Year (YTD)"
          subtext={`${new Set(ytdAwards.map((a) => a.recipient_id)).size} unique recipients honored`}
          variant="primary"
        />
        <KpiCard
          value={pendingAwards.length}
          label="Awaiting Approval"
          subtext="High-tier awards in review"
          variant="warn"
          icon={<Clock size={20} />}
        />
        <KpiCard
          value={pendingRedemptions.length}
          label="Pending Redemptions"
          subtext={`Rs ${pendingRedemptionValue.toLocaleString('en-IN')} voucher value to fulfill`}
          variant="warn"
          icon={<Gift size={20} />}
        />
      </div>

      {/* Monthly Chart and Category Breakdown */}
      <div className="grid g2 section">
        <div className="card">
          <h3>Organization Awards per Month ({currentYear})</h3>
          <p className="muted small" style={{ marginBottom: '12px' }}>Company-wide award velocity</p>
          <PureBarChart counts={monthlyCounts} color="var(--primary)" activeColor="var(--accent)" height={210} />
        </div>

        <div className="card">
          <h3>Distribution by Award Category ({currentYear})</h3>
          <p className="muted small" style={{ marginBottom: '12px' }}>Share of awards granted</p>

          <div>
            {categoryStats.map((c) => {
              const totalYtd = Math.max(1, ytdAwards.length);
              const pct = Math.round((c.issuedCount / totalYtd) * 100);
              const col = TIER_COLORS[c.type.name] || 'var(--primary)';

              return (
                <div key={c.type.id} className="hbar">
                  <span style={{ fontSize: '0.9rem', fontWeight: 600 }}>
                    <i className="dot" style={{ display: 'inline-block', width: '10px', height: '10px', borderRadius: '50%', backgroundColor: col, marginRight: '6px' }} />
                    {c.type.name}
                  </span>
                  <div className="bar">
                    <i style={{ width: `${pct}%`, backgroundColor: col }} />
                  </div>
                  <span className="small num" style={{ fontWeight: 600 }}>
                    {c.issuedCount} ({pct}%)
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Inventory & Manager Performance */}
      <div className="grid g2 section">
        <div className="card">
          <h3>Inventory by Category ({currentYear})</h3>
          <p className="muted small" style={{ marginBottom: '12px' }}>Corporate tier tracking</p>
          <DataTable
            columns={categoryTableColumns}
            data={categoryStats}
            emptyMessage="No active categories."
          />
        </div>

        <div className="card">
          <div className="row" style={{ justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
            <h3>Manager Quota Status</h3>
            <span className="small muted">{leaders.length} Active Managers</span>
          </div>

          {inactiveLeaders.length > 0 && (
            <div className="alert a-warn" style={{ padding: '8px 12px', fontSize: '0.86rem', marginBottom: '12px' }}>
              <AlertTriangle size={16} />
              <span>
                <strong>{inactiveLeaders.length} managers</strong> have not given any awards yet this year:{' '}
                {inactiveLeaders.map((l) => l.full_name).join(', ')}.
              </span>
            </div>
          )}

          <DataTable
            columns={managerColumns}
            data={leaders}
            emptyMessage="No managers found."
          />
        </div>
      </div>

      {/* 3 Columns: Top Recipients, Pending Approvals, Pending Redemptions */}
      <div className="grid g3 section">
        <div className="card">
          <h3>Top Recognised Contributors</h3>
          <p className="muted small" style={{ marginBottom: '12px' }}>Highest points earned this year</p>

          {topRecipients.length > 0 ? (
            topRecipients.map((recip, idx) => {
              const u = data.users.find((x) => x.id === recip.id);
              return (
                <div key={recip.id} className="rank-item">
                  <div>
                    <span className="muted small" style={{ marginRight: '6px', fontWeight: 700 }}>
                      {idx + 1}.
                    </span>
                    <strong>{u?.full_name}</strong>
                    <div className="small muted">{u?.department}</div>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <span className="small">{recip.count} awards &bull; </span>
                    <strong style={{ color: 'var(--primary)' }}>{recip.points} pts</strong>
                  </div>
                </div>
              );
            })
          ) : (
            <p className="muted">No awards recorded yet.</p>
          )}
        </div>

        <div className="card">
          <div className="row" style={{ justifyContent: 'space-between', alignItems: 'center' }}>
            <h3>Awaiting Approval</h3>
            <Link to="/approvals" className="small">
              View all ({pendingAwards.length})
            </Link>
          </div>
          <p className="muted small" style={{ marginBottom: '12px' }}>Nominations in review</p>

          {pendingAwards.length > 0 ? (
            pendingAwards.slice(0, 5).map((a) => (
              <div key={a.id} className="rank-item">
                <div>
                  <strong>{getUserName(a.recipient_id)}</strong>
                  <div className="small muted">
                    {getAwardTypeName(a.award_type_id)} by {getUserName(a.given_by)}
                  </div>
                </div>
                <Badge status={a.status} />
              </div>
            ))
          ) : (
            <p className="muted">No nominations awaiting approval.</p>
          )}
        </div>

        <div className="card">
          <div className="row" style={{ justifyContent: 'space-between', alignItems: 'center' }}>
            <h3>Pending Redemptions</h3>
            <Link to="/admin/redemptions" className="small">
              Open queue ({pendingRedemptions.length})
            </Link>
          </div>
          <p className="muted small" style={{ marginBottom: '12px' }}>Vouchers awaiting fulfillment</p>

          {pendingRedemptions.length > 0 ? (
            pendingRedemptions.slice(0, 5).map((r) => (
              <div key={r.id} className="rank-item">
                <div>
                  <strong>{getUserName(r.user_id)}</strong>
                  <div className="small muted">
                    {r.points} points = Rs {Number(r.value_rs).toLocaleString('en-IN')}
                  </div>
                </div>
                <Badge status={r.status} />
              </div>
            ))
          ) : (
            <p className="muted">No pending redemption requests.</p>
          )}
        </div>
      </div>
    </div>
  );
};

export default HrDashboard;
