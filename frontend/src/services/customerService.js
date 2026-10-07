import { AppConfig } from './config';
import { AuthService } from './authService';

const DEFAULT_CUSTOMERS = [
  {
    customerId: 1001,
    customerCode: 'CUST-1001',
    customerName: 'Acme Technologies Corp',
    email: 'contact@acmetech.com',
    phone: '9876543210',
    companyName: 'Acme Technologies Corp',
    city: 'Bangalore',
    state: 'Karnataka',
    status: 'Active',
    ownerId: 'usr_sales',
    ownerName: 'Alex Morgan'
  },
  {
    customerId: 1002,
    customerCode: 'CUST-1002',
    customerName: 'Global Logistics Ltd',
    email: 'info@globallogistics.com',
    phone: '9123456780',
    companyName: 'Global Logistics Ltd',
    city: 'Mumbai',
    state: 'Maharashtra',
    status: 'Active',
    ownerId: 'usr_sales',
    ownerName: 'Alex Morgan'
  }
];

export const CustomerService = {
  getStorageCustomers() {
    const raw = localStorage.getItem('acxiom_customers_store');
    if (!raw) {
      localStorage.setItem('acxiom_customers_store', JSON.stringify(DEFAULT_CUSTOMERS));
      return [...DEFAULT_CUSTOMERS];
    }
    try {
      return JSON.parse(raw);
    } catch {
      return [...DEFAULT_CUSTOMERS];
    }
  },

  saveStorageCustomers(list) {
    localStorage.setItem('acxiom_customers_store', JSON.stringify(list));
  },

  async getCustomers(filter = {}) {
    const token = localStorage.getItem(AppConfig.KEYS.TOKEN);
    const currentUser = AuthService.getCurrentUser();
    const role = (currentUser && currentUser.roles && currentUser.roles[0]) || 'SalesExecutive';

    try {
      const params = new URLSearchParams();
      if (filter.searchTerm) params.append('searchTerm', filter.searchTerm);
      if (filter.status && filter.status !== 'All') params.append('status', filter.status);

      const res = await fetch(`${AppConfig.API_BASE_URL}/customers?${params.toString()}`, {
        headers: { 'Authorization': `Bearer ${token}` },
        signal: AbortSignal.timeout(2000)
      });
      if (res.ok) {
        const json = await res.json();
        return json.data;
      }
    } catch {}

    let all = this.getStorageCustomers();
    if (role.toLowerCase() === 'salesexecutive') {
      const currId = currentUser?.id || 'usr_sales';
      all = all.filter(c => c.ownerId === currId || c.ownerId === 'usr_sales');
    }

    if (filter.searchTerm) {
      const term = filter.searchTerm.toLowerCase();
      all = all.filter(c =>
        c.customerName.toLowerCase().includes(term) ||
        c.email.toLowerCase().includes(term) ||
        c.phone.includes(term) ||
        (c.companyName && c.companyName.toLowerCase().includes(term))
      );
    }

    if (filter.status && filter.status !== 'All') {
      all = all.filter(c => c.status.toLowerCase() === filter.status.toLowerCase());
    }

    return {
      items: all,
      totalCount: all.length,
      pageNumber: 1,
      pageSize: 10,
      totalPages: 1
    };
  },

  async checkDuplicate(email, phone) {
    const all = this.getStorageCustomers();
    const isEmailUnique = !email || !all.some(c => c.email.toLowerCase() === email.trim().toLowerCase());
    const isPhoneUnique = !phone || !all.some(c => c.phone === phone.trim());
    return { isEmailUnique, isPhoneUnique };
  },

  async createCustomer(data) {
    const token = localStorage.getItem(AppConfig.KEYS.TOKEN);
    const currentUser = AuthService.getCurrentUser();

    try {
      const res = await fetch(`${AppConfig.API_BASE_URL}/customers`, {
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
        return { success: true, customer: json.data, message: json.message };
      }
    } catch {}

    const dup = await this.checkDuplicate(data.email, data.phone);
    if (!dup.isEmailUnique) return { success: false, message: 'A customer with this email already exists.' };
    if (!dup.isPhoneUnique) return { success: false, message: 'A customer with this phone number already exists.' };

    const all = this.getStorageCustomers();
    const newId = 1000 + all.length + 1;
    const newCust = {
      customerId: newId,
      customerCode: `CUST-${newId}`,
      customerName: data.customerName,
      email: data.email.toLowerCase().trim(),
      phone: data.phone.trim(),
      companyName: data.companyName,
      city: data.city || 'Bangalore',
      state: data.state || 'Karnataka',
      status: 'Active',
      ownerId: currentUser?.id || 'usr_sales',
      ownerName: currentUser?.fullName || 'Alex Morgan'
    };

    all.unshift(newCust);
    this.saveStorageCustomers(all);
    return { success: true, customer: newCust, message: 'Customer created successfully.' };
  },

  async deleteCustomer(id) {
    const all = this.getStorageCustomers();
    const filtered = all.filter(c => c.customerId !== id);
    this.saveStorageCustomers(filtered);
    return { success: true, message: 'Customer deactivated successfully.' };
  }
};
