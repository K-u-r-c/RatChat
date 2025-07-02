namespace Application.EmojiPreferences.DTOs;

public class SetEmojiPreferenceDto
{
    public required string ChatType { get; set; }
    public required string ChatId { get; set; }
    public required string DefaultEmoji { get; set; }
}
