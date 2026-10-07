using Microsoft.EntityFrameworkCore;
using AcxiomCRM.Backend.Data;
using AcxiomCRM.Backend.Models.DTOs.Common;
using AcxiomCRM.Backend.Models.DTOs.Lead;
using AcxiomCRM.Backend.Models.Entities;
using AcxiomCRM.Backend.Models.Enums;
using AcxiomCRM.Backend.Services.Interfaces;

namespace AcxiomCRM.Backend.Services.Implementations;

public class LeadService : ILeadService
{
    private readonly AcxiomDbContext _context;
    private readonly ICustomerService _customerService;

    public LeadService(AcxiomDbContext context, ICustomerService customerService)
    {
        _context = context;
        _customerService = customerService;
    }

    public async Task<PagedResult<LeadDto>> GetLeadsAsync(LeadSearchFilterDto filter, string currentUserId, string currentUserRole)
    {
        var query = _context.Leads
            .Include(l => l.AssignedUser)
            .AsNoTracking();

        // 1. Role-Based Access Scoping (Section 7.1)
        if (currentUserRole == UserRoles.SalesExecutive)
        {
            query = query.Where(l => l.AssignedTo == currentUserId);
        }

        // 2. Search & Filtering (Section 17.13)
        if (!string.IsNullOrWhiteSpace(filter.SearchTerm))
        {
            var term = filter.SearchTerm.Trim().ToLower();
            query = query.Where(l =>
                l.LeadName.ToLower().Contains(term) ||
                l.Email.ToLower().Contains(term) ||
                l.Phone.Contains(term) ||
                (l.CompanyName != null && l.CompanyName.ToLower().Contains(term)) ||
                l.LeadCode.ToLower().Contains(term));
        }

        if (filter.Status.HasValue)
        {
            query = query.Where(l => l.Status == filter.Status.Value);
        }

        if (!string.IsNullOrWhiteSpace(filter.AssignedTo) && currentUserRole != UserRoles.SalesExecutive)
        {
            query = query.Where(l => l.AssignedTo == filter.AssignedTo);
        }

        var totalCount = await query.CountAsync();

        var items = await query
            .OrderByDescending(l => l.CreatedDate)
            .Skip((filter.PageNumber - 1) * filter.PageSize)
            .Take(filter.PageSize)
            .Select(l => new LeadDto
            {
                LeadId = l.LeadId,
                LeadCode = l.LeadCode,
                LeadName = l.LeadName,
                Email = l.Email,
                Phone = l.Phone,
                CompanyName = l.CompanyName,
                Source = l.Source,
                Status = l.Status,
                ExpectedValue = l.ExpectedValue,
                AssignedTo = l.AssignedTo,
                AssignedUserName = l.AssignedUser != null ? l.AssignedUser.FullName : "Unassigned",
                CreatedDate = l.CreatedDate,
                ConvertedCustomerId = l.ConvertedCustomerId
            })
            .ToListAsync();

        return PagedResult<LeadDto>.Create(items, totalCount, filter.PageNumber, filter.PageSize);
    }

    public async Task<LeadDto?> GetLeadByIdAsync(int id, string currentUserId, string currentUserRole)
    {
        var query = _context.Leads
            .Include(l => l.AssignedUser)
            .AsNoTracking()
            .Where(l => l.LeadId == id);

        if (currentUserRole == UserRoles.SalesExecutive)
        {
            query = query.Where(l => l.AssignedTo == currentUserId);
        }

        var lead = await query.FirstOrDefaultAsync();
        if (lead is null) return null;

        return new LeadDto
        {
            LeadId = lead.LeadId,
            LeadCode = lead.LeadCode,
            LeadName = lead.LeadName,
            Email = lead.Email,
            Phone = lead.Phone,
            CompanyName = lead.CompanyName,
            Source = lead.Source,
            Status = lead.Status,
            ExpectedValue = lead.ExpectedValue,
            AssignedTo = lead.AssignedTo,
            AssignedUserName = lead.AssignedUser?.FullName,
            CreatedDate = lead.CreatedDate,
            ConvertedCustomerId = lead.ConvertedCustomerId
        };
    }

    public async Task<(bool Success, string Message, LeadDto? Lead)> CreateLeadAsync(CreateLeadDto dto, string currentUserId, string currentUserRole)
    {
        // 1. Generate unique LeadCode (e.g. LEAD-2001)
        var lastId = await _context.Leads.MaxAsync(l => (int?)l.LeadId) ?? 2000;
        var leadCode = $"LEAD-{lastId + 1}";

        // 2. Resolve Assigned Rep
        var assignedTo = !string.IsNullOrWhiteSpace(dto.AssignedTo) && currentUserRole != UserRoles.SalesExecutive
            ? dto.AssignedTo
            : currentUserId;

        var lead = new Lead
        {
            LeadCode = leadCode,
            LeadName = dto.LeadName.Trim(),
            Email = dto.Email.Trim().ToLower(),
            Phone = dto.Phone.Trim(),
            CompanyName = dto.CompanyName?.Trim(),
            Source = dto.Source.Trim(),
            Status = LeadStatus.New,
            ExpectedValue = dto.ExpectedValue,
            AssignedTo = assignedTo,
            CreatedDate = DateTime.UtcNow
        };

        _context.Leads.Add(lead);
        await _context.SaveChangesAsync();

        var createdDto = await GetLeadByIdAsync(lead.LeadId, currentUserId, currentUserRole);
        return (true, "Lead captured successfully.", createdDto);
    }

