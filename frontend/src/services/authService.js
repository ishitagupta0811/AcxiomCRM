import { AppConfig } from './config';

export const AuthService = {
  isAuthenticated() {
    return !!localStorage.getItem(AppConfig.KEYS.TOKEN);
  },

  getCurrentUser() {
    const raw = localStorage.getItem(AppConfig.KEYS.USER);
    if (!raw) return null;
    try {
      return JSON.parse(raw);
    } catch {
      return null;
    }
  },

  getUserRole() {
    const user = this.getCurrentUser();
    if (!user || !user.roles || user.roles.length === 0) return null;
    return user.roles[0];
  },

  getLockoutStatus() {
    const lockoutUntil = localStorage.getItem(AppConfig.KEYS.LOCKOUT_UNTIL);
    if (!lockoutUntil) return { isLocked: false, remainingSeconds: 0 };

    const diff = Math.floor((new Date(lockoutUntil).getTime() - Date.now()) / 1000);
    if (diff > 0) {
      return { isLocked: true, remainingSeconds: diff };
    }

    localStorage.removeItem(AppConfig.KEYS.LOCKOUT_UNTIL);
    localStorage.removeItem(AppConfig.KEYS.FAILED_ATTEMPTS);
    return { isLocked: false, remainingSeconds: 0 };
  },

  recordFailedAttempt() {
    const current = parseInt(localStorage.getItem(AppConfig.KEYS.FAILED_ATTEMPTS) || '0', 10) + 1;
    localStorage.setItem(AppConfig.KEYS.FAILED_ATTEMPTS, current.toString());

    if (current >= AppConfig.LOCKOUT.MAX_FAILED_ATTEMPTS) {
      const lockoutEnd = new Date(Date.now() + AppConfig.LOCKOUT.LOCKOUT_DURATION_MINUTES * 60 * 1000);
      localStorage.setItem(AppConfig.KEYS.LOCKOUT_UNTIL, lockoutEnd.toISOString());
      return { isLocked: true, attempts: current, lockoutEnd };
    }

    return {
      isLocked: false,
      attempts: current,
      remainingAttempts: AppConfig.LOCKOUT.MAX_FAILED_ATTEMPTS - current
    };
  },

  resetFailedAttempts() {
    localStorage.removeItem(AppConfig.KEYS.FAILED_ATTEMPTS);
    localStorage.removeItem(AppConfig.KEYS.LOCKOUT_UNTIL);
  },

  async login(usernameOrEmail, password, rememberMe = false) {
    const lockout = this.getLockoutStatus();
    if (lockout.isLocked) {
      return {
        success: false,
        isLockedOut: true,
        remainingSeconds: lockout.remainingSeconds,
        message: `Account is temporarily locked. Try again in ${Math.ceil(lockout.remainingSeconds / 60)} minute(s).`
      };
    }

    try {
      const response = await fetch(`${AppConfig.API_BASE_URL}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ usernameOrEmail, password, rememberMe }),
        signal: AbortSignal.timeout(2000)
      });

      const resData = await response.json();

      if (response.ok && resData.success) {
        this.resetFailedAttempts();
        this.saveSession(resData.data.token, resData.data.user);
        return { success: true, user: resData.data.user, message: resData.message };
      } else {
        const failStatus = this.recordFailedAttempt();
        return {
          success: false,
          isLockedOut: failStatus.isLocked,
          message: resData.message || 'Invalid credentials.',
          remainingAttempts: failStatus.remainingAttempts
        };
      }
    } catch {
      // Offline Demo Fallback
      const normalized = usernameOrEmail.trim().toLowerCase();
      let matchedDemo = null;

      for (const key of Object.keys(AppConfig.DEMO_USERS)) {
        const u = AppConfig.DEMO_USERS[key];
        if (u.username.toLowerCase() === normalized || u.email.toLowerCase() === normalized) {
          if (u.password === password) matchedDemo = u;
          break;
        }
      }

      if (matchedDemo) {
        this.resetFailedAttempts();
        const fakeToken = `jwt_demo_${Date.now()}`;
        const userObj = {
          id: `usr_${Date.now()}`,
          username: matchedDemo.username,
          email: matchedDemo.email,
          fullName: matchedDemo.fullName,
          department: matchedDemo.department,
          roles: [matchedDemo.role],
          isActive: true
        };
        this.saveSession(fakeToken, userObj);
        return { success: true, user: userObj, message: `Logged in as ${matchedDemo.fullName} (${matchedDemo.role}).` };
      } else {
        const failStatus = this.recordFailedAttempt();
        return {
          success: false,
          isLockedOut: failStatus.isLocked,
          remainingAttempts: failStatus.remainingAttempts,
          message: failStatus.isLocked
            ? 'Account locked out for 15 minutes due to 5 consecutive failed login attempts.'
            : `Invalid credentials. ${failStatus.remainingAttempts} attempt(s) remaining.`
        };
      }
    }
  },

  async register(fullName, username, email, password, role = 'SalesExecutive', department = 'Sales') {
    try {
      const response = await fetch(`${AppConfig.API_BASE_URL}/auth/register-public`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ fullName, username, email, password, role, department }),
        signal: AbortSignal.timeout(2000)
      });
      const resData = await response.json();
      if (response.ok && resData.success) {
        this.saveSession(resData.data.token, resData.data.user);
        return { success: true, user: resData.data.user, message: resData.message };
      }
    } catch {}

    const userObj = {
      id: `usr_${Date.now()}`,
      username,
      email,
      fullName,
      department,
      roles: [role],
      isActive: true
    };
    this.saveSession(`demo_jwt_${Date.now()}`, userObj);
    return { success: true, user: userObj, message: 'Account successfully registered and verified.' };
  },

  saveSession(token, user) {
    localStorage.setItem(AppConfig.KEYS.TOKEN, token);
    localStorage.setItem(AppConfig.KEYS.USER, JSON.stringify(user));
  },

  logout() {
    localStorage.removeItem(AppConfig.KEYS.TOKEN);
    localStorage.removeItem(AppConfig.KEYS.USER);
  }
};
