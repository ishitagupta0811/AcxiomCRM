using Microsoft.EntityFrameworkCore;
using AcxiomCRM.Backend.Data;
using AcxiomCRM.Backend.Models.DTOs.Common;
using AcxiomCRM.Backend.Models.DTOs.Customer;
using AcxiomCRM.Backend.Models.Entities;
using AcxiomCRM.Backend.Models.Enums;
using AcxiomCRM.Backend.Services.Interfaces;

namespace AcxiomCRM.Backend.Services.Implementations;

public class CustomerService : ICustomerService
{
    private readonly AcxiomDbContext _context;

    public CustomerService(AcxiomDbContext context)
    {
        _context = context;
    }

    public async Task<PagedResult<CustomerDto>> GetCustomersAsync(CustomerSearchFilterDto filter, string currentUserId, string currentUserRole)
    {
        var query = _context.Customers
            .Include(c => c.Owner)
            .Include(c => c.Opportunities)
            .AsNoTracking();

        // 1. Role-Based Access Scoping (Section 7.1 & 17.10)
        if (currentUserRole == UserRoles.SalesExecutive)
        {
            query = query.Where(c => c.OwnerId == currentUserId);
        }

        // 2. Search & Filtering (Section 17.13)
        if (!string.IsNullOrWhiteSpace(filter.SearchTerm))
        {
            var term = filter.SearchTerm.Trim().ToLower();
            query = query.Where(c =>
                c.CustomerName.ToLower().Contains(term) ||
                c.Email.ToLower().Contains(term) ||
                c.Phone.Contains(term) ||
                (c.CompanyName != null && c.CompanyName.ToLower().Contains(term)) ||
                c.CustomerCode.ToLower().Contains(term));
        }

        if (!string.IsNullOrWhiteSpace(filter.Status))
        {
            query = query.Where(c => c.Status == filter.Status);
        }

        if (!string.IsNullOrWhiteSpace(filter.OwnerId) && currentUserRole != UserRoles.SalesExecutive)
        {
            query = query.Where(c => c.OwnerId == filter.OwnerId);
        }

        var totalCount = await query.CountAsync();

        var items = await query
            .OrderByDescending(c => c.CreatedDate)
            .Skip((filter.PageNumber - 1) * filter.PageSize)
            .Take(filter.PageSize)
            .Select(c => new CustomerDto
            {
                CustomerId = c.CustomerId,
                CustomerCode = c.CustomerCode,
                CustomerName = c.CustomerName,
                Email = c.Email,
                Phone = c.Phone,
                CompanyName = c.CompanyName,
                Address = c.Address,
                City = c.City,
                State = c.State,
                Status = c.Status,
                OwnerId = c.OwnerId,
                OwnerName = c.Owner != null ? c.Owner.FullName : "Unassigned",
                CreatedDate = c.CreatedDate,
                CreatedBy = c.CreatedBy,
                ModifiedDate = c.ModifiedDate,
                ActiveOpportunitiesCount = c.Opportunities.Count(o => !o.IsDeleted && o.Status == "Open")
            })
            .ToListAsync();

        return PagedResult<CustomerDto>.Create(items, totalCount, filter.PageNumber, filter.PageSize);
    }

    public async Task<CustomerDto?> GetCustomerByIdAsync(int id, string currentUserId, string currentUserRole)
    {
        var query = _context.Customers
            .Include(c => c.Owner)
            .Include(c => c.Opportunities)
            .AsNoTracking()
            .Where(c => c.CustomerId == id);

        if (currentUserRole == UserRoles.SalesExecutive)
        {
            query = query.Where(c => c.OwnerId == currentUserId);
        }

        var customer = await query.FirstOrDefaultAsync();
        if (customer is null) return null;

        return new CustomerDto
        {
            CustomerId = customer.CustomerId,
            CustomerCode = customer.CustomerCode,
            CustomerName = customer.CustomerName,
            Email = customer.Email,
            Phone = customer.Phone,
            CompanyName = customer.CompanyName,
            Address = customer.Address,
            City = customer.City,
            State = customer.State,
            Status = customer.Status,
            OwnerId = customer.OwnerId,
            OwnerName = customer.Owner?.FullName,
            CreatedDate = customer.CreatedDate,
            CreatedBy = customer.CreatedBy,
            ModifiedDate = customer.ModifiedDate,
            ActiveOpportunitiesCount = customer.Opportunities.Count(o => !o.IsDeleted && o.Status == "Open")
        };
    }

