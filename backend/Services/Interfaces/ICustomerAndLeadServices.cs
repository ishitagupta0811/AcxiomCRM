using AcxiomCRM.Backend.Models.DTOs.Common;
using AcxiomCRM.Backend.Models.DTOs.Customer;
using AcxiomCRM.Backend.Models.DTOs.Lead;

namespace AcxiomCRM.Backend.Services.Interfaces;

public interface ICustomerService
{
    Task<PagedResult<CustomerDto>> GetCustomersAsync(CustomerSearchFilterDto filter, string currentUserId, string currentUserRole);
    Task<CustomerDto?> GetCustomerByIdAsync(int id, string currentUserId, string currentUserRole);
    Task<(bool Success, string Message, CustomerDto? Customer)> CreateCustomerAsync(CreateCustomerDto dto, string currentUserId, string currentUserRole);
    Task<(bool Success, string Message, CustomerDto? Customer)> UpdateCustomerAsync(int id, UpdateCustomerDto dto, string currentUserId, string currentUserRole);
    Task<(bool Success, string Message)> DeleteCustomerAsync(int id, string currentUserId, string currentUserRole);
    Task<bool> IsEmailUniqueAsync(string email, int? excludeCustomerId = null);
    Task<bool> IsPhoneUniqueAsync(string phone, int? excludeCustomerId = null);
}

public interface ILeadService
{
    Task<PagedResult<LeadDto>> GetLeadsAsync(LeadSearchFilterDto filter, string currentUserId, string currentUserRole);
    Task<LeadDto?> GetLeadByIdAsync(int id, string currentUserId, string currentUserRole);
    Task<(bool Success, string Message, LeadDto? Lead)> CreateLeadAsync(CreateLeadDto dto, string currentUserId, string currentUserRole);
    Task<(bool Success, string Message, LeadDto? Lead)> UpdateLeadAsync(int id, UpdateLeadDto dto, string currentUserId, string currentUserRole);
    Task<(bool Success, string Message)> DeleteLeadAsync(int id, string currentUserId, string currentUserRole);
    Task<(bool Success, string Message, int? CustomerId)> ConvertLeadAsync(LeadConversionDto dto, string currentUserId, string currentUserRole);
}
