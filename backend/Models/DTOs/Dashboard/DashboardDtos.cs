namespace AcxiomCRM.Backend.Models.DTOs.Dashboard;

public class DashboardMetricsDto
{
    public int TotalCustomers { get; set; }
    public int TotalLeads { get; set; }
    public int OpenLeads { get; set; }
    public int ConvertedLeads { get; set; }
    public decimal LeadConversionRate { get; set; }

    public int ActiveOpportunities { get; set; }
    public decimal TotalPipelineValue { get; set; }
    public decimal WeightedPipelineValue { get; set; }
    public decimal WonRevenue { get; set; }
    public decimal LostRevenue { get; set; }

    public int OverdueFollowUps { get; set; }
    public int UpcomingFollowUps { get; set; }
    public int CompletedFollowUps { get; set; }

    public string CurrentRole { get; set; } = string.Empty;
    public string RoleScopeDescription { get; set; } = string.Empty;
}

public class ChartDatasetDto
{
    public List<string> Labels { get; set; } = new();
    public List<decimal> Data { get; set; } = new();
    public List<string> BackgroundColors { get; set; } = new();
    public List<string>? SecondaryLabels { get; set; }
    public List<decimal>? SecondaryData { get; set; }
}

public class DashboardChartsDto
{
    public ChartDatasetDto LeadStatusDistribution { get; set; } = new();
    public ChartDatasetDto OpportunityFunnel { get; set; } = new();
    public ChartDatasetDto MonthlySalesVelocity { get; set; } = new();
    public ChartDatasetDto ActivityMix { get; set; } = new();
}
