namespace Application.Messages.DTOs;

public class MessageReactionDto
{
    public required string MessageId { get; set; }
    public required string Emoji { get; set; }
    public required string UserId { get; set; }
    public required string DisplayName { get; set; }
    public DateTime CreatedAt { get; set; }
}
