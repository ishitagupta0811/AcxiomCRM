import React, { useState, useEffect } from 'react';
import { AuditLogService } from '../services/auditService';

export default function AuditLogs({ user, showToast }) {
  const [logs, setLogs] = useState([]);
  const [summary, setSummary] = useState({ totalAuditEvents: 0, successfulLogins: 0, failedLogins: 0, entityMutations: 0, securityAlerts: 0 });
  const [actionFilter, setActionFilter] = useState('All');
  const [entityFilter, setEntityFilter] = useState('All');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedLog, setSelectedLog] = useState(null);
  const [loading, setLoading] = useState(true);

  const role = (user && user.roles && user.roles[0]) || 'SalesExecutive';

  const loadData = async () => {
    setLoading(true);
    const [logRes, sumRes] = await Promise.all([
      AuditLogService.getAuditLogs({ action: actionFilter, entityName: entityFilter, searchTerm }),
      AuditLogService.getAuditSummary()
    ]);
    setLogs(logRes.items || []);
    setSummary(sumRes);
    setLoading(false);
  };

  useEffect(() => {
    loadData();
  }, [actionFilter, entityFilter, searchTerm]);

  const getActionBadge = (act) => {
    switch (act.toUpperCase()) {
      case 'LOGIN_SUCCESS': return 'badge-sales';
      case 'LOGIN_FAILED':
      case 'ACCOUNT_LOCKOUT': return 'badge-admin';
      case 'CREATE':
      case 'CONVERT': return 'badge-manager';
      case 'UPDATE': return 'badge-sales';
      default: return 'badge-admin';
    }
  };

  if (role.toLowerCase() === 'salesexecutive') {
    return (
      <div className="main-content" style={{ textAlign: 'center', padding: '4rem 1rem' }}>
        <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>🔒</div>
        <h2>Access Restricted</h2>
        <p style={{ color: 'var(--text-muted)', marginTop: '0.5rem' }}>
          Audit trail inspection is restricted to <strong>Administrator</strong> and <strong>Manager</strong> roles.
        </p>
      </div>
    );
  }

  return (
    <div className="main-content">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
        <div>
          <h1 style={{ fontSize: '1.75rem', marginBottom: '0.25rem' }}>Security &amp; Mutation Audit Trail</h1>
          <p style={{ fontSize: '0.875rem' }}>Immutable append-only activity tracking, security logs, and entity delta histories</p>
        </div>
        <span className="badge badge-admin" style={{ fontSize: '0.8rem', padding: '0.4rem 0.8rem' }}>
          Phase 4 Active • Immutable Log
        </span>
      </div>

      {/* Summary KPI Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '1rem', marginBottom: '1.5rem' }}>
        <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border-subtle)', borderRadius: 'var(--radius-lg)', padding: '1.25rem' }}>
          <div style={{ color: 'var(--text-muted)', fontSize: '0.8rem', marginBottom: '0.25rem' }}>Total Audit Events</div>
          <div style={{ fontSize: '1.5rem', fontWeight: 800 }}>{summary.totalAuditEvents}</div>
        </div>
        <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border-subtle)', borderRadius: 'var(--radius-lg)', padding: '1.25rem' }}>
          <div style={{ color: 'var(--text-muted)', fontSize: '0.8rem', marginBottom: '0.25rem' }}>Successful Logins</div>
          <div style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--accent-emerald)' }}>{summary.successfulLogins}</div>
        </div>
        <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border-subtle)', borderRadius: 'var(--radius-lg)', padding: '1.25rem' }}>
          <div style={{ color: 'var(--text-muted)', fontSize: '0.8rem', marginBottom: '0.25rem' }}>Failed Attempts</div>
          <div style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--accent-rose)' }}>{summary.failedLogins}</div>
        </div>
        <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border-subtle)', borderRadius: 'var(--radius-lg)', padding: '1.25rem' }}>
          <div style={{ color: 'var(--text-muted)', fontSize: '0.8rem', marginBottom: '0.25rem' }}>Entity Mutations</div>
          <div style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--accent-cyan)' }}>{summary.entityMutations}</div>
        </div>
        <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border-subtle)', borderRadius: 'var(--radius-lg)', padding: '1.25rem' }}>
          <div style={{ color: 'var(--text-muted)', fontSize: '0.8rem', marginBottom: '0.25rem' }}>Security Alerts</div>
          <div style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--accent-amber)' }}>{summary.securityAlerts}</div>
        </div>
      </div>

      {/* Filters */}
      <div style={{ display: 'flex', gap: '1rem', marginBottom: '1.5rem', flexWrap: 'wrap' }}>
        <input
          type="text"
          className="form-control"
          style={{ maxWidth: '360px' }}
          placeholder="Search by action, module, or user..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
        <select className="form-control" style={{ maxWidth: '180px' }} value={actionFilter} onChange={(e) => setActionFilter(e.target.value)}>
          <option value="All">All Actions</option>
          <option value="LOGIN_SUCCESS">LOGIN_SUCCESS</option>
          <option value="LOGIN_FAILED">LOGIN_FAILED</option>
          <option value="CREATE">CREATE</option>
          <option value="UPDATE">UPDATE</option>
          <option value="CONVERT">CONVERT</option>
          <option value="ACCOUNT_LOCKOUT">ACCOUNT_LOCKOUT</option>
        </select>
        <select className="form-control" style={{ maxWidth: '160px' }} value={entityFilter} onChange={(e) => setEntityFilter(e.target.value)}>
          <option value="All">All Modules</option>
          <option value="User">User</option>
          <option value="Customer">Customer</option>
          <option value="Lead">Lead</option>
          <option value="Security">Security</option>
        </select>
      </div>

      {/* Audit Log Table */}
      <div className="data-table-card">
        <table className="data-table">
          <thead>
            <tr>
              <th>Timestamp</th>
              <th>Action</th>
              <th>Module / Entity</th>
              <th>Record ID</th>
              <th>Actor</th>
              <th>IP Address</th>
              <th style={{ textAlign: 'right' }}>Change Delta</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan="7" style={{ textAlign: 'center', padding: '2rem' }}>Loading audit entries...</td></tr>
            ) : logs.length === 0 ? (
              <tr><td colSpan="7" style={{ textAlign: 'center', padding: '2rem' }}>No audit events found.</td></tr>
            ) : (
              logs.map((log) => (
                <tr key={log.auditLogId}>
                  <td style={{ whiteSpace: 'nowrap', fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                    {new Date(log.createdDate).toLocaleString()}
                  </td>
                  <td>
                    <span className={`badge ${getActionBadge(log.action)}`}>{log.action}</span>
                  </td>
                  <td style={{ fontWeight: 600 }}>{log.entityName}</td>
                  <td><code style={{ color: 'var(--accent-cyan)' }}>{log.recordId || '—'}</code></td>
                  <td>{log.userName || 'System'}</td>
                  <td style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>{log.ipAddress || '127.0.0.1'}</td>
                  <td style={{ textAlign: 'right' }}>
                    <button className="btn btn-outline btn-sm" onClick={() => setSelectedLog(log)}>
                      Inspect Delta
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Delta Inspector Modal */}
      {selectedLog && (
        <div className="modal-backdrop">
          <div className="modal-box" style={{ maxWidth: '650px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
              <h3 style={{ fontSize: '1.25rem' }}>Audit Log Inspection #{selectedLog.auditLogId}</h3>
              <button className="btn btn-outline btn-sm" onClick={() => setSelectedLog(null)}>✕</button>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem', marginBottom: '1.25rem', fontSize: '0.85rem' }}>
              <div><strong>Action:</strong> <span className={`badge ${getActionBadge(selectedLog.action)}`}>{selectedLog.action}</span></div>
              <div><strong>Module:</strong> {selectedLog.entityName}</div>
              <div><strong>Actor:</strong> {selectedLog.userName || 'System'}</div>
              <div><strong>IP Origin:</strong> {selectedLog.ipAddress || '127.0.0.1'}</div>
              <div><strong>Timestamp:</strong> {new Date(selectedLog.createdDate).toLocaleString()}</div>
              <div><strong>Record Key:</strong> {selectedLog.recordId || 'N/A'}</div>
            </div>

            <div style={{ marginBottom: '1rem' }}>
              <h4 style={{ fontSize: '0.9rem', marginBottom: '0.35rem', color: 'var(--text-muted)' }}>Before Mutation (Old Value):</h4>
              <pre style={{ background: 'hsla(222, 47%, 10%, 0.8)', padding: '0.75rem', borderRadius: '8px', fontSize: '0.75rem', overflowX: 'auto', border: '1px solid var(--border-subtle)', color: selectedLog.oldValue ? '#f87171' : 'var(--text-disabled)' }}>
                {selectedLog.oldValue ? JSON.stringify(JSON.parse(selectedLog.oldValue), null, 2) : '/* No prior state / Newly inserted record */'}
              </pre>
            </div>

            <div style={{ marginBottom: '1.5rem' }}>
              <h4 style={{ fontSize: '0.9rem', marginBottom: '0.35rem', color: 'var(--text-muted)' }}>After Mutation (New Value):</h4>
              <pre style={{ background: 'hsla(222, 47%, 10%, 0.8)', padding: '0.75rem', borderRadius: '8px', fontSize: '0.75rem', overflowX: 'auto', border: '1px solid var(--border-subtle)', color: '#34d399' }}>
                {selectedLog.newValue ? (
                  typeof selectedLog.newValue === 'string' && selectedLog.newValue.startsWith('{')
                    ? JSON.stringify(JSON.parse(selectedLog.newValue), null, 2)
                    : selectedLog.newValue
                ) : '/* Record deleted */'}
              </pre>
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
              <button className="btn btn-secondary" onClick={() => setSelectedLog(null)}>Close</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
