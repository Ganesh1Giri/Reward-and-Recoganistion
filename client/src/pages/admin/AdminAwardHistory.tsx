import React, { useState } from 'react';
import { useAuth } from '../../hooks/useAuth';
import { useData } from '../../hooks/useData';
import { Award } from '../../types';
import DataTable, { Column } from '../../components/common/DataTable';
import Badge from '../../components/common/Badge';
import CertificateModal from '../../components/common/CertificateModal';
import Modal from '../../components/common/Modal';
import { ExternalLink, AlertTriangle } from 'lucide-react';

const TIER_COLORS: Record<string, string> = {
  Beacon: '#8fbc5a',
  Bronze: '#cd7f32',
  Silver: '#8e9aa8',
  Gold: '#d4a017',
  Diamond: '#5fb8d8',
};

export const AdminAwardHistory: React.FC = () => {
  const { user } = useAuth();
  const { data, getUserName, getAwardTypeName, revokeAward } = useData();

  const [period, setPeriod] = useState<string>('all');
  const [category, setCategory] = useState<string>('');
  const [status, setStatus] = useState<string>('');
  const [query, setQuery] = useState<string>('');

  const [selectedAward, setSelectedAward] = useState<Award | null>(null);
  const [isCertOpen, setIsCertOpen] = useState(false);

  // Revoke modal state
  const [revokingAward, setRevokingAward] = useState<Award | null>(null);
  const [revokeReason, setRevokeReason] = useState<string>('');
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  if (!user) return null;

  const currentYear = new Date().getFullYear();
  const currentMonth = new Date().getMonth();

  let rows = [...data.awards];

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
    rows = rows.filter(
      (a) =>
        getUserName(a.recipient_id).toLowerCase().includes(q) ||
        getUserName(a.given_by).toLowerCase().includes(q)
    );
  }

  rows.sort((a, b) => b.created_at.localeCompare(a.created_at));

  const handleOpenRevokeModal = (award: Award) => {
    setRevokingAward(award);
    setRevokeReason('');
    setFeedback(null);
  };

  const handleConfirmRevoke = () => {
    if (!revokingAward) return;
    const res = revokeAward(revokingAward.id, revokeReason.trim());
    if (res.error) {
      setFeedback({ type: 'error', message: res.error });
    } else {
      setFeedback({ type: 'success', message: 'Award revoked successfully. Points reversed from employee balance.' });
      setRevokingAward(null);
    }
  };

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
      header: 'Nominated By',
      render: (r) => getUserName(r.given_by),
    },
    {
      header: 'Award Tier',
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
      header: 'Justification / Reason',
      render: (r) => <span style={{ fontSize: '0.86rem' }}>{r.reason}</span>,
    },
    {
      header: 'Status & Remarks',
      render: (r) => (
        <div>
          <Badge status={r.status} />
          {r.approval_remarks && (
            <div className="small muted" style={{ marginTop: '2px' }}>
              Approval note: {r.approval_remarks}
            </div>
          )}
          {r.revoke_reason && (
            <div className="small muted" style={{ marginTop: '2px', color: 'var(--danger)' }}>
              Revocation reason: {r.revoke_reason}
            </div>
          )}
        </div>
      ),
    },
    {
      header: 'Actions',
      render: (r) => {
        const cert = data.certificates.find((c) => c.award_id === r.id);
        return (
          <div className="row" style={{ gap: '6px' }}>
            {cert && r.status === 'ISSUED' && (
              <button
                className="btn btn-secondary btn-sm"
                onClick={() => {
                  setSelectedAward(r);
                  setIsCertOpen(true);
                }}
              >
                <ExternalLink size={13} /> View
              </button>
            )}
            {r.status === 'ISSUED' && (
              <button
                className="btn btn-danger btn-sm"
                onClick={() => handleOpenRevokeModal(r)}
              >
                Revoke
              </button>
            )}
          </div>
        );
      },
    },
  ];

  return (
    <div className="card">
      <div className="row" style={{ justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
        <div>
          <h3>Organization-Wide Award Ledger</h3>
          <p className="muted small">Complete audit of all company recognitions with HR revocation authority</p>
        </div>
        <span className="badge b-info">{rows.length} Total Records</span>
      </div>

      {feedback && (
        <div className={`alert a-${feedback.type === 'error' ? 'error' : 'success'}`} style={{ marginBottom: '16px' }}>
          <span>{feedback.message}</span>
        </div>
      )}

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
          placeholder="Search by recipient or nominator..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          style={{ width: '280px' }}
        />
      </div>

      <DataTable
        columns={columns}
        data={rows}
        emptyMessage="No awards match your filter criteria."
      />

      <CertificateModal
        award={selectedAward}
        isOpen={isCertOpen}
        onClose={() => setIsCertOpen(false)}
      />

      {/* HR Revoke Modal */}
      <Modal
        isOpen={!!revokingAward}
        onClose={() => setRevokingAward(null)}
        title="Revoke Issued Recognition Award"
        maxWidth="540px"
        footer={
          <>
            <button className="btn btn-secondary btn-sm" onClick={() => setRevokingAward(null)}>
              Cancel
            </button>
            <button
              className="btn btn-danger btn-sm"
              disabled={revokeReason.trim().length < 5}
              onClick={handleConfirmRevoke}
            >
              Confirm Revocation
            </button>
          </>
        }
      >
        {revokingAward && (
          <div>
            <div className="alert a-warn" style={{ marginBottom: '14px' }}>
              <AlertTriangle size={18} />
              <span>
                Revoking this <strong>{getAwardTypeName(revokingAward.award_type_id)}</strong> award will deduct{' '}
                <strong>{revokingAward.points} points</strong> from {getUserName(revokingAward.recipient_id)}.
              </span>
            </div>

            <p className="small muted" style={{ marginBottom: '14px' }}>
              Nominated by {getUserName(revokingAward.given_by)} &bull; Reason: "{revokingAward.reason}"
            </p>

            <div className="form-group">
              <label htmlFor="admin-revoke-reason">Reason for Revocation (Required, min 5 characters)</label>
              <textarea
                id="admin-revoke-reason"
                placeholder="e.g. Issued in error, duplicate submission, or policy violation..."
                value={revokeReason}
                onChange={(e) => setRevokeReason(e.target.value)}
                required
              />
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
};

export default AdminAwardHistory;
