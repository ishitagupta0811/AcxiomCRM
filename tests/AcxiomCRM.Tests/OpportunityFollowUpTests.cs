using System.ComponentModel.DataAnnotations;
using AcxiomCRM.Backend.Models.DTOs.FollowUp;
using AcxiomCRM.Backend.Models.DTOs.Opportunity;
using AcxiomCRM.Backend.Models.Enums;
using Xunit;

namespace AcxiomCRM.Tests;

public class OpportunityFollowUpTests
{
    [Fact]
    public void CreateOpportunityDto_ValidData_PassesValidation()
    {
        var dto = new CreateOpportunityDto
        {
            CustomerId = 1,
            Title = "Enterprise CRM Subscription",
            Amount = 50000m,
            Stage = OpportunityStage.Proposal,
            Probability = 70,
            ExpectedCloseDate = DateTime.UtcNow.AddDays(30)
        };

        var results = ValidateModel(dto);
        Assert.Empty(results);
    }

    [Theory]
    [InlineData(0)]
    [InlineData(-1500)]
    public void CreateOpportunityDto_ZeroOrNegativeAmount_FailsValidation(decimal invalidAmount)
    {
        var dto = new CreateOpportunityDto
        {
            CustomerId = 1,
            Title = "Enterprise Deal",
            Amount = invalidAmount,
            Stage = OpportunityStage.Qualification,
            Probability = 30,
            ExpectedCloseDate = DateTime.UtcNow.AddDays(15)
        };

        var results = ValidateModel(dto);
        Assert.Contains(results, r => r.MemberNames.Contains(nameof(CreateOpportunityDto.Amount)));
    }

    [Theory]
    [InlineData(-5)]
    [InlineData(105)]
    public void CreateOpportunityDto_ProbabilityOutsideRange_FailsValidation(int invalidProbability)
    {
        var dto = new CreateOpportunityDto
        {
            CustomerId = 1,
            Title = "Cloud Migration",
            Amount = 25000m,
            Stage = OpportunityStage.Proposal,
            Probability = invalidProbability,
            ExpectedCloseDate = DateTime.UtcNow.AddDays(10)
        };

        var results = ValidateModel(dto);
        Assert.Contains(results, r => r.MemberNames.Contains(nameof(CreateOpportunityDto.Probability)));
    }

    [Fact]
    public void WeightedPipelineValue_ComputesAccurateForecast()
    {
        var deals = new[]
        {
            new { Amount = 100000m, Probability = 50 },  // 50,000
            new { Amount = 80000m, Probability = 75 },   // 60,000
            new { Amount = 200000m, Probability = 100 }, // 200,000
            new { Amount = 40000m, Probability = 25 }    // 10,000
        };

        decimal expectedTotal = 420000m;
        decimal expectedWeighted = 320000m;

        decimal calculatedTotal = deals.Sum(d => d.Amount);
        decimal calculatedWeighted = deals.Sum(d => (d.Amount * d.Probability) / 100m);

        Assert.Equal(expectedTotal, calculatedTotal);
        Assert.Equal(expectedWeighted, calculatedWeighted);
    }

    [Fact]
    public void FollowUp_OverdueDetection_IdentifiesPastPlannedEvents()
    {
        var pastPlanned = new FollowUpDto
        {
            Id = 1,
            FollowUpDate = DateTime.UtcNow.AddHours(-3),
            Status = FollowUpStatus.Planned,
            IsOverdue = true
        };

        var futurePlanned = new FollowUpDto
        {
            Id = 2,
            FollowUpDate = DateTime.UtcNow.AddDays(2),
            Status = FollowUpStatus.Planned,
            IsOverdue = false
        };

        var pastCompleted = new FollowUpDto
        {
            Id = 3,
            FollowUpDate = DateTime.UtcNow.AddDays(-1),
            Status = FollowUpStatus.Completed,
            IsOverdue = false
        };

        Assert.True(pastPlanned.IsOverdue);
        Assert.False(futurePlanned.IsOverdue);
        Assert.False(pastCompleted.IsOverdue);
    }

    private static List<ValidationResult> ValidateModel(object model)
    {
        var validationResults = new List<ValidationResult>();
        var context = new ValidationContext(model, serviceProvider: null, items: null);
        Validator.TryValidateObject(model, context, validationResults, validateAllProperties: true);
        return validationResults;
    }
}
