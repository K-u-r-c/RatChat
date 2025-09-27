namespace API.DTOs.Voice;

public class VoicePeerUpdateDto
{
    public required string ChannelId { get; set; }
    public required VoiceParticipantDto Participant { get; set; }
}