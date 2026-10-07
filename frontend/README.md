# AcxiomCRM — Frontend Client (Phase 1)

## Overview
The frontend is a vanilla HTML5, CSS3, and modern JavaScript enterprise web application engineered for high-fidelity user experience, responsiveness, and multi-tier validation.

### Features Implemented in Phase 1:
1. **Multi-Level Client-Side Validation (`js/validation.js`)**:
   - RFC email address format check.
   - 10-digit mobile number pattern check (`^[6-9]\d{9}$`).
   - Field length constraints.
   - Identity password complexity verification (minimum 8 characters, uppercase, lowercase, digit, and special character) with real-time UI strength meter and checklist feedback.
2. **Deterministic Role-Based Access Control (`js/auth.js`, `js/app.js`)**:
   - Distinct personas: `Admin`, `Manager`, and `SalesExecutive`.
   - UI navigation dynamically filtered by role.
   - Route protection preventing unauthenticated access to `dashboard.html`.
3. **Brute-Force Account Lockout Protection**:
   - 5-attempt limit with 15-minute lockout timer countdown.
4. **Backend API Integration with Zero-Dependency Demo Mode**:
   - Connects to the ASP.NET Core backend API (`http://localhost:5000/api/auth/login`).
   - If the backend is not yet started, falls back seamlessly to instant demo evaluation mode using the same seeded credentials (`admin`, `manager`, `salesrep`).

## How to Run the Frontend
You can open `frontend/index.html` or `frontend/login.html` directly in any web browser, or serve it using any local static web server:

```bash
# Option 1: Double click or open in browser directly
start frontend/index.html

# Option 2: Using Node's npx http-server or live-server
npx http-server frontend -p 3000
```
