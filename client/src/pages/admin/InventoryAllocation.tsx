import React, { useState } from 'react';
import { useAuth } from '../../hooks/useAuth';
import { useData } from '../../hooks/useData';
import { InventoryTransaction } from '../../types';
import DataTable, { Column } from '../../components/common/DataTable';
import Badge from '../../components/common/Badge';
import { PlusCircle } from 'lucide-react';

const TIER_COLORS: Record<string, string> = {
  Beacon: '#8fbc5a',
  Bronze: '#cd7f32',
  Silver: '#8e9aa8',
  Gold: '#d4a017',
  Diamond: '#5fb8d8',
};

export const InventoryAllocation: React.FC = () => {
  const { user } = useAuth();
  const {
    data,
    getUserName,
    getAwardTypeName,
    getLeaderInventory,
    allocateInventory,
    revokeInventoryUnits,
  } = useData();

  const currentYear = new Date().getFullYear();
  const leaders = data.users.filter((u) => u.role === 'LEADER' && u.is_active);

  const [selectedLeaderId, setSelectedLeaderId] = useState<string>(leaders[0]?.id || '');
  const [allocationQuantities, setAllocationQuantities] = useState<Record<string, number>>({});
  const [allocateReason, setAllocateReason] = useState<string>(`Annual allocation for ${currentYear}`);
  const [revokeQuantities, setRevokeQuantities] = useState<Record<string, number>>({});
  const [revokeReason, setRevokeReason] = useState<string>('');
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  if (!user) return null;

  const activeTypes = data.award_types.filter((t) => t.is_active);
  const managerInvs = activeTypes.map((t) => {
    const inv = getLeaderInventory(selectedLeaderId, t.id, currentYear) || {
      allocated: 0,
      used: 0,
      remaining: 0,
    };
    return { type: t, inventory: inv };
  });

  const handleAllocate = (e: React.FormEvent) => {
    e.preventDefault();
    setFeedback(null);

    const res = allocateInventory(selectedLeaderId, allocationQuantities, allocateReason.trim());
    if (res.error) {
      setFeedback({ type: 'error', message: res.error });
    } else {
      setFeedback({ type: 'success', message: `Units successfully allocated to ${getUserName(selectedLeaderId)}.` });
      setAllocationQuantities({});
    }
  };

  const handleRevoke = (typeId: string) => {
    setFeedback(null);
    const qty = Number(revokeQuantities[typeId] || 0);
    const res = revokeInventoryUnits(selectedLeaderId, typeId, qty, revokeReason.trim());
    if (res.error) {
      setFeedback({ type: 'error', message: res.error });
    } else {
      setFeedback({ type: 'success', message: `Units reclaimed from ${getUserName(selectedLeaderId)}.` });
      setRevokeQuantities((prev) => ({ ...prev, [typeId]: 0 }));
      setRevokeReason('');
    }
  };

  const leaderTxns = data.inventory_transactions
    .filter((t) => t.leader_id === selectedLeaderId)
    .sort((a, b) => b.created_at.localeCompare(a.created_at));

  const historyColumns: Column<InventoryTransaction>[] = [
    {
      header: 'Date',
      render: (r) => (
        <span>
          {new Date(r.created_at).toLocaleDateString('en-IN', {
            day: '2-digit',
            month: 'short',
            year: 'numeric',
          })}
        </span>
      ),
    },
    {
      header: 'Action',
      render: (r) => <Badge status={r.type === 'ALLOCATE' ? 'ISSUED' : 'REVOKED'} label={r.type} />,
    },
    {
      header: 'Award Tier',
      render: (r) => getAwardTypeName(r.award_type_id),
    },
    {
      header: 'Quantity',
      numeric: true,
      render: (r) => <strong>{r.quantity}</strong>,
    },
    {
      header: 'Reason',
      render: (r) => <span style={{ fontSize: '0.86rem' }}>{r.reason}</span>,
    },
    {
      header: 'Executed By',
      render: (r) => r.done_by,
    },
  ];

  return (
    <div>
      {/* Manager Selector Bar */}
      <div className="card section">
        <div className="row" style={{ alignItems: 'center', gap: '14px' }}>
          <strong>Select Manager:</strong>
          <select
            style={{ width: 'auto', minWidth: '280px' }}
            value={selectedLeaderId}
            onChange={(e) => {
              setSelectedLeaderId(e.target.value);
              setFeedback(null);
            }}
          >
            {leaders.map((l) => (
              <option key={l.id} value={l.id}>
                {l.full_name} ({l.department} &bull; {l.vcreatek_id})
              </option>
            ))}
          </select>
        </div>
      </div>

      {feedback && (
        <div className={`alert a-${feedback.type === 'error' ? 'error' : 'success'}`} style={{ marginBottom: '18px' }}>
          <span>{feedback.message}</span>
        </div>
      )}

      {/* 2 Grids: Allocate and Current Inventory / Revocation */}
      <div className="grid g2 section">
        {/* Allocate Units */}
        <div className="card">
          <h3>Allocate Award Units ({currentYear})</h3>
          <p className="muted small" style={{ marginTop: '4px', marginBottom: '16px' }}>
            Assign new award units to {getUserName(selectedLeaderId)}.
          </p>

          <form onSubmit={handleAllocate}>
            {activeTypes.map((t) => {
              const col = TIER_COLORS[t.name] || 'var(--primary)';
              return (
                <div
                  key={t.id}
                  className="row"
                  style={{ justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}
                >
                  <span style={{ fontWeight: 600, display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <i className="dot" style={{ display: 'inline-block', width: '10px', height: '10px', borderRadius: '50%', backgroundColor: col }} />
                    {t.name}
                  </span>
                  <input
                    type="number"
                    min="0"
                    placeholder="0"
                    value={allocationQuantities[t.id] ?? t.per_leader_per_year}
                    onChange={(e) =>
                      setAllocationQuantities((prev) => ({
                        ...prev,
                        [t.id]: Number(e.target.value),
                      }))
                    }
                    style={{ width: '110px' }}
                  />
                </div>
              );
            })}

            <div className="form-group" style={{ marginTop: '16px' }}>
              <label htmlFor="allocate-reason">Allocation Rationale / Remarks</label>
              <input
                id="allocate-reason"
                type="text"
                value={allocateReason}
                onChange={(e) => setAllocateReason(e.target.value)}
                required
              />
            </div>

            <button type="submit" className="btn btn-primary" style={{ width: '100%', marginTop: '8px' }}>
              <PlusCircle size={16} /> Allocate Award Units
            </button>
          </form>
        </div>

        {/* Current Inventory & Revocation */}
        <div className="card">
          <h3>Current Quota &amp; Reclaim Unused Units</h3>
          <p className="muted small" style={{ marginTop: '4px', marginBottom: '14px' }}>
            Only unspent/remaining units can be reclaimed back to the corporate pool.
          </p>

          <div style={{ marginBottom: '18px' }}>
            <div className="tbl">
              <table>
                <thead>
                  <tr>
                    <th>Award Tier</th>
                    <th className="num">Alloc</th>
                    <th className="num">Used</th>
                    <th className="num">Rem</th>
                    <th>Reclaim</th>
                  </tr>
                </thead>
                <tbody>
                  {managerInvs.map(({ type, inventory }) => (
                    <tr key={type.id}>
                      <td>
                        <strong>{type.name}</strong>
                      </td>
                      <td className="num">{inventory.allocated}</td>
                      <td className="num">{inventory.used}</td>
                      <td className="num">
                        <strong>{inventory.remaining}</strong>
                      </td>
                      <td>
                        <div className="row" style={{ gap: '6px' }}>
                          <input
                            type="number"
                            min="0"
                            max={inventory.remaining}
                            value={revokeQuantities[type.id] ?? 0}
                            onChange={(e) =>
                              setRevokeQuantities((prev) => ({
                                ...prev,
                                [type.id]: Number(e.target.value),
                              }))
                            }
                            style={{ width: '65px', padding: '6px 8px', fontSize: '0.85rem' }}
                          />
                          <button
                            type="button"
                            className="btn btn-danger btn-sm"
                            disabled={!inventory.remaining || !revokeQuantities[type.id]}
                            onClick={() => handleRevoke(type.id)}
                          >
                            Revoke
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="form-group" style={{ marginTop: '14px' }}>
              <label htmlFor="revoke-reason">Reclaim Reason (Required to revoke)</label>
              <input
                id="revoke-reason"
                type="text"
                placeholder="e.g. Organizational re-alignment or role departure"
                value={revokeReason}
                onChange={(e) => setRevokeReason(e.target.value)}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Allocation History */}
      <div className="card">
        <h3>Inventory Transaction History for {getUserName(selectedLeaderId)}</h3>
        <div style={{ marginTop: '12px' }}>
          <DataTable
            columns={historyColumns}
            data={leaderTxns}
            emptyMessage="No inventory transactions recorded for this manager."
          />
        </div>
      </div>
    </div>
  );
};

export default InventoryAllocation;
