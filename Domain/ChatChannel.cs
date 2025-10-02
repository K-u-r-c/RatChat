using Domain.Enums;

namespace Domain;

public class ChatChannel
{
    public string Id { get; set; } = Guid.NewGuid().ToString();
    public required string ChatRoomId { get; set; }
    public ChatRoom ChatRoom { get; set; } = null!;
    public required string Name { get; set; }
    public ChatChannelType Type { get; set; } = ChatChannelType.Voice;
    public int Position { get; set; }
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
}
