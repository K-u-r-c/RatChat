namespace Domain;

public class EncryptedDirectChatNotification
{
    public Guid Id { get; set; }
    public required string UserId { get; set; }
    public required string EncryptedDirectChatId { get; set; }
    public int UnreadCount { get; set; }
    public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;
}
