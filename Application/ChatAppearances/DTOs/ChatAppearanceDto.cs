namespace Application.ChatAppearances.DTOs;

public class ChatAppearanceDto
{
    public required string Id { get; set; }
    public required string ChatType { get; set; }
    public required string ChatId { get; set; }
    public required string DefaultEmoji { get; set; }
    public required string BackgroundKey { get; set; }
    public string? UpdatedByUserId { get; set; }
    public DateTime UpdatedAt { get; set; }
}
