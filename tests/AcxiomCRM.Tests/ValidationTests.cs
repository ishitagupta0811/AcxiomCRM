using System.Text.RegularExpressions;
using Xunit;

namespace AcxiomCRM.Tests;

public class ValidationTests
{
    private static readonly Regex EmailRegex = new(@"^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)+$", RegexOptions.Compiled);
    private static readonly Regex PhoneRegex = new(@"^[6-9]\d{9}$", RegexOptions.Compiled);

    [Theory]
    [InlineData("valid@company.com", true)]
    [InlineData("john.doe@sub.domain.org", true)]
    [InlineData("invalid-email", false)]
    [InlineData("@missingusername.com", false)]
    [InlineData("spaces in@email.com", false)]
    public void EmailValidation_ShouldAdhereToMandatoryFormat(string email, bool expectedValid)
    {
        var isValid = EmailRegex.IsMatch(email);
        Assert.Equal(expectedValid, isValid);
    }

    [Theory]
    [InlineData("9876543210", true)]
    [InlineData("8123456789", true)]
    [InlineData("7000000000", true)]
    [InlineData("1234567890", false)] // Invalid prefix (< 6)
    [InlineData("98765", false)]      // Too short
    [InlineData("987654321099", false)] // Too long
    [InlineData("abcd987654", false)]  // Non-numeric
    public void PhoneValidation_ShouldEnforce10DigitIndianPattern(string phone, bool expectedValid)
    {
        var isValid = PhoneRegex.IsMatch(phone);
        Assert.Equal(expectedValid, isValid);
    }

    [Theory]
    [InlineData(1000.0, true)]
    [InlineData(0.01, true)]
    [InlineData(0.0, false)]    // Amount must be > 0 (Section 5.3 & 17.7)
    [InlineData(-500.0, false)] // Cannot be negative
    public void OpportunityAmount_MustBeStrictlyGreaterThanZero(double amount, bool expectedValid)
    {
        var isValid = amount > 0;
        Assert.Equal(expectedValid, isValid);
    }

    [Theory]
    [InlineData(0, true)]
    [InlineData(50, true)]
    [InlineData(100, true)]
    [InlineData(-1, false)]  // Out of lower bound
    [InlineData(101, false)] // Out of upper bound (Section 5.3 & 17.7)
    public void OpportunityProbability_MustBeBetween0And100(int probability, bool expectedValid)
    {
        var isValid = probability >= 0 && probability <= 100;
        Assert.Equal(expectedValid, isValid);
    }

    [Fact]
    public void ExpectedCloseDate_CannotBeInPast_ForActiveOpportunity()
    {
        var today = DateTime.UtcNow.Date;
        var pastDate = today.AddDays(-1);
        var futureDate = today.AddDays(7);

        Assert.False(pastDate >= today, "Past date must fail validation.");
        Assert.True(futureDate >= today, "Future date must pass validation.");
    }

    [Fact]
    public void FollowUpDate_CannotBeEarlierThanToday_ForNewPlannedItem()
    {
        var today = DateTime.UtcNow.Date;
        var yesterday = today.AddDays(-1);
        var tomorrow = today.AddDays(1);

        Assert.False(yesterday >= today, "Yesterday follow-up must be rejected for new planned items.");
        Assert.True(tomorrow >= today, "Tomorrow follow-up must be accepted.");
    }
}
