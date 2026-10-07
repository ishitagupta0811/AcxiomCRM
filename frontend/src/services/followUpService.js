import { AuthService } from './authService';

const API_URL = 'http://localhost:5000/api/followups';

export const FollowUpService = {
  async getFollowUps(filter = {}) {
    const params = new URLSearchParams();
    if (filter.status && filter.status !== 'All') params.append('status', filter.status);
    if (filter.type && filter.type !== 'All') params.append('type', filter.type);
    if (filter.overdueOnly) params.append('overdueOnly', 'true');
    if (filter.upcomingOnly) params.append('upcomingOnly', 'true');
    if (filter.customerId) params.append('customerId', filter.customerId);
    if (filter.leadId) params.append('leadId', filter.leadId);
    if (filter.opportunityId) params.append('opportunityId', filter.opportunityId);

    const res = await fetch(`${API_URL}?${params.toString()}`, {
      headers: {
        'Authorization': `Bearer ${AuthService.getToken()}`
      }
    });
    return await res.json();
  },

  async createFollowUp(data) {
    const res = await fetch(API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${AuthService.getToken()}`
      },
      body: JSON.stringify(data)
    });
    return await res.json();
  },

  async completeFollowUp(id, remarks) {
    const res = await fetch(`${API_URL}/${id}/complete`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${AuthService.getToken()}`
      },
      body: JSON.stringify({ remarks })
    });
    return await res.json();
  },

  async deleteFollowUp(id) {
    const res = await fetch(`${API_URL}/${id}`, {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${AuthService.getToken()}`
      }
    });
    return await res.json();
  }
};
