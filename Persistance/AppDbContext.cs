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
    public required DbSet<MediaFile> MediaFiles { get; set; }
    public required DbSet<UserFriend> UserFriends { get; set; }
    public required DbSet<FriendRequest> FriendRequests { get; set; }
    public required DbSet<ChatRoomRole> ChatRoomRoles { get; set; }
    public required DbSet<ChatRoomMemberRole> ChatRoomMemberRoles { get; set; }
    public required DbSet<ChatRoomPermission> ChatRoomPermissions { get; set; }
    public required DbSet<ChatRoomRolePermission> ChatRoomRolePermissions { get; set; }

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

        builder.Entity<ChatRoom>()
            .HasOne(cr => cr.Owner)
            .WithMany(o => o.OwnedChatRooms)
            .HasForeignKey(cr => cr.OwnerId)
            .OnDelete(DeleteBehavior.Restrict);

        builder.Entity<ChatRoomRole>(entity =>
        {
            entity.HasKey(r => r.Id);

            entity.Property(r => r.Name).IsRequired().HasMaxLength(50);
            entity.Property(r => r.Description).IsRequired().HasMaxLength(200);
            entity.Property(r => r.Color).IsRequired().HasMaxLength(7);

            entity.HasOne(r => r.ChatRoom)
                .WithMany(cr => cr.Roles)
                .HasForeignKey(cr => cr.ChatRoomId)
                .OnDelete(DeleteBehavior.Cascade);

            entity.HasIndex(r => new { r.ChatRoomId, r.Name }).IsUnique();
        });

        builder.Entity<UserFriend>(x =>
        {
            x.HasKey(k => new { k.UserId, k.FriendId });

            x.HasOne(f => f.User)
                .WithMany(u => u.Friends)
                .HasForeignKey(f => f.UserId)
                .OnDelete(DeleteBehavior.Cascade);

            x.HasOne(f => f.Friend)
                .WithMany(u => u.FriendOf)
                .HasForeignKey(f => f.FriendId)
                .OnDelete(DeleteBehavior.NoAction);
        });

        builder.Entity<FriendRequest>(x =>
        {
            x.HasKey(fr => fr.Id);

            x.HasOne(fr => fr.Sender)
                .WithMany(u => u.SentFriendRequests)
                .HasForeignKey(fr => fr.SenderId)
                .OnDelete(DeleteBehavior.Cascade);

            x.HasOne(fr => fr.Receiver)
                .WithMany(u => u.ReceivedFriendRequests)
                .HasForeignKey(fr => fr.ReceiverId)
                .OnDelete(DeleteBehavior.NoAction);

            // Prevent duplicate friend requests
            x.HasIndex(fr => new { fr.SenderId, fr.ReceiverId })
                .IsUnique()
                .HasFilter("[Status] = 0"); // Only for pending requests
        });

        builder.Entity<User>()
            .HasIndex(u => u.FriendCode)
            .IsUnique();

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