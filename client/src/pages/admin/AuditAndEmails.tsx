import React, { useState } from 'react';
import { useData } from '../../hooks/useData';
import { AuditLog, EmailLog, Certificate, Award } from '../../types';
import DataTable, { Column } from '../../components/common/DataTable';
import Badge from '../../components/common/Badge';
import CertificateModal from '../../components/common/CertificateModal';
import { ShieldCheck, Mail, FileText, ExternalLink } from 'lucide-react';

export const AuditAndEmails: React.FC = () => {
  const { data, getUserName, getAwardTypeName } = useData();

  const [activeTab, setActiveTab] = useState<'audit' | 'email' | 'cert'>('audit');
  const [selectedAward, setSelectedAward] = useState<Award | null>(null);
  const [isCertOpen, setIsCertOpen] = useState(false);

  const auditRows = [...data.audit_log].sort((a, b) => b.done_at.localeCompare(a.done_at));
  const emailRows = [...data.email_log].sort((a, b) => b.created_at.localeCompare(a.created_at));
  const certRows = [...data.certificates].sort((a, b) => b.created_at.localeCompare(a.created_at));

  const auditColumns: Column<AuditLog>[] = [
    {
      header: 'Timestamp',
      render: (r) => (
        <span>
          {new Date(r.done_at).toLocaleString('en-IN', {
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
      header: 'User',
      render: (r) => <strong>{r.user_id ? getUserName(r.user_id) : 'System / Admin'}</strong>,
    },
    {
      header: 'Action',
      render: (r) => <Badge status={r.action} variant="info" />,
    },
    {
      header: 'Target Entity',
      render: (r) => <span className="small muted">{r.table_name}</span>,
    },
    {
      header: 'Changes / New Values',
      render: (r) => {
        let text = r.new_value || '';
        try {
          if (r.new_value) {
            const parsed = JSON.parse(r.new_value);
            text = Object.entries(parsed)
              .map(([k, v]) => `${k}: ${v}`)
              .join(', ');
          }
        } catch {
          // ignore
        }
        return <span style={{ fontSize: '0.84rem' }}>{text}</span>;
      },
    },
    {
      header: 'Reason / Remarks',
      render: (r) => <span style={{ fontSize: '0.84rem' }}>{r.reason || '—'}</span>,
    },
  ];

  const emailColumns: Column<EmailLog>[] = [
    {
      header: 'Dispatched At',
      render: (r) => (
        <span>
          {new Date(r.created_at).toLocaleString('en-IN', {
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
      header: 'Event Trigger',
      render: (r) => <Badge status={r.event} variant="info" />,
    },
    {
      header: 'Recipient Email',
      render: (r) => <strong>{r.to_email}</strong>,
    },
    {
      header: 'Subject',
      render: (r) => <span style={{ fontSize: '0.88rem' }}>{r.subject}</span>,
    },
    {
      header: 'Status',
      render: (r) => (
        <div>
          <Badge status={r.status} />
          {r.error && (
            <div className="small muted" style={{ color: 'var(--danger)', marginTop: '2px' }}>
              {r.error}
            </div>
          )}
        </div>
      ),
    },
  ];

  const certColumns: Column<Certificate>[] = [
    {
      header: 'Certificate No',
      render: (r) => <strong>{r.certificate_no}</strong>,
    },
    {
      header: 'Recipient',
      render: (r) => {
        const a = data.awards.find((x) => x.id === r.award_id);
        return a ? <strong>{getUserName(a.recipient_id)}</strong> : '—';
      },
    },
    {
      header: 'Award Tier',
      render: (r) => {
        const a = data.awards.find((x) => x.id === r.award_id);
        return a ? getAwardTypeName(a.award_type_id) : '—';
      },
    },
    {
      header: 'Issued Date',
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
      header: 'Status',
      render: (r) => <Badge status={r.status} />,
    },
    {
      header: 'Action',
      render: (r) => {
        const a = data.awards.find((x) => x.id === r.award_id);
        if (a) {
          return (
            <button
              className="btn btn-secondary btn-sm"
              onClick={() => {
                setSelectedAward(a);
                setIsCertOpen(true);
              }}
            >
              <ExternalLink size={13} /> View
            </button>
          );
        }
        return null;
      },
    },
  ];

  return (
    <div className="card">
      <div className="row" style={{ justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
        <div>
          <h3>System Audit Trail &amp; Communication Logs</h3>
          <p className="muted small">Comprehensive trace of configuration updates, email events, and digital certificates</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="tabs-bar">
        <button
          className={`tab-btn ${activeTab === 'audit' ? 'active' : ''}`}
          onClick={() => setActiveTab('audit')}
        >
          <ShieldCheck size={15} style={{ display: 'inline', verticalAlign: '-2px', marginRight: '6px' }} />
          Audit Log ({auditRows.length})
        </button>
        <button
          className={`tab-btn ${activeTab === 'email' ? 'active' : ''}`}
          onClick={() => setActiveTab('email')}
        >
          <Mail size={15} style={{ display: 'inline', verticalAlign: '-2px', marginRight: '6px' }} />
          Email Logs ({emailRows.length})
        </button>
        <button
          className={`tab-btn ${activeTab === 'cert' ? 'active' : ''}`}
          onClick={() => setActiveTab('cert')}
        >
          <FileText size={15} style={{ display: 'inline', verticalAlign: '-2px', marginRight: '6px' }} />
          Certificates Registry ({certRows.length})
        </button>
      </div>

      {activeTab === 'audit' && (
        <DataTable
          columns={auditColumns}
          data={auditRows}
          emptyMessage="No audit logs recorded yet."
        />
      )}

      {activeTab === 'email' && (
        <DataTable
          columns={emailColumns}
          data={emailRows}
          emptyMessage="No email dispatch logs recorded yet."
        />
      )}

      {activeTab === 'cert' && (
        <DataTable
          columns={certColumns}
          data={certRows}
          emptyMessage="No certificates registered yet."
        />
      )}

      <CertificateModal
        award={selectedAward}
        isOpen={isCertOpen}
        onClose={() => setIsCertOpen(false)}
      />
    </div>
  );
};

export default AuditAndEmails;
