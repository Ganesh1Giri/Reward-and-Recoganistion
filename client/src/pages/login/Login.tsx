import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import { useData } from '../../hooks/useData';
import { VCREATEK_LOGO } from '../../assets/logo';
import { CheckCircle2, Upload, AlertCircle } from 'lucide-react';
import './Login.css';

export const Login: React.FC = () => {
  const { login } = useAuth();
  const { data, importFromExcel } = useData();
  const navigate = useNavigate();

  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [importMessage, setImportMessage] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsSubmitting(true);

    const result = await login(identifier, password);
    setIsSubmitting(false);

    if (result.success) {
      const cleanId = identifier.trim().toLowerCase();
      const user = data.users.find(
        (u) =>
          u.vcreatek_id.toLowerCase() === cleanId || u.email.toLowerCase() === cleanId
      );
      if (user?.role === 'HR_ADMIN') {
        navigate('/admin');
      } else if (user?.role === 'LEADER') {
        navigate('/leader');
      } else {
        navigate('/me');
      }
    } else {
      setError(result.message || 'Login failed. Please check your credentials.');
    }
  };

  const handleFill = (id: string) => {
    setIdentifier(id);
    setPassword('Welcome@123');
    setError(null);
  };

  const handleExcelUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const buffer = event.target?.result as ArrayBuffer;
      const res = importFromExcel(buffer);
      if (res.error) {
        setImportMessage(`Error importing: ${res.error}`);
      } else {
        setImportMessage(`Successfully imported ${res.loadedCount} tables from Excel.`);
      }
    };
    reader.readAsArrayBuffer(file);
  };

  const hrAccounts = data.users.filter((u) => u.role === 'HR_ADMIN' && u.is_active);
  const leaderAccounts = data.users.filter((u) => u.role === 'LEADER' && u.is_active);
  const employeeAccounts = data.users.filter((u) => u.role === 'EMPLOYEE' && u.is_active).slice(0, 8);

  const groups: [string, typeof hrAccounts][] = [
    ['HR / Admin', hrAccounts],
    ['Managers', leaderAccounts],
    ['Employees', employeeAccounts],
  ];

  return (
    <div className="login">
      <div className="login-wrap">
        {/* Left Hero Branded Blue Panel */}
        <section className="login-side">
          <div className="login-side-top">
            <img src={VCREATEK_LOGO} alt="VCreaTek" className="login-side-logo" />
            <h1>
              Rewards &amp;
              <br />
              Recognition
            </h1>
            <p className="lead">
              Appreciate good work the day it happens.
              <br />
              Give awards, collect points, redeem them,
              <br />
              all under one roof.
            </p>

            <ul>
              <li>
                <i>1</i>
                <span>Managers award Beacon, Bronze, Silver, Gold and Diamond from their yearly inventory</span>
              </li>
              <li>
                <i>2</i>
                <span>Employees see their points and e-certificates instantly</span>
              </li>
              <li>
                <i>3</i>
                <span>Points are redeemed for gift vouchers through HR</span>
              </li>
              <li>
                <i>4</i>
                <span>HR tracks inventory, budget and utilisation month to date and year to date</span>
              </li>
            </ul>
          </div>

          <div className="foot">
            &copy; 2026 VCreaTek Consulting Services Pvt. Ltd. &middot; Internal platform for VCreaTek ID holders
          </div>
        </section>

        {/* Right Sign In Form */}
        <section className="login-form">
          <h2>Sign in</h2>
          <p className="sub">Use your VCreaTek ID or company email.</p>

          {error && (
            <div className="alert a-error" style={{ marginBottom: '14px' }}>
              <AlertCircle size={18} />
              <span>{error}</span>
            </div>
          )}

          {importMessage && (
            <div className="alert a-info" style={{ marginBottom: '14px' }}>
              <CheckCircle2 size={18} />
              <span>{importMessage}</span>
            </div>
          )}

          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label htmlFor="lid">VCreaTek ID or email</label>
              <input
                id="lid"
                type="text"
                autoComplete="username"
                placeholder="VCT1001 or name@vcreatek.com"
                value={identifier}
                onChange={(e) => setIdentifier(e.target.value)}
                required
              />
            </div>

            <div className="form-group">
              <label htmlFor="lpw">Password</label>
              <input
                id="lpw"
                type="password"
                autoComplete="current-password"
                placeholder="Your password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>

            <div className="row" style={{ justifyContent: 'space-between', marginBottom: '16px', alignItems: 'center' }}>
              <label className="check" style={{ userSelect: 'none' }}>
                <input type="checkbox" defaultChecked />
                <span>Keep me signed in</span>
              </label>
              <a
                href="#forgot"
                className="forgot-link"
                onClick={(e) => {
                  e.preventDefault();
                  alert('Please contact HR to reset your password.');
                }}
              >
                Forgot password?
              </a>
            </div>

            <button
              type="submit"
              className="btn-signin"
              disabled={isSubmitting}
            >
              {isSubmitting ? 'Signing in...' : 'Sign in'}
            </button>
          </form>

          {/* Demo Accounts Collapsible */}
          <details className="demo-box">
            <summary>&#9654; User accounts (password for all: Welcome@123)</summary>
            {groups.map(([grpName, accounts]) => (
              <React.Fragment key={grpName}>
                <div className="grp">{grpName}</div>
                <div>
                  {accounts.map((u) => (
                    <span
                      key={u.id}
                      className="acct"
                      onClick={() => handleFill(u.vcreatek_id)}
                      title={u.full_name}
                    >
                      {u.full_name} <span className="muted">{u.vcreatek_id}</span>
                    </span>
                  ))}
                </div>
              </React.Fragment>
            ))}

            <div className="row" style={{ marginTop: '12px', alignItems: 'center', gap: '8px' }}>
              <label className="btn btn-secondary btn-sm" style={{ cursor: 'pointer' }}>
                <Upload size={14} /> Import Excel data
                <input
                  type="file"
                  accept=".xlsx"
                  style={{ display: 'none' }}
                  onChange={handleExcelUpload}
                />
              </label>
              <span className="muted small" style={{ flex: '1 1 200px' }}>
                Sample data is loaded. Import RR_Dummy_Data.xlsx or an edited copy to replace it.
              </span>
            </div>
          </details>
        </section>
      </div>
    </div>
  );
};

export default Login;
