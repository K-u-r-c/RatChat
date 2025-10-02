namespace API.DTOs.Voice;

public class VoiceChannelPresenceSnapshotDto
{
    public required string ChatRoomId { get; set; }
    public List<VoiceChannelPresenceDto> Channels { get; set; } = [];
}