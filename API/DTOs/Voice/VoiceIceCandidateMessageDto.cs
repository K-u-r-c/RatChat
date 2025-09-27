namespace API.DTOs.Voice;

public class VoiceIceCandidateMessageDto
{
    public required string ChannelId { get; set; }
    public required string FromConnectionId { get; set; }
    public required IceCandidateDto Candidate { get; set; }
}