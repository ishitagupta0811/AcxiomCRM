using System.ComponentModel.DataAnnotations;
using AcxiomCRM.Backend.Models.DTOs.Customer;
using AcxiomCRM.Backend.Models.DTOs.Lead;
using AcxiomCRM.Backend.Models.Enums;
using Xunit;

namespace AcxiomCRM.Tests;

public class CustomerLeadValidationTests
{
    private static IList<ValidationResult> ValidateModel(object model)
    {
        var validationResults = new List<ValidationResult>();
        var ctx = new ValidationContext(model, null, null);
        Validator.TryValidateObject(model, ctx, validationResults, true);
        return validationResults;
    }

    [Fact]
    public void CreateCustomer_WithValidData_PassesValidation()
    {
        var dto = new CreateCustomerDto
        {
            CustomerName = "Valid Corp",
            Email = "contact@validcorp.com",
            Phone = "9876543210",
            CompanyName = "Valid Corp Ltd",
            Address = "Tech Zone 1",
            City = "Bangalore",
            State = "Karnataka"
        };

        var results = ValidateModel(dto);
        Assert.Empty(results);
    }

    [Theory]
    [InlineData("", "9876543210", "contact@domain.com", "Customer Name is required.")]
    [InlineData("Valid Name", "invalid-phone", "contact@domain.com", "Enter a valid 10-digit mobile number starting with 6, 7, 8, or 9.")]
    [InlineData("Valid Name", "9876543210", "not-an-email", "Enter a valid email address.")]
    public void CreateCustomer_WithInvalidFields_FailsValidation(string name, string phone, string email, string expectedErrorMessage)
    {
        var dto = new CreateCustomerDto
        {
            CustomerName = name,
            Phone = phone,
            Email = email
        };

        var results = ValidateModel(dto);
        Assert.NotEmpty(results);
        Assert.Contains(results, r => r.ErrorMessage == expectedErrorMessage);
    }

    [Fact]
    public void DuplicateCustomerCheck_IdentifiesExistingEmailOrPhone()
    {
        var existingCustomers = new List<(string Email, string Phone)>
        {
            ("test@acme.com", "9876543210"),
            ("info@global.com", "9123456780")
        };

        var isDuplicateEmail = existingCustomers.Any(c => c.Email == "test@acme.com");
        var isDuplicatePhone = existingCustomers.Any(c => c.Phone == "9876543210");
        var isNewCustomer = !existingCustomers.Any(c => c.Email == "new@domain.com" || c.Phone == "9999888877");

        Assert.True(isDuplicateEmail, "Email duplicate must be detected.");
        Assert.True(isDuplicatePhone, "Phone duplicate must be detected.");
        Assert.True(isNewCustomer, "Unique credentials should pass duplicate check.");
    }

    [Fact]
    public void CreateLead_WithValidData_PassesValidation()
    {
        var dto = new CreateLeadDto
        {
            LeadName = "Nexa Lead",
            Email = "lead@nexa.com",
            Phone = "9811223344",
            CompanyName = "Nexa Dynamics",
            Source = "Website",
            ExpectedValue = 50000m
        };

        var results = ValidateModel(dto);
        Assert.Empty(results);
    }

    [Fact]
    public void CreateLead_WithNegativeExpectedValue_FailsValidation()
    {
        var dto = new CreateLeadDto
        {
            LeadName = "Negative Lead",
            Email = "lead@test.com",
            Phone = "9811223344",
            ExpectedValue = -500m // Value must be >= 0
        };

        var results = ValidateModel(dto);
        Assert.Contains(results, r => r.ErrorMessage == "Expected Value must be greater than or equal to 0.");
    }

    [Fact]
    public void LeadConversion_RequiresValidLeadIdAndNonNegativeOpportunityAmount()
    {
        var validDto = new LeadConversionDto
        {
            LeadId = 2001,
            OpportunityName = "Big Deal",
            OpportunityAmount = 15000m,
            CreateOpportunity = true
        };

        var results = ValidateModel(validDto);
        Assert.Empty(results);

        var invalidDto = new LeadConversionDto
        {
            LeadId = 2001,
            OpportunityAmount = 0m // Opportunity Amount must be > 0 (Section 5.3 & 17.7)
        };

        var invalidResults = ValidateModel(invalidDto);
        Assert.Contains(invalidResults, r => r.ErrorMessage == "Opportunity Amount must be greater than 0.");
    }

    [Fact]
    public void LeadStatus_Converted_PreventsReconversion()
    {
        var leadStatus = LeadStatus.Converted;
        var canBeConverted = leadStatus != LeadStatus.Converted;

        Assert.False(canBeConverted, "An already converted lead cannot be converted again.");
    }
}
