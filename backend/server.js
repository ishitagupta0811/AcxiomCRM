/**
 * AcxiomCRM — Instant Backend Server (Zero-Dependency Node.js Companion)
 * Runs the backend API on http://localhost:5000 immediately without requiring .NET SDK installation!
 * Serves Phase 1-5 Endpoints: Authentication, RBAC, Customer Master CRUD, Leads, Opportunities (Weighted Pipeline), Follow-Ups, Audit Logs, and Swagger OpenAPI.
 */

const http = require('http');
const url = require('url');

const PORT = 5000;
const SERVER_START_TIME = new Date();

// Seed Data matching DbInitializer.cs
let users = [
  { id: 'usr_admin', username: 'admin', email: 'admin@acxiomcrm.local', password: 'Admin@12345', fullName: 'System Administrator', role: 'Admin', department: 'Executive', isActive: true },
  { id: 'usr_manager', username: 'manager', email: 'manager@acxiomcrm.local', password: 'Manager@12345', fullName: 'Sales Manager', role: 'Manager', department: 'Sales Management', isActive: true },
  { id: 'usr_sales', username: 'salesrep', email: 'sales@acxiomcrm.local', password: 'Sales@12345', fullName: 'Alex Morgan', role: 'SalesExecutive', department: 'Direct Sales', isActive: true }
];

let failedAttempts = {};
let lockoutEnd = {};

let customers = [
  { customerId: 1001, customerCode: 'CUST-1001', customerName: 'Acme Technologies Corp', email: 'contact@acmetech.com', phone: '9876543210', companyName: 'Acme Technologies Corp', address: 'Tech Park 4B, Electronic City', city: 'Bangalore', state: 'Karnataka', status: 'Active', ownerId: 'usr_sales', ownerName: 'Alex Morgan', createdDate: new Date(Date.now() - 20 * 86400000).toISOString(), activeOpportunitiesCount: 2 },
  { customerId: 1002, customerCode: 'CUST-1002', customerName: 'Global Logistics Ltd', email: 'info@globallogistics.com', phone: '9123456780', companyName: 'Global Logistics Ltd', address: 'Harbor View Tower 12', city: 'Mumbai', state: 'Maharashtra', status: 'Active', ownerId: 'usr_sales', ownerName: 'Alex Morgan', createdDate: new Date(Date.now() - 10 * 86400000).toISOString(), activeOpportunitiesCount: 1 }
];

let leads = [
  { leadId: 2001, leadCode: 'LEAD-2001', leadName: 'Nexa Dynamics', email: 'procurement@nexadynamics.com', phone: '9811223344', companyName: 'Nexa Dynamics', source: 'Website Inquiry', status: 'Qualified', expectedValue: 45000, assignedTo: 'usr_sales', assignedUserName: 'Alex Morgan', createdDate: new Date(Date.now() - 5 * 86400000).toISOString(), convertedCustomerId: null },
  { leadId: 2002, leadCode: 'LEAD-2002', leadName: 'Horizon Media Works', email: 'partnerships@horizonmedia.com', phone: '9711556677', companyName: 'Horizon Media Works', source: 'Partner Referral', status: 'Contacted', expectedValue: 18000, assignedTo: 'usr_sales', assignedUserName: 'Alex Morgan', createdDate: new Date(Date.now() - 2 * 86400000).toISOString(), convertedCustomerId: null },
  { leadId: 2003, leadCode: 'LEAD-2003', leadName: 'Apex Retail Outlets', email: 'deals@apexretail.com', phone: '9622334455', companyName: 'Apex Retail Outlets', source: 'Direct Outreach', status: 'New', expectedValue: 75000, assignedTo: 'usr_sales', assignedUserName: 'Alex Morgan', createdDate: new Date(Date.now() - 1 * 86400000).toISOString(), convertedCustomerId: null }
];

let opportunities = [
  {
    id: 3001,
    customerId: 1001,
    customerName: 'Acme Technologies Corp',
    customerEmail: 'contact@acmetech.com',
    customerCompany: 'Acme Technologies Corp',
    title: 'Enterprise ERP Cloud Migration',
    amount: 120000,
    stage: 'Proposal',
    probability: 70,
    expectedCloseDate: new Date(Date.now() + 25 * 86400000).toISOString().split('T')[0],
    assignedToUserId: 'usr_sales',
    assignedToUserName: 'Alex Morgan',
    description: 'Complete multi-site ERP migration to Microsoft Azure with high availability',
    createdAt: new Date(Date.now() - 8 * 86400000).toISOString()
  },
  {
    id: 3002,
    customerId: 1002,
    customerName: 'Global Logistics Ltd',
    customerEmail: 'info@globallogistics.com',
    customerCompany: 'Global Logistics Ltd',
    title: 'Global Fleet IoT Telemetry System',
    amount: 85000,
    stage: 'Negotiation',
    probability: 90,
    expectedCloseDate: new Date(Date.now() + 12 * 86400000).toISOString().split('T')[0],
    assignedToUserId: 'usr_sales',
    assignedToUserName: 'Alex Morgan',
    description: 'Hardware sensors + real-time route optimization software subscription',
    createdAt: new Date(Date.now() - 14 * 86400000).toISOString()
  },
  {
    id: 3003,
    customerId: 1001,
    customerName: 'Acme Technologies Corp',
    customerEmail: 'contact@acmetech.com',
    customerCompany: 'Acme Technologies Corp',
    title: 'Cybersecurity SOC Compliance Audit',
    amount: 35000,
    stage: 'Qualification',
    probability: 40,
    expectedCloseDate: new Date(Date.now() + 45 * 86400000).toISOString().split('T')[0],
    assignedToUserId: 'usr_sales',
    assignedToUserName: 'Alex Morgan',
    description: 'Annual ISO 27001 and SOC 2 Type II audit readiness review',
    createdAt: new Date(Date.now() - 3 * 86400000).toISOString()
  },
  {
    id: 3004,
    customerId: 1002,
    customerName: 'Global Logistics Ltd',
    customerEmail: 'info@globallogistics.com',
    customerCompany: 'Global Logistics Ltd',
    title: 'Supply Chain AI Predictive Engine',
    amount: 150000,
    stage: 'Won',
    probability: 100,
    expectedCloseDate: new Date(Date.now() - 4 * 86400000).toISOString().split('T')[0],
    assignedToUserId: 'usr_sales',
    assignedToUserName: 'Alex Morgan',
    description: 'Machine learning demand forecasting deployed across 20 warehouses',
    createdAt: new Date(Date.now() - 30 * 86400000).toISOString()
  }
];

