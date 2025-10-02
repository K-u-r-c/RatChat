namespace Domain;

public class ChatRoomNotification
{
    public Guid Id { get; set; }
    public required string UserId { get; set; }
    public required string ChatRoomId { get; set; }
    public int UnreadCount { get; set; }
    public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;
}
