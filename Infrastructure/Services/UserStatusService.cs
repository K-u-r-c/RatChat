using Application.Interfaces;
using Domain.Enums;
using Microsoft.EntityFrameworkCore;
using Persistance;

namespace Infrastructure.Services;

public class UserStatusService(AppDbContext context, IStatusNotificationService statusNotificationService)
    : IUserStatusService
{
    private static readonly Dictionary<string, HashSet<string>> _userConnections = [];
    private static readonly Lock _lock = new();

    public async Task SetUserOnlineAsync(string userId, string connectionId)
    {
        bool notifyStatusChange = false;
        UserStatus newStatus = UserStatus.Online;

        await using var transaction = await context.Database.BeginTransactionAsync();

        var user = await context.Users.FindAsync(userId);
        if (user != null && user.Status != UserStatus.Invisible)
        {
            if (user.Status == UserStatus.Offline)
            {
                user.Status = UserStatus.Online;
                notifyStatusChange = true;
            }
            user.LastSeen = DateTime.UtcNow;
            await context.SaveChangesAsync();
            newStatus = user.Status;
        }

        var isFirstConnection = false;
        lock (_userConnections)
        {
            if (!_userConnections.ContainsKey(userId))
            {
                _userConnections[userId] = [];
                isFirstConnection = true;
            }
            _userConnections[userId].Add(connectionId);
        }

        await transaction.CommitAsync();

        if ((notifyStatusChange || isFirstConnection) && user != null && user.Status != UserStatus.Invisible)
        {
            await statusNotificationService.NotifyFriendsStatusChange(userId, newStatus);
        }
    }

    public async Task SetUserOfflineAsync(string userId, string connectionId)
    {
        bool isLastConnection = false;

        lock (_lock)
        {
            if (_userConnections.ContainsKey(userId))
            {
                _userConnections[userId].Remove(connectionId);
                if (!_userConnections[userId].Any())
                {
                    _userConnections.Remove(userId);
                    isLastConnection = true;
                }
            }
        }

        if (isLastConnection)
        {
            var user = await context.Users.FindAsync(userId);
            if (user != null && user.Status != UserStatus.Invisible)
            {
                var previousStatus = user.Status;
                user.Status = UserStatus.Offline;
                user.LastSeen = DateTime.UtcNow;
                await context.SaveChangesAsync();

                await statusNotificationService.NotifyFriendsStatusChange(
                    userId,
                    UserStatus.Offline);
            }
        }
    }

    public async Task<List<string>> GetOnlineUsersAsync(List<string> userIds)
    {
        var onlineUsers = new List<string>();

        foreach (var userId in userIds)
        {
            var isConnected = IsUserConnected(userId);
            if (isConnected)
            {
                var status = await GetActualUserStatusAsync(userId);
                if (status == UserStatus.Online || status == UserStatus.Away || status == UserStatus.DoNotDisturb)
                {
                    onlineUsers.Add(userId);
                }
            }
        }

        return onlineUsers;
    }

    public async Task<UserStatus> GetActualUserStatusAsync(string userId)
    {
        var user = await context.Users
            .AsNoTracking()
            .FirstOrDefaultAsync(u => u.Id == userId);

        if (user == null) return UserStatus.Offline;

        var isConnected = IsUserConnected(userId);

        if (!isConnected)
        {
            return UserStatus.Offline;
        }

        if (user.Status == UserStatus.Offline && isConnected)
        {
            return UserStatus.Online;
        }

        return user.Status;
    }

    public Task<bool> IsUserOnlineAsync(string userId)
    {
        var isConnected = IsUserConnected(userId);
        return Task.FromResult(isConnected);
    }

    private static bool IsUserConnected(string userId)
    {
        lock (_lock)
        {
            return _userConnections.ContainsKey(userId) && _userConnections[userId].Count > 0;
        }
    }
}