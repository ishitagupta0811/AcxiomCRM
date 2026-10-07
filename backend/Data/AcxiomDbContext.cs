using Microsoft.AspNetCore.Identity.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore;
using AcxiomCRM.Backend.Models.Entities;

namespace AcxiomCRM.Backend.Data;

public class AcxiomDbContext : IdentityDbContext<ApplicationUser, ApplicationRole, string>
{
    public AcxiomDbContext(DbContextOptions<AcxiomDbContext> options) : base(options)
    {
    }

    public DbSet<Customer> Customers => Set<Customer>();
    public DbSet<Lead> Leads => Set<Lead>();
    public DbSet<Opportunity> Opportunities => Set<Opportunity>();
    public DbSet<FollowUp> FollowUps => Set<FollowUp>();
    public DbSet<Activity> Activities => Set<Activity>();
    public DbSet<AuditLog> AuditLogs => Set<AuditLog>();

    protected override void OnModelCreating(ModelBuilder builder)
    {
        base.OnModelCreating(builder);

        // Rename Identity tables for cleaner database schema
        builder.Entity<ApplicationUser>(b =>
        {
            b.ToTable("Users");
            b.Property(u => u.FullName).HasMaxLength(100).IsRequired();
            b.Property(u => u.Department).HasMaxLength(100);
        });

        builder.Entity<ApplicationRole>(b =>
        {
            b.ToTable("Roles");
            b.Property(r => r.Description).HasMaxLength(250);
        });

        // Customer Entity Configuration & Indexes
        builder.Entity<Customer>(b =>
        {
            b.ToTable("Customers");
            b.HasIndex(c => c.CustomerCode).IsUnique();
            b.HasIndex(c => c.Email).IsUnique();
            b.HasIndex(c => c.Phone).IsUnique();
            b.HasQueryFilter(c => !c.IsDeleted);

            b.HasOne(c => c.Owner)
                .WithMany(u => u.AssignedCustomers)
                .HasForeignKey(c => c.OwnerId)
                .OnDelete(DeleteBehavior.Restrict);
        });

        // Lead Entity Configuration & Indexes
        builder.Entity<Lead>(b =>
        {
            b.ToTable("Leads");
            b.HasIndex(l => l.LeadCode).IsUnique();
            b.HasIndex(l => l.Email);
            b.HasIndex(l => l.Phone);
            b.HasQueryFilter(l => !l.IsDeleted);

            b.HasOne(l => l.AssignedUser)
                .WithMany(u => u.AssignedLeads)
                .HasForeignKey(l => l.AssignedTo)
                .OnDelete(DeleteBehavior.SetNull);
        });

        // Opportunity Entity Configuration
        builder.Entity<Opportunity>(b =>
        {
            b.ToTable("Opportunities");
            b.HasQueryFilter(o => !o.IsDeleted);

            b.HasOne(o => o.Customer)
                .WithMany(c => c.Opportunities)
                .HasForeignKey(o => o.CustomerId)
                .OnDelete(DeleteBehavior.Cascade);

            b.HasOne(o => o.Lead)
                .WithMany(l => l.Opportunities)
                .HasForeignKey(o => o.LeadId)
                .OnDelete(DeleteBehavior.SetNull);

            b.HasOne(o => o.AssignedUser)
                .WithMany(u => u.AssignedOpportunities)
                .HasForeignKey(o => o.AssignedTo)
                .OnDelete(DeleteBehavior.SetNull);
        });

        // FollowUp Entity Configuration
        builder.Entity<FollowUp>(b =>
        {
            b.ToTable("FollowUps");

            b.HasOne(f => f.Customer)
                .WithMany(c => c.FollowUps)
                .HasForeignKey(f => f.CustomerId)
                .OnDelete(DeleteBehavior.Cascade);

            b.HasOne(f => f.Lead)
                .WithMany(l => l.FollowUps)
                .HasForeignKey(f => f.LeadId)
                .OnDelete(DeleteBehavior.Cascade);

            b.HasOne(f => f.Opportunity)
                .WithMany(o => o.FollowUps)
                .HasForeignKey(f => f.OpportunityId)
                .OnDelete(DeleteBehavior.Cascade);

            b.HasOne(f => f.AssignedUser)
                .WithMany(u => u.AssignedFollowUps)
                .HasForeignKey(f => f.AssignedTo)
                .OnDelete(DeleteBehavior.SetNull);
        });

        // Activity Entity Configuration
        builder.Entity<Activity>(b =>
        {
            b.ToTable("Activities");

            b.HasOne(a => a.Customer)
                .WithMany(c => c.Activities)
                .HasForeignKey(a => a.CustomerId)
                .OnDelete(DeleteBehavior.Cascade);

            b.HasOne(a => a.Lead)
                .WithMany(l => l.Activities)
                .HasForeignKey(a => a.LeadId)
                .OnDelete(DeleteBehavior.Cascade);

            b.HasOne(a => a.AssignedUser)
                .WithMany(u => u.AssignedActivities)
                .HasForeignKey(a => a.AssignedTo)
                .OnDelete(DeleteBehavior.SetNull);
        });

        // AuditLog Configuration
        builder.Entity<AuditLog>(b =>
        {
            b.ToTable("AuditLogs");
            b.HasIndex(a => a.CreatedDate);
            b.HasIndex(a => a.Action);
            b.HasIndex(a => a.EntityName);

            b.HasOne(a => a.User)
                .WithMany(u => u.AuditLogs)
                .HasForeignKey(a => a.UserId)
                .OnDelete(DeleteBehavior.SetNull);
        });
    }
}
