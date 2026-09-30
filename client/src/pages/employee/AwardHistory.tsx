import React, { useState } from 'react';
import { useAuth } from '../../hooks/useAuth';
import { useData } from '../../hooks/useData';
import { Award } from '../../types';
import DataTable, { Column } from '../../components/common/DataTable';
import Badge from '../../components/common/Badge';
import CertificateModal from '../../components/common/CertificateModal';
import { ExternalLink } from 'lucide-react';
import './AwardHistory.css';

export const AwardHistory: React.FC = () => {
  const { user } = useAuth();
  const { data, getUserName, getAwardTypeName } = useData();

  const [selectedAward, setSelectedAward] = useState<Award | null>(null);
  const [isCertOpen, setIsCertOpen] = useState(false);
  const [filterType, setFilterType] = useState<string>('');

  if (!user) return null;

  let awards = data.awards.filter((a) => a.recipient_id === user.id);
  if (filterType) {
    awards = awards.filter((a) => a.award_type_id === filterType);
  }
  awards.sort((a, b) => (b.issued_at || b.created_at).localeCompare(a.issued_at || a.created_at));

  const handleOpenCert = (award: Award) => {
    setSelectedAward(award);
    setIsCertOpen(true);
  };

  const columns: Column<Award>[] = [
    {
      header: 'Issued Date',
      render: (r) => (
        <span>
          {r.issued_at
            ? new Date(r.issued_at).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })
            : new Date(r.created_at).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}
        </span>
      ),
    },
    {
      header: 'Award Tier',
      render: (r) => <strong>{getAwardTypeName(r.award_type_id)}</strong>,
    },
    {
      header: 'Points',
      numeric: true,
      render: (r) => <strong>{r.points}</strong>,
    },
    {
      header: 'Nominated By',
      render: (r) => getUserName(r.given_by),
    },
    {
      header: 'Justification / Reason',
      render: (r) => <span style={{ fontSize: '0.88rem' }}>{r.reason}</span>,
    },
    {
      header: 'Status',
      render: (r) => <Badge status={r.status} />,
    },
    {
      header: 'Certificate',
      render: (r) => {
        const cert = data.certificates.find((c) => c.award_id === r.id);
        if (cert && r.status === 'ISSUED') {
          return (
            <button className="btn btn-secondary btn-sm" onClick={() => handleOpenCert(r)}>
              <ExternalLink size={13} /> {cert.certificate_no}
            </button>
          );
        }
        return <span className="muted small">—</span>;
      },
    },
  ];

  return (
    <div className="card">
      <div className="row" style={{ justifyContent: 'space-between', alignItems: 'center', marginBottom: '18px' }}>
        <div>
          <h3>My Award History</h3>
          <p className="muted small">Recognitions and honours granted to you</p>
        </div>

        <div className="row" style={{ gap: '10px' }}>
          <select
            style={{ width: 'auto' }}
            value={filterType}
            onChange={(e) => setFilterType(e.target.value)}
          >
            <option value="">All Award Categories</option>
            {data.award_types.map((t) => (
              <option key={t.id} value={t.id}>
                {t.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      <DataTable
        columns={columns}
        data={awards}
        emptyMessage="No awards found matching your filter."
      />

      <CertificateModal
        award={selectedAward}
        isOpen={isCertOpen}
        onClose={() => setIsCertOpen(false)}
      />
    </div>
  );
};

export default AwardHistory;