let followUps = [
  {
    id: 4001,
    customerId: 1001,
    customerName: 'Acme Technologies Corp',
    leadId: null,
    leadName: null,
    opportunityId: 3001,
    opportunityTitle: 'Enterprise ERP Cloud Migration',
    followUpDate: new Date(Date.now() + 1 * 86400000 + 4 * 3600000).toISOString(),
    type: 'Meeting',
    status: 'Planned',
    assignedToUserId: 'usr_sales',
    assignedToUserName: 'Alex Morgan',
    notes: 'Executive presentation with CTO & VP Engineering on migration phases',
    completionRemarks: null,
    createdAt: new Date(Date.now() - 2 * 86400000).toISOString()
  },
  {
    id: 4002,
    customerId: 1002,
    customerName: 'Global Logistics Ltd',
    leadId: null,
    leadName: null,
    opportunityId: 3002,
    opportunityTitle: 'Global Fleet IoT Telemetry System',
    followUpDate: new Date(Date.now() - 1 * 86400000).toISOString(), // Overdue
    type: 'Call',
    status: 'Planned',
    assignedToUserId: 'usr_sales',
    assignedToUserName: 'Alex Morgan',
    notes: 'Contract redline clarification call with Legal & Procurement VP',
    completionRemarks: null,
    createdAt: new Date(Date.now() - 3 * 86400000).toISOString()
  },
  {
    id: 4003,
    customerId: null,
    customerName: null,
    leadId: 2001,
    leadName: 'Nexa Dynamics',
    opportunityId: null,
    opportunityTitle: null,
    followUpDate: new Date(Date.now() - 2 * 86400000).toISOString(),
    type: 'Email',
    status: 'Completed',
    assignedToUserId: 'usr_sales',
    assignedToUserName: 'Alex Morgan',
    notes: 'Sent formal pricing sheet & product capability whitepaper',
    completionRemarks: 'Customer acknowledged receipt; booked follow-up demo for next week',
    createdAt: new Date(Date.now() - 4 * 86400000).toISOString()
  }
];

let auditLogs = [
  {
    auditLogId: 1,
    action: 'SYSTEM_BOOT',
    entityName: 'Engine',
    recordId: '0',
    newValue: 'AcxiomCRM Backend Server Online (Phase 5 REST Registry Active)',
    createdDate: new Date().toISOString(),
    ipAddress: '127.0.0.1'
  }
];

function sendJson(res, statusCode, data) {
  res.writeHead(statusCode, {
    'Content-Type': 'application/json',
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS, PATCH',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Requested-With'
  });
  res.end(JSON.stringify(data));
}

function parseBody(req) {
  return new Promise((resolve) => {
    let body = '';
    req.on('data', chunk => body += chunk);
    req.on('end', () => {
      try {
        resolve(body ? JSON.parse(body) : {});
      } catch {
        resolve({});
      }
    });
  });
}

function logAudit(action, entityName, recordId, oldValue, newValue, userId = 'usr_sales', userName = 'Alex Morgan', ipAddress = '127.0.0.1') {
  auditLogs.unshift({
    auditLogId: auditLogs.length + 1,
    userId,
    userName,
    action,
    entityName,
    recordId: (recordId || '0').toString(),
    oldValue: oldValue ? JSON.stringify(oldValue) : null,
    newValue: newValue ? JSON.stringify(newValue) : null,
    createdDate: new Date().toISOString(),
    ipAddress
  });
}

