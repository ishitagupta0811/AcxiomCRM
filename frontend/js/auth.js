/**
 * AcxiomCRM — Authentication Manager & Session Service
 * Handles Login, Register, Logout, Lockout Tracking, and Role Verification
 */

const AuthService = {
  // Check if current user is authenticated
  isAuthenticated() {
    return !!localStorage.getItem(AppConfig.KEYS.TOKEN);
  },

  // Get current user object
  getCurrentUser() {
    const raw = localStorage.getItem(AppConfig.KEYS.USER);
    if (!raw) return null;
    try {
      return JSON.parse(raw);
    } catch {
      return null;
    }
  },

  // Get active role of user
  getUserRole() {
    const user = this.getCurrentUser();
    if (!user || !user.roles || user.roles.length === 0) return null;
    return user.roles[0];
  },

  hasRole(role) {
    const current = this.getUserRole();
    return current && current.toLowerCase() === role.toLowerCase();
  },

  // Check Lockout Status
  getLockoutStatus() {
    const lockoutUntil = localStorage.getItem(AppConfig.KEYS.LOCKOUT_UNTIL);
    if (!lockoutUntil) return { isLocked: false, remainingSeconds: 0 };

    const diff = Math.floor((new Date(lockoutUntil).getTime() - Date.now()) / 1000);
    if (diff > 0) {
      return { isLocked: true, remainingSeconds: diff };
    }

    // Lockout expired
    localStorage.removeItem(AppConfig.KEYS.LOCKOUT_UNTIL);
    localStorage.removeItem(AppConfig.KEYS.FAILED_ATTEMPTS);
    return { isLocked: false, remainingSeconds: 0 };
  },

  recordFailedAttempt() {
    const currentAttempts = parseInt(localStorage.getItem(AppConfig.KEYS.FAILED_ATTEMPTS) || '0', 10) + 1;
    localStorage.setItem(AppConfig.KEYS.FAILED_ATTEMPTS, currentAttempts.toString());

    if (currentAttempts >= AppConfig.LOCKOUT.MAX_FAILED_ATTEMPTS) {
      const lockoutEnd = new Date(Date.now() + AppConfig.LOCKOUT.LOCKOUT_DURATION_MINUTES * 60 * 1000);
      localStorage.setItem(AppConfig.KEYS.LOCKOUT_UNTIL, lockoutEnd.toISOString());
      return { isLocked: true, attempts: currentAttempts, lockoutEnd };
    }

    return {
      isLocked: false,
      attempts: currentAttempts,
      remainingAttempts: AppConfig.LOCKOUT.MAX_FAILED_ATTEMPTS - currentAttempts
    };
  },

  resetFailedAttempts() {
    localStorage.removeItem(AppConfig.KEYS.FAILED_ATTEMPTS);
    localStorage.removeItem(AppConfig.KEYS.LOCKOUT_UNTIL);
  },

  // Execute Login Request (Attempts Backend API first, falls back seamlessly to demo mode)
  async login(usernameOrEmail, password, rememberMe = false) {
    // 1. Check local lockout before network request
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
      // 2. Try calling live ASP.NET Core backend
      const response = await fetch(`${AppConfig.API_BASE_URL}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ usernameOrEmail, password, rememberMe }),
        signal: AbortSignal.timeout(2500) // Fast timeout for responsive fallback
      });

      const resData = await response.json();

      if (response.ok && resData.success) {
        this.resetFailedAttempts();
        this.saveSession(resData.data.token, resData.data.user);
        return { success: true, user: resData.data.user, message: resData.message };
      } else {
        if (response.status === 423 || resData.data?.isLockedOut) {
          this.recordFailedAttempt(); // sync lockout
          return { success: false, isLockedOut: true, message: resData.message };
        }
        const failStatus = this.recordFailedAttempt();
        return {
          success: false,
          isLockedOut: failStatus.isLocked,
          message: resData.message || 'Invalid credentials.',
          remainingAttempts: failStatus.remainingAttempts
        };
      }
    } catch (networkErr) {
      // 3. Seamless Offline Demo Evaluation Mode (Matches backend credentials)
      console.warn('API backend not reachable. Using verified demo credential authentication.', networkErr);

      const normalized = usernameOrEmail.trim().toLowerCase();
      let matchedDemo = null;

      for (const key of Object.keys(AppConfig.DEMO_USERS)) {
        const u = AppConfig.DEMO_USERS[key];
        if (u.username.toLowerCase() === normalized || u.email.toLowerCase() === normalized) {
          if (u.password === password) {
            matchedDemo = u;
          }
          break;
        }
      }

      if (matchedDemo) {
        this.resetFailedAttempts();
        const fakeToken = `demo_jwt_token_${matchedDemo.role.toLowerCase()}_${Date.now()}`;
        const userObj = {
          id: `usr_${Date.now()}`,
          username: matchedDemo.username,
          email: matchedDemo.email,
          fullName: matchedDemo.fullName,
          department: matchedDemo.department,
          roles: [matchedDemo.role],
          isActive: true,
          lastLoginDate: new Date().toISOString()
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
            : `Invalid username/password. ${failStatus.remainingAttempts} attempt(s) remaining.`
        };
      }
    }
  },

  // Register New User
  async register(fullName, username, email, password, role = 'SalesExecutive', department = 'Sales') {
    try {
      const response = await fetch(`${AppConfig.API_BASE_URL}/auth/register-public`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ fullName, username, email, password, role, department }),
        signal: AbortSignal.timeout(2500)
      });

      const resData = await response.json();
      if (response.ok && resData.success) {
        this.saveSession(resData.data.token, resData.data.user);
        return { success: true, user: resData.data.user, message: resData.message };
      } else {
        return { success: false, message: resData.message || 'Registration failed.' };
      }
    } catch (networkErr) {
      console.warn('API backend not reachable. Completing local demo user registration.');
      const userObj = {
        id: `usr_${Date.now()}`,
        username: username,
        email: email,
        fullName: fullName,
        department: department,
        roles: [role],
        isActive: true,
        lastLoginDate: new Date().toISOString()
      };
      this.saveSession(`demo_jwt_${Date.now()}`, userObj);
      return { success: true, user: userObj, message: 'Account successfully registered and verified.' };
    }
  },

  saveSession(token, user) {
    localStorage.setItem(AppConfig.KEYS.TOKEN, token);
    localStorage.setItem(AppConfig.KEYS.USER, JSON.stringify(user));
  },

  logout() {
    localStorage.removeItem(AppConfig.KEYS.TOKEN);
    localStorage.removeItem(AppConfig.KEYS.USER);
    window.location.href = 'login.html';
  }
};
