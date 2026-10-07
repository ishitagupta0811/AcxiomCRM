# AcxiomCRM — Backend Engine (Phase 1)

## Architecture Overview
The backend is built with **ASP.NET Core 8 Web API** implementing Clean Architecture principles and configured with:
- **ASP.NET Core Identity**: User management, claims-based role authorization, PBKDF2 password hashing, password complexity policies, and account lockout protection.
- **Entity Framework Core 8**: Code-first entity modeling with SQL Server, relational constraints, unique indexes, and automated audit interceptors.
- **JWT Bearer Token Authentication**: Cryptographic token generation for stateless API authorization.
- **Automated Audit Logging**: `AuditSaveChangesInterceptor` automatically captures entity state mutations and changes into the immutable `AuditLogs` table.
- **Database Seeding**: Default roles (`Admin`, `Manager`, `SalesExecutive`) and demo accounts seeded upon first startup.

## Default Seed Credentials
| Role | Username / Email | Password | Scope |
|---|---|---|---|
| **Admin** | `admin` / `admin@acxiomcrm.local` | `Admin@12345` | Global System & Security Administration |
| **Manager** | `manager` / `manager@acxiomcrm.local` | `Manager@12345` | Team Pipeline & Management Reports |
| **SalesExecutive** | `salesrep` / `sales@acxiomcrm.local` | `Sales@12345` | Assigned Customers, Leads, and Opportunities |

## How to Run
```bash
cd backend
dotnet restore
dotnet build
dotnet run
```
Once started, explore the OpenAPI documentation and Swagger UI at:
`http://localhost:5000/swagger` or `https://localhost:5001/swagger`
