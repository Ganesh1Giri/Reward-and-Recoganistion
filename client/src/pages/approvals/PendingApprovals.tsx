import React, { useState } from 'react';
import { useAuth } from '../../hooks/useAuth';
import { useData } from '../../hooks/useData';
import { Award } from '../../types';
import { Check, X } from 'lucide-react';

const TIER_COLORS: Record<string, string> = {
  Beacon: '#8fbc5a',
  Bronze: '#cd7f32',
  Silver: '#8e9aa8',
  Gold: '#d4a017',
  Diamond: '#5fb8d8',
};

export const PendingApprovals: React.FC = () => {
  const { user } = useAuth();
  const { data, getUserName, getAwardTypeName, decideAward } = useData();

  const [remarksState, setRemarksState] = useState<Record<string, string>>({});
  const [errorState, setErrorState] = useState<Record<string, string>>({});

  if (!user) return null;

  const isHR = user.role === 'HR_ADMIN';

  // Filter nominations where approver is current user or user is HR admin
  const pendingAwards = data.awards.filter(
    (a) => a.status === 'PENDING_APPROVAL' && (a.approver_id === user.id || isHR)
  );

  // Group by batch_id
  const batchMap: Record<string, Award[]> = {};
  for (const a of pendingAwards) {
    if (!batchMap[a.batch_id]) {
      batchMap[a.batch_id] = [];
    }
    batchMap[a.batch_id].push(a);
  }

  const batchIds = Object.keys(batchMap);

  const handleDecision = (batchId: string, approve: boolean) => {
    const remarks = (remarksState[batchId] || '').trim();
    if (!approve && remarks.length < 5) {
      setErrorState((prev) => ({
        ...prev,
        [batchId]: 'Please provide a clear justification of at least 5 characters for rejection.',
      }));
      return;
    }

    setErrorState((prev) => ({ ...prev, [batchId]: '' }));
    decideAward(batchId, approve, remarks);
  };

  return (
    <div className="card">
      <div className="row" style={{ justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
        <div>
          <h3>Pending Award Approvals</h3>
          <p className="muted small">Review, approve, or reject high-impact award nominations</p>
        </div>
        <div>
          <span className="badge b-warning">{batchIds.length} Awaiting Decision</span>
        </div>
      </div>

      {batchIds.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '40px 20px' }}>
          <Check size={32} color="var(--success)" style={{ marginBottom: '8px' }} />
          <p className="muted">All clear! No nominations are currently waiting for your review.</p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {batchIds.map((batchId) => {
            const awardsInBatch = batchMap[batchId];
            const sampleAward = awardsInBatch[0];
            const tierName = getAwardTypeName(sampleAward.award_type_id);
            const col = TIER_COLORS[tierName] || 'var(--primary)';

            return (
              <div
                key={batchId}
                style={{
                  border: '1px solid var(--border)',
                  borderRadius: 'var(--r12)',
                  padding: '18px 20px',
                  background: '#fafbfd',
                }}
              >
                <div className="row" style={{ justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <div className="row" style={{ gap: '12px' }}>
                    <span className="chip" style={{ borderLeft: `4px solid ${col}`, fontWeight: 700 }}>
                      <i className="dot" style={{ backgroundColor: col }} />
                      {tierName} ({sampleAward.points} pts)
                    </span>
                    <div>
                      <strong>
                        {awardsInBatch.map((a) => getUserName(a.recipient_id)).join(', ')}
                      </strong>
                      <div className="small muted">
                        Nominated by <strong>{getUserName(sampleAward.given_by)}</strong> &bull; Submitted on{' '}
                        {new Date(sampleAward.created_at).toLocaleDateString('en-IN', {
                          day: '2-digit',
                          month: 'short',
                          year: 'numeric',
                        })}
                      </div>
                    </div>
                  </div>

                  <span className="badge b-warning">Pending Approval</span>
                </div>

                <div
                  style={{
                    margin: '14px 0',
                    padding: '12px 14px',
                    borderRadius: 'var(--r8)',
                    background: '#fff',
                    border: '1px solid var(--border)',
                    fontSize: '0.94rem',
                    fontStyle: 'italic',
                  }}
                >
                  "{sampleAward.reason}"
                </div>

                {errorState[batchId] && (
                  <div className="alert a-error" style={{ padding: '8px 12px', fontSize: '0.86rem', marginBottom: '10px' }}>
                    {errorState[batchId]}
                  </div>
                )}

                <div className="row" style={{ gap: '12px' }}>
                  <input
                    type="text"
                    placeholder="Approval comments or rejection justification..."
                    value={remarksState[batchId] || ''}
                    onChange={(e) => setRemarksState((prev) => ({ ...prev, [batchId]: e.target.value }))}
                    style={{ flex: 1, minWidth: '240px' }}
                  />
                  <button
                    className="btn btn-primary btn-sm"
                    onClick={() => handleDecision(batchId, true)}
                  >
                    <Check size={14} /> Approve &amp; Issue
                  </button>
                  <button
                    className="btn btn-danger btn-sm"
                    onClick={() => handleDecision(batchId, false)}
                  >
                    <X size={14} /> Reject &amp; Restore Quota
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default PendingApprovals;
