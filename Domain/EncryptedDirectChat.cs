namespace Domain;

public class EncryptedDirectChat
{
    public string Id { get; set; } = Guid.NewGuid().ToString();
    public required string User1Id { get; set; }
    public User User1 { get; set; } = null!;
    public required string User2Id { get; set; }
    public User User2 { get; set; } = null!;
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public DateTime LastActivityAt { get; set; } = DateTime.UtcNow;
    public string? LastMessageSenderId { get; set; }

    public ICollection<EncryptedDirectMessage> Messages { get; set; } = [];
}