    public async Task<(bool Success, string Message, LeadDto? Lead)> UpdateLeadAsync(int id, UpdateLeadDto dto, string currentUserId, string currentUserRole)
    {
        var lead = await _context.Leads.FirstOrDefaultAsync(l => l.LeadId == id);
        if (lead is null)
        {
            return (false, "Lead not found.", null);
        }

        if (currentUserRole == UserRoles.SalesExecutive && lead.AssignedTo != currentUserId)
        {
            return (false, "Access denied. You do not have permission to modify this lead.", null);
        }

        if (lead.Status == LeadStatus.Converted && dto.Status != LeadStatus.Converted)
        {
            return (false, "Cannot alter status of an already converted lead.", null);
        }

        lead.LeadName = dto.LeadName.Trim();
        lead.Email = dto.Email.Trim().ToLower();
        lead.Phone = dto.Phone.Trim();
        lead.CompanyName = dto.CompanyName?.Trim();
        lead.Source = dto.Source.Trim();
        lead.Status = dto.Status;
        lead.ExpectedValue = dto.ExpectedValue;

        if (!string.IsNullOrWhiteSpace(dto.AssignedTo) && currentUserRole != UserRoles.SalesExecutive)
        {
            lead.AssignedTo = dto.AssignedTo;
        }

        await _context.SaveChangesAsync();

        var updatedDto = await GetLeadByIdAsync(lead.LeadId, currentUserId, currentUserRole);
        return (true, "Lead updated successfully.", updatedDto);
    }

    public async Task<(bool Success, string Message)> DeleteLeadAsync(int id, string currentUserId, string currentUserRole)
    {
        var lead = await _context.Leads.FirstOrDefaultAsync(l => l.LeadId == id);
        if (lead is null)
        {
            return (false, "Lead not found.");
        }

        if (currentUserRole == UserRoles.SalesExecutive && lead.AssignedTo != currentUserId)
        {
            return (false, "Access denied. You do not have permission to delete this lead.");
        }

        lead.IsDeleted = true;
        await _context.SaveChangesAsync();

        return (true, "Lead marked as deleted.");
    }

    public async Task<(bool Success, string Message, int? CustomerId)> ConvertLeadAsync(LeadConversionDto dto, string currentUserId, string currentUserRole)
    {
        var lead = await _context.Leads.FirstOrDefaultAsync(l => l.LeadId == dto.LeadId);
        if (lead is null)
        {
            return (false, "Lead not found.", null);
        }

        if (currentUserRole == UserRoles.SalesExecutive && lead.AssignedTo != currentUserId)
        {
            return (false, "Access denied. You can only convert leads assigned to you.", null);
        }

        if (lead.Status == LeadStatus.Converted)
        {
            return (false, "This lead has already been converted.", lead.ConvertedCustomerId);
        }

        // Execute atomic conversion transaction
        using var transaction = await _context.Database.BeginTransactionAsync();
        try
        {
            // 1. Create Customer record from Lead
            var lastCustId = await _context.Customers.MaxAsync(c => (int?)c.CustomerId) ?? 1000;
            var customerCode = $"CUST-{lastCustId + 1}";

            var customer = new Customer
            {
                CustomerCode = customerCode,
                CustomerName = lead.LeadName,
                Email = lead.Email,
                Phone = lead.Phone,
                CompanyName = dto.CompanyName ?? lead.CompanyName,
                Address = dto.Address,
                City = dto.City,
                State = dto.State,
                Status = "Active",
                OwnerId = lead.AssignedTo ?? currentUserId,
                CreatedBy = currentUserId,
                CreatedDate = DateTime.UtcNow
            };

            _context.Customers.Add(customer);
            await _context.SaveChangesAsync();

            // 2. Optionally create Initial Opportunity
            if (dto.CreateOpportunity)
            {
                var oppName = !string.IsNullOrWhiteSpace(dto.OpportunityName)
                    ? dto.OpportunityName
                    : $"{lead.LeadName} - Deal";

                var closeDate = dto.ExpectedCloseDate ?? DateTime.UtcNow.AddDays(30);

                var opportunity = new Opportunity
                {
                    OpportunityName = oppName,
                    CustomerId = customer.CustomerId,
                    LeadId = lead.LeadId,
                    Amount = dto.OpportunityAmount > 0 ? dto.OpportunityAmount : (lead.ExpectedValue > 0 ? lead.ExpectedValue : 1000m),
                    Stage = OpportunityStage.Qualification,
                    Probability = 20,
                    ExpectedCloseDate = closeDate,
                    Status = "Open",
                    AssignedTo = lead.AssignedTo ?? currentUserId,
                    CreatedDate = DateTime.UtcNow
                };

                _context.Opportunities.Add(opportunity);
                await _context.SaveChangesAsync();
            }

            // 3. Mark Lead as Converted
            lead.Status = LeadStatus.Converted;
            lead.ConvertedCustomerId = customer.CustomerId;
            await _context.SaveChangesAsync();

            await transaction.CommitAsync();

            return (true, $"Lead successfully converted to Customer {customer.CustomerCode}.", customer.CustomerId);
        }
        catch (Exception ex)
        {
            await transaction.RollbackAsync();
            return (false, $"Conversion failed: {ex.Message}", null);
        }
    }
}
