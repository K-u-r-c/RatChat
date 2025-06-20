namespace Application.Profiles.DTOs;

public class UserProfileDto
{
    public required string Id { get; set; }
    public required string DisplayName { get; set; }
    public string? Bio { get; set; }
    public string? ImageUrl { get; set; }
    public string? BannerUrl { get; set; }
    public bool IsFriend { get; set; }
    public int FriendsCount { get; set; }
    public bool IsOnline { get; set; }
    public DateTime? LastSeen { get; set; }
    public string Status { get; set; } = "Offline";
}
