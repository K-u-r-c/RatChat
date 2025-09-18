namespace Application.Friends.DTOs;

public class SendFriendRequestDto
{
    public required string ReceiverId { get; set; }
    public string? Message { get; set; }
}
