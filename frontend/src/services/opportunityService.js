import { AuthService } from './authService';

const API_URL = 'http://localhost:5000/api/opportunities';

export const OpportunityService = {
  async getOpportunities(filter = {}) {
    const params = new URLSearchParams();
    if (filter.stage && filter.stage !== 'All') params.append('stage', filter.stage);
    if (filter.customerId) params.append('customerId', filter.customerId);
    if (filter.searchTerm) params.append('searchTerm', filter.searchTerm);
    if (filter.pageNumber) params.append('pageNumber', filter.pageNumber);
    if (filter.pageSize) params.append('pageSize', filter.pageSize);

    const res = await fetch(`${API_URL}?${params.toString()}`, {
      headers: {
        'Authorization': `Bearer ${AuthService.getToken()}`
      }
    });
    return await res.json();
  },

  async getPipelineSummary() {
    const res = await fetch(`${API_URL}/pipeline-summary`, {
      headers: {
        'Authorization': `Bearer ${AuthService.getToken()}`
      }
    });
    return await res.json();
  },

  async createOpportunity(data) {
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

  async updateStage(id, stage) {
    const res = await fetch(`${API_URL}/${id}/stage`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${AuthService.getToken()}`
      },
      body: JSON.stringify({ stage })
    });
    return await res.json();
  },

  async updateOpportunity(id, data) {
    const res = await fetch(`${API_URL}/${id}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${AuthService.getToken()}`
      },
      body: JSON.stringify(data)
    });
    return await res.json();
  },

  async deleteOpportunity(id) {
    const res = await fetch(`${API_URL}/${id}`, {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${AuthService.getToken()}`
      }
    });
    return await res.json();
  }
};
