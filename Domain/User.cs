using Domain.Enums;
using Microsoft.AspNetCore.Identity;

namespace Domain;

public class User : IdentityUser
{
    public string? DisplayName { get; set; }
    public string? Bio { get; set; }
    public string? ImageUrl { get; set; }
    public string? BannerUrl { get; set; }
    public string Slug { get; set; } = string.Empty;
    // Globally unique, non-reused numeric tag (e.g., DisplayName#2137)
    public int Tag { get; set; }
    public UserStatus Status { get; set; } = UserStatus.Online;
    public DateTime LastSeen { get; set; } = DateTime.UtcNow;

    // Navigation properties
    public ICollection<ChatRoomMember> ChatRooms { get; set; } = [];
    public ICollection<UserFriend> Friends { get; set; } = [];
    public ICollection<UserFriend> FriendOf { get; set; } = [];
    public ICollection<FriendRequest> SentFriendRequests { get; set; } = [];
    public ICollection<FriendRequest> ReceivedFriendRequests { get; set; } = [];

    public ICollection<ChatRoom> OwnedChatRooms { get; set; } = [];
    public ICollection<ChatRoomMemberRole> AssignedRoles { get; set; } = [];
    public ICollection<ChatRoomBan> Bans { get; set; } = [];
}
