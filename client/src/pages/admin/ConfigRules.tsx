import React, { useState } from 'react';
import { useData } from '../../hooks/useData';
import { AwardType, EligibilityRule, Setting } from '../../types';
import DataTable, { Column } from '../../components/common/DataTable';
import { Save, PlusCircle, CheckCircle2 } from 'lucide-react';

export const ConfigRules: React.FC = () => {
  const {
    data,
    saveAwardType,
    addAwardType,
    saveEligibilityRule,
    saveSetting,
  } = useData();

  const [awardTypeEdits, setAwardTypeEdits] = useState<Record<string, Partial<AwardType>>>({});
  const [ruleEdits, setRuleEdits] = useState<Record<string, Partial<EligibilityRule>>>({});
  const [settingEdits, setSettingEdits] = useState<Record<string, string>>({});
  const [feedback, setFeedback] = useState<string | null>(null);

  // New type form
  const [newTypeName, setNewTypeName] = useState('');
  const [newTypePoints, setNewTypePoints] = useState(100);
  const [newTypeValue, setNewTypeValue] = useState(50);
  const [newTypeQuota, setNewTypeQuota] = useState(10);

  const handleTypeFieldChange = (id: string, field: keyof AwardType, val: unknown) => {
    setAwardTypeEdits((prev) => ({
      ...prev,
      [id]: {
        ...prev[id],
        [field]: val,
      },
    }));
  };

  const handleSaveAwardType = (t: AwardType) => {
    const edits = awardTypeEdits[t.id] || {};
    const updated: AwardType = {
      ...t,
      ...edits,
    };
    saveAwardType(updated);
    setFeedback(`Award tier "${updated.name}" updated successfully.`);
  };

  const handleAddAwardType = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTypeName.trim()) return;

    addAwardType({
      name: newTypeName.trim(),
      description: '',
      points: Number(newTypePoints),
      value_rs: Number(newTypeValue),
      per_leader_per_year: Number(newTypeQuota),
      frequency: 'ANYTIME',
      needs_approval: 0,
      gives_certificate: 1,
      notes: '',
      is_active: 1,
    });

    setFeedback(`New award tier "${newTypeName}" added successfully.`);
    setNewTypeName('');
    setNewTypePoints(100);
    setNewTypeValue(50);
    setNewTypeQuota(10);
  };

  const handleRuleChange = (id: string, field: keyof EligibilityRule, val: unknown) => {
    setRuleEdits((prev) => ({
      ...prev,
      [id]: {
        ...prev[id],
        [field]: val,
      },
    }));
  };

  const handleSaveRule = (r: EligibilityRule) => {
    const edits = ruleEdits[r.id] || {};
    const updated: EligibilityRule = {
      ...r,
      ...edits,
    };
    saveEligibilityRule(updated);
    setFeedback(`Eligibility rule for ${updated.employment_type} updated successfully.`);
  };

  const handleSaveSetting = (s: Setting) => {
    const val = settingEdits[s.key] !== undefined ? settingEdits[s.key] : s.value;
    saveSetting(s.key, val);
    setFeedback(`Setting "${s.key}" updated to "${val}".`);
  };

  const awardColumns: Column<AwardType>[] = [
    {
      header: 'Tier Name',
      render: (t) => {
        const edits = awardTypeEdits[t.id] || {};
        return (
          <input
            type="text"
            value={edits.name ?? t.name}
            onChange={(e) => handleTypeFieldChange(t.id, 'name', e.target.value)}
            style={{ width: '130px', padding: '6px 10px', fontSize: '0.88rem' }}
          />
        );
      },
    },
    {
      header: 'Points',
      numeric: true,
      render: (t) => {
        const edits = awardTypeEdits[t.id] || {};
        return (
          <input
            type="number"
            value={edits.points ?? t.points}
            onChange={(e) => handleTypeFieldChange(t.id, 'points', Number(e.target.value))}
            style={{ width: '85px', padding: '6px 10px', fontSize: '0.88rem' }}
          />
        );
      },
    },
    {
      header: 'Value (Rs)',
      numeric: true,
      render: (t) => {
        const edits = awardTypeEdits[t.id] || {};
        return (
          <input
            type="number"
            value={edits.value_rs ?? t.value_rs}
            onChange={(e) => handleTypeFieldChange(t.id, 'value_rs', Number(e.target.value))}
            style={{ width: '85px', padding: '6px 10px', fontSize: '0.88rem' }}
          />
        );
      },
    },
    {
      header: 'Per Manager / Yr',
      numeric: true,
      render: (t) => {
        const edits = awardTypeEdits[t.id] || {};
        return (
          <input
            type="number"
            value={edits.per_leader_per_year ?? t.per_leader_per_year}
            onChange={(e) => handleTypeFieldChange(t.id, 'per_leader_per_year', Number(e.target.value))}
            style={{ width: '80px', padding: '6px 10px', fontSize: '0.88rem' }}
          />
        );
      },
    },
    {
      header: 'Frequency',
      render: (t) => {
        const edits = awardTypeEdits[t.id] || {};
        return (
          <select
            value={edits.frequency ?? t.frequency}
            onChange={(e) => handleTypeFieldChange(t.id, 'frequency', e.target.value)}
            style={{ width: '120px', padding: '6px 8px', fontSize: '0.85rem' }}
          >
            <option value="ANYTIME">ANYTIME</option>
            <option value="QUARTERLY">QUARTERLY</option>
            <option value="HALF_YEARLY">HALF_YEARLY</option>
            <option value="YEARLY">YEARLY</option>
          </select>
        );
      },
    },
    {
      header: 'Approval',
      render: (t) => {
        const edits = awardTypeEdits[t.id] || {};
        const isReq = edits.needs_approval !== undefined ? Boolean(edits.needs_approval) : Boolean(t.needs_approval);
        return (
          <label className="small" style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
            <input
              type="checkbox"
              checked={isReq}
              onChange={(e) => handleTypeFieldChange(t.id, 'needs_approval', e.target.checked ? 1 : 0)}
              style={{ width: 'auto' }}
            />
            Required
          </label>
        );
      },
    },
    {
      header: 'Status',
      render: (t) => {
        const edits = awardTypeEdits[t.id] || {};
        const isActive = edits.is_active !== undefined ? Boolean(edits.is_active) : Boolean(t.is_active);
        return (
          <label className="small" style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
            <input
              type="checkbox"
              checked={isActive}
              onChange={(e) => handleTypeFieldChange(t.id, 'is_active', e.target.checked ? 1 : 0)}
              style={{ width: 'auto' }}
            />
            Active
          </label>
        );
      },
    },
    {
      header: 'Action',
      render: (t) => (
        <button
          className="btn btn-primary btn-sm"
          onClick={() => handleSaveAwardType(t)}
        >
          <Save size={13} /> Save
        </button>
      ),
    },
  ];

  const ruleColumns: Column<EligibilityRule>[] = [
    {
      header: 'Employment Type',
      render: (r) => <strong>{r.employment_type}</strong>,
    },
    {
      header: 'Minimum Months Tenure',
      numeric: true,
      render: (r) => {
        const edits = ruleEdits[r.id] || {};
        return (
          <input
            type="number"
            min="0"
            value={edits.min_months ?? r.min_months}
            onChange={(e) => handleRuleChange(r.id, 'min_months', Number(e.target.value))}
            style={{ width: '90px', padding: '6px 10px' }}
          />
        );
      },
    },
    {
      header: 'Exclude on Notice Period',
      render: (r) => {
        const edits = ruleEdits[r.id] || {};
        const isExcluded = edits.exclude_on_notice !== undefined ? Boolean(edits.exclude_on_notice) : Boolean(r.exclude_on_notice);
        return (
          <label className="small" style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
            <input
              type="checkbox"
              checked={isExcluded}
              onChange={(e) => handleRuleChange(r.id, 'exclude_on_notice', e.target.checked ? 1 : 0)}
              style={{ width: 'auto' }}
            />
            Yes
          </label>
        );
      },
    },
    {
      header: 'Action',
      render: (r) => (
        <button
          className="btn btn-primary btn-sm"
          onClick={() => handleSaveRule(r)}
        >
          <Save size={13} /> Save Rule
        </button>
      ),
    },
  ];

  const settingColumns: Column<Setting>[] = [
    {
      header: 'Configuration Key & Details',
      render: (s) => (
        <div>
          <strong>{s.key}</strong>
          <div className="small muted">{s.description}</div>
        </div>
      ),
    },
    {
      header: 'Value',
      render: (s) => {
        const currentVal = settingEdits[s.key] !== undefined ? settingEdits[s.key] : s.value;
        return (
          <input
            type="text"
            value={currentVal}
            onChange={(e) => setSettingEdits((prev) => ({ ...prev, [s.key]: e.target.value }))}
            style={{ width: '220px', padding: '6px 10px' }}
          />
        );
      },
    },
    {
      header: 'Action',
      render: (s) => (
        <button
          className="btn btn-primary btn-sm"
          onClick={() => handleSaveSetting(s)}
        >
          <Save size={13} /> Save Setting
        </button>
      ),
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

      {/* 1. Award Tiers Configuration */}
      <div className="card section">
        <div className="row" style={{ justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
          <h3>Award Tiers &amp; Quotas</h3>
          <span className="small muted">Dynamically Configurable</span>
        </div>
        <p className="muted small" style={{ marginBottom: '14px' }}>
          Adjust point values, monetary exchange parity, quotas, and approvals. Changes immediately affect future awards.
        </p>

        <DataTable
          columns={awardColumns}
          data={data.award_types}
        />

        {/* Add New Award Tier */}
        <form onSubmit={handleAddAwardType} style={{ marginTop: '18px', paddingTop: '16px', borderTop: '1px solid var(--border)' }}>
          <div className="row" style={{ alignItems: 'flex-end', gap: '12px' }}>
            <div className="form-group" style={{ marginBottom: 0, flex: 1 }}>
              <label className="small">New Tier Name</label>
              <input
                type="text"
                placeholder="e.g. Champion, Innovator"
                value={newTypeName}
                onChange={(e) => setNewTypeName(e.target.value)}
                required
              />
            </div>
            <div className="form-group" style={{ marginBottom: 0, width: '110px' }}>
              <label className="small">Points</label>
              <input
                type="number"
                value={newTypePoints}
                onChange={(e) => setNewTypePoints(Number(e.target.value))}
                required
              />
            </div>
            <div className="form-group" style={{ marginBottom: 0, width: '110px' }}>
              <label className="small">Value (Rs)</label>
              <input
                type="number"
                value={newTypeValue}
                onChange={(e) => setNewTypeValue(Number(e.target.value))}
                required
              />
            </div>
            <div className="form-group" style={{ marginBottom: 0, width: '120px' }}>
              <label className="small">Quota / Mgr</label>
              <input
                type="number"
                value={newTypeQuota}
                onChange={(e) => setNewTypeQuota(Number(e.target.value))}
                required
              />
            </div>
            <button type="submit" className="btn btn-secondary btn-sm" style={{ height: '42px' }}>
              <PlusCircle size={15} /> Add New Tier
            </button>
          </div>
        </form>
      </div>

      {/* 2 & 3: Eligibility & Settings */}
      <div className="grid g2 section">
        <div className="card">
          <h3>Eligibility Policies</h3>
          <p className="muted small" style={{ marginTop: '4px', marginBottom: '14px' }}>
            Tenure requirements and notice period filters per contract type
          </p>
          <DataTable
            columns={ruleColumns}
            data={data.eligibility_rules}
          />
          <p className="small muted" style={{ marginTop: '12px' }}>
            Note: Leadership members are flagged via the <code>is_leadership</code> field on user records and can give awards but cannot receive them.
          </p>
        </div>

        <div className="card">
          <h3>Platform Global Settings</h3>
          <p className="muted small" style={{ marginTop: '4px', marginBottom: '14px' }}>
            Conversion rates, minimum redemption thresholds, and system mailboxes
          </p>
          <DataTable
            columns={settingColumns}
            data={data.settings}
          />
        </div>
      </div>
    </div>
  );
};

export default ConfigRules;
