using API.DTOs.Voice;
using Application.Interfaces;
using Application.VoiceChannels.Models;
using Domain.Enums;
using Microsoft.AspNetCore.SignalR;
using Microsoft.EntityFrameworkCore;
using Persistance;

namespace API.SignalR;

public class VoiceChannelHub(
    AppDbContext context,
    IUserAccessor userAccessor,
    IVoiceChannelPresenceService presenceService
) : Hub
{
    public override async Task OnDisconnectedAsync(Exception? exception)
    {
        await LeaveChannel();
        await base.OnDisconnectedAsync(exception);
    }

    public async Task<VoiceChannelPresenceSnapshotDto> WatchChatRoom(string chatRoomId)
    {
        var user = await userAccessor.GetUserAsync();

        var isMember = await context.ChatRoomMembers
            .AsNoTracking()
            .AnyAsync(m => m.ChatRoomId == chatRoomId && m.UserId == user.Id);

        if (!isMember) throw new HubException("You are not a member of this chat room");

        await Groups.AddToGroupAsync(Context.ConnectionId, GetChatRoomGroupName(chatRoomId));

        var voiceChannelIds = await context.ChatChannels
            .AsNoTracking()
            .Where(x => x.ChatRoomId == chatRoomId && x.Type == ChatChannelType.Voice)
            .Select(x => x.Id)
            .ToListAsync();

        var channels = voiceChannelIds
            .Select(channelId => new VoiceChannelPresenceDto
            {
                ChannelId = channelId,
                Participants = presenceService
                    .GetParticipants(channelId)
                    .Select(MapParticipant)
                    .ToList()
            })
            .ToList();

        return new VoiceChannelPresenceSnapshotDto
        {
            ChatRoomId = chatRoomId,
            Channels = channels
        };
    }

    public async Task UnwatchChatRoom(string chatRoomId)
    {
        await Groups.RemoveFromGroupAsync(Context.ConnectionId, GetChatRoomGroupName(chatRoomId));
    }

    public async Task<VoiceChannelJoinResponseDto> JoinChannel(string channelId)
    {
        await LeaveChannel();

        var user = await userAccessor.GetUserAsync();

        var channel = await context.ChatChannels
            .AsNoTracking()
            .Where(x => x.Id == channelId)
            .Select(x => new
            {
                x.Id,
                x.ChatRoomId,
                x.Type
            })
            .FirstOrDefaultAsync();

        if (channel == null || channel.Type != ChatChannelType.Voice) throw new HubException("Voice channel not found");

        var isMember = await context.ChatRoomMembers
            .AsNoTracking()
            .AnyAsync(m => m.ChatRoomId == channel.ChatRoomId && m.UserId == user.Id);

        if (!isMember) throw new HubException("You are not a member of this chat room");

        var participant = new VoiceParticipantConnection
        {
            ConnectionId = Context.ConnectionId,
            UserId = user.Id,
            DisplayName = user.DisplayName ?? string.Empty,
            Slug = user.Slug,
            ImageUrl = user.ImageUrl,
            ChatRoomId = channel.ChatRoomId,
            ChannelId = channel.Id
        };

        var joinResult = presenceService.JoinChannel(channel.Id, participant);

        await Groups.AddToGroupAsync(Context.ConnectionId, GetGroupName(channel.Id));

        await Clients.OthersInGroup(GetGroupName(channel.Id)).SendAsync(
            "PeerJoined",
            new VoicePeerUpdateDto
            {
                ChannelId = channel.Id,
                Participant = MapParticipant(joinResult.Participant)
            });

        await NotifyChannelPresenceChanged(channel.ChatRoomId, channel.Id);

        return new VoiceChannelJoinResponseDto
        {
            ChannelId = channel.Id,
            SelfConnectionId = Context.ConnectionId,
            Participants = joinResult.Participants
                .Select(MapParticipant)
                .ToList()
        };
    }

    public async Task LeaveChannel()
    {
        var leaveResult = presenceService.LeaveChannel(Context.ConnectionId);
        if (leaveResult == null) return;

        await Groups.RemoveFromGroupAsync(Context.ConnectionId, GetGroupName(leaveResult.ChannelId));

        await Clients.Group(GetGroupName(leaveResult.ChannelId)).SendAsync(
            "PeerLeft",
            new VoicePeerUpdateDto
            {
                ChannelId = leaveResult.ChannelId,
                Participant = MapParticipant(leaveResult.Participant)
            });

        await NotifyChannelPresenceChanged(leaveResult.Participant.ChatRoomId, leaveResult.ChannelId);
    }

    public async Task SendOffer(string targetConnectionId, SessionDescriptionDto description)
    {
        var channelId = GetSharedChannelId(targetConnectionId);

        await Clients.Client(targetConnectionId).SendAsync(
            "ReceiveOffer",
            new VoiceSignalMessageDto
            {
                ChannelId = channelId,
                FromConnectionId = Context.ConnectionId,
                Description = description
            });
    }

    public async Task SendAnswer(string targetConnectionId, SessionDescriptionDto description)
    {
        var channelId = GetSharedChannelId(targetConnectionId);

        await Clients.Client(targetConnectionId).SendAsync(
            "ReceiveAnswer",
            new VoiceSignalMessageDto
            {
                ChannelId = channelId,
                FromConnectionId = Context.ConnectionId,
                Description = description
            });
    }

    public async Task SendIceCandidate(string targetConnectionId, IceCandidateDto candidate)
    {
        var channelId = GetSharedChannelId(targetConnectionId);

        await Clients.Client(targetConnectionId).SendAsync(
            "ReceiveIceCandidate",
            new VoiceIceCandidateMessageDto
            {
                ChannelId = channelId,
                FromConnectionId = Context.ConnectionId,
                Candidate = candidate
            });
    }

    public async Task UpdateMediaState(VoiceMediaStateUpdateDto state)
    {
        if (!presenceService.TryGetConnection(Context.ConnectionId, out var participant))
            throw new HubException("You are not connected to a voice channel");

        presenceService.UpdateMediaState(Context.ConnectionId, state.IsCameraEnabled, state.IsScreenSharing);

        var payload = new VoiceMediaStateDto
        {
            ConnectionId = Context.ConnectionId,
            IsCameraEnabled = state.IsCameraEnabled,
            IsScreenSharing = state.IsScreenSharing
        };

        await Clients.Group(GetGroupName(participant.ChannelId)).SendAsync(
            "PeerMediaStateChanged",
            payload
        );

        await NotifyChannelPresenceChanged(participant.ChatRoomId, participant.ChannelId);
    }

    private async Task NotifyChannelPresenceChanged(string chatRoomId, string channelId)
    {
        var participants = presenceService
            .GetParticipants(channelId)
            .Select(MapParticipant)
            .ToList();

        await Clients.Group(GetChatRoomGroupName(chatRoomId)).SendAsync(
            "ChannelPresenceUpdated",
            new VoiceChannelPresenceDto
            {
                ChannelId = channelId,
                Participants = participants
            });
    }

    private string GetSharedChannelId(string targetConnectionId)
    {
        if (!presenceService.TryGetConnection(Context.ConnectionId, out var source))
            throw new HubException("You are not connected to a voice channel");

        if (!presenceService.TryGetConnection(targetConnectionId, out var target))
            throw new HubException("Target user is not connected");

        if (!string.Equals(source.ChannelId, target.ChannelId, StringComparison.Ordinal))
            throw new HubException("Target user is not connected to the same channel");

        return source.ChannelId;
    }

    private static string GetGroupName(string channelId)
    {
        return $"voice-channel-{channelId}";
    }

    private static string GetChatRoomGroupName(string chatRoomId)
    {
        return $"voice-chatroom-{chatRoomId}";
    }

    private static VoiceParticipantDto MapParticipant(VoiceParticipantConnection participant)
    {
        return new VoiceParticipantDto
        {
            ConnectionId = participant.ConnectionId,
            UserId = participant.UserId,
            DisplayName = participant.DisplayName,
            Slug = participant.Slug,
            ImageUrl = participant.ImageUrl,
            IsCameraEnabled = participant.IsCameraEnabled,
            IsScreenSharing = participant.IsScreenSharing
        };
    }
}