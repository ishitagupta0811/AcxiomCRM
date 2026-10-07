using AcxiomCRM.Backend.Models.DTOs.Auth;
using AcxiomCRM.Backend.Models.Entities;

namespace AcxiomCRM.Backend.Services.Interfaces;

public interface IAuthService
{
    Task<AuthResponseDto> LoginAsync(LoginRequestDto request, string ipAddress);
    Task<AuthResponseDto> RegisterAsync(RegisterRequestDto request, string ipAddress);
    Task<UserProfileDto?> GetCurrentUserProfileAsync(string userId);
    Task LogoutAsync(string userId, string ipAddress);
}

public interface IAuditService
{
    Task LogEventAsync(string? userId, string action, string entityName, string? recordId, string? details, string ipAddress);
    Task<List<AuditLog>> GetRecentLogsAsync(int count = 50);
    Task<Models.DTOs.Common.PagedResult<Models.DTOs.Audit.AuditLogDto>> GetPagedLogsAsync(Models.DTOs.Audit.AuditLogSearchFilterDto filter);
    Task<Models.DTOs.Audit.AuditSummaryDto> GetAuditSummaryAsync();
    Task<Models.DTOs.Audit.AuditLogDto?> GetLogByIdAsync(int id);
}
