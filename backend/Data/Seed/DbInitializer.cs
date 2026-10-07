using Microsoft.AspNetCore.Identity;
using Microsoft.Extensions.Logging;
using AcxiomCRM.Backend.Models.Entities;
using AcxiomCRM.Backend.Models.Enums;

namespace AcxiomCRM.Backend.Data.Seed;

public static class DbInitializer
{
    public static async Task SeedAsync(
        AcxiomDbContext context,
        UserManager<ApplicationUser> userManager,
        RoleManager<ApplicationRole> roleManager,
        ILogger logger)
    {
        try
        {
            await context.Database.EnsureCreatedAsync();

            // 1. Seed Roles
            foreach (var roleName in UserRoles.All)
            {
                if (!await roleManager.RoleExistsAsync(roleName))
                {
                    var role = new ApplicationRole(roleName, $"Default system {roleName} role");
                    await roleManager.CreateAsync(role);
                    logger.LogInformation("Seeded role: {Role}", roleName);
                }
            }

            // 2. Seed Default Admin User
            var adminEmail = "admin@acxiomcrm.local";
            var adminUser = await userManager.FindByEmailAsync(adminEmail);
            if (adminUser is null)
            {
                adminUser = new ApplicationUser
                {
                    UserName = "admin",
                    Email = adminEmail,
                    FullName = "System Administrator",
                    Department = "Executive",
                    EmailConfirmed = true,
                    IsActive = true,
                    CreatedDate = DateTime.UtcNow
                };

                var result = await userManager.CreateAsync(adminUser, "Admin@12345");
                if (result.Succeeded)
                {
                    await userManager.AddToRoleAsync(adminUser, UserRoles.Admin);
                    logger.LogInformation("Seeded default Admin user: {Email}", adminEmail);
                }
                else
                {
                    logger.LogError("Failed to seed admin user: {Errors}", string.Join(", ", result.Errors.Select(e => e.Description)));
                }
            }

            // 3. Seed Default Manager User
            var managerEmail = "manager@acxiomcrm.local";
            var managerUser = await userManager.FindByEmailAsync(managerEmail);
            if (managerUser is null)
            {
                managerUser = new ApplicationUser
                {
                    UserName = "manager",
                    Email = managerEmail,
                    FullName = "Sales Manager",
                    Department = "Sales Management",
                    EmailConfirmed = true,
                    IsActive = true,
                    CreatedDate = DateTime.UtcNow
                };

                var result = await userManager.CreateAsync(managerUser, "Manager@12345");
                if (result.Succeeded)
                {
                    await userManager.AddToRoleAsync(managerUser, UserRoles.Manager);
                    logger.LogInformation("Seeded default Manager user: {Email}", managerEmail);
                }
            }

            // 4. Seed Default Sales Executive User
            var salesEmail = "sales@acxiomcrm.local";
            var salesUser = await userManager.FindByEmailAsync(salesEmail);
            if (salesUser is null)
            {
                salesUser = new ApplicationUser
                {
                    UserName = "salesrep",
                    Email = salesEmail,
                    FullName = "Alex Morgan",
                    Department = "Direct Sales",
                    EmailConfirmed = true,
                    IsActive = true,
                    CreatedDate = DateTime.UtcNow
                };

                var result = await userManager.CreateAsync(salesUser, "Sales@12345");
                if (result.Succeeded)
                {
                    await userManager.AddToRoleAsync(salesUser, UserRoles.SalesExecutive);
                    logger.LogInformation("Seeded default SalesExecutive user: {Email}", salesEmail);
                }
            }

            // 5. Seed Demo Customers (Phase 2)
            if (!context.Customers.Any())
            {
                var customer1 = new Customer
                {
                    CustomerCode = "CUST-1001",
                    CustomerName = "Acme Technologies Corp",
                    Email = "contact@acmetech.com",
                    Phone = "9876543210",
                    CompanyName = "Acme Technologies Corp",
                    Address = "Tech Park 4B, Electronic City",
                    City = "Bangalore",
                    State = "Karnataka",
                    Status = "Active",
                    OwnerId = salesUser.Id,
                    CreatedBy = adminUser.Id,
                    CreatedDate = DateTime.UtcNow.AddDays(-20)
                };

                var customer2 = new Customer
                {
                    CustomerCode = "CUST-1002",
                    CustomerName = "Global Logistics Ltd",
                    Email = "info@globallogistics.com",
                    Phone = "9123456780",
                    CompanyName = "Global Logistics Ltd",
                    Address = "Harbor View Tower 12",
                    City = "Mumbai",
                    State = "Maharashtra",
                    Status = "Active",
                    OwnerId = salesUser.Id,
                    CreatedBy = adminUser.Id,
                    CreatedDate = DateTime.UtcNow.AddDays(-10)
                };

                context.Customers.AddRange(customer1, customer2);
                await context.SaveChangesAsync();
                logger.LogInformation("Seeded demo Customers.");
            }

            // 6. Seed Demo Leads (Phase 2)
            if (!context.Leads.Any())
            {
                var lead1 = new Lead
                {
                    LeadCode = "LEAD-2001",
                    LeadName = "Nexa Dynamics",
                    Email = "procurement@nexadynamics.com",
                    Phone = "9811223344",
                    CompanyName = "Nexa Dynamics",
                    Source = "Website Inquiry",
                    Status = LeadStatus.Qualified,
                    ExpectedValue = 45000.00m,
                    AssignedTo = salesUser.Id,
                    CreatedDate = DateTime.UtcNow.AddDays(-5)
                };

                var lead2 = new Lead
                {
                    LeadCode = "LEAD-2002",
                    LeadName = "Horizon Media Works",
                    Email = "partnerships@horizonmedia.com",
                    Phone = "9711556677",
                    CompanyName = "Horizon Media Works",
                    Source = "Partner Referral",
                    Status = LeadStatus.Contacted,
                    ExpectedValue = 18000.00m,
                    AssignedTo = salesUser.Id,
                    CreatedDate = DateTime.UtcNow.AddDays(-2)
                };

                var lead3 = new Lead
                {
                    LeadCode = "LEAD-2003",
                    LeadName = "Apex Retail Outlets",
                    Email = "deals@apexretail.com",
                    Phone = "9622334455",
                    CompanyName = "Apex Retail Outlets",
                    Source = "Direct Outreach",
                    Status = LeadStatus.New,
                    ExpectedValue = 75000.00m,
                    AssignedTo = salesUser.Id,
                    CreatedDate = DateTime.UtcNow.AddDays(-1)
                };

                context.Leads.AddRange(lead1, lead2, lead3);
                await context.SaveChangesAsync();
                logger.LogInformation("Seeded demo Leads.");
            }
        }
        catch (Exception ex)
        {
            logger.LogError(ex, "An error occurred during database seeding.");
            throw;
        }
    }
}
