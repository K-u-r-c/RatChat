namespace Application.Friends.DTOs;

public class FriendSearchDto
{
    public required string Id { get; set; }
    public required string DisplayName { get; set; }
    public required string FriendCode { get; set; }
    public string? ImageUrl { get; set; }
    public bool IsAlreadyFriend { get; set; }
    public bool HasPendingRequest { get; set; }
}