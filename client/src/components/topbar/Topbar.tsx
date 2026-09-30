import React, { useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import { useData } from '../../hooks/useData';
import { LogOut, ArrowRightLeft, Sparkles, UserCheck } from 'lucide-react';
import Modal from '../modal/Modal';
import vctLogo from '../../assets/vct.png';
import './Topbar.css';

export const Topbar: React.FC = () => {
  const { user, logout, switchUser } = useAuth();
  const { data } = useData();
  const location = useLocation();
  const navigate = useNavigate();
  const [isSwitcherOpen, setIsSwitcherOpen] = useState(false);

  if (!user) return null;

  const routeMeta: Record<string, { title: string; subtitle: string }> = {
    '/me': { title: 'My rewards', subtitle: 'Your available points, awards, and certificates' },
    '/me/points': { title: 'My points ledger', subtitle: 'Every credit, redemption, and adjustment' },
    '/me/awards': { title: 'Award history', subtitle: 'Recognitions you have received from leadership' },
    '/me/redeem': { title: 'Redeem points', subtitle: 'Convert your points into retail gift vouchers' },
    '/me/redemptions': { title: 'Redemption history', subtitle: 'Live status and details of your voucher requests' },
    '/leader': { title: 'Manager dashboard', subtitle: 'Your award quota, allocations, and team recognitions' },
    '/leader/award': { title: 'Award employees', subtitle: 'Recognize team members with instant or nomination awards' },
    '/leader/awards': { title: 'Awards I have given', subtitle: 'Historical ledger of awards issued by you' },
    '/approvals': { title: 'Pending approvals', subtitle: 'Nominations awaiting your review and decision' },
    '/admin': { title: 'HR executive dashboard', subtitle: 'Organizational utilization, budget, and recognition health' },
    '/admin/allocate': { title: 'Inventory allocation', subtitle: 'Distribute award quotas to managers or reclaim unused units' },
    '/admin/redemptions': { title: 'Redemption fulfillment', subtitle: 'Review employee voucher requests and assign credentials' },
    '/admin/reminders': { title: 'Manager reminders', subtitle: 'Smart alerts for managers with unused quotas' },
    '/admin/config': { title: 'Award & eligibility rules', subtitle: 'Configure award tiers, tenure rules, and rupee exchange rates' },
    '/admin/history': { title: 'All awards', subtitle: 'Company-wide audit of all issued, pending, and revoked awards' },
    '/admin/audit': { title: 'Audit and emails', subtitle: 'Complete system activity trail and dispatched email notifications' },
    '/admin/data': { title: 'Data management', subtitle: 'Import and export full platform datasets in Microsoft Excel (.xlsx)' },
  };

  const currentMeta = routeMeta[location.pathname] || {
    title: 'Rewards & Recognition',
    subtitle: 'VCreaTek R&R Platform',
  };

  const initials = user.full_name
    .split(' ')
    .map((p) => p[0])
    .slice(0, 2)
    .join('');

  const handleSwitch = (userId: string) => {
    switchUser(userId);
    setIsSwitcherOpen(false);
    const targetUser = data.users.find((u) => u.id === userId);
    if (targetUser) {
      if (targetUser.role === 'HR_ADMIN') {
        navigate('/admin');
      } else if (targetUser.role === 'LEADER') {
        navigate('/leader');
      } else {
        navigate('/me');
      }
    }
  };

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const groupedUsers = [
    { label: 'HR Administrators', users: data.users.filter((u) => u.role === 'HR_ADMIN' && u.is_active) },
    { label: 'Managers / Leaders', users: data.users.filter((u) => u.role === 'LEADER' && u.is_active) },
    { label: 'Employees', users: data.users.filter((u) => u.role === 'EMPLOYEE' && u.is_active).slice(0, 8) },
  ];

  return (
    <>
      <header className="topbar">
        <div className="title-block">
          <div className="t">{currentMeta.title}</div>
          <div className="st">{currentMeta.subtitle}</div>
        </div>

        <div className="tright">
          <div className="topbar-brand-badge" title="VCreaTek Rewards & Recognition">
            <img src={vctLogo} alt="VCreaTek Logo" />
            <span>Rewards &amp; Recognition</span>
          </div>

          <span className="demo-pill">
            <Sparkles size={13} /> DEMO ACTIVE
          </span>

          <button
            className="btn btn-secondary btn-sm"
            onClick={() => setIsSwitcherOpen(true)}
            title="Switch test persona"
          >
            <ArrowRightLeft size={14} /> Switch Persona
          </button>

          <div className="row" style={{ gap: '10px' }}>
            <div className="avatar" title={user.email}>
              {initials}
            </div>
            <div>
              <p style={{ fontWeight: 600, fontSize: '0.92rem', lineHeight: 1.1 }}>{user.full_name}</p>
              <p className="small muted" style={{ fontSize: '0.78rem' }}>
                {user.vcreatek_id} &bull; {user.role.replace('_', ' ')}
              </p>
            </div>
          </div>

          <button className="btn btn-secondary btn-sm" onClick={handleLogout} title="Sign Out">
            <LogOut size={14} /> Sign out
          </button>
        </div>
      </header>

      {/* Persona Switcher Modal */}
      <Modal
        isOpen={isSwitcherOpen}
        onClose={() => setIsSwitcherOpen(false)}
        title="Quick-Switch Test Persona"
        maxWidth="640px"
      >
        <p className="muted small" style={{ marginBottom: '16px' }}>
          Select any persona to immediately switch context and view the platform from their perspective.
        </p>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
          {groupedUsers.map((grp) => (
            <div key={grp.label}>
              <h4 style={{ fontSize: '0.82rem', textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--t3)', marginBottom: '8px' }}>
                {grp.label}
              </h4>
              <div className="grid g2" style={{ gap: '8px' }}>
                {grp.users.map((u) => {
                  const isCurrent = u.id === user.id;
                  return (
                    <button
                      key={u.id}
                      type="button"
                      className={`persona-card ${isCurrent ? 'active' : ''}`}
                      onClick={() => handleSwitch(u.id)}
                      style={{
                        padding: '10px 12px',
                        borderRadius: 'var(--r12)',
                        border: isCurrent ? '2px solid var(--primary)' : '1px solid var(--border)',
                        background: isCurrent ? 'var(--focus)' : 'var(--surface)',
                        textAlign: 'left',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                      }}
                    >
                      <div>
                        <p style={{ fontWeight: 600, fontSize: '0.9rem', color: isCurrent ? 'var(--primary)' : 'var(--t1)' }}>
                          {u.full_name}
                        </p>
                        <p className="small muted" style={{ fontSize: '0.78rem' }}>
                          {u.vcreatek_id} &bull; {u.department}
                        </p>
                      </div>
                      {isCurrent && <UserCheck size={16} color="var(--primary)" />}
                    </button>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      </Modal>
    </>
  );
};

export default Topbar;
