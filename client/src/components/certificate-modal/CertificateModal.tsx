import React from 'react';
import { Modal } from '../modal/Modal';
import { Award } from '../../types';
import { useData } from '../../hooks/useData';
import vctLogo from '../../assets/vct.png';
import { Printer } from 'lucide-react';
import './CertificateModal.css';

interface CertificateModalProps {
  award: Award | null;
  isOpen: boolean;
  onClose: () => void;
}

export const CertificateModal: React.FC<CertificateModalProps> = ({ award, isOpen, onClose }) => {
  const { getUser, getUserName, getAwardTypeName, data } = useData();

  if (!award) return null;

  const recipient = getUser(award.recipient_id);
  const awardName = getAwardTypeName(award.award_type_id);
  const cert = data.certificates.find((c) => c.award_id === award.id);
  const certNumber = cert ? cert.certificate_no : `RR-${new Date().getFullYear()}-0001`;

  const formattedDate = award.issued_at
    ? new Date(award.issued_at).toLocaleDateString('en-IN', {
        day: '2-digit',
        month: 'long',
        year: 'numeric',
      })
    : new Date().toLocaleDateString('en-IN', { day: '2-digit', month: 'long', year: 'numeric' });

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      maxWidth="820px"
      footer={
        <>
          <button className="btn btn-secondary" onClick={() => window.print()}>
            <Printer size={16} /> Print / Save as PDF
          </button>
          <button className="btn btn-primary" onClick={onClose}>
            Close
          </button>
        </>
      }
    >
      <div className="cert-card" id="printable-certificate">
        <img src={vctLogo} alt="VCreaTek Logo" />
        <div className="title">Certificate of Recognition</div>
        <p style={{ marginTop: '16px', color: 'var(--t3)', fontStyle: 'italic', fontSize: '1rem' }}>
          This certificate is proudly presented to
        </p>

        <div className="name">{recipient?.full_name || getUserName(award.recipient_id)}</div>
        <p className="muted small" style={{ letterSpacing: '0.05em' }}>
          VCreaTek Employee ID: {recipient?.vcreatek_id || 'VCT-N/A'} &middot; {recipient?.department || ''}
        </p>

        <div className="award-name" style={{ marginTop: '14px' }}>
          In Recognition of Excellence &bull; {awardName} Tier
        </div>

        <p className="reason">"{award.reason}"</p>

        <div className="foot">
          <div>
            <p className="sig">
              <strong>Leadership Authorization</strong>
              <br />
              <span className="muted small">Awarded by {getUserName(award.given_by)}</span>
            </p>
          </div>

          <div style={{ textAlign: 'center' }}>
            <p className="sig">
              <strong>Human Resources</strong>
              <br />
              <span className="muted small">VCreaTek R&amp;R Program</span>
            </p>
          </div>

          <div style={{ textAlign: 'right' }}>
            <p className="small muted">Date of Issue: {formattedDate}</p>
            <p className="small" style={{ fontWeight: 700, letterSpacing: '0.05em', marginTop: '4px' }}>
              Tracking No: {certNumber}
            </p>
          </div>
        </div>
      </div>
    </Modal>
  );
};

export default CertificateModal;
