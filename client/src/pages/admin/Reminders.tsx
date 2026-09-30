import React, { useState } from 'react';
import { useAuth } from '../../hooks/useAuth';
import { useData } from '../../hooks/useData';
import { User, AwardType, Reminder } from '../../types';
import DataTable, { Column } from '../../components/common/DataTable';
import Badge from '../../components/common/Badge';
import { Send, CheckCircle2 } from 'lucide-react';

interface SuggestedReminder {
  leader: User;
  awardType: AwardType;
  code: 'NO_AWARDS_GIVEN' | 'INVENTORY_EXHAUSTED';
  message: string;
}

export const Reminders: React.FC = () => {
  const { user } = useAuth();
  const {
    data,
    getUserName,
    getAwardTypeName,
    getLeaderInventory,
    sendReminder,
  } = useData();

  const currentYear = new Date().getFullYear();
  const leaders = data.users.filter((u) => u.role === 'LEADER' && u.is_active);
  const activeTypes = data.award_types.filter((t) => t.is_active);

  const [manualLeaderId, setManualLeaderId] = useState<string>(leaders[0]?.id || '');
  const [manualMessage, setManualMessage] = useState<string>('');
  const [feedback, setFeedback] = useState<string | null>(null);

  if (!user) return null;

  // Build smart suggestions
  const suggestedReminders: SuggestedReminder[] = [];
  for (const l of leaders) {
    for (const t of activeTypes) {
      const inv = getLeaderInventory(l.id, t.id, currentYear);
      if (!inv || Number(inv.allocated) <= 0) continue;

      const hasGivenThisYear = data.awards.some(
        (a) =>
          a.given_by === l.id &&
          a.award_type_id === t.id &&
          ['ISSUED', 'PENDING_APPROVAL'].includes(a.status) &&
          a.created_at.startsWith(String(currentYear))
      );

      if (!hasGivenThisYear) {
        suggestedReminders.push({
          leader: l,
          awardType: t,
          code: 'NO_AWARDS_GIVEN',
          message: `You have not issued any ${t.name} awards this year. You have ${inv.remaining} units available in your inventory.`,
        });
      } else if (Number(inv.remaining) === 0) {
        suggestedReminders.push({
          leader: l,
          awardType: t,
          code: 'INVENTORY_EXHAUSTED',
          message: `Your ${t.name} award allocation for ${currentYear} is fully utilized. Great job recognizing the team!`,
        });
      }
    }
  }

  const handleSendSuggested = (s: SuggestedReminder) => {
    sendReminder(s.leader.id, s.awardType.id, s.code, s.message, user.id);
    setFeedback(`Reminder dispatched to ${s.leader.full_name}.`);
  };

  const handleSendManual = (e: React.FormEvent) => {
    e.preventDefault();
    if (!manualMessage.trim()) return;

    sendReminder(manualLeaderId, null, 'MANUAL', manualMessage.trim(), user.id);
    setFeedback(`Custom reminder dispatched to ${getUserName(manualLeaderId)}.`);
    setManualMessage('');
  };

  const suggestedColumns: Column<SuggestedReminder>[] = [
    {
      header: 'Manager',
      render: (r) => (
        <div>
          <strong>{r.leader.full_name}</strong>
          <div className="small muted">{r.leader.department}</div>
        </div>
      ),
    },
    {
      header: 'Award Tier',
      render: (r) => <strong>{r.awardType.name}</strong>,
    },
    {
      header: 'Trigger Condition',
      render: (r) => (
        <Badge
          status={r.code === 'NO_AWARDS_GIVEN' ? 'REQUESTED' : 'APPROVED'}
          label={r.code.replace(/_/g, ' ')}
        />
      ),
    },
    {
      header: 'Suggested Message',
      render: (r) => <span style={{ fontSize: '0.86rem' }}>{r.message}</span>,
    },
    {
      header: 'Action',
      render: (r) => (
        <button
          className="btn btn-primary btn-sm"
          onClick={() => handleSendSuggested(r)}
        >
          <Send size={13} /> Send
        </button>
      ),
    },
  ];

  const reminderLog = [...data.reminders].sort((a, b) => b.sent_at.localeCompare(a.sent_at));

  const logColumns: Column<Reminder>[] = [
    {
      header: 'Date & Time',
      render: (r) => (
        <span>
          {new Date(r.sent_at).toLocaleString('en-IN', {
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
      header: 'Manager',
      render: (r) => <strong>{getUserName(r.leader_id)}</strong>,
    },
    {
      header: 'Award Tier',
      render: (r) => (r.award_type_id ? getAwardTypeName(r.award_type_id) : 'All Tiers'),
    },
    {
      header: 'Reason',
      render: (r) => r.reason.replace(/_/g, ' '),
    },
    {
      header: 'Message Dispatched',
      render: (r) => <span style={{ fontSize: '0.86rem' }}>{r.message}</span>,
    },
    {
      header: 'Sent By',
      render: (r) => getUserName(r.sent_by),
    },
  ];

  return (
    <div>
      {feedback && (
        <div className="alert a-success" style={{ marginBottom: '18px' }}>
          <CheckCircle2 size={18} />
          <span>{feedback}</span>
        </div>
      )}

      {/* Suggested & Manual Reminders */}
      <div className="grid g2 section">
        {/* Suggested Reminders */}
        <div className="card">
          <div className="row" style={{ justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
            <h3>Automated Inventory Alerts</h3>
            <span className="badge b-info">{suggestedReminders.length} Alerts</span>
          </div>
          <p className="muted small" style={{ marginBottom: '14px' }}>
            Identifies managers who have unspent award tiers or exhausted quotas in {currentYear}.
          </p>

          <DataTable
            columns={suggestedColumns}
            data={suggestedReminders}
            emptyMessage="All managers have actively utilized their award categories this year."
          />
        </div>

        {/* Manual Reminder Composer */}
        <div className="card">
          <h3>Compose Custom Reminder</h3>
          <p className="muted small" style={{ marginTop: '4px', marginBottom: '16px' }}>
            Send an official email reminder to a department manager regarding award timelines.
          </p>

          <form onSubmit={handleSendManual}>
            <div className="form-group">
              <label htmlFor="manual-leader">Recipient Manager</label>
              <select
                id="manual-leader"
                value={manualLeaderId}
                onChange={(e) => setManualLeaderId(e.target.value)}
              >
                {leaders.map((l) => (
                  <option key={l.id} value={l.id}>
                    {l.full_name} ({l.department})
                  </option>
                ))}
              </select>
            </div>

            <div className="form-group" style={{ marginTop: '14px' }}>
              <label htmlFor="manual-msg">Reminder Content</label>
              <textarea
                id="manual-msg"
                placeholder="e.g. Friendly reminder to submit quarterly Bronze/Silver nominations before the 30th..."
                value={manualMessage}
                onChange={(e) => setManualMessage(e.target.value)}
                required
              />
            </div>

            <button type="submit" className="btn btn-secondary btn-sm" style={{ marginTop: '10px' }}>
              <Send size={14} /> Dispatch Reminder
            </button>
          </form>
        </div>
      </div>

      {/* Sent History */}
      <div className="card">
        <h3>Dispatched Reminders Audit</h3>
        <div style={{ marginTop: '12px' }}>
          <DataTable
            columns={logColumns}
            data={reminderLog}
            emptyMessage="No reminders dispatched yet."
          />
        </div>
      </div>
    </div>
  );
};

export default Reminders;
