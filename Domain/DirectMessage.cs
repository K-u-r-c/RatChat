using Domain.Enums;

namespace Domain;

public class DirectMessage
{
    public string Id { get; set; } = Guid.NewGuid().ToString();
    public required string Body { get; set; }
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public bool IsRead { get; set; } = false;
    public MessageType Type { get; set; } = MessageType.Text;

    // Media properties
    public string? MediaUrl { get; set; }
    public string? MediaPublicId { get; set; }
    public string? MediaType { get; set; }
    public long? MediaFileSize { get; set; }
    public string? MediaOriginalFileName { get; set; }

    public required string SenderId { get; set; }
    public User Sender { get; set; } = null!;
    public required string DirectChatId { get; set; }
    public DirectChat DirectChat { get; set; } = null!;
}