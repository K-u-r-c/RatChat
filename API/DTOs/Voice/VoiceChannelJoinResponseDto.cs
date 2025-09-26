namespace API.DTOs.Voice;

public class VoiceChannelJoinResponseDto
{
    public required string ChannelId { get; set; }
    public required string SelfConnectionId { get; set; }
    public List<VoiceParticipantDto> Participants { get; set; } = [];
}