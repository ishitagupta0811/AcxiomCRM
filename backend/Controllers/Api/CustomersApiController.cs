using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using AcxiomCRM.Backend.Models.DTOs.Common;
using AcxiomCRM.Backend.Models.DTOs.Customer;
using AcxiomCRM.Backend.Services.Interfaces;

namespace AcxiomCRM.Backend.Controllers.Api;

[Authorize]
public class CustomersApiController : BaseApiController
{
    private readonly ICustomerService _customerService;

    public CustomersApiController(ICustomerService customerService)
    {
        _customerService = customerService;
    }

    /// <summary>
    /// Retrieves paginated customer records matching role scope and filters.
    /// </summary>
    [HttpGet]
    [ProducesResponseType(typeof(ApiResponse<PagedResult<CustomerDto>>), StatusCodes.Status200OK)]
    public async Task<IActionResult> GetCustomers([FromQuery] CustomerSearchFilterDto filter)
    {
        var result = await _customerService.GetCustomersAsync(filter, CurrentUserId ?? string.Empty, CurrentUserRole ?? string.Empty);
        return Ok(ApiResponse<PagedResult<CustomerDto>>.Ok(result));
    }

    /// <summary>
    /// Gets customer details by ID within role scope.
    /// </summary>
    [HttpGet("{id:int}")]
    [ProducesResponseType(typeof(ApiResponse<CustomerDto>), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> GetCustomerById(int id)
    {
        var customer = await _customerService.GetCustomerByIdAsync(id, CurrentUserId ?? string.Empty, CurrentUserRole ?? string.Empty);
        if (customer is null)
        {
            return NotFound(ApiResponse<CustomerDto>.Fail("Customer not found or access denied."));
        }
        return Ok(ApiResponse<CustomerDto>.Ok(customer));
    }

    /// <summary>
    /// Creates a new customer with mandatory email/phone duplicate checks.
    /// </summary>
    [HttpPost]
    [ProducesResponseType(typeof(ApiResponse<CustomerDto>), StatusCodes.Status201Created)]
    [ProducesResponseType(typeof(ApiResponse<CustomerDto>), StatusCodes.Status400BadRequest)]
    [ProducesResponseType(typeof(ApiResponse<CustomerDto>), StatusCodes.Status409Conflict)]
    public async Task<IActionResult> CreateCustomer([FromBody] CreateCustomerDto dto)
    {
        if (!ModelState.IsValid)
        {
            var errors = ModelState.Values
                .SelectMany(v => v.Errors)
                .Select(e => e.ErrorMessage)
                .ToList();
            return BadRequest(ApiResponse<CustomerDto>.Fail("Validation failed.", errors));
        }

        var result = await _customerService.CreateCustomerAsync(dto, CurrentUserId ?? string.Empty, CurrentUserRole ?? string.Empty);
        if (!result.Success)
        {
            return Conflict(ApiResponse<CustomerDto>.Fail(result.Message));
        }

        return CreatedAtAction(nameof(GetCustomerById), new { id = result.Customer!.CustomerId }, ApiResponse<CustomerDto>.Ok(result.Customer, result.Message));
    }

    /// <summary>
    /// Updates an existing customer with duplicate checks.
    /// </summary>
    [HttpPut("{id:int}")]
    [ProducesResponseType(typeof(ApiResponse<CustomerDto>), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ApiResponse<CustomerDto>), StatusCodes.Status400BadRequest)]
    [ProducesResponseType(typeof(ApiResponse<CustomerDto>), StatusCodes.Status404NotFound)]
    public async Task<IActionResult> UpdateCustomer(int id, [FromBody] UpdateCustomerDto dto)
    {
        if (!ModelState.IsValid)
        {
            var errors = ModelState.Values
                .SelectMany(v => v.Errors)
                .Select(e => e.ErrorMessage)
                .ToList();
            return BadRequest(ApiResponse<CustomerDto>.Fail("Validation failed.", errors));
        }

        var result = await _customerService.UpdateCustomerAsync(id, dto, CurrentUserId ?? string.Empty, CurrentUserRole ?? string.Empty);
        if (!result.Success)
        {
            return BadRequest(ApiResponse<CustomerDto>.Fail(result.Message));
        }

        return Ok(ApiResponse<CustomerDto>.Ok(result.Customer!, result.Message));
    }

    /// <summary>
    /// Soft-deletes a customer record.
    /// </summary>
    [HttpDelete("{id:int}")]
    [ProducesResponseType(StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> DeleteCustomer(int id)
    {
        var result = await _customerService.DeleteCustomerAsync(id, CurrentUserId ?? string.Empty, CurrentUserRole ?? string.Empty);
        if (!result.Success)
        {
            return NotFound(ApiResponse<bool>.Fail(result.Message));
        }

        return Ok(ApiResponse<bool>.Ok(true, result.Message));
    }

    /// <summary>
    /// Helper endpoint for real-time client-side duplicate checking on blur.
    /// </summary>
    [HttpGet("check-duplicate")]
    public async Task<IActionResult> CheckDuplicate([FromQuery] string? email, [FromQuery] string? phone, [FromQuery] int? excludeId)
    {
        var isEmailUnique = string.IsNullOrWhiteSpace(email) || await _customerService.IsEmailUniqueAsync(email.Trim(), excludeId);
        var isPhoneUnique = string.IsNullOrWhiteSpace(phone) || await _customerService.IsPhoneUniqueAsync(phone.Trim(), excludeId);

        return Ok(ApiResponse<object>.Ok(new
        {
            IsEmailUnique = isEmailUnique,
            IsPhoneUnique = isPhoneUnique
        }));
    }
}
