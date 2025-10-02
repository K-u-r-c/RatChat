namespace API.DTOs.Voice;

public class VoiceSignalMessageDto
{
    public required string ChannelId { get; set; }
    public required string FromConnectionId { get; set; }
    public required SessionDescriptionDto Description { get; set; }
}