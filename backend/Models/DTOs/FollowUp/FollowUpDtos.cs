using System.ComponentModel.DataAnnotations;
using AcxiomCRM.Backend.Models.Enums;

namespace AcxiomCRM.Backend.Models.DTOs.FollowUp;

public class CreateFollowUpDto
{
    public int? CustomerId { get; set; }
    public int? LeadId { get; set; }
    public int? OpportunityId { get; set; }

    [Required(ErrorMessage = "Follow-Up Date & Time is required.")]
    public DateTime FollowUpDate { get; set; }

    [Required(ErrorMessage = "Follow-Up Type is required.")]
    [StringLength(50)]
    public string FollowUpType { get; set; } = "Call"; // Call, Meeting, Email, Task

    [StringLength(500, ErrorMessage = "Remarks cannot exceed 500 characters.")]
    public string? Remarks { get; set; }

    public string? AssignedTo { get; set; }
}

public class UpdateFollowUpDto
{
    [Required(ErrorMessage = "Follow-Up Date & Time is required.")]
    public DateTime FollowUpDate { get; set; }

    [Required(ErrorMessage = "Follow-Up Type is required.")]
    [StringLength(50)]
    public string FollowUpType { get; set; } = "Call";

    [StringLength(500)]
    public string? Remarks { get; set; }

    [Required(ErrorMessage = "Status is required.")]
    public FollowUpStatus Status { get; set; }

    public string? AssignedTo { get; set; }
}

public class FollowUpDto
{
    public int FollowUpId { get; set; }
    public int? CustomerId { get; set; }
    public string? CustomerName { get; set; }
    public int? LeadId { get; set; }
    public string? LeadName { get; set; }
    public int? OpportunityId { get; set; }
    public DateTime FollowUpDate { get; set; }
    public string FollowUpType { get; set; } = "Call";
    public string? Remarks { get; set; }
    public FollowUpStatus Status { get; set; }
    public string StatusName => Status.ToString();
    public string? AssignedTo { get; set; }
    public string? AssignedUserName { get; set; }
    public DateTime CreatedDate { get; set; }
    public bool IsOverdue => Status == FollowUpStatus.Planned && FollowUpDate < DateTime.UtcNow;
}

public class FollowUpSearchFilterDto
{
    public FollowUpStatus? Status { get; set; }
    public string? FollowUpType { get; set; }
    public string? AssignedTo { get; set; }
    public bool? OverdueOnly { get; set; }
    public int PageNumber { get; set; } = 1;
    public int PageSize { get; set; } = 15;
}
