using System.Text.Json;
using AcxiomCRM.Backend.Models.DTOs.Common;
using AcxiomCRM.Backend.Models.DTOs.Customer;
using AcxiomCRM.Backend.Models.DTOs.Lead;
using AcxiomCRM.Backend.Models.DTOs.Opportunity;
using AcxiomCRM.Backend.Models.Enums;
using Xunit;

namespace AcxiomCRM.Tests;

public class RestApiDtoTests
{
    [Fact]
    public void ApiResponse_SuccessResponse_SetsStandardEnvelope()
    {
        var sampleCustomer = new CustomerDto
        {
            Id = 101,
            CustomerCode = "CUST-101",
            Name = "Acme Corp",
            Email = "contact@acme.com",
            Phone = "9876543210",
            Status = CustomerStatus.Active
        };

        var response = ApiResponse<CustomerDto>.SuccessResponse(sampleCustomer, "Customer retrieved.");

        Assert.True(response.Success);
        Assert.Equal("Customer retrieved.", response.Message);
        Assert.NotNull(response.Data);
        Assert.Equal(101, response.Data.Id);
        Assert.Empty(response.Errors);
    }

    [Fact]
    public void ApiResponse_ErrorResponse_SetsFailureAndErrorsList()
    {
        var errors = new List<string> { "Email is required.", "Phone number is invalid." };
        var response = ApiResponse<CustomerDto>.ErrorResponse("Validation failed.", errors);

        Assert.False(response.Success);
        Assert.Equal("Validation failed.", response.Message);
        Assert.Null(response.Data);
        Assert.Equal(2, response.Errors.Count);
        Assert.Contains("Email is required.", response.Errors);
    }

    [Theory]
    [InlineData(25, 10, 3)]
    [InlineData(10, 10, 1)]
    [InlineData(0, 10, 0)]
    [InlineData(31, 5, 7)]
    public void PagedResult_CalculatesTotalPagesCorrectly(int totalCount, int pageSize, int expectedTotalPages)
    {
        var pagedResult = new PagedResult<LeadDto>
        {
            Items = new List<LeadDto>(),
            TotalCount = totalCount,
            PageNumber = 1,
            PageSize = pageSize
        };

        Assert.Equal(expectedTotalPages, pagedResult.TotalPages);
    }

    [Fact]
    public void DtoSerialization_ProducesValidCleanJsonWithoutCycles()
    {
        var oppDto = new OpportunityDto
        {
            Id = 301,
            Title = "Cloud Migration",
            Amount = 75000m,
            Stage = OpportunityStage.Proposal,
            Probability = 60,
            ExpectedCloseDate = DateTime.UtcNow.AddDays(30),
            CustomerName = "Enterprise Global"
        };

        var json = JsonSerializer.Serialize(oppDto);
        Assert.Contains("\"Title\":\"Cloud Migration\"", json);
        Assert.Contains("\"Amount\":75000", json);
        Assert.Contains("\"CustomerName\":\"Enterprise Global\"", json);
    }
}
