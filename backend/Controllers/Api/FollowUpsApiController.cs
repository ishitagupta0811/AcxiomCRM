using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using AcxiomCRM.Backend.Models.DTOs.Common;
using AcxiomCRM.Backend.Models.DTOs.FollowUp;
using AcxiomCRM.Backend.Services.Interfaces;

namespace AcxiomCRM.Backend.Controllers.Api;

[ApiController]
[Route("api/followups")]
[Authorize]
public class FollowUpsApiController : BaseApiController
{
    private readonly IFollowUpService _followUpService;

    public FollowUpsApiController(IFollowUpService followUpService)
    {
        _followUpService = followUpService;
    }

    [HttpGet]
    public async Task<ActionResult<ApiResponse<PagedResult<FollowUpDto>>>> GetFollowUps([FromQuery] FollowUpSearchFilterDto filter)
    {
        var result = await _followUpService.GetFollowUpsAsync(filter, CurrentUserId, CurrentUserRole);
        return Ok(ApiResponse<PagedResult<FollowUpDto>>.SuccessResponse(result));
    }

    [HttpGet("{id:int}")]
    public async Task<ActionResult<ApiResponse<FollowUpDto>>> GetById(int id)
    {
        var item = await _followUpService.GetFollowUpByIdAsync(id, CurrentUserId, CurrentUserRole);
        if (item == null)
        {
            return NotFound(ApiResponse<FollowUpDto>.ErrorResponse("Follow-up not found"));
        }
        return Ok(ApiResponse<FollowUpDto>.SuccessResponse(item));
    }

    [HttpPost]
    public async Task<ActionResult<ApiResponse<FollowUpDto>>> CreateFollowUp([FromBody] CreateFollowUpDto dto)
    {
        if (!ModelState.IsValid)
        {
            var errors = ModelState.Values.SelectMany(v => v.Errors).Select(e => e.ErrorMessage).ToList();
            return BadRequest(ApiResponse<FollowUpDto>.ErrorResponse(string.Join("; ", errors)));
        }

        var (success, message, followUp) = await _followUpService.CreateFollowUpAsync(dto, CurrentUserId, CurrentUserRole);
        if (!success)
        {
            return BadRequest(ApiResponse<FollowUpDto>.ErrorResponse(message));
        }

        return CreatedAtAction(nameof(GetById), new { id = followUp!.Id }, ApiResponse<FollowUpDto>.SuccessResponse(followUp, message));
    }

    [HttpPut("{id:int}")]
    public async Task<ActionResult<ApiResponse<FollowUpDto>>> UpdateFollowUp(int id, [FromBody] UpdateFollowUpDto dto)
    {
        if (!ModelState.IsValid)
        {
            var errors = ModelState.Values.SelectMany(v => v.Errors).Select(e => e.ErrorMessage).ToList();
            return BadRequest(ApiResponse<FollowUpDto>.ErrorResponse(string.Join("; ", errors)));
        }

        var (success, message, followUp) = await _followUpService.UpdateFollowUpAsync(id, dto, CurrentUserId, CurrentUserRole);
        if (!success)
        {
            return BadRequest(ApiResponse<FollowUpDto>.ErrorResponse(message));
        }

        return Ok(ApiResponse<FollowUpDto>.SuccessResponse(followUp!, message));
    }

    [HttpPost("{id:int}/complete")]
    public async Task<ActionResult<ApiResponse<bool>>> CompleteFollowUp(int id, [FromBody] CompleteFollowUpRequest request)
    {
        var (success, message) = await _followUpService.CompleteFollowUpAsync(id, request?.Remarks, CurrentUserId, CurrentUserRole);
        if (!success)
        {
            return BadRequest(ApiResponse<bool>.ErrorResponse(message));
        }

        return Ok(ApiResponse<bool>.SuccessResponse(true, message));
    }

    [HttpDelete("{id:int}")]
    [Authorize(Roles = "Admin,Manager")]
    public async Task<ActionResult<ApiResponse<bool>>> DeleteFollowUp(int id)
    {
        var (success, message) = await _followUpService.DeleteFollowUpAsync(id, CurrentUserId, CurrentUserRole);
        if (!success)
        {
            return BadRequest(ApiResponse<bool>.ErrorResponse(message));
        }

        return Ok(ApiResponse<bool>.SuccessResponse(true, message));
    }
}

public class CompleteFollowUpRequest
{
    public string? Remarks { get; set; }
}
