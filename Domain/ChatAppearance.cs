namespace Domain;

public class ChatAppearance
{
    public string Id { get; set; } = Guid.NewGuid().ToString();
    public required string ChatType { get; set; }
    public required string ChatId { get; set; }
    public string DefaultEmoji { get; set; } = "\uD83D\uDC4D";
    public string BackgroundKey { get; set; } = "default";
    public string? BackgroundCustomUrl { get; set; }
    public string? BackgroundCustomPublicId { get; set; }
    public string? UpdatedByUserId { get; set; }
    public User? UpdatedByUser { get; set; }
    public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;
}