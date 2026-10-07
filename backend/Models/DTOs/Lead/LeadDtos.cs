using System.ComponentModel.DataAnnotations;
using AcxiomCRM.Backend.Models.Enums;

namespace AcxiomCRM.Backend.Models.DTOs.Lead;

public class CreateLeadDto
{
    [Required(ErrorMessage = "Lead Name is required.")]
    [StringLength(100, ErrorMessage = "Lead Name cannot exceed 100 characters.")]
    public string LeadName { get; set; } = string.Empty;

    [Required(ErrorMessage = "Email is required.")]
    [EmailAddress(ErrorMessage = "Enter a valid email address.")]
    [StringLength(150, ErrorMessage = "Email cannot exceed 150 characters.")]
    public string Email { get; set; } = string.Empty;

    [Required(ErrorMessage = "Phone number is required.")]
    [RegularExpression(@"^[6-9]\d{9}$", ErrorMessage = "Enter a valid 10-digit mobile number starting with 6, 7, 8, or 9.")]
    [StringLength(20, ErrorMessage = "Phone number cannot exceed 20 characters.")]
    public string Phone { get; set; } = string.Empty;

    [StringLength(150, ErrorMessage = "Company Name cannot exceed 150 characters.")]
    public string? CompanyName { get; set; }

    [Required(ErrorMessage = "Lead Source is required.")]
    [StringLength(100, ErrorMessage = "Source cannot exceed 100 characters.")]
    public string Source { get; set; } = "Website";

    [Range(0, 999999999.99, ErrorMessage = "Expected Value must be greater than or equal to 0.")]
    public decimal ExpectedValue { get; set; } = 0.00m;

    public string? AssignedTo { get; set; }
}

public class UpdateLeadDto
{
    [Required(ErrorMessage = "Lead Name is required.")]
    [StringLength(100, ErrorMessage = "Lead Name cannot exceed 100 characters.")]
    public string LeadName { get; set; } = string.Empty;

    [Required(ErrorMessage = "Email is required.")]
    [EmailAddress(ErrorMessage = "Enter a valid email address.")]
    [StringLength(150, ErrorMessage = "Email cannot exceed 150 characters.")]
    public string Email { get; set; } = string.Empty;

    [Required(ErrorMessage = "Phone number is required.")]
    [RegularExpression(@"^[6-9]\d{9}$", ErrorMessage = "Enter a valid 10-digit mobile number starting with 6, 7, 8, or 9.")]
    [StringLength(20, ErrorMessage = "Phone number cannot exceed 20 characters.")]
    public string Phone { get; set; } = string.Empty;

    [StringLength(150, ErrorMessage = "Company Name cannot exceed 150 characters.")]
    public string? CompanyName { get; set; }

    [Required(ErrorMessage = "Lead Source is required.")]
    [StringLength(100, ErrorMessage = "Source cannot exceed 100 characters.")]
    public string Source { get; set; } = "Website";

    [Required(ErrorMessage = "Lead Status is required.")]
    public LeadStatus Status { get; set; } = LeadStatus.New;

    [Range(0, 999999999.99, ErrorMessage = "Expected Value must be greater than or equal to 0.")]
    public decimal ExpectedValue { get; set; } = 0.00m;

    public string? AssignedTo { get; set; }
}

public class LeadDto
{
    public int LeadId { get; set; }
    public string LeadCode { get; set; } = string.Empty;
    public string LeadName { get; set; } = string.Empty;
    public string Email { get; set; } = string.Empty;
    public string Phone { get; set; } = string.Empty;
    public string? CompanyName { get; set; }
    public string Source { get; set; } = "Direct";
    public LeadStatus Status { get; set; }
    public string StatusName => Status.ToString();
    public decimal ExpectedValue { get; set; }
    public string? AssignedTo { get; set; }
    public string? AssignedUserName { get; set; }
    public DateTime CreatedDate { get; set; }
    public int? ConvertedCustomerId { get; set; }
}

public class LeadConversionDto
{
    [Required(ErrorMessage = "Lead ID is required.")]
    public int LeadId { get; set; }

    [StringLength(150, ErrorMessage = "Company Name cannot exceed 150 characters.")]
    public string? CompanyName { get; set; }

    [StringLength(250, ErrorMessage = "Address cannot exceed 250 characters.")]
    public string? Address { get; set; }

    [StringLength(100, ErrorMessage = "City cannot exceed 100 characters.")]
    public string? City { get; set; }

    [StringLength(100, ErrorMessage = "State cannot exceed 100 characters.")]
    public string? State { get; set; }

    public bool CreateOpportunity { get; set; } = true;

    [StringLength(150, ErrorMessage = "Opportunity Name cannot exceed 150 characters.")]
    public string? OpportunityName { get; set; }

    [Range(0.01, 999999999.99, ErrorMessage = "Opportunity Amount must be greater than 0.")]
    public decimal OpportunityAmount { get; set; } = 5000.00m;

    public DateTime? ExpectedCloseDate { get; set; }
}

public class LeadSearchFilterDto
{
    public string? SearchTerm { get; set; }
    public LeadStatus? Status { get; set; }
    public string? AssignedTo { get; set; }
    public int PageNumber { get; set; } = 1;
    public int PageSize { get; set; } = 10;
}
