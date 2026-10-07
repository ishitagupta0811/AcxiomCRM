# AcxiomCRM — Enterprise Sales & CRM Platform

[![Architecture Baseline](https://img.shields.io/badge/Architecture-Clean%20%2F%20N--Tier-blue.svg)](docs/phaseWiseArchitecture.md)
[![Backend Framework](https://img.shields.io/badge/.NET-8.0%20ASP.NET%20Core-purple.svg)](backend/)
[![ORM](https://img.shields.io/badge/EF%20Core-SQL%20Server-red.svg)](backend/)
[![Security Engine](https://img.shields.io/badge/Identity-ASP.NET%20Core%20Identity-green.svg)](backend/)
[![Phase Status](https://img.shields.io/badge/Phase%200%20%26%201-Completed-brightgreen.svg)](docs/phaseWiseArchitecture.md)

An enterprise-grade, role-based CRM application covering the complete customer-sales lifecycle from lead capture through follow-ups and opportunity pipelines, featuring strict multi-tiered validation, deterministic role-based access control (RBAC), automated immutable audit logging, and RESTful APIs.

---

## 🗂️ Project Structure

```text
AcxiomCRM/
├── AcxiomCRM.sln                      # Visual Studio solution linking backend & test projects
├── .gitignore                         # Comprehensive gitignore for .NET, IDEs, and web
├── .editorconfig                      # Universal code styling and indentation standard
├── run-dev.ps1                        # Environment launcher and health check script
│
├── docs/                              # Project Documentation
│   ├── problemStatement.md            # Problem requirements specification
│   └── phaseWiseArchitecture.md       # Full phase-wise architectural blueprint
│
├── backend/                           # ASP.NET Core 8 Web API & Identity Layer
│   ├── AcxiomCRM.Backend.csproj       # Project configuration with EF Core & Identity
│   ├── Program.cs                     # Identity policies, JWT, Lockout, CORS, and Swagger
│   ├── appsettings.json               # Database connection string and security tokens
│   ├── Controllers/                   # RESTful API controllers (Auth, Users)
│   ├── Data/                          # AcxiomDbContext, Audit Interceptor, and Seeder
│   ├── Models/                        # Domain entities, Enums, and DTOs
│   └── Services/                      # AuthService, AuditService, and business logic
│
├── frontend/                          # Presentation & Client-Side UX Layer
│   ├── index.html                     # Landing portal with interactive role testbed
│   ├── login.html                     # Login UI with live validation and lockout timer
│   ├── register.html                  # User provisioning with password complexity meter
│   ├── dashboard.html                 # Authenticated workspace with role-scoped navigation
│   ├── css/                           # Modern HSL design tokens, base typography, and layouts
│   └── js/                            # Client-side validation, session manager, and API client
│
└── tests/                             # Unit & Integration Testing Suite
    └── AcxiomCRM.Tests/               # Validation rules & security policy tests
```

---

## 🚀 Phase Implementation Status

| Phase | Milestone Name | Status | Deliverables & Artifacts |
|---|---|:---:|---|
| **Phase 0** | **Project Inception & Architecture Skeleton** | **✅ Completed** | Solution file (`AcxiomCRM.sln`), `.editorconfig`, `.gitignore`, launcher script, and `AcxiomCRM.Tests` test project. |
| **Phase 1** | **Foundation, Identity & RBAC Engine** | **✅ Completed** | ASP.NET Core Identity integration, PBKDF2 hashing, 5-attempt/15-min lockout, `Admin`/`Manager`/`SalesExecutive` roles, and responsive frontend UI. |
| **Phase 2** | **Customer & Lead Management Engine** | **✅ Completed** | Customer master CRUD, lead qualification, real-time duplicate checks (email/phone), and transactional lead-to-customer conversion. |
| **Phase 3** | **Opportunity Pipeline & Follow-Ups** | **✅ Completed** | Interactive Kanban stage pipeline (`Qualification`, `Proposal`, `Negotiation`, `Won`, `Lost`), automated weighted forecasting ($\sum \text{Amount} \times \frac{\text{Probability}}{100}$), interaction scheduler & overdue alerts. |
| **Phase 4** | **Automated Audit Logging & Anti-Tamper Engine** | **✅ Completed** | Dedicated audit trail visualizer, JSON delta inspector, security event statistics, and immutable append-only API. |
| **Phase 5** | **REST API & OpenAPI Swagger Subsystem** | **✅ Completed** | Standardized RESTful endpoints (`/api/*`), OpenAPI Swagger docs, Bearer JWT authorization, and interactive in-app API Explorer console. |
| **Phase 6** | **Executive Dashboard & Chart Visualizations** | **✅ Completed** | Real-time KPI aggregation, 4 interactive visual charts (Funnel, 6-Month Velocity, Lead Status, Activity Mix), and role-tailored workspaces. |
| **Phase 7** | Comprehensive Reporting Engine | 📅 Next | Tabular reporting, server-side pagination, and CSV data exports. |
| **Phase 8** | Security Hardening & Acceptance QA | 📅 Planned | Verification of all 14 mandatory acceptance scenarios in Section 17.19. |

---

## 🔑 Pre-Configured Test Credentials

The database and frontend demo mode are pre-seeded with three authorized role personas:

| Role | Username | Corporate Email | Password | Scope & Responsibilities |
|---|---|---|---|---|
| **Administrator** | `admin` | `admin@acxiomcrm.local` | `Admin@12345` | Global system administration, user management, and security audit logs. |
| **Manager** | `manager` | `manager@acxiomcrm.local` | `Manager@12345` | Department sales pipeline, deal stage health, and team conversion metrics. |
| **Sales Executive** | `salesrep` | `sales@acxiomcrm.local` | `Sales@12345` | Assigned customers, prospective leads, and scheduled follow-ups. |

---

## ⚡ Quick Start Guide

### Option 1: Evaluate the Frontend Directly (Instant Browser Preview)
Open [frontend/index.html](file:///d:/College%20Stuff/My%20Resume/AcxiomCRM/frontend/index.html) or [frontend/login.html](file:///d:/College%20Stuff/My%20Resume/AcxiomCRM/frontend/login.html) in any modern browser.
- Use the **Quick Evaluation Login** buttons on the login page or the persona test cards on the landing page to experience role-based authorization, live validation, and lockout timers.

### Option 2: Run via Developer Script
Execute the launcher script in PowerShell:
```powershell
.\run-dev.ps1
```

### Option 3: Run Backend via .NET CLI
```powershell
dotnet restore AcxiomCRM.sln
dotnet run --project backend/AcxiomCRM.Backend.csproj
```
API endpoints and OpenAPI documentation will be accessible at:
- Swagger UI: `http://localhost:5000/swagger`

---

## 🛡️ Mandatory Compliance Checklist (Problem Statement Sections 5, 6, 7 & 17)

- [x] **Client-Side Validation:** Immediate validation on Required, RFC Email, 10-digit Phone, and dynamic password complexity.
- [x] **Server-Side Validation:** DataAnnotations and ModelState rejection on malformed HTTP payloads.
- [x] **ASP.NET Core Identity:** Secure PBKDF2 adaptive password hashing without custom/plain-text password storage.
- [x] **Account Lockout:** Enforced 15-minute lock after 5 consecutive failed access attempts.
- [x] **Role Authorization:** Distinct access tiers for `Admin`, `Manager`, and `SalesExecutive`.
- [x] **Audit Trail System:** `AuditSaveChangesInterceptor` captures entity changes, JSON deltas, actors, and IP addresses.
