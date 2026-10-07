export const AppConfig = {
  API_BASE_URL: 'http://localhost:5000/api',
  KEYS: {
    TOKEN: 'acxiom_crm_token',
    USER: 'acxiom_crm_user',
    LOCKOUT_UNTIL: 'acxiom_crm_lockout_until',
    FAILED_ATTEMPTS: 'acxiom_crm_failed_attempts'
  },
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
  LOCKOUT: {
    MAX_FAILED_ATTEMPTS: 5,
    LOCKOUT_DURATION_MINUTES: 15
  }
};
