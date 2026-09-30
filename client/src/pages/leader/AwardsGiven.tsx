import React, { useState } from 'react';
import { useAuth } from '../../hooks/useAuth';
import { useData } from '../../hooks/useData';
import { Award } from '../../types';
import DataTable, { Column } from '../../components/common/DataTable';
import Badge from '../../components/common/Badge';
import CertificateModal from '../../components/common/CertificateModal';
import { ExternalLink } from 'lucide-react';

const TIER_COLORS: Record<string, string> = {
  Beacon: '#8fbc5a',
  Bronze: '#cd7f32',
  Silver: '#8e9aa8',
  Gold: '#d4a017',
  Diamond: '#5fb8d8',
};

export const AwardsGiven: React.FC = () => {
  const { user } = useAuth();
  const { data, getUserName, getAwardTypeName } = useData();

  const [period, setPeriod] = useState<string>('all');
  const [category, setCategory] = useState<string>('');
  const [status, setStatus] = useState<string>('');
  const [query, setQuery] = useState<string>('');
  const [selectedAward, setSelectedAward] = useState<Award | null>(null);
  const [isCertOpen, setIsCertOpen] = useState(false);

  if (!user) return null;

  const currentYear = new Date().getFullYear();
  const currentMonth = new Date().getMonth();

  let rows = data.awards.filter((a) => a.given_by === user.id);

  // Filter period
  if (period !== 'all') {
    rows = rows.filter((a) => {
      const d = new Date(a.issued_at || a.created_at);
      if (period === 'm0') return d.getFullYear() === currentYear && d.getMonth() === currentMonth;
      if (period === 'm1') return d.getFullYear() === currentYear && d.getMonth() === currentMonth - 1;
      if (period === 'y0') return d.getFullYear() === currentYear;
      if (period === 'y1') return d.getFullYear() === currentYear - 1;
      return true;
    });
  }

  // Filter category
  if (category) {
    rows = rows.filter((a) => a.award_type_id === category);
  }

  // Filter status
  if (status) {
    rows = rows.filter((a) => a.status === status);
  }

  // Filter query
  if (query.trim()) {
    const q = query.toLowerCase().trim();
    rows = rows.filter((a) => getUserName(a.recipient_id).toLowerCase().includes(q));
  }

  rows.sort((a, b) => b.created_at.localeCompare(a.created_at));

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
      header: 'Justification',
      render: (r) => <span style={{ fontSize: '0.86rem' }}>{r.reason}</span>,
    },
    {
      header: 'Status',
      render: (r) => (
        <div>
          <Badge status={r.status} />
          {r.approval_remarks && (
            <div className="small muted" style={{ marginTop: '2px' }}>
              Remarks: {r.approval_remarks}
            </div>
          )}
          {r.revoke_reason && (
            <div className="small muted" style={{ marginTop: '2px', color: 'var(--danger)' }}>
              Revoked: {r.revoke_reason}
            </div>
          )}
        </div>
      ),
    },
    {
      header: 'Certificate',
      render: (r) => {
        const cert = data.certificates.find((c) => c.award_id === r.id);
        if (cert && r.status === 'ISSUED') {
          return (
            <button
              className="btn btn-secondary btn-sm"
              onClick={() => {
                setSelectedAward(r);
                setIsCertOpen(true);
              }}
            >
              <ExternalLink size={13} /> View
            </button>
          );
        }
        return <span className="muted small">—</span>;
      },
    },
  ];

  return (
    <div className="card">
      <div className="row" style={{ justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
        <div>
          <h3>Awards I Have Given</h3>
          <p className="muted small">Filterable historical ledger of all your issued and pending nominations</p>
        </div>
      </div>

      {/* Filter Toolbar */}
      <div className="row section" style={{ gap: '10px' }}>
        <select value={period} onChange={(e) => setPeriod(e.target.value)} style={{ width: 'auto' }}>
          <option value="all">All Time</option>
          <option value="m0">This Month</option>
          <option value="m1">Previous Month</option>
          <option value="y0">This Year</option>
          <option value="y1">Previous Year</option>
        </select>

        <select value={category} onChange={(e) => setCategory(e.target.value)} style={{ width: 'auto' }}>
          <option value="">All Categories</option>
          {data.award_types.map((t) => (
            <option key={t.id} value={t.id}>
              {t.name}
            </option>
          ))}
        </select>

        <select value={status} onChange={(e) => setStatus(e.target.value)} style={{ width: 'auto' }}>
          <option value="">All Statuses</option>
          <option value="ISSUED">Issued</option>
          <option value="PENDING_APPROVAL">Pending Approval</option>
          <option value="REJECTED">Rejected</option>
          <option value="REVOKED">Revoked</option>
        </select>

        <input
          type="text"
          placeholder="Filter by recipient name..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          style={{ width: '240px' }}
        />
      </div>

      <DataTable
        columns={columns}
        data={rows}
        emptyMessage="No awards match your selected filters."
      />

      <CertificateModal
        award={selectedAward}
        isOpen={isCertOpen}
        onClose={() => setIsCertOpen(false)}
      />
    </div>
  );
};

export default AwardsGiven;
