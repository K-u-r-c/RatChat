namespace Domain;

public class EncryptedDirectMessageReaction
{
    public string Id { get; set; } = Guid.NewGuid().ToString();

    public required string EncryptedDirectMessageId { get; set; }
    public EncryptedDirectMessage EncryptedDirectMessage { get; set; } = null!;

    public required string UserId { get; set; }
    public User User { get; set; } = null!;

    public required string Emoji { get; set; }
    public required string EmojiKey { get; set; }
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
}
