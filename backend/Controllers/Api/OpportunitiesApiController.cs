using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using AcxiomCRM.Backend.Models.DTOs.Common;
using AcxiomCRM.Backend.Models.DTOs.Opportunity;
using AcxiomCRM.Backend.Models.Enums;
using AcxiomCRM.Backend.Services.Interfaces;

namespace AcxiomCRM.Backend.Controllers.Api;

[ApiController]
[Route("api/opportunities")]
[Authorize]
public class OpportunitiesApiController : BaseApiController
{
    private readonly IOpportunityService _opportunityService;

    public OpportunitiesApiController(IOpportunityService opportunityService)
    {
        _opportunityService = opportunityService;
    }

    [HttpGet]
    public async Task<ActionResult<ApiResponse<PagedResult<OpportunityDto>>>> GetOpportunities([FromQuery] OpportunitySearchFilterDto filter)
    {
        var result = await _opportunityService.GetOpportunitiesAsync(filter, CurrentUserId, CurrentUserRole);
        return Ok(ApiResponse<PagedResult<OpportunityDto>>.SuccessResponse(result));
    }

    [HttpGet("pipeline-summary")]
    public async Task<ActionResult<ApiResponse<PipelineSummaryDto>>> GetPipelineSummary()
    {
        var summary = await _opportunityService.GetPipelineSummaryAsync(CurrentUserId, CurrentUserRole);
        return Ok(ApiResponse<PipelineSummaryDto>.SuccessResponse(summary));
    }

    [HttpGet("{id:int}")]
    public async Task<ActionResult<ApiResponse<OpportunityDto>>> GetById(int id)
    {
        var opp = await _opportunityService.GetOpportunityByIdAsync(id, CurrentUserId, CurrentUserRole);
        if (opp == null)
        {
            return NotFound(ApiResponse<OpportunityDto>.ErrorResponse("Opportunity not found"));
        }
        return Ok(ApiResponse<OpportunityDto>.SuccessResponse(opp));
    }

    [HttpPost]
    public async Task<ActionResult<ApiResponse<OpportunityDto>>> CreateOpportunity([FromBody] CreateOpportunityDto dto)
    {
        if (!ModelState.IsValid)
        {
            var errors = ModelState.Values.SelectMany(v => v.Errors).Select(e => e.ErrorMessage).ToList();
            return BadRequest(ApiResponse<OpportunityDto>.ErrorResponse(string.Join("; ", errors)));
        }

        var (success, message, opp) = await _opportunityService.CreateOpportunityAsync(dto, CurrentUserId, CurrentUserRole);
        if (!success)
        {
            return BadRequest(ApiResponse<OpportunityDto>.ErrorResponse(message));
        }

        return CreatedAtAction(nameof(GetById), new { id = opp!.Id }, ApiResponse<OpportunityDto>.SuccessResponse(opp, message));
    }

    [HttpPut("{id:int}")]
    public async Task<ActionResult<ApiResponse<OpportunityDto>>> UpdateOpportunity(int id, [FromBody] UpdateOpportunityDto dto)
    {
        if (!ModelState.IsValid)
        {
            var errors = ModelState.Values.SelectMany(v => v.Errors).Select(e => e.ErrorMessage).ToList();
            return BadRequest(ApiResponse<OpportunityDto>.ErrorResponse(string.Join("; ", errors)));
        }

        var (success, message, opp) = await _opportunityService.UpdateOpportunityAsync(id, dto, CurrentUserId, CurrentUserRole);
        if (!success)
        {
            return BadRequest(ApiResponse<OpportunityDto>.ErrorResponse(message));
        }

        return Ok(ApiResponse<OpportunityDto>.SuccessResponse(opp!, message));
    }

    [HttpPatch("{id:int}/stage")]
    public async Task<ActionResult<ApiResponse<bool>>> UpdateStage(int id, [FromBody] StageUpdateDto dto)
    {
        var (success, message) = await _opportunityService.UpdateStageAsync(id, dto.Stage, CurrentUserId, CurrentUserRole);
        if (!success)
        {
            return BadRequest(ApiResponse<bool>.ErrorResponse(message));
        }

        return Ok(ApiResponse<bool>.SuccessResponse(true, message));
    }

    [HttpDelete("{id:int}")]
    [Authorize(Roles = "Admin,Manager")]
    public async Task<ActionResult<ApiResponse<bool>>> DeleteOpportunity(int id)
    {
        var (success, message) = await _opportunityService.DeleteOpportunityAsync(id, CurrentUserId, CurrentUserRole);
        if (!success)
        {
            return BadRequest(ApiResponse<bool>.ErrorResponse(message));
        }

        return Ok(ApiResponse<bool>.SuccessResponse(true, message));
    }
}

public class StageUpdateDto
{
    public OpportunityStage Stage { get; set; }
}
