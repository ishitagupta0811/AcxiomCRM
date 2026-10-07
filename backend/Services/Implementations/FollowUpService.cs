using Microsoft.EntityFrameworkCore;
using AcxiomCRM.Backend.Data;
using AcxiomCRM.Backend.Models.DTOs.Common;
using AcxiomCRM.Backend.Models.DTOs.FollowUp;
using AcxiomCRM.Backend.Models.Entities;
using AcxiomCRM.Backend.Models.Enums;
using AcxiomCRM.Backend.Services.Interfaces;

namespace AcxiomCRM.Backend.Services.Implementations;

public class FollowUpService : IFollowUpService
{
    private readonly AcxiomDbContext _db;
    private readonly IAuditService _auditService;

    public FollowUpService(AcxiomDbContext db, IAuditService auditService)
    {
        _db = db;
        _auditService = auditService;
    }

    public async Task<PagedResult<FollowUpDto>> GetFollowUpsAsync(FollowUpSearchFilterDto filter, string currentUserId, string currentUserRole)
    {
        var query = _db.FollowUps
            .Include(f => f.Customer)
            .Include(f => f.Lead)
            .Include(f => f.Opportunity)
            .Include(f => f.AssignedToUser)
            .Where(f => !f.IsDeleted);

        if (currentUserRole == "SalesExecutive")
        {
            query = query.Where(f => f.AssignedToUserId == currentUserId);
        }

        if (filter.CustomerId.HasValue) query = query.Where(f => f.CustomerId == filter.CustomerId.Value);
        if (filter.LeadId.HasValue) query = query.Where(f => f.LeadId == filter.LeadId.Value);
        if (filter.OpportunityId.HasValue) query = query.Where(f => f.OpportunityId == filter.OpportunityId.Value);
        if (filter.Status.HasValue) query = query.Where(f => f.Status == filter.Status.Value);
        if (filter.Type.HasValue) query = query.Where(f => f.Type == filter.Type.Value);
        if (!string.IsNullOrWhiteSpace(filter.AssignedToUserId)) query = query.Where(f => f.AssignedToUserId == filter.AssignedToUserId);

        if (filter.OverdueOnly == true)
        {
            var now = DateTime.UtcNow;
            query = query.Where(f => f.Status == FollowUpStatus.Planned && f.FollowUpDate < now);
        }

        if (filter.UpcomingOnly == true)
        {
            var now = DateTime.UtcNow;
            var horizon = now.AddDays(7);
            query = query.Where(f => f.Status == FollowUpStatus.Planned && f.FollowUpDate >= now && f.FollowUpDate <= horizon);
        }

        var totalCount = await query.CountAsync();

        var items = await query
            .OrderBy(f => f.FollowUpDate)
            .Skip((filter.PageNumber - 1) * filter.PageSize)
            .Take(filter.PageSize)
            .Select(f => MapToDto(f))
            .ToListAsync();

        return new PagedResult<FollowUpDto>
        {
            Items = items,
            TotalCount = totalCount,
            PageNumber = filter.PageNumber,
            PageSize = filter.PageSize
        };
    }

    public async Task<FollowUpDto?> GetFollowUpByIdAsync(int id, string currentUserId, string currentUserRole)
    {
        var query = _db.FollowUps
            .Include(f => f.Customer)
            .Include(f => f.Lead)
            .Include(f => f.Opportunity)
            .Include(f => f.AssignedToUser)
            .Where(f => f.Id == id && !f.IsDeleted);

        if (currentUserRole == "SalesExecutive")
        {
            query = query.Where(f => f.AssignedToUserId == currentUserId);
        }

        var item = await query.FirstOrDefaultAsync();
        return item == null ? null : MapToDto(item);
    }

    public async Task<(bool Success, string Message, FollowUpDto? FollowUp)> CreateFollowUpAsync(CreateFollowUpDto dto, string currentUserId, string currentUserRole)
    {
        if (dto.FollowUpDate < DateTime.UtcNow.AddMinutes(-5))
        {
            return (false, "Follow-up date and time cannot be in the past.", null);
        }

        if (!dto.CustomerId.HasValue && !dto.LeadId.HasValue && !dto.OpportunityId.HasValue)
        {
            return (false, "A follow-up must be associated with a Customer, Lead, or Opportunity.", null);
        }

        var assignedId = !string.IsNullOrWhiteSpace(dto.AssignedToUserId) ? dto.AssignedToUserId : currentUserId;

        var followUp = new FollowUp
        {
            CustomerId = dto.CustomerId,
            LeadId = dto.LeadId,
            OpportunityId = dto.OpportunityId,
            FollowUpDate = dto.FollowUpDate,
            Type = dto.Type,
            Status = dto.Status,
            AssignedToUserId = assignedId,
            Notes = dto.Notes,
            CreatedAt = DateTime.UtcNow,
            CreatedBy = currentUserId
        };

        _db.FollowUps.Add(followUp);
        await _db.SaveChangesAsync();

        await _auditService.LogActionAsync(
            "FollowUp",
            followUp.Id.ToString(),
            "CREATE",
            null,
            MapToDto(followUp),
            currentUserId,
            $"Scheduled {followUp.Type} follow-up on {followUp.FollowUpDate:yyyy-MM-dd HH:mm}"
        );

        var created = await GetFollowUpByIdAsync(followUp.Id, currentUserId, currentUserRole);
        return (true, "Follow-up scheduled successfully.", created);
    }

