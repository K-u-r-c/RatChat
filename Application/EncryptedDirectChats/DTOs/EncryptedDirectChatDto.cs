namespace Application.EncryptedDirectChats.DTOs;

public class EncryptedDirectChatDto
{
    public required string Id { get; set; }
    public required string OtherUserId { get; set; }
    public required string OtherUserDisplayName { get; set; }
    public required string OtherUserSlug { get; set; }
    public string? OtherUserImageUrl { get; set; }
    public DateTime LastActivityAt { get; set; }
    public string? LastMessageSenderId { get; set; }
    public bool IsOnline { get; set; }
    public DateTime? LastSeen { get; set; }
    public string Status { get; set; } = "Offline";
}
