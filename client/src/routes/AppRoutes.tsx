import React from 'react';
import { Routes, Route, Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import Sidebar from '../components/common/Sidebar';
import Topbar from '../components/common/Topbar';

// Pages
import Login from '../pages/login/Login';
import MyRewards from '../pages/employee/MyRewards';
import MyPoints from '../pages/employee/MyPoints';
import AwardHistory from '../pages/employee/AwardHistory';
import RedeemPoints from '../pages/employee/RedeemPoints';
import RedemptionHistory from '../pages/employee/RedemptionHistory';

import LeaderDashboard from '../pages/leader/LeaderDashboard';
import AwardEmployees from '../pages/leader/AwardEmployees';
import AwardsGiven from '../pages/leader/AwardsGiven';
import PendingApprovals from '../pages/approvals/PendingApprovals';

import HrDashboard from '../pages/admin/HrDashboard';
import InventoryAllocation from '../pages/admin/InventoryAllocation';
import AdminRedemptions from '../pages/admin/AdminRedemptions';
import Reminders from '../pages/admin/Reminders';
import ConfigRules from '../pages/admin/ConfigRules';
import AdminAwardHistory from '../pages/admin/AdminAwardHistory';
import AuditAndEmails from '../pages/admin/AuditAndEmails';
import DataManagement from '../pages/admin/DataManagement';

// Protected App Shell Layout
const ProtectedLayout: React.FC = () => {
  const { isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div style={{ minHeight: '100vh', display: 'grid', placeItems: 'center', background: 'var(--bg)' }}>
        <p className="muted">Loading VCreaTek R&amp;R Platform...</p>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  return (
    <div className="app-layout">
      <Sidebar />
      <div className="main-content">
        <Topbar />
        <main className="content-body">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

// Role Gate Component
const RoleGate: React.FC<{ allowedRoles: ('EMPLOYEE' | 'LEADER' | 'HR_ADMIN')[]; children: React.ReactNode }> = ({
  allowedRoles,
  children,
}) => {
  const { user } = useAuth();
  if (!user || !allowedRoles.includes(user.role)) {
    return <Navigate to="/me" replace />;
  }
  return <>{children}</>;
};

// Root index redirector based on role
const RootRedirect: React.FC = () => {
  const { user, isAuthenticated } = useAuth();
  if (!isAuthenticated || !user) {
    return <Navigate to="/login" replace />;
  }
  if (user.role === 'HR_ADMIN') {
    return <Navigate to="/admin" replace />;
  }
  if (user.role === 'LEADER') {
    return <Navigate to="/leader" replace />;
  }
  return <Navigate to="/me" replace />;
};

export const AppRoutes: React.FC = () => {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />

      <Route element={<ProtectedLayout />}>
        <Route path="/" element={<RootRedirect />} />

        {/* Employee Routes */}
        <Route path="/me" element={<MyRewards />} />
        <Route path="/me/points" element={<MyPoints />} />
        <Route path="/me/awards" element={<AwardHistory />} />
        <Route path="/me/redeem" element={<RedeemPoints />} />
        <Route path="/me/redemptions" element={<RedemptionHistory />} />

        {/* Manager Routes */}
        <Route
          path="/leader"
          element={
            <RoleGate allowedRoles={['LEADER', 'HR_ADMIN']}>
              <LeaderDashboard />
            </RoleGate>
          }
        />
        <Route
          path="/leader/award"
          element={
            <RoleGate allowedRoles={['LEADER', 'HR_ADMIN']}>
              <AwardEmployees />
            </RoleGate>
          }
        />
        <Route
          path="/leader/awards"
          element={
            <RoleGate allowedRoles={['LEADER', 'HR_ADMIN']}>
              <AwardsGiven />
            </RoleGate>
          }
        />

        {/* Approvals */}
        <Route
          path="/approvals"
          element={
            <RoleGate allowedRoles={['LEADER', 'HR_ADMIN']}>
              <PendingApprovals />
            </RoleGate>
          }
        />

        {/* HR Admin Routes */}
        <Route
          path="/admin"
          element={
            <RoleGate allowedRoles={['HR_ADMIN']}>
              <HrDashboard />
            </RoleGate>
          }
        />
        <Route
          path="/admin/allocate"
          element={
            <RoleGate allowedRoles={['HR_ADMIN']}>
              <InventoryAllocation />
            </RoleGate>
          }
        />
        <Route
          path="/admin/redemptions"
          element={
            <RoleGate allowedRoles={['HR_ADMIN']}>
              <AdminRedemptions />
            </RoleGate>
          }
        />
        <Route
          path="/admin/reminders"
          element={
            <RoleGate allowedRoles={['HR_ADMIN']}>
              <Reminders />
            </RoleGate>
          }
        />
        <Route
          path="/admin/config"
          element={
            <RoleGate allowedRoles={['HR_ADMIN']}>
              <ConfigRules />
            </RoleGate>
          }
        />
        <Route
          path="/admin/history"
          element={
            <RoleGate allowedRoles={['HR_ADMIN']}>
              <AdminAwardHistory />
            </RoleGate>
          }
        />
        <Route
          path="/admin/audit"
          element={
            <RoleGate allowedRoles={['HR_ADMIN']}>
              <AuditAndEmails />
            </RoleGate>
          }
        />
        <Route
          path="/admin/data"
          element={
            <RoleGate allowedRoles={['HR_ADMIN']}>
              <DataManagement />
            </RoleGate>
          }
        />

        {/* Fallback */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Route>
    </Routes>
  );
};

export default AppRoutes;
