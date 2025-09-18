namespace Domain;

public class DirectChatNotification
{
    public Guid Id { get; set; }
    public required string UserId { get; set; }
    public required string DirectChatId { get; set; }
    public int UnreadCount { get; set; }
    public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;
}
