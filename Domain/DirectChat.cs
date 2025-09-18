namespace Domain;

public class DirectChat
{
    public string Id { get; set; } = Guid.NewGuid().ToString();
    public required string User1Id { get; set; }
    public User User1 { get; set; } = null!;
    public required string User2Id { get; set; }
    public User User2 { get; set; } = null!;
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public DateTime LastMessageAt { get; set; } = DateTime.UtcNow;
    public string? LastMessageBody { get; set; }
    public string? LastMessageSenderId { get; set; }

    // Navigation properties
    public ICollection<DirectMessage> Messages { get; set; } = [];
}