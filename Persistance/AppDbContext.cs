using Domain;
using Microsoft.AspNetCore.Identity.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Storage.ValueConversion;

namespace Persistance;

public class AppDbContext(DbContextOptions options) : IdentityDbContext<User>(options)
{
    public required DbSet<ChatRoom> ChatRooms { get; set; }
    public required DbSet<ChatRoomMember> ChatRoomMembers { get; set; }
    public required DbSet<Message> Messages { get; set; }
    public required DbSet<UserFollowing> UserFollowings { get; set; }
    public required DbSet<MediaFile> MediaFiles { get; set; }

    protected override void OnModelCreating(ModelBuilder builder)
    {
        base.OnModelCreating(builder);

        builder.Entity<ChatRoomMember>(x => x.HasKey(a => new { a.ChatRoomId, a.UserId }));

        builder.Entity<ChatRoomMember>()
            .HasOne(x => x.User)
            .WithMany(x => x.ChatRooms)
            .HasForeignKey(x => x.UserId);

        builder.Entity<ChatRoomMember>()
            .HasOne(x => x.ChatRoom)
            .WithMany(x => x.Members)
            .HasForeignKey(x => x.ChatRoomId);

        builder.Entity<UserFollowing>(x =>
        {
            x.HasKey(k => new { k.ObserverId, k.TargetId });
            x.HasOne(o => o.Observer)
                .WithMany(f => f.Followings)
                .HasForeignKey(o => o.ObserverId)
                .OnDelete(DeleteBehavior.Cascade);

            x.HasOne(o => o.Target)
                .WithMany(f => f.Followers)
                .HasForeignKey(o => o.TargetId)
                .OnDelete(DeleteBehavior.NoAction);
        });

        builder.Entity<MediaFile>(x =>
       {
           x.HasKey(m => m.Id);
           x.Property(m => m.PublicId).IsRequired();
           x.Property(m => m.Url).IsRequired();
           x.Property(m => m.MediaType).IsRequired();
           x.Property(m => m.OriginalFileName).IsRequired();
           x.Property(m => m.Category).IsRequired();
           x.Property(m => m.UploadedById).IsRequired();
           x.Property(m => m.FileHash).IsRequired();
           x.Property(m => m.ReferenceCount).HasDefaultValue(1);

           // Index for performance
           x.HasIndex(m => m.FileHash);
           x.HasIndex(m => m.PublicId);
           x.HasIndex(m => new { m.Category, m.ChatRoomId });

           // Relationships
           x.HasOne(m => m.UploadedBy)
               .WithMany()
               .HasForeignKey(m => m.UploadedById)
               .OnDelete(DeleteBehavior.Cascade);

           x.HasOne(m => m.ChatRoom)
               .WithMany()
               .HasForeignKey(m => m.ChatRoomId)
               .OnDelete(DeleteBehavior.Cascade);
       });

        var dateTimeConverter = new ValueConverter<DateTime, DateTime>(
            v => v.ToUniversalTime(),
            v => DateTime.SpecifyKind(v, DateTimeKind.Utc)
        );

        foreach (var entityType in builder.Model.GetEntityTypes())
        {
            foreach (var property in entityType.GetProperties())
            {
                if (property.ClrType == typeof(DateTime))
                {
                    property.SetValueConverter(dateTimeConverter);
                }
            }
        }
    }
}