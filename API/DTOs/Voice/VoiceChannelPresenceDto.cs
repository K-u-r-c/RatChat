namespace API.DTOs.Voice;

public class VoiceChannelPresenceDto
{
    public required string ChannelId { get; set; }
    public List<VoiceParticipantDto> Participants { get; set; } = [];
}