using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using AcxiomCRM.Backend.Models.DTOs.Audit;
using AcxiomCRM.Backend.Models.DTOs.Common;
using AcxiomCRM.Backend.Models.Enums;
using AcxiomCRM.Backend.Services.Interfaces;

namespace AcxiomCRM.Backend.Controllers.Api;

[Authorize(Roles = $"{UserRoles.Admin},{UserRoles.Manager}")]
public class AuditLogsApiController : BaseApiController
{
    private readonly IAuditService _auditService;

    public AuditLogsApiController(IAuditService auditService)
    {
        _auditService = auditService;
    }

    /// <summary>
    /// Retrieves paginated security and entity mutation audit trails.
    /// Restricted to Admin and Manager roles.
    /// </summary>
    [HttpGet]
    [ProducesResponseType(typeof(ApiResponse<PagedResult<AuditLogDto>>), StatusCodes.Status200OK)]
    public async Task<IActionResult> GetAuditLogs([FromQuery] AuditLogSearchFilterDto filter)
    {
        var result = await _auditService.GetPagedLogsAsync(filter);
        return Ok(ApiResponse<PagedResult<AuditLogDto>>.Ok(result));
    }

    /// <summary>
    /// Retrieves statistical summary of security events and mutations.
    /// </summary>
    [HttpGet("summary")]
    [ProducesResponseType(typeof(ApiResponse<AuditSummaryDto>), StatusCodes.Status200OK)]
    public async Task<IActionResult> GetAuditSummary()
    {
        var summary = await _auditService.GetAuditSummaryAsync();
        return Ok(ApiResponse<AuditSummaryDto>.Ok(summary));
    }

    /// <summary>
    /// Retrieves specific audit log detail with JSON delta values.
    /// </summary>
    [HttpGet("{id:int}")]
    [ProducesResponseType(typeof(ApiResponse<AuditLogDto>), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> GetAuditLogById(int id)
    {
        var log = await _auditService.GetLogByIdAsync(id);
        if (log is null)
        {
            return NotFound(ApiResponse<AuditLogDto>.Fail("Audit log entry not found."));
        }
        return Ok(ApiResponse<AuditLogDto>.Ok(log));
    }
}
