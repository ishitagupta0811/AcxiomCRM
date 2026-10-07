using System.Security.Claims;
using Microsoft.AspNetCore.Mvc;

namespace AcxiomCRM.Backend.Controllers;

[ApiController]
[Route("api/[controller]")]
public abstract class BaseApiController : ControllerBase
{
    protected string? CurrentUserId => User.FindFirstValue(ClaimTypes.NameIdentifier);
    protected string? CurrentUserRole => User.FindFirstValue(ClaimTypes.Role);
    protected string? CurrentUsername => User.FindFirstValue(ClaimTypes.Name);

    protected string ClientIpAddress =>
        HttpContext.Connection.RemoteIpAddress?.ToString() ?? "127.0.0.1";
}
