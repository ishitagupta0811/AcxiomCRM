import React, { useState, useEffect } from 'react';
import { FollowUpService } from '../services/followUpService';
import { CustomerService } from '../services/customerService';
import { LeadService } from '../services/leadService';
import { OpportunityService } from '../services/opportunityService';
import { AuthService } from '../services/authService';

const TYPES = ['Call', 'Meeting', 'Email', 'Task'];
const STATUSES = ['Planned', 'Completed', 'Cancelled'];

export default function FollowUps() {
  const [followUps, setFollowUps] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [leads, setLeads] = useState([]);
  const [opportunities, setOpportunities] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // Filters
  const [filterType, setFilterType] = useState('All'); // 'All' | 'Overdue' | 'Upcoming' | 'Completed'
  const [activityType, setActivityType] = useState('All');

  // Modal states
  const [showScheduleModal, setShowScheduleModal] = useState(false);
  const [showCompleteModal, setShowCompleteModal] = useState(false);
  const [selectedFollowUp, setSelectedFollowUp] = useState(null);

  // New Follow-Up Form
  const [targetType, setTargetType] = useState('Customer'); // 'Customer' | 'Lead' | 'Opportunity'
  const [formData, setFormData] = useState({
    customerId: '',
    leadId: '',
    opportunityId: '',
    followUpDate: new Date(Date.now() + 24 * 3600000).toISOString().slice(0, 16),
    type: 'Call',
    notes: ''
  });
  const [completionRemarks, setCompletionRemarks] = useState('');
  const [formErrors, setFormErrors] = useState({});
  const [actionLoading, setActionLoading] = useState(false);
  const [alertInfo, setAlertInfo] = useState(null);

  const currentUser = AuthService.getUser();
  const isExecutive = currentUser?.roles?.[0] === 'SalesExecutive';

  useEffect(() => {
    loadFollowUps();
    loadContextData();
  }, [filterType, activityType]);

  const loadFollowUps = async () => {
    try {
      setLoading(true);
      const filter = {
        type: activityType,
        overdueOnly: filterType === 'Overdue',
        upcomingOnly: filterType === 'Upcoming',
        status: filterType === 'Completed' ? 'Completed' : (filterType === 'Planned' ? 'Planned' : 'All')
      };
      const res = await FollowUpService.getFollowUps(filter);
      if (res.success) {
        setFollowUps(res.data.items);
      }
    } catch (err) {
      setAlertInfo({ type: 'error', message: 'Failed to load follow-up activities.' });
    } finally {
      setLoading(false);
    }
  };

  const loadContextData = async () => {
    try {
      const [cRes, lRes, oRes] = await Promise.all([
        CustomerService.getCustomers({ pageSize: 50 }),
        LeadService.getLeads({ pageSize: 50 }),
        OpportunityService.getOpportunities({ pageSize: 50 })
      ]);
      if (cRes.success) setCustomers(cRes.data.items);
      if (lRes.success) setLeads(lRes.data.items);
      if (oRes.success) setOpportunities(oRes.data.items);
    } catch (err) {
      console.error(err);
    }
  };

  const validateScheduleForm = () => {
    const errors = {};
    if (targetType === 'Customer' && !formData.customerId) errors.target = 'Please select a Customer';
    if (targetType === 'Lead' && !formData.leadId) errors.target = 'Please select a Lead';
    if (targetType === 'Opportunity' && !formData.opportunityId) errors.target = 'Please select an Opportunity';
    
    if (!formData.followUpDate) {
      errors.followUpDate = 'Follow-up date and time is required';
    } else {
      const selected = new Date(formData.followUpDate);
      const now = new Date();
      if (selected < new Date(now.getTime() - 5 * 60000)) {
        errors.followUpDate = 'Follow-up date cannot be in the past';
      }
    }
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleScheduleSubmit = async (e) => {
    e.preventDefault();
    if (!validateScheduleForm()) return;

    try {
      setActionLoading(true);
      const payload = {
        type: formData.type,
        followUpDate: formData.followUpDate,
        notes: formData.notes,
        customerId: targetType === 'Customer' ? parseInt(formData.customerId, 10) : null,
        leadId: targetType === 'Lead' ? parseInt(formData.leadId, 10) : null,
        opportunityId: targetType === 'Opportunity' ? parseInt(formData.opportunityId, 10) : null
      };

      const res = await FollowUpService.createFollowUp(payload);
      if (res.success) {
        setAlertInfo({ type: 'success', message: 'Follow-up activity scheduled successfully!' });
        setShowScheduleModal(false);
        loadFollowUps();
      } else {
        setAlertInfo({ type: 'error', message: res.message });
      }
    } catch (err) {
      setAlertInfo({ type: 'error', message: 'Failed to schedule follow-up.' });
    } finally {
      setActionLoading(false);
    }
  };

  const handleCompleteSubmit = async (e) => {
    e.preventDefault();
    if (!selectedFollowUp) return;

    try {
      setActionLoading(true);
      const res = await FollowUpService.completeFollowUp(selectedFollowUp.id, completionRemarks);
      if (res.success) {
        setAlertInfo({ type: 'success', message: 'Follow-up marked as completed!' });
        setShowCompleteModal(false);
        setSelectedFollowUp(null);
        setCompletionRemarks('');
        loadFollowUps();
      } else {
        setAlertInfo({ type: 'error', message: res.message });
      }
    } catch (err) {
      setAlertInfo({ type: 'error', message: 'Failed to complete follow-up.' });
    } finally {
      setActionLoading(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this follow-up?')) return;
    try {
      const res = await FollowUpService.deleteFollowUp(id);
      if (res.success) {
        setAlertInfo({ type: 'success', message: 'Follow-up record removed.' });
        loadFollowUps();
      } else {
        setAlertInfo({ type: 'error', message: res.message });
      }
    } catch (err) {
      setAlertInfo({ type: 'error', message: 'Failed to delete follow-up.' });
    }
  };

  const overdueCount = followUps.filter(f => f.isOverdue).length;

  return (
    <div className="followups-view">
      {alertInfo && (
        <div className={`alert alert-${alertInfo.type}`} style={{ marginBottom: '1.25rem' }}>
          <span>{alertInfo.type === 'success' ? '✓' : '⚠'}</span>
          <span>{alertInfo.message}</span>
          <button style={{ marginLeft: 'auto', background: 'none', border: 'none', color: 'inherit', cursor: 'pointer' }} onClick={() => setAlertInfo(null)}>✕</button>
        </div>
      )}

      {/* Page Header */}
      <div className="page-header" style={{ marginBottom: '1.5rem' }}>
        <div>
          <h1 className="page-title">Follow-Ups & Interaction Scheduler</h1>
          <p className="page-subtitle">Schedule customer touchpoints, lead outreach, and track overdue interaction reminders.</p>
        </div>
        <button className="btn btn-primary" onClick={() => {
          setFormData({
            customerId: customers.length > 0 ? customers[0].customerId.toString() : '',
            leadId: leads.length > 0 ? leads[0].leadId.toString() : '',
            opportunityId: opportunities.length > 0 ? opportunities[0].id.toString() : '',
            followUpDate: new Date(Date.now() + 24 * 3600000).toISOString().slice(0, 16),
            type: 'Call',
            notes: ''
          });
          setFormErrors({});
          setShowScheduleModal(true);
        }}>
          <span>+</span> Schedule Follow-Up
        </button>
      </div>

      {/* Filter Tabs & Type Selector */}
      <div className="table-controls" style={{ marginBottom: '1.5rem', flexWrap: 'wrap' }}>
        <div className="btn-group" style={{ display: 'flex', background: 'var(--bg-card)', borderRadius: '8px', padding: '3px', border: '1px solid var(--border-color)' }}>
          <button className={`btn btn-sm ${filterType === 'All' ? 'btn-primary' : 'btn-ghost'}`} onClick={() => setFilterType('All')}>
            All Tasks
          </button>
          <button className={`btn btn-sm ${filterType === 'Overdue' ? 'btn-primary' : 'btn-ghost'}`} onClick={() => setFilterType('Overdue')} style={{ position: 'relative' }}>
            ⚠ Overdue {overdueCount > 0 && <span className="badge badge-admin" style={{ marginLeft: '4px' }}>{overdueCount}</span>}
          </button>
          <button className={`btn btn-sm ${filterType === 'Upcoming' ? 'btn-primary' : 'btn-ghost'}`} onClick={() => setFilterType('Upcoming')}>
            Upcoming 7 Days
          </button>
          <button className={`btn btn-sm ${filterType === 'Completed' ? 'btn-primary' : 'btn-ghost'}`} onClick={() => setFilterType('Completed')}>
            Completed History
          </button>
        </div>

        <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
          <select value={activityType} onChange={(e) => setActivityType(e.target.value)}>
            <option value="All">All Types (Call, Meeting, etc.)</option>
            {TYPES.map(t => <option key={t} value={t}>{t}</option>)}
          </select>
          <button className="btn btn-outline" onClick={loadFollowUps}>Refresh</button>
        </div>
      </div>

      {loading ? (
        <div className="loading-spinner">Loading scheduled activities...</div>
      ) : followUps.length === 0 ? (
        <div className="card" style={{ textAlign: 'center', padding: '3rem 1rem', color: 'var(--text-muted)' }}>
          <h3>No follow-up activities matching current criteria</h3>
          <p style={{ marginTop: '0.5rem', fontSize: '0.9rem' }}>Schedule new touchpoints to keep client engagements on track.</p>
        </div>
      ) : (
        <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
          <table className="data-table">
            <thead>
              <tr>
                <th>Scheduled Date & Time</th>
                <th>Type</th>
                <th>Related Entity</th>
                <th>Notes / Objectives</th>
                <th>Assigned Rep</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {followUps.map(f => {
                const dateObj = new Date(f.followUpDate);
                const formattedDate = dateObj.toLocaleDateString() + ' ' + dateObj.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

                let relatedLabel = 'General';
                if (f.customerName) relatedLabel = `🏢 Customer: ${f.customerName}`;
                else if (f.leadName) relatedLabel = `🎯 Lead: ${f.leadName}`;
                else if (f.opportunityTitle) relatedLabel = `💼 Deal: ${f.opportunityTitle}`;

                let typeBadgeColor = '#3b82f6';
                if (f.type === 'Meeting') typeBadgeColor = '#8b5cf6';
                if (f.type === 'Email') typeBadgeColor = '#10b981';
                if (f.type === 'Task') typeBadgeColor = '#f59e0b';

                return (
                  <tr key={f.id} style={{ background: f.isOverdue ? 'rgba(239, 68, 68, 0.05)' : 'transparent' }}>
                    <td>
                      <div style={{ display: 'flex', flexDirection: 'column' }}>
                        <span style={{ fontWeight: 600, color: f.isOverdue ? '#ef4444' : 'var(--text-main)' }}>
                          {formattedDate}
                        </span>
                        {f.isOverdue && (
                          <span style={{ fontSize: '0.7rem', color: '#ef4444', fontWeight: 600 }}>
                            ⚠ OVERDUE
                          </span>
                        )}
                      </div>
                    </td>
                    <td>
                      <span className="badge" style={{ background: `${typeBadgeColor}20`, color: typeBadgeColor }}>
                        {f.type}
                      </span>
                    </td>
                    <td>
                      <span style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--primary-400)' }}>
                        {relatedLabel}
                      </span>
                    </td>
                    <td style={{ maxWidth: '280px' }}>
                      <div style={{ fontSize: '0.85rem', lineHeight: 1.4 }}>{f.notes || '-'}</div>
                      {f.completionRemarks && (
                        <div style={{ fontSize: '0.75rem', color: '#10b981', marginTop: '0.25rem', fontStyle: 'italic' }}>
                          ✓ Outcome: {f.completionRemarks}
                        </div>
                      )}
                    </td>
                    <td>{f.assignedToUserName}</td>
                    <td>
                      <span className={`badge ${f.status === 'Completed' ? 'badge-sales' : (f.isOverdue ? 'badge-admin' : 'badge-manager')}`}>
                        {f.status}
                      </span>
                    </td>
                    <td>
                      <div style={{ display: 'flex', gap: '0.4rem' }}>
                        {f.status === 'Planned' && (
                          <button
                            className="btn btn-primary btn-sm"
                            style={{ background: '#10b981', borderColor: '#10b981' }}
                            onClick={() => {
                              setSelectedFollowUp(f);
                              setCompletionRemarks('');
                              setShowCompleteModal(true);
                            }}
                          >
                            ✓ Complete
                          </button>
                        )}
                        {!isExecutive && (
                          <button className="btn btn-outline btn-sm" style={{ borderColor: '#ef4444', color: '#ef4444' }} onClick={() => handleDelete(f.id)}>
                            Delete
                          </button>
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

      {/* Schedule Follow-up Modal */}
      {showScheduleModal && (
        <div className="modal-overlay" onClick={() => setShowScheduleModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '520px' }}>
            <div className="modal-header">
              <h2>Schedule Follow-Up Interaction</h2>
              <button className="modal-close" onClick={() => setShowScheduleModal(false)}>✕</button>
            </div>

            <form onSubmit={handleScheduleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem', marginTop: '1rem' }}>
              <div className="form-group">
                <label>Associate With Entity *</label>
                <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '0.5rem' }}>
                  {['Customer', 'Lead', 'Opportunity'].map(t => (
                    <button
                      key={t}
                      type="button"
                      className={`btn btn-sm ${targetType === t ? 'btn-primary' : 'btn-outline'}`}
                      onClick={() => setTargetType(t)}
                    >
                      {t}
                    </button>
                  ))}
                </div>

                {targetType === 'Customer' && (
                  <select
                    value={formData.customerId}
                    onChange={(e) => setFormData({ ...formData, customerId: e.target.value })}
                  >
                    <option value="">Select Customer...</option>
                    {customers.map(c => <option key={c.customerId} value={c.customerId}>{c.customerName}</option>)}
                  </select>
                )}

                {targetType === 'Lead' && (
                  <select
                    value={formData.leadId}
                    onChange={(e) => setFormData({ ...formData, leadId: e.target.value })}
                  >
                    <option value="">Select Lead...</option>
                    {leads.map(l => <option key={l.leadId} value={l.leadId}>{l.leadName} ({l.companyName})</option>)}
                  </select>
                )}

                {targetType === 'Opportunity' && (
                  <select
                    value={formData.opportunityId}
                    onChange={(e) => setFormData({ ...formData, opportunityId: e.target.value })}
                  >
                    <option value="">Select Opportunity Deal...</option>
                    {opportunities.map(o => <option key={o.id} value={o.id}>{o.title} (${o.amount})</option>)}
                  </select>
                )}
                {formErrors.target && <span className="error-text">{formErrors.target}</span>}
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div className="form-group">
                  <label>Interaction Type *</label>
                  <select
                    value={formData.type}
                    onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                  >
                    {TYPES.map(t => <option key={t} value={t}>{t}</option>)}
                  </select>
                </div>

                <div className="form-group">
                  <label>Date & Time *</label>
                  <input
                    type="datetime-local"
                    value={formData.followUpDate}
                    onChange={(e) => setFormData({ ...formData, followUpDate: e.target.value })}
                  />
                  {formErrors.followUpDate && <span className="error-text">{formErrors.followUpDate}</span>}
                </div>
              </div>

              <div className="form-group">
                <label>Agenda / Discussion Objectives</label>
                <textarea
                  rows="3"
                  placeholder="e.g. Discuss revised proposal pricing and answer compliance questions..."
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                ></textarea>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem' }}>
                <button type="button" className="btn btn-outline" onClick={() => setShowScheduleModal(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary" disabled={actionLoading}>
                  {actionLoading ? 'Scheduling...' : 'Schedule Activity'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Complete Follow-up Modal */}
      {showCompleteModal && selectedFollowUp && (
        <div className="modal-overlay" onClick={() => setShowCompleteModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '480px' }}>
            <div className="modal-header">
              <h2>Complete Follow-Up</h2>
              <button className="modal-close" onClick={() => setShowCompleteModal(false)}>✕</button>
            </div>

            <form onSubmit={handleCompleteSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem', marginTop: '1rem' }}>
              <p style={{ fontSize: '0.9rem', color: 'var(--text-muted)' }}>
                Record the outcome or next steps from this interaction with <strong>{selectedFollowUp.customerName || selectedFollowUp.leadName || selectedFollowUp.opportunityTitle}</strong>.
              </p>

              <div className="form-group">
                <label>Outcome & Completion Remarks *</label>
                <textarea
                  rows="4"
                  placeholder="e.g. Client agreed on the terms. Next meeting scheduled with technical team..."
                  value={completionRemarks}
                  onChange={(e) => setCompletionRemarks(e.target.value)}
                  required
                ></textarea>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem' }}>
                <button type="button" className="btn btn-outline" onClick={() => setShowCompleteModal(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary" style={{ background: '#10b981', borderColor: '#10b981' }} disabled={actionLoading}>
                  {actionLoading ? 'Submitting...' : 'Mark as Completed'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
