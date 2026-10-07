using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using AcxiomCRM.Backend.Models.DTOs.Common;
using AcxiomCRM.Backend.Models.DTOs.Lead;
using AcxiomCRM.Backend.Services.Interfaces;

namespace AcxiomCRM.Backend.Controllers.Api;

[Authorize]
public class LeadsApiController : BaseApiController
{
    private readonly ILeadService _leadService;

    public LeadsApiController(ILeadService leadService)
    {
        _leadService = leadService;
    }

    /// <summary>
    /// Retrieves paginated leads filtered by status and role scope.
    /// </summary>
    [HttpGet]
    [ProducesResponseType(typeof(ApiResponse<PagedResult<LeadDto>>), StatusCodes.Status200OK)]
    public async Task<IActionResult> GetLeads([FromQuery] LeadSearchFilterDto filter)
    {
        var result = await _leadService.GetLeadsAsync(filter, CurrentUserId ?? string.Empty, CurrentUserRole ?? string.Empty);
        return Ok(ApiResponse<PagedResult<LeadDto>>.Ok(result));
    }

    /// <summary>
    /// Gets lead details by ID.
    /// </summary>
    [HttpGet("{id:int}")]
    [ProducesResponseType(typeof(ApiResponse<LeadDto>), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> GetLeadById(int id)
    {
        var lead = await _leadService.GetLeadByIdAsync(id, CurrentUserId ?? string.Empty, CurrentUserRole ?? string.Empty);
        if (lead is null)
        {
            return NotFound(ApiResponse<LeadDto>.Fail("Lead not found or access denied."));
        }
        return Ok(ApiResponse<LeadDto>.Ok(lead));
    }

    /// <summary>
    /// Captures a new lead.
    /// </summary>
    [HttpPost]
    [ProducesResponseType(typeof(ApiResponse<LeadDto>), StatusCodes.Status201Created)]
    [ProducesResponseType(typeof(ApiResponse<LeadDto>), StatusCodes.Status400BadRequest)]
    public async Task<IActionResult> CreateLead([FromBody] CreateLeadDto dto)
    {
        if (!ModelState.IsValid)
        {
            var errors = ModelState.Values
                .SelectMany(v => v.Errors)
                .Select(e => e.ErrorMessage)
                .ToList();
            return BadRequest(ApiResponse<LeadDto>.Fail("Validation failed.", errors));
        }

        var result = await _leadService.CreateLeadAsync(dto, CurrentUserId ?? string.Empty, CurrentUserRole ?? string.Empty);
        if (!result.Success)
        {
            return BadRequest(ApiResponse<LeadDto>.Fail(result.Message));
        }

        return CreatedAtAction(nameof(GetLeadById), new { id = result.Lead!.LeadId }, ApiResponse<LeadDto>.Ok(result.Lead, result.Message));
    }

    /// <summary>
    /// Updates lead information and status.
    /// </summary>
    [HttpPut("{id:int}")]
    [ProducesResponseType(typeof(ApiResponse<LeadDto>), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ApiResponse<LeadDto>), StatusCodes.Status400BadRequest)]
    public async Task<IActionResult> UpdateLead(int id, [FromBody] UpdateLeadDto dto)
    {
        if (!ModelState.IsValid)
        {
            var errors = ModelState.Values
                .SelectMany(v => v.Errors)
                .Select(e => e.ErrorMessage)
                .ToList();
            return BadRequest(ApiResponse<LeadDto>.Fail("Validation failed.", errors));
        }

        var result = await _leadService.UpdateLeadAsync(id, dto, CurrentUserId ?? string.Empty, CurrentUserRole ?? string.Empty);
        if (!result.Success)
        {
            return BadRequest(ApiResponse<LeadDto>.Fail(result.Message));
        }

        return Ok(ApiResponse<LeadDto>.Ok(result.Lead!, result.Message));
    }

    /// <summary>
    /// Deletes or deactivates a lead.
    /// </summary>
    [HttpDelete("{id:int}")]
    public async Task<IActionResult> DeleteLead(int id)
    {
        var result = await _leadService.DeleteLeadAsync(id, CurrentUserId ?? string.Empty, CurrentUserRole ?? string.Empty);
        if (!result.Success)
        {
            return NotFound(ApiResponse<bool>.Fail(result.Message));
        }

        return Ok(ApiResponse<bool>.Ok(true, result.Message));
    }

    /// <summary>
    /// Converts a qualified lead into a Customer and optional Opportunity.
    /// </summary>
    [HttpPost("{id:int}/convert")]
    [ProducesResponseType(typeof(ApiResponse<object>), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ApiResponse<object>), StatusCodes.Status400BadRequest)]
    public async Task<IActionResult> ConvertLead(int id, [FromBody] LeadConversionDto dto)
    {
        dto.LeadId = id;
        if (!ModelState.IsValid)
        {
            var errors = ModelState.Values
                .SelectMany(v => v.Errors)
                .Select(e => e.ErrorMessage)
                .ToList();
            return BadRequest(ApiResponse<object>.Fail("Validation failed.", errors));
        }

        var result = await _leadService.ConvertLeadAsync(dto, CurrentUserId ?? string.Empty, CurrentUserRole ?? string.Empty);
        if (!result.Success)
        {
            return BadRequest(ApiResponse<object>.Fail(result.Message));
        }

        return Ok(ApiResponse<object>.Ok(new { CustomerId = result.CustomerId }, result.Message));
    }
}
