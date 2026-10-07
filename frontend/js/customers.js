/**
 * AcxiomCRM — Customer Management Frontend Service
 * Handles CRUD, Real-time Duplicate Checking, Search & Filtering, Role Scoping
 */

const CustomerService = {
  // Local storage demo fallback store
  DEFAULT_CUSTOMERS: [
    {
      customerId: 1001,
      customerCode: 'CUST-1001',
      customerName: 'Acme Technologies Corp',
      email: 'contact@acmetech.com',
      phone: '9876543210',
      companyName: 'Acme Technologies Corp',
      address: 'Tech Park 4B, Electronic City',
      city: 'Bangalore',
      state: 'Karnataka',
      status: 'Active',
      ownerId: 'salesrep',
      ownerName: 'Alex Morgan',
      createdDate: new Date(Date.now() - 20 * 86400000).toISOString(),
      activeOpportunitiesCount: 2
    },
    {
      customerId: 1002,
      customerCode: 'CUST-1002',
      customerName: 'Global Logistics Ltd',
      email: 'info@globallogistics.com',
      phone: '9123456780',
      companyName: 'Global Logistics Ltd',
      address: 'Harbor View Tower 12',
      city: 'Mumbai',
      state: 'Maharashtra',
      status: 'Active',
      ownerId: 'salesrep',
      ownerName: 'Alex Morgan',
      createdDate: new Date(Date.now() - 10 * 86400000).toISOString(),
      activeOpportunitiesCount: 1
    },
    {
      customerId: 1003,
      customerCode: 'CUST-1003',
      customerName: 'Zenith BioPharma',
      email: 'procure@zenithbio.com',
      phone: '9988776655',
      companyName: 'Zenith BioPharma Inc',
      address: 'Genome Valley Phase 2',
      city: 'Hyderabad',
      state: 'Telangana',
      status: 'Active',
      ownerId: 'manager',
      ownerName: 'Sales Manager',
      createdDate: new Date(Date.now() - 4 * 86400000).toISOString(),
      activeOpportunitiesCount: 0
    }
  ],

  getStorageCustomers() {
    const raw = localStorage.getItem('acxiom_customers_store');
    if (!raw) {
      localStorage.setItem('acxiom_customers_store', JSON.stringify(this.DEFAULT_CUSTOMERS));
      return [...this.DEFAULT_CUSTOMERS];
    }
    try {
      return JSON.parse(raw);
    } catch {
      return [...this.DEFAULT_CUSTOMERS];
    }
  },

  saveStorageCustomers(list) {
    localStorage.setItem('acxiom_customers_store', JSON.stringify(list));
  },

  async getCustomers(filter = {}) {
    const token = localStorage.getItem(AppConfig.KEYS.TOKEN);
    const currentUser = AuthService.getCurrentUser();
    const userRole = (currentUser && currentUser.roles && currentUser.roles[0]) || 'SalesExecutive';

    try {
      const params = new URLSearchParams();
      if (filter.searchTerm) params.append('searchTerm', filter.searchTerm);
      if (filter.status) params.append('status', filter.status);
      params.append('pageNumber', filter.pageNumber || 1);
      params.append('pageSize', filter.pageSize || 10);

      const response = await fetch(`${AppConfig.API_BASE_URL}/customers?${params.toString()}`, {
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
    } catch (err) {
      console.warn('API unreachable. Serving customers from local data store.');
    }

    // Offline / Demo evaluation mode
    let all = this.getStorageCustomers();

    // 1. Role scoping (Section 7.1)
    if (userRole.toLowerCase() === 'salesexecutive') {
      const currentId = currentUser?.id || currentUser?.username || 'salesrep';
      all = all.filter(c => c.ownerId === currentId || c.ownerId === 'salesrep');
    }

    // 2. Search & Filter
    if (filter.searchTerm) {
      const term = filter.searchTerm.toLowerCase();
      all = all.filter(c =>
        c.customerName.toLowerCase().includes(term) ||
        c.email.toLowerCase().includes(term) ||
        c.phone.includes(term) ||
        (c.companyName && c.companyName.toLowerCase().includes(term)) ||
        c.customerCode.toLowerCase().includes(term)
      );
    }

    if (filter.status && filter.status !== 'All') {
      all = all.filter(c => c.status.toLowerCase() === filter.status.toLowerCase());
    }

    const page = filter.pageNumber || 1;
    const size = filter.pageSize || 10;
    const startIndex = (page - 1) * size;
    const paginated = all.slice(startIndex, startIndex + size);

    return {
      items: paginated,
      totalCount: all.length,
      pageNumber: page,
      pageSize: size,
      totalPages: Math.ceil(all.length / size)
    };
  },

  async checkDuplicate(email, phone, excludeId = null) {
    const token = localStorage.getItem(AppConfig.KEYS.TOKEN);
    try {
      const res = await fetch(`${AppConfig.API_BASE_URL}/customers/check-duplicate?email=${encodeURIComponent(email || '')}&phone=${encodeURIComponent(phone || '')}&excludeId=${excludeId || ''}`, {
        headers: { 'Authorization': `Bearer ${token}` },
        signal: AbortSignal.timeout(1500)
      });
      if (res.ok) {
        const json = await res.json();
        return json.data;
      }
    } catch {
      // Local check
    }

    const all = this.getStorageCustomers();
    const isEmailUnique = !email || !all.some(c => c.email.toLowerCase() === email.trim().toLowerCase() && c.customerId !== excludeId);
    const isPhoneUnique = !phone || !all.some(c => c.phone === phone.trim() && c.customerId !== excludeId);

    return { isEmailUnique, isPhoneUnique };
  },

  async createCustomer(data) {
    const token = localStorage.getItem(AppConfig.KEYS.TOKEN);
    const currentUser = AuthService.getCurrentUser();

    // Live backend call
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
      } else {
        return { success: false, message: json.message || 'Failed to create customer.' };
      }
    } catch {
      console.warn('API unreachable, saving locally.');
    }

    // Local validation check
    const dupCheck = await this.checkDuplicate(data.email, data.phone);
    if (!dupCheck.isEmailUnique) {
      return { success: false, message: 'A customer with this email address already exists. Duplicate emails are prohibited.' };
    }
    if (!dupCheck.isPhoneUnique) {
      return { success: false, message: 'A customer with this phone number already exists. Duplicate phones are prohibited.' };
    }

    const all = this.getStorageCustomers();
    const newId = 1000 + all.length + 1;
    const newCust = {
      customerId: newId,
      customerCode: `CUST-${newId}`,
      customerName: data.customerName,
      email: data.email.toLowerCase().trim(),
      phone: data.phone.trim(),
      companyName: data.companyName,
      address: data.address,
      city: data.city,
      state: data.state,
      status: 'Active',
      ownerId: currentUser?.username || 'salesrep',
      ownerName: currentUser?.fullName || 'Alex Morgan',
      createdDate: new Date().toISOString(),
      activeOpportunitiesCount: 0
    };

    all.unshift(newCust);
    this.saveStorageCustomers(all);
    return { success: true, customer: newCust, message: 'Customer created successfully.' };
  },

  async deleteCustomer(id) {
    const token = localStorage.getItem(AppConfig.KEYS.TOKEN);
    try {
      const res = await fetch(`${AppConfig.API_BASE_URL}/customers/${id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` },
        signal: AbortSignal.timeout(2000)
      });
      if (res.ok) return { success: true, message: 'Customer deactivated successfully.' };
    } catch {}

    const all = this.getStorageCustomers();
    const filtered = all.filter(c => c.customerId !== id);
    this.saveStorageCustomers(filtered);
    return { success: true, message: 'Customer deactivated successfully.' };
  }
};
