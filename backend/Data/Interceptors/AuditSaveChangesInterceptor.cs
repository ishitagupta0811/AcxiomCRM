using System.Text.Json;
using Microsoft.AspNetCore.Http;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.ChangeTracking;
using Microsoft.EntityFrameworkCore.Diagnostics;
using System.Security.Claims;
using AcxiomCRM.Backend.Models.Entities;

namespace AcxiomCRM.Backend.Data.Interceptors;

public class AuditSaveChangesInterceptor : SaveChangesInterceptor
{
    private readonly IHttpContextAccessor _httpContextAccessor;

    public AuditSaveChangesInterceptor(IHttpContextAccessor httpContextAccessor)
    {
        _httpContextAccessor = httpContextAccessor;
    }

    public override ValueTask<InterceptionResult<int>> SavingChangesAsync(
        DbContextEventData eventData,
        InterceptionResult<int> result,
        CancellationToken cancellationToken = default)
    {
        if (eventData.Context is null)
            return base.SavingChangesAsync(eventData, result, cancellationToken);

        var context = eventData.Context;
        var httpContext = _httpContextAccessor.HttpContext;
        var userId = httpContext?.User.FindFirstValue(ClaimTypes.NameIdentifier);
        var ipAddress = httpContext?.Connection.RemoteIpAddress?.ToString() ?? "127.0.0.1";

        var entries = context.ChangeTracker.Entries()
            .Where(e => e.Entity is not AuditLog &&
                       (e.State == EntityState.Added || e.State == EntityState.Modified || e.State == EntityState.Deleted))
            .ToList();

        var auditLogs = new List<AuditLog>();

        foreach (var entry in entries)
        {
            var entityName = entry.Entity.GetType().Name;
            var action = entry.State.ToString().ToUpperInvariant();

            var oldValues = new Dictionary<string, object?>();
            var newValues = new Dictionary<string, object?>();
            string recordId = "0";

            foreach (var prop in entry.Properties)
            {
                if (prop.Metadata.IsPrimaryKey())
                {
                    recordId = (entry.State == EntityState.Added ? prop.CurrentValue : prop.OriginalValue)?.ToString() ?? "0";
                    continue;
                }

                // Avoid logging sensitive password / token fields
                if (prop.Metadata.Name.Contains("Password", StringComparison.OrdinalIgnoreCase) ||
                    prop.Metadata.Name.Contains("SecurityStamp", StringComparison.OrdinalIgnoreCase) ||
                    prop.Metadata.Name.Contains("ConcurrencyStamp", StringComparison.OrdinalIgnoreCase))
                {
                    continue;
                }

                switch (entry.State)
                {
                    case EntityState.Added:
                        newValues[prop.Metadata.Name] = prop.CurrentValue;
                        break;
                    case EntityState.Deleted:
                        oldValues[prop.Metadata.Name] = prop.OriginalValue;
                        break;
                    case EntityState.Modified:
                        if (prop.IsModified)
                        {
                            oldValues[prop.Metadata.Name] = prop.OriginalValue;
                            newValues[prop.Metadata.Name] = prop.CurrentValue;
                        }
                        break;
                }
            }

            auditLogs.Add(new AuditLog
            {
                UserId = userId,
                Action = action,
                EntityName = entityName,
                RecordId = recordId,
                OldValue = oldValues.Count > 0 ? JsonSerializer.Serialize(oldValues) : null,
                NewValue = newValues.Count > 0 ? JsonSerializer.Serialize(newValues) : null,
                CreatedDate = DateTime.UtcNow,
                IpAddress = ipAddress
            });
        }

        if (auditLogs.Count > 0)
        {
            context.Set<AuditLog>().AddRange(auditLogs);
        }

        return base.SavingChangesAsync(eventData, result, cancellationToken);
    }
}
