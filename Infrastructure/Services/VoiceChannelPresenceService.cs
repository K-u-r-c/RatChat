using System.Collections.Concurrent;
using Application.Interfaces;
using Application.VoiceChannels.Models;

namespace Infrastructure.Services;

public class VoiceChannelPresenceService : IVoiceChannelPresenceService
{
    private readonly ConcurrentDictionary<string, ConcurrentDictionary<string, VoiceParticipantConnection>> _channels =
        new();

    private readonly ConcurrentDictionary<string, VoiceParticipantConnection> _connections = new();

    public void UpdateMediaState(string connectionId, bool isCameraEnabled, bool isScreenSharing)
    {
        if (!_connections.TryGetValue(connectionId, out var participant)) return;

        participant.IsCameraEnabled = isCameraEnabled;
        participant.IsScreenSharing = isScreenSharing;

        if (_channels.TryGetValue(participant.ChannelId, out var channel) &&
            channel.TryGetValue(connectionId, out var channelParticipant))
        {
            channelParticipant.IsCameraEnabled = isCameraEnabled;
            channelParticipant.IsScreenSharing = isScreenSharing;
        }
    }

    public VoiceChannelJoinResult JoinChannel(string channelId, VoiceParticipantConnection participant)
    {
        participant.ChannelId = channelId;
        _connections[participant.ConnectionId] = participant;

        var channel = _channels.GetOrAdd(
            channelId,
            _ => new ConcurrentDictionary<string, VoiceParticipantConnection>());

        channel[participant.ConnectionId] = participant;

        var participants = channel.Values.ToList();
        var isFirstForUser = participants.Count(x => x.UserId == participant.UserId) == 1;

        return new VoiceChannelJoinResult
        {
            ChannelId = channelId,
            Participant = participant,
            Participants = participants,
            IsFirstConnectionForUser = isFirstForUser
        };
    }

    public VoiceChannelLeaveResult? LeaveChannel(string connectionId)
    {
        if (!_connections.TryRemove(connectionId, out var participant)) return null;

        if (!_channels.TryGetValue(participant.ChannelId, out var channel))
            return new VoiceChannelLeaveResult
            {
                ChannelId = participant.ChannelId,
                Participant = participant,
                UserHasOtherConnections = false
            };

        channel.TryRemove(connectionId, out _);
        var userHasOthers = channel.Values.Any(x => x.UserId == participant.UserId);

        if (channel.IsEmpty) _channels.TryRemove(participant.ChannelId, out _);

        return new VoiceChannelLeaveResult
        {
            ChannelId = participant.ChannelId,
            Participant = participant,
            UserHasOtherConnections = userHasOthers
        };
    }

    public bool TryGetConnection(string connectionId, out VoiceParticipantConnection participant)
    {
        return _connections.TryGetValue(connectionId, out participant!);
    }

    public IReadOnlyCollection<VoiceParticipantConnection> GetParticipants(string channelId)
    {
        if (!_channels.TryGetValue(channelId, out var channel)) return Array.Empty<VoiceParticipantConnection>();

        return channel.Values.ToList();
    }
}