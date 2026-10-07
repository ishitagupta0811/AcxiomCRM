import React, { useState, useEffect } from 'react';
import { OpportunityService } from '../services/opportunityService';
import { CustomerService } from '../services/customerService';
import { AuthService } from '../services/authService';

const STAGES = ['Qualification', 'Proposal', 'Negotiation', 'Won', 'Lost'];

export default function Opportunities() {
  const [opportunities, setOpportunities] = useState([]);
  const [summary, setSummary] = useState(null);
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState('kanban'); // 'kanban' | 'list'
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedStage, setSelectedStage] = useState('All');
  
  // Modal state
  const [showModal, setShowModal] = useState(false);
  const [modalMode, setModalMode] = useState('create'); // 'create' | 'edit'
  const [selectedOpp, setSelectedOpp] = useState(null);
  const [formData, setFormData] = useState({
    customerId: '',
    title: '',
    amount: '',
    stage: 'Qualification',
    probability: 30,
    expectedCloseDate: new Date(Date.now() + 30 * 86400000).toISOString().split('T')[0],
    description: ''
  });
  const [formErrors, setFormErrors] = useState({});
  const [actionLoading, setActionLoading] = useState(false);
  const [alertInfo, setAlertInfo] = useState(null);

  const currentUser = AuthService.getUser();
  const isExecutive = currentUser?.roles?.[0] === 'SalesExecutive';

  useEffect(() => {
    loadData();
    loadCustomers();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const [oppsRes, summaryRes] = await Promise.all([
        OpportunityService.getOpportunities({ searchTerm, stage: selectedStage }),
        OpportunityService.getPipelineSummary()
      ]);

      if (oppsRes.success) setOpportunities(oppsRes.data.items);
      if (summaryRes.success) setSummary(summaryRes.data);
    } catch (err) {
      setAlertInfo({ type: 'error', message: 'Failed to load opportunity pipeline data.' });
    } finally {
      setLoading(false);
    }
  };

  const loadCustomers = async () => {
    try {
      const res = await CustomerService.getCustomers({ pageSize: 100 });
      if (res.success) setCustomers(res.data.items);
    } catch (err) {
      console.error(err);
    }
  };

  const handleStageChange = async (oppId, newStage) => {
    try {
      const res = await OpportunityService.updateStage(oppId, newStage);
      if (res.success) {
        setAlertInfo({ type: 'success', message: `Deal moved to ${newStage} successfully!` });
        loadData();
      } else {
        setAlertInfo({ type: 'error', message: res.message });
      }
    } catch (err) {
      setAlertInfo({ type: 'error', message: 'Failed to update opportunity stage.' });
    }
  };

  const validateForm = () => {
    const errors = {};
    if (!formData.customerId) errors.customerId = 'Please select a customer';
    if (!formData.title.trim()) errors.title = 'Deal title is required';
    const amt = parseFloat(formData.amount);
    if (isNaN(amt) || amt <= 0) errors.amount = 'Amount must be strictly greater than 0';
    const prob = parseInt(formData.probability, 10);
    if (isNaN(prob) || prob < 0 || prob > 100) errors.probability = 'Probability must be between 0 and 100%';
    if (!formData.expectedCloseDate) {
      errors.expectedCloseDate = 'Expected close date is required';
    } else {
      const today = new Date().toISOString().split('T')[0];
      if (formData.expectedCloseDate < today) {
        errors.expectedCloseDate = 'Close date cannot be in the past';
      }
    }
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateForm()) return;

    try {
      setActionLoading(true);
      let res;
      if (modalMode === 'create') {
        res = await OpportunityService.createOpportunity({
          ...formData,
          customerId: parseInt(formData.customerId, 10),
          amount: parseFloat(formData.amount),
          probability: parseInt(formData.probability, 10)
        });
      } else {
        res = await OpportunityService.updateOpportunity(selectedOpp.id, {
          ...formData,
          amount: parseFloat(formData.amount),
          probability: parseInt(formData.probability, 10)
        });
      }

      if (res.success) {
        setAlertInfo({ type: 'success', message: res.message || 'Opportunity saved successfully!' });
        setShowModal(false);
        loadData();
      } else {
        setAlertInfo({ type: 'error', message: res.message });
      }
    } catch (err) {
      setAlertInfo({ type: 'error', message: 'Failed to save opportunity record.' });
    } finally {
      setActionLoading(false);
    }
  };

  const openCreateModal = () => {
    setModalMode('create');
    setSelectedOpp(null);
    setFormData({
      customerId: customers.length > 0 ? customers[0].customerId.toString() : '',
      title: '',
      amount: '',
      stage: 'Qualification',
      probability: 30,
      expectedCloseDate: new Date(Date.now() + 30 * 86400000).toISOString().split('T')[0],
      description: ''
    });
    setFormErrors({});
    setShowModal(true);
  };

  const openEditModal = (opp) => {
    setModalMode('edit');
    setSelectedOpp(opp);
    setFormData({
      customerId: opp.customerId.toString(),
      title: opp.title,
      amount: opp.amount.toString(),
      stage: opp.stage,
      probability: opp.probability,
      expectedCloseDate: opp.expectedCloseDate ? opp.expectedCloseDate.split('T')[0] : '',
      description: opp.description || ''
    });
    setFormErrors({});
    setShowModal(true);
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this opportunity?')) return;
    try {
      const res = await OpportunityService.deleteOpportunity(id);
      if (res.success) {
        setAlertInfo({ type: 'success', message: 'Opportunity deleted.' });
        loadData();
      } else {
        setAlertInfo({ type: 'error', message: res.message });
      }
    } catch (err) {
      setAlertInfo({ type: 'error', message: 'Failed to delete opportunity.' });
    }
  };

  return (
    <div className="opportunities-view">
      {alertInfo && (
        <div className={`alert alert-${alertInfo.type}`} style={{ marginBottom: '1.25rem' }}>
          <span>{alertInfo.type === 'success' ? '✓' : '⚠'}</span>
          <span>{alertInfo.message}</span>
          <button style={{ marginLeft: 'auto', background: 'none', border: 'none', color: 'inherit', cursor: 'pointer' }} onClick={() => setAlertInfo(null)}>✕</button>
        </div>
      )}

      {/* Header & Forecasting Summary */}
      <div className="page-header" style={{ marginBottom: '1.5rem' }}>
        <div>
          <h1 className="page-title">Opportunity Pipeline & Weighted Forecasting</h1>
          <p className="page-subtitle">Track multi-stage sales deals and automated probability-weighted revenue metrics.</p>
        </div>
        <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
          <div className="btn-group" style={{ display: 'flex', background: 'var(--bg-card)', borderRadius: '8px', padding: '2px', border: '1px solid var(--border-color)' }}>
            <button className={`btn btn-sm ${viewMode === 'kanban' ? 'btn-primary' : 'btn-ghost'}`} onClick={() => setViewMode('kanban')}>
              Kanban Board
            </button>
            <button className={`btn btn-sm ${viewMode === 'list' ? 'btn-primary' : 'btn-ghost'}`} onClick={() => setViewMode('list')}>
              List View
            </button>
          </div>
          <button className="btn btn-primary" onClick={openCreateModal}>
            <span>+</span> New Opportunity
          </button>
        </div>
      </div>

      {/* Summary KPI Cards */}
      {summary && (
        <div className="stats-grid" style={{ marginBottom: '1.5rem' }}>
          <div className="stat-card">
            <div className="stat-label">Total Pipeline Value</div>
            <div className="stat-value" style={{ color: 'var(--primary-400)' }}>
              ${summary.totalPipelineValue.toLocaleString()}
            </div>
            <div className="stat-desc">Gross unweighted value of all deals</div>
          </div>
          <div className="stat-card">
            <div className="stat-label">⚡ Weighted Forecast</div>
            <div className="stat-value" style={{ color: 'var(--accent-400)' }}>
              ${Math.round(summary.weightedPipelineValue).toLocaleString()}
            </div>
            <div className="stat-desc">Expected return: Σ (Amount × Prob %)</div>
          </div>
          <div className="stat-card">
            <div className="stat-label">Won Revenue</div>
            <div className="stat-value" style={{ color: '#10b981' }}>
              ${summary.wonValue.toLocaleString()}
            </div>
            <div className="stat-desc">Closed Won deals</div>
          </div>
          <div className="stat-card">
            <div className="stat-label">Active Opportunities</div>
            <div className="stat-value" style={{ color: '#6366f1' }}>
              {summary.activeOpportunitiesCount} Deals
            </div>
            <div className="stat-desc">In Qualification, Proposal, or Neg.</div>
          </div>
        </div>
      )}

      {/* Filter Bar */}
      <div className="table-controls" style={{ marginBottom: '1.5rem' }}>
        <div className="search-box">
          <span>🔍</span>
          <input
            type="text"
            placeholder="Search deals by title, customer, or notes..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && loadData()}
          />
        </div>
        <div style={{ display: 'flex', gap: '0.75rem' }}>
          <select value={selectedStage} onChange={(e) => { setSelectedStage(e.target.value); }}>
            <option value="All">All Stages</option>
            {STAGES.map(s => <option key={s} value={s}>{s}</option>)}
          </select>
          <button className="btn btn-outline" onClick={loadData}>Filter</button>
        </div>
      </div>

      {loading ? (
        <div className="loading-spinner">Loading pipeline opportunities...</div>
      ) : viewMode === 'kanban' ? (
        /* Kanban Pipeline View */
        <div className="kanban-board" style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: '1rem', alignItems: 'start', overflowX: 'auto', paddingBottom: '1rem' }}>
          {STAGES.map(stage => {
            const oppsInStage = opportunities.filter(o => o.stage === stage);
            const totalStageAmt = oppsInStage.reduce((sum, o) => sum + (parseFloat(o.amount) || 0), 0);
            const weightedStageAmt = oppsInStage.reduce((sum, o) => sum + ((parseFloat(o.amount) || 0) * (parseInt(o.probability) || 0) / 100), 0);

            let headerBorder = '#3b82f6';
            if (stage === 'Proposal') headerBorder = '#8b5cf6';
            if (stage === 'Negotiation') headerBorder = '#f59e0b';
            if (stage === 'Won') headerBorder = '#10b981';
            if (stage === 'Lost') headerBorder = '#ef4444';

            return (
              <div key={stage} className="kanban-column" style={{ background: 'var(--bg-card)', borderRadius: '10px', border: '1px solid var(--border-color)', minHeight: '520px', display: 'flex', flexDirection: 'column' }}>
                <div style={{ padding: '1rem', borderBottom: '1px solid var(--border-color)', borderTop: `4px solid ${headerBorder}`, borderRadius: '10px 10px 0 0' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <h3 style={{ fontSize: '0.95rem', fontWeight: 600, color: 'var(--text-main)' }}>{stage}</h3>
                    <span className="badge" style={{ background: 'var(--bg-body)', color: 'var(--text-muted)' }}>{oppsInStage.length}</span>
                  </div>
                  <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '0.25rem' }}>
                    ${totalStageAmt.toLocaleString()} <span style={{ color: 'var(--accent-400)', fontSize: '0.75rem' }}>(W: ${Math.round(weightedStageAmt).toLocaleString()})</span>
                  </div>
                </div>

                <div style={{ padding: '0.75rem', display: 'flex', flexDirection: 'column', gap: '0.75rem', flex: 1 }}>
                  {oppsInStage.length === 0 ? (
                    <div style={{ padding: '2rem 1rem', textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.85rem' }}>
                      No deals in {stage}
                    </div>
                  ) : (
                    oppsInStage.map(opp => (
                      <div key={opp.id} className="kanban-card" style={{ background: 'var(--bg-body)', padding: '1rem', borderRadius: '8px', border: '1px solid var(--border-color)', boxShadow: '0 2px 4px rgba(0,0,0,0.1)' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.5rem' }}>
                          <span style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--primary-400)' }}>{opp.customerName}</span>
                          <span className="badge" style={{ fontSize: '0.7rem', background: 'rgba(59, 130, 246, 0.1)', color: '#60a5fa' }}>{opp.probability}% Prob</span>
                        </div>
                        
                        <h4 style={{ fontSize: '0.9rem', fontWeight: 600, color: 'var(--text-main)', marginBottom: '0.4rem', lineHeight: 1.3 }}>
                          {opp.title}
                        </h4>

                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', margin: '0.5rem 0' }}>
                          <span style={{ fontSize: '1.05rem', fontWeight: 700, color: '#10b981' }}>
                            ${opp.amount.toLocaleString()}
                          </span>
                          <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                            Close: {opp.expectedCloseDate ? opp.expectedCloseDate.split('T')[0] : 'N/A'}
                          </span>
                        </div>

                        {opp.description && (
                          <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '0.75rem', lineHeight: 1.4, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                            {opp.description}
                          </p>
                        )}

                        {/* Card Actions */}
                        <div style={{ paddingTop: '0.5rem', borderTop: '1px solid var(--border-color)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <select
                            style={{ fontSize: '0.75rem', padding: '0.2rem 0.4rem', borderRadius: '4px', background: 'var(--bg-card)', color: 'var(--text-main)', border: '1px solid var(--border-color)' }}
                            value={opp.stage}
                            onChange={(e) => handleStageChange(opp.id, e.target.value)}
                          >
                            {STAGES.map(s => <option key={s} value={s}>Move: {s}</option>)}
                          </select>
                          <div style={{ display: 'flex', gap: '0.3rem' }}>
                            <button className="btn btn-ghost btn-sm" style={{ padding: '0.2rem 0.4rem', fontSize: '0.75rem' }} onClick={() => openEditModal(opp)}>✏</button>
                            {!isExecutive && (
                              <button className="btn btn-ghost btn-sm" style={{ padding: '0.2rem 0.4rem', fontSize: '0.75rem', color: '#ef4444' }} onClick={() => handleDelete(opp.id)}>🗑</button>
                            )}
                          </div>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        /* List View */
        <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
          <table className="data-table">
            <thead>
              <tr>
                <th>Deal Title</th>
                <th>Customer</th>
                <th>Amount</th>
                <th>Probability</th>
                <th>Weighted Value</th>
                <th>Stage</th>
                <th>Expected Close</th>
                <th>Assigned To</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {opportunities.map(opp => {
                const weighted = (opp.amount * opp.probability) / 100;
                return (
                  <tr key={opp.id}>
                    <td>
                      <strong>{opp.title}</strong>
                    </td>
                    <td>{opp.customerName}</td>
                    <td><strong>${opp.amount.toLocaleString()}</strong></td>
                    <td><span className="badge badge-sales">{opp.probability}%</span></td>
                    <td style={{ color: 'var(--accent-400)', fontWeight: 600 }}>${Math.round(weighted).toLocaleString()}</td>
                    <td><span className="badge badge-manager">{opp.stage}</span></td>
                    <td>{opp.expectedCloseDate ? opp.expectedCloseDate.split('T')[0] : 'N/A'}</td>
                    <td>{opp.assignedToUserName}</td>
                    <td>
                      <div style={{ display: 'flex', gap: '0.4rem' }}>
                        <button className="btn btn-outline btn-sm" onClick={() => openEditModal(opp)}>Edit</button>
                        {!isExecutive && (
                          <button className="btn btn-outline btn-sm" style={{ borderColor: '#ef4444', color: '#ef4444' }} onClick={() => handleDelete(opp.id)}>Delete</button>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* Create / Edit Modal */}
      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '540px' }}>
            <div className="modal-header">
              <h2>{modalMode === 'create' ? 'Create New Opportunity' : 'Edit Deal Details'}</h2>
              <button className="modal-close" onClick={() => setShowModal(false)}>✕</button>
            </div>
            
            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem', marginTop: '1rem' }}>
              <div className="form-group">
                <label>Customer Organization *</label>
                <select
                  value={formData.customerId}
                  onChange={(e) => setFormData({ ...formData, customerId: e.target.value })}
                  disabled={modalMode === 'edit'}
                >
                  <option value="">Select Customer...</option>
                  {customers.map(c => (
                    <option key={c.customerId} value={c.customerId}>{c.customerName} ({c.customerCode})</option>
                  ))}
                </select>
                {formErrors.customerId && <span className="error-text">{formErrors.customerId}</span>}
              </div>

              <div className="form-group">
                <label>Opportunity / Deal Title *</label>
                <input
                  type="text"
                  placeholder="e.g. Enterprise Cloud Migration"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                />
                {formErrors.title && <span className="error-text">{formErrors.title}</span>}
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div className="form-group">
                  <label>Deal Amount ($) *</label>
                  <input
                    type="number"
                    step="0.01"
                    min="1"
                    placeholder="e.g. 50000"
                    value={formData.amount}
                    onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                  />
                  {formErrors.amount && <span className="error-text">{formErrors.amount}</span>}
                </div>

                <div className="form-group">
                  <label>Win Probability (%) *</label>
                  <input
                    type="number"
                    min="0"
                    max="100"
                    value={formData.probability}
                    onChange={(e) => setFormData({ ...formData, probability: e.target.value })}
                  />
                  {formErrors.probability && <span className="error-text">{formErrors.probability}</span>}
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div className="form-group">
                  <label>Pipeline Stage</label>
                  <select
                    value={formData.stage}
                    onChange={(e) => {
                      const newSt = e.target.value;
                      let newProb = formData.probability;
                      if (newSt === 'Won') newProb = 100;
                      if (newSt === 'Lost') newProb = 0;
                      setFormData({ ...formData, stage: newSt, probability: newProb });
                    }}
                  >
                    {STAGES.map(s => <option key={s} value={s}>{s}</option>)}
                  </select>
                </div>

                <div className="form-group">
                  <label>Expected Close Date *</label>
                  <input
                    type="date"
                    value={formData.expectedCloseDate}
                    onChange={(e) => setFormData({ ...formData, expectedCloseDate: e.target.value })}
                  />
                  {formErrors.expectedCloseDate && <span className="error-text">{formErrors.expectedCloseDate}</span>}
                </div>
              </div>

              <div className="form-group">
                <label>Deal Notes & Requirements</label>
                <textarea
                  rows="3"
                  placeholder="Key technical scope, decision makers, budget milestones..."
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                ></textarea>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '0.5rem' }}>
                <button type="button" className="btn btn-outline" onClick={() => setShowModal(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary" disabled={actionLoading}>
                  {actionLoading ? 'Saving Deal...' : (modalMode === 'create' ? 'Create Opportunity' : 'Update Opportunity')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
