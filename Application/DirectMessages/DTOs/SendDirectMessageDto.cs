namespace Application.DirectMessages.DTOs;

public class SendDirectMessageDto
{
    public required string Body { get; set; }
    public required string DirectChatId { get; set; }
    public string Type { get; set; } = "Text";

    public string? MediaUrl { get; set; }
    public string? MediaPublicId { get; set; }
    public string? MediaType { get; set; }
    public long? MediaFileSize { get; set; }
    public string? MediaOriginalFileName { get; set; }
}
