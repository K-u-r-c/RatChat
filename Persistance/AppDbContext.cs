using Domain;
using Microsoft.AspNetCore.Identity.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Storage.ValueConversion;
using Persistance.Security;

namespace Persistance;

public class AppDbContext(DbContextOptions options) : IdentityDbContext<User>(options)
{
    public required DbSet<ChatRoom> ChatRooms { get; set; }
    public required DbSet<ChatRoomMember> ChatRoomMembers { get; set; }
    public required DbSet<Message> Messages { get; set; }
    public required DbSet<MediaFile> MediaFiles { get; set; }
    public required DbSet<UserFriend> UserFriends { get; set; }
    public required DbSet<FriendRequest> FriendRequests { get; set; }
    public required DbSet<DirectChat> DirectChats { get; set; }
    public required DbSet<DirectMessage> DirectMessages { get; set; }
    public required DbSet<DirectMessageReaction> DirectMessageReactions { get; set; }
    public required DbSet<EmojiPreference> EmojiPreferences { get; set; }
    public required DbSet<ChatAppearance> ChatAppearances { get; set; }
    public required DbSet<MessageReaction> MessageReactions { get; set; }
    public required DbSet<ChatRoomRole> ChatRoomRoles { get; set; }
    public required DbSet<ChatRoomMemberRole> ChatRoomMemberRoles { get; set; }
    public required DbSet<ChatRoomPermission> ChatRoomPermissions { get; set; }
    public required DbSet<ChatRoomRolePermission> ChatRoomRolePermissions { get; set; }
    public required DbSet<ChatRoomInvite> ChatRoomInvites { get; set; }
    public required DbSet<ChatRoomNotification> ChatRoomNotifications { get; set; }
    public required DbSet<DirectChatNotification> DirectChatNotifications { get; set; }
    public required DbSet<EncryptedDirectChat> EncryptedDirectChats { get; set; }
    public required DbSet<EncryptedDirectMessage> EncryptedDirectMessages { get; set; }
    public required DbSet<EncryptedDirectMessageReaction> EncryptedDirectMessageReactions { get; set; }
    public required DbSet<EncryptedDirectChatNotification> EncryptedDirectChatNotifications { get; set; }

    public required DbSet<ChatRoomBan> ChatRoomBans { get; set; }

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

        builder.Entity<ChatRoom>(entity =>
        {
            entity.Property(cr => cr.Slug)
                .IsRequired()
                .HasMaxLength(200);

            entity.HasIndex(cr => cr.Slug)
                .IsUnique();

            entity.HasOne(cr => cr.Owner)
                .WithMany(o => o.OwnedChatRooms)
                .HasForeignKey(cr => cr.OwnerId)
                .OnDelete(DeleteBehavior.Restrict);
        });

        builder.Entity<ChatRoomRole>(entity =>
        {
            entity.HasKey(r => r.Id);

            entity.Property(r => r.Name).IsRequired().HasMaxLength(50);
            entity.Property(r => r.Color).IsRequired().HasMaxLength(7);
            entity.Property(r => r.Description).HasMaxLength(200);

            entity.HasOne(r => r.ChatRoom)
                .WithMany(cr => cr.Roles)
                .HasForeignKey(cr => cr.ChatRoomId)
                .OnDelete(DeleteBehavior.Cascade);

            entity.HasIndex(r => new { r.ChatRoomId, r.Name }).IsUnique();
        });

        builder.Entity<ChatRoomMemberRole>(entity =>
        {
            entity.HasKey(mr => new { mr.UserId, mr.ChatRoomId, mr.RoleId });

            entity.HasOne(mr => mr.User)
                .WithMany(u => u.AssignedRoles)
                .HasForeignKey(mr => mr.UserId)
                .OnDelete(DeleteBehavior.Cascade);

            entity.HasOne(mr => mr.ChatRoom)
                .WithMany()
                .HasForeignKey(mr => mr.ChatRoomId)
                .OnDelete(DeleteBehavior.NoAction);

            entity.HasOne(mr => mr.Role)
                .WithMany(r => r.MemberRoles)
                .HasForeignKey(mr => mr.RoleId)
                .OnDelete(DeleteBehavior.Cascade);
        });

        builder.Entity<ChatRoomPermission>(entity =>
        {
            entity.HasKey(p => p.Id);

            entity.Property(p => p.Name).IsRequired().HasMaxLength(50);
            entity.Property(p => p.Description).HasMaxLength(500);

            entity.HasIndex(p => p.Name).IsUnique();
        });

