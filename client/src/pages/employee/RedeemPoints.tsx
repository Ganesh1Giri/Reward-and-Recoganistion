import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import { useData } from '../../hooks/useData';
import { Gift, AlertCircle, ShieldCheck } from 'lucide-react';
import './RedeemPoints.css';

export const RedeemPoints: React.FC = () => {
  const { user } = useAuth();
  const { getUserBalance, getSetting, getRupeeRate, requestRedemption } = useData();
  const navigate = useNavigate();

  if (!user) return null;

  const currentBalance = getUserBalance(user.id);
  const minPoints = Number(getSetting('min_redeem_points', '500'));
  const rupeeRate = getRupeeRate();

  const [pointsToRedeem, setPointsToRedeem] = useState<number>(
    Math.max(minPoints, Math.floor(Math.min(currentBalance, minPoints) / 100) * 100)
  );
  const [error, setError] = useState<string | null>(null);

  const voucherValue = (pointsToRedeem * rupeeRate).toLocaleString('en-IN');
  const isEligibleToRedeem = currentBalance >= minPoints;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const res = requestRedemption(user.id, pointsToRedeem);
    if (res.error) {
      setError(res.error);
    } else {
      navigate('/me/redemptions');
    }
  };

  return (
    <div className="grid g2">
      <div className="card">
        <h3>Redeem Your Points</h3>
        <p className="muted small" style={{ marginTop: '4px', marginBottom: '18px' }}>
          You currently have <strong>{currentBalance.toLocaleString('en-IN')}</strong> available points.
          Minimum redemption is {minPoints} points, in steps of 100.
        </p>

        {error && (
          <div className="alert a-error" style={{ marginBottom: '16px' }}>
            <AlertCircle size={18} />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label htmlFor="redeem-points">Points to Redeem</label>
            <input
              id="redeem-points"
              type="number"
              min={minPoints}
              max={currentBalance}
              step="100"
              value={pointsToRedeem}
              onChange={(e) => setPointsToRedeem(Number(e.target.value))}
              disabled={!isEligibleToRedeem}
              required
            />
            <span className="small muted">Exchange rate: 100 points = Rs {(100 * rupeeRate).toFixed(0)}</span>
          </div>

          <div className="form-group" style={{ margin: '20px 0' }}>
            <label>Calculated Retail Voucher Amount</label>
            <div style={{ fontSize: '2rem', fontWeight: 800, color: 'var(--primary)' }}>
              Rs {voucherValue}
            </div>
          </div>

          <button
            type="submit"
            className="btn btn-accent"
            style={{ width: '100%', padding: '12px' }}
            disabled={!isEligibleToRedeem || pointsToRedeem > currentBalance || pointsToRedeem < minPoints}
          >
            <Gift size={18} /> Submit Redemption Request
          </button>

          {!isEligibleToRedeem && (
            <p className="muted small" style={{ marginTop: '12px', color: 'var(--danger)' }}>
              You need at least {minPoints} points to request a gift voucher.
            </p>
          )}
        </form>
      </div>

      <div className="card">
        <h3>Redemption Workflow</h3>
        <p className="muted small" style={{ marginTop: '4px', marginBottom: '16px' }}>
          How your gift voucher request is processed by the HR department:
        </p>

        <ol style={{ paddingLeft: '20px', lineHeight: 1.8, color: 'var(--t2)', fontSize: '0.92rem' }}>
          <li>
            <strong>Instant Reservation:</strong> The requested points are held from your active balance immediately to avoid double redemption.
          </li>
          <li>
            <strong>Automated Notification:</strong> An email notification with the request details is automatically dispatched to the HR mailbox ({getSetting('hr_email', 'hr@vcreatek.com')}).
          </li>
          <li>
            <strong>Procurement &amp; Issuance:</strong> HR reviews the request, purchases the online gift voucher, and records the voucher provider, amount, and reference code.
          </li>
          <li>
            <strong>Voucher Delivery:</strong> You receive an email notification with the credentials and can also inspect it anytime under your Redemption History.
          </li>
        </ol>

        <div
          style={{
            marginTop: '24px',
            padding: '14px',
            borderRadius: 'var(--r12)',
            background: 'var(--focus)',
            border: '1px solid #c7d2fe',
            display: 'flex',
            alignItems: 'center',
            gap: '12px',
          }}
        >
          <ShieldCheck size={24} color="var(--primary)" />
          <div className="small">
            <strong>Corporate Guarantee:</strong> All vouchers are sourced from reputable retailers and delivered within 3-5 business days.
          </div>
        </div>
      </div>
    </div>
  );
};

export default RedeemPoints;
