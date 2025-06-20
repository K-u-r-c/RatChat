namespace Application.Friends.DTOs;

public class FriendDto
{
    public required string Id { get; set; }
    public required string DisplayName { get; set; }
    public string? Bio { get; set; }
    public string? ImageUrl { get; set; }
    public string? BannerUrl { get; set; }
    public DateTime FriendsSince { get; set; }
    public bool IsOnline { get; set; }
    public DateTime? LastSeen { get; set; }
    public string Status { get; set; } = "Offline";
    public string? CustomStatusMessage { get; set; }
}