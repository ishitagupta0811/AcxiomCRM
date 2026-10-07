import React from 'react';
import { AuthService } from '../services/authService';
import { AppConfig } from '../services/config';

export default function Landing({ setView, onLoginSuccess, showToast }) {
  const handleQuickLogin = async (roleKey) => {
    const demo = AppConfig.DEMO_USERS[roleKey];
    if (!demo) return;
    showToast(`Authenticating as ${demo.fullName}...`, 'info');
    const res = await AuthService.login(demo.username, demo.password);
    if (res.success) {
      onLoginSuccess(res.user);
    } else {
      showToast(res.message, 'danger');
    }
  };

  return (
    <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '4rem 1.5rem', textAlign: 'center' }}>
      <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem', padding: '0.35rem 0.85rem', background: 'hsla(217, 91%, 60%, 0.15)', border: '1px solid hsla(217, 91%, 60%, 0.3)', borderRadius: '9999px', fontSize: '0.85rem', fontWeight: 600, color: 'var(--primary-200)', marginBottom: '1.5rem' }}>
        <span>🚀</span> Enterprise CRM Architecture &amp; Identity Engine (React Client)
      </div>

      <h1 style={{ fontSize: '3rem', fontWeight: 800, letterSpacing: '-0.03em', lineHeight: 1.15, marginBottom: '1.25rem', background: 'linear-gradient(135deg, #ffffff 40%, var(--primary-200) 80%, var(--accent-cyan))', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
        Role-Based Sales &amp; Relationship Management
      </h1>

      <p style={{ fontSize: '1.1rem', color: 'var(--text-muted)', maxWidth: '720px', margin: '0 auto 2.5rem' }}>
        AcxiomCRM unites ASP.NET Core Identity authentication, deterministic role authorization, multi-level client &amp; server validation, and automated immutable audit trails.
      </p>

      <div style={{ display: 'flex', justifyContent: 'center', gap: '1rem', marginBottom: '3.5rem' }}>
        <button className="btn btn-primary" onClick={() => setView('login')}>
          <span>Launch Application</span> <span>→</span>
        </button>
        <button className="btn btn-secondary" onClick={() => setView('register')}>
          <span>Register New User</span>
        </button>
      </div>

      <div style={{ textAlign: 'left', marginBottom: '1.5rem' }}>
        <h3 style={{ fontSize: '1.35rem', marginBottom: '0.25rem' }}>Explore by Role Persona</h3>
        <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>Click below to instantly launch into each authorized environment</p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '1.5rem', textAlign: 'left' }}>
        <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border-subtle)', borderRadius: 'var(--radius-xl)', padding: '2rem', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1rem' }}>
              <span className="badge badge-admin">Administrator</span>
              <span style={{ fontSize: '1.5rem' }}>👑</span>
            </div>
            <h3 style={{ fontSize: '1.2rem', marginBottom: '0.5rem' }}>System &amp; Security Admin</h3>
            <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '1rem' }}>
              Full oversight of user provisioning, role assignments, security policies, lockout overrides, and system-wide audit logs.
            </p>
          </div>
          <button className="btn btn-primary btn-block btn-sm" onClick={() => handleQuickLogin('admin')}>Test as Admin</button>
        </div>

        <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border-subtle)', borderRadius: 'var(--radius-xl)', padding: '2rem', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1rem' }}>
              <span className="badge badge-manager">Manager</span>
              <span style={{ fontSize: '1.5rem' }}>📊</span>
            </div>
            <h3 style={{ fontSize: '1.2rem', marginBottom: '0.5rem' }}>Sales Manager</h3>
            <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '1rem' }}>
              Departmental oversight of team sales pipeline, deal stage health, lead conversion ratios, and executive reporting.
            </p>
          </div>
          <button className="btn btn-outline btn-block btn-sm" onClick={() => handleQuickLogin('manager')}>Test as Manager</button>
        </div>

        <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border-subtle)', borderRadius: 'var(--radius-xl)', padding: '2rem', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1rem' }}>
              <span className="badge badge-sales">Sales Executive</span>
              <span style={{ fontSize: '1.5rem' }}>💼</span>
            </div>
            <h3 style={{ fontSize: '1.2rem', marginBottom: '0.5rem' }}>Sales Executive</h3>
            <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '1rem' }}>
              Focused daily sales operations: managing assigned customers, capturing leads, progressing opportunities, and follow-ups.
            </p>
          </div>
          <button className="btn btn-outline btn-block btn-sm" onClick={() => handleQuickLogin('sales')}>Test as Sales Rep</button>
        </div>
      </div>
    </div>
  );
}
