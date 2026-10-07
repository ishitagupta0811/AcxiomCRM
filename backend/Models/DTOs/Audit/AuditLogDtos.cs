namespace AcxiomCRM.Backend.Models.DTOs.Audit;

public class AuditLogDto
{
    public int AuditLogId { get; set; }
    public string? UserId { get; set; }
    public string? UserName { get; set; }
    public string Action { get; set; } = string.Empty;
    public string EntityName { get; set; } = string.Empty;
    public string? RecordId { get; set; }
    public string? OldValue { get; set; }
    public string? NewValue { get; set; }
    public DateTime CreatedDate { get; set; }
    public string? IpAddress { get; set; }
}

public class AuditLogSearchFilterDto
{
    public string? Action { get; set; }
    public string? EntityName { get; set; }
    public string? UserId { get; set; }
    public string? SearchTerm { get; set; }
    public DateTime? FromDate { get; set; }
    public DateTime? ToDate { get; set; }
    public int PageNumber { get; set; } = 1;
    public int PageSize { get; set; } = 15;
}

public class AuditSummaryDto
{
    public int TotalAuditEvents { get; set; }
    public int SuccessfulLogins { get; set; }
    public int FailedLogins { get; set; }
    public int EntityMutations { get; set; }
    public int SecurityAlerts { get; set; }
}
