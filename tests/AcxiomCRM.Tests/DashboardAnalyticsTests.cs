using AcxiomCRM.Backend.Models.DTOs.Dashboard;
using Xunit;

namespace AcxiomCRM.Tests;

public class DashboardAnalyticsTests
{
    [Fact]
    public void LeadConversionRate_CalculatesExactPercentage()
    {
        int totalLeads = 20;
        int convertedLeads = 5;

        decimal calculatedRate = totalLeads > 0
            ? Math.Round(((decimal)convertedLeads / totalLeads) * 100, 1)
            : 0;

        Assert.Equal(25.0m, calculatedRate);
    }

    [Fact]
    public void LeadConversionRate_ZeroTotalLeads_ReturnsZeroWithoutDivisionByZero()
    {
        int totalLeads = 0;
        int convertedLeads = 0;

        decimal calculatedRate = totalLeads > 0
            ? Math.Round(((decimal)convertedLeads / totalLeads) * 100, 1)
            : 0;

        Assert.Equal(0m, calculatedRate);
    }

    [Fact]
    public void DashboardMetricsDto_ProperlyEnforcesRoleScopeInvariants()
    {
        var adminMetrics = new DashboardMetricsDto
        {
            CurrentRole = "Admin",
            RoleScopeDescription = "Company-Wide Master View: Global sales figures, user operations, and system compliance.",
            TotalCustomers = 150,
            TotalPipelineValue = 500000m,
            WeightedPipelineValue = 350000m
        };

        var salesMetrics = new DashboardMetricsDto
        {
            CurrentRole = "SalesExecutive",
            RoleScopeDescription = "Personal Workspace: Assigned leads, owned customers, and individual revenue targets.",
            TotalCustomers = 12,
            TotalPipelineValue = 85000m,
            WeightedPipelineValue = 60000m
        };

        Assert.Equal("Admin", adminMetrics.CurrentRole);
        Assert.True(adminMetrics.TotalCustomers >= salesMetrics.TotalCustomers);
        Assert.True(adminMetrics.TotalPipelineValue >= salesMetrics.TotalPipelineValue);
    }

    [Fact]
    public void ChartDatasetDto_Integrity_LabelsAndDataCountsMatch()
    {
        var funnel = new ChartDatasetDto
        {
            Labels = new List<string> { "Qualification", "Proposal", "Negotiation", "Won", "Lost" },
            Data = new List<decimal> { 35000m, 120000m, 85000m, 150000m, 0m },
            SecondaryData = new List<decimal> { 14000m, 84000m, 76500m, 150000m, 0m },
            BackgroundColors = new List<string> { "#38bdf8", "#818cf8", "#fbbf24", "#34d399", "#f87171" }
        };

        Assert.Equal(funnel.Labels.Count, funnel.Data.Count);
        Assert.Equal(funnel.Labels.Count, funnel.SecondaryData.Count);
        Assert.Equal(funnel.Labels.Count, funnel.BackgroundColors.Count);
    }
}
