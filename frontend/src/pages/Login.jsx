import React, { useState, useEffect } from 'react';
import { AuthService } from '../services/authService';
import { ValidationEngine } from '../services/validation';
import { AppConfig } from '../services/config';

export default function Login({ onLoginSuccess, setView, showToast }) {
  const [usernameOrEmail, setUsernameOrEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [lockoutSec, setLockoutSec] = useState(0);
  const [errorMessage, setErrorMessage] = useState('');
  const [submitting, setSubmitting] = useState(false);

  // Field validation states
  const [userTouched, setUserTouched] = useState(false);
  const [passTouched, setPassTouched] = useState(false);

  useEffect(() => {
    const checkLockout = () => {
      const status = AuthService.getLockoutStatus();
      setLockoutSec(status.isLocked ? status.remainingSeconds : 0);
    };
    checkLockout();
    const interval = setInterval(checkLockout, 1000);
    return () => clearInterval(interval);
  }, []);

  const userVal = ValidationEngine.validateRequired(usernameOrEmail, 'Username or Email');
  const passVal = ValidationEngine.validateRequired(password, 'Password');

  const handleQuickFill = (roleKey) => {
    const demo = AppConfig.DEMO_USERS[roleKey];
    if (demo) {
      setUsernameOrEmail(demo.username);
      setPassword(demo.password);
      setUserTouched(false);
      setPassTouched(false);
      setErrorMessage('');
      showToast(`Auto-filled ${demo.role} test credentials`, 'info');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setUserTouched(true);
    setPassTouched(true);

    if (!userVal.valid || !passVal.valid) {
      showToast('Please correct form errors.', 'danger');
      return;
    }

    setSubmitting(true);
    setErrorMessage('');

    const res = await AuthService.login(usernameOrEmail, password, rememberMe);
    setSubmitting(false);

    if (res.success) {
      showToast(res.message, 'success');
      onLoginSuccess(res.user);
    } else {
      setErrorMessage(res.message);
      if (res.isLockedOut) {
        setLockoutSec(res.remainingSeconds || 900);
      }
    }
  };

  return (
    <div style={{ minHeight: '85vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem' }}>
      <div style={{ width: '100%', maxWidth: '460px', background: 'var(--bg-card)', padding: '2.5rem 2rem', borderRadius: 'var(--radius-xl)', border: '1px solid var(--border-subtle)', boxShadow: 'var(--glass-shadow)', position: 'relative' }}>
        
        <div style={{ textAlign: 'center', marginBottom: '1.75rem' }}>
          <div style={{ fontSize: '1.6rem', fontWeight: 800, marginBottom: '0.35rem' }}>
            <span>⚡</span> Acxiom<span style={{ color: 'var(--primary-500)' }}>CRM</span>
            <span className="badge badge-admin" style={{ marginLeft: '0.5rem', fontSize: '0.7rem' }}>React</span>
          </div>
          <p style={{ fontSize: '0.875rem', color: 'var(--text-muted)' }}>Sign in to your enterprise sales workspace</p>
        </div>

        {lockoutSec > 0 && (
          <div className="alert alert-danger" style={{ display: 'flex', flexDirection: 'column', gap: '0.2rem' }}>
            <strong>🔒 Account Temporarily Locked</strong>
            <span style={{ fontSize: '0.8rem' }}>
              Security policy enforced: 5 failed attempts reached. Try again in {Math.floor(lockoutSec / 60)}:{lockoutSec % 60 < 10 ? '0' : ''}{lockoutSec % 60}.
            </span>
          </div>
        )}

        {errorMessage && (
          <div className="alert alert-danger">
            <span>⚠️</span>
            <div>{errorMessage}</div>
          </div>
        )}

        <form onSubmit={handleSubmit} noValidate>
          <div className="form-group">
            <label className="form-label">
              <span>Username or Corporate Email <span className="req">*</span></span>
            </label>
            <input
              type="text"
              className={`form-control ${userTouched && !userVal.valid ? 'is-invalid' : ''}`}
              placeholder="admin@acxiomcrm.local or username"
              value={usernameOrEmail}
              onChange={(e) => setUsernameOrEmail(e.target.value)}
              onBlur={() => setUserTouched(true)}
              disabled={lockoutSec > 0}
            />
            {userTouched && !userVal.valid && (
              <div className="validation-feedback">{userVal.message}</div>
            )}
          </div>

          <div className="form-group">
            <label className="form-label">
              <span>Password <span className="req">*</span></span>
            </label>
            <div style={{ position: 'relative' }}>
              <input
                type={showPassword ? 'text' : 'password'}
                className={`form-control ${passTouched && !passVal.valid ? 'is-invalid' : ''}`}
                placeholder="••••••••••••"
                style={{ paddingRight: '2.5rem' }}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                onBlur={() => setPassTouched(true)}
                disabled={lockoutSec > 0}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                style={{ position: 'absolute', right: '0.75rem', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)' }}
              >
                {showPassword ? '👁️‍🗨️' : '👁️'}
              </button>
            </div>
            {passTouched && !passVal.valid && (
              <div className="validation-feedback">{passVal.message}</div>
            )}
          </div>

          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem', fontSize: '0.85rem' }}>
            <label style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', cursor: 'pointer', color: 'var(--text-muted)' }}>
              <input
                type="checkbox"
                checked={rememberMe}
                onChange={(e) => setRememberMe(e.target.checked)}
              />
              <span>Remember me</span>
            </label>
            <a href="#" onClick={(e) => { e.preventDefault(); showToast('Password reset workflow available in Admin console', 'info'); }}>
              Forgot password?
            </a>
          </div>

          <button
            type="submit"
            className="btn btn-primary btn-block"
            disabled={submitting || lockoutSec > 0}
          >
            {submitting ? 'Verifying...' : 'Sign In to CRM'}
          </button>

          {/* Quick-Fill Demo Roles */}
          <div style={{ marginTop: '1.5rem', padding: '1rem', background: 'hsla(222, 47%, 10%, 0.5)', borderRadius: 'var(--radius-md)', border: '1px dashed var(--border-subtle)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', textTransform: 'uppercase', fontWeight: 700, color: 'var(--text-muted)', marginBottom: '0.5rem' }}>
              <span>Quick Evaluation Auto-Fill</span>
              <span style={{ color: 'var(--accent-cyan)' }}>1-Click</span>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '0.5rem' }}>
              <button type="button" className="btn btn-secondary btn-sm" onClick={() => handleQuickFill('admin')}>Admin</button>
              <button type="button" className="btn btn-secondary btn-sm" onClick={() => handleQuickFill('manager')}>Manager</button>
              <button type="button" className="btn btn-secondary btn-sm" onClick={() => handleQuickFill('sales')}>Sales Rep</button>
            </div>
          </div>

          <div style={{ textAlign: 'center', marginTop: '1.5rem', fontSize: '0.85rem', color: 'var(--text-muted)' }}>
            Need an account? <a onClick={() => setView('register')} style={{ fontWeight: 600 }}>Register new user</a>
          </div>
        </form>
      </div>
    </div>
  );
}
