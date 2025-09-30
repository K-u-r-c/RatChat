namespace Application.Messages.DTOs;

public class ReactionUpdateDto
{
    public required string Action { get; set; }
    public required string ChatRoomId { get; set; }
    public string? ChannelId { get; set; }
    public required string MessageId { get; set; }
    public required string Emoji { get; set; }
    public required string UserId { get; set; }
    public required string DisplayName { get; set; }
    public DateTime CreatedAt { get; set; }
}
