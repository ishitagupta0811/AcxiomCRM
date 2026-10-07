using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using AcxiomCRM.Backend.Models.DTOs.Common;
using AcxiomCRM.Backend.Data;
using Microsoft.EntityFrameworkCore;

namespace AcxiomCRM.Backend.Controllers.Api;

[ApiController]
[Route("api/[controller]")]
[AllowAnonymous]
public class HealthApiController : BaseApiController
{
    private readonly AcxiomDbContext _db;

    public HealthApiController(AcxiomDbContext db)
    {
        _db = db;
    }

    [HttpGet]
    public async Task<ActionResult<ApiResponse<HealthStatusDto>>> GetHealth()
    {
        bool dbHealthy = false;
        try
        {
            dbHealthy = await _db.Database.CanConnectAsync();
        }
        catch
        {
            dbHealthy = false;
        }

        var status = new HealthStatusDto
        {
            Status = dbHealthy ? "Healthy" : "Degraded",
            Timestamp = DateTime.UtcNow,
            DatabaseConnected = dbHealthy,
            Version = "1.0.0-phase5",
            Environment = Environment.GetEnvironmentVariable("ASPNETCORE_ENVIRONMENT") ?? "Development"
        };

        return Ok(ApiResponse<HealthStatusDto>.SuccessResponse(status, "AcxiomCRM API service online."));
    }
}

public class HealthStatusDto
{
    public string Status { get; set; } = string.Empty;
    public DateTime Timestamp { get; set; }
    public bool DatabaseConnected { get; set; }
    public string Version { get; set; } = string.Empty;
    public string Environment { get; set; } = string.Empty;
}
