namespace Application.EncryptedDirectMessages.DTOs;

public class EncryptedDirectMessageDto
{
    public required string Id { get; set; }
    public required string CipherText { get; set; }
    public string? CipherTextMetadata { get; set; }
    public string Version { get; set; } = "v1";
    public DateTime CreatedAt { get; set; }
    public required string SenderId { get; set; }
    public required string SenderDisplayName { get; set; }
    public required string SenderSlug { get; set; }
    public string? SenderImageUrl { get; set; }
    public bool IsOwnMessage { get; set; }
    public string Type { get; set; } = "Text";

    public string? ReplyToMessageId { get; set; }
    public string? ReplyToCipherText { get; set; }
    public string? ReplyToCipherTextMetadata { get; set; }
    public string? ReplyToVersion { get; set; }
    public string? ReplyToSenderId { get; set; }
    public string? ReplyToSenderDisplayName { get; set; }

    public List<Application.Messages.DTOs.MessageReactionDto> Reactions { get; set; } = [];
}
