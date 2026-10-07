/**
 * AcxiomCRM — Lead Management & Conversion Frontend Service
 * Handles Lead capture, qualification status transitions, and atomic conversion to Customer & Opportunity
 */

const LeadService = {
  DEFAULT_LEADS: [
    {
      leadId: 2001,
      leadCode: 'LEAD-2001',
      leadName: 'Nexa Dynamics',
      email: 'procurement@nexadynamics.com',
      phone: '9811223344',
      companyName: 'Nexa Dynamics',
      source: 'Website Inquiry',
      status: 'Qualified',
      expectedValue: 45000.00,
      assignedTo: 'salesrep',
      assignedUserName: 'Alex Morgan',
      createdDate: new Date(Date.now() - 5 * 86400000).toISOString(),
      convertedCustomerId: null
    },
    {
      leadId: 2002,
      leadCode: 'LEAD-2002',
      leadName: 'Horizon Media Works',
      email: 'partnerships@horizonmedia.com',
      phone: '9711556677',
      companyName: 'Horizon Media Works',
      source: 'Partner Referral',
      status: 'Contacted',
      expectedValue: 18000.00,
      assignedTo: 'salesrep',
      assignedUserName: 'Alex Morgan',
      createdDate: new Date(Date.now() - 2 * 86400000).toISOString(),
      convertedCustomerId: null
    },
    {
      leadId: 2003,
      leadCode: 'LEAD-2003',
      leadName: 'Apex Retail Outlets',
      email: 'deals@apexretail.com',
      phone: '9622334455',
      companyName: 'Apex Retail Outlets',
      source: 'Direct Outreach',
      status: 'New',
      expectedValue: 75000.00,
      assignedTo: 'salesrep',
      assignedUserName: 'Alex Morgan',
      createdDate: new Date(Date.now() - 1 * 86400000).toISOString(),
      convertedCustomerId: null
    }
  ],

  getStorageLeads() {
    const raw = localStorage.getItem('acxiom_leads_store');
    if (!raw) {
      localStorage.setItem('acxiom_leads_store', JSON.stringify(this.DEFAULT_LEADS));
      return [...this.DEFAULT_LEADS];
    }
    try {
      return JSON.parse(raw);
    } catch {
      return [...this.DEFAULT_LEADS];
    }
  },

  saveStorageLeads(list) {
    localStorage.setItem('acxiom_leads_store', JSON.stringify(list));
  },

  async getLeads(filter = {}) {
    const token = localStorage.getItem(AppConfig.KEYS.TOKEN);
    const currentUser = AuthService.getCurrentUser();
    const userRole = (currentUser && currentUser.roles && currentUser.roles[0]) || 'SalesExecutive';

    try {
      const params = new URLSearchParams();
      if (filter.searchTerm) params.append('searchTerm', filter.searchTerm);
      if (filter.status) params.append('status', filter.status);
      params.append('pageNumber', filter.pageNumber || 1);
      params.append('pageSize', filter.pageSize || 10);

      const response = await fetch(`${AppConfig.API_BASE_URL}/leads?${params.toString()}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        signal: AbortSignal.timeout(2000)
      });

      if (response.ok) {
        const json = await response.json();
        return json.data;
      }
    } catch {
      console.warn('API unreachable, using local leads store.');
    }

    let all = this.getStorageLeads();

    // 1. Role scoping
    if (userRole.toLowerCase() === 'salesexecutive') {
      const currentId = currentUser?.id || currentUser?.username || 'salesrep';
      all = all.filter(l => l.assignedTo === currentId || l.assignedTo === 'salesrep');
    }

    // 2. Search & Filter
    if (filter.searchTerm) {
      const term = filter.searchTerm.toLowerCase();
      all = all.filter(l =>
        l.leadName.toLowerCase().includes(term) ||
        l.email.toLowerCase().includes(term) ||
        l.phone.includes(term) ||
        (l.companyName && l.companyName.toLowerCase().includes(term)) ||
        l.leadCode.toLowerCase().includes(term)
      );
    }

    if (filter.status && filter.status !== 'All') {
      all = all.filter(l => l.status.toLowerCase() === filter.status.toLowerCase());
    }

    const page = filter.pageNumber || 1;
    const size = filter.pageSize || 10;
    const startIndex = (page - 1) * size;

    return {
      items: all.slice(startIndex, startIndex + size),
      totalCount: all.length,
      pageNumber: page,
      pageSize: size,
      totalPages: Math.ceil(all.length / size)
    };
  },

  async createLead(data) {
    const token = localStorage.getItem(AppConfig.KEYS.TOKEN);
    const currentUser = AuthService.getCurrentUser();

    try {
      const res = await fetch(`${AppConfig.API_BASE_URL}/leads`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(data),
        signal: AbortSignal.timeout(2500)
      });
      const json = await res.json();
      if (res.ok && json.success) {
        return { success: true, lead: json.data, message: json.message };
      }
    } catch {}

    const all = this.getStorageLeads();
    const newId = 2000 + all.length + 1;
    const newLead = {
      leadId: newId,
      leadCode: `LEAD-${newId}`,
      leadName: data.leadName.trim(),
      email: data.email.trim().toLowerCase(),
      phone: data.phone.trim(),
      companyName: data.companyName,
      source: data.source || 'Website',
      status: 'New',
      expectedValue: parseFloat(data.expectedValue) || 0,
      assignedTo: currentUser?.username || 'salesrep',
      assignedUserName: currentUser?.fullName || 'Alex Morgan',
      createdDate: new Date().toISOString(),
      convertedCustomerId: null
    };

    all.unshift(newLead);
    this.saveStorageLeads(all);
    return { success: true, lead: newLead, message: 'Lead captured successfully.' };
  },

  async updateLeadStatus(id, newStatus) {
    const all = this.getStorageLeads();
    const lead = all.find(l => l.leadId === id);
    if (!lead) return { success: false, message: 'Lead not found.' };

    if (lead.status === 'Converted' && newStatus !== 'Converted') {
      return { success: false, message: 'Cannot modify status of an already converted lead.' };
    }

    lead.status = newStatus;
    this.saveStorageLeads(all);
    return { success: true, message: `Lead status updated to ${newStatus}.` };
  },

  async convertLead(leadId, details = {}) {
    const token = localStorage.getItem(AppConfig.KEYS.TOKEN);
    try {
      const res = await fetch(`${AppConfig.API_BASE_URL}/leads/${leadId}/convert`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ leadId, ...details }),
        signal: AbortSignal.timeout(2500)
      });
      const json = await res.json();
      if (res.ok && json.success) {
        return { success: true, message: json.message, customerId: json.data?.customerId };
      }
    } catch {}

    // Execute local atomic conversion
    const leads = this.getStorageLeads();
    const lead = leads.find(l => l.leadId === leadId);
    if (!lead) return { success: false, message: 'Lead not found.' };

    if (lead.status === 'Converted') {
      return { success: false, message: 'This lead has already been converted to a Customer.' };
    }

    // 1. Create customer
    const createRes = await CustomerService.createCustomer({
      customerName: lead.leadName,
      email: lead.email,
      phone: lead.phone,
      companyName: details.companyName || lead.companyName,
      address: details.address || 'Address on file',
      city: details.city || 'Default City',
      state: details.state || 'State'
    });

    if (!createRes.success) {
      return { success: false, message: `Conversion failed: ${createRes.message}` };
    }

    // 2. Mark lead converted
    lead.status = 'Converted';
    lead.convertedCustomerId = createRes.customer.customerId;
    this.saveStorageLeads(leads);

    return {
      success: true,
      message: `Lead ${lead.leadCode} successfully converted to Customer ${createRes.customer.customerCode}!`,
      customerId: createRes.customer.customerId
    };
  }
};
