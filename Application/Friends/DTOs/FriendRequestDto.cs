namespace Application.Friends.DTOs;

public class FriendRequestDto
{
    public required string Id { get; set; }
    public required string SenderId { get; set; }
    public required string SenderDisplayName { get; set; }
    public string? SenderImageUrl { get; set; }
    public required string ReceiverId { get; set; }
    public required string ReceiverDisplayName { get; set; }
    public string? ReceiverImageUrl { get; set; }
    public required string Status { get; set; }
    public DateTime CreatedAt { get; set; }
    public DateTime? RespondedAt { get; set; }
    public string? Message { get; set; }
}