namespace Application.Interfaces;

public interface IVoiceChannelPresenceService
{
    VoiceChannelJoinResult JoinChannel(string channelId, VoiceParticipantConnection participant);
    VoiceChannelLeaveResult? LeaveChannel(string connectionId);
    bool TryGetConnection(string connectionId, out VoiceParticipantConnection participant);
    IReadOnlyCollection<VoiceParticipantConnection> GetParticipants(string channelId);
}

public class VoiceParticipantConnection
{
    public required string ConnectionId { get; init; }
    public required string UserId { get; init; }
    public required string DisplayName { get; init; }
    public required string Slug { get; init; }
    public string? ImageUrl { get; init; }
    public required string ChatRoomId { get; init; }
    public required string ChannelId { get; set; }
}

public class VoiceChannelJoinResult
{
    public required string ChannelId { get; init; }
    public required VoiceParticipantConnection Participant { get; init; }
    public required IReadOnlyCollection<VoiceParticipantConnection> Participants { get; init; }
    public bool IsFirstConnectionForUser { get; init; }
}

public class VoiceChannelLeaveResult
{
    public required string ChannelId { get; init; }
    public required VoiceParticipantConnection Participant { get; init; }
    public bool UserHasOtherConnections { get; init; }
}
