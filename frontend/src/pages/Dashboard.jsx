import React, { useState, useEffect } from 'react';
import { DashboardService } from '../services/dashboardService';

export default function Dashboard({ user, setView, showToast }) {
  const [metrics, setMetrics] = useState(null);
  const [charts, setCharts] = useState(null);
  const [loading, setLoading] = useState(true);

  const role = (user && user.roles && user.roles[0]) || 'SalesExecutive';

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    try {
      setLoading(true);
      const [mRes, cRes] = await Promise.all([
        DashboardService.getMetrics(),
        DashboardService.getCharts()
      ]);

      if (mRes.success) setMetrics(mRes.data);
      if (cRes.success) setCharts(cRes.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const roleBadgeClass = role.toLowerCase() === 'admin' ? 'badge-admin' : (role.toLowerCase() === 'manager' ? 'badge-manager' : 'badge-sales');

  return (
    <div className="main-content" style={{ maxWidth: '1280px', margin: '0 auto' }}>
      {/* Executive Welcome Banner */}
      <div
        style={{
          background: 'linear-gradient(135deg, hsla(222, 47%, 18%, 0.95), hsla(224, 76%, 25%, 0.85))',
          border: '1px solid hsla(217, 91%, 60%, 0.25)',
          borderRadius: 'var(--radius-xl)',
          padding: '2rem',
          marginBottom: '2rem',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '1.25rem'
        }}
      >
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.5rem' }}>
            <h1 style={{ fontSize: '1.8rem', fontWeight: 800 }}>
              Welcome back, {user?.fullName || user?.username}
            </h1>
            <span className={`badge ${roleBadgeClass}`}>{role}</span>
          </div>
          <p style={{ color: 'var(--primary-100)', maxWidth: '680px', fontSize: '0.9rem', lineHeight: 1.5 }}>
            {metrics?.roleScopeDescription ||
              (role === 'Admin'
                ? 'Company-Wide Master View: Global sales figures, user operations, and system compliance.'
                : role === 'Manager'
                ? 'Sales pipeline oversight: Team leads, opportunity tracking, and conversion health.'
                : 'Representative workspace: Manage your prospective leads, customers, and active deals.')}
          </p>
        </div>

        <div style={{ display: 'flex', gap: '0.6rem', flexWrap: 'wrap' }}>
          <button className="btn btn-secondary btn-sm" onClick={() => setView('customers')}>+ Customer</button>
          <button className="btn btn-secondary btn-sm" onClick={() => setView('leads')}>+ Lead</button>
          <button className="btn btn-secondary btn-sm" onClick={() => setView('opportunities')}>+ Deal</button>
          <button className="btn btn-primary btn-sm" onClick={() => setView('followups')}>+ Follow-Up</button>
        </div>
      </div>

      {/* Top Row KPI Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1.25rem', marginBottom: '2rem' }}>
        {/* Total Customers */}
        <div className="card" style={{ padding: '1.25rem', cursor: 'pointer' }} onClick={() => setView('customers')}>
          <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--text-muted)', fontSize: '0.85rem', marginBottom: '0.4rem' }}>
            <span>Customer Master</span>
            <span>🏢</span>
          </div>
          <div style={{ fontSize: '1.75rem', fontWeight: 800, color: 'var(--primary-400)' }}>
            {metrics?.totalCustomers ?? '--'}
          </div>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Active business accounts</div>
        </div>

        {/* Leads & Conversion */}
        <div className="card" style={{ padding: '1.25rem', cursor: 'pointer' }} onClick={() => setView('leads')}>
          <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--text-muted)', fontSize: '0.85rem', marginBottom: '0.4rem' }}>
            <span>Lead Conversion</span>
            <span style={{ color: '#10b981' }}>🎯</span>
          </div>
          <div style={{ fontSize: '1.75rem', fontWeight: 800, color: '#10b981' }}>
            {metrics?.leadConversionRate ?? '0'}%
          </div>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
            {metrics?.convertedLeads ?? 0} converted / {metrics?.totalLeads ?? 0} total leads
          </div>
        </div>

        {/* Weighted Pipeline */}
        <div className="card" style={{ padding: '1.25rem', cursor: 'pointer' }} onClick={() => setView('opportunities')}>
          <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--text-muted)', fontSize: '0.85rem', marginBottom: '0.4rem' }}>
            <span>⚡ Weighted Forecast</span>
            <span style={{ color: '#38bdf8' }}>📈</span>
          </div>
          <div style={{ fontSize: '1.75rem', fontWeight: 800, color: '#38bdf8' }}>
            ${metrics ? Math.round(metrics.weightedPipelineValue).toLocaleString() : '--'}
          </div>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
            Gross: ${metrics ? metrics.totalPipelineValue.toLocaleString() : '--'} ({metrics?.activeOpportunities ?? 0} deals)
          </div>
        </div>

        {/* Won Revenue */}
        <div className="card" style={{ padding: '1.25rem', cursor: 'pointer' }} onClick={() => setView('opportunities')}>
          <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--text-muted)', fontSize: '0.85rem', marginBottom: '0.4rem' }}>
            <span>Won Revenue</span>
            <span style={{ color: '#a855f7' }}>🏆</span>
          </div>
          <div style={{ fontSize: '1.75rem', fontWeight: 800, color: '#c084fc' }}>
            ${metrics ? metrics.wonRevenue.toLocaleString() : '--'}
          </div>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Closed &amp; won agreements</div>
        </div>

        {/* Overdue Follow-Ups */}
        <div className="card" style={{ padding: '1.25rem', cursor: 'pointer' }} onClick={() => setView('followups')}>
          <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--text-muted)', fontSize: '0.85rem', marginBottom: '0.4rem' }}>
            <span>Follow-Up Alerts</span>
            <span style={{ color: metrics?.overdueFollowUps > 0 ? '#ef4444' : '#10b981' }}>⏱️</span>
          </div>
          <div style={{ fontSize: '1.75rem', fontWeight: 800, color: (metrics?.overdueFollowUps > 0) ? '#ef4444' : '#10b981' }}>
            {metrics?.overdueFollowUps ?? 0} Overdue
          </div>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
            {metrics?.upcomingFollowUps ?? 0} upcoming in 7 days
          </div>
        </div>
      </div>

      {/* Charts Grid: 2x2 Layout */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(480px, 1fr))', gap: '1.5rem', marginBottom: '2rem' }}>
        {/* Chart 1: Opportunity Pipeline Funnel */}
        <div className="card" style={{ padding: '1.5rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
            <div>
              <h3 style={{ fontSize: '1.05rem', fontWeight: 700 }}>Opportunity Pipeline Funnel</h3>
              <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Gross Deal Amount vs Weighted Value by Stage</p>
            </div>
            <button className="btn btn-ghost btn-sm" onClick={() => setView('opportunities')}>Open Pipeline ↗</button>
          </div>

          {charts?.opportunityFunnel ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
              {charts.opportunityFunnel.labels.map((stage, idx) => {
                const amount = charts.opportunityFunnel.data[idx] || 0;
                const weighted = charts.opportunityFunnel.secondaryData?.[idx] || 0;
                const maxAmt = Math.max(...charts.opportunityFunnel.data, 1);
                const pct = Math.max(5, (amount / maxAmt) * 100);
                const color = charts.opportunityFunnel.backgroundColors[idx] || '#3b82f6';

                return (
                  <div key={stage} style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.825rem' }}>
                      <span style={{ fontWeight: 600 }}>{stage}</span>
                      <span>
                        ${amount.toLocaleString()} <span style={{ color: 'var(--accent-cyan)', fontSize: '0.75rem' }}>(W: ${Math.round(weighted).toLocaleString()})</span>
                      </span>
                    </div>
                    <div style={{ background: 'var(--bg-body)', height: '14px', borderRadius: '7px', overflow: 'hidden', display: 'flex' }}>
                      <div
                        style={{
                          width: `${pct}%`,
                          background: color,
                          borderRadius: '7px',
                          transition: 'width 0.6s ease'
                        }}
                      ></div>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="loading-spinner">Loading pipeline funnel...</div>
          )}
        </div>

        {/* Chart 2: 6-Month Sales Velocity Trajectory */}
        <div className="card" style={{ padding: '1.5rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
            <div>
              <h3 style={{ fontSize: '1.05rem', fontWeight: 700 }}>6-Month Revenue Trajectory</h3>
              <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Monthly Deal Value Closed (USD)</p>
            </div>
            <span className="badge badge-manager">Closed Deals</span>
          </div>

          {charts?.monthlySalesVelocity ? (
            <div>
              <div style={{ display: 'flex', alignItems: 'flex-end', gap: '1rem', height: '160px', padding: '1rem 0', borderBottom: '1px solid var(--border-color)' }}>
                {charts.monthlySalesVelocity.labels.map((month, idx) => {
                  const val = charts.monthlySalesVelocity.data[idx] || 0;
                  const maxVal = Math.max(...charts.monthlySalesVelocity.data, 1);
                  const heightPct = Math.max(15, (val / maxVal) * 100);

                  return (
                    <div key={month} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', height: '100%', justifyContent: 'flex-end' }}>
                      <span style={{ fontSize: '0.7rem', color: 'var(--accent-cyan)', fontWeight: 600, marginBottom: '4px' }}>
                        ${Math.round(val / 1000)}k
                      </span>
                      <div
                        style={{
                          width: '80%',
                          height: `${heightPct}%`,
                          background: 'linear-gradient(180deg, #38bdf8, #0284c7)',
                          borderRadius: '6px 6px 0 0',
                          transition: 'height 0.6s ease'
                        }}
                      ></div>
                    </div>
                  );
                })}
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-around', marginTop: '0.5rem' }}>
                {charts.monthlySalesVelocity.labels.map((m) => (
                  <span key={m} style={{ fontSize: '0.75rem', color: 'var(--text-muted)', flex: 1, textAlign: 'center' }}>
                    {m.split(' ')[0]}
                  </span>
                ))}
              </div>
            </div>
          ) : (
            <div className="loading-spinner">Loading sales velocity...</div>
          )}
        </div>

        {/* Chart 3: Lead Status Distribution */}
        <div className="card" style={{ padding: '1.5rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
            <div>
              <h3 style={{ fontSize: '1.05rem', fontWeight: 700 }}>Lead Status Breakdown</h3>
              <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Distribution across active prospective pipeline</p>
            </div>
            <button className="btn btn-ghost btn-sm" onClick={() => setView('leads')}>View Leads ↗</button>
          </div>

          {charts?.leadStatusDistribution ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              {charts.leadStatusDistribution.labels.map((label, idx) => {
                const count = charts.leadStatusDistribution.data[idx] || 0;
                const total = charts.leadStatusDistribution.data.reduce((a, b) => a + b, 0) || 1;
                const pct = Math.round((count / total) * 100);
                const color = charts.leadStatusDistribution.backgroundColors[idx] || '#3b82f6';

                return (
                  <div key={label} style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                    <span style={{ width: '10px', height: '10px', borderRadius: '50%', background: color, display: 'inline-block' }}></span>
                    <span style={{ fontSize: '0.85rem', width: '90px', fontWeight: 500 }}>{label}</span>
                    <div style={{ flex: 1, background: 'var(--bg-body)', height: '10px', borderRadius: '5px', overflow: 'hidden' }}>
                      <div style={{ width: `${pct}%`, height: '100%', background: color }}></div>
                    </div>
                    <span style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-muted)', width: '60px', textAlign: 'right' }}>
                      {count} ({pct}%)
                    </span>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="loading-spinner">Loading lead status...</div>
          )}
        </div>

        {/* Chart 4: Activity & Interaction Mix */}
        <div className="card" style={{ padding: '1.5rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
            <div>
              <h3 style={{ fontSize: '1.05rem', fontWeight: 700 }}>Activity &amp; Touchpoint Mix</h3>
              <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Touchpoints logged across client relationships</p>
            </div>
            <button className="btn btn-ghost btn-sm" onClick={() => setView('followups')}>Follow-Ups ↗</button>
          </div>

          {charts?.activityMix ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              {charts.activityMix.labels.map((type, idx) => {
                const count = charts.activityMix.data[idx] || 0;
                const total = charts.activityMix.data.reduce((a, b) => a + b, 0) || 1;
                const pct = Math.round((count / total) * 100);
                const color = charts.activityMix.backgroundColors[idx] || '#3b82f6';

                let icon = '📞';
                if (type === 'Meeting') icon = '🤝';
                if (type === 'Email') icon = '✉️';
                if (type === 'Task') icon = '📋';

                return (
                  <div key={type} style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                    <span style={{ fontSize: '1rem' }}>{icon}</span>
                    <span style={{ fontSize: '0.85rem', width: '80px', fontWeight: 500 }}>{type}</span>
                    <div style={{ flex: 1, background: 'var(--bg-body)', height: '10px', borderRadius: '5px', overflow: 'hidden' }}>
                      <div style={{ width: `${pct}%`, height: '100%', background: color }}></div>
                    </div>
                    <span style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-muted)', width: '60px', textAlign: 'right' }}>
                      {count} ({pct}%)
                    </span>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="loading-spinner">Loading activity mix...</div>
          )}
        </div>
      </div>

      {/* Feature & Architecture Panel */}
      <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border-subtle)', borderRadius: 'var(--radius-xl)', padding: '2rem' }}>
        <h3 style={{ fontSize: '1.2rem', marginBottom: '0.25rem' }}>AcxiomCRM Enterprise Architecture Roadmap</h3>
        <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '1.5rem' }}>
          Milestone completion baseline across full platform specification
        </p>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '1rem' }}>
          <div style={{ padding: '1rem', background: 'hsla(222, 47%, 10%, 0.4)', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-subtle)' }}>
            <div style={{ color: 'var(--accent-emerald)', fontWeight: 700, marginBottom: '0.2rem' }}>✓ Phase 0 Skeleton</div>
            <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Solution structure, .editorconfig, test project</div>
          </div>
          <div style={{ padding: '1rem', background: 'hsla(222, 47%, 10%, 0.4)', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-subtle)' }}>
            <div style={{ color: 'var(--accent-emerald)', fontWeight: 700, marginBottom: '0.2rem' }}>✓ Phase 1 Identity &amp; RBAC</div>
            <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>PBKDF2 hashing, 5-attempt/15-min lockout</div>
          </div>
          <div style={{ padding: '1rem', background: 'hsla(222, 47%, 10%, 0.4)', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-subtle)' }}>
            <div style={{ color: 'var(--accent-emerald)', fontWeight: 700, marginBottom: '0.2rem' }}>✓ Phase 2 Customers &amp; Leads</div>
            <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Duplicate prevention, atomic conversion</div>
          </div>
          <div style={{ padding: '1rem', background: 'hsla(222, 47%, 10%, 0.4)', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-subtle)' }}>
            <div style={{ color: 'var(--accent-emerald)', fontWeight: 700, marginBottom: '0.2rem' }}>✓ Phase 3 Opportunities &amp; Activities</div>
            <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Kanban pipeline, weighted forecast, follow-ups</div>
          </div>
          <div style={{ padding: '1rem', background: 'hsla(222, 47%, 10%, 0.4)', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-subtle)' }}>
            <div style={{ color: 'var(--accent-emerald)', fontWeight: 700, marginBottom: '0.2rem' }}>✓ Phase 4 Audit Trail</div>
            <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Immutable log engine with delta inspection</div>
          </div>
          <div style={{ padding: '1rem', background: 'hsla(222, 47%, 10%, 0.4)', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-subtle)' }}>
            <div style={{ color: 'var(--accent-emerald)', fontWeight: 700, marginBottom: '0.2rem' }}>✓ Phase 5 REST API &amp; Swagger</div>
            <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>RESTful OpenAPI endpoints, Bearer JWT, API explorer</div>
          </div>
          <div style={{ padding: '1rem', background: 'hsla(222, 47%, 10%, 0.4)', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-subtle)' }}>
            <div style={{ color: 'var(--accent-emerald)', fontWeight: 700, marginBottom: '0.2rem' }}>✓ Phase 6 Executive Dashboard</div>
            <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Real-time KPI aggregation &amp; 4 interactive charts</div>
          </div>
        </div>
      </div>
    </div>
  );
}
