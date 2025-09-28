using Application.VoiceChannels.Models;

namespace Application.Interfaces;

public interface IVoiceChannelPresenceService
{
    VoiceChannelJoinResult JoinChannel(string channelId, VoiceParticipantConnection participant);
    VoiceChannelLeaveResult? LeaveChannel(string connectionId);
    bool TryGetConnection(string connectionId, out VoiceParticipantConnection participant);
    IReadOnlyCollection<VoiceParticipantConnection> GetParticipants(string channelId);
    void UpdateMediaState(string connectionId, bool isCameraEnabled, bool isScreenSharing);
}