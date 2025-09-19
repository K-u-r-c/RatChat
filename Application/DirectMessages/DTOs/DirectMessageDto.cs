namespace Application.DirectMessages.DTOs;

public class DirectMessageDto
{
    public required string Id { get; set; }
    public required string Body { get; set; }
    public DateTime CreatedAt { get; set; }
    public required string SenderId { get; set; }
    public required string SenderDisplayName { get; set; }
    public required string SenderSlug { get; set; }
    public string? SenderImageUrl { get; set; }
    public bool IsOwnMessage { get; set; }
    public string Type { get; set; } = "Text";

    public string? MediaUrl { get; set; }
    public string? MediaPublicId { get; set; }
    public string? MediaType { get; set; }
    public long? MediaFileSize { get; set; }
    public string? MediaOriginalFileName { get; set; }

    // Reply metadata (normalized to same names as chat messages)
    public string? ReplyToMessageId { get; set; }
    public string? ReplyToDisplayName { get; set; }
    public string? ReplyToBody { get; set; }
    public string? ReplyToType { get; set; }
    public string? ReplyToMediaOriginalFileName { get; set; }

    // Reactions (for direct messages)
    public List<Application.Messages.DTOs.MessageReactionDto> Reactions { get; set; } = [];
}
