namespace Application.EmojiPreferences.DTOs;

public class EmojiPreferenceDto
{
    public required string Id { get; set; }
    public required string UserId { get; set; }
    public required string ChatType { get; set; }
    public required string ChatId { get; set; }
    public required string DefaultEmoji { get; set; }
    public DateTime CreatedAt { get; set; }
    public DateTime UpdatedAt { get; set; }
}