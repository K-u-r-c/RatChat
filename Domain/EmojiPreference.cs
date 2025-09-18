namespace Domain;

public class EmojiPreference
{
    public string Id { get; set; } = Guid.NewGuid().ToString();
    public required string UserId { get; set; }
    public User User { get; set; } = null!;
    public required string ChatType { get; set; }
    public required string ChatId { get; set; }
    public required string DefaultEmoji { get; set; } = "👍";
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;
}