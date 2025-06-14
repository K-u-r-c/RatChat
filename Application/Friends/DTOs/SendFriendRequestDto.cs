namespace Application.Friends.DTOs;

public class SendFriendRequestDto
{
    public required string FriendCode { get; set; }
    public string? Message { get; set; }
}