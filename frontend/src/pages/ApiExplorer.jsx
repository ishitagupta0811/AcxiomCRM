import React, { useState, useEffect } from 'react';
import { AuthService } from '../services/authService';

const ENDPOINTS = [
  {
    id: 'health',
    category: 'System Diagnostics',
    method: 'GET',
    path: '/api/health',
    desc: 'System health, database status, and uptime metrics.',
    payload: null
  },
  {
    id: 'auth_login',
    category: 'Identity & Security',
    method: 'POST',
    path: '/api/auth/login',
    desc: 'Authenticates credentials with 5-attempt brute-force lockout.',
    payload: JSON.stringify({ usernameOrEmail: 'admin', password: 'Admin@12345' }, null, 2)
  },
  {
    id: 'cust_list',
    category: 'Customer Master',
    method: 'GET',
    path: '/api/customers?searchTerm=&status=All',
    desc: 'Retrieves paginated customers matching role and search filters.',
    payload: null
  },
  {
    id: 'cust_dup',
    category: 'Customer Master',
    method: 'GET',
    path: '/api/customers/check-duplicate?email=contact@acmetech.com&phone=9876543210',
    desc: 'Real-time uniqueness verification for email and phone.',
    payload: null
  },
  {
    id: 'cust_create',
    category: 'Customer Master',
    method: 'POST',
    path: '/api/customers',
    desc: 'Creates a new customer master with duplicate validation.',
    payload: JSON.stringify({
      customerName: 'Zenith Global Solutions',
      email: 'hello@zenithglobal.com',
      phone: '9844001122',
      companyName: 'Zenith Global Solutions',
      city: 'Hyderabad',
      state: 'Telangana'
    }, null, 2)
  },
  {
    id: 'leads_list',
    category: 'Lead Management',
    method: 'GET',
    path: '/api/leads?status=All',
    desc: 'Retrieves lead pipeline with qualification status.',
    payload: null
  },
  {
    id: 'leads_convert',
    category: 'Lead Management',
    method: 'POST',
    path: '/api/leads/2001/convert',
    desc: 'Transactionally converts qualified lead into Customer and Opportunity.',
    payload: null
  },
  {
    id: 'opp_summary',
    category: 'Opportunities & Pipeline',
    method: 'GET',
    path: '/api/opportunities/pipeline-summary',
    desc: 'Calculates total pipeline and weighted forecast: Σ (Amount × Prob %).',
    payload: null
  },
  {
    id: 'opp_list',
    category: 'Opportunities & Pipeline',
    method: 'GET',
    path: '/api/opportunities?stage=All',
    desc: 'Lists deals across stages (Qualification, Proposal, Negotiation, Won, Lost).',
    payload: null
  },
  {
    id: 'opp_stage',
    category: 'Opportunities & Pipeline',
    method: 'PATCH',
    path: '/api/opportunities/3001/stage',
    desc: 'Advances deal stage and adjusts probability.',
    payload: JSON.stringify({ stage: 'Negotiation' }, null, 2)
  },
  {
    id: 'followup_list',
    category: 'Follow-Ups & Activities',
    method: 'GET',
    path: '/api/followups?overdueOnly=false',
    desc: 'Retrieves scheduled touchpoints and overdue flags.',
    payload: null
  },
  {
    id: 'followup_complete',
    category: 'Follow-Ups & Activities',
    method: 'POST',
    path: '/api/followups/4001/complete',
    desc: 'Marks interaction complete with recorded outcome.',
    payload: JSON.stringify({ remarks: 'Executive presentation went great. RFP response due Friday.' }, null, 2)
  },
  {
    id: 'audit_summary',
    category: 'Audit & Compliance',
    method: 'GET',
    path: '/api/auditlogs/summary',
    desc: 'Aggregates security events, mutations, and login metrics.',
    payload: null
  },
  {
    id: 'audit_list',
    category: 'Audit & Compliance',
    method: 'GET',
    path: '/api/auditlogs?action=All&entityName=All',
    desc: 'Immutable audit trail with before/after state delta inspection.',
    payload: null
  }
];

