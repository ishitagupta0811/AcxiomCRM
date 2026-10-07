namespace AcxiomCRM.Backend.Models.Enums;

public enum LeadStatus
{
    New = 1,
    Contacted = 2,
    Qualified = 3,
    Unqualified = 4,
    Converted = 5,
    Lost = 6
}

public enum OpportunityStage
{
    Qualification = 1,
    Proposal = 2,
    Negotiation = 3,
    Won = 4,
    Lost = 5
}

public enum FollowUpStatus
{
    Planned = 1,
    Completed = 2,
    Missed = 3,
    Cancelled = 4
}

public enum ActivityType
{
    Call = 1,
    Meeting = 2,
    Email = 3,
    Task = 4
}
