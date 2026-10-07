using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Text;
using Microsoft.AspNetCore.Identity;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Logging;
using Microsoft.IdentityModel.Tokens;
using AcxiomCRM.Backend.Models.DTOs.Auth;
using AcxiomCRM.Backend.Models.Entities;
using AcxiomCRM.Backend.Models.Enums;
using AcxiomCRM.Backend.Services.Interfaces;

namespace AcxiomCRM.Backend.Services.Implementations;

public class AuthService : IAuthService
{
    private readonly UserManager<ApplicationUser> _userManager;
    private readonly SignInManager<ApplicationUser> _signInManager;
    private readonly RoleManager<ApplicationRole> _roleManager;
    private readonly IConfiguration _configuration;
    private readonly IAuditService _auditService;
    private readonly ILogger<AuthService> _logger;

    public AuthService(
        UserManager<ApplicationUser> userManager,
        SignInManager<ApplicationUser> signInManager,
        RoleManager<ApplicationRole> roleManager,
        IConfiguration configuration,
        IAuditService auditService,
        ILogger<AuthService> logger)
    {
        _userManager = userManager;
        _signInManager = signInManager;
        _roleManager = roleManager;
        _configuration = configuration;
        _auditService = auditService;
        _logger = logger;
    }

    public async Task<AuthResponseDto> LoginAsync(LoginRequestDto request, string ipAddress)
    {
        // 1. Find user by username or email
        var user = await _userManager.FindByNameAsync(request.UsernameOrEmail)
                   ?? await _userManager.FindByEmailAsync(request.UsernameOrEmail);

        if (user is null)
        {
            await _auditService.LogEventAsync(null, "LOGIN_FAILED", "User", null, $"Unknown user: {request.UsernameOrEmail}", ipAddress);
            return new AuthResponseDto
            {
                Success = false,
                Message = "Invalid credentials. Please verify your username/email and password."
            };
        }

        // 2. Check if account is active
        if (!user.IsActive)
        {
            await _auditService.LogEventAsync(user.Id, "LOGIN_REJECTED", "User", user.Id, "Inactive account login attempt", ipAddress);
            return new AuthResponseDto
            {
                Success = false,
                Message = "Your account has been deactivated. Please contact your system administrator."
            };
        }

        // 3. Check lockout state
        if (await _userManager.IsLockedOutAsync(user))
        {
            var lockoutEnd = await _userManager.GetLockoutEndDateAsync(user);
            await _auditService.LogEventAsync(user.Id, "LOCKOUT_BLOCKED", "User", user.Id, $"Login blocked due to lockout until {lockoutEnd}", ipAddress);
            return new AuthResponseDto
            {
                Success = false,
                IsLockedOut = true,
                LockoutEnd = lockoutEnd,
                Message = $"Account is temporarily locked due to multiple failed login attempts. Try again after {lockoutEnd:HH:mm:ss} UTC."
            };
        }

        // 4. Validate credentials
        var passwordCheck = await _userManager.CheckPasswordAsync(user, request.Password);
        if (!passwordCheck)
        {
            await _userManager.AccessFailedAsync(user);
            var isNowLocked = await _userManager.IsLockedOutAsync(user);

            if (isNowLocked)
            {
                var lockoutEnd = await _userManager.GetLockoutEndDateAsync(user);
                await _auditService.LogEventAsync(user.Id, "ACCOUNT_LOCKOUT", "User", user.Id, "Account locked out after 5 failed attempts", ipAddress);
                return new AuthResponseDto
                {
                    Success = false,
                    IsLockedOut = true,
                    LockoutEnd = lockoutEnd,
                    Message = "Account locked out for 15 minutes due to repeated failed login attempts."
                };
            }

            var failedCount = await _userManager.GetAccessFailedCountAsync(user);
            await _auditService.LogEventAsync(user.Id, "LOGIN_FAILED", "User", user.Id, $"Failed attempt {failedCount}/5", ipAddress);

            return new AuthResponseDto
            {
                Success = false,
                Message = $"Invalid credentials. You have {5 - failedCount} attempts remaining before account lockout."
            };
        }

        // 5. Successful login: reset failed counter & update login timestamp
        await _userManager.ResetAccessFailedCountAsync(user);
        user.LastLoginDate = DateTime.UtcNow;
        await _userManager.UpdateAsync(user);

        // 6. Generate Token and Claims
        var roles = await _userManager.GetRolesAsync(user);
        var token = GenerateJwtToken(user, roles, out var expiration);

        await _auditService.LogEventAsync(user.Id, "LOGIN_SUCCESS", "User", user.Id, $"User logged in with role(s): {string.Join(",", roles)}", ipAddress);

        return new AuthResponseDto
        {
            Success = true,
            Message = "Authentication successful.",
            Token = token,
            Expiration = expiration,
            User = new UserProfileDto
            {
                Id = user.Id,
                Username = user.UserName ?? string.Empty,
                Email = user.Email ?? string.Empty,
                FullName = user.FullName,
                Department = user.Department,
                Roles = roles,
                IsActive = user.IsActive,
                LastLoginDate = user.LastLoginDate
            }
        };
    }

