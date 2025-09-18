namespace Domain;

public class DirectMessageReaction
{
    public string Id { get; set; } = Guid.NewGuid().ToString();

    public required string DirectMessageId { get; set; }
    public DirectMessage DirectMessage { get; set; } = null!;

    public required string UserId { get; set; }
    public User User { get; set; } = null!;

    public required string Emoji { get; set; }
    public required string EmojiKey { get; set; }
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
}

