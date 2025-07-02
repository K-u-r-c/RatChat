namespace Application.EmojiPreferences.DTOs;

public class GetEmojiPreferenceDto
{
    public required string ChatType { get; set; }
    public required string ChatId { get; set; }
}
