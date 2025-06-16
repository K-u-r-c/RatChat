namespace Application.DirectMessages.DTOs;

public class DirectMessageDto
{
    public required string Id { get; set; }
    public required string Body { get; set; }
    public DateTime CreatedAt { get; set; }
    public required string SenderId { get; set; }
    public required string SenderDisplayName { get; set; }
    public string? SenderImageUrl { get; set; }
    public bool IsRead { get; set; }
    public bool IsOwnMessage { get; set; }
}