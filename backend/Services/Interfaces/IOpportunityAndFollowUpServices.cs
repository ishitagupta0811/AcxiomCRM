using AcxiomCRM.Backend.Models.DTOs.Common;
using AcxiomCRM.Backend.Models.DTOs.FollowUp;
using AcxiomCRM.Backend.Models.DTOs.Opportunity;
using AcxiomCRM.Backend.Models.Enums;

namespace AcxiomCRM.Backend.Services.Interfaces;

public interface IOpportunityService
{
    Task<PagedResult<OpportunityDto>> GetOpportunitiesAsync(OpportunitySearchFilterDto filter, string currentUserId, string currentUserRole);
    Task<OpportunityDto?> GetOpportunityByIdAsync(int id, string currentUserId, string currentUserRole);
    Task<(bool Success, string Message, OpportunityDto? Opportunity)> CreateOpportunityAsync(CreateOpportunityDto dto, string currentUserId, string currentUserRole);
    Task<(bool Success, string Message, OpportunityDto? Opportunity)> UpdateOpportunityAsync(int id, UpdateOpportunityDto dto, string currentUserId, string currentUserRole);
    Task<(bool Success, string Message)> UpdateStageAsync(int id, OpportunityStage newStage, string currentUserId, string currentUserRole);
    Task<(bool Success, string Message)> DeleteOpportunityAsync(int id, string currentUserId, string currentUserRole);
    Task<PipelineSummaryDto> GetPipelineSummaryAsync(string currentUserId, string currentUserRole);
}

public interface IFollowUpService
{
    Task<PagedResult<FollowUpDto>> GetFollowUpsAsync(FollowUpSearchFilterDto filter, string currentUserId, string currentUserRole);
    Task<FollowUpDto?> GetFollowUpByIdAsync(int id, string currentUserId, string currentUserRole);
    Task<(bool Success, string Message, FollowUpDto? FollowUp)> CreateFollowUpAsync(CreateFollowUpDto dto, string currentUserId, string currentUserRole);
    Task<(bool Success, string Message, FollowUpDto? FollowUp)> UpdateFollowUpAsync(int id, UpdateFollowUpDto dto, string currentUserId, string currentUserRole);
    Task<(bool Success, string Message)> CompleteFollowUpAsync(int id, string? remarks, string currentUserId, string currentUserRole);
    Task<(bool Success, string Message)> DeleteFollowUpAsync(int id, string currentUserId, string currentUserRole);
}
