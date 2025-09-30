namespace Application.Messages.DTOs;

public class MessageDto
{
    public required string Id { get; set; }
    public required string Body { get; set; }
    public DateTime CreatedAt { get; set; }
    public required string UserId { get; set; }
    public required string UserSlug { get; set; }
    public required string DisplayName { get; set; }
    public string? ImageUrl { get; set; }
    public string Type { get; set; } = "Text";
    public required string ChannelId { get; set; }

    public string? MediaUrl { get; set; }
    public string? MediaPublicId { get; set; }
    public string? MediaType { get; set; }
    public long? MediaFileSize { get; set; }
    public string? MediaOriginalFileName { get; set; }

    // Reply metadata
    public string? ReplyToMessageId { get; set; }
    public string? ReplyToDisplayName { get; set; }
    public string? ReplyToBody { get; set; }
    public string? ReplyToType { get; set; }
    public string? ReplyToMediaOriginalFileName { get; set; }

    public List<MessageReactionDto> Reactions { get; set; } = [];
}
