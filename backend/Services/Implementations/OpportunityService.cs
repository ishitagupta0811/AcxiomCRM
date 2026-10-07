using Microsoft.EntityFrameworkCore;
using AcxiomCRM.Backend.Data;
using AcxiomCRM.Backend.Models.DTOs.Common;
using AcxiomCRM.Backend.Models.DTOs.Opportunity;
using AcxiomCRM.Backend.Models.Entities;
using AcxiomCRM.Backend.Models.Enums;
using AcxiomCRM.Backend.Services.Interfaces;

namespace AcxiomCRM.Backend.Services.Implementations;

public class OpportunityService : IOpportunityService
{
    private readonly AcxiomDbContext _db;
    private readonly IAuditService _auditService;

    public OpportunityService(AcxiomDbContext db, IAuditService auditService)
    {
        _db = db;
        _auditService = auditService;
    }

    public async Task<PagedResult<OpportunityDto>> GetOpportunitiesAsync(OpportunitySearchFilterDto filter, string currentUserId, string currentUserRole)
    {
        var query = _db.Opportunities
            .Include(o => o.Customer)
            .Include(o => o.AssignedToUser)
            .Where(o => !o.IsDeleted);

        if (currentUserRole == "SalesExecutive")
        {
            query = query.Where(o => o.AssignedToUserId == currentUserId);
        }

        if (filter.CustomerId.HasValue)
        {
            query = query.Where(o => o.CustomerId == filter.CustomerId.Value);
        }

        if (filter.Stage.HasValue)
        {
            query = query.Where(o => o.Stage == filter.Stage.Value);
        }

        if (!string.IsNullOrWhiteSpace(filter.AssignedToUserId))
        {
            query = query.Where(o => o.AssignedToUserId == filter.AssignedToUserId);
        }

        if (!string.IsNullOrWhiteSpace(filter.SearchTerm))
        {
            var search = filter.SearchTerm.Trim().ToLower();
            query = query.Where(o => o.Title.ToLower().Contains(search) || 
                                     o.Customer.Name.ToLower().Contains(search) ||
                                     (o.Description != null && o.Description.ToLower().Contains(search)));
        }

        var totalCount = await query.CountAsync();

        var items = await query
            .OrderByDescending(o => o.CreatedAt)
            .Skip((filter.PageNumber - 1) * filter.PageSize)
            .Take(filter.PageSize)
            .Select(o => MapToDto(o))
            .ToListAsync();

        return new PagedResult<OpportunityDto>
        {
            Items = items,
            TotalCount = totalCount,
            PageNumber = filter.PageNumber,
            PageSize = filter.PageSize
        };
    }

    public async Task<OpportunityDto?> GetOpportunityByIdAsync(int id, string currentUserId, string currentUserRole)
    {
        var query = _db.Opportunities
            .Include(o => o.Customer)
            .Include(o => o.AssignedToUser)
            .Where(o => o.Id == id && !o.IsDeleted);

        if (currentUserRole == "SalesExecutive")
        {
            query = query.Where(o => o.AssignedToUserId == currentUserId);
        }

        var opp = await query.FirstOrDefaultAsync();
        return opp == null ? null : MapToDto(opp);
    }

