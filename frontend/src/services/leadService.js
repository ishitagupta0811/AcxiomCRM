import { AppConfig } from './config';
import { CustomerService } from './customerService';

const DEFAULT_LEADS = [
  {
    leadId: 2001,
    leadCode: 'LEAD-2001',
    leadName: 'Nexa Dynamics',
    email: 'procurement@nexadynamics.com',
    phone: '9811223344',
    companyName: 'Nexa Dynamics',
    source: 'Website Inquiry',
    status: 'Qualified',
    expectedValue: 45000,
    assignedUserName: 'Alex Morgan'
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
    expectedValue: 18000,
    assignedUserName: 'Alex Morgan'
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
    expectedValue: 75000,
    assignedUserName: 'Alex Morgan'
  }
];

export const LeadService = {
  getStorageLeads() {
    const raw = localStorage.getItem('acxiom_leads_store');
    if (!raw) {
      localStorage.setItem('acxiom_leads_store', JSON.stringify(DEFAULT_LEADS));
      return [...DEFAULT_LEADS];
    }
    try {
      return JSON.parse(raw);
    } catch {
      return [...DEFAULT_LEADS];
    }
  },

  saveStorageLeads(list) {
    localStorage.setItem('acxiom_leads_store', JSON.stringify(list));
  },

  async getLeads(filter = {}) {
    let all = this.getStorageLeads();

    if (filter.searchTerm) {
      const term = filter.searchTerm.toLowerCase();
      all = all.filter(l =>
        l.leadName.toLowerCase().includes(term) ||
        l.email.toLowerCase().includes(term) ||
        l.phone.includes(term) ||
        (l.companyName && l.companyName.toLowerCase().includes(term))
      );
    }

    if (filter.status && filter.status !== 'All') {
      all = all.filter(l => l.status.toLowerCase() === filter.status.toLowerCase());
    }

    return { items: all, totalCount: all.length };
  },

  async createLead(data) {
    const all = this.getStorageLeads();
    const newId = 2000 + all.length + 1;
    const newLead = {
      leadId: newId,
      leadCode: `LEAD-${newId}`,
      leadName: data.leadName.trim(),
      email: data.email.trim().toLowerCase(),
      phone: data.phone.trim(),
      companyName: data.companyName,
      source: data.source || 'Website Inquiry',
      status: 'New',
      expectedValue: parseFloat(data.expectedValue) || 0,
      assignedUserName: 'Alex Morgan'
    };

    all.unshift(newLead);
    this.saveStorageLeads(all);
    return { success: true, lead: newLead, message: 'Lead captured successfully.' };
  },

  async updateLeadStatus(id, newStatus) {
    const all = this.getStorageLeads();
    const lead = all.find(l => l.leadId === id);
    if (!lead) return { success: false, message: 'Lead not found.' };

    lead.status = newStatus;
    this.saveStorageLeads(all);
    return { success: true, message: `Status updated to ${newStatus}.` };
  },

  async convertLead(leadId, details = {}) {
    const all = this.getStorageLeads();
    const lead = all.find(l => l.leadId === leadId);
    if (!lead) return { success: false, message: 'Lead not found.' };

    const res = await CustomerService.createCustomer({
      customerName: lead.leadName,
      email: lead.email,
      phone: lead.phone,
      companyName: lead.companyName,
      city: 'Bangalore',
      state: 'Karnataka'
    });

    if (!res.success) return { success: false, message: res.message };

    lead.status = 'Converted';
    this.saveStorageLeads(all);
    return {
      success: true,
      message: `Lead converted to Customer ${res.customer.customerCode} with active Opportunity!`,
      customer: res.customer
    };
  }
};
