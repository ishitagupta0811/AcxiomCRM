import { AppConfig } from './config';

const DEFAULT_AUDIT_LOGS = [
  {
    auditLogId: 101,
    userId: 'usr_admin',
    userName: 'System Administrator',
    action: 'LOGIN_SUCCESS',
    entityName: 'User',
    recordId: 'usr_admin',
    oldValue: null,
    newValue: JSON.stringify({ role: 'Admin', status: 'Authenticated' }),
    createdDate: new Date(Date.now() - 5 * 60000).toISOString(),
    ipAddress: '127.0.0.1'
  },
  {
    auditLogId: 102,
    userId: 'usr_sales',
    userName: 'Alex Morgan',
    action: 'CONVERT',
    entityName: 'Lead',
    recordId: 'LEAD-2001',
    oldValue: JSON.stringify({ status: 'Qualified', expectedValue: 45000 }),
    newValue: JSON.stringify({ status: 'Converted', customerCode: 'CUST-1003' }),
    createdDate: new Date(Date.now() - 15 * 60000).toISOString(),
    ipAddress: '127.0.0.1'
  },
  {
    auditLogId: 103,
    userId: 'usr_sales',
    userName: 'Alex Morgan',
    action: 'CREATE',
    entityName: 'Customer',
    recordId: 'CUST-1002',
    oldValue: null,
    newValue: JSON.stringify({ customerName: 'Global Logistics Ltd', phone: '9123456780', email: 'info@globallogistics.com' }),
    createdDate: new Date(Date.now() - 45 * 60000).toISOString(),
    ipAddress: '192.168.1.45'
  },
  {
    auditLogId: 104,
    userId: null,
    userName: 'Unknown Actor',
    action: 'LOGIN_FAILED',
    entityName: 'Security',
    recordId: 'admin@acxiomcrm.local',
    oldValue: null,
    newValue: JSON.stringify({ reason: 'Invalid password credentials', remainingAttempts: 4 }),
    createdDate: new Date(Date.now() - 120 * 60000).toISOString(),
    ipAddress: '192.168.1.102'
  },
  {
    auditLogId: 105,
    userId: 'usr_admin',
    userName: 'System Administrator',
    action: 'UPDATE',
    entityName: 'User',
    recordId: 'usr_sales',
    oldValue: JSON.stringify({ department: 'General Sales' }),
    newValue: JSON.stringify({ department: 'Direct Enterprise Sales' }),
    createdDate: new Date(Date.now() - 360 * 60000).toISOString(),
    ipAddress: '127.0.0.1'
  }
];

export const AuditLogService = {
  getStorageLogs() {
    const raw = localStorage.getItem('acxiom_audit_logs');
    if (!raw) {
      localStorage.setItem('acxiom_audit_logs', JSON.stringify(DEFAULT_AUDIT_LOGS));
      return [...DEFAULT_AUDIT_LOGS];
    }
    try {
      return JSON.parse(raw);
    } catch {
      return [...DEFAULT_AUDIT_LOGS];
    }
  },

  async getAuditLogs(filter = {}) {
    const token = localStorage.getItem(AppConfig.KEYS.TOKEN);
    try {
      const params = new URLSearchParams();
      if (filter.action && filter.action !== 'All') params.append('action', filter.action);
      if (filter.entityName && filter.entityName !== 'All') params.append('entityName', filter.entityName);
      if (filter.searchTerm) params.append('searchTerm', filter.searchTerm);

      const res = await fetch(`${AppConfig.API_BASE_URL}/auditlogs?${params.toString()}`, {
        headers: { 'Authorization': `Bearer ${token}` },
        signal: AbortSignal.timeout(2000)
      });
      if (res.ok) {
        const json = await res.json();
        return json.data;
      }
    } catch {}

    let all = this.getStorageLogs();
    if (filter.action && filter.action !== 'All') {
      all = all.filter(a => a.action.toUpperCase() === filter.action.toUpperCase());
    }
    if (filter.entityName && filter.entityName !== 'All') {
      all = all.filter(a => a.entityName.toLowerCase() === filter.entityName.toLowerCase());
    }
    if (filter.searchTerm) {
      const term = filter.searchTerm.toLowerCase();
      all = all.filter(a =>
        a.action.toLowerCase().includes(term) ||
        a.entityName.toLowerCase().includes(term) ||
        (a.userName && a.userName.toLowerCase().includes(term))
      );
    }

    return { items: all, totalCount: all.length };
  },

  async getAuditSummary() {
    const token = localStorage.getItem(AppConfig.KEYS.TOKEN);
    try {
      const res = await fetch(`${AppConfig.API_BASE_URL}/auditlogs/summary`, {
        headers: { 'Authorization': `Bearer ${token}` },
        signal: AbortSignal.timeout(2000)
      });
      if (res.ok) {
        const json = await res.json();
        return json.data;
      }
    } catch {}

    const all = this.getStorageLogs();
    return {
      totalAuditEvents: all.length,
      successfulLogins: all.filter(a => a.action === 'LOGIN_SUCCESS').length,
      failedLogins: all.filter(a => a.action === 'LOGIN_FAILED').length,
      entityMutations: all.filter(a => ['CREATE', 'UPDATE', 'DELETE', 'CONVERT'].includes(a.action)).length,
      securityAlerts: all.filter(a => a.action.includes('LOCKOUT')).length
    };
  }
};
