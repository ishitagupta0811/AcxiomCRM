using AcxiomCRM.Backend.Models.DTOs.Dashboard;

namespace AcxiomCRM.Backend.Services.Interfaces;

public interface IDashboardService
{
    Task<DashboardMetricsDto> GetDashboardMetricsAsync(string currentUserId, string currentUserRole);
    Task<DashboardChartsDto> GetDashboardChartsAsync(string currentUserId, string currentUserRole);
}
