namespace AcxiomCRM.Backend.Models.Enums;

public static class UserRoles
{
    public const string Admin = "Admin";
    public const string Manager = "Manager";
    public const string SalesExecutive = "SalesExecutive";

    public static readonly IReadOnlyList<string> All = new[]
    {
        Admin,
        Manager,
        SalesExecutive
    };
}