    public async Task<(bool Success, string Message, OpportunityDto? Opportunity)> CreateOpportunityAsync(CreateOpportunityDto dto, string currentUserId, string currentUserRole)
    {
        if (dto.Amount <= 0)
        {
            return (false, "Opportunity Amount must be strictly greater than 0.", null);
        }

        if (dto.Probability < 0 || dto.Probability > 100)
        {
            return (false, "Probability must be an integer between 0 and 100.", null);
        }

        if (dto.ExpectedCloseDate.Date < DateTime.UtcNow.Date)
        {
            return (false, "Expected close date cannot be in the past.", null);
        }

        var customerExists = await _db.Customers.AnyAsync(c => c.Id == dto.CustomerId && !c.IsDeleted);
        if (!customerExists)
        {
            return (false, "Specified customer does not exist.", null);
        }

        var assignedUserId = !string.IsNullOrWhiteSpace(dto.AssignedToUserId) ? dto.AssignedToUserId : currentUserId;

        var opportunity = new Opportunity
        {
            CustomerId = dto.CustomerId,
            Title = dto.Title.Trim(),
            Amount = dto.Amount,
            Stage = dto.Stage,
            Probability = dto.Probability,
            ExpectedCloseDate = dto.ExpectedCloseDate,
            AssignedToUserId = assignedUserId,
            Description = dto.Description,
            CreatedAt = DateTime.UtcNow,
            CreatedBy = currentUserId
        };

        _db.Opportunities.Add(opportunity);
        await _db.SaveChangesAsync();

        await _auditService.LogActionAsync(
            "Opportunity",
            opportunity.Id.ToString(),
            "CREATE",
            null,
            MapToDto(opportunity),
            currentUserId,
            "Created new opportunity: " + opportunity.Title
        );

        var created = await GetOpportunityByIdAsync(opportunity.Id, currentUserId, currentUserRole);
        return (true, "Opportunity created successfully.", created);
    }

    public async Task<(bool Success, string Message, OpportunityDto? Opportunity)> UpdateOpportunityAsync(int id, UpdateOpportunityDto dto, string currentUserId, string currentUserRole)
    {
        var opp = await _db.Opportunities
            .Include(o => o.Customer)
            .Include(o => o.AssignedToUser)
            .FirstOrDefaultAsync(o => o.Id == id && !o.IsDeleted);

        if (opp == null)
        {
            return (false, "Opportunity not found.", null);
        }

        if (currentUserRole == "SalesExecutive" && opp.AssignedToUserId != currentUserId)
        {
            return (false, "You are unauthorized to update this opportunity.", null);
        }

        if (dto.Amount <= 0)
        {
            return (false, "Opportunity Amount must be strictly greater than 0.", null);
        }

        if (dto.Probability < 0 || dto.Probability > 100)
        {
            return (false, "Probability must be an integer between 0 and 100.", null);
        }

        var oldState = MapToDto(opp);

        opp.Title = dto.Title.Trim();
        opp.Amount = dto.Amount;
        opp.Stage = dto.Stage;
        opp.Probability = dto.Probability;
        opp.ExpectedCloseDate = dto.ExpectedCloseDate;
        opp.Description = dto.Description;
        if (!string.IsNullOrWhiteSpace(dto.AssignedToUserId))
        {
            opp.AssignedToUserId = dto.AssignedToUserId;
        }
        opp.UpdatedAt = DateTime.UtcNow;
        opp.UpdatedBy = currentUserId;

        await _db.SaveChangesAsync();

        await _auditService.LogActionAsync(
            "Opportunity",
            opp.Id.ToString(),
            "UPDATE",
            oldState,
            MapToDto(opp),
            currentUserId,
            "Updated opportunity: " + opp.Title
        );

        var updated = await GetOpportunityByIdAsync(opp.Id, currentUserId, currentUserRole);
        return (true, "Opportunity updated successfully.", updated);
    }

    public async Task<(bool Success, string Message)> UpdateStageAsync(int id, OpportunityStage newStage, string currentUserId, string currentUserRole)
    {
        var opp = await _db.Opportunities.FirstOrDefaultAsync(o => o.Id == id && !o.IsDeleted);
        if (opp == null)
        {
            return (false, "Opportunity not found.");
        }

        if (currentUserRole == "SalesExecutive" && opp.AssignedToUserId != currentUserId)
        {
            return (false, "You are unauthorized to move this opportunity.");
        }

        var oldStage = opp.Stage;
        opp.Stage = newStage;
        
        // Auto adjust probability according to standard CRM rules if desired
        if (newStage == OpportunityStage.Won) opp.Probability = 100;
        else if (newStage == OpportunityStage.Lost) opp.Probability = 0;

        opp.UpdatedAt = DateTime.UtcNow;
        opp.UpdatedBy = currentUserId;

        await _db.SaveChangesAsync();

        await _auditService.LogActionAsync(
            "Opportunity",
            opp.Id.ToString(),
            "UPDATE_STAGE",
            new { Stage = oldStage },
            new { Stage = newStage },
            currentUserId,
            $"Opportunity '{opp.Title}' stage changed from {oldStage} to {newStage}"
        );

        return (true, "Opportunity stage updated.");
    }

