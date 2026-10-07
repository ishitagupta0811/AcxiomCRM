/**
 * AcxiomCRM — Core UI Application Helper
 * Toasts, UI bindings, Route protection, Profile rendering
 */

const AppUI = {
  init() {
    this.createToastContainer();
    this.protectRoutes();
    this.renderHeaderUser();
  },

  createToastContainer() {
    if (!document.getElementById('toast-container')) {
      const container = document.createElement('div');
      container.id = 'toast-container';
      document.body.appendChild(container);
    }
  },

  showToast(message, type = 'info') {
    const container = document.getElementById('toast-container') || document.body;
    const toast = document.createElement('div');
    toast.className = `toast alert-${type}`;

    let icon = 'ℹ️';
    if (type === 'success') icon = '✅';
    if (type === 'danger') icon = '⚠️';
    if (type === 'warning') icon = '⚡';

    toast.innerHTML = `
      <span>${icon}</span>
      <div style="flex: 1; font-size: 0.85rem; font-weight: 500;">${message}</div>
    `;

    container.appendChild(toast);

    setTimeout(() => {
      toast.style.opacity = '0';
      toast.style.transform = 'translateX(100%)';
      toast.style.transition = 'all 250ms ease';
      setTimeout(() => toast.remove(), 250);
    }, 4000);
  },

  protectRoutes() {
    const path = window.location.pathname.toLowerCase();
    const isAuthPage = path.includes('login.html') || path.includes('register.html') || path.endsWith('/') || path.includes('index.html');
    const isProtectedPage = path.includes('dashboard.html');

    if (isProtectedPage && !AuthService.isAuthenticated()) {
      window.location.href = 'login.html?redirect=unauthorized';
    }

    if (isAuthPage && AuthService.isAuthenticated() && !path.includes('index.html')) {
      // If already logged in, redirect away from login/register to dashboard
      window.location.href = 'dashboard.html';
    }
  },

  renderHeaderUser() {
    const userContainer = document.getElementById('header-user-profile');
    if (!userContainer) return;

    const user = AuthService.getCurrentUser();
    if (!user) return;

    const role = (user.roles && user.roles[0]) || 'SalesExecutive';
    let roleBadgeClass = 'badge-sales';
    if (role.toLowerCase() === 'admin') roleBadgeClass = 'badge-admin';
    if (role.toLowerCase() === 'manager') roleBadgeClass = 'badge-manager';

    const initials = user.fullName
      ? user.fullName.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase()
      : user.username.substring(0, 2).toUpperCase();

    userContainer.innerHTML = `
      <div class="user-profile-badge">
        <div class="user-avatar">${initials}</div>
        <div class="user-meta">
          <span class="user-meta-name">${user.fullName || user.username}</span>
          <span class="badge ${roleBadgeClass}" style="margin-top: 2px;">${role}</span>
        </div>
      </div>
      <button id="btn-logout" class="btn btn-outline btn-sm" title="Log Out">
        <span>Logout</span>
      </button>
    `;

    document.getElementById('btn-logout')?.addEventListener('click', () => {
      AuthService.logout();
    });

    // Role-specific navigation display
    this.filterNavByRole(role);
  },

  filterNavByRole(role) {
    const adminItems = document.querySelectorAll('.nav-admin-only');
    const managerItems = document.querySelectorAll('.nav-manager-only');

    if (role.toLowerCase() !== 'admin') {
      adminItems.forEach(el => el.style.display = 'none');
    }
    if (role.toLowerCase() === 'salesexecutive') {
      managerItems.forEach(el => el.style.display = 'none');
    }
  },

  setupPasswordToggle(toggleBtnId, passwordInputId) {
    const btn = document.getElementById(toggleBtnId);
    const input = document.getElementById(passwordInputId);
    if (!btn || !input) return;

    btn.addEventListener('click', (e) => {
      e.preventDefault();
      const isPassword = input.type === 'password';
      input.type = isPassword ? 'text' : 'password';
      btn.innerHTML = isPassword ? '👁️‍🗨️' : '👁️';
    });
  }
};

document.addEventListener('DOMContentLoaded', () => {
  AppUI.init();
});
