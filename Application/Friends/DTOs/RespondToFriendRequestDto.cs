namespace Application.Friends.DTOs;

public class RespondToFriendRequestDto
{
    public required string RequestId { get; set; }
    public required bool Accept { get; set; }
}