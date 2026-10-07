using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using AcxiomCRM.Backend.Models.DTOs.Auth;
using AcxiomCRM.Backend.Models.DTOs.Common;
using AcxiomCRM.Backend.Models.Entities;
using AcxiomCRM.Backend.Models.Enums;
using AcxiomCRM.Backend.Services.Interfaces;

namespace AcxiomCRM.Backend.Controllers.Api;

[Authorize(Roles = $"{UserRoles.Admin},{UserRoles.Manager}")]
public class UsersController : BaseApiController
{
    private readonly UserManager<ApplicationUser> _userManager;
    private readonly RoleManager<ApplicationRole> _roleManager;
    private readonly IAuditService _auditService;

    public UsersController(
        UserManager<ApplicationUser> userManager,
        RoleManager<ApplicationRole> roleManager,
        IAuditService auditService)
    {
        _userManager = userManager;
        _roleManager = roleManager;
        _auditService = auditService;
    }

    /// <summary>
    /// Gets all CRM users with roles and status.
    /// </summary>
    [HttpGet]
    public async Task<IActionResult> GetAllUsers()
    {
        var users = await _userManager.Users.ToListAsync();
        var dtos = new List<UserProfileDto>();

        foreach (var u in users)
        {
            var roles = await _userManager.GetRolesAsync(u);
            dtos.Add(new UserProfileDto
            {
                Id = u.Id,
                Username = u.UserName ?? string.Empty,
                Email = u.Email ?? string.Empty,
                FullName = u.FullName,
                Department = u.Department,
                Roles = roles,
                IsActive = u.IsActive,
                LastLoginDate = u.LastLoginDate
            });
        }

        return Ok(ApiResponse<List<UserProfileDto>>.Ok(dtos));
    }

    /// <summary>
    /// Toggles active status of a user (Admin only).
    /// </summary>
    [HttpPatch("{id}/toggle-status")]
    [Authorize(Roles = UserRoles.Admin)]
    public async Task<IActionResult> ToggleStatus(string id)
    {
        var user = await _userManager.FindByIdAsync(id);
        if (user is null) return NotFound(ApiResponse<bool>.Fail("User not found."));

        if (user.Id == CurrentUserId)
        {
            return BadRequest(ApiResponse<bool>.Fail("You cannot deactivate your own administrative account."));
        }

        user.IsActive = !user.IsActive;
        await _userManager.UpdateAsync(user);

        var action = user.IsActive ? "USER_ACTIVATED" : "USER_DEACTIVATED";
        await _auditService.LogEventAsync(CurrentUserId, action, "User", user.Id, $"User {user.UserName} status set to {user.IsActive}", ClientIpAddress);

        return Ok(ApiResponse<bool>.Ok(user.IsActive, $"User status changed to {(user.IsActive ? "Active" : "Inactive")}."));
    }

    /// <summary>
    /// Unlocks a locked-out user account (Admin only).
    /// </summary>
    [HttpPost("{id}/unlock")]
    [Authorize(Roles = UserRoles.Admin)]
    public async Task<IActionResult> UnlockUser(string id)
    {
        var user = await _userManager.FindByIdAsync(id);
        if (user is null) return NotFound(ApiResponse<bool>.Fail("User not found."));

        await _userManager.SetLockoutEndDateAsync(user, null);
        await _userManager.ResetAccessFailedCountAsync(user);

        await _auditService.LogEventAsync(CurrentUserId, "USER_UNLOCKED", "User", user.Id, $"Account unlocked by administrator", ClientIpAddress);

        return Ok(ApiResponse<bool>.Ok(true, "User account successfully unlocked."));
    }
}
