import React, { useState, useEffect } from 'react';
import { LeadService } from '../services/leadService';
import { ValidationEngine } from '../services/validation';

export default function Leads({ showToast }) {
  const [leads, setLeads] = useState([]);
  const [statusTab, setStatusTab] = useState('All');
  const [searchTerm, setSearchTerm] = useState('');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showConvertModal, setShowConvertModal] = useState(false);
  const [activeConvertLead, setActiveConvertLead] = useState(null);

  // Create form states
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [company, setCompany] = useState('');
  const [source, setSource] = useState('Website Inquiry');
  const [expectedValue, setExpectedValue] = useState(25000);

  // Convert form states
  const [oppName, setOppName] = useState('');
  const [oppAmount, setOppAmount] = useState(10000);

  const loadData = async () => {
    const res = await LeadService.getLeads({ status: statusTab, searchTerm });
    setLeads(res.items || []);
  };

  useEffect(() => {
    loadData();
  }, [statusTab, searchTerm]);

  const handleCreateLead = async (e) => {
    e.preventDefault();
    const nameVal = ValidationEngine.validateRequired(name, 'Lead Name');
    const emailVal = ValidationEngine.validateEmail(email);
    const phoneVal = ValidationEngine.validatePhone(phone);

    if (!nameVal.valid || !emailVal.valid || !phoneVal.valid) {
      showToast('Please fulfill all validation rules.', 'danger');
      return;
    }

    const res = await LeadService.createLead({
      leadName: name,
      email,
      phone,
      companyName: company,
      source,
      expectedValue
    });

    if (res.success) {
      showToast(res.message, 'success');
      setShowCreateModal(false);
      setName('');
      setEmail('');
      setPhone('');
      loadData();
    }
  };

  const handleAdvanceStatus = async (id, current) => {
    let next = 'Contacted';
    if (current === 'Contacted') next = 'Qualified';
    else if (current === 'Qualified') next = 'Converted';

    const res = await LeadService.updateLeadStatus(id, next);
    if (res.success) {
      showToast(res.message, 'success');
      loadData();
    }
  };

  const openConvert = (lead) => {
    setActiveConvertLead(lead);
    setOppName(`${lead.leadName} - Deal`);
    setOppAmount(lead.expectedValue || 15000);
    setShowConvertModal(true);
  };

  const handleConvertLead = async (e) => {
    e.preventDefault();
    if (!activeConvertLead) return;

    if (oppAmount <= 0) {
      showToast('Opportunity amount must be greater than 0.', 'danger');
      return;
    }

    const res = await LeadService.convertLead(activeConvertLead.leadId, {
      opportunityName: oppName,
      opportunityAmount: oppAmount
    });

    if (res.success) {
      showToast(res.message, 'success');
      setShowConvertModal(false);
      loadData();
    } else {
      showToast(res.message, 'danger');
    }
  };

  const getStatusBadge = (st) => {
    switch(st.toLowerCase()) {
      case 'new': return 'badge-sales';
      case 'contacted': return 'badge-manager';
      case 'qualified': return 'badge-sales';
      case 'converted': return 'badge-admin';
      default: return 'badge-sales';
    }
  };

  return (
    <div className="main-content">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
        <div>
          <h1 style={{ fontSize: '1.75rem', marginBottom: '0.25rem' }}>Lead Pipeline Management</h1>
          <p style={{ fontSize: '0.875rem' }}>Capture inbound inquiries and convert qualified leads into customer accounts</p>
        </div>
        <button className="btn btn-primary" onClick={() => setShowCreateModal(true)}>+ Capture Lead</button>
      </div>

      {/* Status Filter Tabs */}
      <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1.5rem', overflowX: 'auto', paddingBottom: '0.5rem' }}>
        {['All', 'New', 'Contacted', 'Qualified', 'Converted', 'Lost'].map(tab => (
          <button
            key={tab}
            className={`btn btn-sm ${statusTab === tab ? 'btn-primary' : 'btn-secondary'}`}
            onClick={() => setStatusTab(tab)}
          >
            {tab}
          </button>
        ))}
      </div>

      <div style={{ marginBottom: '1.5rem', maxWidth: '400px' }}>
        <input
          type="text"
          className="form-control"
          placeholder="Search by name, company, email..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
      </div>

      {/* Table */}
      <div className="data-table-card">
        <table className="data-table">
          <thead>
            <tr>
              <th>Code</th>
              <th>Lead &amp; Company</th>
              <th>Contact</th>
              <th>Source</th>
              <th>Expected Value</th>
              <th>Status</th>
              <th>Assigned Rep</th>
              <th style={{ textAlign: 'right' }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {leads.length === 0 ? (
              <tr><td colSpan="8" style={{ textAlign: 'center', padding: '2rem' }}>No leads found.</td></tr>
            ) : (
              leads.map((l) => (
                <tr key={l.leadId}>
                  <td><code style={{ color: 'var(--accent-cyan)', fontWeight: 600 }}>{l.leadCode}</code></td>
                  <td>
                    <div style={{ fontWeight: 600 }}>{l.leadName}</div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{l.companyName || 'Individual'}</div>
                  </td>
                  <td>
                    <div style={{ fontSize: '0.85rem' }}>{l.email}</div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{l.phone}</div>
                  </td>
                  <td>{l.source}</td>
                  <td><strong>${(l.expectedValue || 0).toLocaleString()}</strong></td>
                  <td><span className={`badge ${getStatusBadge(l.status)}`}>{l.status}</span></td>
                  <td><span style={{ fontSize: '0.8rem' }}>{l.assignedUserName || 'Alex Morgan'}</span></td>
                  <td style={{ textAlign: 'right' }}>
                    {l.status !== 'Converted' ? (
                      <div style={{ display: 'inline-flex', gap: '0.35rem' }}>
                        <button className="btn btn-outline btn-sm" onClick={() => handleAdvanceStatus(l.leadId, l.status)}>
                          {l.status === 'New' ? 'Contact' : (l.status === 'Contacted' ? 'Qualify' : 'Status')}
                        </button>
                        <button className="btn btn-primary btn-sm" onClick={() => openConvert(l)}>
                          Convert ➔
                        </button>
                      </div>
                    ) : (
                      <span style={{ color: 'var(--accent-purple)', fontSize: '0.8rem', fontWeight: 600 }}>Converted ✓</span>
                    )}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Create Lead Modal */}
      {showCreateModal && (
        <div className="modal-backdrop">
          <div className="modal-box">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
              <h3 style={{ fontSize: '1.25rem' }}>Capture Inbound Lead</h3>
              <button className="btn btn-outline btn-sm" onClick={() => setShowCreateModal(false)}>✕</button>
            </div>

            <form onSubmit={handleCreateLead}>
              <div className="form-group">
                <label className="form-label">Lead Name <span className="req">*</span></label>
                <input type="text" className="form-control" placeholder="Acme Inbound" value={name} onChange={(e) => setName(e.target.value)} required />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div className="form-group">
                  <label className="form-label">Email <span className="req">*</span></label>
                  <input type="email" className="form-control" placeholder="lead@company.com" value={email} onChange={(e) => setEmail(e.target.value)} required />
                </div>
                <div className="form-group">
                  <label className="form-label">Phone <span className="req">*</span></label>
                  <input type="tel" className="form-control" placeholder="9811223344" value={phone} onChange={(e) => setPhone(e.target.value)} required />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div className="form-group">
                  <label className="form-label">Company</label>
                  <input type="text" className="form-control" placeholder="Nexa Dynamics" value={company} onChange={(e) => setCompany(e.target.value)} />
                </div>
                <div className="form-group">
                  <label className="form-label">Source</label>
                  <select className="form-control" value={source} onChange={(e) => setSource(e.target.value)}>
                    <option value="Website Inquiry">Website Inquiry</option>
                    <option value="Partner Referral">Partner Referral</option>
                    <option value="Direct Outreach">Direct Outreach</option>
                  </select>
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">Expected Value ($)</label>
                <input type="number" className="form-control" min="0" value={expectedValue} onChange={(e) => setExpectedValue(e.target.value)} />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.5rem', marginTop: '1.5rem' }}>
                <button type="button" className="btn btn-secondary" onClick={() => setShowCreateModal(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary">Capture Lead</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Convert Lead Modal */}
      {showConvertModal && activeConvertLead && (
        <div className="modal-backdrop">
          <div className="modal-box">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
              <h3 style={{ fontSize: '1.25rem' }}>Convert Lead to Customer Master</h3>
              <button className="btn btn-outline btn-sm" onClick={() => setShowConvertModal(false)}>✕</button>
            </div>

            <div className="alert alert-info">
              <span>ℹ️</span>
              <div>Provisions a new Customer record from this lead and initiates an Opportunity in the sales pipeline.</div>
            </div>

            <form onSubmit={handleConvertLead}>
              <div className="form-group">
                <label className="form-label">Target Lead</label>
                <div style={{ padding: '0.75rem', background: 'hsla(222, 47%, 10%, 0.8)', borderRadius: '8px', fontSize: '0.85rem' }}>
                  {activeConvertLead.leadName} ({activeConvertLead.companyName || 'Individual'}) • {activeConvertLead.email}
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">Initial Opportunity Name</label>
                <input type="text" className="form-control" value={oppName} onChange={(e) => setOppName(e.target.value)} required />
              </div>

              <div className="form-group">
                <label className="form-label">Opportunity Amount ($) <span className="req">*</span></label>
                <input type="number" className="form-control" min="1" value={oppAmount} onChange={(e) => setOppAmount(e.target.value)} required />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.5rem', marginTop: '1.5rem' }}>
                <button type="button" className="btn btn-secondary" onClick={() => setShowConvertModal(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary" style={{ background: 'linear-gradient(135deg, var(--accent-emerald), var(--primary-600))' }}>
                  Confirm &amp; Convert
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
