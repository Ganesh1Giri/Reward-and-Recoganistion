import React, { useState } from 'react';
import { useData } from '../../hooks/useData';
import { RedemptionRequest, RedemptionStatus } from '../../types';
import Badge from '../../components/common/Badge';
import { CheckCircle } from 'lucide-react';

export const AdminRedemptions: React.FC = () => {
  const { data, getUser, getUserName, updateRedemption } = useData();

  const [activeTab, setActiveTab] = useState<'open' | 'completed'>('open');
  const [inputs, setInputs] = useState<
    Record<
      string,
      {
        provider: string;
        reference: string;
        amount: string;
        remarks: string;
      }
    >
  >({});
  const [feedback, setFeedback] = useState<{ id: string; type: 'success' | 'error'; message: string } | null>(null);

  const openStatuses: RedemptionStatus[] = ['REQUESTED', 'UNDER_REVIEW', 'APPROVED'];
  const requests = data.redemption_requests
    .filter((r) => (activeTab === 'open' ? openStatuses.includes(r.status) : !openStatuses.includes(r.status)))
    .sort((a, b) => b.created_at.localeCompare(a.created_at));

  const handleInputChange = (id: string, field: 'provider' | 'reference' | 'amount' | 'remarks', val: string) => {
    setInputs((prev) => ({
      ...prev,
      [id]: {
        provider: prev[id]?.provider ?? '',
        reference: prev[id]?.reference ?? '',
        amount: prev[id]?.amount ?? '',
        remarks: prev[id]?.remarks ?? '',
        [field]: val,
      },
    }));
  };

  const handleAction = (id: string, targetStatus: RedemptionStatus) => {
    setFeedback(null);
    const itemInputs = inputs[id] || {};
    const req = data.redemption_requests.find((x) => x.id === id);
    if (!req) return;

    if (targetStatus === 'FULFILLED' && !itemInputs.reference?.trim()) {
      setFeedback({ id, type: 'error', message: 'Voucher reference code is required to mark as fulfilled.' });
      return;
    }
    if (targetStatus === 'REJECTED' && !itemInputs.remarks?.trim()) {
      setFeedback({ id, type: 'error', message: 'Please provide clear remarks for the rejection.' });
      return;
    }

    const payload: Partial<RedemptionRequest> = {
      voucher_provider: itemInputs.provider?.trim() || req.voucher_provider || 'Online Retail Voucher',
      voucher_reference: itemInputs.reference?.trim() || req.voucher_reference,
      voucher_amount: itemInputs.amount ? Number(itemInputs.amount) : req.value_rs,
      remarks: itemInputs.remarks?.trim() || req.remarks,
    };

    const res = updateRedemption(id, targetStatus, payload);
    if (res.error) {
      setFeedback({ id, type: 'error', message: res.error });
    } else {
      setFeedback({ id, type: 'success', message: `Request successfully updated to ${targetStatus.replace('_', ' ')}.` });
    }
  };

  return (
    <div className="card">
      <div className="row" style={{ justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
        <div>
          <h3>Employee Redemption Management</h3>
          <p className="muted small">Review voucher requests, allocate provider credentials, and dispatch notifications</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="tabs-bar">
        <button
          className={`tab-btn ${activeTab === 'open' ? 'active' : ''}`}
          onClick={() => {
            setActiveTab('open');
            setFeedback(null);
          }}
        >
          Open Queue (
          {data.redemption_requests.filter((r) => openStatuses.includes(r.status)).length}
          )
        </button>
        <button
          className={`tab-btn ${activeTab === 'completed' ? 'active' : ''}`}
          onClick={() => {
            setActiveTab('completed');
            setFeedback(null);
          }}
        >
          Completed Records (
          {data.redemption_requests.filter((r) => !openStatuses.includes(r.status)).length}
          )
        </button>
      </div>

      {requests.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '36px 20px' }}>
          <CheckCircle size={32} color="var(--success)" style={{ marginBottom: '8px' }} />
          <p className="muted">
            {activeTab === 'open' ? 'No pending redemption requests.' : 'No completed redemption records.'}
          </p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {requests.map((r) => {
            const u = getUser(r.user_id);
            const itemInput = inputs[r.id] || {};
            const isProcessing = openStatuses.includes(r.status);

            return (
              <div
                key={r.id}
                style={{
                  border: '1px solid var(--border)',
                  borderRadius: 'var(--r12)',
                  padding: '18px 20px',
                  background: '#fafbfd',
                }}
              >
                <div className="row" style={{ justifyContent: 'space-between', alignItems: 'center' }}>
                  <div className="row" style={{ gap: '10px' }}>
                    <strong>{u?.full_name || getUserName(r.user_id)}</strong>
                    <span className="small muted">
                      {u?.vcreatek_id} &bull; {u?.department} &bull; Requested on{' '}
                      {new Date(r.created_at).toLocaleString('en-IN', {
                        day: '2-digit',
                        month: 'short',
                        year: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </span>
                  </div>

                  <div className="row" style={{ gap: '12px' }}>
                    <Badge status={r.status} />
                    <strong style={{ color: 'var(--primary)' }}>
                      {r.points} points = Rs {Number(r.value_rs).toLocaleString('en-IN')}
                    </strong>
                  </div>
                </div>

                {feedback && feedback.id === r.id && (
                  <div
                    className={`alert a-${feedback.type === 'error' ? 'error' : 'success'}`}
                    style={{ marginTop: '12px', padding: '8px 12px', fontSize: '0.86rem' }}
                  >
                    {feedback.message}
                  </div>
                )}

                {isProcessing ? (
                  <div style={{ marginTop: '14px', paddingTop: '14px', borderTop: '1px solid var(--border)' }}>
                    <div className="grid g4" style={{ gap: '10px' }}>
                      <div className="form-group" style={{ marginBottom: 0 }}>
                        <label className="small">Voucher Provider</label>
                        <input
                          type="text"
                          placeholder="e.g. Amazon, Flipkart"
                          value={itemInput.provider ?? (r.voucher_provider || '')}
                          onChange={(e) => handleInputChange(r.id, 'provider', e.target.value)}
                        />
                      </div>

                      <div className="form-group" style={{ marginBottom: 0 }}>
                        <label className="small">Reference / Card Code</label>
                        <input
                          type="text"
                          placeholder="e.g. GV-2026-XXXX"
                          value={itemInput.reference ?? (r.voucher_reference || '')}
                          onChange={(e) => handleInputChange(r.id, 'reference', e.target.value)}
                        />
                      </div>

                      <div className="form-group" style={{ marginBottom: 0 }}>
                        <label className="small">Voucher Amount (Rs)</label>
                        <input
                          type="number"
                          value={itemInput.amount ?? (r.voucher_amount || r.value_rs)}
                          onChange={(e) => handleInputChange(r.id, 'amount', e.target.value)}
                        />
                      </div>

                      <div className="form-group" style={{ marginBottom: 0 }}>
                        <label className="small">Remarks to Employee</label>
                        <input
                          type="text"
                          placeholder="e.g. Code emailed to employee"
                          value={itemInput.remarks ?? (r.remarks || '')}
                          onChange={(e) => handleInputChange(r.id, 'remarks', e.target.value)}
                        />
                      </div>
                    </div>

                    <div className="row" style={{ marginTop: '14px', gap: '10px' }}>
                      {r.status === 'REQUESTED' && (
                        <button
                          className="btn btn-secondary btn-sm"
                          onClick={() => handleAction(r.id, 'UNDER_REVIEW')}
                        >
                          Mark Under Review
                        </button>
                      )}

                      {r.status !== 'APPROVED' && (
                        <button
                          className="btn btn-primary btn-sm"
                          onClick={() => handleAction(r.id, 'APPROVED')}
                        >
                          Approve Request
                        </button>
                      )}

                      {r.status === 'APPROVED' && (
                        <button
                          className="btn btn-accent btn-sm"
                          onClick={() => handleAction(r.id, 'FULFILLED')}
                        >
                          Mark Fulfilled &amp; Send Voucher
                        </button>
                      )}

                      <button
                        className="btn btn-danger btn-sm"
                        onClick={() => handleAction(r.id, 'REJECTED')}
                      >
                        Reject &amp; Refund Points
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="small muted" style={{ marginTop: '12px' }}>
                    {r.voucher_provider && `${r.voucher_provider} `}
                    {r.voucher_reference && `[${r.voucher_reference}] `}
                    {r.voucher_amount && `Rs ${r.voucher_amount.toLocaleString('en-IN')} `}
                    &bull; Processed by {getUserName(r.handled_by || '')}{' '}
                    {r.fulfilled_at && `on ${new Date(r.fulfilled_at).toLocaleDateString('en-IN')}`}
                    {r.remarks && ` &bull; Remarks: "${r.remarks}"`}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default AdminRedemptions;
