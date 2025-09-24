namespace Application.ChatAppearances.DTOs;

public class SetChatAppearanceDto
{
    public required string ChatType { get; set; }
    public required string ChatId { get; set; }
    public string? DefaultEmoji { get; set; }
    public string? BackgroundKey { get; set; }
    public string? BackgroundCustomUrl { get; set; }
    public string? BackgroundCustomPublicId { get; set; }
}
