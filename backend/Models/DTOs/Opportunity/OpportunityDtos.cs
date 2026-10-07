using System.ComponentModel.DataAnnotations;
using AcxiomCRM.Backend.Models.Enums;

namespace AcxiomCRM.Backend.Models.DTOs.Opportunity;

public class CreateOpportunityDto
{
    [Required(ErrorMessage = "Opportunity Name is required.")]
    [StringLength(150, ErrorMessage = "Opportunity Name cannot exceed 150 characters.")]
    public string OpportunityName { get; set; } = string.Empty;

    [Required(ErrorMessage = "Customer selection is required.")]
    public int CustomerId { get; set; }

    public int? LeadId { get; set; }

    [Required(ErrorMessage = "Opportunity Amount is required.")]
    [Range(0.01, 999999999.99, ErrorMessage = "Opportunity Amount must be greater than 0.")]
    public decimal Amount { get; set; }

    public OpportunityStage Stage { get; set; } = OpportunityStage.Qualification;

    [Range(0, 100, ErrorMessage = "Probability must be between 0 and 100.")]
    public int Probability { get; set; } = 20;

    [Required(ErrorMessage = "Expected Close Date is required.")]
    public DateTime ExpectedCloseDate { get; set; }

    public string? AssignedTo { get; set; }
    public string? Notes { get; set; }
}

public class UpdateOpportunityDto
{
    [Required(ErrorMessage = "Opportunity Name is required.")]
    [StringLength(150, ErrorMessage = "Opportunity Name cannot exceed 150 characters.")]
    public string OpportunityName { get; set; } = string.Empty;

    [Required(ErrorMessage = "Opportunity Amount is required.")]
    [Range(0.01, 999999999.99, ErrorMessage = "Opportunity Amount must be greater than 0.")]
    public decimal Amount { get; set; }

    [Required(ErrorMessage = "Stage is required.")]
    public OpportunityStage Stage { get; set; }

    [Range(0, 100, ErrorMessage = "Probability must be between 0 and 100.")]
    public int Probability { get; set; }

    [Required(ErrorMessage = "Expected Close Date is required.")]
    public DateTime ExpectedCloseDate { get; set; }

    public string? Status { get; set; } = "Open";
    public string? AssignedTo { get; set; }
    public string? Notes { get; set; }
}

public class OpportunityDto
{
    public int OpportunityId { get; set; }
    public string OpportunityName { get; set; } = string.Empty;
    public int CustomerId { get; set; }
    public string? CustomerName { get; set; }
    public int? LeadId { get; set; }
    public decimal Amount { get; set; }
    public OpportunityStage Stage { get; set; }
    public string StageName => Stage.ToString();
    public int Probability { get; set; }
    public decimal WeightedAmount => Amount * Probability / 100.0m;
    public DateTime ExpectedCloseDate { get; set; }
    public string Status { get; set; } = "Open";
    public string? AssignedTo { get; set; }
    public string? AssignedUserName { get; set; }
    public DateTime CreatedDate { get; set; }
    public string? Notes { get; set; }
}

public class OpportunitySearchFilterDto
{
    public string? SearchTerm { get; set; }
    public OpportunityStage? Stage { get; set; }
    public string? Status { get; set; }
    public int? CustomerId { get; set; }
    public string? AssignedTo { get; set; }
    public int PageNumber { get; set; } = 1;
    public int PageSize { get; set; } = 15;
}

public class PipelineSummaryDto
{
    public decimal TotalPipelineValue { get; set; }
    public decimal WeightedPipelineValue { get; set; }
    public int TotalOpportunities { get; set; }
    public int OpenOpportunities { get; set; }
    public int WonOpportunities { get; set; }
    public int LostOpportunities { get; set; }
    public Dictionary<string, decimal> StageWiseAmount { get; set; } = new();
}
