import React, { useState } from 'react';
import { AuthService } from '../services/authService';
import { ValidationEngine } from '../services/validation';

export default function Register({ onLoginSuccess, setView, showToast }) {
  const [fullName, setFullName] = useState('');
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState('SalesExecutive');
  const [department, setDepartment] = useState('Sales');
  const [submitting, setSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  const fnVal = ValidationEngine.validateRequired(fullName, 'Full Name');
  const unVal = ValidationEngine.validateRequired(username, 'Username');
  const emVal = ValidationEngine.validateEmail(email);
  const pwStrength = ValidationEngine.checkPasswordStrength(password);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!fnVal.valid || !unVal.valid || !emVal.valid || !pwStrength.isValid) {
      showToast('Please fulfill all validation rules.', 'danger');
      return;
    }

    setSubmitting(true);
    setErrorMessage('');
    const res = await AuthService.register(fullName, username, email, password, role, department);
    setSubmitting(false);

    if (res.success) {
      showToast(res.message, 'success');
      onLoginSuccess(AuthService.getCurrentUser());
    } else {
      setErrorMessage(res.message);
    }
  };

  return (
    <div style={{ minHeight: '85vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem' }}>
      <div style={{ width: '100%', maxWidth: '520px', background: 'var(--bg-card)', padding: '2.5rem 2rem', borderRadius: 'var(--radius-xl)', border: '1px solid var(--border-subtle)', boxShadow: 'var(--glass-shadow)' }}>
        
        <div style={{ textAlign: 'center', marginBottom: '1.75rem' }}>
          <div style={{ fontSize: '1.6rem', fontWeight: 800, marginBottom: '0.35rem' }}>
            <span>⚡</span> Acxiom<span style={{ color: 'var(--primary-500)' }}>CRM</span>
          </div>
          <p style={{ fontSize: '0.875rem', color: 'var(--text-muted)' }}>Provision new user with role-based access</p>
        </div>

        {errorMessage && (
          <div className="alert alert-danger">
            <span>⚠️</span>
            <div>{errorMessage}</div>
          </div>
        )}

        <form onSubmit={handleSubmit} noValidate>
          <div className="form-group">
            <label className="form-label">Full Name <span className="req">*</span></label>
            <input
              type="text"
              className="form-control"
              placeholder="e.g. John Doe"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              required
            />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
            <div className="form-group">
              <label className="form-label">Username <span className="req">*</span></label>
              <input
                type="text"
                className="form-control"
                placeholder="johndoe"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                required
              />
            </div>
            <div className="form-group">
              <label className="form-label">Role <span className="req">*</span></label>
              <select className="form-control" value={role} onChange={(e) => setRole(e.target.value)}>
                <option value="SalesExecutive">Sales Executive</option>
                <option value="Manager">Manager</option>
                <option value="Admin">Administrator</option>
              </select>
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">Corporate Email <span className="req">*</span></label>
            <input
              type="email"
              className="form-control"
              placeholder="john@acxiomcrm.local"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>

          <div className="form-group">
            <label className="form-label">Department</label>
            <input
              type="text"
              className="form-control"
              placeholder="Key Accounts"
              value={department}
              onChange={(e) => setDepartment(e.target.value)}
            />
          </div>

          <div className="form-group">
            <label className="form-label">Password (Identity Complexity Rules) <span className="req">*</span></label>
            <input
              type="password"
              className="form-control"
              placeholder="Min 8 chars, 1 uppercase, 1 digit, 1 symbol"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />

            {/* Password Policy Meter */}
            <div style={{ marginTop: '0.5rem', background: 'hsla(217, 33%, 30%, 0.4)', height: '4px', borderRadius: '2px', overflow: 'hidden' }}>
              <div style={{
                height: '100%',
                width: pwStrength.level === 'strong' ? '100%' : (pwStrength.level === 'good' ? '75%' : (pwStrength.level === 'fair' ? '50%' : (password ? '25%' : '0%'))),
                background: pwStrength.level === 'strong' ? 'var(--accent-emerald)' : (pwStrength.level === 'good' ? 'var(--primary-500)' : 'var(--accent-amber)'),
                transition: 'all 200ms ease'
              }} />
            </div>

            <ul style={{ listStyle: 'none', fontSize: '0.75rem', marginTop: '0.4rem', display: 'flex', flexDirection: 'column', gap: '0.2rem' }}>
              <li style={{ color: pwStrength.rules.length ? 'var(--accent-emerald)' : 'var(--text-disabled)' }}>• Minimum 8 characters</li>
              <li style={{ color: pwStrength.rules.upper ? 'var(--accent-emerald)' : 'var(--text-disabled)' }}>• At least 1 uppercase letter</li>
              <li style={{ color: pwStrength.rules.lower ? 'var(--accent-emerald)' : 'var(--text-disabled)' }}>• At least 1 lowercase letter</li>
              <li style={{ color: pwStrength.rules.digit ? 'var(--accent-emerald)' : 'var(--text-disabled)' }}>• At least 1 numeric digit (0-9)</li>
              <li style={{ color: pwStrength.rules.special ? 'var(--accent-emerald)' : 'var(--text-disabled)' }}>• At least 1 special symbol (@#$%^&*)</li>
            </ul>
          </div>

          <button type="submit" className="btn btn-primary btn-block" disabled={submitting} style={{ marginTop: '0.5rem' }}>
            {submitting ? 'Creating account...' : 'Complete User Registration'}
          </button>

          <div style={{ textAlign: 'center', marginTop: '1.25rem', fontSize: '0.85rem', color: 'var(--text-muted)' }}>
            Already have an account? <a onClick={() => setView('login')} style={{ fontWeight: 600 }}>Sign in</a>
          </div>
        </form>
      </div>
    </div>
  );
}
