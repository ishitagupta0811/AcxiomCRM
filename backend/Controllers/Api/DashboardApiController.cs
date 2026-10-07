using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using AcxiomCRM.Backend.Models.DTOs.Common;
using AcxiomCRM.Backend.Models.DTOs.Dashboard;
using AcxiomCRM.Backend.Services.Interfaces;

namespace AcxiomCRM.Backend.Controllers.Api;

[ApiController]
[Route("api/dashboard")]
[Authorize]
public class DashboardApiController : BaseApiController
{
    private readonly IDashboardService _dashboardService;

    public DashboardApiController(IDashboardService dashboardService)
    {
        _dashboardService = dashboardService;
    }

    [HttpGet("metrics")]
    public async Task<ActionResult<ApiResponse<DashboardMetricsDto>>> GetMetrics()
    {
        var metrics = await _dashboardService.GetDashboardMetricsAsync(CurrentUserId, CurrentUserRole);
        return Ok(ApiResponse<DashboardMetricsDto>.SuccessResponse(metrics));
    }

    [HttpGet("charts")]
    public async Task<ActionResult<ApiResponse<DashboardChartsDto>>> GetCharts()
    {
        var charts = await _dashboardService.GetDashboardChartsAsync(CurrentUserId, CurrentUserRole);
        return Ok(ApiResponse<DashboardChartsDto>.SuccessResponse(charts));
    }
}