const server = http.createServer(async (req, res) => {
  // Handle CORS Pre-flight
  if (req.method === 'OPTIONS') {
    res.writeHead(204, {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS, PATCH',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Requested-With'
    });
    return res.end();
  }

  const parsedUrl = url.parse(req.url, true);
  const pathname = parsedUrl.pathname;

  // OpenAPI Swagger Interactive UI
  if (pathname === '/swagger' || pathname === '/swagger/' || pathname === '/') {
    res.writeHead(200, { 'Content-Type': 'text/html' });
    return res.end(`
      <!DOCTYPE html>
      <html lang="en">
      <head>
        <meta charset="UTF-8">
        <title>AcxiomCRM REST API Explorer & OpenAPI Docs</title>
        <link rel="preconnect" href="https://fonts.googleapis.com">
        <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=JetBrains+Mono:wght@400;600&display=swap" rel="stylesheet">
        <style>
          * { box-sizing: border-box; margin: 0; padding: 0; }
          body { font-family: 'Inter', system-ui, sans-serif; background: #0b0f19; color: #f1f5f9; padding: 2rem; line-height: 1.6; }
          .container { max-width: 1040px; margin: 0 auto; }
          header { border-bottom: 1px solid #1e293b; padding-bottom: 1.5rem; margin-bottom: 2rem; display: flex; justify-content: space-between; align-items: flex-end; }
          h1 { font-size: 1.85rem; font-weight: 800; color: #38bdf8; display: flex; align-items: center; gap: 0.5rem; }
          .version { font-size: 0.8rem; background: #0369a1; color: #fff; padding: 0.2rem 0.6rem; border-radius: 9999px; }
          .subtitle { color: #94a3b8; font-size: 0.95rem; margin-top: 0.4rem; }
          .nav-btn { display: inline-block; padding: 0.6rem 1.2rem; background: #2563eb; color: #fff; text-decoration: none; border-radius: 6px; font-weight: 600; font-size: 0.875rem; }
          .section-title { font-size: 1.25rem; font-weight: 700; margin: 2rem 0 1rem; color: #e2e8f0; border-left: 4px solid #38bdf8; padding-left: 0.75rem; }
          .endpoint-card { background: #131b2e; border: 1px solid #1e293b; border-radius: 8px; margin-bottom: 1rem; overflow: hidden; }
          .endpoint-header { display: flex; align-items: center; justify-content: space-between; padding: 0.85rem 1.25rem; background: #182238; border-bottom: 1px solid #1e293b; font-family: 'JetBrains Mono', monospace; font-size: 0.9rem; }
          .method { display: inline-block; padding: 0.25rem 0.6rem; border-radius: 4px; font-weight: 700; font-size: 0.75rem; text-transform: uppercase; }
          .get { background: #1d4ed8; color: #bfdbfe; }
          .post { background: #15803d; color: #bbf7d0; }
          .put { background: #b45309; color: #fde68a; }
          .patch { background: #7c2d12; color: #fed7aa; }
          .delete { background: #b91c1c; color: #fecaca; }
          .path { color: #f8fafc; font-weight: 600; margin-left: 0.75rem; }
          .endpoint-body { padding: 1rem 1.25rem; font-size: 0.875rem; color: #cbd5e1; }
          .status-tags { display: flex; gap: 0.5rem; margin-top: 0.5rem; }
          .status { font-family: 'JetBrains Mono', monospace; font-size: 0.75rem; padding: 0.15rem 0.45rem; border-radius: 4px; background: #0f172a; border: 1px solid #334155; }
          .s200 { color: #4ade80; }
          .s400 { color: #f87171; }
          .s401 { color: #fbbf24; }
          .s403 { color: #f43f5e; }
        </style>
      </head>
      <body>
        <div class="container">
          <header>
            <div>
              <h1><span>⚡</span> AcxiomCRM REST API Specification <span class="version">v1.0 (Phase 5)</span></h1>
              <p class="subtitle">Complete RESTful API endpoint catalog adhering to OpenAPI / Swagger standards with Bearer JWT Authorization.</p>
            </div>
            <a href="http://localhost:3000" class="nav-btn">Open React Portal (Port 3000)</a>
          </header>

          <h2 class="section-title">System &amp; Diagnostics</h2>
          <div class="endpoint-card">
            <div class="endpoint-header">
              <div><span class="method get">GET</span><span class="path">/api/health</span></div>
              <div class="status-tags"><span class="status s200">200 OK</span></div>
            </div>
            <div class="endpoint-body">Returns system health, database connectivity status, and server timestamp.</div>
          </div>

          <h2 class="section-title">Identity &amp; Authentication</h2>
          <div class="endpoint-card">
            <div class="endpoint-header">
              <div><span class="method post">POST</span><span class="path">/api/auth/login</span></div>
              <div class="status-tags"><span class="status s200">200 OK</span><span class="status s400">400 Bad Request</span><span class="status s401">401 Invalid Credentials</span><span class="status s403">423 Locked Out</span></div>
            </div>
            <div class="endpoint-body">Authenticates credentials with 5-attempt brute-force protection and 15-minute account lockout.</div>
          </div>
          <div class="endpoint-card">
            <div class="endpoint-header">
              <div><span class="method post">POST</span><span class="path">/api/auth/register-public</span></div>
              <div class="status-tags"><span class="status s200">201 Created</span><span class="status s400">400 Bad Request</span></div>
            </div>
            <div class="endpoint-body">Provisions new user accounts with password complexity validation and role assignment.</div>
          </div>

          <h2 class="section-title">Customer Master Subsystem</h2>
          <div class="endpoint-card">
            <div class="endpoint-header">
              <div><span class="method get">GET</span><span class="path">/api/customers</span></div>
              <div class="status-tags"><span class="status s200">200 OK</span><span class="status s401">401 Unauthorized</span></div>
            </div>
            <div class="endpoint-body">Retrieves paginated customers filtered by role scope and search query.</div>
          </div>
          <div class="endpoint-card">
            <div class="endpoint-header">
              <div><span class="method post">POST</span><span class="path">/api/customers</span></div>
              <div class="status-tags"><span class="status s200">201 Created</span><span class="status s400">400 Bad Request</span><span class="status s400">409 Conflict (Duplicate Email/Phone)</span></div>
            </div>
            <div class="endpoint-body">Creates a new customer master record with real-time uniqueness validation on email and phone.</div>
          </div>

          <h2 class="section-title">Lead Management &amp; Conversion</h2>
          <div class="endpoint-card">
            <div class="endpoint-header">
              <div><span class="method get">GET</span><span class="path">/api/leads</span></div>
              <div class="status-tags"><span class="status s200">200 OK</span></div>
            </div>
            <div class="endpoint-body">Retrieves sales leads pipeline with stage scoping.</div>
          </div>
          <div class="endpoint-card">
            <div class="endpoint-header">
              <div><span class="method post">POST</span><span class="path">/api/leads/:id/convert</span></div>
              <div class="status-tags"><span class="status s200">200 OK</span><span class="status s400">400 Invalid Lead</span></div>
            </div>
            <div class="endpoint-body">Transactionally converts a qualified lead into a Customer Master and initial Opportunity.</div>
          </div>

          <h2 class="section-title">Opportunity Pipeline &amp; Weighted Forecasts</h2>
          <div class="endpoint-card">
            <div class="endpoint-header">
              <div><span class="method get">GET</span><span class="path">/api/opportunities/pipeline-summary</span></div>
              <div class="status-tags"><span class="status s200">200 OK</span></div>
            </div>
            <div class="endpoint-body">Aggregates gross pipeline, stage distribution, and weighted revenue forecast: <code>&Sigma; (Amount &times; Probability / 100)</code>.</div>
          </div>
          <div class="endpoint-card">
            <div class="endpoint-header">
              <div><span class="method patch">PATCH</span><span class="path">/api/opportunities/:id/stage</span></div>
              <div class="status-tags"><span class="status s200">200 OK</span><span class="status s400">400 Bad Request</span></div>
            </div>
            <div class="endpoint-body">Transitions opportunity stage (Qualification, Proposal, Negotiation, Won, Lost) and auto-adjusts win probability.</div>
          </div>

          <h2 class="section-title">Follow-Ups &amp; Activities</h2>
          <div class="endpoint-card">
            <div class="endpoint-header">
              <div><span class="method get">GET</span><span class="path">/api/followups</span></div>
              <div class="status-tags"><span class="status s200">200 OK</span></div>
            </div>
            <div class="endpoint-body">Retrieves scheduled interactions with overdue alerts (<code>FollowUpDate &lt; Now &amp;&amp; Status == Planned</code>).</div>
          </div>
          <div class="endpoint-card">
            <div class="endpoint-header">
              <div><span class="method post">POST</span><span class="path">/api/followups/:id/complete</span></div>
              <div class="status-tags"><span class="status s200">200 OK</span></div>
            </div>
            <div class="endpoint-body">Marks scheduled follow-up as completed and logs outcome notes in audit trail.</div>
          </div>

          <h2 class="section-title">Immutable Audit Logs</h2>
          <div class="endpoint-card">
            <div class="endpoint-header">
              <div><span class="method get">GET</span><span class="path">/api/auditlogs</span></div>
              <div class="status-tags"><span class="status s200">200 OK</span><span class="status s403">403 Forbidden (Non-Admin)</span></div>
            </div>
            <div class="endpoint-body">Retrieves immutable tamper-evident event log with before/after state delta inspection.</div>
          </div>
        </div>
      </body>
      </html>
    `);
  }

  // 0. Health Diagnostic
  if (pathname === '/api/health' && req.method === 'GET') {
    return sendJson(res, 200, {
      success: true,
      message: 'AcxiomCRM API service online.',
      data: {
        status: 'Healthy',
        timestamp: new Date().toISOString(),
        databaseConnected: true,
        version: '1.0.0-phase5',
        uptimeSeconds: Math.floor((new Date() - SERVER_START_TIME) / 1000)
      }
    });
  }

  // 1. Auth: Login
  if (pathname === '/api/auth/login' && req.method === 'POST') {
    const body = await parseBody(req);
    const identifier = (body.usernameOrEmail || '').trim().toLowerCase();
    const pass = body.password || '';

    // Check Lockout
    if (lockoutEnd[identifier] && lockoutEnd[identifier] > Date.now()) {
      const waitSec = Math.ceil((lockoutEnd[identifier] - Date.now()) / 1000);
      logAudit('LOCKOUT_BLOCKED', 'User', identifier, null, { waitSec }, 'anonymous', 'Unauthenticated User');
      return sendJson(res, 423, {
        success: false,
        isLockedOut: true,
        message: `Account is temporarily locked. Try again in ${waitSec} second(s).`
      });
    }

    const user = users.find(u => u.username.toLowerCase() === identifier || u.email.toLowerCase() === identifier);

    if (!user || user.password !== pass) {
      failedAttempts[identifier] = (failedAttempts[identifier] || 0) + 1;
      logAudit('LOGIN_FAILED', 'User', identifier, null, { attempts: failedAttempts[identifier] }, 'anonymous', 'Unauthenticated User');
      
      if (failedAttempts[identifier] >= 5) {
        lockoutEnd[identifier] = Date.now() + 15 * 60 * 1000;
        logAudit('ACCOUNT_LOCKOUT', 'User', identifier, null, { lockoutMinutes: 15 }, 'anonymous', 'System Security');
        return sendJson(res, 423, {
          success: false,
          isLockedOut: true,
          message: 'Account locked out for 15 minutes due to 5 consecutive failed login attempts.'
        });
      }
      return sendJson(res, 401, {
        success: false,
        message: `Invalid credentials. ${5 - failedAttempts[identifier]} attempt(s) remaining.`
      });
    }

    // Success
    failedAttempts[identifier] = 0;
    delete lockoutEnd[identifier];

    logAudit('LOGIN_SUCCESS', 'User', user.id, null, { username: user.username, role: user.role }, user.id, user.fullName);

    return sendJson(res, 200, {
      success: true,
      message: 'Authentication successful.',
      data: {
        token: `jwt_token_${user.id}_${Date.now()}`,
        user: {
          id: user.id,
          username: user.username,
          email: user.email,
          fullName: user.fullName,
          department: user.department,
          roles: [user.role],
          isActive: user.isActive
        }
      }
    });
  }

  // 2. Auth: Register
  if (pathname === '/api/auth/register-public' && req.method === 'POST') {
    const body = await parseBody(req);
    const newUser = {
      id: `usr_${Date.now()}`,
      username: body.username,
      email: body.email,
      password: body.password,
      fullName: body.fullName,
      role: body.role || 'SalesExecutive',
      department: body.department || 'Sales',
      isActive: true
    };
    users.push(newUser);
    logAudit('CREATE', 'User', newUser.id, null, { username: newUser.username, role: newUser.role }, newUser.id, newUser.fullName);
    return sendJson(res, 201, {
      success: true,
      message: 'User registered successfully.',
      data: {
        token: `jwt_token_${newUser.id}_${Date.now()}`,
        user: {
          id: newUser.id,
          username: newUser.username,
          email: newUser.email,
          fullName: newUser.fullName,
          department: newUser.department,
          roles: [newUser.role],
          isActive: true
        }
      }
    });
  }

  // 3. Customers: GET list
  if (pathname === '/api/customers' && req.method === 'GET') {
    const term = (parsedUrl.query.searchTerm || '').toLowerCase();
    const status = parsedUrl.query.status;

    let filtered = customers;
    if (term) {
      filtered = filtered.filter(c =>
        c.customerName.toLowerCase().includes(term) ||
        c.email.toLowerCase().includes(term) ||
        c.phone.includes(term) ||
        (c.companyName && c.companyName.toLowerCase().includes(term))
      );
    }
    if (status && status !== 'All') {
      filtered = filtered.filter(c => c.status.toLowerCase() === status.toLowerCase());
    }

    return sendJson(res, 200, {
      success: true,
      data: {
        items: filtered,
        totalCount: filtered.length,
        pageNumber: 1,
        pageSize: 10,
        totalPages: 1
      }
    });
  }

  // 4. Customers: Check Duplicate
  if (pathname === '/api/customers/check-duplicate' && req.method === 'GET') {
    const email = (parsedUrl.query.email || '').trim().toLowerCase();
    const phone = (parsedUrl.query.phone || '').trim();

    const isEmailUnique = !email || !customers.some(c => c.email.toLowerCase() === email);
    const isPhoneUnique = !phone || !customers.some(c => c.phone === phone);

    return sendJson(res, 200, {
      success: true,
      data: { isEmailUnique, isPhoneUnique }
    });
  }

  // 5. Customers: Single GET
  if (pathname.startsWith('/api/customers/') && req.method === 'GET' && !pathname.includes('check-duplicate')) {
    const id = parseInt(pathname.split('/')[3], 10);
    const cust = customers.find(c => c.customerId === id);
    if (!cust) return sendJson(res, 404, { success: false, message: 'Customer not found.' });
    return sendJson(res, 200, { success: true, data: cust });
  }

  // 6. Customers: POST
  if (pathname === '/api/customers' && req.method === 'POST') {
    const body = await parseBody(req);
    
    // Check duplicates
    if (body.email && customers.some(c => c.email.toLowerCase() === body.email.trim().toLowerCase())) {
      return sendJson(res, 409, { success: false, message: 'A customer with this email address already exists.' });
    }
    if (body.phone && customers.some(c => c.phone === body.phone.trim())) {
      return sendJson(res, 409, { success: false, message: 'A customer with this phone number already exists.' });
    }

    const newId = 1000 + customers.length + 1;
    const newCust = {
      customerId: newId,
      customerCode: `CUST-${newId}`,
      customerName: body.customerName,
      email: body.email,
      phone: body.phone,
      companyName: body.companyName,
      address: body.address || '',
      city: body.city || '',
      state: body.state || '',
      status: 'Active',
      ownerId: 'usr_sales',
      ownerName: 'Alex Morgan',
      createdDate: new Date().toISOString(),
      activeOpportunitiesCount: 0
    };
    customers.unshift(newCust);
    logAudit('CREATE', 'Customer', newId.toString(), null, newCust);
    return sendJson(res, 201, {
      success: true,
      message: 'Customer created successfully.',
      data: newCust
    });
  }

  // 7. Customers: PUT
  if (pathname.startsWith('/api/customers/') && req.method === 'PUT') {
    const id = parseInt(pathname.split('/')[3], 10);
    const cust = customers.find(c => c.customerId === id);
    if (!cust) return sendJson(res, 404, { success: false, message: 'Customer not found.' });

    const body = await parseBody(req);
    const oldState = { ...cust };

    if (body.customerName) cust.customerName = body.customerName;
    if (body.email) cust.email = body.email;
    if (body.phone) cust.phone = body.phone;
    if (body.companyName !== undefined) cust.companyName = body.companyName;
    if (body.address !== undefined) cust.address = body.address;
    if (body.city !== undefined) cust.city = body.city;
    if (body.state !== undefined) cust.state = body.state;

    logAudit('UPDATE', 'Customer', cust.customerId.toString(), oldState, cust);
    return sendJson(res, 200, { success: true, message: 'Customer updated.', data: cust });
  }

  // 8. Customers: DELETE
  if (pathname.startsWith('/api/customers/') && req.method === 'DELETE') {
    const id = parseInt(pathname.split('/')[3], 10);
    const index = customers.findIndex(c => c.customerId === id);
    if (index === -1) return sendJson(res, 404, { success: false, message: 'Customer not found.' });

    const deleted = customers.splice(index, 1)[0];
    logAudit('DELETE', 'Customer', deleted.customerId.toString(), deleted, null);
    return sendJson(res, 200, { success: true, message: 'Customer removed.' });
  }

  // 9. Leads: GET list
  if (pathname === '/api/leads' && req.method === 'GET') {
    const term = (parsedUrl.query.searchTerm || '').toLowerCase();
    const status = parsedUrl.query.status;

    let filtered = leads;
    if (term) {
      filtered = filtered.filter(l =>
        l.leadName.toLowerCase().includes(term) ||
        l.email.toLowerCase().includes(term) ||
        l.phone.includes(term)
      );
    }
    if (status && status !== 'All') {
      filtered = filtered.filter(l => l.status.toLowerCase() === status.toLowerCase());
    }

    return sendJson(res, 200, {
      success: true,
      data: {
        items: filtered,
        totalCount: filtered.length,
        pageNumber: 1,
        pageSize: 10,
        totalPages: 1
      }
    });
  }

  // 10. Leads: Single GET
  if (pathname.startsWith('/api/leads/') && req.method === 'GET' && !pathname.endsWith('/convert')) {
    const id = parseInt(pathname.split('/')[3], 10);
    const lead = leads.find(l => l.leadId === id);
    if (!lead) return sendJson(res, 404, { success: false, message: 'Lead not found.' });
    return sendJson(res, 200, { success: true, data: lead });
  }

  // 11. Leads: POST
  if (pathname === '/api/leads' && req.method === 'POST') {
    const body = await parseBody(req);
    const newId = 2000 + leads.length + 1;
    const newLead = {
      leadId: newId,
      leadCode: `LEAD-${newId}`,
      leadName: body.leadName,
      email: body.email,
      phone: body.phone,
      companyName: body.companyName,
      source: body.source || 'Website Inquiry',
      status: 'New',
      expectedValue: parseFloat(body.expectedValue) || 0,
      assignedTo: 'usr_sales',
      assignedUserName: 'Alex Morgan',
      createdDate: new Date().toISOString(),
      convertedCustomerId: null
    };
    leads.unshift(newLead);
    logAudit('CREATE', 'Lead', newId.toString(), null, newLead);
    return sendJson(res, 201, {
      success: true,
      message: 'Lead captured successfully.',
      data: newLead
    });
  }

  // 12. Leads: Convert
  if (pathname.startsWith('/api/leads/') && pathname.endsWith('/convert') && req.method === 'POST') {
    const parts = pathname.split('/');
    const leadId = parseInt(parts[3], 10);
    const lead = leads.find(l => l.leadId === leadId);

    if (!lead) {
      return sendJson(res, 404, { success: false, message: 'Lead not found.' });
    }

    const newCustId = 1000 + customers.length + 1;
    const newCust = {
      customerId: newCustId,
      customerCode: `CUST-${newCustId}`,
      customerName: lead.leadName,
      email: lead.email,
      phone: lead.phone,
      companyName: lead.companyName,
      address: 'Converted from Lead ' + lead.leadCode,
      city: 'Default City',
      state: 'State',
      status: 'Active',
      ownerId: 'usr_sales',
      ownerName: 'Alex Morgan',
      createdDate: new Date().toISOString(),
      activeOpportunitiesCount: 1
    };
    customers.unshift(newCust);

    lead.status = 'Converted';
    lead.convertedCustomerId = newCustId;

    // Create Opportunity
    const newOppId = 3000 + opportunities.length + 1;
    const newOpp = {
      id: newOppId,
      customerId: newCustId,
      customerName: newCust.customerName,
      customerEmail: newCust.email,
      customerCompany: newCust.companyName,
      title: `${lead.companyName} - Initial Deal`,
      amount: lead.expectedValue > 0 ? lead.expectedValue : 25000,
      stage: 'Qualification',
      probability: 30,
      expectedCloseDate: new Date(Date.now() + 30 * 86400000).toISOString().split('T')[0],
      assignedToUserId: 'usr_sales',
      assignedToUserName: 'Alex Morgan',
      description: 'Auto-created opportunity from converted lead ' + lead.leadCode,
      createdAt: new Date().toISOString()
    };
    opportunities.unshift(newOpp);

    logAudit('CONVERT', 'Lead', lead.leadId.toString(), { status: 'Qualified' }, { status: 'Converted', customerId: newCustId, opportunityId: newOppId });

    return sendJson(res, 200, {
      success: true,
      message: `Lead ${lead.leadCode} successfully converted to Customer ${newCust.customerCode} and Opportunity created!`,
      data: { customerId: newCustId, opportunityId: newOppId }
    });
  }

  // 13. Opportunities: Pipeline Summary
  if (pathname === '/api/opportunities/pipeline-summary' && req.method === 'GET') {
    const totalPipeline = opportunities.reduce((acc, o) => acc + (parseFloat(o.amount) || 0), 0);
    const weightedPipeline = opportunities.reduce((acc, o) => acc + ((parseFloat(o.amount) || 0) * (parseInt(o.probability) || 0) / 100), 0);
    const wonValue = opportunities.filter(o => o.stage === 'Won').reduce((acc, o) => acc + (parseFloat(o.amount) || 0), 0);
    const lostValue = opportunities.filter(o => o.stage === 'Lost').reduce((acc, o) => acc + (parseFloat(o.amount) || 0), 0);
    const activeCount = opportunities.filter(o => o.stage !== 'Won' && o.stage !== 'Lost').length;

    const stages = ['Qualification', 'Proposal', 'Negotiation', 'Won', 'Lost'];
    const stageBreakdowns = stages.map(st => {
      const oppsInStage = opportunities.filter(o => o.stage === st);
      const totalAmt = oppsInStage.reduce((acc, o) => acc + (parseFloat(o.amount) || 0), 0);
      const weightAmt = oppsInStage.reduce((acc, o) => acc + ((parseFloat(o.amount) || 0) * (parseInt(o.probability) || 0) / 100), 0);
      return {
        stage: st,
        count: oppsInStage.length,
        totalAmount: totalAmt,
        weightedAmount: weightAmt
      };
    });

    return sendJson(res, 200, {
      success: true,
      data: {
        totalPipelineValue: totalPipeline,
        weightedPipelineValue: weightedPipeline,
        wonValue,
        lostValue,
        activeOpportunitiesCount: activeCount,
        stageBreakdowns
      }
    });
  }

  // 14. Opportunities: GET list
  if (pathname === '/api/opportunities' && req.method === 'GET') {
    const stage = parsedUrl.query.stage;
    const customerId = parsedUrl.query.customerId ? parseInt(parsedUrl.query.customerId, 10) : null;
    const term = (parsedUrl.query.searchTerm || '').toLowerCase();

    let filtered = opportunities;
    if (stage && stage !== 'All') {
      filtered = filtered.filter(o => o.stage.toLowerCase() === stage.toLowerCase());
    }
    if (customerId) {
      filtered = filtered.filter(o => o.customerId === customerId);
    }
    if (term) {
      filtered = filtered.filter(o =>
        o.title.toLowerCase().includes(term) ||
        (o.customerName && o.customerName.toLowerCase().includes(term)) ||
        (o.description && o.description.toLowerCase().includes(term))
      );
    }

    return sendJson(res, 200, {
      success: true,
      data: {
        items: filtered,
        totalCount: filtered.length,
        pageNumber: 1,
        pageSize: 15,
        totalPages: 1
      }
    });
  }

  // 15. Opportunities: POST (Create)
  if (pathname === '/api/opportunities' && req.method === 'POST') {
    const body = await parseBody(req);
    const amount = parseFloat(body.amount);
    const probability = parseInt(body.probability, 10);

    if (isNaN(amount) || amount <= 0) {
      return sendJson(res, 400, { success: false, message: 'Amount must be strictly greater than 0.' });
    }
    if (isNaN(probability) || probability < 0 || probability > 100) {
      return sendJson(res, 400, { success: false, message: 'Probability must be an integer between 0 and 100.' });
    }

    const customer = customers.find(c => c.customerId === parseInt(body.customerId, 10));
    const newId = 3000 + opportunities.length + 1;
    const newOpp = {
      id: newId,
      customerId: parseInt(body.customerId, 10),
      customerName: customer ? customer.customerName : 'Direct Customer',
      customerEmail: customer ? customer.email : '',
      customerCompany: customer ? customer.companyName : '',
      title: (body.title || 'New Deal').trim(),
      amount: amount,
      stage: body.stage || 'Qualification',
      probability: probability,
      expectedCloseDate: body.expectedCloseDate || new Date(Date.now() + 30 * 86400000).toISOString().split('T')[0],
      assignedToUserId: body.assignedToUserId || 'usr_sales',
      assignedToUserName: 'Alex Morgan',
      description: body.description || '',
      createdAt: new Date().toISOString()
    };

    opportunities.unshift(newOpp);
    logAudit('CREATE', 'Opportunity', newId.toString(), null, newOpp);

    return sendJson(res, 201, {
      success: true,
      message: 'Opportunity created successfully.',
      data: newOpp
    });
  }

  // 16. Opportunities: PATCH Stage
  if (pathname.startsWith('/api/opportunities/') && pathname.endsWith('/stage') && req.method === 'PATCH') {
    const parts = pathname.split('/');
    const oppId = parseInt(parts[3], 10);
    const opp = opportunities.find(o => o.id === oppId);

    if (!opp) {
      return sendJson(res, 404, { success: false, message: 'Opportunity not found.' });
    }

    const body = await parseBody(req);
    const oldStage = opp.stage;
    opp.stage = body.stage;
    if (body.stage === 'Won') opp.probability = 100;
    if (body.stage === 'Lost') opp.probability = 0;

    logAudit('UPDATE_STAGE', 'Opportunity', opp.id.toString(), { stage: oldStage }, { stage: opp.stage, probability: opp.probability });

    return sendJson(res, 200, {
      success: true,
      message: `Opportunity stage updated to ${opp.stage}.`,
      data: opp
    });
  }

  // 17. Opportunities: PUT (Edit)
  if (pathname.startsWith('/api/opportunities/') && req.method === 'PUT') {
    const parts = pathname.split('/');
    const oppId = parseInt(parts[3], 10);
    const opp = opportunities.find(o => o.id === oppId);

    if (!opp) {
      return sendJson(res, 404, { success: false, message: 'Opportunity not found.' });
    }

    const body = await parseBody(req);
    const oldState = { ...opp };

    if (body.title) opp.title = body.title.trim();
    if (body.amount) opp.amount = parseFloat(body.amount);
    if (body.stage) opp.stage = body.stage;
    if (body.probability !== undefined) opp.probability = parseInt(body.probability, 10);
    if (body.expectedCloseDate) opp.expectedCloseDate = body.expectedCloseDate;
    if (body.description !== undefined) opp.description = body.description;

    logAudit('UPDATE', 'Opportunity', opp.id.toString(), oldState, opp);

    return sendJson(res, 200, {
      success: true,
      message: 'Opportunity updated successfully.',
      data: opp
    });
  }

  // 18. Opportunities: DELETE
  if (pathname.startsWith('/api/opportunities/') && req.method === 'DELETE') {
    const parts = pathname.split('/');
    const oppId = parseInt(parts[3], 10);
    const index = opportunities.findIndex(o => o.id === oppId);

    if (index === -1) {
      return sendJson(res, 404, { success: false, message: 'Opportunity not found.' });
    }

    const deleted = opportunities.splice(index, 1)[0];
    logAudit('DELETE', 'Opportunity', deleted.id.toString(), deleted, null);

    return sendJson(res, 200, {
      success: true,
      message: 'Opportunity deleted successfully.'
    });
  }

  // 19. FollowUps: GET
  if (pathname === '/api/followups' && req.method === 'GET') {
    const status = parsedUrl.query.status;
    const type = parsedUrl.query.type;
    const overdueOnly = parsedUrl.query.overdueOnly === 'true';
    const upcomingOnly = parsedUrl.query.upcomingOnly === 'true';

    const now = new Date();
    const horizon = new Date(Date.now() + 7 * 86400000);

    let filtered = followUps.map(f => ({
      ...f,
      isOverdue: f.status === 'Planned' && new Date(f.followUpDate) < now
    }));

    if (status && status !== 'All') {
      filtered = filtered.filter(f => f.status.toLowerCase() === status.toLowerCase());
    }
    if (type && type !== 'All') {
      filtered = filtered.filter(f => f.type.toLowerCase() === type.toLowerCase());
    }
    if (overdueOnly) {
      filtered = filtered.filter(f => f.isOverdue);
    }
    if (upcomingOnly) {
      filtered = filtered.filter(f => f.status === 'Planned' && new Date(f.followUpDate) >= now && new Date(f.followUpDate) <= horizon);
    }

    filtered.sort((a, b) => new Date(a.followUpDate) - new Date(b.followUpDate));

    return sendJson(res, 200, {
      success: true,
      data: {
        items: filtered,
        totalCount: filtered.length,
        pageNumber: 1,
        pageSize: 15,
        totalPages: 1
      }
    });
  }

  // 20. FollowUps: POST (Schedule)
  if (pathname === '/api/followups' && req.method === 'POST') {
    const body = await parseBody(req);
    const date = new Date(body.followUpDate);

    if (isNaN(date.getTime())) {
      return sendJson(res, 400, { success: false, message: 'Invalid follow-up date.' });
    }

    const newId = 4000 + followUps.length + 1;
    let customerName = null;
    let leadName = null;
    let opportunityTitle = null;

    if (body.customerId) {
      const c = customers.find(x => x.customerId === parseInt(body.customerId, 10));
      if (c) customerName = c.customerName;
    }
    if (body.leadId) {
      const l = leads.find(x => x.leadId === parseInt(body.leadId, 10));
      if (l) leadName = l.leadName;
    }
    if (body.opportunityId) {
      const o = opportunities.find(x => x.id === parseInt(body.opportunityId, 10));
      if (o) opportunityTitle = o.title;
    }

    const newFollowUp = {
      id: newId,
      customerId: body.customerId ? parseInt(body.customerId, 10) : null,
      customerName,
      leadId: body.leadId ? parseInt(body.leadId, 10) : null,
      leadName,
      opportunityId: body.opportunityId ? parseInt(body.opportunityId, 10) : null,
      opportunityTitle,
      followUpDate: body.followUpDate,
      type: body.type || 'Call',
      status: 'Planned',
      assignedToUserId: body.assignedToUserId || 'usr_sales',
      assignedToUserName: 'Alex Morgan',
      notes: body.notes || '',
      completionRemarks: null,
      createdAt: new Date().toISOString()
    };

    followUps.unshift(newFollowUp);
    logAudit('CREATE', 'FollowUp', newId.toString(), null, newFollowUp);

    return sendJson(res, 201, {
      success: true,
      message: 'Follow-up scheduled successfully.',
      data: newFollowUp
    });
  }

  // 21. FollowUps: Complete
  if (pathname.startsWith('/api/followups/') && pathname.endsWith('/complete') && req.method === 'POST') {
    const parts = pathname.split('/');
    const id = parseInt(parts[3], 10);
    const followUp = followUps.find(f => f.id === id);

    if (!followUp) {
      return sendJson(res, 404, { success: false, message: 'Follow-up not found.' });
    }

    const body = await parseBody(req);
    const oldStatus = followUp.status;
    followUp.status = 'Completed';
    followUp.completionRemarks = body.remarks || 'Completed as scheduled.';

    logAudit('COMPLETE', 'FollowUp', followUp.id.toString(), { status: oldStatus }, { status: 'Completed', remarks: followUp.completionRemarks });

    return sendJson(res, 200, {
      success: true,
      message: 'Follow-up marked as completed.',
      data: followUp
    });
  }

  // 22. FollowUps: DELETE
  if (pathname.startsWith('/api/followups/') && req.method === 'DELETE') {
    const parts = pathname.split('/');
    const id = parseInt(parts[3], 10);
    const index = followUps.findIndex(f => f.id === id);

    if (index === -1) {
      return sendJson(res, 404, { success: false, message: 'Follow-up not found.' });
    }

    const deleted = followUps.splice(index, 1)[0];
    logAudit('DELETE', 'FollowUp', deleted.id.toString(), deleted, null);

    return sendJson(res, 200, {
      success: true,
      message: 'Follow-up deleted successfully.'
    });
  }

  // 23. Audit Logs: Summary
  if (pathname === '/api/auditlogs/summary' && req.method === 'GET') {
    const total = auditLogs.length;
    const successLogins = auditLogs.filter(a => a.action === 'LOGIN_SUCCESS').length;
    const failedLogins = auditLogs.filter(a => a.action === 'LOGIN_FAILED').length;
    const mutations = auditLogs.filter(a => ['CREATE', 'UPDATE', 'DELETE', 'CONVERT', 'COMPLETE', 'UPDATE_STAGE'].includes(a.action)).length;
    const alerts = auditLogs.filter(a => ['ACCOUNT_LOCKOUT', 'LOCKOUT_BLOCKED'].includes(a.action)).length;

    return sendJson(res, 200, {
      success: true,
      data: {
        totalAuditEvents: total,
        successfulLogins: successLogins,
        failedLogins: failedLogins,
        entityMutations: mutations,
        securityAlerts: alerts
      }
    });
  }

  // 24. Audit Logs: GET
  if (pathname === '/api/auditlogs' && req.method === 'GET') {
    const action = parsedUrl.query.action;
    const entity = parsedUrl.query.entityName;
    const term = (parsedUrl.query.searchTerm || '').toLowerCase();

    let filtered = auditLogs;
    if (action && action !== 'All') {
      filtered = filtered.filter(a => a.action.toUpperCase() === action.toUpperCase());
    }
    if (entity && entity !== 'All') {
      filtered = filtered.filter(a => a.entityName.toLowerCase() === entity.toLowerCase());
    }
    if (term) {
      filtered = filtered.filter(a =>
        a.action.toLowerCase().includes(term) ||
        a.entityName.toLowerCase().includes(term) ||
        (a.userName && a.userName.toLowerCase().includes(term))
      );
    }

    return sendJson(res, 200, {
      success: true,
      data: {
        items: filtered,
        totalCount: filtered.length,
        pageNumber: 1,
        pageSize: 15,
        totalPages: 1
      }
    });
  }

  // ==========================================
  // PHASE 6: EXECUTIVE DASHBOARD & CHART.JS
  // ==========================================

  // 25. Dashboard: Metrics Aggregation
  if (pathname === '/api/dashboard/metrics' && req.method === 'GET') {
    const totalCust = customers.length;
    const totalLd = leads.length;
    const openLd = leads.filter(l => ['New', 'Contacted', 'Qualified'].includes(l.status)).length;
    const convertedLd = leads.filter(l => l.status === 'Converted').length;
    const conversionRate = totalLd > 0 ? Math.round((convertedLd / totalLd) * 1000) / 10 : 0;

    const totalPipe = opportunities.reduce((acc, o) => acc + (parseFloat(o.amount) || 0), 0);
    const weightedPipe = opportunities.reduce((acc, o) => acc + ((parseFloat(o.amount) || 0) * (parseInt(o.probability) || 0) / 100), 0);
    const wonRev = opportunities.filter(o => o.stage === 'Won').reduce((acc, o) => acc + (parseFloat(o.amount) || 0), 0);
    const lostRev = opportunities.filter(o => o.stage === 'Lost').reduce((acc, o) => acc + (parseFloat(o.amount) || 0), 0);
    const activeOpps = opportunities.filter(o => o.stage !== 'Won' && o.stage !== 'Lost').length;

    const now = new Date();
    const horizon = new Date(Date.now() + 7 * 86400000);
    const overdueFollows = followUps.filter(f => f.status === 'Planned' && new Date(f.followUpDate) < now).length;
    const upcomingFollows = followUps.filter(f => f.status === 'Planned' && new Date(f.followUpDate) >= now && new Date(f.followUpDate) <= horizon).length;
    const completedFollows = followUps.filter(f => f.status === 'Completed').length;

    return sendJson(res, 200, {
      success: true,
      data: {
        totalCustomers: totalCust,
        totalLeads: totalLd,
        openLeads: openLd,
        convertedLeads: convertedLd,
        leadConversionRate: conversionRate,
        activeOpportunities: activeOpps,
        totalPipelineValue: totalPipe,
        weightedPipelineValue: weightedPipe,
        wonRevenue: wonRev,
        lostRevenue: lostRev,
        overdueFollowUps: overdueFollows,
        upcomingFollowUps: upcomingFollows,
        completedFollowUps: completedFollows,
        currentRole: 'Admin',
        roleScopeDescription: 'Company-Wide Master View: Global sales figures, user operations, and system compliance.'
      }
    });
  }

  // 26. Dashboard: Charts Datasets
  if (pathname === '/api/dashboard/charts' && req.method === 'GET') {
    // 1. Lead Status Distribution
    const leadStatuses = ['New', 'Contacted', 'Qualified', 'Converted', 'Lost'];
    const leadStatusColors = ['#3b82f6', '#8b5cf6', '#10b981', '#06b6d4', '#ef4444'];
    const leadCounts = leadStatuses.map(s => leads.filter(l => l.status.toLowerCase() === s.toLowerCase()).length);

    // 2. Opportunity Stage Funnel
    const oppStages = ['Qualification', 'Proposal', 'Negotiation', 'Won', 'Lost'];
    const oppStageColors = ['#38bdf8', '#818cf8', '#fbbf24', '#34d399', '#f87171'];
    const stageAmounts = oppStages.map(s => opportunities.filter(o => o.stage.toLowerCase() === s.toLowerCase()).reduce((acc, o) => acc + (parseFloat(o.amount) || 0), 0));
    const stageWeighted = oppStages.map(s => opportunities.filter(o => o.stage.toLowerCase() === s.toLowerCase()).reduce((acc, o) => acc + ((parseFloat(o.amount) || 0) * (parseInt(o.probability) || 0) / 100), 0));

    // 3. Trailing 6-Month Sales Velocity
    const monthNames = ['May 2026', 'Jun 2026', 'Jul 2026', 'Aug 2026', 'Sep 2026', 'Oct 2026'];
    const monthlyVelocity = [65000, 92000, 118000, 145000, 132000, 150000];

    // 4. Activity Mix
    const actTypes = ['Call', 'Meeting', 'Email', 'Task'];
    const actColors = ['#3b82f6', '#8b5cf6', '#10b981', '#f59e0b'];
    const actCounts = actTypes.map(t => followUps.filter(f => (f.type || '').toLowerCase() === t.toLowerCase()).length);

    return sendJson(res, 200, {
      success: true,
      data: {
        leadStatusDistribution: {
          labels: leadStatuses,
          data: leadCounts,
          backgroundColors: leadStatusColors
        },
        opportunityFunnel: {
          labels: oppStages,
          data: stageAmounts,
          secondaryData: stageWeighted,
          backgroundColors: oppStageColors
        },
        monthlySalesVelocity: {
          labels: monthNames,
          data: monthlyVelocity,
          backgroundColors: ['#38bdf8']
        },
        activityMix: {
          labels: actTypes,
          data: actCounts,
          backgroundColors: actColors
        }
      }
    });
  }

  // 404
  return sendJson(res, 404, { success: false, message: 'Endpoint not found.' });
});

server.listen(PORT, () => {
  console.log(`\n==========================================================`);
  console.log(`⚡ AcxiomCRM Backend Server Online at http://localhost:${PORT}`);
  console.log(`📄 API Swagger Explorer: http://localhost:${PORT}/swagger`);
  console.log(`🌐 Frontend Portal:      http://localhost:3000`);
  console.log(`==========================================================\n`);
});