    public async Task<AuthResponseDto> RegisterAsync(RegisterRequestDto request, string ipAddress)
    {
        // 1. Verify username and email uniqueness
        if (await _userManager.FindByNameAsync(request.Username) is not null)
        {
            return new AuthResponseDto
            {
                Success = false,
                Message = "Username is already taken."
            };
        }

        if (await _userManager.FindByEmailAsync(request.Email) is not null)
        {
            return new AuthResponseDto
            {
                Success = false,
                Message = "An account with this email address already exists."
            };
        }

        // 2. Validate requested role
        if (!UserRoles.All.Contains(request.Role))
        {
            return new AuthResponseDto
            {
                Success = false,
                Message = $"Invalid role specified. Permitted roles are: {string.Join(", ", UserRoles.All)}"
            };
        }

        // 3. Create User
        var user = new ApplicationUser
        {
            UserName = request.Username,
            Email = request.Email,
            FullName = request.FullName,
            Department = request.Department ?? "Sales",
            EmailConfirmed = true,
            IsActive = true,
            CreatedDate = DateTime.UtcNow
        };

        var result = await _userManager.CreateAsync(user, request.Password);
        if (!result.Succeeded)
        {
            var errors = string.Join("; ", result.Errors.Select(e => e.Description));
            return new AuthResponseDto
            {
                Success = false,
                Message = $"Registration failed: {errors}"
            };
        }

        await _userManager.AddToRoleAsync(user, request.Role);
        await _auditService.LogEventAsync(user.Id, "REGISTER_USER", "User", user.Id, $"New user registered with role {request.Role}", ipAddress);

        var roles = new List<string> { request.Role };
        var token = GenerateJwtToken(user, roles, out var expiration);

        return new AuthResponseDto
        {
            Success = true,
            Message = "User registered successfully.",
            Token = token,
            Expiration = expiration,
            User = new UserProfileDto
            {
                Id = user.Id,
                Username = user.UserName,
                Email = user.Email,
                FullName = user.FullName,
                Department = user.Department,
                Roles = roles,
                IsActive = user.IsActive,
                LastLoginDate = null
            }
        };
    }

    public async Task<UserProfileDto?> GetCurrentUserProfileAsync(string userId)
    {
        var user = await _userManager.FindByIdAsync(userId);
        if (user is null) return null;

        var roles = await _userManager.GetRolesAsync(user);
        return new UserProfileDto
        {
            Id = user.Id,
            Username = user.UserName ?? string.Empty,
            Email = user.Email ?? string.Empty,
            FullName = user.FullName,
            Department = user.Department,
            Roles = roles,
            IsActive = user.IsActive,
            LastLoginDate = user.LastLoginDate
        };
    }

    public async Task LogoutAsync(string userId, string ipAddress)
    {
        await _signInManager.SignOutAsync();
        await _auditService.LogEventAsync(userId, "LOGOUT", "User", userId, "User logged out successfully", ipAddress);
    }

    private string GenerateJwtToken(ApplicationUser user, IList<string> roles, out DateTime expiration)
    {
        var jwtSecret = _configuration["Jwt:Key"] ?? "AcxiomCRM_SuperSecretProductionSecurityKey_2026_Minimum32CharsLong!";
        var issuer = _configuration["Jwt:Issuer"] ?? "AcxiomCRM";
        var audience = _configuration["Jwt:Audience"] ?? "AcxiomCRMClient";
        var expiryHours = int.TryParse(_configuration["Jwt:DurationHours"], out var hours) ? hours : 8;

        var key = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(jwtSecret));
        var credentials = new SigningCredentials(key, SecurityAlgorithms.HmacSha256);

        var claims = new List<Claim>
        {
            new(ClaimTypes.NameIdentifier, user.Id),
            new(ClaimTypes.Name, user.UserName ?? user.Email ?? string.Empty),
            new(ClaimTypes.Email, user.Email ?? string.Empty),
            new("FullName", user.FullName)
        };

        foreach (var role in roles)
        {
            claims.Add(new Claim(ClaimTypes.Role, role));
        }

        expiration = DateTime.UtcNow.AddHours(expiryHours);

        var token = new JwtSecurityToken(
            issuer: issuer,
            audience: audience,
            claims: claims,
            expires: expiration,
            signingCredentials: credentials);

        return new JwtSecurityTokenHandler().WriteToken(token);
    }
}
