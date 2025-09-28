namespace Application.VoiceChannels.Models;

public class VoiceChannelJoinResult
{
    public required string ChannelId { get; init; }
    public required VoiceParticipantConnection Participant { get; init; }
    public required IReadOnlyCollection<VoiceParticipantConnection> Participants { get; init; }
    public bool IsFirstConnectionForUser { get; init; }
}