export default function ApiExplorer() {
  const [activeEndpoint, setActiveEndpoint] = useState(ENDPOINTS[0]);
  const [requestBody, setRequestBody] = useState(ENDPOINTS[0].payload || '');
  const [response, setResponse] = useState(null);
  const [loading, setLoading] = useState(false);
  const [customPath, setCustomPath] = useState(ENDPOINTS[0].path);

  const token = AuthService.getToken();
  const currentUser = AuthService.getUser();

  useEffect(() => {
    setRequestBody(activeEndpoint.payload || '');
    setCustomPath(activeEndpoint.path);
    setResponse(null);
  }, [activeEndpoint]);

  const executeRequest = async () => {
    try {
      setLoading(true);
      const startTime = performance.now();
      const url = `http://localhost:5000${customPath}`;

      const headers = {
        'Content-Type': 'application/json'
      };
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }

      const options = {
        method: activeEndpoint.method,
        headers
      };

      if (['POST', 'PUT', 'PATCH'].includes(activeEndpoint.method) && requestBody) {
        options.body = requestBody;
      }

      const res = await fetch(url, options);
      const endTime = performance.now();
      const duration = Math.round(endTime - startTime);

      let data;
      try {
        data = await res.json();
      } catch {
        data = { message: await res.text() };
      }

      setResponse({
        status: res.status,
        statusText: res.statusText || (res.status === 200 ? 'OK' : (res.status === 201 ? 'Created' : (res.status === 400 ? 'Bad Request' : (res.status === 401 ? 'Unauthorized' : '')))),
        duration,
        data
      });
    } catch (err) {
      setResponse({
        status: 0,
        statusText: 'Network Error',
        duration: 0,
        data: { error: err.message, note: 'Make sure backend server on port 5000 is active.' }
      });
    } finally {
      setLoading(false);
    }
  };

  const methodColor = (method) => {
    switch (method) {
      case 'GET': return '#3b82f6';
      case 'POST': return '#10b981';
      case 'PUT': return '#f59e0b';
      case 'PATCH': return '#ea580c';
      case 'DELETE': return '#ef4444';
      default: return '#6b7280';
    }
  };

  const statusColor = (status) => {
    if (status >= 200 && status < 300) return '#10b981';
    if (status >= 400 && status < 500) return '#f59e0b';
    return '#ef4444';
  };

  return (
    <div className="main-content" style={{ maxWidth: '1200px', margin: '0 auto' }}>
      {/* Header */}
      <div className="page-header" style={{ marginBottom: '1.5rem' }}>
        <div>
          <h1 className="page-title" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <span>⚡</span> REST API &amp; OpenAPI Explorer
          </h1>
          <p className="page-subtitle">
            Phase 5 Interactive API Console. Test live endpoints with Bearer JWT security tokens.
          </p>
        </div>
        <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
          <a
            href="http://localhost:5000/swagger"
            target="_blank"
            rel="noopener noreferrer"
            className="btn btn-outline btn-sm"
          >
            ↗ Open Swagger UI
          </a>
        </div>
      </div>

      {/* Main Grid: Endpoint Selector on Left, Test Console on Right */}
      <div style={{ display: 'grid', gridTemplateColumns: '320px 1fr', gap: '1.5rem', alignItems: 'start' }}>
        {/* Endpoints Sidebar */}
        <div className="card" style={{ padding: '1rem', maxHeight: '720px', overflowY: 'auto' }}>
          <h3 style={{ fontSize: '0.9rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '0.75rem' }}>
            API Endpoints Catalog
          </h3>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
            {ENDPOINTS.map((ep) => {
              const isActive = activeEndpoint.id === ep.id;
              return (
                <button
                  key={ep.id}
                  style={{
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'flex-start',
                    padding: '0.6rem 0.75rem',
                    borderRadius: '6px',
                    border: isActive ? '1px solid var(--primary-500)' : '1px solid transparent',
                    background: isActive ? 'hsla(217, 91%, 60%, 0.12)' : 'var(--bg-card)',
                    cursor: 'pointer',
                    textAlign: 'left',
                    transition: 'all 0.15s ease'
                  }}
                  onClick={() => setActiveEndpoint(ep)}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', width: '100%', marginBottom: '0.2rem' }}>
                    <span
                      style={{
                        fontSize: '0.65rem',
                        fontWeight: 700,
                        padding: '0.15rem 0.4rem',
                        borderRadius: '3px',
                        background: `${methodColor(ep.method)}20`,
                        color: methodColor(ep.method)
                      }}
                    >
                      {ep.method}
                    </span>
                    <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginLeft: 'auto' }}>{ep.category}</span>
                  </div>
                  <span style={{ fontSize: '0.8rem', fontFamily: 'var(--font-mono)', color: 'var(--text-main)', wordBreak: 'break-all' }}>
                    {ep.path.split('?')[0]}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Execution Console */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          {/* Active Request Bar */}
          <div className="card" style={{ padding: '1.25rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.75rem' }}>
              <span
                style={{
                  fontSize: '0.85rem',
                  fontWeight: 800,
                  padding: '0.35rem 0.75rem',
                  borderRadius: '6px',
                  background: `${methodColor(activeEndpoint.method)}25`,
                  color: methodColor(activeEndpoint.method)
                }}
              >
                {activeEndpoint.method}
              </span>
              <input
                type="text"
                value={customPath}
                onChange={(e) => setCustomPath(e.target.value)}
                style={{
                  flex: 1,
                  fontFamily: 'var(--font-mono)',
                  fontSize: '0.9rem',
                  padding: '0.5rem 0.75rem',
                  borderRadius: '6px',
                  border: '1px solid var(--border-color)',
                  background: 'var(--bg-body)',
                  color: 'var(--text-main)'
                }}
              />
              <button
                className="btn btn-primary"
                onClick={executeRequest}
                disabled={loading}
                style={{ minWidth: '110px' }}
              >
                {loading ? 'Sending...' : '⚡ Execute'}
              </button>
            </div>

            <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
              {activeEndpoint.desc}
            </p>

            {/* Auth Indicator */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginTop: '0.75rem', fontSize: '0.75rem', color: 'var(--text-muted)', background: 'var(--bg-body)', padding: '0.5rem 0.75rem', borderRadius: '6px' }}>
              <span>🔒 Authorization:</span>
              <span style={{ color: token ? '#10b981' : '#f59e0b', fontWeight: 600 }}>
                {token ? `Bearer JWT (${currentUser?.username || 'Active'})` : 'Anonymous'}
              </span>
            </div>
          </div>

          {/* Request Payload Editor (if POST/PUT/PATCH) */}
          {['POST', 'PUT', 'PATCH'].includes(activeEndpoint.method) && (
            <div className="card" style={{ padding: '1.25rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                <span style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-main)' }}>Request JSON Body</span>
                <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>application/json</span>
              </div>
              <textarea
                rows="6"
                style={{
                  width: '100%',
                  fontFamily: 'var(--font-mono)',
                  fontSize: '0.85rem',
                  padding: '0.75rem',
                  borderRadius: '6px',
                  background: 'var(--bg-body)',
                  border: '1px solid var(--border-color)',
                  color: 'var(--text-main)',
                  resize: 'vertical'
                }}
                value={requestBody}
                onChange={(e) => setRequestBody(e.target.value)}
              ></textarea>
            </div>
          )}

          {/* Response Inspector */}
          <div className="card" style={{ padding: '1.25rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
              <span style={{ fontSize: '0.9rem', fontWeight: 600, color: 'var(--text-main)' }}>Response Output</span>
              {response && (
                <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
                  <span
                    style={{
                      fontFamily: 'var(--font-mono)',
                      fontWeight: 700,
                      fontSize: '0.8rem',
                      padding: '0.2rem 0.6rem',
                      borderRadius: '4px',
                      background: `${statusColor(response.status)}20`,
                      color: statusColor(response.status)
                    }}
                  >
                    HTTP {response.status} {response.statusText}
                  </span>
                  <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>
                    {response.duration} ms
                  </span>
                </div>
              )}
            </div>

            {loading ? (
              <div style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-muted)' }}>
                Waiting for API response...
              </div>
            ) : response ? (
              <pre
                style={{
                  background: 'var(--bg-body)',
                  padding: '1rem',
                  borderRadius: '6px',
                  fontFamily: 'var(--font-mono)',
                  fontSize: '0.85rem',
                  lineHeight: 1.5,
                  overflowX: 'auto',
                  maxHeight: '400px',
                  color: '#e2e8f0',
                  border: '1px solid var(--border-color)'
                }}
              >
                {JSON.stringify(response.data, null, 2)}
              </pre>
            ) : (
              <div style={{ padding: '2.5rem', textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.85rem' }}>
                Click <strong>⚡ Execute</strong> above to dispatch this HTTP request.
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
