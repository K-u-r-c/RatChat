using System.Collections.Concurrent;
using Application.Interfaces;
using Domain.Enums;
using Domain.Extensions;
using Microsoft.EntityFrameworkCore;
using Persistance;

namespace Infrastructure.Services;

public class UserStatusService(AppDbContext context, IStatusNotificationService statusNotificationService)
    : IUserStatusService
{
    private static readonly ConcurrentDictionary<string, ConcurrentDictionary<string, byte>> _userConnections
        = new();

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

        var connections
            = _userConnections.GetOrAdd(userId, _ => new ConcurrentDictionary<string, byte>());

        bool isFirstConnection;
        lock (connections)
        {
            isFirstConnection = connections.IsEmpty;
            connections.TryAdd(connectionId, 0);
        }

        await transaction.CommitAsync();

        if (notifyStatusChange)
        {
            await statusNotificationService.NotifyFriendsStatusChange(userId, newStatus);
        }

        if (isFirstConnection)
        {
            await statusNotificationService.NotifyUserOnline(userId);
        }
    }

    public async Task SetUserOfflineAsync(string userId, string connectionId)
    {
        bool isLastConnection = false;
        bool shouldNotify = false;

        if (_userConnections.TryGetValue(userId, out var connections))
        {
            lock (connections)
            {
                connections.TryRemove(connectionId, out _);
                if (connections.IsEmpty)
                {
                    isLastConnection = true;
                    _userConnections.TryRemove(userId, out _);
                }
            }
        }

        if (isLastConnection)
        {
            await using var transaction = await context.Database.BeginTransactionAsync();

            var user = await context.Users.FindAsync(userId);
            if (user != null && user.Status != UserStatus.Invisible)
            {
                user.Status = UserStatus.Offline;
                user.LastSeen = DateTime.UtcNow;
                await context.SaveChangesAsync();
                shouldNotify = true;
            }

            await transaction.CommitAsync();

            if (shouldNotify)
            {
                await statusNotificationService.NotifyFriendsStatusChange(
                    userId,
                    UserStatus.Offline);
            }
        }
    }

    public Task<List<string>> GetOnlineUsersAsync(List<string> userIds)
    {
        var onlineUsers = userIds.Where(IsUserConnected).ToList();
        return Task.FromResult(onlineUsers);
    }

    public async Task<UserStatus> GetActualUserStatusAsync(string userId)
    {
        if (!IsUserConnected(userId))
            return UserStatus.Offline;

        var user = await context.Users.FindAsync(userId);
        return user?.Status ?? UserStatus.Offline;
    }

    public Task<bool> IsUserOnlineAsync(string userId)
    {
        return Task.FromResult(IsUserConnected(userId));
    }

    public async Task<Dictionary<string, (UserStatus Status, bool IsOnline, DateTime LastSeen)>> GetActualStatusesAsync(
        IEnumerable<string> userIds)
    {
        var ids = userIds.Distinct().ToList();
        var onlineSet = ids.Where(IsUserConnected).ToHashSet();

        var users = await context.Users
            .Where(u => ids.Contains(u.Id))
            .Select(u => new { u.Id, u.Status, u.LastSeen })
            .ToListAsync();

        var map = new Dictionary<string, (UserStatus, bool, DateTime)>();
        foreach (var u in users)
        {
            var status = onlineSet.Contains(u.Id) ? u.Status : UserStatus.Offline;
            map[u.Id] = (status, onlineSet.Contains(u.Id) && status.IsConsideredOnline(), u.LastSeen);
        }
        // Any missing users treated as offline (optional)
        return map;
    }

    private static bool IsUserConnected(string userId)
    {
        return _userConnections.TryGetValue(
            userId,
            out var connections
        ) && !connections.IsEmpty;
    }
}