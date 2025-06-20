namespace Application.DirectChats.DTOs;

public class DirectChatDto
{
    public required string Id { get; set; }
    public required string OtherUserId { get; set; }
    public required string OtherUserDisplayName { get; set; }
    public string? OtherUserImageUrl { get; set; }
    public DateTime LastMessageAt { get; set; }
    public string? LastMessageBody { get; set; }
    public string? LastMessageSenderId { get; set; }
    public int UnreadCount { get; set; }
    public bool CanSendMessages { get; set; }
    public bool IsOnline { get; set; }
    public DateTime? LastSeen { get; set; }
    public string Status { get; set; } = "Offline";
}