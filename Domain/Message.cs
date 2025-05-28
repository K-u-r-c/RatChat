namespace Domain;

public class Message
{
    public string Id { get; set; } = Guid.NewGuid().ToString();
    public required string Body { get; set; }
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    public required string UserId { get; set; }
    public User User { get; set; } = null!;
    public required string ChatRoomId { get; set; }
    public ChatRoom ChatRoom { get; set; } = null!;
}
