import React, { useState } from 'react';
import { useData } from '../../hooks/useData';
import { SeedData } from '../../api/seedData';
import { Download, Upload, RotateCcw, CheckCircle2, AlertCircle, Database } from 'lucide-react';

export const DataManagement: React.FC = () => {
  const { data, exportToExcel, importFromExcel, resetData } = useData();

  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    setMessage(null);
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const buffer = event.target?.result as ArrayBuffer;
      const res = importFromExcel(buffer);
      if (res.error) {
        setMessage({ type: 'error', text: `Import failed: ${res.error}` });
      } else {
        setMessage({
          type: 'success',
          text: `Workbook imported successfully! Updated ${res.loadedCount} tables in local state.`,
        });
      }
    };
    reader.readAsArrayBuffer(file);
  };

  const handleExport = () => {
    exportToExcel();
    setMessage({
      type: 'success',
      text: 'Export generated. Your complete multi-sheet Excel workbook has started downloading.',
    });
  };

  const handleReset = () => {
    if (window.confirm('Are you sure you want to reset all data back to original seed defaults? Any unsaved edits will be lost.')) {
      resetData();
      setMessage({ type: 'success', text: 'All platform records have been reset to factory seed defaults.' });
    }
  };

  const tableList: { name: keyof SeedData; label: string; count: number }[] = [
    { name: 'users', label: 'Employees & Leaders (users)', count: data.users.length },
    { name: 'eligibility_rules', label: 'Tenure & Notice Rules (eligibility_rules)', count: data.eligibility_rules.length },
    { name: 'award_types', label: 'Award Tiers & Points (award_types)', count: data.award_types.length },
    { name: 'settings', label: 'Platform Settings (settings)', count: data.settings.length },
    { name: 'leader_inventory', label: 'Leader Quotas (leader_inventory)', count: data.leader_inventory.length },
    { name: 'inventory_transactions', label: 'Allocation History (inventory_transactions)', count: data.inventory_transactions.length },
    { name: 'awards', label: 'Issued & Pending Awards (awards)', count: data.awards.length },
    { name: 'point_transactions', label: 'Points Ledger (point_transactions)', count: data.point_transactions.length },
    { name: 'redemption_requests', label: 'Voucher Redemptions (redemption_requests)', count: data.redemption_requests.length },
    { name: 'certificates', label: 'Registered Certificates (certificates)', count: data.certificates.length },
    { name: 'email_log', label: 'Notification Log (email_log)', count: data.email_log.length },
    { name: 'reminders', label: 'Reminders (reminders)', count: data.reminders.length },
    { name: 'audit_log', label: 'System Audit Trail (audit_log)', count: data.audit_log.length },
  ];

  return (
    <div>
      {message && (
        <div className={`alert a-${message.type === 'error' ? 'error' : 'success'}`} style={{ marginBottom: '18px' }}>
          {message.type === 'error' ? <AlertCircle size={18} /> : <CheckCircle2 size={18} />}
          <span>{message.text}</span>
        </div>
      )}

      <div className="grid g2">
        {/* Left: Actions */}
        <div className="card">
          <h3>Excel Integration &amp; Data Reset</h3>
          <p className="muted small" style={{ marginTop: '4px', marginBottom: '20px' }}>
            Seamlessly synchronize your R&amp;R data with corporate spreadsheet templates.
          </p>

          <div style={{ marginBottom: '26px' }}>
            <h4>1. Import from Excel (.xlsx)</h4>
            <p className="small muted" style={{ margin: '6px 0 12px' }}>
              Upload <code>RR_Dummy_Data.xlsx</code> or an updated workbook. Each worksheet corresponding to a table name replaces that dataset in memory.
            </p>
            <label className="btn btn-primary" style={{ cursor: 'pointer' }}>
              <Upload size={16} /> Choose .xlsx File to Import
              <input type="file" accept=".xlsx" style={{ display: 'none' }} onChange={handleFileUpload} />
            </label>
          </div>

          <div style={{ marginBottom: '26px', borderTop: '1px solid var(--border)', paddingTop: '20px' }}>
            <h4>2. Export Full Platform Database</h4>
            <p className="small muted" style={{ margin: '6px 0 12px' }}>
              Generate an official Microsoft Excel (.xlsx) workbook packaging all 13 normalized tables into individual sheets.
            </p>
            <button className="btn btn-secondary" onClick={handleExport}>
              <Download size={16} /> Export to Excel (.xlsx)
            </button>
          </div>

          <div style={{ borderTop: '1px solid var(--border)', paddingTop: '20px' }}>
            <h4 style={{ color: 'var(--danger)' }}>3. Reset Platform Data</h4>
            <p className="small muted" style={{ margin: '6px 0 12px' }}>
              Restore original factory seed data (23 employees, clean allocations, baseline awards).
            </p>
            <button className="btn btn-danger btn-sm" onClick={handleReset}>
              <RotateCcw size={14} /> Restore Initial Sample Data
            </button>
          </div>
        </div>

        {/* Right: Table Counts */}
        <div className="card">
          <div className="row" style={{ justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
            <h3>Active Entity Summary</h3>
            <span className="badge b-info">13 Data Entities</span>
          </div>

          <div className="tbl">
            <table>
              <thead>
                <tr>
                  <th>Data Entity Table</th>
                  <th className="num">Active Records</th>
                </tr>
              </thead>
              <tbody>
                {tableList.map((t) => (
                  <tr key={t.name}>
                    <td>
                      <strong>{t.label}</strong>
                    </td>
                    <td className="num">{t.count}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div
            style={{
              marginTop: '20px',
              padding: '14px',
              borderRadius: 'var(--r12)',
              background: '#f8fafc',
              border: '1px solid var(--border)',
            }}
          >
            <div className="row" style={{ gap: '10px' }}>
              <Database size={18} color="var(--primary)" />
              <div className="small">
                <strong>Local Persistence:</strong> All operations and additions in this session are saved to your browser's persistent store and will survive page refreshes.
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DataManagement;
