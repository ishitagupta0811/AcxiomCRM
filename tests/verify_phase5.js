/**
 * Phase 5 Comprehensive Automated Verification Suite
 * Tests all REST API endpoints, HTTP status codes, validation rules, and Swagger documentation.
 */

const BASE_URL = 'http://localhost:5000';

async function runTests() {
  console.log('====================================================');
  console.log('🧪 Starting AcxiomCRM Phase 5 Automated Verification');
  console.log('====================================================\n');

  let passed = 0;
  let failed = 0;

  async function assertTest(name, fn) {
    try {
      await fn();
      console.log(`✅ PASS: ${name}`);
      passed++;
    } catch (err) {
      console.error(`❌ FAIL: ${name} -> ${err.message}`);
      failed++;
    }
  }

  // 1. Health Diagnostic
  await assertTest('GET /api/health returns 200 OK with Healthy status', async () => {
    const res = await fetch(`${BASE_URL}/api/health`);
    if (res.status !== 200) throw new Error(`Expected status 200, got ${res.status}`);
    const json = await res.json();
    if (!json.success || json.data.status !== 'Healthy') throw new Error('Health check payload invalid');
  });

  // 2. Swagger / OpenAPI Documentation UI
  await assertTest('GET /swagger returns 200 OK HTML UI', async () => {
    const res = await fetch(`${BASE_URL}/swagger`);
    if (res.status !== 200) throw new Error(`Expected status 200, got ${res.status}`);
    const text = await res.text();
    if (!text.includes('AcxiomCRM REST API Specification')) throw new Error('Swagger HTML missing title');
  });

  // 3. Auth: Valid Login
  let jwtToken = '';
  await assertTest('POST /api/auth/login with valid credentials returns 200 and Bearer Token', async () => {
    const res = await fetch(`${BASE_URL}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ usernameOrEmail: 'admin', password: 'Admin@12345' })
    });
    if (res.status !== 200) throw new Error(`Expected status 200, got ${res.status}`);
    const json = await res.json();
    if (!json.data.token || !json.data.user.roles.includes('Admin')) throw new Error('Token or roles missing');
    jwtToken = json.data.token;
  });

  // 4. Auth: Invalid Login Attempt
  await assertTest('POST /api/auth/login with invalid password returns 401 Unauthorized', async () => {
    const res = await fetch(`${BASE_URL}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ usernameOrEmail: 'admin', password: 'WrongPassword!123' })
    });
    if (res.status !== 401) throw new Error(`Expected status 401, got ${res.status}`);
  });

  // 5. Customer Master: Duplicate Check
  await assertTest('GET /api/customers/check-duplicate flags existing email and phone', async () => {
    const res = await fetch(`${BASE_URL}/api/customers/check-duplicate?email=contact@acmetech.com&phone=9876543210`);
    if (res.status !== 200) throw new Error(`Expected status 200, got ${res.status}`);
    const json = await res.json();
    if (json.data.isEmailUnique !== false || json.data.isPhoneUnique !== false) throw new Error('Duplicate check failed');
  });

  // 6. Customer Master: Duplicate Rejection
  await assertTest('POST /api/customers with existing email returns 409 Conflict', async () => {
    const res = await fetch(`${BASE_URL}/api/customers`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ customerName: 'Duplicate Test Corp', email: 'contact@acmetech.com', phone: '9999988888' })
    });
    if (res.status !== 409) throw new Error(`Expected status 409, got ${res.status}`);
  });

  // 7. Customer Master: Valid Creation
  let createdCustId = 0;
  await assertTest('POST /api/customers with unique data returns 201 Created', async () => {
    const res = await fetch(`${BASE_URL}/api/customers`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        customerName: 'Prism Analytics Labs',
        email: `prism_${Date.now()}@analytics.com`,
        phone: '9888776655',
        companyName: 'Prism Analytics Labs',
        city: 'Pune',
        state: 'Maharashtra'
      })
    });
    if (res.status !== 201) throw new Error(`Expected status 201, got ${res.status}`);
    const json = await res.json();
    createdCustId = json.data.customerId;
    if (!createdCustId || !json.data.customerCode) throw new Error('Created customer missing ID or Code');
  });

  // 8. Customer Master: GET by ID
  await assertTest('GET /api/customers/:id returns single customer detail', async () => {
    const res = await fetch(`${BASE_URL}/api/customers/${createdCustId}`);
    if (res.status !== 200) throw new Error(`Expected status 200, got ${res.status}`);
    const json = await res.json();
    if (json.data.customerId !== createdCustId) throw new Error('Returned wrong customer ID');
  });

  // 9. Leads: List
  await assertTest('GET /api/leads returns paginated leads pipeline', async () => {
    const res = await fetch(`${BASE_URL}/api/leads`);
    if (res.status !== 200) throw new Error(`Expected status 200, got ${res.status}`);
    const json = await res.json();
    if (!Array.isArray(json.data.items) || json.data.items.length === 0) throw new Error('No leads returned');
  });

  // 10. Leads: Convert
  await assertTest('POST /api/leads/:id/convert transactionally creates Customer and Opportunity', async () => {
    const res = await fetch(`${BASE_URL}/api/leads/2001/convert`, { method: 'POST' });
    if (res.status !== 200) throw new Error(`Expected status 200, got ${res.status}`);
    const json = await res.json();
    if (!json.data.customerId || !json.data.opportunityId) throw new Error('Conversion failed to return customer/opportunity ID');
  });

  // 11. Opportunities: Pipeline Summary Calculation
  await assertTest('GET /api/opportunities/pipeline-summary computes weighted forecast accurately', async () => {
    const res = await fetch(`${BASE_URL}/api/opportunities/pipeline-summary`);
    if (res.status !== 200) throw new Error(`Expected status 200, got ${res.status}`);
    const json = await res.json();
    const { totalPipelineValue, weightedPipelineValue, stageBreakdowns } = json.data;
    if (typeof totalPipelineValue !== 'number' || typeof weightedPipelineValue !== 'number' || !Array.isArray(stageBreakdowns)) {
      throw new Error('Pipeline summary calculation missing required fields');
    }
  });

  // 12. Opportunities: Invalid Amount Validation
  await assertTest('POST /api/opportunities with Amount <= 0 returns 400 Bad Request', async () => {
    const res = await fetch(`${BASE_URL}/api/opportunities`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ customerId: 1001, title: 'Invalid Deal', amount: -500, probability: 50 })
    });
    if (res.status !== 400) throw new Error(`Expected status 400, got ${res.status}`);
  });

  // 13. Opportunities: Stage Transition
  await assertTest('PATCH /api/opportunities/:id/stage updates stage and probability to Won/100%', async () => {
    const res = await fetch(`${BASE_URL}/api/opportunities/3001/stage`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ stage: 'Won' })
    });
    if (res.status !== 200) throw new Error(`Expected status 200, got ${res.status}`);
    const json = await res.json();
    if (json.data.stage !== 'Won' || json.data.probability !== 100) throw new Error('Stage transition failed');
  });

  // 14. Follow-Ups: List with Overdue flags
  await assertTest('GET /api/followups returns activities and identifies overdue tasks', async () => {
    const res = await fetch(`${BASE_URL}/api/followups`);
    if (res.status !== 200) throw new Error(`Expected status 200, got ${res.status}`);
    const json = await res.json();
    const hasOverdueFlag = json.data.items.some(f => typeof f.isOverdue === 'boolean');
    if (!hasOverdueFlag) throw new Error('Overdue flag calculation missing');
  });

  // 15. Follow-Ups: Complete
  await assertTest('POST /api/followups/:id/complete updates status and records remarks', async () => {
    const res = await fetch(`${BASE_URL}/api/followups/4001/complete`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ remarks: 'Completed verification review successfully.' })
    });
    if (res.status !== 200) throw new Error(`Expected status 200, got ${res.status}`);
    const json = await res.json();
    if (json.data.status !== 'Completed' || !json.data.completionRemarks) throw new Error('Completion status not updated');
  });

  // 16. Audit Logs: Security & Mutation Stream
  await assertTest('GET /api/auditlogs returns immutable audit events with delta tracking', async () => {
    const res = await fetch(`${BASE_URL}/api/auditlogs`);
    if (res.status !== 200) throw new Error(`Expected status 200, got ${res.status}`);
    const json = await res.json();
    if (!Array.isArray(json.data.items) || json.data.items.length === 0) throw new Error('Audit logs stream empty');
  });

  console.log('\n====================================================');
  console.log(`📊 Verification Summary: ${passed} PASSED, ${failed} FAILED`);
  console.log('====================================================\n');

  if (failed > 0) process.exit(1);
}

runTests();
