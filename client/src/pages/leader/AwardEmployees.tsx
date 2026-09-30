import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import { useData } from '../../hooks/useData';
import Badge from '../../components/common/Badge';
import { UserCheck, AlertCircle, ShieldAlert, Award as AwardIcon } from 'lucide-react';
import './AwardEmployees.css';

export const AwardEmployees: React.FC = () => {
  const { user } = useAuth();
  const { data, getUserName, getLeaderInventory, getAwardType, checkEligibility, giveAward } = useData();
  const navigate = useNavigate();

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedRecipientIds, setSelectedRecipientIds] = useState<string[]>([]);
  const [selectedTypeId, setSelectedTypeId] = useState<string>(data.award_types.find((t) => t.is_active)?.id || '');
  const [reason, setReason] = useState('');
  const [error, setError] = useState<string | null>(null);

  if (!user) return null;

  const currentYear = new Date().getFullYear();
  const activeTypes = data.award_types.filter((t) => t.is_active);
  const selectedType = getAwardType(selectedTypeId);
  const currentInv = getLeaderInventory(user.id, selectedTypeId, currentYear);
  const remainingUnits = currentInv ? currentInv.remaining : 0;
  const needsApproval = Boolean(selectedType && Number(selectedType.needs_approval));

  // Filter candidates
  const cleanQ = searchQuery.toLowerCase().trim();
  const candidates = data.users
    .filter(
      (u) =>
        u.id !== user.id &&
        u.is_active &&
        u.role !== 'HR_ADMIN' &&
        (!cleanQ ||
          u.full_name.toLowerCase().includes(cleanQ) ||
          u.vcreatek_id.toLowerCase().includes(cleanQ) ||
          u.department.toLowerCase().includes(cleanQ))
    )
    .slice(0, 30);

  const toggleSelect = (userId: string) => {
    if (selectedRecipientIds.includes(userId)) {
      setSelectedRecipientIds((prev) => prev.filter((id) => id !== userId));
    } else {
      setSelectedRecipientIds((prev) => [...prev, userId]);
    }
  };

  const handleSelectAllEligible = () => {
    const eligibleIds = candidates.filter((u) => checkEligibility(u).ok).map((u) => u.id);
    setSelectedRecipientIds(eligibleIds);
  };

  const handleClearSelection = () => {
    setSelectedRecipientIds([]);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const res = giveAward(user.id, selectedRecipientIds, selectedTypeId, reason);
    if (res.error) {
      setError(res.error);
    } else {
      navigate('/leader/awards');
    }
  };

  return (
    <div className="grid g2">
      {/* Step 1: Candidate Selection */}
      <div className="card">
        <div className="row" style={{ justifyContent: 'space-between', alignItems: 'center' }}>
          <h3>1. Choose Recipients</h3>
          <span className="small muted">{selectedRecipientIds.length} Selected</span>
        </div>
        <p className="muted small" style={{ marginTop: '4px', marginBottom: '14px' }}>
          Search by name, VCreaTek ID, or department. Eligibility policy is validated live for each candidate.
        </p>

        <div className="form-group" style={{ position: 'relative' }}>
          <input
            type="text"
            placeholder="Search employee by name, ID (e.g. VCT1101), or team..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>

        <div className="row" style={{ marginBottom: '12px', justifyContent: 'space-between' }}>
          <button type="button" className="btn btn-secondary btn-sm" onClick={handleSelectAllEligible}>
            Select All Eligible in View
          </button>
          {selectedRecipientIds.length > 0 && (
            <button type="button" className="btn btn-secondary btn-sm" onClick={handleClearSelection}>
              Clear Selection
            </button>
          )}
        </div>

        {/* Selected preview chips */}
        {selectedRecipientIds.length > 0 && (
          <div style={{ marginBottom: '14px' }}>
            <span className="small muted">Selected employees:</span>
            <div className="chips" style={{ marginTop: '6px' }}>
              {selectedRecipientIds.map((rid) => (
                <span key={rid} className="chip" style={{ background: 'var(--focus)', borderColor: 'var(--primary-light)' }}>
                  <UserCheck size={13} color="var(--primary)" style={{ marginRight: '6px' }} />
                  {getUserName(rid)}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Candidate List */}
        <div style={{ maxHeight: '420px', overflowY: 'auto', paddingRight: '4px' }}>
          {candidates.map((cand) => {
            const elig = checkEligibility(cand);
            const isSelected = selectedRecipientIds.includes(cand.id);

            return (
              <div
                key={cand.id}
                className={`recip-item ${isSelected ? 'selected' : ''}`}
                onClick={() => toggleSelect(cand.id)}
              >
                <div>
                  <div style={{ fontWeight: 600, fontSize: '0.94rem' }}>{cand.full_name}</div>
                  <div className="small muted">
                    {cand.vcreatek_id} &bull; {cand.department} &bull; {cand.employment_type}
                  </div>
                  <div className="small muted" style={{ marginTop: '2px' }}>
                    {elig.reason}
                  </div>
                </div>

                <Badge
                  status={elig.ok ? 'ISSUED' : 'REVOKED'}
                  label={elig.ok ? 'Eligible' : 'Not Eligible'}
                />
              </div>
            );
          })}

          {candidates.length === 0 && (
            <p className="muted small" style={{ textAlign: 'center', padding: '24px 0' }}>
              No employees match your search query.
            </p>
          )}
        </div>
      </div>

      {/* Step 2: Award Selection & Justification */}
      <div className="card">
        <h3>2. Select Award &amp; Provide Justification</h3>
        <p className="muted small" style={{ marginTop: '4px', marginBottom: '16px' }}>
          Award units will be reserved from your annual allocated quota.
        </p>

        {error && (
          <div className="alert a-error" style={{ marginBottom: '16px' }}>
            <AlertCircle size={18} />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label htmlFor="award-type-select">Award Tier</label>
            <select
              id="award-type-select"
              value={selectedTypeId}
              onChange={(e) => setSelectedTypeId(e.target.value)}
              required
            >
              {activeTypes.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.name} ({t.points} points &bull; Rs {t.value_rs.toLocaleString('en-IN')})
                </option>
              ))}
            </select>

            <div className="small muted" style={{ marginTop: '6px' }}>
              Available quota: <strong>{remainingUnits}</strong> units remaining this year.{' '}
              {selectedRecipientIds.length > 0 && (
                <span style={{ color: remainingUnits < selectedRecipientIds.length ? 'var(--danger)' : 'var(--primary)' }}>
                  ({selectedRecipientIds.length} will be deducted)
                </span>
              )}
            </div>

            {needsApproval && (
              <div
                style={{
                  marginTop: '10px',
                  padding: '10px 14px',
                  borderRadius: 'var(--r8)',
                  background: '#fffbeb',
                  border: '1px solid #fde68a',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '10px',
                }}
              >
                <ShieldAlert size={18} color="var(--warning)" />
                <span className="small" style={{ color: '#92400e', fontWeight: 600 }}>
                  This award requires leadership approval before points and certificates are issued.
                </span>
              </div>
            )}
          </div>

          <div className="form-group" style={{ marginTop: '18px' }}>
            <label htmlFor="award-reason">
              Citation / Justification <span className="small muted">(Minimum 20 characters)</span>
            </label>
            <textarea
              id="award-reason"
              placeholder="Describe the contribution, client impact, or specific achievement deserving this recognition..."
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              required
            />
            <span className="small muted" style={{ textAlign: 'right' }}>
              {reason.trim().length} / 20 characters minimum
            </span>
          </div>

          <button
            type="submit"
            className="btn btn-accent"
            style={{ width: '100%', padding: '12px', marginTop: '14px' }}
            disabled={
              selectedRecipientIds.length === 0 ||
              reason.trim().length < 20 ||
              remainingUnits < selectedRecipientIds.length
            }
          >
            <AwardIcon size={18} />{' '}
            {needsApproval ? 'Submit Nominations for Approval' : 'Issue Recognition Award'}
          </button>
        </form>
      </div>
    </div>
  );
};

export default AwardEmployees;
