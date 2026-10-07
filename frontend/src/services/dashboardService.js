import { AuthService } from './authService';

const API_URL = 'http://localhost:5000/api/dashboard';

export const DashboardService = {
  async getMetrics() {
    const res = await fetch(`${API_URL}/metrics`, {
      headers: {
        'Authorization': `Bearer ${AuthService.getToken()}`
      }
    });
    return await res.json();
  },

  async getCharts() {
    const res = await fetch(`${API_URL}/charts`, {
      headers: {
        'Authorization': `Bearer ${AuthService.getToken()}`
      }
    });
    return await res.json();
  }
};
