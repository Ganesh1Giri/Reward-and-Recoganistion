import React from 'react';
import { NavLink } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import vctLogo from '../../assets/vct.png';
import './Sidebar.css';
import {
  Award,
  Coins,
  History,
  Gift,
  LayoutDashboard,
  UserPlus,
  Send,
  CheckSquare,
  ShieldCheck,
  PackagePlus,
  BellRing,
  Settings2,
  FileSpreadsheet,
  FileCheck2,
  Database,
} from 'lucide-react';

export const Sidebar: React.FC = () => {
  const { user } = useAuth();
  if (!user) return null;

  const sections = [
    {
      title: 'Recognition',
      roles: ['EMPLOYEE', 'LEADER', 'HR_ADMIN'],
      items: [
        { to: '/me', label: 'My rewards', icon: <Award size={18} /> },
        { to: '/me/points', label: 'My points', icon: <Coins size={18} /> },
        { to: '/me/awards', label: 'Award history', icon: <History size={18} /> },
        { to: '/me/redeem', label: 'Redeem points', icon: <Gift size={18} /> },
        { to: '/me/redemptions', label: 'Redemptions', icon: <FileCheck2 size={18} /> },
      ],
    },
    {
      title: 'Manager Actions',
      roles: ['LEADER', 'HR_ADMIN'],
      items: [
        { to: '/leader', label: 'Leader dashboard', icon: <LayoutDashboard size={18} /> },
        { to: '/leader/award', label: 'Award employees', icon: <UserPlus size={18} /> },
        { to: '/leader/awards', label: 'Awards given', icon: <Send size={18} /> },
        { to: '/approvals', label: 'Approvals', icon: <CheckSquare size={18} /> },
      ],
    },
    {
      title: 'HR Administration',
      roles: ['HR_ADMIN'],
      items: [
        { to: '/admin', label: 'Executive overview', icon: <ShieldCheck size={18} /> },
        { to: '/admin/allocate', label: 'Inventory quota', icon: <PackagePlus size={18} /> },
        { to: '/admin/redemptions', label: 'Process redemptions', icon: <Gift size={18} /> },
        { to: '/admin/reminders', label: 'Leader reminders', icon: <BellRing size={18} /> },
        { to: '/admin/config', label: 'Rules & tiers', icon: <Settings2 size={18} /> },
        { to: '/admin/history', label: 'All awards', icon: <FileSpreadsheet size={18} /> },
        { to: '/admin/audit', label: 'Audit & emails', icon: <FileCheck2 size={18} /> },
        { to: '/admin/data', label: 'Excel data tools', icon: <Database size={18} /> },
      ],
    },
  ];

  const visibleSections = sections.filter((s) => s.roles.includes(user.role));

  const roleLabelMap = {
    EMPLOYEE: 'Employee',
    LEADER: 'Manager',
    HR_ADMIN: 'HR Admin',
  };

  return (
    <aside className="sidebar">
      <div className="brand">
        <img src={vctLogo} alt="VCreaTek" className="brand-logo" />
        <div className="brand-text">
          <span className="brand-title">Rewards &amp;</span>
          <span className="brand-title">Recognition</span>
        </div>
      </div>

      <div style={{ flex: 1 }}>
        {visibleSections.map((sec, secIdx) => (
          <div key={secIdx}>
            <div className="nav-label">{sec.title}</div>
            {sec.items.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                end={item.to === '/me' || item.to === '/leader' || item.to === '/admin'}
                className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}
              >
                {item.icon}
                <span>{item.label}</span>
              </NavLink>
            ))}
          </div>
        ))}
      </div>

      <div className="sidebar-user">
        <p className="small" style={{ fontWeight: 600 }}>{user.full_name}</p>
        <p className="small muted">
          {roleLabelMap[user.role]} &bull; {user.department}
        </p>
      </div>
    </aside>
  );
};

export default Sidebar;