        builder.Entity<ChatRoomRolePermission>(entity =>
        {
            entity.HasKey(rp => new { rp.RoleId, rp.PermissionId });

            entity.HasOne(rp => rp.Role)
                .WithMany(r => r.RolePermissions)
                .HasForeignKey(rp => rp.RoleId)
                .OnDelete(DeleteBehavior.Cascade);

            entity.HasOne(rp => rp.Permission)
                .WithMany(p => p.RolePermissions)
                .HasForeignKey(rp => rp.PermissionId)
                .OnDelete(DeleteBehavior.Cascade);
        });

        builder.Entity<ChatRoomBan>(entity =>
        {
            entity.HasKey(b => new { b.UserId, b.ChatRoomId });

            entity.HasOne(b => b.User)
                .WithMany(u => u.Bans)
                .HasForeignKey(b => b.UserId)
                .OnDelete(DeleteBehavior.Cascade);

            entity.HasOne(b => b.ChatRoom)
                .WithMany(cr => cr.Bans)
                .HasForeignKey(b => b.ChatRoomId)
                .OnDelete(DeleteBehavior.Cascade);
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

        builder.Entity<DirectChat>(x =>
       {
           x.HasKey(dc => dc.Id);

           x.HasOne(dc => dc.User1)
               .WithMany()
               .HasForeignKey(dc => dc.User1Id)
               .OnDelete(DeleteBehavior.NoAction);

           x.HasOne(dc => dc.User2)
               .WithMany()
               .HasForeignKey(dc => dc.User2Id)
               .OnDelete(DeleteBehavior.NoAction);

           // Ensure no duplicate chats between same users
           x.HasIndex(dc => new { dc.User1Id, dc.User2Id })
               .IsUnique();
       });

        builder.Entity<DirectMessage>(x =>
        {
            x.HasKey(dm => dm.Id);

            // Encrypt message body at rest
            x.Property(dm => dm.Body)
                .HasConversion(EncryptedStringConverter.Instance);

            x.HasOne(dm => dm.Sender)
                .WithMany()
                .HasForeignKey(dm => dm.SenderId)
                .OnDelete(DeleteBehavior.NoAction);

            x.HasOne(dm => dm.DirectChat)
                .WithMany(dc => dc.Messages)
                .HasForeignKey(dm => dm.DirectChatId)
                .OnDelete(DeleteBehavior.Cascade);

            // Self-referencing reply relationship
            x.HasOne(dm => dm.ReplyToDirectMessage)
                .WithMany()
                .HasForeignKey(dm => dm.ReplyToDirectMessageId)
                .OnDelete(DeleteBehavior.NoAction);

            x.HasIndex(dm => new { dm.DirectChatId, dm.CreatedAt });
        });

        builder.Entity<DirectMessageReaction>(x =>
        {
            x.HasKey(r => r.Id);

            x.Property(r => r.Emoji).IsRequired().HasMaxLength(64);
            x.Property(r => r.EmojiKey).IsRequired().HasMaxLength(128);

            x.HasOne(r => r.DirectMessage)
                .WithMany(m => m.Reactions)
                .HasForeignKey(r => r.DirectMessageId)
                .OnDelete(DeleteBehavior.Cascade);

            x.HasOne(r => r.User)
                .WithMany()
                .HasForeignKey(r => r.UserId)
                .OnDelete(DeleteBehavior.NoAction);

            x.HasIndex(r => new { r.DirectMessageId, r.UserId, r.EmojiKey }).IsUnique();
            x.HasIndex(r => new { r.DirectMessageId, r.CreatedAt });
        });

        builder.Entity<EncryptedDirectChat>(x =>
        {
            x.HasKey(dc => dc.Id);

            x.HasOne(dc => dc.User1)
                .WithMany()
                .HasForeignKey(dc => dc.User1Id)
                .OnDelete(DeleteBehavior.NoAction);

            x.HasOne(dc => dc.User2)
                .WithMany()
                .HasForeignKey(dc => dc.User2Id)
                .OnDelete(DeleteBehavior.NoAction);

            x.HasIndex(dc => new { dc.User1Id, dc.User2Id })
                .IsUnique();

            x.Property(dc => dc.LastActivityAt).IsRequired();
        });

        builder.Entity<EncryptedDirectMessage>(x =>
        {
            x.HasKey(dm => dm.Id);

            x.Property(dm => dm.CipherText)
                .IsRequired();

            x.Property(dm => dm.Version)
                .HasMaxLength(10);

            x.HasOne(dm => dm.Sender)
                .WithMany()
                .HasForeignKey(dm => dm.SenderId)
                .OnDelete(DeleteBehavior.NoAction);

            x.HasOne(dm => dm.EncryptedDirectChat)
                .WithMany(dc => dc.Messages)
                .HasForeignKey(dm => dm.EncryptedDirectChatId)
                .OnDelete(DeleteBehavior.Cascade);

            x.HasOne(dm => dm.ReplyToEncryptedDirectMessage)
                .WithMany()
                .HasForeignKey(dm => dm.ReplyToEncryptedDirectMessageId)
                .OnDelete(DeleteBehavior.NoAction);

            x.HasIndex(dm => new { dm.EncryptedDirectChatId, dm.CreatedAt });
        });

        builder.Entity<EncryptedDirectMessageReaction>(x =>
        {
            x.HasKey(r => r.Id);

            x.Property(r => r.Emoji).IsRequired().HasMaxLength(64);
            x.Property(r => r.EmojiKey).IsRequired().HasMaxLength(128);

            x.HasOne(r => r.EncryptedDirectMessage)
                .WithMany(m => m.Reactions)
                .HasForeignKey(r => r.EncryptedDirectMessageId)
                .OnDelete(DeleteBehavior.Cascade);

            x.HasOne(r => r.User)
                .WithMany()
                .HasForeignKey(r => r.UserId)
                .OnDelete(DeleteBehavior.NoAction);

            x.HasIndex(r => new { r.EncryptedDirectMessageId, r.UserId, r.EmojiKey }).IsUnique();
        });

        builder.Entity<EncryptedDirectChatNotification>(entity =>
        {
            entity.HasKey(n => n.Id);
            entity.Property(n => n.UserId).IsRequired();
            entity.Property(n => n.EncryptedDirectChatId).IsRequired();
            entity.Property(n => n.UnreadCount).IsRequired();
            entity.Property(n => n.UpdatedAt).IsRequired();

            entity.HasIndex(n => new { n.UserId, n.EncryptedDirectChatId }).IsUnique();

            entity.HasOne<User>()
                .WithMany()
                .HasForeignKey(n => n.UserId)
                .OnDelete(DeleteBehavior.Cascade);

            entity.HasOne<EncryptedDirectChat>()
                .WithMany()
                .HasForeignKey(n => n.EncryptedDirectChatId)
                .OnDelete(DeleteBehavior.NoAction);
        });
        builder.Entity<Message>(x =>
        {
            // Encrypt message body at rest
            x.Property(m => m.Body)
                .HasConversion(EncryptedStringConverter.Instance);

            x.HasOne(m => m.ReplyToMessage)
                .WithMany()
                .HasForeignKey(m => m.ReplyToMessageId)
                .OnDelete(DeleteBehavior.NoAction);

            x.HasIndex(m => new { m.ChatRoomId, m.CreatedAt });
        });

        // Message reactions
        builder.Entity<MessageReaction>(x =>
        {
            x.HasKey(mr => mr.Id);

            x.Property(mr => mr.Emoji)
                .IsRequired()
                .HasMaxLength(64);

            x.Property(mr => mr.EmojiKey)
                .IsRequired()
                .HasMaxLength(128);

            x.HasOne(mr => mr.Message)
                .WithMany(m => m.Reactions)
                .HasForeignKey(mr => mr.MessageId)
                .OnDelete(DeleteBehavior.Cascade);

            x.HasOne(mr => mr.User)
                .WithMany()
                .HasForeignKey(mr => mr.UserId)
                .OnDelete(DeleteBehavior.NoAction);

            x.HasIndex(mr => new { mr.MessageId, mr.UserId, mr.EmojiKey })
                .IsUnique();

            x.HasIndex(mr => new { mr.MessageId, mr.CreatedAt });
        });

        builder.HasSequence<int>("UserTagSequence", "dbo")
            .StartsAt(1)
            .IncrementsBy(1);

        builder.Entity<User>(x =>
        {
            x.Property(u => u.Slug)
                .IsRequired()
                .HasMaxLength(200);

            x.HasIndex(u => u.Slug).IsUnique();

            x.Property(u => u.Tag)
                .ValueGeneratedOnAdd()
                .HasDefaultValueSql("NEXT VALUE FOR dbo.UserTagSequence");

            x.HasIndex(u => u.Tag).IsUnique();
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

        builder.Entity<ChatRoomInvite>(x =>
        {
            x.HasKey(ci => ci.Id);

            x.HasOne(ci => ci.ChatRoom)
                .WithMany(cr => cr.Invites)
                .HasForeignKey(ci => ci.ChatRoomId)
                .OnDelete(DeleteBehavior.Cascade);

            x.HasOne(ci => ci.CreatedByUser)
                .WithMany()
                .HasForeignKey(ci => ci.CreatedByUserId)
                .OnDelete(DeleteBehavior.NoAction);

            x.HasOne(ci => ci.AllowedUser)
                .WithMany()
                .HasForeignKey(ci => ci.AllowedUserId)
                .OnDelete(DeleteBehavior.NoAction);

            x.Property(ci => ci.Secret).IsRequired().HasMaxLength(200);

            x.HasIndex(ci => new { ci.ChatRoomId, ci.CreatedAt });
        });

        builder.Entity<EmojiPreference>(x =>
        {
            x.HasKey(ep => ep.Id);
            x.Property(ep => ep.UserId).IsRequired();
            x.Property(ep => ep.ChatType).IsRequired().HasMaxLength(20);
            x.Property(ep => ep.ChatId).IsRequired().HasMaxLength(50);
            x.Property(ep => ep.DefaultEmoji).IsRequired().HasMaxLength(10);

            x.HasIndex(ep => new { ep.UserId, ep.ChatType, ep.ChatId })
                .IsUnique();

            x.HasOne(ep => ep.User)
                .WithMany()
                .HasForeignKey(ep => ep.UserId)
                .OnDelete(DeleteBehavior.Cascade);
        });

        builder.Entity<ChatAppearance>(x =>
        {
            x.HasKey(ca => ca.Id);
            x.Property(ca => ca.ChatType).IsRequired().HasMaxLength(20);
            x.Property(ca => ca.ChatId).IsRequired().HasMaxLength(50);
            x.Property(ca => ca.DefaultEmoji).IsRequired().HasMaxLength(10);
            x.Property(ca => ca.BackgroundKey).IsRequired().HasMaxLength(50);
            x.Property(ca => ca.BackgroundCustomUrl).HasMaxLength(500);
            x.Property(ca => ca.BackgroundCustomPublicId).HasMaxLength(200);
            x.Property(ca => ca.UpdatedAt).IsRequired();

            x.HasIndex(ca => new { ca.ChatType, ca.ChatId })
                .IsUnique();

            x.HasOne(ca => ca.UpdatedByUser)
                .WithMany()
                .HasForeignKey(ca => ca.UpdatedByUserId)
                .OnDelete(DeleteBehavior.NoAction);
        });

        builder.Entity<ChatRoomNotification>(entity =>
        {
            entity.HasKey(n => n.Id);
            entity.Property(n => n.UserId).IsRequired();
            entity.Property(n => n.ChatRoomId).IsRequired();
            entity.Property(n => n.UnreadCount).IsRequired();
            entity.Property(n => n.UpdatedAt).IsRequired();

            entity.HasIndex(n => new { n.UserId, n.ChatRoomId }).IsUnique();

            entity.HasOne<User>()
                .WithMany()
                .HasForeignKey(n => n.UserId)
                .OnDelete(DeleteBehavior.Cascade);

            entity.HasOne<ChatRoom>()
                .WithMany()
                .HasForeignKey(n => n.ChatRoomId)
                .OnDelete(DeleteBehavior.Cascade);
        });

        builder.Entity<DirectChatNotification>(entity =>
        {
            entity.HasKey(n => n.Id);
            entity.Property(n => n.UserId).IsRequired();
            entity.Property(n => n.DirectChatId).IsRequired();
            entity.Property(n => n.UnreadCount).IsRequired();
            entity.Property(n => n.UpdatedAt).IsRequired();

            entity.HasIndex(n => new { n.UserId, n.DirectChatId }).IsUnique();

            entity.HasOne<User>()
                .WithMany()
                .HasForeignKey(n => n.UserId)
                .OnDelete(DeleteBehavior.Cascade);

            entity.HasOne<DirectChat>()
                .WithMany()
                .HasForeignKey(n => n.DirectChatId)
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
