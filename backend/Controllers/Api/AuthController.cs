using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using AcxiomCRM.Backend.Models.DTOs.Auth;
using AcxiomCRM.Backend.Models.DTOs.Common;
using AcxiomCRM.Backend.Models.Enums;
using AcxiomCRM.Backend.Services.Interfaces;

namespace AcxiomCRM.Backend.Controllers.Api;

public class AuthController : BaseApiController
{
    private readonly IAuthService _authService;
    private readonly IAuditService _auditService;

    public AuthController(IAuthService authService, IAuditService auditService)
    {
        _authService = authService;
        _auditService = auditService;
    }

    /// <summary>
    /// Authenticates a user and issues a security token/session.
    /// </summary>
    [HttpPost("login")]
    [AllowAnonymous]
    [ProducesResponseType(typeof(ApiResponse<AuthResponseDto>), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ApiResponse<AuthResponseDto>), StatusCodes.Status400BadRequest)]
    [ProducesResponseType(typeof(ApiResponse<AuthResponseDto>), StatusCodes.Status401Unauthorized)]
    public async Task<IActionResult> Login([FromBody] LoginRequestDto request)
    {
        if (!ModelState.IsValid)
        {
            var errors = ModelState.Values
                .SelectMany(v => v.Errors)
                .Select(e => e.ErrorMessage)
                .ToList();
            return BadRequest(ApiResponse<AuthResponseDto>.Fail("Validation failed.", errors));
        }

        var result = await _authService.LoginAsync(request, ClientIpAddress);

        if (!result.Success)
        {
            if (result.IsLockedOut)
            {
                return StatusCode(StatusCodes.Status423Locked, ApiResponse<AuthResponseDto>.Fail(result.Message));
            }
            return Unauthorized(ApiResponse<AuthResponseDto>.Fail(result.Message));
        }

        return Ok(ApiResponse<AuthResponseDto>.Ok(result, "Login successful."));
    }

    /// <summary>
    /// Registers a new user account with assigned role.
    /// </summary>
    [HttpPost("register")]
    [Authorize(Roles = UserRoles.Admin)] // In enterprise CRM, user provisioning is restricted to Admin
    [ProducesResponseType(typeof(ApiResponse<AuthResponseDto>), StatusCodes.Status201Created)]
    [ProducesResponseType(typeof(ApiResponse<AuthResponseDto>), StatusCodes.Status400BadRequest)]
    public async Task<IActionResult> Register([FromBody] RegisterRequestDto request)
    {
        if (!ModelState.IsValid)
        {
            var errors = ModelState.Values
                .SelectMany(v => v.Errors)
                .Select(e => e.ErrorMessage)
                .ToList();
            return BadRequest(ApiResponse<AuthResponseDto>.Fail("Validation failed.", errors));
        }

        var result = await _authService.RegisterAsync(request, ClientIpAddress);
        if (!result.Success)
        {
            return BadRequest(ApiResponse<AuthResponseDto>.Fail(result.Message));
        }

        return StatusCode(StatusCodes.Status201Created, ApiResponse<AuthResponseDto>.Ok(result, "User registered successfully."));
    }

    /// <summary>
    /// Public registration endpoint for initial demo onboarding if enabled.
    /// </summary>
    [HttpPost("register-public")]
    [AllowAnonymous]
    public async Task<IActionResult> RegisterPublic([FromBody] RegisterRequestDto request)
    {
        if (!ModelState.IsValid)
        {
            var errors = ModelState.Values
                .SelectMany(v => v.Errors)
                .Select(e => e.ErrorMessage)
                .ToList();
            return BadRequest(ApiResponse<AuthResponseDto>.Fail("Validation failed.", errors));
        }

        // Default public registrations to SalesExecutive role
        request.Role = UserRoles.SalesExecutive;

        var result = await _authService.RegisterAsync(request, ClientIpAddress);
        if (!result.Success)
        {
            return BadRequest(ApiResponse<AuthResponseDto>.Fail(result.Message));
        }

        return StatusCode(StatusCodes.Status201Created, ApiResponse<AuthResponseDto>.Ok(result, "Account created successfully."));
    }

    /// <summary>
    /// Logs out the authenticated user.
    /// </summary>
    [HttpPost("logout")]
    [Authorize]
    public async Task<IActionResult> Logout()
    {
        if (CurrentUserId is not null)
        {
            await _authService.LogoutAsync(CurrentUserId, ClientIpAddress);
        }

        return Ok(ApiResponse<bool>.Ok(true, "Successfully logged out."));
    }

    /// <summary>
    /// Retrieves current authenticated user profile and roles.
    /// </summary>
    [HttpGet("me")]
    [Authorize]
    [ProducesResponseType(typeof(ApiResponse<UserProfileDto>), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    public async Task<IActionResult> GetCurrentUser()
    {
        if (CurrentUserId is null)
        {
            return Unauthorized(ApiResponse<UserProfileDto>.Fail("User is not authenticated."));
        }

        var profile = await _authService.GetCurrentUserProfileAsync(CurrentUserId);
        if (profile is null)
        {
            return NotFound(ApiResponse<UserProfileDto>.Fail("User profile not found."));
        }

        return Ok(ApiResponse<UserProfileDto>.Ok(profile));
    }

    /// <summary>
    /// Retrieves recent security audit logs (Admin only).
    /// </summary>
    [HttpGet("audit-logs")]
    [Authorize(Roles = UserRoles.Admin)]
    public async Task<IActionResult> GetAuditLogs([FromQuery] int count = 50)
    {
        var logs = await _auditService.GetRecentLogsAsync(count);
        return Ok(ApiResponse<object>.Ok(logs, "Audit logs retrieved successfully."));
    }
}
