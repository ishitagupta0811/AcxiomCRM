/**
 * AcxiomCRM — Configuration & Demo Constants
 */
const AppConfig = {
  // Primary ASP.NET Core API Backend URL
  API_BASE_URL: 'http://localhost:5000/api',

  // LocalStorage Keys
  KEYS: {
    TOKEN: 'acxiom_crm_token',
    USER: 'acxiom_crm_user',
    LOCKOUT_UNTIL: 'acxiom_crm_lockout_until',
    FAILED_ATTEMPTS: 'acxiom_crm_failed_attempts'
  },

  // Pre-configured Demo Accounts matching backend DbInitializer (Section 17.19)
  DEMO_USERS: {
    admin: {
      username: 'admin',
      email: 'admin@acxiomcrm.local',
      password: 'Admin@12345',
      fullName: 'System Administrator',
      role: 'Admin',
      department: 'Executive'
    },
    manager: {
      username: 'manager',
      email: 'manager@acxiomcrm.local',
      password: 'Manager@12345',
      fullName: 'Sales Manager',
      role: 'Manager',
      department: 'Sales Management'
    },
    sales: {
      username: 'salesrep',
      email: 'sales@acxiomcrm.local',
      password: 'Sales@12345',
      fullName: 'Alex Morgan',
      role: 'SalesExecutive',
      department: 'Direct Sales'
    }
  },

  // Security Policy Defaults (Section 6.2 & 6.3)
  LOCKOUT: {
    MAX_FAILED_ATTEMPTS: 5,
    LOCKOUT_DURATION_MINUTES: 15
  }
};
