using Domain.Enums;
using Microsoft.AspNetCore.Identity;

namespace Domain;

public class User : IdentityUser
{
    public string? DisplayName { get; set; }
    public string? Bio { get; set; }
    public string? ImageUrl { get; set; }
    public string? BannerUrl { get; set; }
    public string FriendCode { get; set; } = GenerateFriendCode();
    public UserStatus Status { get; set; } = UserStatus.Online;
    public DateTime LastSeen { get; set; } = DateTime.UtcNow;

    // Navigation properties
    public ICollection<ChatRoomMember> ChatRooms { get; set; } = [];
    public ICollection<UserFriend> Friends { get; set; } = [];
    public ICollection<UserFriend> FriendOf { get; set; } = [];
    public ICollection<FriendRequest> SentFriendRequests { get; set; } = [];
    public ICollection<FriendRequest> ReceivedFriendRequests { get; set; } = [];

    // Helper functions
    private static string GenerateFriendCode()
    {
        const string chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
        var random = new Random();
        return new string([
            .. Enumerable.Repeat(chars, 6).Select(s => s[random.Next(s.Length)])
        ]);
    }

    public void RegenerateFriendCode()
    {
        FriendCode = GenerateFriendCode();
    }
}
