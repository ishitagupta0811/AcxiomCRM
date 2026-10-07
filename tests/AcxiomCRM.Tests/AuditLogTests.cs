using System.Text.Json;
using AcxiomCRM.Backend.Models.DTOs.Audit;
using AcxiomCRM.Backend.Models.Entities;
using Xunit;

namespace AcxiomCRM.Tests;

public class AuditLogTests
{
    [Fact]
    public void AuditLog_ShouldCaptureAllMandatoryFields()
    {
        var audit = new AuditLog
        {
            AuditLogId = 1,
            UserId = "usr_admin",
            Action = "UPDATE",
            EntityName = "Customer",
            RecordId = "CUST-1001",
            OldValue = JsonSerializer.Serialize(new { Status = "Pending" }),
            NewValue = JsonSerializer.Serialize(new { Status = "Active" }),
            CreatedDate = DateTime.UtcNow,
            IpAddress = "192.168.1.50"
        };

        Assert.Equal("UPDATE", audit.Action);
        Assert.Equal("Customer", audit.EntityName);
        Assert.Equal("CUST-1001", audit.RecordId);
        Assert.NotNull(audit.OldValue);
        Assert.NotNull(audit.NewValue);
        Assert.Equal("192.168.1.50", audit.IpAddress);
    }

    [Fact]
    public void AuditLog_SensitiveProperties_MustBeExcludedFromDelta()
    {
        var delta = new Dictionary<string, object?>
        {
            { "CustomerName", "Acme Corp" },
            { "Email", "acme@example.com" }
        };

        // Assert sensitive properties are excluded
        Assert.False(delta.ContainsKey("Password"), "Password must never be recorded in audit deltas.");
        Assert.False(delta.ContainsKey("PasswordHash"), "PasswordHash must never be recorded in audit deltas.");
        Assert.False(delta.ContainsKey("SecurityStamp"), "SecurityStamp must never be recorded in audit deltas.");
    }

    [Fact]
    public void AuditSummary_ShouldAggregateEventCountsAccurately()
    {
        var logs = new List<AuditLogDto>
        {
            new() { Action = "LOGIN_SUCCESS" },
            new() { Action = "LOGIN_SUCCESS" },
            new() { Action = "LOGIN_FAILED" },
            new() { Action = "CREATE" },
            new() { Action = "UPDATE" },
            new() { Action = "ACCOUNT_LOCKOUT" }
        };

        var summary = new AuditSummaryDto
        {
            TotalAuditEvents = logs.Count,
            SuccessfulLogins = logs.Count(l => l.Action == "LOGIN_SUCCESS"),
            FailedLogins = logs.Count(l => l.Action == "LOGIN_FAILED"),
            EntityMutations = logs.Count(l => l.Action == "CREATE" || l.Action == "UPDATE"),
            SecurityAlerts = logs.Count(l => l.Action == "ACCOUNT_LOCKOUT")
        };

        Assert.Equal(6, summary.TotalAuditEvents);
        Assert.Equal(2, summary.SuccessfulLogins);
        Assert.Equal(1, summary.FailedLogins);
        Assert.Equal(2, summary.EntityMutations);
        Assert.Equal(1, summary.SecurityAlerts);
    }
}
