import React, { useState, useEffect } from 'react';
import { CustomerService } from '../services/customerService';
import { ValidationEngine } from '../services/validation';

export default function Customers({ showToast }) {
  const [customers, setCustomers] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);

  // Form states
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [company, setCompany] = useState('');
  const [city, setCity] = useState('');
  const [state, setState] = useState('');
  const [emailDupError, setEmailDupError] = useState('');
  const [phoneDupError, setPhoneDupError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const loadData = async () => {
    setLoading(true);
    const res = await CustomerService.getCustomers({ searchTerm, status: statusFilter });
    setCustomers(res.items || []);
    setLoading(false);
  };

  useEffect(() => {
    loadData();
  }, [searchTerm, statusFilter]);

  const handleEmailBlur = async () => {
    const val = ValidationEngine.validateEmail(email);
    if (!val.valid) {
      setEmailDupError(val.message);
      return;
    }
    const dup = await CustomerService.checkDuplicate(email, null);
    setEmailDupError(!dup.isEmailUnique ? 'A customer with this email already exists.' : '');
  };

  const handlePhoneBlur = async () => {
    const val = ValidationEngine.validatePhone(phone);
    if (!val.valid) {
      setPhoneDupError(val.message);
      return;
    }
    const dup = await CustomerService.checkDuplicate(null, phone);
    setPhoneDupError(!dup.isPhoneUnique ? 'A customer with this phone number already exists.' : '');
  };

  const handleCreateCustomer = async (e) => {
    e.preventDefault();
    const nameVal = ValidationEngine.validateRequired(name, 'Customer Name');
    const emailVal = ValidationEngine.validateEmail(email);
    const phoneVal = ValidationEngine.validatePhone(phone);

    if (!nameVal.valid || !emailVal.valid || !phoneVal.valid || emailDupError || phoneDupError) {
      showToast('Please correct form validation errors.', 'danger');
      return;
    }

    setSubmitting(true);
    const res = await CustomerService.createCustomer({
      customerName: name,
      email,
      phone,
      companyName: company,
      city,
      state
    });
    setSubmitting(false);

    if (res.success) {
      showToast(res.message, 'success');
      setShowModal(false);
      setName('');
      setEmail('');
      setPhone('');
      setCompany('');
      loadData();
    } else {
      showToast(res.message, 'danger');
    }
  };

  const handleDeactivate = async (id, custName) => {
    if (window.confirm(`Deactivate customer "${custName}"?`)) {
      const res = await CustomerService.deleteCustomer(id);
      if (res.success) {
        showToast(res.message, 'success');
        loadData();
      }
    }
  };

  return (
    <div className="main-content">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
        <div>
          <h1 style={{ fontSize: '1.75rem', marginBottom: '0.25rem' }}>Customer Master Data</h1>
          <p style={{ fontSize: '0.875rem' }}>Manage enterprise accounts, contacts, and relationship records</p>
        </div>
        <button className="btn btn-primary" onClick={() => setShowModal(true)}>+ New Customer</button>
      </div>

      {/* Toolbar */}
      <div style={{ display: 'flex', gap: '1rem', marginBottom: '1.5rem', flexWrap: 'wrap' }}>
        <input
          type="text"
          className="form-control"
          style={{ maxWidth: '400px' }}
          placeholder="Search by name, company, email, or phone..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
        <select className="form-control" style={{ maxWidth: '160px' }} value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
          <option value="All">All Statuses</option>
          <option value="Active">Active</option>
          <option value="Inactive">Inactive</option>
        </select>
      </div>

      {/* Table */}
      <div className="data-table-card">
        <table className="data-table">
          <thead>
            <tr>
              <th>Code</th>
              <th>Customer &amp; Company</th>
              <th>Email</th>
              <th>Phone</th>
              <th>Location</th>
              <th>Status</th>
              <th>Assigned Rep</th>
              <th style={{ textAlign: 'right' }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan="8" style={{ textAlign: 'center', padding: '2rem' }}>Loading customers...</td></tr>
            ) : customers.length === 0 ? (
              <tr><td colSpan="8" style={{ textAlign: 'center', padding: '2rem' }}>No customers found.</td></tr>
            ) : (
              customers.map((c) => (
                <tr key={c.customerId}>
                  <td><code style={{ color: 'var(--accent-cyan)', fontWeight: 600 }}>{c.customerCode}</code></td>
                  <td>
                    <div style={{ fontWeight: 600 }}>{c.customerName}</div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{c.companyName || 'Individual'}</div>
                  </td>
                  <td>{c.email}</td>
                  <td>{c.phone}</td>
                  <td>{c.city ? `${c.city}, ${c.state || ''}` : '—'}</td>
                  <td><span className="badge badge-sales">{c.status}</span></td>
                  <td><span style={{ fontSize: '0.8rem' }}>{c.ownerName || 'Unassigned'}</span></td>
                  <td style={{ textAlign: 'right' }}>
                    <button className="btn btn-outline btn-sm" onClick={() => handleDeactivate(c.customerId, c.customerName)}>Deactivate</button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Modal */}
      {showModal && (
        <div className="modal-backdrop">
          <div className="modal-box">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
              <h3 style={{ fontSize: '1.25rem' }}>Create New Customer</h3>
              <button className="btn btn-outline btn-sm" onClick={() => setShowModal(false)}>✕</button>
            </div>

            <form onSubmit={handleCreateCustomer}>
              <div className="form-group">
                <label className="form-label">Customer Name <span className="req">*</span></label>
                <input
                  type="text"
                  className="form-control"
                  placeholder="Acme Technologies Corp"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div className="form-group">
                  <label className="form-label">Corporate Email <span className="req">*</span></label>
                  <input
                    type="email"
                    className={`form-control ${emailDupError ? 'is-invalid' : ''}`}
                    placeholder="contact@acme.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    onBlur={handleEmailBlur}
                    required
                  />
                  {emailDupError && <div className="validation-feedback">{emailDupError}</div>}
                </div>

                <div className="form-group">
                  <label className="form-label">Mobile Phone (10 Digits) <span className="req">*</span></label>
                  <input
                    type="tel"
                    className={`form-control ${phoneDupError ? 'is-invalid' : ''}`}
                    placeholder="9876543210"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    onBlur={handlePhoneBlur}
                    required
                  />
                  {phoneDupError && <div className="validation-feedback">{phoneDupError}</div>}
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">Company Name</label>
                <input
                  type="text"
                  className="form-control"
                  placeholder="Acme Technologies"
                  value={company}
                  onChange={(e) => setCompany(e.target.value)}
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div className="form-group">
                  <label className="form-label">City</label>
                  <input type="text" className="form-control" placeholder="Bangalore" value={city} onChange={(e) => setCity(e.target.value)} />
                </div>
                <div className="form-group">
                  <label className="form-label">State</label>
                  <input type="text" className="form-control" placeholder="Karnataka" value={state} onChange={(e) => setState(e.target.value)} />
                </div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.5rem', marginTop: '1.5rem' }}>
                <button type="button" className="btn btn-secondary" onClick={() => setShowModal(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary" disabled={submitting}>
                  {submitting ? 'Saving...' : 'Save Customer'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
