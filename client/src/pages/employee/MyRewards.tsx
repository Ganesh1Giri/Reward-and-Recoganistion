import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import { useData } from '../../hooks/useData';
import { Award } from '../../types';
import KpiCard from '../../components/common/KpiCard';
import Badge from '../../components/common/Badge';
import DataTable, { Column } from '../../components/common/DataTable';
import CertificateModal from '../../components/common/CertificateModal';
import { Coins, Award as AwardIcon, Gift, CheckCircle, Clock, ExternalLink } from 'lucide-react';
import vctLogo from '../../assets/vct.png';
import './MyRewards.css';

const TIER_COLORS: Record<string, string> = {
  Beacon: '#8fbc5a',
  Bronze: '#cd7f32',
  Silver: '#8e9aa8',
  Gold: '#d4a017',
  Diamond: '#5fb8d8',
};

export const MyRewards: React.FC = () => {
  const { user } = useAuth();
  const { data, getUserBalance, getRupeeRate, checkEligibility, getUserName, getAwardTypeName } = useData();

  const [selectedAward, setSelectedAward] = useState<Award | null>(null);
  const [isCertOpen, setIsCertOpen] = useState(false);

  if (!user) return null;

  const currentBalance = getUserBalance(user.id);
  const rupeeRate = getRupeeRate();
  const rupeeValue = (currentBalance * rupeeRate).toLocaleString('en-IN');

  const myAwards = data.awards
    .filter((a) => a.recipient_id === user.id && ['ISSUED', 'REVOKED'].includes(a.status))
    .sort((a, b) => (b.issued_at || b.created_at).localeCompare(a.issued_at || a.created_at));

  const totalEarned = data.point_transactions
    .filter((t) => t.user_id === user.id && t.type === 'AWARD')
    .reduce((sum, t) => sum + Number(t.points), 0);

  const totalRedeemed = Math.abs(
    data.point_transactions
      .filter((t) => t.user_id === user.id && t.type === 'REDEEM')
      .reduce((sum, t) => sum + Number(t.points), 0)
  );

  const issuedCount = myAwards.filter((a) => a.status === 'ISSUED').length;

  // Count by category
  const categoryCounts: Record<string, number> = {};
  for (const a of myAwards) {
    if (a.status === 'ISSUED') {
      const name = getAwardTypeName(a.award_type_id);
      categoryCounts[name] = (categoryCounts[name] || 0) + 1;
    }
  }

  const eligibility = checkEligibility(user);

  const recentGlobalAwards = data.awards
    .filter((a) => a.status === 'ISSUED')
    .sort((a, b) => (b.issued_at || b.created_at).localeCompare(a.issued_at || a.created_at))
    .slice(0, 6);

  const handleOpenCert = (award: Award) => {
    setSelectedAward(award);
    setIsCertOpen(true);
  };

  const myRecentColumns: Column<Award>[] = [
    {
      header: 'Date',
      render: (r) => (
        <span>
          {r.issued_at
            ? new Date(r.issued_at).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })
            : '—'}
        </span>
      ),
    },
    {
      header: 'Award',
      render: (r) => {
        const name = getAwardTypeName(r.award_type_id);
        const col = TIER_COLORS[name] || 'var(--primary)';
        return (
          <span className="chip">
            <i className="dot" style={{ backgroundColor: col }} />
            <strong>{name}</strong>
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
      header: 'From',
      render: (r) => getUserName(r.given_by),
    },
    {
      header: 'Action',
      render: (r) => (
        <button className="btn btn-secondary btn-sm" onClick={() => handleOpenCert(r)}>
          <ExternalLink size={13} /> View Certificate
        </button>
      ),
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
            <p className="dashboard-brand-sub">Employee Recognition Portal &bull; Welcome, {user.full_name}</p>
          </div>
        </div>
      </div>

      {/* 4 Hero KPI Cards */}
      <div className="grid g4 section">
        <KpiCard
          value={currentBalance.toLocaleString('en-IN')}
          label="Available Points"
          subtext={`Equivalent to Rs ${rupeeValue} voucher value`}
          variant="accent"
          icon={<Coins size={24} />}
        />
        <KpiCard
          value={totalEarned.toLocaleString('en-IN')}
          label="Total Points Earned"
          subtext="Cumulative recognition rewards"
          variant="primary"
          icon={<AwardIcon size={24} />}
        />
        <KpiCard
          value={totalRedeemed.toLocaleString('en-IN')}
          label="Total Points Redeemed"
          subtext="Converted to retail vouchers"
          variant="success"
          icon={<Gift size={24} />}
        />
        <KpiCard
          value={issuedCount}
          label="Awards Received"
          subtext="Recognitions from leadership"
          variant="warn"
          icon={<CheckCircle size={24} />}
        />
      </div>

      {/* Categories & Eligibility Details */}
      <div className="grid g2 section">
        <div className="card">
          <h3>Awards by Category</h3>
          <div className="chips" style={{ marginTop: '12px' }}>
            {Object.keys(categoryCounts).length > 0 ? (
              Object.entries(categoryCounts).map(([catName, count]) => (
                <span key={catName} className="chip">
                  <i className="dot" style={{ backgroundColor: TIER_COLORS[catName] || 'var(--primary)' }} />
                  {catName}: <strong>{count}</strong>
                </span>
              ))
            ) : (
              <span className="muted">No awards received yet.</span>
            )}
          </div>

          <div className="row" style={{ marginTop: '22px' }}>
            <Link to="/me/redeem" className="btn btn-accent">
              Redeem Points
            </Link>
            <Link to="/me/awards" className="btn btn-secondary">
              View Complete Award History
            </Link>
          </div>
        </div>

        <div className="card">
          <h3>My Eligibility Status</h3>
          <div style={{ marginTop: '12px' }}>
            <div className="row" style={{ gap: '10px', alignItems: 'center' }}>
              <Badge
                status={eligibility.ok ? 'ISSUED' : 'REVOKED'}
                label={eligibility.ok ? 'Eligible' : 'Not Eligible'}
              />
              <span style={{ fontSize: '0.92rem' }}>{eligibility.reason}</span>
            </div>
            <p className="muted small" style={{ marginTop: '14px', lineHeight: 1.6 }}>
              Employment Type: <strong>{user.employment_type}</strong> &bull; Joining Date:{' '}
              <strong>
                {new Date(user.joining_date).toLocaleDateString('en-IN', {
                  day: '2-digit',
                  month: 'short',
                  year: 'numeric',
                })}
              </strong>{' '}
              &bull; Department: <strong>{user.department}</strong>
              {user.notice_period_start && (
                <> &bull; Notice Start: <strong>{user.notice_period_start}</strong></>
              )}
            </p>
          </div>
        </div>
      </div>

      {/* Tables: Recent Awards & Wall of Fame */}
      <div className="grid g2">
        <div className="card">
          <h3>Recent Awards Received</h3>
          <div style={{ marginTop: '14px' }}>
            <DataTable
              columns={myRecentColumns}
              data={myAwards.slice(0, 5)}
              emptyMessage="You have not received any awards yet."
            />
          </div>
        </div>

        <div className="card">
          <div className="row" style={{ justifyContent: 'space-between', alignItems: 'center' }}>
            <h3>Company Recognition Wall</h3>
            <span className="small muted">Live Across All Departments</span>
          </div>

          <div style={{ marginTop: '12px' }}>
            {recentGlobalAwards.map((a) => {
              const recipName = getUserName(a.recipient_id);
              const atName = getAwardTypeName(a.award_type_id);
              const initials = recipName
                .split(' ')
                .map((p) => p[0])
                .slice(0, 2)
                .join('');
              const color = TIER_COLORS[atName] || 'var(--primary)';

              return (
                <div key={a.id} className="feed-item">
                  <div className="av" style={{ backgroundColor: color }}>
                    {initials}
                  </div>
                  <div>
                    <div className="t">
                      <strong>{recipName}</strong> was honored with a{' '}
                      <strong style={{ color }}>{atName}</strong> award by {getUserName(a.given_by)}
                    </div>
                    <div className="m">"{a.reason}"</div>
                    <div className="m" style={{ fontSize: '0.78rem', color: 'var(--t3)', display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <Clock size={12} />
                      {a.issued_at
                        ? new Date(a.issued_at).toLocaleDateString('en-IN', {
                            day: '2-digit',
                            month: 'short',
                            year: 'numeric',
                          })
                        : ''}{' '}
                      &bull; {a.points} points
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Certificate Modal */}
      <CertificateModal
        award={selectedAward}
        isOpen={isCertOpen}
        onClose={() => setIsCertOpen(false)}
      />
    </div>
  );
};

export default MyRewards;
