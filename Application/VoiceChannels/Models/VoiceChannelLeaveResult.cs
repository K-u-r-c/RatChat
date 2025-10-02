namespace Application.VoiceChannels.Models;

public class VoiceChannelLeaveResult
{
    public required string ChannelId { get; init; }
    public required VoiceParticipantConnection Participant { get; init; }
    public bool UserHasOtherConnections { get; init; }
}