    public async Task<(bool Success, string Message, FollowUpDto? FollowUp)> UpdateFollowUpAsync(int id, UpdateFollowUpDto dto, string currentUserId, string currentUserRole)
    {
        var followUp = await _db.FollowUps
            .Include(f => f.Customer)
            .Include(f => f.Lead)
            .Include(f => f.Opportunity)
            .Include(f => f.AssignedToUser)
            .FirstOrDefaultAsync(f => f.Id == id && !f.IsDeleted);

        if (followUp == null)
        {
            return (false, "Follow-up not found.", null);
        }

        if (currentUserRole == "SalesExecutive" && followUp.AssignedToUserId != currentUserId)
        {
            return (false, "Unauthorized to edit this follow-up.", null);
        }

        var oldState = MapToDto(followUp);

        followUp.FollowUpDate = dto.FollowUpDate;
        followUp.Type = dto.Type;
        followUp.Status = dto.Status;
        followUp.Notes = dto.Notes;
        followUp.CompletionRemarks = dto.CompletionRemarks;
        if (!string.IsNullOrWhiteSpace(dto.AssignedToUserId))
        {
            followUp.AssignedToUserId = dto.AssignedToUserId;
        }
        followUp.UpdatedAt = DateTime.UtcNow;
        followUp.UpdatedBy = currentUserId;

        await _db.SaveChangesAsync();

        await _auditService.LogActionAsync(
            "FollowUp",
            followUp.Id.ToString(),
            "UPDATE",
            oldState,
            MapToDto(followUp),
            currentUserId,
            "Updated follow-up record #" + followUp.Id
        );

        var updated = await GetFollowUpByIdAsync(followUp.Id, currentUserId, currentUserRole);
        return (true, "Follow-up updated successfully.", updated);
    }

    public async Task<(bool Success, string Message)> CompleteFollowUpAsync(int id, string? remarks, string currentUserId, string currentUserRole)
    {
        var followUp = await _db.FollowUps.FirstOrDefaultAsync(f => f.Id == id && !f.IsDeleted);
        if (followUp == null)
        {
            return (false, "Follow-up not found.");
        }

        if (currentUserRole == "SalesExecutive" && followUp.AssignedToUserId != currentUserId)
        {
            return (false, "Unauthorized to modify this follow-up.");
        }

        followUp.Status = FollowUpStatus.Completed;
        followUp.CompletionRemarks = remarks;
        followUp.UpdatedAt = DateTime.UtcNow;
        followUp.UpdatedBy = currentUserId;

        await _db.SaveChangesAsync();

        await _auditService.LogActionAsync(
            "FollowUp",
            followUp.Id.ToString(),
            "COMPLETE",
            new { Status = FollowUpStatus.Planned },
            new { Status = FollowUpStatus.Completed, CompletionRemarks = remarks },
            currentUserId,
            "Marked follow-up #" + followUp.Id + " as completed"
        );

        return (true, "Follow-up marked as completed.");
    }

    public async Task<(bool Success, string Message)> DeleteFollowUpAsync(int id, string currentUserId, string currentUserRole)
    {
        var followUp = await _db.FollowUps.FirstOrDefaultAsync(f => f.Id == id && !f.IsDeleted);
        if (followUp == null)
        {
            return (false, "Follow-up not found.");
        }

        if (currentUserRole == "SalesExecutive")
        {
            return (false, "Sales Executives do not have permission to delete follow-ups.");
        }

        followUp.IsDeleted = true;
        followUp.UpdatedAt = DateTime.UtcNow;
        followUp.UpdatedBy = currentUserId;

        await _db.SaveChangesAsync();

        await _auditService.LogActionAsync(
            "FollowUp",
            followUp.Id.ToString(),
            "DELETE",
            MapToDto(followUp),
            null,
            currentUserId,
            "Deleted follow-up #" + followUp.Id
        );

        return (true, "Follow-up deleted successfully.");
    }

    private static FollowUpDto MapToDto(FollowUp f)
    {
        var isOverdue = f.Status == FollowUpStatus.Planned && f.FollowUpDate < DateTime.UtcNow;

        return new FollowUpDto
        {
            Id = f.Id,
            CustomerId = f.CustomerId,
            CustomerName = f.Customer?.Name,
            LeadId = f.LeadId,
            LeadName = f.Lead != null ? $"{f.Lead.FirstName} {f.Lead.LastName}".Trim() : null,
            OpportunityId = f.OpportunityId,
            OpportunityTitle = f.Opportunity?.Title,
            FollowUpDate = f.FollowUpDate,
            Type = f.Type,
            Status = f.Status,
            AssignedToUserId = f.AssignedToUserId,
            AssignedToUserName = f.AssignedToUser?.FullName ?? f.AssignedToUser?.UserName ?? "Unassigned",
            Notes = f.Notes,
            CompletionRemarks = f.CompletionRemarks,
            IsOverdue = isOverdue,
            CreatedAt = f.CreatedAt
        };
    }
}
