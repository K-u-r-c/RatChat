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
        var friends = await context.UserFriends
            .Where(uf => uf.FriendId == userId)
            .Select(uf => uf.UserId)
            .ToListAsync();

        var statusData = new
        {
            UserId = userId,
            Status = status.ToString(),
            CustomMessage = customMessage,
            Timestamp = DateTime.UtcNow
        };

        foreach (var friendId in friends)
        {
            await hubContext.Clients.Group($"user-{friendId}")
                .SendAsync("UserStatusChanged", statusData);
        }
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