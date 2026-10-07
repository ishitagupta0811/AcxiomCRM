import React from 'react';
import { AuthService } from '../services/authService';

export default function Navbar({ currentView, setView, user, onLogout }) {
  const role = (user && user.roles && user.roles[0]) || 'SalesExecutive';
  const roleClass = role.toLowerCase() === 'admin' ? 'badge-admin' : (role.toLowerCase() === 'manager' ? 'badge-manager' : 'badge-sales');
  const initials = user?.fullName ? user.fullName.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase() : 'UR';

  return (
    <header className="app-header">
      <div className="header-brand">
        <div className="brand-logo" onClick={() => setView('dashboard')} style={{ cursor: 'pointer' }}>
          <span>⚡</span> Acxiom<span style={{ color: 'var(--primary-500)' }}>CRM</span>
        </div>
        
        {user && (
          <ul className="nav-links">
            <li>
              <button className={`nav-link ${currentView === 'dashboard' ? 'active' : ''}`} onClick={() => setView('dashboard')}>
                Dashboard
              </button>
            </li>
            <li>
              <button className={`nav-link ${currentView === 'customers' ? 'active' : ''}`} onClick={() => setView('customers')}>
                Customers
              </button>
            </li>
            <li>
              <button className={`nav-link ${currentView === 'leads' ? 'active' : ''}`} onClick={() => setView('leads')}>
                Leads
              </button>
            </li>
            <li>
              <button className={`nav-link ${currentView === 'opportunities' ? 'active' : ''}`} onClick={() => setView('opportunities')}>
                Opportunities
              </button>
            </li>
            <li>
              <button className={`nav-link ${currentView === 'followups' ? 'active' : ''}`} onClick={() => setView('followups')}>
                Follow-Ups
              </button>
            </li>
            {role.toLowerCase() !== 'salesexecutive' && (
              <li>
                <button className={`nav-link ${currentView === 'audit' ? 'active' : ''}`} onClick={() => setView('audit')}>
                  Audit Logs
                </button>
              </li>
            )}
            <li>
              <button className={`nav-link ${currentView === 'api' ? 'active' : ''}`} onClick={() => setView('api')}>
                ⚡ API Docs
              </button>
            </li>
          </ul>
        )}
      </div>

      <div className="header-actions">
        {user ? (
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <div className="user-profile-badge">
              <div className="user-avatar">{initials}</div>
              <div style={{ display: 'flex', flexDirection: 'column' }}>
                <span style={{ fontSize: '0.825rem', fontWeight: 600, color: 'var(--text-main)', lineHeight: 1.2 }}>
                  {user.fullName || user.username}
                </span>
                <span className={`badge ${roleClass}`} style={{ marginTop: '2px' }}>{role}</span>
              </div>
            </div>
            <button className="btn btn-outline btn-sm" onClick={onLogout}>Logout</button>
          </div>
        ) : (
          <div style={{ display: 'flex', gap: '0.5rem' }}>
            <button className="btn btn-outline btn-sm" onClick={() => setView('login')}>Sign In</button>
            <button className="btn btn-primary btn-sm" onClick={() => setView('register')}>Register</button>
          </div>
        )}
      </div>
    </header>
  );
}
