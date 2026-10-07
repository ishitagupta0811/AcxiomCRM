using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;
using AcxiomCRM.Backend.Data;
using AcxiomCRM.Backend.Models.DTOs.Audit;
using AcxiomCRM.Backend.Models.DTOs.Common;
using AcxiomCRM.Backend.Models.Entities;
using AcxiomCRM.Backend.Services.Interfaces;

namespace AcxiomCRM.Backend.Services.Implementations;

public class AuditService : IAuditService
{
    private readonly AcxiomDbContext _context;
    private readonly ILogger<AuditService> _logger;

    public AuditService(AcxiomDbContext context, ILogger<AuditService> logger)
    {
        _context = context;
        _logger = logger;
    }

    public async Task LogEventAsync(string? userId, string action, string entityName, string? recordId, string? details, string ipAddress)
    {
        try
        {
            var audit = new AuditLog
            {
                UserId = userId,
                Action = action,
                EntityName = entityName,
                RecordId = recordId,
                NewValue = details,
                CreatedDate = DateTime.UtcNow,
                IpAddress = ipAddress
            };

            _context.AuditLogs.Add(audit);
            await _context.SaveChangesAsync();
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Failed to write audit log entry for action {Action} on {EntityName}", action, entityName);
        }
    }

    public async Task<List<AuditLog>> GetRecentLogsAsync(int count = 50)
    {
        return await _context.AuditLogs
            .Include(a => a.User)
            .OrderByDescending(a => a.CreatedDate)
            .Take(count)
            .AsNoTracking()
            .ToListAsync();
    }

    public async Task<PagedResult<AuditLogDto>> GetPagedLogsAsync(AuditLogSearchFilterDto filter)
    {
        var query = _context.AuditLogs
            .Include(a => a.User)
            .AsNoTracking();

        if (!string.IsNullOrWhiteSpace(filter.Action) && filter.Action != "All")
        {
            query = query.Where(a => a.Action.ToUpper() == filter.Action.ToUpper());
        }

        if (!string.IsNullOrWhiteSpace(filter.EntityName) && filter.EntityName != "All")
        {
            query = query.Where(a => a.EntityName.ToLower() == filter.EntityName.ToLower());
        }

        if (!string.IsNullOrWhiteSpace(filter.UserId))
        {
            query = query.Where(a => a.UserId == filter.UserId);
        }

        if (!string.IsNullOrWhiteSpace(filter.SearchTerm))
        {
            var term = filter.SearchTerm.Trim().ToLower();
            query = query.Where(a =>
                a.Action.ToLower().Contains(term) ||
                a.EntityName.ToLower().Contains(term) ||
                (a.RecordId != null && a.RecordId.Contains(term)) ||
                (a.NewValue != null && a.NewValue.ToLower().Contains(term)) ||
                (a.OldValue != null && a.OldValue.ToLower().Contains(term)) ||
                (a.User != null && a.User.UserName != null && a.User.UserName.ToLower().Contains(term)));
        }

        if (filter.FromDate.HasValue)
        {
            query = query.Where(a => a.CreatedDate >= filter.FromDate.Value);
        }

        if (filter.ToDate.HasValue)
        {
            query = query.Where(a => a.CreatedDate <= filter.ToDate.Value);
        }

        var totalCount = await query.CountAsync();

        var items = await query
            .OrderByDescending(a => a.CreatedDate)
            .Skip((filter.PageNumber - 1) * filter.PageSize)
            .Take(filter.PageSize)
            .Select(a => new AuditLogDto
            {
                AuditLogId = a.AuditLogId,
                UserId = a.UserId,
                UserName = a.User != null ? a.User.UserName : "System / Anonymous",
                Action = a.Action,
                EntityName = a.EntityName,
                RecordId = a.RecordId,
                OldValue = a.OldValue,
                NewValue = a.NewValue,
                CreatedDate = a.CreatedDate,
                IpAddress = a.IpAddress
            })
            .ToListAsync();

        return PagedResult<AuditLogDto>.Create(items, totalCount, filter.PageNumber, filter.PageSize);
    }

    public async Task<AuditSummaryDto> GetAuditSummaryAsync()
    {
        var total = await _context.AuditLogs.CountAsync();
        var successLogins = await _context.AuditLogs.CountAsync(a => a.Action == "LOGIN_SUCCESS");
        var failedLogins = await _context.AuditLogs.CountAsync(a => a.Action == "LOGIN_FAILED" || a.Action == "LOGIN_REJECTED");
        var mutations = await _context.AuditLogs.CountAsync(a => a.Action == "ADDED" || a.Action == "MODIFIED" || a.Action == "DELETED" || a.Action == "CREATE" || a.Action == "UPDATE");
        var alerts = await _context.AuditLogs.CountAsync(a => a.Action == "ACCOUNT_LOCKOUT" || a.Action == "LOCKOUT_BLOCKED");

        return new AuditSummaryDto
        {
            TotalAuditEvents = total,
            SuccessfulLogins = successLogins,
            FailedLogins = failedLogins,
            EntityMutations = mutations,
            SecurityAlerts = alerts
        };
    }

    public async Task<AuditLogDto?> GetLogByIdAsync(int id)
    {
        var log = await _context.AuditLogs
            .Include(a => a.User)
            .AsNoTracking()
            .FirstOrDefaultAsync(a => a.AuditLogId == id);

        if (log is null) return null;

        return new AuditLogDto
        {
            AuditLogId = log.AuditLogId,
            UserId = log.UserId,
            UserName = log.User != null ? log.User.UserName : "System",
            Action = log.Action,
            EntityName = log.EntityName,
            RecordId = log.RecordId,
            OldValue = log.OldValue,
            NewValue = log.NewValue,
            CreatedDate = log.CreatedDate,
            IpAddress = log.IpAddress
        };
    }
}
