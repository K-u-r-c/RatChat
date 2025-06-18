using Domain.Enums;

namespace Domain;

public class Message
{
    public string Id { get; set; } = Guid.NewGuid().ToString();
    public required string Body { get; set; }
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public MessageType Type { get; set; } = MessageType.Text;

    // Media properties
    public string? MediaUrl { get; set; }
    public string? MediaPublicId { get; set; }
    public string? MediaType { get; set; }
    public long? MediaFileSize { get; set; }
    public string? MediaOriginalFileName { get; set; }

    public required string UserId { get; set; }
    public User User { get; set; } = null!;
    public required string ChatRoomId { get; set; }
    public ChatRoom ChatRoom { get; set; } = null!;
}
