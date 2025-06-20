using Application.Interfaces;
using Domain.Enums;
using Infrastructure.SignalR;
using Microsoft.AspNetCore.SignalR;
using Microsoft.EntityFrameworkCore;
using Persistance;

namespace Infrastructure.Services;

public class StatusNotificationService(IHubContext<StatusHub> hubContext, AppDbContext context)
    : IStatusNotificationService
{
    public async Task NotifyFriendsStatusChange(string userId, UserStatus status)
    {
        var friendsQuery1 = context.UserFriends
            .Where(uf => uf.FriendId == userId)
            .Select(uf => uf.UserId);

        var friendsQuery2 = context.UserFriends
            .Where(uf => uf.UserId == userId)
            .Select(uf => uf.FriendId);

        var friendIds = friendsQuery1.Union(friendsQuery2);

        var memberIdsInSharedRooms = context.ChatRoomMembers
            .Where(m => m.UserId == userId)
            .Select(m => m.ChatRoomId)
            .SelectMany(roomId => context.ChatRoomMembers
                .Where(m2 => m2.ChatRoomId == roomId && m2.UserId != userId)
                .Select(m2 => m2.UserId));

        var recipientIds = await friendIds
            .Union(memberIdsInSharedRooms)
            .Distinct()
            .ToListAsync();

        var statusData = new
        {
            UserId = userId,
            Status = status.ToString(),
            Timestamp = DateTime.UtcNow
        };

        foreach (var recipientId in recipientIds)
        {
            await hubContext.Clients.Group($"user-{recipientId}")
                .SendAsync("UserStatusChanged", statusData);
        }

        await hubContext.Clients.Group($"user-{userId}")
            .SendAsync("UserStatusChanged", statusData);
    }

    public async Task NotifyUserOnline(string userId)
    {
        await NotifyFriendsStatusChange(userId, UserStatus.Online);
    }

    public async Task NotifyUserOffline(string userId)
    {
        await NotifyFriendsStatusChange(userId, UserStatus.Offline);
    }
}