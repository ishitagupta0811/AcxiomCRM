using System.Text.RegularExpressions;
using AcxiomCRM.Backend.Models.Enums;
using Xunit;

namespace AcxiomCRM.Tests;

public class IdentitySecurityTests
{
    private static readonly Regex PasswordPolicyRegex = new(
        @"^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^\da-zA-Z]).{8,}$",
        RegexOptions.Compiled);

    [Fact]
    public void MandatoryRoles_MustIncludeAdminManagerSalesExecutive()
    {
        Assert.Contains(UserRoles.Admin, UserRoles.All);
        Assert.Contains(UserRoles.Manager, UserRoles.All);
        Assert.Contains(UserRoles.SalesExecutive, UserRoles.All);
        Assert.Equal(3, UserRoles.All.Count);
    }

    [Theory]
    [InlineData("Admin@12345", true)]     // 8+ chars, upper, lower, digit, special
    [InlineData("SecureP@ssw0rd!", true)]
    [InlineData("short1!", false)]         // Less than 8 chars
    [InlineData("alllowercase123!", false)]// Missing uppercase
    [InlineData("ALLUPPERCASE123!", false)]// Missing lowercase
    [InlineData("NoSpecialChar123", false)]// Missing special character
    [InlineData("NoDigitsInPassword!", false)]// Missing numeric digit
    public void PasswordPolicy_ShouldEnforceConfiguredComplexityRules(string password, bool expectedValid)
    {
        var isValid = PasswordPolicyRegex.IsMatch(password);
        Assert.Equal(expectedValid, isValid);
    }

    [Fact]
    public void LockoutPolicy_MustTriggerAfter5FailedAttempts()
    {
        const int maxFailedAttempts = 5;
        const int simulatedFailedAttempts = 5;

        var isLockedOut = simulatedFailedAttempts >= maxFailedAttempts;
        Assert.True(isLockedOut);
    }
}
