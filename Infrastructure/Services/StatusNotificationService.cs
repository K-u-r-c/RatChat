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
    public async Task NotifyFriendsStatusChange(string userId, UserStatus status, string? customMessage = null)
    {
        var friendsQuery1 = context.UserFriends
            .Where(uf => uf.FriendId == userId)
            .Select(uf => uf.UserId);

        var friendsQuery2 = context.UserFriends
            .Where(uf => uf.UserId == userId)
            .Select(uf => uf.FriendId);

        var allFriends = await friendsQuery1.Union(friendsQuery2).Distinct().ToListAsync();

        var statusData = new
        {
            UserId = userId,
            Status = status.ToString(),
            CustomMessage = customMessage,
            Timestamp = DateTime.UtcNow
        };

        Console.WriteLine($"Notifying {allFriends.Count} friends about status change for user {userId} to {status}");

        foreach (var friendId in allFriends)
        {
            Console.WriteLine($"Sending status update to friend {friendId}");
            await hubContext.Clients.Group($"user-{friendId}")
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