    public async Task<(bool Success, string Message, CustomerDto? Customer)> CreateCustomerAsync(CreateCustomerDto dto, string currentUserId, string currentUserRole)
    {
        // 1. Mandatory Business Validations (Section 5.3, 17.5 & 17.7)
        var normalizedEmail = dto.Email.Trim().ToLower();
        var normalizedPhone = dto.Phone.Trim();

        if (!await IsEmailUniqueAsync(normalizedEmail))
        {
            return (false, "A customer with this email address already exists. Duplicate emails are prohibited.", null);
        }

        if (!await IsPhoneUniqueAsync(normalizedPhone))
        {
            return (false, "A customer with this phone number already exists. Duplicate phone numbers are prohibited.", null);
        }

        // 2. Generate unique CustomerCode (e.g. CUST-1001)
        var lastId = await _context.Customers.MaxAsync(c => (int?)c.CustomerId) ?? 1000;
        var customerCode = $"CUST-{lastId + 1}";

        // 3. Resolve Owner
        var ownerId = !string.IsNullOrWhiteSpace(dto.OwnerId) && currentUserRole != UserRoles.SalesExecutive
            ? dto.OwnerId
            : currentUserId;

        var customer = new Customer
        {
            CustomerCode = customerCode,
            CustomerName = dto.CustomerName.Trim(),
            Email = normalizedEmail,
            Phone = normalizedPhone,
            CompanyName = dto.CompanyName?.Trim(),
            Address = dto.Address?.Trim(),
            City = dto.City?.Trim(),
            State = dto.State?.Trim(),
            Status = "Active",
            OwnerId = ownerId,
            CreatedBy = currentUserId,
            CreatedDate = DateTime.UtcNow
        };

        _context.Customers.Add(customer);
        await _context.SaveChangesAsync();

        var createdDto = await GetCustomerByIdAsync(customer.CustomerId, currentUserId, currentUserRole);
        return (true, "Customer created successfully.", createdDto);
    }

    public async Task<(bool Success, string Message, CustomerDto? Customer)> UpdateCustomerAsync(int id, UpdateCustomerDto dto, string currentUserId, string currentUserRole)
    {
        var customer = await _context.Customers.FirstOrDefaultAsync(c => c.CustomerId == id);
        if (customer is null)
        {
            return (false, "Customer record not found.", null);
        }

        // Role authorization check
        if (currentUserRole == UserRoles.SalesExecutive && customer.OwnerId != currentUserId)
        {
            return (false, "Access denied. You do not have permission to modify this customer.", null);
        }

        var normalizedEmail = dto.Email.Trim().ToLower();
        var normalizedPhone = dto.Phone.Trim();

        // Email & Phone Uniqueness Check
        if (!await IsEmailUniqueAsync(normalizedEmail, id))
        {
            return (false, "Another customer already exists with this email address.", null);
        }

        if (!await IsPhoneUniqueAsync(normalizedPhone, id))
        {
            return (false, "Another customer already exists with this phone number.", null);
        }

        customer.CustomerName = dto.CustomerName.Trim();
        customer.Email = normalizedEmail;
        customer.Phone = normalizedPhone;
        customer.CompanyName = dto.CompanyName?.Trim();
        customer.Address = dto.Address?.Trim();
        customer.City = dto.City?.Trim();
        customer.State = dto.State?.Trim();
        customer.Status = dto.Status;
        customer.ModifiedDate = DateTime.UtcNow;

        if (!string.IsNullOrWhiteSpace(dto.OwnerId) && currentUserRole != UserRoles.SalesExecutive)
        {
            customer.OwnerId = dto.OwnerId;
        }

        await _context.SaveChangesAsync();

        var updatedDto = await GetCustomerByIdAsync(customer.CustomerId, currentUserId, currentUserRole);
        return (true, "Customer updated successfully.", updatedDto);
    }

    public async Task<(bool Success, string Message)> DeleteCustomerAsync(int id, string currentUserId, string currentUserRole)
    {
        var customer = await _context.Customers.FirstOrDefaultAsync(c => c.CustomerId == id);
        if (customer is null)
        {
            return (false, "Customer not found.");
        }

        if (currentUserRole == UserRoles.SalesExecutive && customer.OwnerId != currentUserId)
        {
            return (false, "Access denied. You do not have permission to delete this customer.");
        }

        // Soft delete to preserve audit history and relational integrity
        customer.IsDeleted = true;
        customer.ModifiedDate = DateTime.UtcNow;

        await _context.SaveChangesAsync();
        return (true, "Customer deactivated successfully.");
    }

    public async Task<bool> IsEmailUniqueAsync(string email, int? excludeCustomerId = null)
    {
        var query = _context.Customers.Where(c => c.Email.ToLower() == email.ToLower());
        if (excludeCustomerId.HasValue)
        {
            query = query.Where(c => c.CustomerId != excludeCustomerId.Value);
        }
        return !await query.AnyAsync();
    }

    public async Task<bool> IsPhoneUniqueAsync(string phone, int? excludeCustomerId = null)
    {
        var query = _context.Customers.Where(c => c.Phone == phone);
        if (excludeCustomerId.HasValue)
        {
            query = query.Where(c => c.CustomerId != excludeCustomerId.Value);
        }
        return !await query.AnyAsync();
    }
}