    public async Task<(bool Success, string Message)> DeleteOpportunityAsync(int id, string currentUserId, string currentUserRole)
    {
        var opp = await _db.Opportunities.FirstOrDefaultAsync(o => o.Id == id && !o.IsDeleted);
        if (opp == null)
        {
            return (false, "Opportunity not found.");
        }

        if (currentUserRole == "SalesExecutive")
        {
            return (false, "Sales Executives do not have permission to delete opportunities.");
        }

        opp.IsDeleted = true;
        opp.UpdatedAt = DateTime.UtcNow;
        opp.UpdatedBy = currentUserId;

        await _db.SaveChangesAsync();

        await _auditService.LogActionAsync(
            "Opportunity",
            opp.Id.ToString(),
            "DELETE",
            MapToDto(opp),
            null,
            currentUserId,
            "Deleted opportunity: " + opp.Title
        );

        return (true, "Opportunity deleted successfully.");
    }

    public async Task<PipelineSummaryDto> GetPipelineSummaryAsync(string currentUserId, string currentUserRole)
    {
        var query = _db.Opportunities
            .Include(o => o.Customer)
            .Where(o => !o.IsDeleted);

        if (currentUserRole == "SalesExecutive")
        {
            query = query.Where(o => o.AssignedToUserId == currentUserId);
        }

        var list = await query.ToListAsync();

        var totalPipeline = list.Sum(o => o.Amount);
        var weightedPipeline = list.Sum(o => (o.Amount * o.Probability) / 100m);
        var wonValue = list.Where(o => o.Stage == OpportunityStage.Won).Sum(o => o.Amount);
        var lostValue = list.Where(o => o.Stage == OpportunityStage.Lost).Sum(o => o.Amount);
        var activeCount = list.Count(o => o.Stage != OpportunityStage.Won && o.Stage != OpportunityStage.Lost);

        var stageStats = list
            .GroupBy(o => o.Stage)
            .Select(g => new StageBreakdownDto
            {
                Stage = g.Key.ToString(),
                Count = g.Count(),
                TotalAmount = g.Sum(o => o.Amount),
                WeightedAmount = g.Sum(o => (o.Amount * o.Probability) / 100m)
            })
            .ToList();

        return new PipelineSummaryDto
        {
            TotalPipelineValue = totalPipeline,
            WeightedPipelineValue = weightedPipeline,
            WonValue = wonValue,
            LostValue = lostValue,
            ActiveOpportunitiesCount = activeCount,
            StageBreakdowns = stageStats
        };
    }

    private static OpportunityDto MapToDto(Opportunity o)
    {
        return new OpportunityDto
        {
            Id = o.Id,
            CustomerId = o.CustomerId,
            CustomerName = o.Customer?.Name ?? string.Empty,
            CustomerEmail = o.Customer?.Email ?? string.Empty,
            CustomerCompany = o.Customer?.CompanyName,
            Title = o.Title,
            Amount = o.Amount,
            Stage = o.Stage,
            Probability = o.Probability,
            ExpectedCloseDate = o.ExpectedCloseDate,
            AssignedToUserId = o.AssignedToUserId,
            AssignedToUserName = o.AssignedToUser?.FullName ?? o.AssignedToUser?.UserName ?? "Unassigned",
            Description = o.Description,
            CreatedAt = o.CreatedAt
        };
    }
}
